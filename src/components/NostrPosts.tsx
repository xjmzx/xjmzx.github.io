
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { NostrPost } from "@/components/NostrPost";
import { RefreshCw, Wifi } from "lucide-react";

interface NostrEvent {
  id: string;
  pubkey: string;
  created_at: number;
  kind: number;
  content: string;
  tags: string[][];
}

const NOSTR_RELAYS = [
  'wss://relay.damus.io',
  'wss://nostr-pub.wellorder.net',
  'wss://relay.current.fyi'
];

export const NostrPosts = () => {
  const [posts, setPosts] = useState<NostrEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectedRelays, setConnectedRelays] = useState<string[]>([]);

  const connectToRelays = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Mock data for demonstration since WebSocket connections to Nostr relays
      // would require more complex implementation
      const mockPosts: NostrEvent[] = [
        {
          id: '1',
          pubkey: 'npub1234567890abcdef',
          created_at: Date.now() - 300000,
          kind: 1,
          content: 'Just set up my Lightning node! ⚡ The future of payments is here. #Bitcoin #Lightning',
          tags: [['t', 'bitcoin'], ['t', 'lightning']]
        },
        {
          id: '2',
          pubkey: 'npub0987654321fedcba',
          created_at: Date.now() - 600000,
          kind: 1,
          content: 'Nostr is revolutionizing social media. Decentralized, censorship-resistant, and user-controlled. This is the way! 🚀',
          tags: [['t', 'nostr'], ['t', 'decentralization']]
        },
        {
          id: '3',
          pubkey: 'npub1111222233334444',
          created_at: Date.now() - 900000,
          kind: 1,
          content: 'Block height just hit a new milestone! The Bitcoin network continues to grow stronger every day. 💪 #BitcoinNetwork',
          tags: [['t', 'bitcoin'], ['t', 'blockchain']]
        },
        {
          id: '4',
          pubkey: 'npub5555666677778888',
          created_at: Date.now() - 1200000,
          kind: 1,
          content: 'Learning about cryptographic signatures and how they secure our digital communications. Mind blown! 🤯 #Cryptography',
          tags: [['t', 'cryptography'], ['t', 'security']]
        }
      ];

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setPosts(mockPosts);
      setConnectedRelays(['relay.damus.io', 'relay.current.fyi']);
    } catch (err) {
      setError('Failed to connect to Nostr relays');
      console.error('Error connecting to relays:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    connectToRelays();
  }, []);

  const handleRefresh = () => {
    connectToRelays();
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with refresh and connection status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Wifi className="h-4 w-4" />
          <span>Connected to {connectedRelays.length} relays</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={loading}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Posts */}
      {error ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <NostrPost key={post.id} event={post} />
          ))}
        </div>
      )}
    </div>
  );
};
