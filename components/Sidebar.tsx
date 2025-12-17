
import React from 'react';
import { User, Subscription } from '../types';

interface SidebarItemProps {
  label: string;
  isActive?: boolean;
  onClick?: () => void;
  highlight?: boolean;
  isSpecial?: boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ label, isActive, onClick, highlight, isSpecial }) => (
  <div 
    onClick={onClick} 
    className={`
      group flex items-center justify-center cursor-pointer relative 
      py-4 px-2 flex-1
      ${isActive ? 'bg-white/5' : ''}
    `}
  >
    {/* Active Indicator - Top border */}
    {isActive && (
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#F6B45A] shadow-[0_0_12px_rgba(246,180,90,0.6)]" />
    )}
    
    <span className={`
      text-[10px] md:text-xs uppercase tracking-[0.15em] transition-all duration-300 text-center whitespace-nowrap
      ${isActive ? 'text-[#F6B45A] font-bold' : highlight ? 'text-[#F6B45A] font-bold' : 'text-gray-500 hover:text-white'}
      ${isSpecial ? 'text-[#F6B45A] font-bold border border-[#F6B45A]/30 px-3 py-1.5 rounded-full bg-[#F6B45A]/10' : ''}
    `}>
      {label}
    </span>
  </div>
);

interface SidebarProps {
  activeView: 'editor' | 'projects' | 'quotes' | 'settings';
  onNavigate: (view: 'editor' | 'projects' | 'quotes' | 'settings') => void;
  user: User | null;
  subscription: Subscription | null;
  onOpenPricing: () => void;
  onSave: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeView, 
  onNavigate, 
  user, 
  subscription, 
  onOpenPricing,
  onSave
}) => {
  const isPro = subscription?.status === 'active';

  return (
    <>
      {/* Container: Fixed Bottom on ALL screens */}
      <div className="
        fixed bottom-0 left-0 right-0 h-16 md:h-20 bg-[#111] border-t border-gray-800 flex flex-row items-center justify-center z-50
        shadow-[0_-4px_20px_rgba(0,0,0,0.5)]
      ">
        
        {/* Main Navigation Items */}
        <div className="flex flex-row justify-evenly w-full max-w-6xl gap-0 md:gap-8 items-center overflow-x-auto scrollbar-hide px-2">
          
          <SidebarItem 
            label="Mockups" 
            isActive={activeView === 'editor'} 
            onClick={() => onNavigate('editor')}
          />
          <SidebarItem 
            label="Projects" 
            isActive={activeView === 'projects'}
            onClick={() => onNavigate('projects')}
          />
          
          <SidebarItem 
            label="Quotes" 
            isActive={activeView === 'quotes'}
            onClick={() => onNavigate('quotes')}
          />
          
          {/* Settings: Moved Light Options here */}
          <SidebarItem 
            label="Settings" 
            isActive={activeView === 'settings'}
            onClick={() => onNavigate('settings')}
          />
        </div>
      </div>
    </>
  );
};