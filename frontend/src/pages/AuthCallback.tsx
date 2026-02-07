import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { pb } from '../lib/pb';

type OAuthSession = {
  provider: string;
  redirectUrl: string;
  codeVerifier: string;
  expectedState?: string;
  nextPath?: string;
  startedAt?: number;
};

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      const errorParam = searchParams.get('error');
      if (errorParam) {
        setError('Authentication failed. Please try again.');
        setTimeout(() => navigate('/login', { replace: true }), 2500);
        return;
      }

      const code = searchParams.get('code');
      const state = searchParams.get('state');
      if (!code || !state) {
        setError('Authentication callback is missing required parameters.');
        setTimeout(() => navigate('/login', { replace: true }), 2500);
        return;
      }

      const raw = sessionStorage.getItem('tk_oauth');
      if (!raw) {
        setError('Your sign-in session expired. Please try again.');
        setTimeout(() => navigate('/login', { replace: true }), 2500);
        return;
      }

      let session: OAuthSession | null = null;
      try {
        session = JSON.parse(raw) as OAuthSession;
      } catch {
        session = null;
      }

      if (!session?.provider || !session?.redirectUrl || !session?.codeVerifier) {
        sessionStorage.removeItem('tk_oauth');
        setError('Your sign-in session is invalid. Please try again.');
        setTimeout(() => navigate('/login', { replace: true }), 2500);
        return;
      }

      if (session.expectedState && session.expectedState !== state) {
        sessionStorage.removeItem('tk_oauth');
        setError('Authentication state mismatch. Please try again.');
        setTimeout(() => navigate('/login', { replace: true }), 2500);
        return;
      }

      try {
        await pb.collection('users').authWithOAuth2Code(
          session.provider,
          code,
          session.codeVerifier,
          session.redirectUrl,
          { global_role: 'USER' }
        );

        const nextPath = session.nextPath || '/dashboard';
        sessionStorage.removeItem('tk_oauth');
        navigate(nextPath, { replace: true });
      } catch (e: unknown) {
        console.error('OAuth callback exchange failed:', e);
        sessionStorage.removeItem('tk_oauth');
        setError('Authentication failed while completing sign-in. Please try again.');
        setTimeout(() => navigate('/login', { replace: true }), 2500);
      }
    };

    void run();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center adnd-page">
      <div className="adnd-surface max-w-md w-full mx-4 text-center rounded-2xl p-8">
        {error ? (
          <>
            <div className="text-[#b44a3a] text-5xl mb-4">⚠️</div>
            <h2 className="text-2xl adnd-display text-[#2c1d0f] mb-2">Authentication Error</h2>
            <p className="adnd-muted">{error}</p>
            <p className="text-sm adnd-muted mt-4">Redirecting to login...</p>
          </>
        ) : (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#7a4f24] mx-auto mb-4"></div>
            <h2 className="text-2xl adnd-display text-[#2c1d0f] mb-2">Completing Sign In</h2>
            <p className="adnd-muted">Please wait while we log you in...</p>
          </>
        )}
      </div>
    </div>
  );
}

