
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Clock } from "lucide-react";

interface BlockData {
  height: number;
  hash: string;
  time: number;
}

export const BitcoinBlockHeight = () => {
  const [blockData, setBlockData] = useState<BlockData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBlockHeight = async () => {
      try {
        setLoading(true);
        // Using Blockchain.info API as it has good CORS support and provides block height
        const response = await fetch('https://blockchain.info/q/latesthash');
        
        if (!response.ok) {
          throw new Error('Failed to fetch block data');
        }
        
        const hash = await response.text();
        
        // Get block height
        const heightResponse = await fetch('https://blockchain.info/q/getblockcount');
        const height = await heightResponse.text();
        
        setBlockData({
          height: parseInt(height),
          hash: hash.trim(),
          time: Date.now() // Using current time as blockchain.info doesn't provide timestamp in these endpoints
        });
        setError(null);
      } catch (err) {
        setError('Failed to load block data');
        console.error('Error fetching block height:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBlockHeight();
    
    // Refresh every 10 minutes
    const interval = setInterval(fetchBlockHeight, 10 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-4">
        <p className="text-destructive text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="text-3xl font-bold text-foreground mb-1">
          {blockData?.height.toLocaleString()}
        </div>
        <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
          <TrendingUp className="h-3 w-3" />
          <span>Block Height</span>
        </div>
      </div>
      
      <Card className="bg-muted/50">
        <CardContent className="p-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs">
              <Clock className="h-3 w-3" />
              <span className="text-muted-foreground">
                {blockData && new Date(blockData.time).toLocaleString()}
              </span>
            </div>
            <div className="text-xs">
              <span className="text-muted-foreground">Hash:</span>
              <div className="font-mono text-xs mt-1 break-all">
                {blockData?.hash.substring(0, 20)}...
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
