import React, { useState } from 'react';
import { User, UserSettings, Subscription, TrialState, MarkerType } from '../types';
import { createPortalSession } from '../services/stripeService';
import { Save, Loader2, CreditCard, Crown, Clock, Building, Palette, Lightbulb, Sparkles } from 'lucide-react';
import { COLOR_TEMPERATURES } from '../constants';

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
  const [defaultFixtureType, setDefaultFixtureType] = useState<MarkerType>(userSettings?.default_fixture_type || 'up');

  // Calculate Trial Status
  const now = Date.now();
  const trialEnd = trialState?.trial_end || 0;
  const isTrialActive = now < trialEnd;
  const daysRemaining = Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24));
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
      default_fixture_type: defaultFixtureType
    };
    
    onSaveSettings(updated);
    setLoading(false);
  };

  const handleManageBilling = async () => {
    setBillingLoading(true);
    try {
      const { url } = await createPortalSession(user.id);
      // In a real app: window.location.href = url;
      alert(`[MOCK] Redirecting to Stripe Customer Portal...\n${url}`);
    } catch (e) {
      console.error(e);
    } finally {
      setBillingLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#FDFCFB] relative">
      {/* Subtle Warm Gradient Background */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-[#F6B45A]/5 to-transparent pointer-events-none" />

      <div className="max-w-4xl mx-auto px-12 py-12 relative z-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-[#111] rounded-lg text-[#F6B45A]">
            <Sparkles size={18} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[#111]">Settings</h1>
        </div>
        <p className="text-gray-400 font-medium text-sm mb-10 ml-11">Manage your profile, preferences, and subscription.</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Profile & Preferences */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Profile Card */}
            <div className="bg-white rounded-[24px] border border-gray-100 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.05)] p-8 hover:shadow-[0_20px_40px_-10px_rgba(246,180,90,0.05)] transition-shadow">
              <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-50">
                <div className="w-10 h-10 rounded-full bg-[#111] flex items-center justify-center text-white">
                  <Building size={18} />
                </div>
                <h2 className="font-bold text-lg text-[#111]">Company Profile</h2>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Account Email</label>
                  <div className="font-medium text-gray-900 bg-gray-50 px-4 py-3 rounded-xl border border-gray-100 font-mono text-sm">{user.email}</div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Company Name</label>
                  <input 
                    type="text" 
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#F6B45A] focus:border-[#F6B45A] transition-all shadow-sm"
                    placeholder="Acme Lighting Co."
                  />
                </div>
              </div>
            </div>

            {/* Defaults Card */}
            <div className="bg-white rounded-[24px] border border-gray-100 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.05)] p-8 hover:shadow-[0_20px_40px_-10px_rgba(246,180,90,0.05)] transition-shadow">
              <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-50">
                <div className="w-10 h-10 rounded-full bg-[#111] flex items-center justify-center text-white">
                  <Lightbulb size={18} />
                </div>
                <h2 className="font-bold text-lg text-[#111]">Design Defaults</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Default Color Temp</label>
                  <div className="relative">
                    <select 
                      value={defaultColorTemp}
                      onChange={(e) => setDefaultColorTemp(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#F6B45A] focus:border-[#F6B45A] transition-all appearance-none shadow-sm cursor-pointer"
                    >
                      {COLOR_TEMPERATURES.map(t => (
                        <option key={t.id} value={t.id}>{t.kelvin} - {t.description}</option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                      <div className="w-2 h-2 border-r border-b border-gray-400 rotate-45 transform -translate-y-0.5"></div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Default Tool</label>
                  <div className="relative">
                    <select 
                      value={defaultFixtureType}
                      onChange={(e) => setDefaultFixtureType(e.target.value as MarkerType)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#F6B45A] focus:border-[#F6B45A] transition-all appearance-none shadow-sm cursor-pointer"
                    >
                      <option value="up">Up Light</option>
                      <option value="path">Path Light</option>
                      <option value="gutter">Gutter Mount</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                      <div className="w-2 h-2 border-r border-b border-gray-400 rotate-45 transform -translate-y-0.5"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4">
              <button 
                onClick={handleSave}
                disabled={loading}
                className="bg-[#111] text-white px-8 py-3.5 rounded-full font-bold text-xs uppercase tracking-widest hover:bg-black hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-3 disabled:opacity-70 disabled:hover:translate-y-0 shadow-lg shadow-black/20"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Save Changes
              </button>
            </div>

          </div>

          {/* Right Column: Billing */}
          <div className="lg:col-span-1">
             <div className="bg-white rounded-[24px] border border-gray-100 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.05)] p-8 h-full flex flex-col transition-shadow hover:shadow-[0_20px_40px_-10px_rgba(246,180,90,0.05)]">
                <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-50">
                  <div className="w-10 h-10 rounded-full bg-[#111] flex items-center justify-center text-white">
                    <CreditCard size={18} />
                  </div>
                  <h2 className="font-bold text-lg text-[#111]">Subscription</h2>
                </div>

                <div className="flex-1">
                  {isPro ? (
                    // ACTIVE PRO STATE
                    <div className="space-y-6">
                       <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
                          <div className="bg-[#111] text-[#F6B45A] p-2.5 rounded-xl shadow-md">
                            <Crown size={20} fill="currentColor" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">Plan Active</p>
                            <p className="font-bold text-[#111] text-lg">
                              {subscription?.plan === 'pro_yearly' ? 'Pro Yearly' : 'Pro Monthly'}
                            </p>
                          </div>
                       </div>
                       
                       <div className="space-y-2 px-1">
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Renews on</p>
                          <p className="font-mono text-sm text-[#111] font-medium">
                            {new Date(subscription?.current_period_end || 0).toLocaleDateString()}
                          </p>
                       </div>
                    </div>
                  ) : (
                    // TRIAL / EXPIRED STATE
                    <div className="space-y-6">
                      <div className={`rounded-2xl p-5 flex items-center gap-4 border shadow-sm ${isTrialActive ? 'bg-[#F6B45A]/10 border-[#F6B45A]/20' : 'bg-gray-50 border-gray-200'}`}>
                          <div className={`p-2.5 rounded-xl shadow-md ${isTrialActive ? 'bg-[#F6B45A] text-white' : 'bg-gray-200 text-gray-500'}`}>
                            <Clock size={20} />
                          </div>
                          <div>
                            <p className={`text-[10px] font-bold uppercase tracking-wide mb-0.5 ${isTrialActive ? 'text-[#F6B45A]' : 'text-gray-400'}`}>
                              {isTrialActive ? 'Free Trial' : 'Trial Expired'}
                            </p>
                            <p className={`font-bold text-lg ${isTrialActive ? 'text-[#111]' : 'text-gray-500'}`}>
                              {isTrialActive ? `${daysRemaining} days left` : 'Upgrade to continue'}
                            </p>
                          </div>
                       </div>

                       <p className="text-sm text-gray-500 leading-relaxed px-1">
                         Upgrade to <span className="font-bold text-[#111]">Pro</span> to generate unlimited high-res mockups and save your designs.
                       </p>
                    </div>
                  )}
                </div>

                <div className="mt-8 pt-6 border-t border-gray-50">
                  {isPro ? (
                    <button 
                      onClick={handleManageBilling}
                      disabled={billingLoading}
                      className="w-full bg-white border border-gray-200 text-gray-700 py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center gap-2 shadow-sm"
                    >
                      {billingLoading && <Loader2 size={14} className="animate-spin" />}
                      Manage Billing
                    </button>
                  ) : (
                    <button 
                      onClick={onUpgrade}
                      className="w-full bg-[#111] text-white py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-black hover:shadow-xl hover:-translate-y-0.5 transition-all shadow-lg"
                    >
                      Upgrade to Pro
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