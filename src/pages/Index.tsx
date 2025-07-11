
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BitcoinBlockHeight } from "@/components/BitcoinBlockHeight";
import { NostrPosts } from "@/components/NostrPosts";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Zap, MessageCircle } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 relative">
          <div className="absolute top-0 right-0">
            <ThemeToggle />
          </div>
          <h1 className="text-4xl font-bold mb-2 text-foreground">Nostr Message Hub</h1>
          <p className="text-xl text-muted-foreground">Bitcoin Network & Nostr Relay Posts</p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Bitcoin Block Height Card - Takes 1 column */}
          <div className="lg:col-span-1">
            <Card className="h-fit">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-orange-500" />
                  Bitcoin Network
                </CardTitle>
                <CardDescription>
                  Current block height
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BitcoinBlockHeight />
              </CardContent>
            </Card>
          </div>

          {/* Nostr Posts - Takes 3 columns */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-purple-500" />
                  Nostr Posts
                </CardTitle>
                <CardDescription>
                  Latest posts from Nostr relays
                </CardDescription>
              </CardHeader>
              <CardContent>
                <NostrPosts />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
