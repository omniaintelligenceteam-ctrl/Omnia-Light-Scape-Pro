import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://sb_publishable_kpRnFCcOT6dzyKu-Ww5W3Q_cP_grH7N.supabase.co"; 
const supabaseAnonKey = "sb_secret_sbtuE_Cm_HGDLUYWlkbXNg_o96ZmjWE";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
