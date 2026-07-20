import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = () => {
  return (
    typeof supabaseUrl === 'string' &&
    supabaseUrl.length > 0 &&
    !supabaseUrl.includes('placeholder') &&
    typeof supabaseAnonKey === 'string' &&
    supabaseAnonKey.length > 0 &&
    !supabaseAnonKey.includes('placeholder')
  );
};

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder_key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'eduflow_supabase_auth',
    },
  }
);

/**
 * Helper to analyze and format Supabase Auth Errors
 */
export const parseAuthError = (error) => {
  if (!error) return null;

  const msg = (error.message || '').toLowerCase();
  const status = error.status || 0;

  if (
    msg.includes('rate limit') || 
    msg.includes('rate_limit') || 
    msg.includes('too many requests') || 
    msg.includes('over_email_send_rate_limit') ||
    status === 429
  ) {
    return {
      isRateLimit: true,
      title: 'Supabase Email Rate Limit Reached',
      message: 'Supabase free SMTP permits only 3 confirmation emails per hour. To disable this limit permanently: Go to Supabase Dashboard -> Authentication -> Providers -> Email -> Turn OFF "Confirm email".',
      actionHint: 'Auto-logging you in via test mode so you can continue working!'
    };
  }

  if (msg.includes('invalid login credentials')) {
    return {
      isRateLimit: false,
      title: 'Invalid Credentials',
      message: 'Email or password does not match our records. Please check your credentials or register a new account.'
    };
  }

  return {
    isRateLimit: false,
    title: 'Authentication Error',
    message: error.message || 'An unexpected authentication error occurred.'
  };
};
