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

const getAuthContext = (): { userId: string | null; isGlobalGM: boolean } => {
  const model = pb.authStore.model as null | { id?: string; global_role?: string };
  const userId = typeof model?.id === 'string' ? model.id : null;
  const role = typeof model?.global_role === 'string' ? model.global_role : '';
  const isGlobalGM = role === 'GM' || role === 'ADMIN';
  return { userId, isGlobalGM };
};

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

const sortByCharacterName = <T extends { character_name?: string; created?: string }>(items: T[]): T[] => {
  // Prefer case-insensitive name sort, with created as a stable tie-breaker.
  // Some deployments may not have character_name; in that case, it will sort by created desc.
  return [...items].sort((a, b) => {
    const an = (a.character_name || '').trim().toLowerCase();
    const bn = (b.character_name || '').trim().toLowerCase();

    if (an && bn) {
      if (an < bn) return -1;
      if (an > bn) return 1;
    } else if (an && !bn) {
      return -1;
    } else if (!an && bn) {
      return 1;
    }

    // Newest first
    const ac = a.created || '';
    const bc = b.created || '';
    if (ac < bc) return 1;
    if (ac > bc) return -1;
    return 0;
  });
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
          sort: '-created',
        });
        return records.items[0] ?? null;
      } catch (err) {
        // In the wild we have seen instances where `campaign` isn't in the schema,
        // causing PocketBase to reject the filter and breaking the whole character page.
        // Retry without campaign scoping so "My Character" can still open something.
        const hint = shouldRetryWithoutCampaignFilter(err) ? ' (campaign filter unsupported)' : '';
        console.warn(`users_stats: campaign-scoped lookup failed${hint}; retrying without campaign scoping.`, err);
      }
    }

    const records = await pb.collection('users_stats').getList<UserStats>(1, 1, {
      filter: baseFilter,
      sort: '-created',
    });
    return records.items[0] ?? null;
  },

  getByCampaign: async (campaignId: string): Promise<UserStats[]> => {
    // Primary: campaign-scoped list. We sort client-side to avoid 400s when a field is missing.
    //
    // Important: Some deployments return a generic 400 error without mentioning the missing field name.
    // In that case we still fall back to client-side filtering to keep "My Character" usable.
    try {
      const items = await pb.collection('users_stats').getFullList<UserStats>({
        filter: `campaign = "${campaignId}"`,
        sort: '-created',
        expand: 'user',
      });
      return sortByCharacterName(items);
    } catch (err) {
      const anyErr = err as { status?: number };
      const isBadRequest = anyErr?.status === 400;

      if (!isBadRequest && !shouldRetryWithoutCampaignFilter(err)) {
        throw err;
      }

      console.warn('users_stats: campaign-scoped list failed; falling back to client-side filtering.', err);

      // Fall back: fetch all allowed records and filter by campaign locally.
      // Access rules still apply server-side, so this does not broaden what the user can read.
      const all = await pb.collection('users_stats').getFullList<UserStats>({
        sort: '-created',
        expand: 'user',
      });

      // Legacy compatibility: older installs may have characters without a campaign field/value.
      // In that case, we still show them so "My Character" doesn't appear empty.
      // - Global GM/ADMIN: show all unscoped characters too.
      // - Players: only show their own unscoped characters.
      const { userId, isGlobalGM } = getAuthContext();
      const filtered = all.filter((r) => {
        const camp = (r as unknown as { campaign?: string | null }).campaign;
        if (typeof camp === 'string' && camp.trim() !== '') {
          return camp === campaignId;
        }
        if (isGlobalGM) return true;
        if (!userId) return false;
        return (r as unknown as { user?: string | null }).user === userId;
      });
      return sortByCharacterName(filtered);
    }
  },

  getAll: async (): Promise<UserStats[]> => {
    try {
      const items = await pb.collection('users_stats').getFullList<UserStats>({
        // Use a safe system sort and do name sorting client-side.
        sort: '-created',
        expand: 'user',
      });
      return sortByCharacterName(items);
    } catch {
      // Last resort: return unsorted (still created desc).
      const items = await pb.collection('users_stats').getFullList<UserStats>({
        sort: '-created',
        expand: 'user',
      });
      return items;
    }
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
