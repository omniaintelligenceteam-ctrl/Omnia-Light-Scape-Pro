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
      py-4 md:py-6 px-2 flex-1 md:flex-none md:w-full
      ${isActive ? 'bg-white/5 md:bg-transparent' : ''}
    `}
  >
    {/* Active Indicator - Left border on Desktop, Top border on Mobile */}
    {isActive && (
      <div className="absolute top-0 left-0 right-0 h-0.5 md:h-auto md:top-1/2 md:-translate-y-1/2 md:right-auto md:w-0.5 md:h-8 bg-[#F6B45A] shadow-[0_0_12px_rgba(246,180,90,0.6)]" />
    )}
    
    <span className={`
      text-[10px] md:text-[11px] uppercase tracking-[0.15em] transition-all duration-300 text-center whitespace-nowrap
      ${isActive ? 'text-[#F6B45A] font-bold' : highlight ? 'text-[#F6B45A] font-bold' : 'text-gray-500 hover:text-white'}
      ${isSpecial ? 'text-[#F6B45A] font-bold border border-[#F6B45A]/30 px-3 py-1.5 rounded-full bg-[#F6B45A]/10' : ''}
    `}>
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
  isColorPanelOpen: boolean;
  onToggleColorPanel: () => void;
  isRefinePanelOpen: boolean;
  onToggleRefinePanel: () => void;
  onSave: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeView, 
  onNavigate, 
  user, 
  subscription, 
  onLogout, 
  onOpenPricing,
  isColorPanelOpen,
  onToggleColorPanel,
  isRefinePanelOpen,
  onToggleRefinePanel,
  onSave
}) => {
  const isPro = subscription?.status === 'active';

  return (
    <>
      {/* Mobile Upgrade Button - Fixed Top Right */}
      {!isPro && (
        <button 
            onClick={onOpenPricing}
            className="md:hidden fixed top-5 right-4 z-[60] bg-[#F6B45A] text-[#111] text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full shadow-lg shadow-orange-500/20 animate-pulse"
        >
            Upgrade
        </button>
      )}

      {/* Container: Fixed Bottom on Mobile, Fixed Left on Desktop */}
      <div className="
        fixed bottom-0 left-0 right-0 h-16 bg-[#111] border-t border-gray-800 flex flex-row items-center justify-evenly z-50
        md:relative md:h-screen md:w-32 md:flex-col md:justify-between md:border-r md:border-t-0 md:py-8
        shadow-[0_-4px_20px_rgba(0,0,0,0.5)] md:shadow-[4px_0_24px_-4px_rgba(0,0,0,0.5)]
      ">
        
        {/* LOGO (Desktop Only) */}
        <div className="hidden md:flex flex-col items-center mb-8">
          <div className="w-8 h-8 bg-[#222] rounded-lg flex items-center justify-center shadow-lg border border-gray-800">
            <div className="w-2 h-2 bg-[#F6B45A] rounded-full shadow-[0_0_8px_rgba(246,180,90,0.5)]"></div>
          </div>
        </div>
        
        {/* Main Navigation Items */}
        <div className="flex flex-row md:flex-col justify-evenly w-full md:gap-2 overflow-x-auto md:overflow-visible scrollbar-hide items-center">
          
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
          
          {/* Hidden on Mobile, Visible on Desktop */}
          <div className="hidden md:block w-full">
            <SidebarItem 
              label="Save" 
              onClick={onSave}
            />
          </div>

          <SidebarItem 
            label="Color" 
            isActive={isColorPanelOpen}
            onClick={onToggleColorPanel}
          />
           <SidebarItem 
            label="Refine" 
            isActive={isRefinePanelOpen}
            onClick={onToggleRefinePanel}
          />
           <SidebarItem 
            label="Settings" 
            isActive={activeView === 'settings'}
            onClick={() => onNavigate('settings')}
          />
          
          {/* Mobile Only: Logout Button next to Settings */}
          <div className="md:hidden">
            {user && (
               <SidebarItem 
                label="Logout" 
                onClick={onLogout}
              />
            )}
          </div>
        </div>

        {/* Footer Actions (Desktop: Upgrade/User) */}
        <div className="hidden md:flex flex-col items-center gap-6 w-full mt-auto">
          {!isPro && (
            <SidebarItem 
              label="Upgrade" 
              onClick={onOpenPricing}
              isSpecial={true}
            />
          )}

          {/* Settings moved to bottom section on Desktop */}
          <SidebarItem 
            label="Settings" 
            isActive={activeView === 'settings'}
            onClick={() => onNavigate('settings')}
          />

          {user && (
            <div className="pt-6 border-t border-gray-800 w-12 flex justify-center">
              <button 
                onClick={onLogout}
                className="text-[10px] font-medium text-gray-600 hover:text-red-400 uppercase tracking-widest transition-colors"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};