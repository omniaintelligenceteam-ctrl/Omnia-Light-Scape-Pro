import React, { useState } from 'react';
import { STRIPE_CONFIG } from '../constants';
import { Check, X, Loader2, Sparkles, ShieldCheck, Zap } from 'lucide-react';
import { SubscriptionPlan } from '../types';

interface PricingProps {
  isOpen: boolean;
  onClose: () => void;
  onSubscribe: (plan: SubscriptionPlan) => Promise<void>;
}

export const Pricing: React.FC<PricingProps> = ({ isOpen, onClose, onSubscribe }) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSelectPlan = async () => {
    setLoading(true);
    // Simulate Stripe Checkout redirect delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    await onSubscribe(billingCycle === 'monthly' ? 'pro_monthly' : 'pro_yearly');
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-300">
        
        {/* Left: Value Prop */}
        <div className="bg-black text-white p-10 md:w-2/5 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          
          <div>
            <div className="flex items-center gap-2 mb-6 text-accent">
              <Sparkles size={24} />
              <span className="text-xs font-bold tracking-widest uppercase">Go Pro</span>
            </div>
            <h2 className="text-3xl font-bold mb-4 leading-tight">Unlock the full power of AI Lighting.</h2>
            <p className="text-gray-400 font-light text-sm leading-relaxed">
              Generate unlimited high-resolution mockups, access advanced editing tools, and remove all watermarks.
            </p>
          </div>

          <div className="space-y-4 mt-8">
            {[
              "Unlimited AI Generations",
              "4K Resolution Downloads",
              "Commercial Usage License",
              "Priority Processing",
              "Advanced Fixture Controls"
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-accent">
                  <Check size={12} strokeWidth={3} />
                </div>
                <span className="text-sm font-medium text-gray-200">{feature}</span>
              </div>
            ))}
          </div>
          
          <div className="mt-8 pt-8 border-t border-white/10">
             <div className="flex items-center gap-2 text-gray-500">
                <ShieldCheck size={16} />
                <span className="text-xs">Secure payment via Stripe</span>
             </div>
          </div>
        </div>

        {/* Right: Plan Selection */}
        <div className="p-10 md:w-3/5 bg-gray-50 flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-bold text-gray-900">Select Plan</h3>
            <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
              <X size={20} className="text-gray-500" />
            </button>
          </div>

          {/* Toggle */}
          <div className="flex justify-center mb-8">
            <div className="bg-gray-200 p-1 rounded-full flex relative">
              <button 
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-2 rounded-full text-xs font-bold transition-all z-10 ${billingCycle === 'monthly' ? 'text-black' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Monthly
              </button>
              <button 
                onClick={() => setBillingCycle('yearly')}
                className={`px-6 py-2 rounded-full text-xs font-bold transition-all z-10 flex items-center gap-2 ${billingCycle === 'yearly' ? 'text-black' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Yearly
                <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wide">Save 15%</span>
              </button>
              
              <div 
                className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-full shadow-sm transition-transform duration-300 ${billingCycle === 'yearly' ? 'translate-x-full' : 'translate-x-0'}`}
              />
            </div>
          </div>

          {/* Selected Plan Card */}
          <div className="bg-white border-2 border-black rounded-3xl p-8 shadow-sm flex-1 flex flex-col items-center justify-center text-center relative overflow-hidden">
             {billingCycle === 'yearly' && (
               <div className="absolute top-4 right-4 text-accent animate-pulse">
                 <Zap size={20} fill="currentColor" />
               </div>
             )}
             
             <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">
               {billingCycle === 'monthly' ? STRIPE_CONFIG.PLANS.MONTHLY.name : STRIPE_CONFIG.PLANS.YEARLY.name}
             </p>
             <div className="flex items-baseline justify-center gap-1 mb-2">
               <span className="text-5xl font-bold tracking-tighter">
                 ${billingCycle === 'monthly' ? STRIPE_CONFIG.PLANS.MONTHLY.price : STRIPE_CONFIG.PLANS.YEARLY.price}
               </span>
               <span className="text-gray-400 font-medium">
                 /{billingCycle === 'monthly' ? 'mo' : 'yr'}
               </span>
             </div>
             <p className="text-sm text-gray-500 mb-8 max-w-xs mx-auto">
               Full access to all AI tools, unlimited projects, and premium support.
             </p>

             <button 
               onClick={handleSelectPlan}
               disabled={loading}
               className="w-full bg-black text-white py-4 rounded-xl font-bold text-sm hover:scale-[1.02] transition-transform shadow-lg hover:shadow-xl disabled:opacity-70 disabled:hover:scale-100 flex items-center justify-center gap-2"
             >
               {loading ? (
                 <>
                   <Loader2 size={18} className="animate-spin" /> Processing...
                 </>
               ) : (
                 "Subscribe Now"
               )}
             </button>
             
             <p className="text-[10px] text-gray-400 mt-4">
               Cancel anytime. No hidden fees.
             </p>
          </div>

        </div>
      </div>
    </div>
  );
};