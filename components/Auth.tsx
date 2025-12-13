import React, { useState } from 'react';
import { ArrowRight, Loader2, Mail, Lock, User as UserIcon, Sparkles, ChevronRight } from 'lucide-react';
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
    <div className="min-h-screen w-full flex bg-[#FCFCFC] font-sans text-[#111] overflow-hidden selection:bg-[#F6B45A] selection:text-white">
      
      {/* Left Side - Form Area */}
      <div className="w-full lg:w-[480px] xl:w-[550px] flex flex-col bg-white border-r border-gray-100 shadow-[20px_0_40px_-10px_rgba(0,0,0,0.02)] relative z-10">
          
          {/* Header - Black Background, Centered Text */}
          <div className="bg-[#111] py-8 px-8 flex items-center justify-center relative shadow-sm">
             <div className="flex items-baseline gap-3">
                <span className="font-serif text-4xl md:text-5xl font-bold text-[#F6B45A] tracking-tighter">Omnia</span>
                <span className="font-serif italic text-lg md:text-xl font-bold tracking-[0.15em] text-gray-300 uppercase">Light Scape Pro</span>
             </div>
             
             {/* Dev Bypass - Discreet Absolute Position */}
             <button 
                onClick={handleDevBypass}
                className="absolute right-2 top-2 opacity-0 hover:opacity-100 transition-opacity text-[10px] text-gray-700 font-mono"
             >
                DEV
             </button>
          </div>

          <div className="flex-1 flex flex-col justify-center px-8 md:px-12 py-8 overflow-y-auto">
             <div className="max-w-xs w-full mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="mb-10 text-center lg:text-left">
                    <h1 className="text-3xl md:text-4xl font-serif font-bold mb-3 tracking-tight text-[#111] text-center">
                    {isLogin ? 'Welcome back' : 'Start Designing'}
                    </h1>
                    <p className="text-gray-500 font-medium text-sm text-center">
                    {isLogin 
                        ? 'Enter your credentials to access your workspace.' 
                        : 'Create your professional profile to get started.'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLogin && (
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-widest text-[#111]">Full Name</label>
                        <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <UserIcon size={16} className="text-gray-400 group-focus-within:text-[#111] transition-colors" />
                        </div>
                        <input 
                            type="text" 
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg text-sm placeholder:text-gray-300 focus:outline-none focus:border-[#F6B45A] focus:ring-1 focus:ring-[#F6B45A] transition-all bg-white"
                            placeholder="Jane Doe"
                        />
                        </div>
                    </div>
                    )}

                    <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-[#111]">Email</label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail size={16} className="text-gray-400 group-focus-within:text-[#111] transition-colors" />
                        </div>
                        <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg text-sm placeholder:text-gray-300 focus:outline-none focus:border-[#F6B45A] focus:ring-1 focus:ring-[#F6B45A] transition-all bg-white"
                        placeholder="name@company.com"
                        />
                    </div>
                    </div>

                    <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                        <label className="text-[11px] font-bold uppercase tracking-widest text-[#111]">Password</label>
                        {isLogin && (
                        <button type="button" className="text-[10px] font-bold text-gray-400 hover:text-[#111] transition-colors">
                            Forgot Password?
                        </button>
                        )}
                    </div>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock size={16} className="text-gray-400 group-focus-within:text-[#111] transition-colors" />
                        </div>
                        <input 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg text-sm placeholder:text-gray-300 focus:outline-none focus:border-[#F6B45A] focus:ring-1 focus:ring-[#F6B45A] transition-all bg-white"
                        placeholder="••••••••"
                        />
                    </div>
                    </div>

                    {error && (
                    <div className="p-3 bg-red-50 text-red-600 text-xs font-medium rounded-lg flex items-center gap-2 animate-in slide-in-from-top-1">
                        <span className="w-1 h-1 rounded-full bg-red-600 block"></span>
                        {error}
                    </div>
                    )}

                    <button 
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#111] text-white rounded-lg py-3.5 font-bold text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-black transition-all hover:scale-[1.01] shadow-lg shadow-black/10 disabled:opacity-70 disabled:hover:scale-100 mt-6"
                    >
                    {loading ? (
                        <Loader2 size={16} className="animate-spin text-[#F6B45A]" />
                    ) : (
                        <>
                        {isLogin ? 'Sign In' : 'Create Account'} 
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
                    className="group flex items-center justify-center gap-1 mx-auto text-xs text-gray-500 hover:text-[#111] transition-colors font-medium"
                >
                    {isLogin ? "New to Omnia? Create an account" : "Already have an account? Sign in"}
                    <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                </button>
                </div>
             </div>
          </div>
          
          <div className="py-6 text-center">
             <span className="text-[10px] text-gray-300 font-medium tracking-widest uppercase">© 2024 Omnia Design Suite</span>
          </div>
      </div>

      {/* Right Side - Image Area */}
      <div className="hidden lg:flex flex-1 relative bg-[#0a0a0a] overflow-hidden items-end p-16">
         {/* Background Image */}
         <div 
            className="absolute inset-0 bg-cover bg-center transition-transform duration-[40s] hover:scale-110"
            style={{ 
              backgroundImage: "url('https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=2666&auto=format&fit=crop')"
            }}
         />
         
         {/* Cinematic Overlay */}
         <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90"></div>
         <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-transparent opacity-80"></div>
         
         {/* Content Overlay */}
         <div className="relative z-20 max-w-xl animate-in slide-in-from-bottom-10 duration-1000 delay-200">
            <div className="flex items-center gap-2 mb-6">
               <Sparkles size={16} className="text-[#F6B45A]" />
               <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#F6B45A]">Light Scape Pro</span>
            </div>
            
            <blockquote className="mb-8 border-l-2 border-[#F6B45A] pl-6 py-1">
               <p className="text-3xl font-serif text-white leading-tight">
                  "The difference between good and great design is often just a matter of lighting."
               </p>
            </blockquote>
            
            <div className="flex items-center gap-4 text-white/40">
               <div className="h-px w-12 bg-white/20"></div>
               <p className="text-[10px] uppercase tracking-widest font-medium">Architectural Visualization</p>
            </div>
         </div>
      </div>

    </div>
  );
};
