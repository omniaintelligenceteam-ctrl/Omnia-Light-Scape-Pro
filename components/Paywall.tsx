import React from 'react';
import { Crown, Check, Lock } from 'lucide-react';
import { SubscriptionPlan } from '../types';

interface PaywallProps {
  isOpen: boolean;
  onSubscribe: (plan: SubscriptionPlan) => void;
  onManageBilling: () => void;
  userSubscriptionStatus: string;
}

export const Paywall: React.FC<PaywallProps> = ({ 
  isOpen, 
  onSubscribe, 
  onManageBilling, 
  userSubscriptionStatus 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      
      <div className="relative bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="bg-[#111] p-8 text-center relative">
            <div className="absolute inset-0 bg-[#F6B45A]/5"></div>
            <div className="w-16 h-16 bg-[#F6B45A] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-[#F6B45A]/20 relative z-10">
                <Lock size={32} className="text-[#111]" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2 relative z-10">Trial Expired</h2>
            <p className="text-gray-400 text-sm relative z-10">Your free trial has ended. Subscribe to continue designing with Omnia Pro.</p>
        </div>

        <div className="p-8">
            <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                        <Check size={12} strokeWidth={3} />
                    </div>
                    <span className="text-sm text-gray-600 font-medium">Unlimited AI Generations</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                        <Check size={12} strokeWidth={3} />
                    </div>
                    <span className="text-sm text-gray-600 font-medium">Nano Banana Pro (2K) Exports</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                        <Check size={12} strokeWidth={3} />
                    </div>
                    <span className="text-sm text-gray-600 font-medium">Commercial License & Support</span>
                </div>
            </div>

            <button 
                onClick={() => onSubscribe('pro_monthly')}
                className="w-full bg-[#111] text-white py-4 rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-black hover:scale-[1.02] transition-all shadow-xl shadow-black/10 mb-3"
            >
                Subscribe Monthly - $49
            </button>
            <button 
                onClick={() => onSubscribe('pro_yearly')}
                className="w-full bg-white border border-gray-200 text-[#111] py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:border-[#F6B45A] hover:text-[#F6B45A] transition-all"
            >
                Subscribe Yearly - $499
            </button>
        </div>
      </div>
    </div>
  );
};