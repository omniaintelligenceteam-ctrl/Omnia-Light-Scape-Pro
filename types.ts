export interface ColorTemperature {
  id: string;
  kelvin: string;
  color: string;
  description: string;
}

// MarkerType for design markers functionality
// 'up' refers to Ground Staked Up Lights
export type MarkerType = 'up' | 'path' | 'gutter';

export interface LightMarker {
  id: string;
  x: number;
  y: number;
  type: MarkerType;
  angle: number;
  throw: number;
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

// --- DATA MODEL (DB SCHEMAS) ---

export interface User {
  id: string;
  auth_provider_id?: string; // 'google', 'email', etc.
  email: string;
  name: string;
  created_at: number; // Timestamp
}

export interface FixturePricing {
  id: string;
  fixtureType: 'up' | 'path' | 'gutter' | 'transformer' | 'custom';
  name: string;
  description: string;
  unitPrice: number;
}

export interface UserSettings {
  user_id: string;
  company_name?: string;
  logo_url?: string;
  default_color_temp: string; // e.g. '3000k'
  default_beam_angle: number; // e.g. 45
  default_design_template?: string; // Label of the Quick Prompt to use by default
  default_fixture_type?: string; 
  fixture_pricing?: FixturePricing[];
}

export type SubscriptionPlan = 'pro_monthly' | 'pro_yearly';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing' | 'none';

export interface Subscription {
  user_id: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  plan?: SubscriptionPlan;
  status: SubscriptionStatus;
  current_period_end?: number; // Timestamp
}

export interface TrialState {
  user_id: string;
  trial_start?: number; // Timestamp
  trial_end?: number; // Timestamp
  has_had_trial_before: boolean;
}

// --- QUOTING SYSTEM ---

export interface QuoteItem {
  id: string;
  description: string; // Acts as the Title / Product Name
  details?: string;    // Acts as the Long Description / Warranty info
  quantity: number;
  unitPrice: number;
  total: number;
  type: 'fixture' | 'labor' | 'other';
}

export interface Quote {
  id: string;
  projectId?: string; // Links to a saved design
  clientName: string;
  clientAddress: string;
  date: string;
  items: QuoteItem[];
  subtotal: number;
  taxRate: number; // percentage
  taxAmount: number;
  total: number;
  notes: string;
  status: 'draft' | 'sent' | 'approved';
}

export interface Project {
  id: string;
  userId: string;
  name: string;
  date: string;
  inputImage: string;
  outputImage: string;
  markers?: LightMarker[];
  settings: AppSettings;
  quote?: Quote;
}