import { create } from 'zustand';
import type { User, PBUser } from '../types';
import { pb } from '../lib/pb';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  loginWithGoogle: (nextPath?: string) => Promise<void>;
  logout: () => void;
  fetchUser: () => void;
  setUser: (user: User | null) => void;
}

// Helper to map PocketBase record to our User interface
const mapPBUser = (record: PBUser | unknown): User | null => {
  if (!record) return null;

  // Cast to PBUser after null check - the record comes from PocketBase authStore
  const pbRecord = record as PBUser;

  return {
    id: pbRecord.id,
    email: pbRecord.email,
    name: pbRecord.name || pbRecord.username || 'Adventurer',
    avatarUrl: pb.files.getURL(pbRecord, pbRecord.avatar),
    global_role: pbRecord.global_role,
    createdAt: pbRecord.created,
  };
};

export const useAuthStore = create<AuthState>((set) => {
  // Initialize state from existing authStore
  const initialUser = mapPBUser(pb.authStore.model);
  const initialToken = pb.authStore.token;

  const asRecord = (v: unknown): Record<string, unknown> | null =>
    typeof v === 'object' && v !== null ? (v as Record<string, unknown>) : null;

  // Listen for auth changes to keep Zustand in sync
  pb.authStore.onChange((token, model) => {
    set({
      user: mapPBUser(model),
      token,
      isAuthenticated: !!model,
    });
  }, true);

  return {
    user: initialUser,
    isAuthenticated: !!initialUser,
    isLoading: false,
    token: initialToken,

    loginWithGoogle: async (nextPath = '/dashboard') => {
      set({ isLoading: true });
      try {
        // Redirect-based OAuth flow (no realtime popup). This works well for join links
        // and avoids browser popup restrictions.
        const authMethods = await pb.collection('users').listAuthMethods();
        const methods = asRecord(authMethods);
        const oauth2 = asRecord(methods?.oauth2);
        const providers = Array.isArray(oauth2?.providers) ? oauth2?.providers : [];
        const google = providers
          .map(asRecord)
          .find((p) => (typeof p?.name === 'string' ? p.name : '') === 'google');
        if (!google) {
          throw new Error('Google OAuth is not enabled on the server.');
        }

        const baseAuthUrl =
          (typeof google.authUrl === 'string' ? google.authUrl : undefined) ||
          (typeof google.authURL === 'string' ? google.authURL : undefined);
        if (!baseAuthUrl) {
          throw new Error('Google OAuth is not enabled on the server.');
        }

        const redirectUrl = `${window.location.origin}/auth/callback`;

        // PocketBase returns authUrl with `redirect_uri=` as the last param. Append our redirect URL.
        const authUrl = `${baseAuthUrl}${encodeURIComponent(redirectUrl)}`;

        sessionStorage.setItem(
          'tk_oauth',
          JSON.stringify({
            provider: 'google',
            redirectUrl,
            codeVerifier: typeof google.codeVerifier === 'string' ? google.codeVerifier : '',
            expectedState: typeof google.state === 'string' ? google.state : undefined,
            nextPath,
            startedAt: Date.now(),
          })
        );

        // Leaving the page; auth will be completed in /auth/callback.
        window.location.href = authUrl;
      } catch (error) {
        console.error('Failed to login with Google:', error);
        throw error;
      } finally {
        set({ isLoading: false });
      }
    },

    logout: () => {
      pb.authStore.clear();
      // onChange will handle the state update
    },

    fetchUser: () => {
      // PocketBase handles persistence automatically via localStorage
      // But we can manually refresh if needed
      const model = pb.authStore.model;
      set({
        user: mapPBUser(model),
        isAuthenticated: !!model,
        token: pb.authStore.token,
        isLoading: false,
      });
    },

    setUser: (user: User | null) => {
      set({ user, isAuthenticated: !!user });
    },
  };
});
