import React, { useEffect, useRef, useState } from "react";
import type {
  User,
  UserSettings,
  Subscription,   // kept for compatibility (unused)
  TrialState,     // kept for compatibility (unused)
  AppSettings,
  ColorTemperature,
  FixturePricing,
} from "../types";
import {
  Save,
  Loader2,
  CreditCard,
  Building,
  Lightbulb,
  ChevronDown,
  Mail,
  ShieldCheck,
  LogOut,
  Sliders,
  DollarSign,
  Tag,
  Upload,
  Trash2,
  MessageCircle,
  Crown,
  RefreshCw,
} from "lucide-react";
import { COLOR_TEMPERATURES, QUICK_PROMPTS, DEFAULT_PRICING } from "../constants";
import { Slider } from "./Slider";
import { Toggle } from "./Toggle";

interface SettingsPageProps {
  user: User;
  userSettings: UserSettings | null;

  // Legacy Stripe-era props (now unused, but kept so existing App.tsx compiles)
  subscription: Subscription | null;
  trialState: TrialState | null;

  onSaveSettings: (newSettings: UserSettings) => void;
  onUpgrade: () => void;
  onLogout: () => void;

  appSettings: AppSettings;
  setAppSettings: (s: AppSettings) => void;

  selectedTemp: ColorTemperature;
  setSelectedTemp: (t: ColorTemperature) => void;

  onToggleChat: () => void;
}

interface SettingsSectionProps {
  title: string;
  subtitle: string;
  icon: any;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

type BillingStatus = {
  active: boolean;
  status: string;
  planKey?: string;
  ym?: string;
  creditsTotal: number;
  creditsUsed: number;
  creditsRemaining: number;
};

function getDeviceId() {
  const key = "device_id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = (crypto as any)?.randomUUID ? (crypto as any).randomUUID() : `dev-${Date.now()}-${Math.random()}`;
    localStorage.setItem(key, id);
  }
  return id;
}

const SettingsSection: React.FC<SettingsSectionProps> = ({
  title,
  subtitle,
  icon: Icon,
  isOpen,
  onToggle,
  children,
}) => {
  return (
    <div
      className={`bg-white rounded-[24px] border border-gray-100 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.03)] overflow-hidden transition-all duration-500 ${
        isOpen ? "ring-1 ring-[#F6B45A]/20 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.06)]" : ""
      }`}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-6 md:p-8 hover:bg-gray-50/50 transition-colors text-left group"
      >
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${
              isOpen
                ? "bg-[#111] text-[#F6B45A] shadow-lg shadow-black/10 scale-110"
                : "bg-gray-50 text-gray-400 group-hover:bg-white group-hover:shadow-sm"
            }`}
          >
            <Icon size={20} />
          </div>
          <div>
            <h2 className={`text-lg font-bold transition-colors ${isOpen ? "text-[#111]" : "text-gray-600"}`}>
              {title}
            </h2>
            <p className="text-xs text-gray-400 font-medium tracking-wide">{subtitle}</p>
          </div>
        </div>
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
            isOpen ? "rotate-180 bg-gray-100 text-[#111]" : "text-gray-300"
          }`}
        >
          <ChevronDown size={20} />
        </div>
      </button>

      <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isOpen ? "max-h-[3000px] opacity-100" : "max-h-0 opacity-0"}`}>
        <div className="p-8 pt-0 border-t border-gray-50 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="pt-6">{children}</div>
        </div>
      </div>
    </div>
  );
};

export const SettingsPage: React.FC<SettingsPageProps> = ({
  user,
  userSettings,
  onSaveSettings,
  onUpgrade,
  onLogout,
  appSettings,
  setAppSettings,
  selectedTemp,
  setSelectedTemp,
  onToggleChat,
}) => {
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>("lighting");

  // Billing status (PayPal + monthly credits) from server
  const [billing, setBilling] = useState<BillingStatus | null>(null);
  const [billingLoading, setBillingLoading] = useState(false);
  const [billingError, setBillingError] = useState<string | null>(null);

  // Local state for form
  const [companyName, setCompanyName] = useState(userSettings?.company_name || "");
  const [logoUrl, setLogoUrl] = useState(userSettings?.logo_url || "");
  const [defaultColorTemp, setDefaultColorTemp] = useState(userSettings?.default_color_temp || "3000k");
  const [defaultDesignTemplate, setDefaultDesignTemplate] = useState(userSettings?.default_design_template || "");

  const logoInputRef = useRef<HTMLInputElement>(null);

  // Pricing State
  const [pricingConfig, setPricingConfig] = useState<FixturePricing[]>(() => {
    const currentPricing = userSettings?.fixture_pricing || [];
    return DEFAULT_PRICING.map((def) => {
      const existing = currentPricing.find((p) => p.fixtureType === def.fixtureType);
      return existing ? { ...existing } : { ...def, id: `def_${def.fixtureType}` };
    });
  });

  // If userSettings arrives later, sync form fields once
  useEffect(() => {
    if (!userSettings) return;
    setCompanyName(userSettings.company_name || "");
    setLogoUrl(userSettings.logo_url || "");
    setDefaultColorTemp(userSettings.default_color_temp || "3000k");
    setDefaultDesignTemplate(userSettings.default_design_template || "");
    setPricingConfig(() => {
      const currentPricing = userSettings.fixture_pricing || [];
      return DEFAULT_PRICING.map((def) => {
        const existing = currentPricing.find((p) => p.fixtureType === def.fixtureType);
        return existing ? { ...existing } : { ...def, id: `def_${def.fixtureType}` };
      });
    });
  }, [userSettings]);

  const toggleSection = (id: string) => {
    setActiveSection((prev) => (prev === id ? null : id));
  };

  const updatePricingItem = (index: number, field: keyof FixturePricing, value: any) => {
    const next = [...pricingConfig];
    next[index] = { ...next[index], [field]: value };
    setPricingConfig(next);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) setLogoUrl(ev.target.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoUrl("");
    if (logoInputRef.current) logoInputRef.current.value = "";
  };

  const handleSave = async () => {
    if (!userSettings) return;
    setLoading(true);

    // tiny UX delay so button feedback feels real
    await new Promise((resolve) => setTimeout(resolve, 400));

    const updated: UserSettings = {
      ...userSettings,
      company_name: companyName,
      logo_url: logoUrl,
      default_color_temp: defaultColorTemp,
      default_design_template: defaultDesignTemplate,
      fixture_pricing: pricingConfig,
    };

    onSaveSettings(updated);
    setLoading(false);
  };

  const refreshBilling = async () => {
    setBillingLoading(true);
    setBillingError(null);
    try {
      const resp = await fetch("/api/billing/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId: getDeviceId() }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.error || "Failed to fetch billing status");

      setBilling({
        active: !!data.active,
        status: String(data.status || "UNKNOWN"),
        planKey: data.planKey,
        ym: data.ym,
        creditsTotal: Number(data.creditsTotal || 0),
        creditsUsed: Number(data.creditsUsed || 0),
        creditsRemaining: Number(data.creditsRemaining || 0),
      });
    } catch (e: any) {
      setBilling(null);
      setBillingError(e?.message || "Billing status failed.");
    } finally {
      setBillingLoading(false);
    }
  };

  useEffect(() => {
    refreshBilling();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isPro = billing?.active === true;

  return (
    <div className="flex-1 overflow-y-auto bg-[#FDFCFB] relative font-sans text-[#111]">
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-gray-100/50 to-transparent pointer-events-none" />

      <div className="max-w-6xl mx-auto px-12 py-16 relative z-10 pb-32">
        <div className="mb-12 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-[#111] mb-2">Settings</h1>
            <p className="text-gray-400 font-medium text-sm tracking-wide">
              Manage your professional profile and workspace preferences.
            </p>
          </div>

          <div className="flex flex-col items-center gap-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">AI Assistant</span>
            <button
              onClick={onToggleChat}
              className="w-14 h-14 bg-[#111] text-[#F6B45A] rounded-full shadow-[0_20px_40px_-10px_rgba(0,0,0,0.03)] flex items-center justify-center hover:scale-110 hover:bg-[#F6B45A] hover:text-[#111] transition-all duration-300 group"
              title="Open AI Assistant"
            >
              <MessageCircle size={26} strokeWidth={1.5} className="group-hover:fill-current transition-all" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left Column */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            <SettingsSection
              title="Lighting Configuration"
              subtitle="Adjust settings for your current design session"
              icon={Sliders}
              isOpen={activeSection === "lighting"}
              onToggle={() => toggleSection("lighting")}
            >
              <div className="mb-8">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em] mb-4">Color Temperature</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {COLOR_TEMPERATURES.map((temp) => (
                    <button
                      key={temp.id}
                      onClick={() => setSelectedTemp(temp)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all text-center ${
                        selectedTemp.id === temp.id
                          ? "bg-[#111] border-[#111] text-white shadow-lg"
                          : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                      }`}
                    >
                      <div
                        className="w-4 h-4 rounded-full shadow-sm border border-black/5"
                        style={{ backgroundColor: temp.color }}
                      />
                      <span className="text-xs font-bold">{temp.kelvin}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Slider
                  label="Ambient Light (Time of Day)"
                  value={appSettings.ambientLight}
                  onChange={(val) => setAppSettings({ ...appSettings, ambientLight: val })}
                  dark={false}
                />
                <Slider
                  label="Fixture Intensity"
                  value={appSettings.intensity}
                  onChange={(val) => setAppSettings({ ...appSettings, intensity: val })}
                  dark={false}
                />
                <Slider
                  label="Shadow Contrast"
                  value={appSettings.shadowContrast}
                  onChange={(val) => setAppSettings({ ...appSettings, shadowContrast: val })}
                  dark={false}
                />
              </div>

              <div className="mt-8 pt-6 border-t border-gray-50 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
                <Toggle
                  label="Dark Sky Mode"
                  checked={appSettings.darkSkyMode}
                  onChange={(c) => setAppSettings({ ...appSettings, darkSkyMode: c })}
                  dark={false}
                />
                <Toggle
                  label="Preserve Non-Lit Areas"
                  checked={appSettings.preserveNonLit}
                  onChange={(c) => setAppSettings({ ...appSettings, preserveNonLit: c })}
                  dark={false}
                />
                <Toggle
                  label="High Realism Engine"
                  checked={appSettings.highRealism}
                  onChange={(c) => setAppSettings({ ...appSettings, highRealism: c })}
                  dark={false}
                />
                <Toggle
                  label="Ultra Resolution (4K)"
                  checked={appSettings.ultraResolution}
                  onChange={(c) => setAppSettings({ ...appSettings, ultraResolution: c })}
                  dark={false}
                />
              </div>
            </SettingsSection>

            <SettingsSection
              title="Company Profile"
              subtitle="Your business identity on exports"
              icon={Building}
              isOpen={activeSection === "profile"}
              onToggle={() => toggleSection("profile")}
            >
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                <div className="md:col-span-4 space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">Company Logo</label>
                  <div className="relative group/logo">
                    <div
                      onClick={() => logoInputRef.current?.click()}
                      className={`w-full aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden relative ${
                        logoUrl ? "border-gray-200 bg-white" : "border-gray-200 hover:border-[#F6B45A] hover:bg-[#F6B45A]/5"
                      }`}
                    >
                      {logoUrl ? (
                        <img src={logoUrl} alt="Company Logo" className="w-full h-full object-contain p-4" />
                      ) : (
                        <>
                          <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center mb-2 group-hover/logo:bg-white group-hover/logo:shadow-md transition-all">
                            <Upload size={16} className="text-gray-400 group-hover/logo:text-[#F6B45A]" />
                          </div>
                          <span className="text-xs font-bold text-gray-400 group-hover/logo:text-[#F6B45A] transition-colors">Upload</span>
                        </>
                      )}
                    </div>

                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoUpload}
                    />

                    {logoUrl && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveLogo();
                        }}
                        className="absolute top-2 right-2 w-6 h-6 bg-red-50 text-red-500 rounded-full flex items-center justify-center opacity-0 group-hover/logo:opacity-100 transition-opacity hover:bg-red-500 hover:text-white"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-400 leading-tight">Visible on PDF quotes. Rec: 400x400px transparent PNG.</p>
                </div>

                <div className="md:col-span-8 flex flex-col gap-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 flex items-center gap-2">
                      <Mail size={12} /> Account Email
                    </label>
                    <div className="w-full bg-gray-50/50 border border-gray-100 rounded-xl px-4 py-4 text-sm font-medium text-gray-500 flex items-center justify-between">
                      {user.email}
                      <ShieldCheck size={14} className="text-green-500" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">Company Name</label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-4 text-sm font-medium text-[#111] placeholder:text-gray-300 focus:outline-none focus:ring-1 focus:ring-[#F6B45A] focus:border-[#F6B45A] transition-all shadow-sm hover:border-gray-300"
                      placeholder="e.g. Acme Lighting Design"
                    />
                  </div>
                </div>
              </div>
            </SettingsSection>

            <SettingsSection
              title="Company Pricing"
              subtitle="Set your standard unit prices for auto-quotes"
              icon={DollarSign}
              isOpen={activeSection === "pricing"}
              onToggle={() => toggleSection("pricing")}
            >
              <div className="space-y-8">
                {pricingConfig.map((item, idx) => (
                  <div
                    key={item.fixtureType}
                    className="border border-gray-100 rounded-xl p-6 hover:border-gray-200 transition-colors bg-gray-50/30"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-[10px] font-bold uppercase tracking-widest bg-gray-200 text-gray-600 px-2 py-1 rounded">
                        {item.fixtureType.toUpperCase()}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                      <div className="md:col-span-8 space-y-3">
                        <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 flex items-center gap-2">
                          <Tag size={12} /> Display Name
                        </label>
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => updatePricingItem(idx, "name", e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-[#111] focus:outline-none focus:ring-1 focus:ring-[#F6B45A] focus:border-[#F6B45A]"
                        />
                      </div>

                      <div className="md:col-span-4 space-y-3">
                        <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 flex items-center gap-2">
                          <DollarSign size={12} /> Unit Price
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                          <input
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) => updatePricingItem(idx, "unitPrice", Number(e.target.value))}
                            className="w-full bg-white border border-gray-200 rounded-xl pl-8 pr-4 py-3 text-sm font-bold text-[#111] focus:outline-none focus:ring-1 focus:ring-[#F6B45A] focus:border-[#F6B45A]"
                          />
                        </div>
                      </div>

                      <div className="md:col-span-12 space-y-3">
                        <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">
                          Product Details / Warranty Info
                        </label>
                        <textarea
                          value={item.description}
                          onChange={(e) => updatePricingItem(idx, "description", e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-xs text-gray-600 focus:outline-none focus:ring-1 focus:ring-[#F6B45A] focus:border-[#F6B45A] min-h-[80px]"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </SettingsSection>

            <SettingsSection
              title="Design Defaults"
              subtitle="Preset configurations for new projects"
              icon={Lightbulb}
              isOpen={activeSection === "defaults"}
              onToggle={() => toggleSection("defaults")}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">Default Color Temp</label>
                  <div className="relative group/select">
                    <select
                      value={defaultColorTemp}
                      onChange={(e) => setDefaultColorTemp(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-4 text-sm font-medium text-[#111] focus:outline-none focus:ring-1 focus:ring-[#F6B45A] focus:border-[#F6B45A] transition-all appearance-none shadow-sm cursor-pointer hover:border-gray-300"
                    >
                      {COLOR_TEMPERATURES.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.kelvin} — {t.description}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover/select:text-[#111] transition-colors">
                      <ChevronDown size={16} strokeWidth={2} />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">Default Design Template</label>
                  <div className="relative group/select">
                    <select
                      value={defaultDesignTemplate}
                      onChange={(e) => setDefaultDesignTemplate(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-4 text-sm font-medium text-[#111] focus:outline-none focus:ring-1 focus:ring-[#F6B45A] focus:border-[#F6B45A] transition-all appearance-none shadow-sm cursor-pointer hover:border-gray-300"
                    >
                      <option value="">None (Empty Notes)</option>
                      {QUICK_PROMPTS.map((p) => (
                        <option key={p.label} value={p.label}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover/select:text-[#111] transition-colors">
                      <ChevronDown size={16} strokeWidth={2} />
                    </div>
                  </div>
                </div>
              </div>
            </SettingsSection>

            <div className="flex justify-center pt-8">
              <button
                onClick={handleSave}
                disabled={loading || !userSettings}
                className="bg-[#111] text-white px-12 py-4 rounded-full font-bold text-xs uppercase tracking-[0.2em] hover:bg-black hover:scale-105 transition-all flex items-center gap-3 disabled:opacity-70 disabled:hover:scale-100 shadow-xl shadow-black/20 group border border-gray-800"
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Save size={16} className="group-hover:text-[#F6B45A] transition-colors" />
                )}
                Save Changes
              </button>
            </div>

            <div className="flex justify-center pt-2 pb-10">
              <button
                onClick={onLogout}
                className="text-gray-400 hover:text-red-500 text-[10px] font-bold uppercase tracking-[0.2em] transition-colors flex items-center gap-2"
              >
                <LogOut size={12} /> Sign Out
              </button>
            </div>
          </div>

          {/* Right Column: Billing (PayPal + credits) */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-[24px] border border-gray-100 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.03)] p-8 h-full flex flex-col transition-all duration-500 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#F6B45A]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

              <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#111] flex items-center justify-center text-[#F6B45A] shadow-lg shadow-black/10">
                    <CreditCard size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[#111]">Billing</h2>
                    <p className="text-xs text-gray-400 font-medium tracking-wide">Monthly subscription & credits</p>
                  </div>
                </div>

                <button
                  onClick={refreshBilling}
                  disabled={billingLoading}
                  className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:text-[#111] hover:border-[#111] transition disabled:opacity-60"
                  title="Refresh billing status"
                >
                  <RefreshCw size={14} className={billingLoading ? "animate-spin" : ""} />
                </button>
              </div>

              <div className="flex-1 relative z-10">
                {billingError && (
                  <div className="p-3 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm">
                    {billingError}
                  </div>
                )}

                {!billing && !billingError && (
                  <div className="text-sm text-gray-500">Loading billing status…</div>
                )}

                {billing && (
                  <div className="space-y-6">
                    <div
                      className={`rounded-2xl p-6 border shadow-sm ${
                        isPro ? "bg-[#111] border-gray-800 text-white" : "bg-gray-50 border-gray-200 text-[#111]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className={`text-[10px] font-bold uppercase tracking-widest ${isPro ? "text-[#F6B45A]" : "text-gray-500"}`}>
                            Status
                          </div>
                          <div className="text-2xl font-bold mt-1">{isPro ? "Active" : "Not Active"}</div>
                          <div className={`text-xs mt-1 ${isPro ? "text-gray-300" : "text-gray-500"}`}>
                            {billing.status}
                            {billing.planKey ? ` • ${billing.planKey}` : ""}
                          </div>
                        </div>
                        <div className={`p-3 rounded-full ${isPro ? "bg-[#F6B45A] text-[#111]" : "bg-white border border-gray-200"}`}>
                          <Crown size={20} />
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-gray-200 bg-white p-6">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Credits</div>
                      <div className="mt-2 flex items-baseline gap-2">
                        <div className="text-3xl font-bold text-[#111]">{billing.creditsRemaining}</div>
                        <div className="text-sm text-gray-500">/ {billing.creditsTotal}</div>
                      </div>
                      <div className="mt-1 text-xs text-gray-500">Resets monthly (UTC {billing.ym || "—"})</div>

                      <div className="mt-4 h-2 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className="h-full bg-[#F6B45A]"
                          style={{
                            width:
                              billing.creditsTotal > 0
                                ? `${Math.max(0, Math.min(100, (billing.creditsUsed / billing.creditsTotal) * 100))}%`
                                : "0%",
                          }}
                        />
                      </div>
                      <div className="mt-2 text-xs text-gray-400">
                        Used {billing.creditsUsed} this month
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-6 border-t border-gray-50 relative z-10">
                <button
                  onClick={onUpgrade}
                  className="w-full bg-[#111] text-white py-4 rounded-xl font-bold text-xs uppercase tracking-[0.15em] hover:bg-black group relative overflow-hidden shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#F6B45A]/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {isPro ? "Change / Upgrade Plan" : "Upgrade to Pro"} <Crown size={14} className="text-[#F6B45A]" />
                  </span>
                </button>
              </div>
            </div>
          </div>
          {/* end right col */}
        </div>
      </div>
    </div>
  );
};