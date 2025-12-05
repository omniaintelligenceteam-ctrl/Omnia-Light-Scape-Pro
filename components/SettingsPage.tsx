import React, { useState } from 'react';
import { User, UserSettings, Subscription, TrialState, MarkerType } from '../types';
import { createPortalSession } from '../services/stripeService';
import { Save, Loader2, CreditCard, Crown, Clock, Building, Lightbulb, Sparkles, ChevronDown, Mail, ShieldCheck } from 'lucide-react';
import { COLOR_TEMPERATURES, QUICK_PROMPTS } from '../constants';

interface SettingsPageProps {
  user: User;
  userSettings: UserSettings | null;
  subscription: Subscription | null;
  trialState: TrialState | null;
  onSaveSettings: (newSettings: UserSettings) => void;
  onUpgrade: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ 
  user, 
  userSettings, 
  subscription, 
  trialState, 
  onSaveSettings, 
  onUpgrade 
}) => {
  const [loading, setLoading] = useState(false);
  const [billingLoading, setBillingLoading] = useState(false);
  
  // Local state for form
  const [companyName, setCompanyName] = useState(userSettings?.company_name || '');
  const [defaultColorTemp, setDefaultColorTemp] = useState(userSettings?.default_color_temp || '3000k');
  const [defaultDesignTemplate, setDefaultDesignTemplate] = useState(userSettings?.default_design_template || '');

  // Calculate Trial Status
  const now = Date.now();
  const trialEnd = trialState?.trial_end || 0;
  const trialStart = trialState?.trial_start || now;
  const isTrialActive = now < trialEnd;
  const daysRemaining = Math.max(0, Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24)));
  const totalTrialDays = 7;
  const daysUsed = totalTrialDays - daysRemaining;
  const progressPercent = Math.min(100, (daysUsed / totalTrialDays) * 100);
  
  const isPro = subscription?.status === 'active';

  const handleSave = async () => {
    if (!userSettings) return;
    setLoading(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const updated: UserSettings = {
      ...userSettings,
      company_name: companyName,
      default_color_temp: defaultColorTemp,
      default_design_template: defaultDesignTemplate
    };
    
    onSaveSettings(updated);
    setLoading(false);
  };

  const handleManageBilling = async () => {
    setBillingLoading(true);
    try {
      const { url } = await createPortalSession(user.id);
      alert(`[MOCK] Redirecting to Stripe Customer Portal...\n${url}`);
    } catch (e) {
      console.error(e);
    } finally {
      setBillingLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#FDFCFB] relative font-sans text-[#111]">
      {/* Subtle Ambient Background */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-gray-100/50 to-transparent pointer-events-none" />

      <div className="max-w-6xl mx-auto px-12 py-16 relative z-10">
        
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-[#111] mb-2">Settings</h1>
          <p className="text-gray-400 font-medium text-sm tracking-wide">Manage your professional profile and workspace preferences.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Left Column: Forms */}
          <div className="lg:col-span-8 flex flex-col gap-8">
            
            {/* Company Profile Card */}
            <div className="bg-white rounded-[24px] border border-gray-100 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.03)] p-10 relative overflow-hidden group hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.06)] transition-all duration-500">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-[#111] flex items-center justify-center text-[#F6B45A] shadow-lg shadow-black/10">
                  <Building size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#111]">Company Profile</h2>
                  <p className="text-xs text-gray-400 font-medium tracking-wide">Your business identity on exports</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 flex items-center gap-2">
                    <Mail size={12} /> Account Email
                  </label>
                  <div className="w-full bg-gray-50/50 border border-gray-100 rounded-xl px-4 py-4 text-sm font-medium text-gray-500 flex items-center justify-between">
                    {user.email}
                    <ShieldCheck size={14} className="text-green-500" />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">Company Name</label>
                  <input 
                    type="text" 
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-4 text-sm font-medium text-[#111] placeholder:text-gray-300 focus:outline-none focus:ring-1 focus:ring-[#F6B45A] focus:border-[#F6B45A] transition-all shadow-sm hover:border-gray-300"
                    placeholder="e.g. Acme Lighting Design"
                  />
                </div>
              </div>
            </div>

            {/* Design Defaults Card */}
            <div className="bg-white rounded-[24px] border border-gray-100 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.03)] p-10 relative overflow-hidden group hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.06)] transition-all duration-500">
               <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-[#111] flex items-center justify-center text-[#F6B45A] shadow-lg shadow-black/10">
                  <Lightbulb size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#111]">Design Defaults</h2>
                  <p className="text-xs text-gray-400 font-medium tracking-wide">Preset configurations for new projects</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">Default Color Temp</label>
                  <div className="relative group/select">
                    <select 
                      value={defaultColorTemp}
                      onChange={(e) => setDefaultColorTemp(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-4 text-sm font-medium text-[#111] focus:outline-none focus:ring-1 focus:ring-[#F6B45A] focus:border-[#F6B45A] transition-all appearance-none shadow-sm cursor-pointer hover:border-gray-300"
                    >
                      {COLOR_TEMPERATURES.map(t => (
                        <option key={t.id} value={t.id}>{t.kelvin} — {t.description}</option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover/select:text-[#111] transition-colors">
                      <ChevronDown size={16} strokeWidth={2} />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">Default Design Template</label>
                  <div className="relative group/select">
                    <select 
                      value={defaultDesignTemplate}
                      onChange={(e) => setDefaultDesignTemplate(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-4 text-sm font-medium text-[#111] focus:outline-none focus:ring-1 focus:ring-[#F6B45A] focus:border-[#F6B45A] transition-all appearance-none shadow-sm cursor-pointer hover:border-gray-300"
                    >
                      <option value="">None (Empty Notes)</option>
                      {QUICK_PROMPTS.map(p => (
                        <option key={p.label} value={p.label}>{p.label}</option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover/select:text-[#111] transition-colors">
                      <ChevronDown size={16} strokeWidth={2} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Save Button Container */}
            <div className="flex justify-center pt-4">
              <button 
                onClick={handleSave}
                disabled={loading}
                className="bg-[#111] text-white px-12 py-4 rounded-full font-bold text-xs uppercase tracking-[0.2em] hover:bg-black hover:scale-105 transition-all flex items-center gap-3 disabled:opacity-70 disabled:hover:scale-100 shadow-xl shadow-black/20 group border border-gray-800"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} className="group-hover:text-[#F6B45A] transition-colors" />}
                Save Changes
              </button>
            </div>

          </div>

          {/* Right Column: Subscription */}
          <div className="lg:col-span-4">
             <div className="bg-white rounded-[24px] border border-gray-100 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.03)] p-8 h-full flex flex-col transition-all duration-500 hover:shadow-[0_30px_60px_-15px_rgba(246,180,90,0.08)] relative overflow-hidden">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#F6B45A]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                <div className="flex items-center gap-4 mb-8 relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-[#111] flex items-center justify-center text-[#F6B45A] shadow-lg shadow-black/10">
                    <CreditCard size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[#111]">Subscription</h2>
                    <p className="text-xs text-gray-400 font-medium tracking-wide">Plan & Billing</p>
                  </div>
                </div>

                <div className="flex-1 relative z-10">
                  {isPro ? (
                    // ACTIVE PRO STATE
                    <div className="space-y-8">
                       <div className="bg-[#111] rounded-2xl p-6 flex flex-col items-center text-center shadow-xl shadow-black/10 border border-gray-800 relative overflow-hidden group">
                          <div className="absolute inset-0 bg-gradient-to-tr from-[#F6B45A]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                          <div className="p-3 bg-[#F6B45A] rounded-full text-black mb-4 shadow-[0_0_20px_rgba(246,180,90,0.4)]">
                            <Crown size={24} fill="currentColor" />
                          </div>
                          <p className="text-[10px] font-bold text-[#F6B45A] uppercase tracking-widest mb-2">Current Plan</p>
                          <p className="font-bold text-white text-2xl tracking-tight">
                            {subscription?.plan === 'pro_yearly' ? 'Pro Yearly' : 'Pro Monthly'}
                          </p>
                       </div>
                       
                       <div className="space-y-2 px-1 text-center">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Next Billing Date</p>
                          <p className="font-mono text-sm text-[#111] font-bold">
                            {new Date(subscription?.current_period_end || 0).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                          </p>
                       </div>
                    </div>
                  ) : (
                    // TRIAL / EXPIRED STATE
                    <div className="space-y-8">
                      {/* Highlight Card */}
                       <div className="bg-[#111] rounded-2xl p-6 relative overflow-hidden shadow-xl shadow-black/10 border border-gray-800">
                          {isTrialActive && (
                            <div className="absolute top-4 right-4">
                              <span className="bg-[#F6B45A] text-[#111] text-[9px] font-bold px-2 py-1 rounded-full uppercase tracking-wide shadow-[0_0_10px_rgba(246,180,90,0.4)]">
                                Free Trial
                              </span>
                            </div>
                          )}
                          
                          <div className="flex flex-col gap-1 mb-6">
                             <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Status</span>
                             <div className="flex items-baseline gap-2">
                               <span className={`text-2xl font-bold ${isTrialActive ? 'text-white' : 'text-gray-500'}`}>
                                 {isTrialActive ? `${daysRemaining} Days` : 'Expired'}
                               </span>
                               {isTrialActive && <span className="text-gray-500 text-xs font-medium">remaining</span>}
                             </div>
                          </div>

                          {/* Progress Bar */}
                          {isTrialActive && (
                            <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden mb-2">
                              <div 
                                className="h-full bg-[#F6B45A] rounded-full shadow-[0_0_10px_rgba(246,180,90,0.5)] transition-all duration-1000 ease-out"
                                style={{ width: `${100 - progressPercent}%` }} // Inverted logic for visual countdown
                              />
                            </div>
                          )}
                          
                          <p className="text-[10px] text-gray-500 leading-relaxed mt-4">
                            Upgrade to <span className="text-[#F6B45A] font-bold">Pro</span> for unlimited AI generations and 4K exports.
                          </p>
                       </div>
                    </div>
                  )}
                </div>

                <div className="mt-8 pt-6 border-t border-gray-50 relative z-10">
                  {isPro ? (
                    <button 
                      onClick={handleManageBilling}
                      disabled={billingLoading}
                      className="w-full bg-white border-2 border-gray-100 text-[#111] py-4 rounded-xl font-bold text-xs uppercase tracking-widest hover:border-[#111] hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                    >
                      {billingLoading && <Loader2 size={14} className="animate-spin" />}
                      Manage Billing
                    </button>
                  ) : (
                    <button 
                      onClick={onUpgrade}
                      className="w-full bg-[#111] text-white py-4 rounded-xl font-bold text-xs uppercase tracking-[0.15em] hover:bg-black group relative overflow-hidden shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#F6B45A]/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        Upgrade to Pro <Crown size={14} className="text-[#F6B45A]" />
                      </span>
                    </button>
                  )}
                </div>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};