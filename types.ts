export interface ColorTemperature {
  id: string;
  kelvin: string;
  color: string;
  description: string;
}

export type MarkerType = 'up' | 'path' | 'gutter';

export interface LightMarker {
  id: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  type: MarkerType;
  angle: number; // degrees (0-360)
  throw: number; // length of the beam (percentage relative to image width)
}

export interface AppSettings {
  darkSkyMode: boolean;
  preserveNonLit: boolean;
  highRealism: boolean;
  intensity: number;
  textureRealism: number;
  shadowContrast: number;
  ambientLight: number; // 0 = Pitch Black, 100 = Daylight
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

export interface UserSettings {
  user_id: string;
  company_name?: string;
  logo_url?: string;
  default_color_temp: string; // e.g. '3000k'
  default_beam_angle: number; // e.g. 60
  default_fixture_type: MarkerType;
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

export interface Project {
  id: string;
  userId: string;
  name: string;
  date: string;
  inputImage: string;
  outputImage: string;
  markers: LightMarker[];
  settings: AppSettings;
}