import React, { useState } from 'react';
import { ArrowRight, Loader2, Mail, Lock, User as UserIcon, Sparkles } from 'lucide-react';
import { User, UserSettings, Subscription, TrialState } from '../types';
import { Logo } from './Logo';

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
    <div className="min-h-screen w-full flex bg-white font-sans text-[#111] overflow-hidden">
      
      {/* Left Side - Form Area */}
      <div className="w-full lg:w-[45%] xl:w-[40%] flex flex-col justify-center px-8 md:px-16 lg:px-24 xl:px-32 relative z-10 bg-white shadow-[20px_0_60px_-15px_rgba(0,0,0,0.05)]">
          
          <div className="absolute top-8 left-8 md:left-16">
            <Logo className="h-8 md:h-10" />
          </div>

          {/* Dev Bypass Button */}
          <button 
             onClick={handleDevBypass}
             className="absolute top-4 right-4 text-[9px] font-bold text-gray-300 hover:text-[#111] border border-transparent hover:border-gray-200 px-2 py-1 rounded transition-all uppercase tracking-widest"
             title="Developer Auto-Login"
          >
             Dev Bypass
          </button>

          <div className="max-w-sm w-full mx-auto mt-12 md:mt-0 animate-in fade-in slide-in-from-bottom-8 duration-700">
             <div className="mb-10">
                <h1 className="text-4xl md:text-5xl font-serif font-medium mb-4 tracking-tight leading-[1.1]">
                  {isLogin ? 'Welcome back.' : 'Design starts here.'}
                </h1>
                <p className="text-gray-500 font-medium text-sm leading-relaxed">
                   {isLogin 
                     ? 'Sign in to access your projects and quotes.' 
                     : 'Create a professional account to generate AI lighting mockups in seconds.'}
                </p>
             </div>

             <form onSubmit={handleSubmit} className="space-y-5">
                {!isLogin && (
                  <div className="space-y-1 group">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1 group-focus-within:text-[#F6B45A] transition-colors">Full Name</label>
                    <div className="relative">
                      <UserIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#111] transition-colors" />
                      <input 
                        type="text" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-gray-50 border border-transparent rounded-xl py-3.5 pl-11 pr-4 text-sm font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#111] focus:border-transparent transition-all placeholder:text-gray-300"
                        placeholder="e.g. Jane Doe"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1 group">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1 group-focus-within:text-[#F6B45A] transition-colors">Email Address</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#111] transition-colors" />
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-gray-50 border border-transparent rounded-xl py-3.5 pl-11 pr-4 text-sm font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#111] focus:border-transparent transition-all placeholder:text-gray-300"
                      placeholder="name@company.com"
                    />
                  </div>
                </div>

                <div className="space-y-1 group">
                  <div className="flex justify-between items-center ml-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 group-focus-within:text-[#F6B45A] transition-colors">Password</label>
                    {isLogin && <button type="button" className="text-[10px] font-bold text-gray-400 hover:text-[#111] transition-colors">Forgot?</button>}
                  </div>
                  <div className="relative">
                    <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#111] transition-colors" />
                    <input 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-gray-50 border border-transparent rounded-xl py-3.5 pl-11 pr-4 text-sm font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#111] focus:border-transparent transition-all placeholder:text-gray-300"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-xs font-medium animate-in slide-in-from-top-2">
                    {error}
                  </div>
                )}

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#111] text-white rounded-xl py-4 font-bold text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-black transition-all hover:scale-[1.01] shadow-xl shadow-black/20 disabled:opacity-70 disabled:hover:scale-100 mt-2"
                >
                  {loading ? (
                    <Loader2 size={16} className="animate-spin text-[#F6B45A]" />
                  ) : (
                    <>
                      {isLogin ? 'Sign In' : 'Create Account'} 
                      <ArrowRight size={14} className="text-[#F6B45A]" />
                    </>
                  )}
                </button>
             </form>

             <div className="mt-8 text-center">
               <div className="relative mb-6">
                 <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
                 <div className="relative flex justify-center text-[10px] uppercase tracking-widest"><span className="bg-white px-2 text-gray-300">Or</span></div>
               </div>

               <button 
                 onClick={() => { setIsLogin(!isLogin); setError(null); }}
                 className="text-xs text-gray-500 hover:text-[#111] transition-colors font-medium underline underline-offset-4"
               >
                 {isLogin ? "New to Omnia? Create an account" : "Already have an account? Sign in"}
               </button>
             </div>
          </div>
          
          <div className="absolute bottom-8 left-0 w-full text-center">
             <span className="text-[10px] text-gray-300 font-medium tracking-widest uppercase">© 2024 Omnia Design Suite</span>
          </div>
      </div>

      {/* Right Side - Image Area */}
      <div className="hidden lg:flex flex-1 relative bg-black overflow-hidden">
         {/* Background Image */}
         <div 
            className="absolute inset-0 bg-cover bg-center transition-transform duration-[20s] hover:scale-105"
            style={{ 
              backgroundImage: "url('https://images.unsplash.com/photo-1613545325278-f24b0cae1224?q=80&w=2070&auto=format&fit=crop')"
            }}
         />
         
         {/* Dark Gradient Overlay */}
         <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10"></div>
         
         {/* Content Overlay */}
         <div className="absolute inset-0 p-16 flex flex-col justify-end text-white z-20">
            <div className="max-w-lg mb-12 animate-in slide-in-from-bottom-10 duration-1000 delay-200">
               <div className="w-12 h-1 bg-[#F6B45A] mb-8"></div>
               <blockquote className="mb-8">
                  <p className="text-3xl xl:text-4xl font-serif leading-snug italic text-gray-100">
                    "Light creates ambience and feel of a place, as well as the expression of a structure."
                  </p>
               </blockquote>
               <div className="flex items-center gap-3 opacity-80">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#F6B45A]">Architectural Lighting</span>
                  <div className="w-1 h-1 bg-white rounded-full"></div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Exterior Design</span>
               </div>
            </div>
         </div>
      </div>

    </div>
  );
};