
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { NeonAuthUIProvider, useAuth } from './lib/auth';
import { Dashboard } from './pages/Dashboard';
import AuthPage from './pages/AuthPage';
import AccountPage from './pages/AccountPage';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#FDFCFB] text-gray-400">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <NeonAuthUIProvider>
      <Router>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/account" 
            element={
              <ProtectedRoute>
                <AccountPage />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </Router>
    </NeonAuthUIProvider>
  );
};

export default App;
