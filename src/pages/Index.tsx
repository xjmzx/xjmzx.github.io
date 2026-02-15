import { useSeoMeta } from '@unhead/react';
import { useState } from 'react';
import { TrendingUp, Activity, BarChart3, Filter, Search, RefreshCw, Settings as SettingsIcon, Radio, Hash, Plus, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMarketEventsWithReactions, MARKET_ASSETS } from '@/hooks/useMarketEvents';
import { useMarketStats, getSentimentLabel, getSentimentColor, getSentimentBgColor } from '@/hooks/useMarketStats';
import { useKeywordMatching, useRelayStats, DEFAULT_KEYWORDS, type KeywordConfig } from '@/hooks/useKeywordMatching';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { LoginArea } from '@/components/auth/LoginArea';
import { NoteContent } from '@/components/NoteContent';
import { useAuthor } from '@/hooks/useAuthor';
import { genUserName } from '@/lib/genUserName';
import type { MarketEventWithReactions } from '@/hooks/useMarketEvents';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';

const Index = () => {
  useSeoMeta({
    title: 'Nostr Market Pulse - Real-time Financial Sentiment from Nostr',
    description: 'Track market sentiment across crypto, stocks, commodities, and forex using real-time data from the Nostr network.',
  });

  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [limit, setLimit] = useState(100);
  const [customHashtags, setCustomHashtags] = useState<string[]>([]);
  const [newHashtag, setNewHashtag] = useState('');
  const [keywordConfigs, setKeywordConfigs] = useState<KeywordConfig[]>(DEFAULT_KEYWORDS);

  // Get selected assets based on category
  const selectedAssets = selectedCategory === 'all' 
    ? undefined 
    : MARKET_ASSETS.filter(a => a.category === selectedCategory).map(a => a.id);

  const { data: events, isLoading, refetch, isFetching } = useMarketEventsWithReactions(selectedAssets, limit);
  const stats = useMarketStats(events);
  const keywordMatches = useKeywordMatching(events, keywordConfigs);
  const relayStats = useRelayStats(events);

  // Filter events by search query
  const filteredEvents = events?.filter(event => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      event.content.toLowerCase().includes(query) ||
      event.asset?.name.toLowerCase().includes(query) ||
      event.asset?.symbol.toLowerCase().includes(query)
    );
  });

  const addCustomHashtag = () => {
    if (newHashtag && !customHashtags.includes(newHashtag.toLowerCase())) {
      const hashtag = newHashtag.toLowerCase().replace(/^#/, '');
      setCustomHashtags([...customHashtags, hashtag]);
      
      // Add to keyword configs
      const customConfig: KeywordConfig = {
        id: `custom-${hashtag}`,
        label: `#${hashtag}`,
        hashtags: [hashtag],
        keywords: [hashtag],
        enabled: true,
      };
      setKeywordConfigs([...keywordConfigs, customConfig]);
      setNewHashtag('');
    }
  };

  const removeCustomHashtag = (hashtag: string) => {
    setCustomHashtags(customHashtags.filter(h => h !== hashtag));
    setKeywordConfigs(keywordConfigs.filter(k => k.id !== `custom-${hashtag}`));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-950">
      {/* Header */}
      <header className="border-b border-slate-200/50 dark:border-slate-800/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Nostr Market Pulse
                </h1>
                <p className="text-sm text-muted-foreground">Real-time sentiment from the network</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/settings')}
                className="gap-2"
              >
                <SettingsIcon className="h-4 w-4" />
                Settings
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isFetching}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <LoginArea className="max-w-60" />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-0 shadow-lg bg-white/90 dark:bg-slate-900/90 backdrop-blur">
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Total Events
              </CardDescription>
              <CardTitle className="text-3xl">{stats.totalEvents.toLocaleString()}</CardTitle>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg bg-white/90 dark:bg-slate-900/90 backdrop-blur">
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Total Reactions
              </CardDescription>
              <CardTitle className="text-3xl">{stats.totalReactions.toLocaleString()}</CardTitle>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg bg-white/90 dark:bg-slate-900/90 backdrop-blur">
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Market Sentiment
              </CardDescription>
              <CardTitle className={`text-3xl ${getSentimentColor(stats.overallSentiment)}`}>
                {getSentimentLabel(stats.overallSentiment)}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg bg-white/90 dark:bg-slate-900/90 backdrop-blur">
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Tracked Assets
              </CardDescription>
              <CardTitle className="text-3xl">{stats.assetStats.length}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Custom Hashtags */}
        <Card className="border-0 shadow-lg bg-white/90 dark:bg-slate-900/90 backdrop-blur mb-8">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Hash className="h-5 w-5" />
              <CardTitle>Custom Hashtags</CardTitle>
            </div>
            <CardDescription>Add custom hashtags to track specific topics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              <Input
                placeholder="Enter hashtag (e.g., nostr, freedom)"
                value={newHashtag}
                onChange={(e) => setNewHashtag(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addCustomHashtag()}
                className="flex-1"
              />
              <Button onClick={addCustomHashtag} disabled={!newHashtag}>
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
            {customHashtags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {customHashtags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-2">
                    #{tag}
                    <button
                      onClick={() => removeCustomHashtag(tag)}
                      className="hover:text-destructive transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search events, assets, or symbols..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white dark:bg-slate-900"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full md:w-[200px] bg-white dark:bg-slate-900">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="crypto">Cryptocurrency</SelectItem>
              <SelectItem value="stocks">Stocks</SelectItem>
              <SelectItem value="commodities">Commodities</SelectItem>
              <SelectItem value="forex">Forex</SelectItem>
              <SelectItem value="corporate">Corporate News</SelectItem>
            </SelectContent>
          </Select>
          <Select value={limit.toString()} onValueChange={(v) => setLimit(Number(v))}>
            <SelectTrigger className="w-full md:w-[150px] bg-white dark:bg-slate-900">
              <SelectValue placeholder="Limit" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="50">50 Events</SelectItem>
              <SelectItem value="100">100 Events</SelectItem>
              <SelectItem value="200">200 Events</SelectItem>
              <SelectItem value="500">500 Events</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="feed" className="space-y-6">
          <TabsList className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <TabsTrigger value="feed">Live Feed</TabsTrigger>
            <TabsTrigger value="assets">Asset Analysis</TabsTrigger>
            <TabsTrigger value="keywords">Keyword Matches</TabsTrigger>
            <TabsTrigger value="relays">Relay Stats</TabsTrigger>
            <TabsTrigger value="trending">Trending</TabsTrigger>
          </TabsList>

          {/* Live Feed */}
          <TabsContent value="feed" className="space-y-4">
            {isLoading ? (
              <LoadingState />
            ) : filteredEvents && filteredEvents.length > 0 ? (
              <div className="grid gap-4">
                {filteredEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            ) : (
              <EmptyState />
            )}
          </TabsContent>

          {/* Asset Analysis */}
          <TabsContent value="assets" className="space-y-4">
            {isLoading ? (
              <LoadingState />
            ) : (
              <div className="grid gap-4">
                {stats.assetStats
                  .sort((a, b) => b.totalReactions - a.totalReactions)
                  .map((assetStat) => (
                    <Card key={assetStat.asset.id} className="border-0 shadow-lg bg-white/90 dark:bg-slate-900/90 backdrop-blur">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-xl">{assetStat.asset.name}</CardTitle>
                            <CardDescription>{assetStat.asset.symbol}</CardDescription>
                          </div>
                          <Badge variant="secondary" className={getSentimentBgColor(assetStat.avgSentiment)}>
                            <span className={getSentimentColor(assetStat.avgSentiment)}>
                              {getSentimentLabel(assetStat.avgSentiment)}
                            </span>
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                          <div>
                            <div className="text-sm text-muted-foreground">Events</div>
                            <div className="text-2xl font-bold">{assetStat.eventCount}</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Reactions</div>
                            <div className="text-2xl font-bold">{assetStat.totalReactions}</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Positive</div>
                            <div className="text-2xl font-bold text-green-600">{assetStat.positiveReactions}</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Negative</div>
                            <div className="text-2xl font-bold text-red-600">{assetStat.negativeReactions}</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Recent</div>
                            <div className="text-2xl font-bold text-blue-600">{assetStat.recentActivity}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            )}
          </TabsContent>

          {/* Keyword Matches */}
          <TabsContent value="keywords" className="space-y-4">
            {isLoading ? (
              <LoadingState />
            ) : (
              <div className="grid gap-4">
                {keywordMatches.map((match) => (
                  <Card key={match.keyword.id} className="border-0 shadow-lg bg-white/90 dark:bg-slate-900/90 backdrop-blur">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-xl">{match.keyword.label}</CardTitle>
                          <CardDescription>
                            {match.keyword.hashtags.map(h => `#${h}`).join(', ')}
                          </CardDescription>
                        </div>
                        <Badge variant="secondary" className="text-lg py-1 px-3">
                          {match.count} events
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="text-sm font-medium mb-2">Relay Distribution</div>
                          <div className="space-y-2">
                            {Object.entries(match.relayStats)
                              .sort(([, a], [, b]) => b - a)
                              .map(([relay, count]) => (
                                <div key={relay} className="space-y-1">
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="font-mono truncate max-w-xs">{relay}</span>
                                    <span className="text-muted-foreground">{count} events</span>
                                  </div>
                                  <Progress value={(count / match.count) * 100} className="h-1" />
                                </div>
                              ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Relay Stats */}
          <TabsContent value="relays" className="space-y-4">
            <Card className="border-0 shadow-lg bg-white/90 dark:bg-slate-900/90 backdrop-blur">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Radio className="h-5 w-5" />
                  <CardTitle>Relay Statistics</CardTitle>
                </div>
                <CardDescription>Event distribution across Nostr relays</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-2 w-full" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(relayStats)
                      .sort(([, a], [, b]) => b - a)
                      .map(([relay, count]) => (
                        <div key={relay} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Radio className="h-4 w-4 text-green-500" />
                              <span className="font-mono text-sm truncate max-w-md">{relay}</span>
                            </div>
                            <div className="text-sm font-medium">
                              {count} events ({((count / (events?.length || 1)) * 100).toFixed(1)}%)
                            </div>
                          </div>
                          <Progress value={(count / (events?.length || 1)) * 100} className="h-2" />
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Trending */}
          <TabsContent value="trending" className="space-y-4">
            <Card className="border-0 shadow-lg bg-white/90 dark:bg-slate-900/90 backdrop-blur">
              <CardHeader>
                <CardTitle>Trending Hashtags</CardTitle>
                <CardDescription>Most mentioned topics across all events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {stats.trendingHashtags.map((tag) => (
                    <Badge key={tag.tag} variant="secondary" className="text-base py-1 px-3">
                      #{tag.tag} <span className="ml-2 text-muted-foreground">({tag.count})</span>
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/50 dark:border-slate-800/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl mt-16">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>
            Powered by Nostr •{' '}
            <a href="https://shakespeare.diy" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
              Vibed with Shakespeare
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
};

function EventCard({ event }: { event: MarketEventWithReactions }) {
  const author = useAuthor(event.pubkey);
  const metadata = author.data?.metadata;
  const displayName = metadata?.name ?? genUserName(event.pubkey);
  const profileImage = metadata?.picture;

  return (
    <Card className="border-0 shadow-lg bg-white/90 dark:bg-slate-900/90 backdrop-blur hover:shadow-xl transition-all">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Avatar className="h-10 w-10">
              <AvatarImage src={profileImage} alt={displayName} />
              <AvatarFallback>{displayName[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="font-semibold truncate">{displayName}</div>
              <div className="text-sm text-muted-foreground">
                {new Date(event.created_at * 1000).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
          </div>
          {event.asset && (
            <Badge variant="outline" className="shrink-0">
              {event.asset.symbol}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="whitespace-pre-wrap break-words">
          <NoteContent event={event} className="text-sm" />
        </div>

        {/* Sentiment Bar */}
        {event.reactions.total > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{event.reactions.total} reactions</span>
              <span className={getSentimentColor(event.reactions.sentiment)}>
                {getSentimentLabel(event.reactions.sentiment)}
              </span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden flex">
              {event.reactions.positive > 0 && (
                <div 
                  className="bg-green-500 h-full" 
                  style={{ width: `${(event.reactions.positive / event.reactions.total) * 100}%` }}
                />
              )}
              {event.reactions.neutral > 0 && (
                <div 
                  className="bg-gray-400 h-full" 
                  style={{ width: `${(event.reactions.neutral / event.reactions.total) * 100}%` }}
                />
              )}
              {event.reactions.negative > 0 && (
                <div 
                  className="bg-red-500 h-full" 
                  style={{ width: `${(event.reactions.negative / event.reactions.total) * 100}%` }}
                />
              )}
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-green-600">👍 {event.reactions.positive}</span>
              <span className="text-gray-600">Neutral {event.reactions.neutral}</span>
              <span className="text-red-600">👎 {event.reactions.negative}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function LoadingState() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <Card key={i} className="border-0 shadow-lg bg-white/90 dark:bg-slate-900/90 backdrop-blur">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-3/5" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <Card className="border-dashed border-2">
      <CardContent className="py-12 px-8 text-center">
        <div className="max-w-sm mx-auto space-y-4">
          <div className="h-16 w-16 rounded-full bg-muted mx-auto flex items-center justify-center">
            <Activity className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">No market events found</h3>
            <p className="text-muted-foreground text-sm">
              Try adjusting your filters or check your relay connections. Market data should appear here once events are received.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default Index;
