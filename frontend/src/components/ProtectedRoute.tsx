import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, fetchUser } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center adnd-page">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#7a4f24] mx-auto mb-4"></div>
          <p className="adnd-muted">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    const from = `${location.pathname}${location.search || ''}`;
    return <Navigate to="/login" state={{ from }} replace />;
  }

  return <>{children}</>;
}
