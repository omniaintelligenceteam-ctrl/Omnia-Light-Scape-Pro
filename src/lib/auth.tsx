
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Pool } from '@neondatabase/serverless';
import { Loader2, AlertCircle, ArrowRight } from 'lucide-react';

const DATABASE_URL = process.env.VITE_DATABASE_URL;

interface NeonUser {
  id: string;
  email: string;
  name?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: NeonUser | null;
  login: (email: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const NeonAuthUIProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<NeonUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkSession = () => {
      const storedUser = localStorage.getItem('lumina_active_user');
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          setUser(parsed);
          setIsAuthenticated(true);
        } catch (e) {
          localStorage.removeItem('lumina_active_user');
        }
      }
      setIsLoading(false);
    };
    checkSession();
  }, []);

  const login = async (email: string) => {
    setIsLoading(true);
    setError(null);

    try {
      if (!DATABASE_URL) {
        const mockUser: NeonUser = {
            id: 'mock_user_' + Date.now(),
            email: email,
            name: email.split('@')[0]
        };
        completeLogin(mockUser);
        return;
      }

      const pool = new Pool({ connectionString: DATABASE_URL });
      const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      await pool.end();

      if (rows.length > 0) {
        const dbUser = rows[0];
        const appUser: NeonUser = {
            id: dbUser.id,
            email: dbUser.email,
            name: dbUser.name || email.split('@')[0]
        };
        completeLogin(appUser);
      } else {
        setError("User not found. Please ensure you are registered in the database.");
      }
    } catch (err: any) {
      console.error("Database Connection Error:", err);
      setError("Failed to connect to authentication server.");
    } finally {
      setIsLoading(false);
    }
  };

  const completeLogin = (appUser: NeonUser) => {
    setUser(appUser);
    setIsAuthenticated(true);
    localStorage.setItem('lumina_active_user', JSON.stringify(appUser));
  };

  const logout = () => {
    localStorage.removeItem('lumina_active_user');
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, isLoading, error }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within a NeonAuthUIProvider');
  }
  return context;
};

export const AuthView = () => {
  const { login, isLoading, error } = useAuth();
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) login(email);
  };

  return (
    <div className="min-h-screen w-full bg-white flex flex-col font-sans">
      {/* Top Header - Dark */}
      <header className="bg-[#111] py-14 flex items-center justify-center shrink-0">
        <div className="flex items-baseline gap-4">
          <span className="font-serif text-5xl md:text-6xl font-bold text-[#F6B45A] tracking-tight">Omnia</span>
          <span className="font-serif italic font-bold text-lg md:text-xl tracking-[0.2em] text-white uppercase opacity-90">Light Scape Pro</span>
        </div>
      </header>

      {/* Main Form - White Body */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <h1 className="font-serif text-4xl font-bold text-[#111] tracking-tight mb-3">Welcome back</h1>
            <p className="text-gray-400 font-medium text-sm">Enter your credentials to access your workspace.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#111] ml-1">Email</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-14 px-6 bg-[#333] text-white border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F6B45A] transition-all text-sm font-medium placeholder:text-gray-500"
                placeholder="name@company.com"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#111]">Password</label>
                <button type="button" className="text-[9px] font-bold text-gray-400 hover:text-[#111] transition-colors uppercase tracking-widest">
                  Forgot Password?
                </button>
              </div>
              <input 
                type="password" 
                className="w-full h-14 px-6 bg-[#333] text-white border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F6B45A] transition-all text-sm font-medium placeholder:text-gray-500 tracking-widest"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl text-xs font-bold flex items-center gap-3 border border-red-100 animate-in shake duration-300">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 bg-[#111] text-white rounded-xl font-bold text-[11px] uppercase tracking-[0.3em] hover:bg-black transition-all active:scale-[0.98] shadow-2xl shadow-black/20 flex items-center justify-center gap-3 group mt-4"
            >
              {isLoading ? (
                <Loader2 size={20} className="animate-spin text-[#F6B45A]" />
              ) : (
                <>SIGN IN</>
              )}
            </button>
          </form>

          <div className="mt-12 flex flex-col items-center gap-6">
            <div className="w-full flex items-center gap-4">
              <div className="h-px flex-1 bg-gray-100"></div>
              <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">OR</span>
              <div className="h-px flex-1 bg-gray-100"></div>
            </div>

            <button className="text-xs font-bold text-gray-400 hover:text-[#111] transition-colors flex items-center gap-2 group">
              New to Omnia? Create an account 
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </main>

      {/* Simplified Footer */}
      <footer className="w-full py-8 flex flex-col items-center justify-center gap-2">
        <p className="text-[10px] text-gray-300 font-bold uppercase tracking-[0.25em]">
          © 2024 Omnia Design Suite
        </p>
      </footer>
    </div>
  );
};

export const AccountView = () => {
  const { user, logout, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
       <div className="p-12 text-center">
          <p className="text-gray-400">Please sign in to view account details.</p>
          <a href="/auth" className="text-[#111] font-bold mt-4 inline-block underline">Go to Sign In</a>
       </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 md:p-12 rounded-[32px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-gray-100 max-w-lg w-full">
            <h1 className="text-3xl font-bold text-[#111] mb-8 tracking-tighter border-b border-gray-50 pb-4">Account Settings</h1>
            
            <div className="space-y-6">
                <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Email Address</label>
                    <p className="text-lg font-medium text-[#111] mt-1">{user?.email}</p>
                </div>
                
                <div className="pt-6">
                    <button
                        onClick={logout}
                        className="bg-[#111] text-white px-8 py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-black transition-colors w-full md:w-auto shadow-lg shadow-black/10"
                    >
                        Sign Out
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};
