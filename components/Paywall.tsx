import React, { useState } from 'react';
import { STRIPE_CONFIG } from '../constants';
import { SubscriptionPlan, SubscriptionStatus } from '../types';
import { Loader2, ArrowRight, ShieldCheck, Check } from 'lucide-react';

interface PaywallProps {
  isOpen: boolean;
  onSubscribe: (plan: SubscriptionPlan) => Promise<void>;
  onManageBilling: () => Promise<void>;
  userSubscriptionStatus: SubscriptionStatus;
}

export const Paywall: React.FC<PaywallProps> = ({ isOpen, onSubscribe, onManageBilling, userSubscriptionStatus }) => {
  const [loadingPlan, setLoadingPlan] = useState<SubscriptionPlan | null>(null);
  const [loadingPortal, setLoadingPortal] = useState(false);

  if (!isOpen) return null;

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    setLoadingPlan(plan);
    await onSubscribe(plan);
    setLoadingPlan(null);
  };

  const handlePortal = async () => {
    setLoadingPortal(true);
    await onManageBilling();
    setLoadingPortal(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop with heavy blur to obscure the app */}
      <div className="absolute inset-0 bg-white/80 backdrop-blur-xl" />
      
      <div className="relative bg-white w-full max-w-lg rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] border border-gray-100 overflow-hidden flex flex-col animate-in zoom-in-95 duration-500">
        
        {/* Header */}
        <div className="pt-12 px-10 pb-6 text-center">
          <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-black/10">
             <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          </div>
          <h2 className="text-2xl font-bold tracking-tight mb-3">Your 7-day free trial has ended</h2>
          <p className="text-gray-500 font-light text-sm leading-relaxed max-w-xs mx-auto">
            Keep creating photorealistic lighting mockups for your clients in minutes.
          </p>
        </div>

        {/* Plans */}
        <div className="px-10 pb-8 space-y-4">
          
          {/* Monthly */}
          <button 
            onClick={() => handleSubscribe('pro_monthly')}
            disabled={!!loadingPlan}
            className="w-full group relative bg-white border-2 border-gray-100 hover:border-black rounded-2xl p-6 transition-all duration-200 text-left hover:shadow-lg"
          >
            <div className="flex justify-between items-center mb-1">
              <span className="font-bold text-sm">Pro Monthly</span>
              <span className="font-bold text-lg">$49<span className="text-xs text-gray-400 font-normal">/mo</span></span>
            </div>
            <div className="text-xs text-gray-400 flex items-center gap-2">
              <Check size={12} className="text-green-500" /> Unlimited mockups & night views
            </div>
            {loadingPlan === 'pro_monthly' && (
              <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-2xl">
                <Loader2 size={20} className="animate-spin" />
              </div>
            )}
          </button>

          {/* Yearly */}
          <button 
            onClick={() => handleSubscribe('pro_yearly')}
            disabled={!!loadingPlan}
            className="w-full group relative bg-black border-2 border-black rounded-2xl p-6 transition-all duration-200 text-left shadow-xl shadow-black/10 hover:shadow-2xl hover:-translate-y-0.5"
          >
            <div className="absolute -top-3 right-6 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">
              BEST VALUE
            </div>
            <div className="flex justify-between items-center mb-1 text-white">
              <span className="font-bold text-sm">Pro Yearly</span>
              <span className="font-bold text-lg">$499<span className="text-xs text-gray-400 font-normal">/yr</span></span>
            </div>
            <div className="text-xs text-gray-400 flex items-center gap-2">
              <Check size={12} className="text-green-500" /> Save $89 (2 months free)
            </div>
            {loadingPlan === 'pro_yearly' && (
              <div className="absolute inset-0 bg-black/80 flex items-center justify-center rounded-2xl text-white">
                <Loader2 size={20} className="animate-spin" />
              </div>
            )}
          </button>

        </div>

        {/* Footer */}
        <div className="px-10 pb-10 flex flex-col items-center">
          <div className="flex items-center gap-2 text-gray-300 mb-6 text-[10px]">
             <ShieldCheck size={12} />
             <span>Secure payment via Stripe</span>
          </div>

          {(userSubscriptionStatus !== 'none' && userSubscriptionStatus !== 'active') && (
            <button 
              onClick={handlePortal}
              disabled={loadingPortal}
              className="text-xs font-medium text-gray-400 hover:text-black underline transition-colors flex items-center gap-1"
            >
              {loadingPortal ? <Loader2 size={12} className="animate-spin" /> : 'Manage billing'}
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
