import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { useCurrentUser } from './useCurrentUser';

/**
 * Hook to fetch the user's follow list (kind 3)
 */
export function useFollowList() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();

  return useQuery({
    queryKey: ['follow-list', user?.pubkey],
    queryFn: async () => {
      if (!user) return [];

      // Query kind 3 (contact list) events
      const events = await nostr.query([
        {
          kinds: [3],
          authors: [user.pubkey],
          limit: 1,
        }
      ]);

      if (events.length === 0) return [];

      // Get the most recent follow list
      const followList = events[0];

      // Extract pubkeys from p tags
      const followedPubkeys = followList.tags
        .filter(([name]) => name === 'p')
        .map(([, pubkey]) => pubkey);

      return followedPubkeys;
    },
    enabled: !!user,
    staleTime: 300000, // 5 minutes
  });
}
