export interface ColorTemperature {
  id: string;
  kelvin: string;
  color: string;
  description: string;
}

export type MarkerType = "up" | "path" | "gutter";

export interface LightMarker {
  id: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  type: MarkerType;
  angle: number; // degrees (0-360)
  throw: number; // beam length (percentage relative to image width)
}

export interface AppSettings {
  darkSkyMode: boolean;
  preserveNonLit: boolean;
  highRealism: boolean;
  intensity: number;
  textureRealism: number;
  shadowContrast: number;
  ambientLight: number; // 0 = Pitch Black, 100 = Daylight
  ultraResolution: boolean;
}

export interface GenerationState {
  isGenerating: boolean;
  error: string | null;
}

// --- DATA MODEL ---

export interface User {
  id: string;
  auth_provider_id?: string; // 'google', 'email', etc.
  email: string;
  name: string;
  created_at: number; // timestamp
}

export type FixtureType = "up" | "path" | "gutter" | "transformer" | "custom";

export interface FixturePricing {
  id: string;
  fixtureType: FixtureType;
  name: string;
  description: string;
  unitPrice: number;
}

export interface UserSettings {
  user_id: string;

  company_name?: string;
  logo_url?: string;

  default_color_temp: string; // e.g. '3000k'
  default_beam_angle: number; // e.g. 60
  default_fixture_type: MarkerType;

  default_design_template?: string; // label of the Quick Prompt
  fixture_pricing?: FixturePricing[];
}

/**
 * Billing model (Stripe-free):
 * Your actual enforcement is done server-side via PayPal subscription + monthly credits.
 *
 * We keep these exports for compatibility with older components that still accept
 * `subscription` / `trialState` props, even if you don’t use them anymore.
 */
export type SubscriptionPlan =
  | "starter_15"
  | "pro_100"
  | "pro_250"
  | "pro_500"
  | "pro_1000"
  // legacy names still floating around older UI
  | "pro_monthly"
  | "pro_yearly";

export type SubscriptionStatus =
  | "active"
  | "canceled"
  | "past_due"
  | "trialing"
  | "none";

export interface Subscription {
  user_id: string;

  // Generic provider fields (no "stripe" wording anywhere)
  provider?: "paypal" | "unknown";
  provider_customer_id?: string;
  provider_subscription_id?: string;

  plan?: SubscriptionPlan;
  status: SubscriptionStatus;
  current_period_end?: number; // timestamp
}

export interface TrialState {
  user_id: string;
  trial_start?: number; // timestamp
  trial_end?: number; // timestamp
  has_had_trial_before: boolean;
}

// --- QUOTING SYSTEM ---

export interface QuoteItem {
  id: string;
  description: string; // title/product name
  details?: string; // long description / warranty info
  quantity: number;
  unitPrice: number;
  total: number;
  type: "fixture" | "labor" | "other";
}

export interface Quote {
  id: string;
  projectId?: string;
  clientName: string;
  clientAddress: string;
  date: string;
  items: QuoteItem[];
  subtotal: number;
  taxRate: number; // percentage
  taxAmount: number;
  total: number;
  notes: string;
  status: "draft" | "sent" | "approved";
}

export interface Project {
  id: string;
  userId: string;
  name: string;
  date: string;
  inputImage: string;
  outputImage: string;
  markers: LightMarker[];
  settings: AppSettings;
  quote?: Quote;
}