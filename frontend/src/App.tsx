import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Login from './pages/Login';
import AuthCallback from './pages/AuthCallback';
import Dashboard from './pages/Dashboard';
import CampaignPage from './pages/CampaignPage';
import JoinCampaign from './pages/JoinCampaign';
import CharacterStatsPage from './pages/CharacterStatsPage';
import ProtectedRoute from './components/ProtectedRoute';
import ServerOffline from './components/ServerOffline';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ServerOffline>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/campaign/:campaignId"
              element={
                <ProtectedRoute>
                  <CampaignPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/campaign/:campaignId/stats/:userId?"
              element={
                <ProtectedRoute>
                  <CharacterStatsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/campaign/:campaignId/join"
              element={
                <ProtectedRoute>
                  <JoinCampaign />
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </ServerOffline>
    </QueryClientProvider>
  );
}

export default App;
