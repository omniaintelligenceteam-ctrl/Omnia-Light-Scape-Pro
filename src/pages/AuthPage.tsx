
import React from 'react';
import { AuthView, useAuth } from '../lib/auth';
import { Navigate } from 'react-router-dom';

const AuthPage = () => {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen w-full bg-[#FDFCFB] overflow-hidden">
      <AuthView />
    </div>
  );
};

export default AuthPage;
