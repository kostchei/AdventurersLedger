import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const errorParam = searchParams.get('error');

    if (errorParam) {
      setError('Authentication failed. Please try again.');
      setTimeout(() => navigate('/login'), 3000);
      return;
    }

    // PocketBase handles the OAuth callback automatically
    // If we're authenticated, redirect to dashboard
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      // Wait a bit for PocketBase to process the auth, then redirect
      setTimeout(() => {
        if (isAuthenticated) {
          navigate('/dashboard');
        } else {
          setError('Authentication timed out. Please try again.');
          setTimeout(() => navigate('/login'), 2000);
        }
      }, 1000);
    }
  }, [searchParams, isAuthenticated, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="card max-w-md w-full mx-4 text-center">
        {error ? (
          <>
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-white mb-2">Authentication Error</h2>
            <p className="text-gray-400">{error}</p>
            <p className="text-sm text-gray-500 mt-4">Redirecting to login...</p>
          </>
        ) : (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-500 mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-white mb-2">Completing Sign In</h2>
            <p className="text-gray-400">Please wait while we log you in...</p>
          </>
        )}
      </div>
    </div>
  );
}
