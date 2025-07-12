
import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NostrPost } from "@/components/NostrPost";
import { NostrConfig } from "@/components/NostrConfig";
import { useNostr } from "@/hooks/useNostr";
import { RefreshCw, Wifi, WifiOff, AlertCircle } from "lucide-react";

const DEFAULT_RELAYS = [
  'wss://relay.damus.io',
  'wss://nostr-pub.wellorder.net',
  'wss://relay.current.fyi'
];

export const NostrPosts = () => {
  const [relays, setRelays] = useState<string[]>(DEFAULT_RELAYS);
  const [pubkey, setPubkey] = useState<string>('');
  
  const { posts, loading, relayStatuses, refresh, connectedRelays } = useNostr(relays, pubkey);

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
      {/* Header with connection status and controls */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm">
            {connectedRelays > 0 ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-500" />
            )}
            <span className="text-muted-foreground">
              Connected to {connectedRelays}/{relays.length} relays
            </span>
          </div>
          
          {/* Relay status badges */}
          <div className="flex gap-1">
            {relayStatuses.map((relay) => (
              <Badge
                key={relay.url}
                variant={relay.connected ? "default" : "destructive"}
                className="text-xs"
                title={relay.error || relay.url}
              >
                {relay.url.replace('wss://', '').split('.')[0]}
              </Badge>
            ))}
          </div>
        </div>
        
        <div className="flex gap-2">
          <NostrConfig
            relays={relays}
            onRelaysChange={setRelays}
            pubkey={pubkey}
            onPubkeyChange={setPubkey}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Content */}
      {!pubkey ? (
        <Card>
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground mb-3">
              Configure your public key to see your Nostr posts
            </p>
            <NostrConfig
              relays={relays}
              onRelaysChange={setRelays}
              pubkey={pubkey}
              onPubkeyChange={setPubkey}
            />
          </CardContent>
        </Card>
      ) : posts.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">
              No posts found. Make sure your public key is correct and you're connected to relays.
            </p>
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
