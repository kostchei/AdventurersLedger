import { pb } from './pb';
import type { Campaign } from '../types';

export const campaignApi = {
  // Get all campaigns for current user
  getUserCampaigns: async (): Promise<Campaign[]> => {
    // PocketBase's list methods return a different structure, we map to our interface
    const records = await pb.collection('campaigns').getFullList({
      sort: '-created',
    });
    return records.map(mapPBCampaign);
  },

  // Get single campaign
  getCampaign: async (campaignId: string): Promise<Campaign> => {
    const record = await pb.collection('campaigns').getOne(campaignId);
    return mapPBCampaign(record);
  },

  // Create new campaign
  createCampaign: async (data: { name: string; description?: string }): Promise<Campaign> => {
    const record = await pb.collection('campaigns').create({
      ...data,
      dm: pb.authStore.model?.id,
    });
    return mapPBCampaign(record);
  },

  // Update campaign
  updateCampaign: async (
    campaignId: string,
    data: { name?: string; description?: string; activeMapId?: string }
  ): Promise<Campaign> => {
    const record = await pb.collection('campaigns').update(campaignId, data);
    return mapPBCampaign(record);
  },

  // Delete campaign
  deleteCampaign: async (campaignId: string): Promise<void> => {
    await pb.collection('campaigns').delete(campaignId);
  },
};

// Helper to map PocketBase record to our Campaign interface
const mapPBCampaign = (record: any): Campaign => {
  return {
    id: record.id,
    name: record.name,
    description: record.description,
    dmId: record.dm,
    activeMapId: record.activeMapId, // This might need expanding if we use world_state
    createdAt: record.created,
    updatedAt: record.updated,
  };
};
