import { useQuery } from '@tanstack/react-query';
import { pb } from '../lib/pb';
import type { CampaignRecord } from '../types/pocketbase';
import { buildCampaignConfig } from '../lib/campaignConfig';

export function useCampaignConfig(campaignId?: string) {
  return useQuery({
    queryKey: ['campaignConfig', campaignId],
    queryFn: async () => {
      if (!campaignId) return buildCampaignConfig(null);
      try {
        const record = await pb.collection('campaigns').getOne<CampaignRecord>(campaignId);
        return buildCampaignConfig(record);
      } catch (err) {
        console.warn('Failed to load campaign config; using defaults.', err);
        return buildCampaignConfig(null);
      }
    },
    enabled: true,
    staleTime: 30_000,
  });
}
