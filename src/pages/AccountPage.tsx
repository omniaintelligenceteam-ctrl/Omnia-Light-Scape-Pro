
import React from 'react';
import { AccountView } from '../lib/auth';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const AccountPage = () => {
  return (
    <div className="min-h-screen bg-[#FDFCFB] flex flex-col">
      <header className="p-6 md:p-8 flex items-center gap-4">
        <Link to="/" className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:border-[#111] transition-colors text-[#111]">
            <ArrowLeft size={18} />
        </Link>
        <h1 className="text-xl font-bold text-[#111]">My Profile</h1>
      </header>
      <div className="flex-1 p-4">
        <AccountView />
      </div>
    </div>
  );
};

export default AccountPage;
