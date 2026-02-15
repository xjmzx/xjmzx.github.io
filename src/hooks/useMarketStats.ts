import { useMemo } from 'react';
import type { MarketEventWithReactions, MarketAsset } from './useMarketEvents';

export interface AssetStats {
  asset: MarketAsset;
  eventCount: number;
  totalReactions: number;
  avgSentiment: number;
  positiveReactions: number;
  negativeReactions: number;
  neutralReactions: number;
  recentActivity: number; // Events in last hour
}

export interface MarketStats {
  totalEvents: number;
  totalReactions: number;
  overallSentiment: number;
  assetStats: AssetStats[];
  topAssets: AssetStats[];
  trendingHashtags: Array<{ tag: string; count: number }>;
}

/**
 * Calculate comprehensive market statistics from events
 */
export function useMarketStats(events?: MarketEventWithReactions[]): MarketStats {
  return useMemo(() => {
    if (!events || events.length === 0) {
      return {
        totalEvents: 0,
        totalReactions: 0,
        overallSentiment: 0,
        assetStats: [],
        topAssets: [],
        trendingHashtags: [],
      };
    }

    // Calculate overall stats
    const totalEvents = events.length;
    const totalReactions = events.reduce((sum, e) => sum + e.reactions.total, 0);
    const avgSentiment = events.reduce((sum, e) => sum + e.reactions.sentiment, 0) / events.length;

    // Group events by asset
    const assetEventMap = new Map<string, MarketEventWithReactions[]>();
    
    events.forEach(event => {
      if (event.asset) {
        const existing = assetEventMap.get(event.asset.id) || [];
        assetEventMap.set(event.asset.id, [...existing, event]);
      }
    });

    // Calculate per-asset statistics
    const oneHourAgo = Math.floor(Date.now() / 1000) - 3600;
    
    const assetStats: AssetStats[] = Array.from(assetEventMap.entries()).map(([assetId, assetEvents]) => {
      const asset = assetEvents[0].asset!;
      const totalAssetReactions = assetEvents.reduce((sum, e) => sum + e.reactions.total, 0);
      const totalPositive = assetEvents.reduce((sum, e) => sum + e.reactions.positive, 0);
      const totalNegative = assetEvents.reduce((sum, e) => sum + e.reactions.negative, 0);
      const totalNeutral = assetEvents.reduce((sum, e) => sum + e.reactions.neutral, 0);
      const avgAssetSentiment = assetEvents.reduce((sum, e) => sum + e.reactions.sentiment, 0) / assetEvents.length;
      const recentActivity = assetEvents.filter(e => e.created_at > oneHourAgo).length;

      return {
        asset,
        eventCount: assetEvents.length,
        totalReactions: totalAssetReactions,
        avgSentiment: avgAssetSentiment,
        positiveReactions: totalPositive,
        negativeReactions: totalNegative,
        neutralReactions: totalNeutral,
        recentActivity,
      };
    });

    // Sort by total reactions to find top assets
    const topAssets = [...assetStats]
      .sort((a, b) => b.totalReactions - a.totalReactions)
      .slice(0, 10);

    // Calculate trending hashtags
    const hashtagCounts = new Map<string, number>();
    
    events.forEach(event => {
      const tags = event.tags.filter(([name]) => name === 't');
      tags.forEach(([, value]) => {
        const tag = value.toLowerCase();
        hashtagCounts.set(tag, (hashtagCounts.get(tag) || 0) + 1);
      });
    });

    const trendingHashtags = Array.from(hashtagCounts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    return {
      totalEvents,
      totalReactions,
      overallSentiment: avgSentiment,
      assetStats,
      topAssets,
      trendingHashtags,
    };
  }, [events]);
}

/**
 * Get sentiment label from sentiment score
 */
export function getSentimentLabel(sentiment: number): string {
  if (sentiment > 0.3) return 'Bullish';
  if (sentiment > 0.1) return 'Slightly Bullish';
  if (sentiment < -0.3) return 'Bearish';
  if (sentiment < -0.1) return 'Slightly Bearish';
  return 'Neutral';
}

/**
 * Get sentiment color class
 */
export function getSentimentColor(sentiment: number): string {
  if (sentiment > 0.3) return 'text-green-600 dark:text-green-400';
  if (sentiment > 0.1) return 'text-green-500 dark:text-green-300';
  if (sentiment < -0.3) return 'text-red-600 dark:text-red-400';
  if (sentiment < -0.1) return 'text-red-500 dark:text-red-300';
  return 'text-gray-600 dark:text-gray-400';
}

/**
 * Get sentiment background color class
 */
export function getSentimentBgColor(sentiment: number): string {
  if (sentiment > 0.3) return 'bg-green-100 dark:bg-green-900/30';
  if (sentiment > 0.1) return 'bg-green-50 dark:bg-green-900/20';
  if (sentiment < -0.3) return 'bg-red-100 dark:bg-red-900/30';
  if (sentiment < -0.1) return 'bg-red-50 dark:bg-red-900/20';
  return 'bg-gray-100 dark:bg-gray-800';
}
