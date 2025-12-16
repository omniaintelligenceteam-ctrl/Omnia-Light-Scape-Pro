import React, { useState } from 'react';
import { Check, X, Loader2, Sparkles, ShieldCheck, Zap } from 'lucide-react';
import { SubscriptionPlan } from '../types';

interface PricingProps {
  isOpen: boolean;
  onClose: () => void;
  // Optional, kept for compatibility
  onSubscribe?: (plan: SubscriptionPlan) => Promise<void>;
}

// CONFIGURED PRICING TIERS (Must match Paywall.tsx)
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

export const Pricing: React.FC<PricingProps> = ({ isOpen, onClose }) => {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLinkClick = (tierId: string, url: string) => {
    setLoadingPlan(tierId);
    // Slight delay for UX then open link
    setTimeout(() => {
        window.open(url, '_blank');
        setLoadingPlan(null);
        onClose();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dark backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 max-h-[85vh]">
        
        {/* Header */}
        <div className="p-8 pb-2 text-center shrink-0 relative">
            <div className="absolute top-6 right-6">
                 <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-[#111]">
                    <X size={20} />
                 </button>
            </div>
            <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-black/10">
               <Sparkles size={20} className="text-[#F6B45A]" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-[#111] mb-2">Upgrade Plan</h2>
            <p className="text-gray-500 text-sm leading-relaxed">
               Choose the number of generations you need per month.
            </p>
        </div>

        {/* Options (Scrollable) */}
        <div className="p-8 pt-4 space-y-3 overflow-y-auto custom-scrollbar">
            
            {PRICING_TIERS.map((tier) => (
                <button 
                    key={tier.id}
                    onClick={() => handleLinkClick(tier.id, tier.link)}
                    disabled={!!loadingPlan}
                    className={`w-full group relative border-2 rounded-2xl p-4 flex items-center justify-between transition-all text-left overflow-hidden
                        ${tier.popular 
                            ? 'bg-[#111] border-[#111] hover:bg-black shadow-xl shadow-black/10' 
                            : 'bg-white border-gray-100 hover:border-gray-300'
                        }
                    `}
                >
                    {tier.popular && (
                        <div className="absolute top-0 right-0 bg-[#F6B45A] text-[#111] text-[9px] font-bold px-2 py-1 rounded-bl-xl z-10">
                            BEST VALUE
                        </div>
                    )}

                    <div className="flex flex-col">
                        <div className="flex items-baseline gap-2">
                             <span className={`font-bold text-lg ${tier.popular ? 'text-white' : 'text-[#111]'}`}>
                                {tier.generations}
                             </span>
                             <span className={`text-xs uppercase tracking-wider font-bold ${tier.popular ? 'text-gray-400' : 'text-gray-500'}`}>
                                Generations
                             </span>
                        </div>
                        <div className={`text-[10px] flex items-center gap-1 mt-1 ${tier.popular ? 'text-gray-400' : 'text-gray-400'}`}>
                             <Check size={10} className={tier.popular ? 'text-green-400' : 'text-green-600'} /> Resets monthly
                        </div>
                    </div>

                    <div className="text-right pr-2">
                        <p className={`text-xl font-bold ${tier.popular ? 'text-white' : 'text-[#111]'}`}>
                            ${tier.price}
                        </p>
                        <p className={`text-[10px] ${tier.popular ? 'text-gray-500' : 'text-gray-400'}`}>/mo</p>
                    </div>

                    {loadingPlan === tier.id ? (
                       <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-[1px]">
                           <Loader2 size={24} className={`animate-spin ${tier.popular ? 'text-white' : 'text-black'}`} />
                       </div>
                    ) : (
                       <div className={`absolute right-4 opacity-0 group-hover:opacity-100 transition-opacity ${tier.popular ? 'text-white' : 'text-black'}`}>
                          <Zap size={16} />
                       </div>
                    )}
                </button>
            ))}

            <div className="pt-4 text-center shrink-0">
                 <p className="text-[10px] text-gray-400 flex items-center justify-center gap-1">
                   <ShieldCheck size={12} /> Secured by Stripe. Cancel anytime.
                 </p>
            </div>
        </div>

      </div>
    </div>
  );
};
