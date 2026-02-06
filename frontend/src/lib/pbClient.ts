/**
 * TS-005: PocketBase Typed Client Wrapper
 * Provides strongly-typed helper functions for PocketBase operations
 */
import { pb } from './pb';
import type {
  UserStats,
  FogOfWar,
  WorldState,
  Decal,
  CreateUserStats,
  CreateFogOfWar,
  CreateWorldState,
  CreateDecal,
  UpdateUserStats,
  UpdateWorldState,
  UpdateDecal,
} from '../types/pocketbase';
import type { RecordSubscription, UnsubscribeFunc } from 'pocketbase';

const shouldRetryWithoutCampaignFilter = (err: unknown): boolean => {
  const anyErr = err as {
    status?: number;
    data?: unknown;
    message?: unknown;
  };

  // PocketBase uses HTTP 400 for invalid filter expressions / unknown fields.
  if (anyErr?.status !== 400) return false;

  const asRecord = (v: unknown): Record<string, unknown> | null =>
    typeof v === 'object' && v !== null ? (v as Record<string, unknown>) : null;

  const data = asRecord(anyErr?.data);
  const dataMessage = typeof data?.message === 'string' ? data.message : undefined;
  const innerData = asRecord(data?.data);
  const innerMessage = typeof innerData?.message === 'string' ? innerData.message : undefined;
  const msg = String(dataMessage ?? innerMessage ?? anyErr?.message ?? '').toLowerCase();

  const dataStr = (() => {
    try {
      return JSON.stringify(anyErr?.data ?? {}).toLowerCase();
    } catch {
      return '';
    }
  })();

  const haystack = `${msg} ${dataStr}`;

  // Heuristic: schema mismatch where `campaign` doesn't exist (or filter parsing changed).
  return (
    haystack.includes('campaign') &&
    (haystack.includes('unknown') ||
      haystack.includes('missing') ||
      haystack.includes('invalid') ||
      haystack.includes('field') ||
      haystack.includes('filter'))
  );
};

/**
 * Users Stats Collection API
 */
export const userStatsApi = {
  getByUserId: async (userId: string, campaignId?: string): Promise<UserStats | null> => {
    const baseFilter = `user = "${userId}"`;

    // Prefer campaign scoping when available; fall back if the backend schema doesn't support it.
    if (campaignId) {
      try {
        const records = await pb.collection('users_stats').getList<UserStats>(1, 1, {
          filter: `${baseFilter} && campaign = "${campaignId}"`,
        });
        return records.items[0] ?? null;
      } catch (err) {
        if (!shouldRetryWithoutCampaignFilter(err)) {
          throw err;
        }
        console.warn('users_stats: campaign filter unsupported; retrying without campaign scoping.', err);
      }
    }

    const records = await pb.collection('users_stats').getList<UserStats>(1, 1, {
      filter: baseFilter,
    });
    return records.items[0] ?? null;
  },

  getByCampaign: async (campaignId: string): Promise<UserStats[]> => {
    return pb.collection('users_stats').getFullList<UserStats>({
      filter: `campaign = "${campaignId}"`,
      sort: 'character_name',
      expand: 'user',
    });
  },

  getAll: async (): Promise<UserStats[]> => {
    return pb.collection('users_stats').getFullList<UserStats>({
      sort: 'character_name',
      expand: 'user',
    });
  },

  getOne: async (id: string): Promise<UserStats> => {
    return pb.collection('users_stats').getOne<UserStats>(id);
  },

  create: async (data: CreateUserStats): Promise<UserStats> => {
    return pb.collection('users_stats').create<UserStats>(data);
  },

  update: async (id: string, data: UpdateUserStats): Promise<UserStats> => {
    return pb.collection('users_stats').update<UserStats>(id, data);
  },

  delete: async (id: string): Promise<boolean> => {
    return pb.collection('users_stats').delete(id);
  },

  subscribe: (
    id: string,
    callback: (data: RecordSubscription<UserStats>) => void
  ): Promise<UnsubscribeFunc> => {
    return pb.collection('users_stats').subscribe<UserStats>(id, callback);
  },

  subscribeAll: (
    callback: (data: RecordSubscription<UserStats>) => void
  ): Promise<UnsubscribeFunc> => {
    return pb.collection('users_stats').subscribe<UserStats>('*', callback);
  },
};

/**
 * Fog of War Collection API
 */
export const fogOfWarApi = {
  getByUserId: async (userId: string): Promise<FogOfWar[]> => {
    const records = await pb.collection('fog_of_war').getFullList<FogOfWar>({
      filter: `user = "${userId}"`,
      sort: '-timestamp',
    });
    return records;
  },

  getByUserIdAndLayer: async (userId: string, z: number): Promise<FogOfWar[]> => {
    const records = await pb.collection('fog_of_war').getFullList<FogOfWar>({
      filter: `user = "${userId}" && z = ${z}`,
      sort: '-timestamp',
    });
    return records;
  },

  create: async (data: CreateFogOfWar): Promise<FogOfWar> => {
    return pb.collection('fog_of_war').create<FogOfWar>(data);
  },

  delete: async (id: string): Promise<boolean> => {
    return pb.collection('fog_of_war').delete(id);
  },

  subscribe: (
    callback: (data: RecordSubscription<FogOfWar>) => void
  ): Promise<UnsubscribeFunc> => {
    return pb.collection('fog_of_war').subscribe<FogOfWar>('*', callback);
  },

  checkHexRevealed: async (
    userId: string,
    q: number,
    r: number,
    z: number
  ): Promise<boolean> => {
    const records = await pb.collection('fog_of_war').getList<FogOfWar>(1, 1, {
      filter: `user = "${userId}" && q = ${q} && r = ${r} && z = ${z}`,
    });
    return records.totalItems > 0;
  },
};

/**
 * World State Collection API
 */
export const worldStateApi = {
  getAll: async (): Promise<WorldState[]> => {
    return pb.collection('world_state').getFullList<WorldState>({
      sort: '-created',
    });
  },

  getLatestForCampaign: async (campaignId: string): Promise<WorldState | null> => {
    const records = await pb.collection('world_state').getList<WorldState>(1, 1, {
      filter: `campaign = "${campaignId}"`,
      sort: '-created',
    });
    return records.items[0] ?? null;
  },

  create: async (data: CreateWorldState): Promise<WorldState> => {
    return pb.collection('world_state').create<WorldState>(data);
  },

  update: async (id: string, data: UpdateWorldState): Promise<WorldState> => {
    return pb.collection('world_state').update<WorldState>(id, data);
  },

  delete: async (id: string): Promise<boolean> => {
    return pb.collection('world_state').delete(id);
  },

  subscribe: (
    callback: (data: RecordSubscription<WorldState>) => void
  ): Promise<UnsubscribeFunc> => {
    return pb.collection('world_state').subscribe<WorldState>('*', callback);
  },

  subscribeToCampaign: (
    campaignId: string,
    callback: (data: RecordSubscription<WorldState>) => void
  ): Promise<UnsubscribeFunc> => {
    return pb.collection('world_state').subscribe<WorldState>('*', (event) => {
      if (event.record.campaign === campaignId) {
        callback(event);
      }
    });
  },
};

/**
 * Decals Collection API
 */
export const decalsApi = {
  getAll: async (): Promise<Decal[]> => {
    return pb.collection('decals').getFullList<Decal>({
      sort: 'site_name',
    });
  },

  getByLayer: async (z: number): Promise<Decal[]> => {
    return pb.collection('decals').getFullList<Decal>({
      filter: `z = ${z}`,
      sort: 'site_name',
    });
  },

  getVisibleByLayer: async (z: number): Promise<Decal[]> => {
    return pb.collection('decals').getFullList<Decal>({
      filter: `z = ${z} && is_visible = true`,
      sort: 'site_name',
    });
  },

  getOne: async (id: string): Promise<Decal> => {
    return pb.collection('decals').getOne<Decal>(id);
  },

  create: async (data: CreateDecal): Promise<Decal> => {
    return pb.collection('decals').create<Decal>(data);
  },

  update: async (id: string, data: UpdateDecal): Promise<Decal> => {
    return pb.collection('decals').update<Decal>(id, data);
  },

  delete: async (id: string): Promise<boolean> => {
    return pb.collection('decals').delete(id);
  },

  subscribe: (
    callback: (data: RecordSubscription<Decal>) => void
  ): Promise<UnsubscribeFunc> => {
    return pb.collection('decals').subscribe<Decal>('*', callback);
  },
};

/**
 * Helper to unsubscribe from all collections
 */
export const unsubscribeAll = (): void => {
  pb.collection('users_stats').unsubscribe();
  pb.collection('fog_of_war').unsubscribe();
  pb.collection('world_state').unsubscribe();
  pb.collection('decals').unsubscribe();
};

/**
 * Re-export pb instance for direct access when needed
 */
export { pb };
