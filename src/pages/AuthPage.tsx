import React from 'react';
import { AuthView, useAuth } from '../lib/auth';
import { Navigate } from 'react-router-dom';

const AuthPage: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  // If the user is already authenticated via the strict Neon database check, 
  // redirect them to the primary application dashboard.
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen w-full bg-[#FDFCFB] overflow-hidden selection:bg-[#F6B45A] selection:text-[#111]">
      <AuthView />
    </div>
  );
};

export default AuthPage;