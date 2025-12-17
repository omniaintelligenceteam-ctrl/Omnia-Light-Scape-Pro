import React from 'react';
import { AuthView } from '../lib/AuthContext';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const AuthPage = () => {
  return (
    <div className="min-h-screen bg-[#FDFCFB] flex flex-col font-sans">
      <header className="p-6">
         <Link to="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-[#111] text-xs font-bold uppercase tracking-widest transition-colors">
            <ArrowLeft size={14} /> Back to Home
         </Link>
      </header>
      <div className="flex-1">
        <AuthView />
      </div>
    </div>
  );
};

export default AuthPage;