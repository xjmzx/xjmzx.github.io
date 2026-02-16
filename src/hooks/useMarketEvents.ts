import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import type { NostrEvent } from '@nostrify/nostrify';
import { nip19 } from 'nostr-tools';
import { useFollowList } from './useFollowList';
import { useCurrentUser } from './useCurrentUser';

export interface MarketAsset {
  id: string;
  name: string;
  symbol: string;
  hashtags: string[];
  category: 'crypto' | 'stocks' | 'commodities' | 'forex' | 'corporate';
}

// Popular assets to track
export const MARKET_ASSETS: MarketAsset[] = [
  // Cryptocurrencies
  { id: 'btc', name: 'Bitcoin', symbol: 'BTC', hashtags: ['bitcoin', 'btc'], category: 'crypto' },
  { id: 'eth', name: 'Ethereum', symbol: 'ETH', hashtags: ['ethereum', 'eth'], category: 'crypto' },
  { id: 'sol', name: 'Solana', symbol: 'SOL', hashtags: ['solana', 'sol'], category: 'crypto' },
  { id: 'ada', name: 'Cardano', symbol: 'ADA', hashtags: ['cardano', 'ada'], category: 'crypto' },
  
  // Major Stocks
  { id: 'aapl', name: 'Apple', symbol: 'AAPL', hashtags: ['apple', 'aapl'], category: 'stocks' },
  { id: 'tsla', name: 'Tesla', symbol: 'TSLA', hashtags: ['tesla', 'tsla'], category: 'stocks' },
  { id: 'googl', name: 'Google', symbol: 'GOOGL', hashtags: ['google', 'googl', 'alphabet'], category: 'stocks' },
  { id: 'msft', name: 'Microsoft', symbol: 'MSFT', hashtags: ['microsoft', 'msft'], category: 'stocks' },
  { id: 'amzn', name: 'Amazon', symbol: 'AMZN', hashtags: ['amazon', 'amzn'], category: 'stocks' },
  { id: 'nvda', name: 'NVIDIA', symbol: 'NVDA', hashtags: ['nvidia', 'nvda'], category: 'stocks' },
  
  // Commodities
  { id: 'gold', name: 'Gold', symbol: 'XAU', hashtags: ['gold', 'xau'], category: 'commodities' },
  { id: 'silver', name: 'Silver', symbol: 'XAG', hashtags: ['silver', 'xag'], category: 'commodities' },
  { id: 'oil', name: 'Crude Oil', symbol: 'WTI', hashtags: ['oil', 'wti', 'crudeoil'], category: 'commodities' },
  
  // Forex
  { id: 'eurusd', name: 'EUR/USD', symbol: 'EUR/USD', hashtags: ['eurusd', 'forex', 'euro', 'dollar'], category: 'forex' },
];

// Moscow Time's pubkey (decoded from npub)
const MOSCOW_TIME_NPUB = 'npub1dww28le88e3sw8nkeqk6jdvnwey8p3qvzcuv5zh2jqp72dkgmhqsnhf7ly';
let MOSCOW_TIME_PUBKEY = '';
try {
  const decoded = nip19.decode(MOSCOW_TIME_NPUB);
  if (decoded.type === 'npub') {
    MOSCOW_TIME_PUBKEY = decoded.data;
  }
} catch {
  // If decode fails, leave empty
}

// Your npub - default to show your content if not logged in
const YOUR_NPUB = 'npub1e0f808a350rxrhppu4zylzljt3arfpvrrpqdg6ft78xy6u49kq5slf0g92';
let YOUR_PUBKEY = '';
try {
  const decoded = nip19.decode(YOUR_NPUB);
  if (decoded.type === 'npub') {
    YOUR_PUBKEY = decoded.data;
  }
} catch {
  // If decode fails, leave empty
}

// Spam filter - exclude these hashtags
const SPAM_HASHTAGS = ['defi', 'crypto', 'blockchain'];

// Required keywords whitelist - event MUST contain at least one of these
const REQUIRED_KEYWORDS = [
  'bitcoin', 'block', 'square', 'btc', 'oil', 'gas', 
  'metals', 'lightning', 'ln', 'finance', 'commodities', 
  'equities', 'global-markets', 'globalmarkets'
];

/**
 * Check if event contains spam hashtags
 */
function isSpamEvent(event: NostrEvent): boolean {
  const eventHashtags = event.tags
    .filter(([name]) => name === 't')
    .map(([, value]) => value.toLowerCase());
  
  return SPAM_HASHTAGS.some(spam => eventHashtags.includes(spam));
}

/**
 * Check if event contains at least one required keyword
 */
function hasRequiredKeyword(event: NostrEvent): boolean {
  const eventHashtags = event.tags
    .filter(([name]) => name === 't')
    .map(([, value]) => value.toLowerCase());
  
  const contentLower = event.content.toLowerCase();
  
  // Check hashtags OR content for required keywords
  return REQUIRED_KEYWORDS.some(keyword => 
    eventHashtags.includes(keyword) || contentLower.includes(keyword)
  );
}

export interface MarketEventWithReactions extends NostrEvent {
  reactions: {
    total: number;
    positive: number;
    negative: number;
    neutral: number;
    sentiment: number; // -1 to 1
  };
  asset?: MarketAsset;
}

/**
 * Hook to fetch market-related events from Nostr
 */
export function useMarketEvents(selectedAssets?: string[], limit = 50) {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { data: followList } = useFollowList();

  return useQuery({
    queryKey: ['market-events', selectedAssets, limit, user?.pubkey, followList],
    queryFn: async () => {
      const twoDaysAgo = Math.floor(Date.now() / 1000) - (2 * 24 * 60 * 60);

      // Build hashtag filters based on selected assets
      const assetsToQuery = selectedAssets && selectedAssets.length > 0
        ? MARKET_ASSETS.filter(asset => selectedAssets.includes(asset.id))
        : MARKET_ASSETS;

      // Use required keywords as query hashtags for better targeting
      // This ensures we only query events that have a chance of passing the filter
      const allHashtags = [...REQUIRED_KEYWORDS];

      // Build authors list: follow list + Moscow Time + Your pubkey
      const authors: string[] = [];
      
      // Always include Moscow Time
      if (MOSCOW_TIME_PUBKEY) {
        authors.push(MOSCOW_TIME_PUBKEY);
      }

      // If logged in, use follow list
      if (user && followList && followList.length > 0) {
        // Add all followed authors
        followList.forEach(pubkey => {
          if (!authors.includes(pubkey)) {
            authors.push(pubkey);
          }
        });
      } else {
        // Not logged in - default to YOUR pubkey
        if (YOUR_PUBKEY && !authors.includes(YOUR_PUBKEY)) {
          authors.push(YOUR_PUBKEY);
        }
      }

      // ONLY query from specific authors (no global queries)
      // This eliminates all spam from random accounts
      const events = await nostr.query([{
        kinds: [1],
        authors: authors, // CRITICAL: Only from followed authors + Moscow Time + You
        since: twoDaysAgo,
        limit: limit,
      }]);

      // Remove duplicates by event id
      const uniqueEvents = Array.from(
        new Map(events.map(e => [e.id, e])).values()
      );

      // Apply filters:
      // 1. Must NOT contain spam hashtags
      // 2. MUST contain at least one required keyword
      const filteredEvents = uniqueEvents.filter(event => 
        !isSpamEvent(event) && hasRequiredKeyword(event)
      );

      // Sort by created_at descending (newest first)
      filteredEvents.sort((a, b) => b.created_at - a.created_at);

      return filteredEvents;
    },
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
  });
}

/**
 * Hook to fetch reactions for a set of events
 */
export function useEventReactions(eventIds: string[]) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['event-reactions', eventIds],
    queryFn: async () => {
      if (eventIds.length === 0) return {};

      // Query all reactions for these events in a single request
      const reactions = await nostr.query([
        {
          kinds: [7], // Reactions
          '#e': eventIds,
          limit: 1000,
        }
      ]);

      // Group reactions by event ID
      const reactionsByEvent: Record<string, NostrEvent[]> = {};
      
      reactions.forEach(reaction => {
        const eventTag = reaction.tags.find(([name]) => name === 'e');
        if (eventTag && eventTag[1]) {
          const eventId = eventTag[1];
          if (!reactionsByEvent[eventId]) {
            reactionsByEvent[eventId] = [];
          }
          reactionsByEvent[eventId].push(reaction);
        }
      });

      return reactionsByEvent;
    },
    staleTime: 20000, // 20 seconds
    enabled: eventIds.length > 0,
  });
}

/**
 * Calculate sentiment from reactions
 */
export function calculateSentiment(reactions: NostrEvent[]): MarketEventWithReactions['reactions'] {
  let positive = 0;
  let negative = 0;
  let neutral = 0;

  reactions.forEach(reaction => {
    const content = reaction.content.trim();
    
    if (content === '+' || content === '' || content === '❤️' || content === '👍' || content === '🔥' || content === '💯' || content === '🚀') {
      positive++;
    } else if (content === '-' || content === '👎' || content === '💩') {
      negative++;
    } else {
      neutral++;
    }
  });

  const total = positive + negative + neutral;
  const sentiment = total > 0 
    ? (positive - negative) / total 
    : 0;

  return {
    total,
    positive,
    negative,
    neutral,
    sentiment,
  };
}

/**
 * Hook to combine events with their reactions
 */
export function useMarketEventsWithReactions(selectedAssets?: string[], limit = 50) {
  const eventsQuery = useMarketEvents(selectedAssets, limit);
  const eventIds = eventsQuery.data?.map(e => e.id) || [];
  const reactionsQuery = useEventReactions(eventIds);

  const data: MarketEventWithReactions[] | undefined = eventsQuery.data?.map(event => {
    const reactions = reactionsQuery.data?.[event.id] || [];
    const sentimentData = calculateSentiment(reactions);

    // Try to match event to an asset based on hashtags
    const eventHashtags = event.tags
      .filter(([name]) => name === 't')
      .map(([, value]) => value.toLowerCase());

    const matchedAsset = MARKET_ASSETS.find(asset =>
      asset.hashtags.some(tag => eventHashtags.includes(tag))
    );

    return {
      ...event,
      reactions: sentimentData,
      asset: matchedAsset,
    };
  });

  return {
    ...eventsQuery,
    data,
    reactionsLoading: reactionsQuery.isLoading,
  };
}
