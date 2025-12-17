
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Using the provided Neon Auth URL
const AUTH_URL = "https://ep-still-bread-adzskgq8.neonauth.c-2.us-east-1.aws.neon.tech/neondb/auth";

interface NeonUser {
  id: string;
  email: string;
  name?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: NeonUser | null;
  login: () => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- Context Provider ---
export const NeonAuthUIProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<NeonUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate checking session with Neon Auth Client
    const checkSession = async () => {
      // In a real implementation using @neondatabase/neon-js auth helpers:
      // const session = await authClient.getSession();
      const storedToken = localStorage.getItem('neon_session_token');
      
      if (storedToken) {
        setIsAuthenticated(true);
        // Mocking user retrieval from token
        setUser({
          id: 'user_123',
          email: 'user@example.com',
          name: 'Demo User'
        });
      }
      setIsLoading(false);
    };
    checkSession();
  }, []);

  const login = () => {
    // In a real scenario, this redirects to the Neon Auth URL or opens a popup
    // window.location.href = AUTH_URL;
    console.log(`Authenticating against ${AUTH_URL}...`);
    
    // Simulating successful login callback
    localStorage.setItem('neon_session_token', 'valid_token');
    setIsAuthenticated(true);
    setUser({
        id: 'user_' + Date.now(),
        email: 'user@omnia.com',
        name: 'Omnia User'
    });
  };

  const logout = () => {
    localStorage.removeItem('neon_session_token');
    localStorage.removeItem('lumina_active_user'); // Clear legacy app state
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, isLoading }}>
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

// --- Helper Components (Simulating Neon Auth UI Kit) ---

export const AuthView = () => {
  const { login } = useAuth();
  
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-white rounded-3xl shadow-xl border border-gray-100 max-w-md w-full mx-auto">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-[#111] mb-2">Welcome to Omnia</h2>
        <p className="text-gray-500 text-sm">Sign in to manage your lighting projects.</p>
      </div>
      <button 
        onClick={login}
        className="w-full bg-[#111] text-white py-3 rounded-xl font-bold text-sm hover:bg-black transition-all shadow-lg flex items-center justify-center gap-2"
      >
        Sign In with Neon
      </button>
      <div className="mt-6 text-[10px] text-gray-300 font-mono text-center">
        Secured by Neon Auth
      </div>
    </div>
  );
};

export const AccountView = () => {
  const { user, logout } = useAuth();
  
  return (
    <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8 max-w-lg mx-auto">
        <h2 className="text-2xl font-bold text-[#111] mb-6">Account Settings</h2>
        
        <div className="space-y-4 mb-8">
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Email</label>
                <div className="text-[#111] font-medium">{user?.email}</div>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">User ID</label>
                <div className="text-[#111] font-medium font-mono text-xs">{user?.id}</div>
            </div>
        </div>

        <button 
            onClick={logout}
            className="w-full border border-red-200 text-red-500 hover:bg-red-50 py-3 rounded-xl font-bold text-sm transition-colors"
        >
            Sign Out
        </button>
    </div>
  );
};
