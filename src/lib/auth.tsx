
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Pool } from '@neondatabase/serverless';
import { Loader2, AlertCircle } from 'lucide-react';

// Use VITE_DATABASE_URL from environment variables for the connection string
const DATABASE_URL = import.meta.env.VITE_DATABASE_URL;

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

export const NeonAuthUIProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<NeonUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check local storage for persistent session
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
        // Fallback for demo purposes if no DB URL is provided
        console.warn("No VITE_DATABASE_URL found. Using mock login for demo.");
        const mockUser: NeonUser = {
            id: 'mock_user_' + Date.now(),
            email: email,
            name: email.split('@')[0]
        };
        completeLogin(mockUser);
        return;
      }

      // Connect to Neon using the Serverless driver
      const pool = new Pool({ connectionString: DATABASE_URL });
      
      // Query for user existence
      // Assuming a table 'users' exists with columns 'id', 'email', and optionally 'name'
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
        // User not found
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

// --- Auth Views ---

export const AuthView = () => {
  const { login, isLoading, error } = useAuth();
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) login(email);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-4 w-full max-w-md mx-auto">
      <div className="bg-white p-8 md:p-12 rounded-[32px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-gray-100 w-full text-center">
        <div className="w-16 h-16 bg-[#111] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-black/10">
           <span className="font-serif text-2xl font-bold text-[#F6B45A]">O</span>
        </div>
        <h2 className="text-3xl font-bold text-[#111] mb-2 tracking-tight">Welcome Back</h2>
        <p className="text-gray-400 font-medium text-sm mb-8">Sign in to access your projects.</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="text-left">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Email Address</label>
                <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full mt-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#F6B45A] transition-colors text-sm font-medium"
                    placeholder="you@company.com"
                />
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-xs font-bold flex items-center gap-2">
                    <AlertCircle size={14} />
                    {error}
                </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#111] text-white h-12 rounded-xl font-bold text-xs uppercase tracking-[0.2em] hover:bg-black transition-all active:scale-[0.99] shadow-lg shadow-black/20 flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 size={16} className="animate-spin text-[#F6B45A]" /> : 'Sign In'}
            </button>
        </form>
        
        <div className="mt-6 pt-6 border-t border-gray-50">
            <p className="text-[10px] text-gray-300 font-mono">
                Powered by Neon Serverless
            </p>
        </div>
      </div>
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
    <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] p-4">
        <div className="bg-white p-8 md:p-12 rounded-[32px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-gray-100 max-w-lg w-full">
            <h1 className="text-3xl font-bold text-[#111] mb-8 tracking-tight border-b border-gray-50 pb-4">My Account</h1>
            
            <div className="space-y-6">
                <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Email Address</label>
                    <p className="text-lg font-medium text-[#111] mt-1">{user?.email}</p>
                </div>
                
                {user?.id && (
                    <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">User ID</label>
                        <p className="text-sm font-mono text-gray-500 mt-1">{user.id}</p>
                    </div>
                )}

                <div className="pt-6">
                    <button
                        onClick={logout}
                        className="bg-red-50 text-red-600 px-8 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-red-100 transition-colors w-full md:w-auto"
                    >
                        Sign Out
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};
