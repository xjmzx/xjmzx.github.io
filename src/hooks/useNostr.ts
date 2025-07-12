
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

  const testRelayConnection = async (relayUrl: string): Promise<boolean> => {
    try {
      // Try to get relay connection
      const relay = await pool.ensureRelay(relayUrl);
      console.log(`Successfully connected to ${relayUrl}`);
      return true;
    } catch (error) {
      console.error(`Failed to connect to ${relayUrl}:`, error);
      return false;
    }
  };

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

      // Test relay connections
      const connectionPromises = relays.map(async (relayUrl) => {
        const isConnected = await testRelayConnection(relayUrl);
        updateRelayStatus(relayUrl, isConnected, isConnected ? undefined : 'Connection failed');
        return { url: relayUrl, connected: isConnected };
      });

      // Wait for all connection attempts
      const connectionResults = await Promise.allSettled(connectionPromises);
      
      // Get list of working relays
      const workingRelays = connectionResults
        .filter((result): result is PromiseFulfilledResult<{url: string, connected: boolean}> => 
          result.status === 'fulfilled' && result.value.connected)
        .map(result => result.value.url);

      if (workingRelays.length === 0) {
        console.log('No working relays found');
        return;
      }

      console.log(`Fetching posts from ${workingRelays.length} working relays`);

      // Fetch posts (kind 1 events) from working relays only
      const events = await pool.querySync(workingRelays, {
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
      console.log(`Fetched ${sortedEvents.length} posts`);
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
