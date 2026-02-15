import { useMemo } from 'react';
import type { NostrEvent } from '@nostrify/nostrify';

export interface KeywordConfig {
  id: string;
  label: string;
  hashtags: string[];
  keywords: string[];
  enabled: boolean;
}

export const DEFAULT_KEYWORDS: KeywordConfig[] = [
  {
    id: 'news',
    label: 'News',
    hashtags: ['news', 'breaking', 'breaking news', 'updates'],
    keywords: ['news', 'breaking', 'announced', 'announcement', 'report'],
    enabled: true,
  },
  {
    id: 'crypto',
    label: 'Crypto',
    hashtags: ['crypto', 'cryptocurrency', 'bitcoin', 'ethereum', 'defi', 'blockchain'],
    keywords: ['crypto', 'cryptocurrency', 'bitcoin', 'ethereum', 'btc', 'eth', 'defi', 'blockchain', 'web3'],
    enabled: true,
  },
  {
    id: 'ai',
    label: 'AI',
    hashtags: ['ai', 'artificialintelligence', 'ml', 'machinelearning', 'deeplearning', 'chatgpt', 'gpt'],
    keywords: ['ai', 'artificial intelligence', 'machine learning', 'ml', 'chatgpt', 'gpt', 'llm', 'neural', 'openai'],
    enabled: true,
  },
  {
    id: 'tech',
    label: 'Tech',
    hashtags: ['tech', 'technology', 'software', 'hardware', 'startup', 'innovation'],
    keywords: ['tech', 'technology', 'software', 'hardware', 'startup', 'innovation', 'developer', 'coding'],
    enabled: true,
  },
];

export interface KeywordMatch {
  keyword: KeywordConfig;
  events: NostrEvent[];
  count: number;
  relayStats: Record<string, number>;
}

/**
 * Match events against keyword configurations
 */
export function useKeywordMatching(
  events: NostrEvent[] | undefined,
  keywordConfigs: KeywordConfig[]
): KeywordMatch[] {
  return useMemo(() => {
    if (!events || events.length === 0) return [];

    const matches: KeywordMatch[] = [];

    keywordConfigs.forEach((config) => {
      if (!config.enabled) return;

      const matchedEvents = events.filter((event) => {
        // Check hashtags
        const eventHashtags = event.tags
          .filter(([name]) => name === 't')
          .map(([, value]) => value.toLowerCase());

        const hasHashtagMatch = config.hashtags.some((tag) =>
          eventHashtags.includes(tag.toLowerCase())
        );

        // Check keywords in content
        const contentLower = event.content.toLowerCase();
        const hasKeywordMatch = config.keywords.some((keyword) =>
          contentLower.includes(keyword.toLowerCase())
        );

        return hasHashtagMatch || hasKeywordMatch;
      });

      // Calculate relay stats - count which relay each event came from
      const relayStats: Record<string, number> = {};
      
      matchedEvents.forEach((event) => {
        // Check if event has relay hint in tags
        const relayTags = event.tags.filter(([name]) => name === 'relay');
        if (relayTags.length > 0) {
          relayTags.forEach(([, url]) => {
            relayStats[url] = (relayStats[url] || 0) + 1;
          });
        } else {
          // If no relay tag, mark as unknown
          relayStats['unknown'] = (relayStats['unknown'] || 0) + 1;
        }
      });

      if (matchedEvents.length > 0) {
        matches.push({
          keyword: config,
          events: matchedEvents,
          count: matchedEvents.length,
          relayStats,
        });
      }
    });

    return matches.sort((a, b) => b.count - a.count);
  }, [events, keywordConfigs]);
}

/**
 * Get overall relay statistics from all events
 */
export function useRelayStats(events: NostrEvent[] | undefined): Record<string, number> {
  return useMemo(() => {
    if (!events || events.length === 0) return {};

    const stats: Record<string, number> = {};

    events.forEach((event) => {
      const relayTags = event.tags.filter(([name]) => name === 'relay');
      if (relayTags.length > 0) {
        relayTags.forEach(([, url]) => {
          stats[url] = (stats[url] || 0) + 1;
        });
      } else {
        stats['unknown'] = (stats['unknown'] || 0) + 1;
      }
    });

    return stats;
  }, [events]);
}
