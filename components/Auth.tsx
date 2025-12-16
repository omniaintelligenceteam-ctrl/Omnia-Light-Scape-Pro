// components/Auth.tsx
import React, { useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import type { User, UserSettings } from "../types";
import { DEFAULT_PRICING } from "../constants";

interface AuthProps {
  onLogin: (user: User) => void;
}

type StoredUserRow = {
  id: string;
  email: string;
  password: string;
  name: string;
  created_at: number;
  auth_provider_id: string;
};

const USERS_KEY = "lumina_users";
const SETTINGS_KEY = "lumina_user_settings";
const CURRENT_USER_KEY = "lumina_current_user_id";
const DEV_BYPASS_KEY = "dev_bypass";
const DEVICE_ID_KEY = "device_id";

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

function ensureDeviceId() {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id =
      (crypto as any)?.randomUUID?.() ??
      `dev-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

function sanitizeUser(u: StoredUserRow): User {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    created_at: u.created_at || Date.now(),
    auth_provider_id: u.auth_provider_id || "email",
  };
}

function makeDefaultSettings(userId: string): UserSettings {
  // We include a superset of fields that your app has used historically.
  // If your UserSettings type is stricter/looser, this still works in practice.
  return {
    user_id: userId,

    company_name: "",
    logo_url: "",

    default_color_temp: "3000k",
    default_design_template: "",
    fixture_pricing: DEFAULT_PRICING,

    // legacy-ish fields (kept so older code doesn’t break)
    default_beam_angle: 60 as any,
    default_fixture_type: "up" as any,
  } as UserSettings;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const [error, setError] = useState<string | null>(null);

  const finishLogin = (user: User) => {
    // Make sure deviceId exists for billing/credits endpoints & Settings page
    ensureDeviceId();

    // Optional session persistence (App.tsx can read this on boot)
    localStorage.setItem(CURRENT_USER_KEY, user.id);

    onLogin(user);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password || (!isLogin && !name.trim())) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);

    // Simulate network delay
    setTimeout(() => {
      try {
        const storedUsers = readJson<StoredUserRow[]>(USERS_KEY, []);

        if (isLogin) {
          const found = storedUsers.find(
            (u) => u.email.toLowerCase() === cleanEmail && u.password === password
          );

          if (!found) {
            setError("Invalid credentials. Please try again.");
            setLoading(false);
            return;
          }

          // Normal login should NOT auto-enable dev bypass
          localStorage.removeItem(DEV_BYPASS_KEY);

          finishLogin(sanitizeUser(found));
          setLoading(false);
          return;
        }

        // Register
        const already = storedUsers.find((u) => u.email.toLowerCase() === cleanEmail);
        if (already) {
          setError("User already exists with this email.");
          setLoading(false);
          return;
        }

        const now = Date.now();
        const userId = String(now);

        const newUserRow: StoredUserRow = {
          id: userId,
          email: cleanEmail,
          password,
          name: name.trim(),
          created_at: now,
          auth_provider_id: "email",
        };

        // Save user
        writeJson(USERS_KEY, [...storedUsers, newUserRow]);

        // Ensure settings row exists
        const storedSettings = readJson<UserSettings[]>(SETTINGS_KEY, []);
        const hasSettings = storedSettings.some((s) => (s as any)?.user_id === userId);
        if (!hasSettings) {
          writeJson(SETTINGS_KEY, [...storedSettings, makeDefaultSettings(userId)]);
        }

        // New signup should NOT auto-enable dev bypass
        localStorage.removeItem(DEV_BYPASS_KEY);

        finishLogin(sanitizeUser(newUserRow));
        setLoading(false);
      } catch (err: any) {
        console.error(err);
        setError("Something went wrong. Please try again.");
        setLoading(false);
      }
    }, 900);
  };

  const handleDevBypass = () => {
    const devUserId = "dev-master";
    const now = Date.now();

    const devRow: StoredUserRow = {
      id: devUserId,
      email: "dev@omnia.com",
      password: "__dev__",
      name: "Master Developer",
      created_at: now,
      auth_provider_id: "dev_bypass",
    };

    // Persist dev user if missing
    const storedUsers = readJson<StoredUserRow[]>(USERS_KEY, []);
    const exists = storedUsers.some((u) => u.id === devUserId);
    if (!exists) {
      writeJson(USERS_KEY, [...storedUsers, devRow]);
    }

    // Persist dev settings if missing
    const storedSettings = readJson<UserSettings[]>(SETTINGS_KEY, []);
    const hasSettings = storedSettings.some((s) => (s as any)?.user_id === devUserId);
    if (!hasSettings) {
      const devSettings: UserSettings = {
        ...makeDefaultSettings(devUserId),
        company_name: "Omnia Dev Studio",
      } as UserSettings;
      writeJson(SETTINGS_KEY, [...storedSettings, devSettings]);
    }

    // DEV PASS FIX:
    // This is the single flag the rest of the app/paywall can check to bypass PayPal client ID.
    localStorage.setItem(DEV_BYPASS_KEY, "1");

    finishLogin(sanitizeUser(devRow));
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-black font-sans text-[#111] p-4">
      <div className="w-full max-w-[500px] flex flex-col relative z-10 bg-white shadow-[0_40px_100px_-15px_rgba(255,255,255,0.1)] rounded-[32px] overflow-hidden border border-gray-800">
        {/* Header */}
        <div className="bg-[#111] h-36 flex items-center justify-center shrink-0 relative">
          <div className="flex items-baseline gap-3">
            <span className="font-serif text-5xl md:text-6xl font-bold text-[#F6B45A] tracking-tight">
              Omnia
            </span>
            <span className="font-serif italic font-semibold text-lg md:text-xl tracking-[0.15em] text-white uppercase ml-1">
              Light Scape Pro
            </span>
          </div>

          {/* Dev Bypass Button */}
          <button
            onClick={handleDevBypass}
            className="absolute top-4 right-4 opacity-0 hover:opacity-50 text-[10px] text-white/50 font-mono z-50 font-bold uppercase tracking-widest p-2"
            type="button"
            title="Developer bypass"
          >
            DEV
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col justify-center items-center px-8 md:px-12 py-10">
          <div className="w-full animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="text-center mb-10">
              <h1 className="font-serif text-3xl md:text-4xl font-bold mb-3 text-[#111] tracking-tight">
                {isLogin ? "Welcome back" : "Create account"}
              </h1>
              <p className="text-gray-500 font-medium text-sm leading-relaxed">
                {isLogin
                  ? "Enter your credentials to access your workspace."
                  : "Create your account to start designing."}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {!isLogin && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#111]">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#111] transition-colors placeholder:text-gray-300 font-medium"
                    placeholder="Jane Doe"
                    autoComplete="name"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#111]">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#111] transition-colors placeholder:text-gray-300 font-medium"
                  placeholder="name@company.com"
                  autoComplete="email"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#111]">
                    Password
                  </label>
                  {isLogin && (
                    <button
                      type="button"
                      className="text-[10px] font-bold text-gray-400 hover:text-[#111] transition-colors"
                      onClick={() => setError("Password reset isn’t enabled in this demo yet.")}
                    >
                      Forgot Password?
                    </button>
                  )}
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#111] transition-colors placeholder:text-gray-300 font-medium tracking-widest"
                  placeholder="••••••••"
                  autoComplete={isLogin ? "current-password" : "new-password"}
                />
              </div>

              {error && (
                <div className="text-red-600 text-xs font-bold text-center bg-red-50 p-3 rounded-lg flex items-center justify-center gap-2">
                  <span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#111] text-white h-12 rounded-lg font-bold text-xs uppercase tracking-[0.2em] hover:bg-black transition-all active:scale-[0.99] flex items-center justify-center gap-2 shadow-lg shadow-black/10 mt-6 disabled:opacity-70"
              >
                {loading && <Loader2 size={16} className="animate-spin text-[#F6B45A]" />}
                {isLogin ? "Sign In" : "Sign Up"}
              </button>
            </form>

            <div className="my-8 relative flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-100"></div>
              </div>
              <span className="relative bg-white px-3 text-[10px] text-gray-300 font-bold uppercase tracking-widest">
                Or
              </span>
            </div>

            <div className="text-center">
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError(null);
                }}
                className="text-xs font-bold text-gray-400 hover:text-[#111] transition-colors inline-flex items-center gap-1.5"
                type="button"
              >
                {isLogin ? "New to Omnia? Create an account" : "Already have an account? Sign in"}
                <ArrowRight size={12} />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="py-6 text-center shrink-0 bg-white border-t border-gray-50">
          <p className="text-[10px] text-gray-300 font-bold uppercase tracking-[0.2em]">
            © 2024 Omnia Design Suite
          </p>
        </div>
      </div>
    </div>
  );
};