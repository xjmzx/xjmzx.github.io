
import { useState, useEffect, useCallback } from 'react';
import { SimplePool, Event, nip19 } from 'nostr-tools';

interface NostrEvent {
  id: string;
  pubkey: string;
  created_at: number;
  kind: number;
  content: string;
  tags: string[][];
}

interface RelayStatus {
  url: string;
  connected: boolean;
  error?: string;
}

export const useNostr = (relays: string[], pubkey: string) => {
  const [posts, setPosts] = useState<NostrEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [relayStatuses, setRelayStatuses] = useState<RelayStatus[]>([]);
  const [pool] = useState(() => new SimplePool());

  const updateRelayStatus = useCallback((url: string, connected: boolean, error?: string) => {
    setRelayStatuses(prev => {
      const existing = prev.find(r => r.url === url);
      if (existing) {
        return prev.map(r => r.url === url ? { ...r, connected, error } : r);
      }
      return [...prev, { url, connected, error }];
    });
  }, []);

  const fetchPosts = useCallback(async () => {
    if (!pubkey || relays.length === 0) return;

    setLoading(true);
    setPosts([]);
    
    try {
      // Convert npub to hex if needed
      let hexPubkey = pubkey;
      if (pubkey.startsWith('npub')) {
        const decoded = nip19.decode(pubkey);
        if (decoded.type === 'npub') {
          hexPubkey = decoded.data;
        }
      }

      // Initialize relay statuses
      setRelayStatuses(relays.map(url => ({ url, connected: false })));

      // Set up relay connections with proper async handling
      const relayPromises = relays.map(async (relayUrl) => {
        try {
          const relay = await pool.ensureRelay(relayUrl);
          
          relay.on('connect', () => {
            console.log(`Connected to ${relayUrl}`);
            updateRelayStatus(relayUrl, true);
          });
          
          relay.on('error', (error: any) => {
            console.error(`Error connecting to ${relayUrl}:`, error);
            updateRelayStatus(relayUrl, false, error.message);
          });
          
          relay.on('disconnect', () => {
            console.log(`Disconnected from ${relayUrl}`);
            updateRelayStatus(relayUrl, false);
          });
        } catch (error) {
          console.error(`Failed to connect to ${relayUrl}:`, error);
          updateRelayStatus(relayUrl, false, error instanceof Error ? error.message : 'Connection failed');
        }
      });

      // Wait for all relay connections to be attempted
      await Promise.allSettled(relayPromises);

      // Fetch posts (kind 1 events)
      const events = await pool.querySync(relays, {
        kinds: [1],
        authors: [hexPubkey],
        limit: 20
      });

      const sortedEvents = events
        .sort((a, b) => b.created_at - a.created_at)
        .map(event => ({
          id: event.id,
          pubkey: event.pubkey,
          created_at: event.created_at * 1000, // Convert to milliseconds
          kind: event.kind,
          content: event.content,
          tags: event.tags
        }));

      setPosts(sortedEvents);
    } catch (error) {
      console.error('Error fetching Nostr posts:', error);
    } finally {
      setLoading(false);
    }
  }, [pubkey, relays, pool, updateRelayStatus]);

  useEffect(() => {
    fetchPosts();
    
    return () => {
      pool.close(relays);
    };
  }, [fetchPosts, pool, relays]);

  const refresh = () => {
    fetchPosts();
  };

  return {
    posts,
    loading,
    relayStatuses,
    refresh,
    connectedRelays: relayStatuses.filter(r => r.connected).length
  };
};
