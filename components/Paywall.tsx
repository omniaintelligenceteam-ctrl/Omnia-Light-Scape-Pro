
import React, { useState } from 'react';
import { SubscriptionPlan, SubscriptionStatus } from '../types';
import { Loader2, ShieldCheck, Zap, Check } from 'lucide-react';

interface PaywallProps {
  isOpen: boolean;
  onSubscribe: (plan: SubscriptionPlan) => Promise<void>;
  onManageBilling: () => Promise<void>;
  userSubscriptionStatus: SubscriptionStatus;
}

// 1. CONFIGURED PRICING TIERS
const PRICING_TIERS = [
  {
    id: 'tier_10',
    generations: 10,
    price: 20,
    link: 'https://buy.stripe.com/6oU3cxdeA2Nmf7Bgaw4wM07',
    popular: false
  },
  {
    id: 'tier_50',
    generations: 50,
    price: 80,
    link: 'https://buy.stripe.com/cNi7sNa2o5Zyf7B8I44wM06',
    popular: true // Best Value
  },
  {
    id: 'tier_100',
    generations: 100,
    price: 140,
    link: 'https://buy.stripe.com/fZufZjeiEfA8f7Be2o4wM05',
    popular: false
  },
  {
    id: 'tier_250',
    generations: 250,
    price: 275,
    link: 'https://buy.stripe.com/5kQ3cxb6s9bKe3xgaw4wM04',
    popular: false
  },
  {
    id: 'tier_500',
    generations: 500,
    price: 499,
    link: 'https://buy.stripe.com/00w28t6Qc2Nm2kP1fC4wM03',
    popular: false
  },
  {
    id: 'tier_1000',
    generations: 1000,
    price: 899,
    link: 'https://buy.stripe.com/5kQeVfdeA87G2kP3nK4wM02',
    popular: false
  },
  {
    id: 'tier_2500',
    generations: 2500,
    price: 1999,
    link: 'https://buy.stripe.com/dRmdRb7UggEc5x1cYk4wM01',
    popular: false
  }
];

export const Paywall: React.FC<PaywallProps> = ({ isOpen, userSubscriptionStatus }) => {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  // If you have a customer portal link, paste it here. Otherwise, leave as is.
  const BILLING_PORTAL_LINK = "https://billing.stripe.com/p/login/REPLACE_WITH_YOUR_PORTAL_LINK"; 

  if (!isOpen) return null;

  const handleLinkClick = (tierId: string, url: string) => {
    setLoadingPlan(tierId);
    // Add a small delay so the user sees the spinner, then redirect
    setTimeout(() => {
        window.open(url, '_blank');
        setLoadingPlan(null);
    }, 500);
  };

  const handlePortalClick = () => {
      window.open(BILLING_PORTAL_LINK, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-white/90 backdrop-blur-xl" />
      
      <div className="relative bg-white w-full max-w-2xl rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] border border-gray-100 overflow-hidden flex flex-col animate-in zoom-in-95 duration-500 max-h-[90vh]">
        
        {/* Header */}
        <div className="pt-8 px-8 pb-4 text-center shrink-0">
          <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-black/10">
             <Zap size={20} className="text-yellow-400 fill-yellow-400" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight mb-2">Your 2-day free trial has ended</h2>
          <p className="text-gray-500 font-light text-sm leading-relaxed max-w-xs mx-auto">
            Generations reset every month based on your plan.
          </p>
        </div>

        {/* Scrollable Plans Area */}
        <div className="px-8 pb-4 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 gap-3">
            {PRICING_TIERS.map((tier) => (
              <button 
                key={tier.id}
                onClick={() => handleLinkClick(tier.id, tier.link)}
                disabled={!!loadingPlan}
                className={`w-full group relative border-2 rounded-2xl p-5 transition-all duration-200 text-left hover:shadow-md flex justify-between items-center
                  ${tier.popular 
                    ? 'bg-black border-black text-white hover:-translate-y-0.5 shadow-xl shadow-black/10' 
                    : 'bg-white border-gray-100 hover:border-black text-black'
                  }`}
              >
                {tier.popular && (
                  <div className="absolute -top-2.5 left-6 bg-red-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                    MOST POPULAR
                  </div>
                )}
                
                <div>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-bold text-lg">{tier.generations}</span>
                    <span className={`text-xs font-medium ${tier.popular ? 'text-gray-300' : 'text-gray-500'}`}>Generations/mo</span>
                  </div>
                  <div className={`text-[10px] flex items-center gap-1.5 ${tier.popular ? 'text-gray-400' : 'text-gray-400'}`}>
                    <Check size={10} className={tier.popular ? 'text-green-400' : 'text-green-500'} /> 
                    Resets monthly
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-bold text-xl">${tier.price}</div>
                  <div className={`text-[10px] ${tier.popular ? 'text-gray-400' : 'text-gray-400'}`}>per month</div>
                </div>

                {loadingPlan === tier.id && (
                  <div className={`absolute inset-0 flex items-center justify-center rounded-2xl ${tier.popular ? 'bg-black/80' : 'bg-white/80'}`}>
                    <Loader2 size={20} className="animate-spin" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 pb-8 pt-4 flex flex-col items-center shrink-0 border-t border-gray-50 bg-gray-50/50">
          <div className="flex items-center gap-2 text-gray-400 mb-4 text-[10px]">
             <ShieldCheck size={12} />
             <span>Secure payment via Stripe</span>
          </div>

          <button 
            onClick={handlePortalClick}
            className="text-xs font-medium text-gray-400 hover:text-black underline transition-colors"
          >
            Manage existing subscription
          </button>
        </div>

      </div>
    </div>
  );
};
