import React, { useState } from 'react';
import { ArrowRight, Loader2, Mail, Lock, User as UserIcon } from 'lucide-react';
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
          setError("Invalid credentials.");
        }
      } else {
        // Register
        if (storedUsers.find((u: any) => u.email === email)) {
          setError("User already exists.");
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
    }, 1000);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#F9F9F9] font-sans text-gray-900 p-6">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-xl overflow-hidden flex min-h-[600px]">
        
        {/* Left Side - Form */}
        <div className="flex-1 p-12 flex flex-col justify-center">
          <div className="mb-10">
             <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center mb-6">
                <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
             </div>
             <h1 className="text-3xl font-bold tracking-tight mb-2">{isLogin ? 'Welcome back.' : 'Create account.'}</h1>
             <p className="text-gray-400 font-light text-sm">
               {isLogin ? 'Enter your credentials to access your projects.' : 'Start designing premium outdoor lighting today.'}
             </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Full Name</label>
                <div className="relative">
                  <UserIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-all"
                    placeholder="Jane Doe"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-all"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && <p className="text-red-500 text-xs font-medium">{error}</p>}

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white rounded-xl py-3.5 font-medium text-sm flex items-center justify-center gap-2 hover:bg-gray-800 transition-all hover:scale-[1.01] mt-4"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <>{isLogin ? 'Sign In' : 'Create Account'} <ArrowRight size={16} /></>}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button 
              onClick={() => { setIsLogin(!isLogin); setError(null); }}
              className="text-xs text-gray-500 hover:text-black transition-colors"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </div>

        {/* Right Side - Visual */}
        <div className="hidden md:flex flex-1 bg-black relative items-center justify-center overflow-hidden">
          <div className="absolute inset-0 opacity-40 bg-[url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center"></div>
          <div className="relative z-10 p-12 text-white">
            <h2 className="text-3xl font-bold leading-tight mb-4">Illuminate your vision.</h2>
            <p className="text-gray-300 font-light opacity-90">
              Join thousands of outdoor lighting professionals using AI to close more deals in seconds.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};