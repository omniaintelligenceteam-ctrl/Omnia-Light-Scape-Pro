import React from 'react';
import { Layers, Image as ImageIcon, Settings as SettingsIcon, LogOut, Crown } from 'lucide-react';
import { User, Subscription } from '../types';

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
  highlight?: boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, label, isActive, onClick, highlight }) => (
  <div onClick={onClick} className="group flex flex-col items-center gap-1.5 cursor-pointer w-full relative py-6">
    {isActive && (
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-[#F6B45A] rounded-r-full shadow-[0_0_12px_rgba(246,180,90,0.6)]" />
    )}
    <div className={`p-2 transition-all duration-300 transform group-hover:-translate-y-0.5 ${isActive ? 'text-[#F6B45A]' : highlight ? 'text-[#F6B45A]' : 'text-gray-600 group-hover:text-gray-300'}`}>
      {icon}
    </div>
    <span className={`text-[9px] uppercase tracking-[0.2em] font-medium transition-colors ${isActive ? 'text-[#F6B45A] font-bold' : highlight ? 'text-[#F6B45A]' : 'text-gray-600 group-hover:text-gray-400'}`}>
      {label}
    </span>
  </div>
);

interface SidebarProps {
  activeView: 'editor' | 'projects' | 'settings';
  onNavigate: (view: 'editor' | 'projects' | 'settings') => void;
  user: User | null;
  subscription: Subscription | null;
  onLogout: () => void;
  onOpenPricing: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeView, onNavigate, user, subscription, onLogout, onOpenPricing }) => {
  const isPro = subscription?.status === 'active';

  return (
    <div className="w-28 h-screen bg-[#111] border-r border-gray-800 flex flex-col items-center py-10 z-20 flex-shrink-0 justify-between shadow-[4px_0_24px_-4px_rgba(0,0,0,0.5)]">
      <div className="flex flex-col items-center w-full">
        <div className="mb-12">
          {/* Logo Container - Lighter on dark bg */}
          <div className="w-10 h-10 bg-[#222] rounded-xl flex items-center justify-center shadow-2xl shadow-black/50 border border-gray-800">
            <div className="w-2.5 h-2.5 bg-[#F6B45A] rounded-full shadow-[0_0_10px_rgba(246,180,90,0.5)]"></div>
          </div>
        </div>
        
        <div className="flex flex-col gap-2 w-full">
          <SidebarItem 
            icon={<ImageIcon size={20} strokeWidth={1.5} />} 
            label="Mockups" 
            isActive={activeView === 'editor'} 
            onClick={() => onNavigate('editor')}
          />
          <SidebarItem 
            icon={<Layers size={20} strokeWidth={1.5} />} 
            label="Projects" 
            isActive={activeView === 'projects'}
            onClick={() => onNavigate('projects')}
          />
          <SidebarItem 
            icon={<SettingsIcon size={20} strokeWidth={1.5} />} 
            label="Settings" 
            isActive={activeView === 'settings'}
            onClick={() => onNavigate('settings')}
          />
        </div>
      </div>

      <div className="flex flex-col items-center gap-8 mb-4 w-full">
        {!isPro && (
          <button 
            onClick={onOpenPricing}
            className="flex flex-col items-center gap-2 group relative px-4"
          >
             {/* Subtle Pulse Animation */}
             <div className="absolute inset-0 bg-[#F6B45A]/5 rounded-xl animate-pulse scale-90" />
             
             {/* Hover State */}
             <div className="absolute inset-0 bg-[#F6B45A]/10 rounded-xl scale-0 group-hover:scale-100 transition-transform duration-300" />
             
             <div className="w-8 h-8 rounded-full bg-[#F6B45A]/10 flex items-center justify-center text-[#F6B45A] group-hover:bg-[#F6B45A] group-hover:text-black transition-all duration-300 shadow-sm relative z-10 border border-[#F6B45A]/20 group-hover:shadow-[0_0_15px_rgba(246,180,90,0.4)]">
                <Crown size={14} strokeWidth={2} />
             </div>
             <span className="text-[8px] font-bold uppercase tracking-[0.15em] text-[#F6B45A] relative z-10">Upgrade</span>
          </button>
        )}

        {user && (
          <div className="flex flex-col items-center gap-4 pt-6 border-t border-gray-800 w-12">
            <div className="w-8 h-8 rounded-full bg-[#222] shadow-md shadow-black/50 flex items-center justify-center text-xs font-bold text-gray-400 border border-gray-700">
              {user.name.charAt(0)}
            </div>
            <button 
              onClick={onLogout}
              className="text-gray-600 hover:text-white transition-colors"
              title="Sign Out"
            >
              <LogOut size={16} strokeWidth={1.5} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};