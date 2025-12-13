
import React, { useState } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';
import { User, UserSettings, Subscription, TrialState } from '../types';

interface AuthProps {
  onLogin: (user: User) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Simulate network delay
    setTimeout(() => {
      setLoading(false);
      
      if (!email || !password || (!isLogin && !name)) {
        setError("Please fill in all fields.");
        return;
      }

      // Mock Authentication Logic using LocalStorage
      const storedUsers = JSON.parse(localStorage.getItem('lumina_users') || '[]');
      
      if (isLogin) {
        const foundUser = storedUsers.find((u: any) => u.email === email && u.password === password);
        if (foundUser) {
          // Construct valid User object (excluding password)
          const validUser: User = {
             id: foundUser.id,
             email: foundUser.email,
             name: foundUser.name,
             created_at: foundUser.created_at || Date.now(),
             auth_provider_id: foundUser.auth_provider_id || 'email'
          };
          onLogin(validUser);
        } else {
          setError("Invalid credentials. Please try again.");
        }
      } else {
        // Register
        if (storedUsers.find((u: any) => u.email === email)) {
          setError("User already exists with this email.");
          return;
        }
        
        const userId = Date.now().toString();
        const now = Date.now();
        const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
        
        // 1. Create User
        const newUser = {
          id: userId,
          email,
          password,
          name,
          created_at: now,
          auth_provider_id: 'email'
        };
        
        // 2. Create Default Settings
        const defaultSettings: UserSettings = {
           user_id: userId,
           default_color_temp: '3000k',
           default_beam_angle: 60,
           default_fixture_type: 'up',
           company_name: '',
           logo_url: ''
        };
        
        // 3. Create Subscription Record
        const defaultSubscription: Subscription = {
            user_id: userId,
            status: 'none',
            plan: 'pro_monthly', // placeholder default
            stripe_customer_id: '',
            stripe_subscription_id: '',
            current_period_end: 0
        };

        // 4. Create Trial State (7 Days from now)
        const defaultTrial: TrialState = {
            user_id: userId,
            has_had_trial_before: false,
            trial_start: now,
            trial_end: now + sevenDaysMs 
        };

        // Persist all "Tables"
        localStorage.setItem('lumina_users', JSON.stringify([...storedUsers, newUser]));
        
        const storedSettings = JSON.parse(localStorage.getItem('lumina_user_settings') || '[]');
        localStorage.setItem('lumina_user_settings', JSON.stringify([...storedSettings, defaultSettings]));

        const storedSubs = JSON.parse(localStorage.getItem('lumina_subscriptions') || '[]');
        localStorage.setItem('lumina_subscriptions', JSON.stringify([...storedSubs, defaultSubscription]));
        
        const storedTrials = JSON.parse(localStorage.getItem('lumina_trials') || '[]');
        localStorage.setItem('lumina_trials', JSON.stringify([...storedTrials, defaultTrial]));

        // Return sanitized user object
        const validUser: User = {
             id: newUser.id,
             email: newUser.email,
             name: newUser.name,
             created_at: newUser.created_at,
             auth_provider_id: newUser.auth_provider_id
        };
        onLogin(validUser);
      }
    }, 1200);
  };

  const handleDevBypass = () => {
      const devUserId = 'dev-master';
      const now = Date.now();
      
      const devUser: User = {
          id: devUserId,
          email: 'dev@omnia.com',
          name: 'Master Developer',
          created_at: now,
          auth_provider_id: 'dev_bypass'
      };

      // Ensure persistence for the dev user if they don't exist yet
      const storedUsers = JSON.parse(localStorage.getItem('lumina_users') || '[]');
      const existingDev = storedUsers.find((u: any) => u.id === devUserId);

      if (!existingDev) {
          localStorage.setItem('lumina_users', JSON.stringify([...storedUsers, devUser]));
          
          // Settings
          const settings: UserSettings = {
             user_id: devUserId,
             default_color_temp: '3000k',
             default_beam_angle: 60,
             default_fixture_type: 'up',
             company_name: 'Omnia Dev Studio',
             logo_url: ''
          };
          const allSettings = JSON.parse(localStorage.getItem('lumina_user_settings') || '[]');
          localStorage.setItem('lumina_user_settings', JSON.stringify([...allSettings, settings]));

          // Subscription (Give PRO access immediately)
          const sub: Subscription = {
              user_id: devUserId,
              status: 'active',
              plan: 'pro_yearly',
              current_period_end: now + (365 * 24 * 60 * 60 * 1000),
              stripe_customer_id: 'dev_cust_id',
              stripe_subscription_id: 'dev_sub_id'
          };
          const allSubs = JSON.parse(localStorage.getItem('lumina_subscriptions') || '[]');
          localStorage.setItem('lumina_subscriptions', JSON.stringify([...allSubs, sub]));

          // Trial
          const trial: TrialState = {
              user_id: devUserId,
              has_had_trial_before: true,
              trial_start: now,
              trial_end: now
          };
          const allTrials = JSON.parse(localStorage.getItem('lumina_trials') || '[]');
          localStorage.setItem('lumina_trials', JSON.stringify([...allTrials, trial]));
      }

      onLogin(devUser);
  };

  return (
    <div className="min-h-screen w-full flex bg-white font-sans text-[#111]">
        {/* Left Side (Form) */}
        <div className="w-full lg:w-[520px] xl:w-[580px] flex flex-col relative z-10 bg-white border-r border-gray-100 shadow-[20px_0_40px_-15px_rgba(0,0,0,0.02)]">
            
            {/* Header - Matches Screenshot */}
            <div className="bg-[#111] h-32 flex items-center justify-center shrink-0 relative">
                 <div className="flex items-baseline gap-3">
                    <span className="font-serif text-5xl md:text-6xl font-bold text-[#F6B45A] tracking-tight">Omnia</span>
                    <span className="font-serif italic font-semibold text-lg md:text-xl tracking-[0.15em] text-white uppercase ml-1">Light Scape Pro</span>
                 </div>
                 
                 {/* Dev Bypass Button - Top Right of Panel */}
                 <button 
                    onClick={handleDevBypass}
                    className="absolute top-4 right-4 opacity-0 hover:opacity-50 text-[10px] text-white/50 font-mono z-50 font-bold uppercase tracking-widest p-2"
                 >
                    DEV
                 </button>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 flex flex-col justify-center items-center px-8 md:px-16 py-8 overflow-y-auto">
                <div className="w-full max-w-sm animate-in fade-in slide-in-from-bottom-8 duration-700">
                    
                    <div className="text-center mb-12">
                        <h1 className="font-serif text-4xl md:text-6xl font-bold mb-4 text-[#111] tracking-tight">
                            {isLogin ? 'Welcome back' : 'Create account'}
                        </h1>
                        <p className="text-gray-500 font-medium text-base leading-relaxed">
                            {isLogin ? 'Enter your credentials to access your workspace.' : 'Start your 7-day free trial today.'}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {!isLogin && (
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-[#111]">Full Name</label>
                                <div className="relative">
                                    <input 
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full px-4 py-4 border border-gray-200 rounded-lg text-base focus:outline-none focus:border-[#111] transition-colors placeholder:text-gray-300 font-medium"
                                        placeholder="Jane Doe"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-[#111]">Email</label>
                            <input 
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-4 border border-gray-200 rounded-lg text-base focus:outline-none focus:border-[#111] transition-colors placeholder:text-gray-300 font-medium"
                                placeholder="name@company.com"
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-bold uppercase tracking-widest text-[#111]">Password</label>
                                {isLogin && (
                                    <button type="button" className="text-xs font-bold text-gray-400 hover:text-[#111] transition-colors">
                                        Forgot Password?
                                    </button>
                                )}
                            </div>
                            <input 
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-4 border border-gray-200 rounded-lg text-base focus:outline-none focus:border-[#111] transition-colors placeholder:text-gray-300 font-medium tracking-widest"
                                placeholder="••••••••"
                            />
                        </div>

                        {error && (
                            <div className="text-red-600 text-sm font-bold text-center bg-red-50 p-3 rounded-lg flex items-center justify-center gap-2">
                                <span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span>
                                {error}
                            </div>
                        )}

                        <button 
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#111] text-white h-14 rounded-lg font-bold text-sm uppercase tracking-[0.2em] hover:bg-black transition-all active:scale-[0.99] flex items-center justify-center gap-2 shadow-lg shadow-black/10 mt-6"
                        >
                            {loading && <Loader2 size={18} className="animate-spin text-[#F6B45A]" />}
                            {isLogin ? 'Sign In' : 'Sign Up'}
                        </button>
                    </form>

                    <div className="my-10 relative flex items-center justify-center">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-100"></div>
                        </div>
                        <span className="relative bg-white px-4 text-xs text-gray-300 font-bold uppercase tracking-widest">Or</span>
                    </div>

                    <div className="text-center">
                        <button 
                            onClick={() => { setIsLogin(!isLogin); setError(null); }}
                            className="text-sm font-bold text-gray-400 hover:text-[#111] transition-colors inline-flex items-center gap-1.5"
                        >
                            {isLogin ? "New to Omnia? Create an account" : "Already have an account? Sign in"}
                            <ArrowRight size={14} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="py-8 text-center shrink-0 bg-white">
                 <p className="text-[10px] text-gray-300 font-bold uppercase tracking-[0.2em]">
                    © 2024 Omnia Design Suite
                 </p>
            </div>

        </div>

        {/* Right Side (Image) */}
        <div className="hidden lg:flex flex-1 bg-[#111] relative overflow-hidden items-center justify-center">
             <div className="absolute inset-0 bg-cover bg-center opacity-70 transition-transform duration-[60s] hover:scale-105" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2070&auto=format&fit=crop')" }}></div>
             <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-transparent to-transparent"></div>
             <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent mix-blend-overlay"></div>
        </div>
    </div>
  );
};
