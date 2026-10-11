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

/**
 * Supabase refused to send another code yet (429 / over_email_send_rate_limit).
 * The earlier code is still valid, so callers show a calm message and start the
 * resend cooldown instead of showing the raw error.
 */
export class OtpRateLimitError extends Error {
  /** Seconds Supabase asked us to wait, when its message says so. */
  readonly retryAfterSeconds: number | undefined;

  constructor(message: string) {
    super(message);
    this.name = 'OtpRateLimitError';
    const match = /after (\d+) seconds?/i.exec(message);
    this.retryAfterSeconds = match ? Number(match[1]) : undefined;
  }
}

export async function sendOtp(email: string, hasAuthAccount: boolean): Promise<void> {
  // A stalled request must not leave the send button disabled forever.
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify(
        hasAuthAccount ? { email, type: 'recovery' } : { email, create_user: true },
      ),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      if (response.status === 429 || errorBody.includes('over_email_send_rate_limit')) {
        throw new OtpRateLimitError(errorBody);
      }
      throw new Error(`Failed to send OTP: ${response.status} ${errorBody}`);
    }
  } catch (error: any) {
    // A rate limit is logged under its own code so the admin failed-logins page
    // can tell it apart from a real send failure.
    rpc('log_auth_failure', {
      p_email: email,
      p_event_type: 'otp_send',
      p_error_code:
        error instanceof OtpRateLimitError ? 'over_email_send_rate_limit' : error.name || 'UNKNOWN',
      p_error_message: error.message,
    }).catch(console.error); // fire and forget
    throw error;
  } finally {
    clearTimeout(timeoutId);
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
