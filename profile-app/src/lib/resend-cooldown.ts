import { useCallback, useEffect, useState } from "react";

/**
 * Resend-code cooldown.
 *
 * Supabase refuses a second email OTP for the same address inside its own
 * window (429 over_email_send_rate_limit). This keeps the resend button
 * inactive for that window instead of letting a member tap into the error.
 *
 * The end time is kept in sessionStorage, per email, so a refresh does not
 * reset it. Every storage call is wrapped: if storage is blocked (private
 * window, locked-down browser) it falls back to memory and sign-in still works.
 */

export const RESEND_SECONDS = 60;

export const RATE_LIMIT_MESSAGE =
  "Please wait a moment before requesting another code. Your first code is still valid.";

const KEY_PREFIX = "otp-resend-until:";
const memory = new Map<string, number>();

function keyFor(email: string): string {
  return KEY_PREFIX + email.trim().toLowerCase();
}

/** Seconds left on the cooldown for this email. 0 means a code can be sent. */
export function cooldownSecondsLeft(email: string): number {
  if (!email.trim()) return 0;
  const key = keyFor(email);
  let until = memory.get(key) ?? 0;
  try {
    const stored = Number(window.sessionStorage.getItem(key));
    if (Number.isFinite(stored) && stored > until) until = stored;
  } catch {
    // Storage unavailable; the in-memory value is used.
  }
  const left = Math.ceil((until - Date.now()) / 1000);
  // A bad or far-future stored value must never lock someone out.
  return left > 0 ? Math.min(left, RESEND_SECONDS) : 0;
}

export function startCooldown(email: string, seconds: number = RESEND_SECONDS): void {
  if (!email.trim()) return;
  const safe = Math.min(Math.max(Math.round(seconds) || RESEND_SECONDS, 1), RESEND_SECONDS);
  const until = Date.now() + safe * 1000;
  const key = keyFor(email);
  memory.set(key, until);
  try {
    window.sessionStorage.setItem(key, String(until));
  } catch {
    // Storage unavailable; the in-memory value is used.
  }
}

/** Live countdown for the resend button. `secondsLeft > 0` means disabled. */
export function useResendCooldown(email: string) {
  const [secondsLeft, setSecondsLeft] = useState(() => cooldownSecondsLeft(email));

  useEffect(() => {
    setSecondsLeft(cooldownSecondsLeft(email));
    const timer = setInterval(() => {
      const left = cooldownSecondsLeft(email);
      setSecondsLeft(left);
    }, 1000);
    return () => clearInterval(timer);
  }, [email]);

  const start = useCallback(
    (seconds: number = RESEND_SECONDS) => {
      startCooldown(email, seconds);
      setSecondsLeft(cooldownSecondsLeft(email));
    },
    [email],
  );

  return { secondsLeft, start };
}

const rateLimited = new Set<string>();

/** Remember that this email was rate limited, so the next screen can say so once. */
export function markRateLimited(email: string): void {
  rateLimited.add(email.trim().toLowerCase());
}

/** True once if the email was rate limited since the last check. */
export function takeRateLimited(email: string): boolean {
  return rateLimited.delete(email.trim().toLowerCase());
}
