import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Neon Auth URL from environment variables
const AUTH_URL = import.meta.env.VITE_NEON_AUTH_URL;

interface AuthContextType {
  isAuthenticated: boolean;
  user: { email: string } | null;
  login: () => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const NeonAuthUIProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const checkAuth = async () => {
      const token = localStorage.getItem('neon_auth_token');
      if (token) {
        setIsAuthenticated(true);
        // Mock user data since actual Neon Auth might use OIDC/JWT decoding
        setUser({ email: 'user@example.com' });
      }
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  const login = () => {
    // In a full implementation, this would redirect to AUTH_URL or use neon-js to authenticate
    console.log(`Connecting to Neon Auth at: ${AUTH_URL}`);
    localStorage.setItem('neon_auth_token', 'mock_token_' + Date.now());
    setIsAuthenticated(true);
    setUser({ email: 'demo@omnia.com' });
  };

  const logout = () => {
    localStorage.removeItem('neon_auth_token');
    setIsAuthenticated(false);
    setUser(null);
  };

  return React.createElement(
    AuthContext.Provider,
    { value: { isAuthenticated, user, login, logout, isLoading } },
    children
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
  const { login, isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return React.createElement('div', { className: "flex flex-col items-center justify-center p-8" },
      React.createElement('div', { className: "text-center" },
        React.createElement('h2', { className: "text-xl font-bold mb-2" }, "Already Signed In"),
        React.createElement('a', { href: "/", className: "text-[#F6B45A] hover:underline font-bold" }, "Go to Dashboard")
      )
    );
  }

  return React.createElement('div', { className: "flex flex-col items-center justify-center min-h-[60vh] p-4 bg-[#FDFCFB]" },
    React.createElement('div', { className: "bg-white p-8 md:p-12 rounded-[32px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-gray-100 max-w-md w-full text-center" },
      React.createElement('div', { className: "w-16 h-16 bg-[#111] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-black/10" },
         React.createElement('span', { className: "font-serif text-2xl font-bold text-[#F6B45A]" }, "O")
      ),
      React.createElement('h2', { className: "text-3xl font-bold text-[#111] mb-2 tracking-tight" }, "Welcome Back"),
      React.createElement('p', { className: "text-gray-400 font-medium text-sm mb-8" }, "Sign in to access your projects."),
      
      React.createElement('button', {
        onClick: login,
        className: "w-full bg-[#111] text-white h-14 rounded-xl font-bold text-xs uppercase tracking-[0.2em] hover:bg-black transition-all active:scale-[0.99] shadow-lg shadow-black/20"
      }, "Sign In with Neon"),
      
      AUTH_URL ? React.createElement('p', { className: "mt-6 text-[10px] text-gray-300 font-mono break-all" }, `Connection: ${AUTH_URL}`) : null
    )
  );
};

export const AccountView = () => {
  const { user, logout, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return React.createElement('div', { className: "p-12 text-center" },
       React.createElement('p', { className: "text-gray-400" }, "Please sign in to view account details."),
       React.createElement('a', { href: "/auth", className: "text-[#111] font-bold mt-4 inline-block underline" }, "Go to Sign In")
    );
  }

  return React.createElement('div', { className: "flex-1 flex flex-col items-center justify-center min-h-[60vh] p-4 bg-[#FDFCFB]" },
    React.createElement('div', { className: "bg-white p-8 md:p-12 rounded-[32px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-gray-100 max-w-lg w-full" },
      React.createElement('h1', { className: "text-3xl font-bold text-[#111] mb-8 tracking-tight border-b border-gray-50 pb-4" }, "My Account"),
      React.createElement('div', { className: "space-y-6" },
        React.createElement('div', null,
          React.createElement('label', { className: "text-[10px] font-bold uppercase tracking-widest text-gray-400" }, "Email Address"),
          React.createElement('p', { className: "text-lg font-medium text-[#111] mt-1" }, user?.email)
        ),
        React.createElement('div', null,
          React.createElement('label', { className: "text-[10px] font-bold uppercase tracking-widest text-gray-400" }, "Auth Provider"),
          React.createElement('p', { className: "text-lg font-medium text-[#111] mt-1" }, "Neon Auth")
        ),
        React.createElement('div', { className: "pt-6" },
          React.createElement('button', {
            onClick: logout,
            className: "bg-red-50 text-red-600 px-8 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-red-100 transition-colors"
          }, "Sign Out")
        )
      )
    )
  );
};