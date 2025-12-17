import React from 'react';
import { AccountView } from '../lib/AuthContext';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const AccountPage = () => {
  return (
    <div className="min-h-screen bg-[#FDFCFB] flex flex-col font-sans">
       <header className="p-6 bg-white border-b border-gray-50 flex justify-between items-center">
         <div className="flex items-baseline gap-2">
            <span className="font-serif text-2xl font-bold text-[#F6B45A] tracking-tight">Omnia</span>
         </div>
         <Link to="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-[#111] text-xs font-bold uppercase tracking-widest transition-colors">
            <ArrowLeft size={14} /> Back to Dashboard
         </Link>
      </header>
      <div className="flex-1">
        <AccountView />
      </div>
    </div>
  );
};

export default AccountPage;