import { supabase } from './supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export function cleanPhone(raw: string): string {
  return raw.replace(/\D/g, '');
}

export async function rpc(fn: string, params: any): Promise<any> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token || SUPABASE_ANON_KEY;

  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(params)
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`RPC ${fn} failed: ${response.status} ${errorBody}`);
  }

  return response.json();
}

export async function sendOtp(email: string, hasAuthAccount: boolean): Promise<void> {
  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify(
        hasAuthAccount 
          ? { email, type: 'recovery' } 
          : { email, create_user: true }
      )
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Please wait 60 seconds before requesting another code.');
      }
      const errorBody = await response.text();
      throw new Error(`Failed to send OTP: ${response.status} ${errorBody}`);
    }
  } catch (error: any) {
    rpc('log_auth_failure', { 
      p_email: email, 
      p_event_type: 'otp_send', 
      p_error_code: error.name || 'UNKNOWN', 
      p_error_message: error.message 
    }).catch(console.error); // fire and forget
    throw error;
  }
}

export async function verifyOtp(email: string, token: string, hasAuthAccount: boolean): Promise<{access_token: string, refresh_token: string}> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({
        type: hasAuthAccount ? 'recovery' : 'email',
        email,
        token
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Failed to verify OTP: ${response.status} ${errorBody}`);
    }

    return response.json();
  } catch (error: any) {
    clearTimeout(timeoutId);
    rpc('log_auth_failure', { 
      p_email: email, 
      p_event_type: 'otp_verify', 
      p_error_code: error.name || 'UNKNOWN', 
      p_error_message: error.message 
    }).catch(console.error); // fire and forget
    throw error;
  }
}
