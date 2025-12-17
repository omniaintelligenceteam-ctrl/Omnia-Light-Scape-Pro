
import React from 'react';
import { AuthView, useAuth } from '../lib/auth';
import { Navigate } from 'react-router-dom';

const AuthPage = () => {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-[#FDFCFB] flex flex-col justify-center items-center p-4">
      <div className="mb-8 text-center">
         <span className="font-serif text-4xl font-bold text-[#F6B45A] tracking-tight">Omnia</span>
         <span className="font-serif italic text-lg font-bold tracking-[0.15em] text-gray-300 uppercase ml-2">Light Scape Pro</span>
      </div>
      <AuthView />
    </div>
  );
};

export default AuthPage;
