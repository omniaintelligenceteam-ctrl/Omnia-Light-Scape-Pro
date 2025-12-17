import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Pool } from '@neondatabase/serverless';
import { Loader2, AlertCircle } from 'lucide-react';

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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (email: string) => {
    setIsLoading(true);
    setError(null);

    if (!DATABASE_URL) {
      setError('Database connection configuration missing');
      setIsLoading(false);
      throw new Error('Database connection failed');
    }

    let pool: Pool | null = null;
    try {
      pool = new Pool({ connectionString: DATABASE_URL });
      
      // Strict connection attempt
      const client = await pool.connect();
      
      try {
        const { rows } = await client.query('SELECT id, email, name FROM users WHERE email = $1', [email]);
        
        if (rows.length > 0) {
          const dbUser = rows[0];
          setUser({
            id: dbUser.id,
            email: dbUser.email,
            name: dbUser.name
          });
          setIsAuthenticated(true);
        } else {
          setError("Access denied. Email not found in professional directory.");
        }
      } finally {
        client.release();
      }
    } catch (err: any) {
      console.error("Neon Auth Critical Error:", err);
      setError('Database connection failed. Please check network status.');
      throw new Error('Database connection failed');
    } finally {
      if (pool) await pool.end();
      setIsLoading(false);
    }
  };

  const logout = () => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      try {
        await login(email);
      } catch (err) {
        // Error is handled in context and displayed below
      }
    }
  };

  return (
    <div className="min-h-screen w-full bg-white flex flex-col font-sans">
      <header className="bg-[#111] py-14 flex items-center justify-center shrink-0">
        <div className="flex items-baseline gap-4">
          <span className="font-serif text-5xl md:text-6xl font-bold text-[#F6B45A] tracking-tight">Omnia</span>
          <span className="font-serif italic font-bold text-lg md:text-xl tracking-[0.2em] text-white uppercase opacity-90">Light Scape Pro</span>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <h1 className="font-serif text-4xl font-bold text-[#111] tracking-tight mb-3">Professional Sign In</h1>
            <p className="text-gray-400 font-medium text-sm">Authorized personnel only. Direct database verification required.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#111] ml-1">Corporate Email</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-14 px-6 bg-[#f8f8f8] text-[#111] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#111] transition-all text-sm font-medium placeholder:text-gray-400"
                placeholder="architect@firm.com"
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl text-xs font-bold flex items-center gap-3 border border-red-100 animate-in fade-in slide-in-from-top-1">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 bg-[#111] text-white rounded-xl font-bold text-[11px] uppercase tracking-[0.3em] hover:bg-black transition-all active:scale-[0.98] shadow-2xl shadow-black/20 flex items-center justify-center gap-3 group"
            >
              {isLoading ? (
                <Loader2 size={20} className="animate-spin text-[#F6B45A]" />
              ) : (
                <>VERIFY IDENTITY</>
              )}
            </button>
          </form>
        </div>
      </main>

      <footer className="w-full py-8 flex flex-col items-center justify-center gap-2">
        <p className="text-[10px] text-gray-300 font-bold uppercase tracking-[0.25em]">
          SECURE NEON INFRASTRUCTURE
        </p>
      </footer>
    </div>
  );
};

export const AccountView = () => {
  const { user, logout, isAuthenticated } = useAuth();

  if (!isAuthenticated) return null;

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 md:p-12 rounded-[32px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-gray-100 max-w-lg w-full">
            <h1 className="text-3xl font-bold text-[#111] mb-8 tracking-tighter border-b border-gray-50 pb-4">Account Profile</h1>
            
            <div className="space-y-6">
                <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Database ID</label>
                    <p className="text-sm font-mono text-gray-500 mt-1">{user?.id}</p>
                </div>
                <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Verified Email</label>
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