import { useState, useRef, useEffect } from 'react';
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { OtpRateLimitError, rpc, sendOtp, verifyOtp } from '@/lib/auth';
import {
  RATE_LIMIT_MESSAGE,
  startCooldown,
  takeRateLimited,
  useResendCooldown,
} from '@/lib/resend-cooldown';
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export const Otp = () => {
  const { 
    email, isExistingUser, hasAuthAccount, 
    setStep, setIsExistingUser, setCurrentProfileId, setTermsUrl
  } = useAppContext();
  const { toast } = useToast();

  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [verifyInFlight, setVerifyInFlight] = useState(false);
  
  const { secondsLeft: resendCountdown } = useResendCooldown(email);
  const [resending, setResending] = useState(false);
  // Set synchronously, so two fast taps cannot both send before React re-renders.
  const resendingRef = useRef(false);
  const [notice, setNotice] = useState<string | null>(null);

  // Arriving here after a rate-limited send: say the first code still works.
  useEffect(() => {
    if (email && takeRateLimited(email)) setNotice(RATE_LIMIT_MESSAGE);
  }, [email]);

  const handleVerify = async () => {
    setError(null);
    setSuccessMsg(null);

    if (token.length !== 8) {
      setError("Please enter all 8 digits.");
      return;
    }

    if (!email) return;

    setVerifyInFlight(true);

    try {
      const { access_token, refresh_token } = await verifyOtp(email, token, hasAuthAccount);
      await supabase.auth.setSession({ access_token, refresh_token });

      try {
        const reactivateRes = await rpc('participant_reactivate_profile', { p_email: email });
        if (reactivateRes && reactivateRes.reactivated) {
          toast({
            description: "Welcome back. Your profile has been restored.",
          });
        }
      } catch (e) {
        console.warn("Failed to reactivate profile", e);
      }

      let status;
      try {
        status = await rpc('participant_terms_status', { p_email: email });
      } catch (e) {
        console.warn("Failed to fetch terms status", e);
      }

      if (status && status.terms_url) {
        setTermsUrl(status.terms_url);
      } else {
        setTermsUrl("https://smittensingles.com/terms-of-service");
      }

      let profileId = null;
      try {
        const profile = await rpc('intake_load_profile', { p_email: email });
        if (profile && profile.id) {
          profileId = profile.id;
        }
      } catch (e) {
        // Not found or error
      }

      if (status && status.profile_exists) {
        setIsExistingUser(true);
        setCurrentProfileId(profileId);
        
        if (status.needs_acceptance) {
          setStep('accept_terms');
        } else {
          setStep('profile');
        }
      } else {
        setIsExistingUser(false);
        setStep('accept_terms');
      }
    } catch (e) {
      setError("Invalid or expired code. Please try again.");
      setToken("");
    } finally {
      setVerifyInFlight(false);
    }
  };

  const handleResend = async () => {
    if (!email || resendCountdown > 0 || resendingRef.current) return;

    resendingRef.current = true;
    setResending(true);
    setError(null);
    setSuccessMsg(null);
    setNotice(null);

    try {
      await sendOtp(email, hasAuthAccount);
      setSuccessMsg("A new code was sent. Your previous code no longer works.");
      startCooldown(email);
    } catch (e) {
      if (e instanceof OtpRateLimitError) {
        // Not a failure: the earlier code is still valid.
        startCooldown(email, e.retryAfterSeconds);
        setNotice(RATE_LIMIT_MESSAGE);
      } else {
        setError("We could not send a new code. Check your connection and try again.");
      }
    } finally {
      resendingRef.current = false;
      setResending(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-6 p-8 w-full max-w-md mx-auto">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Check Your Email</h2>
        <p className="text-muted-foreground text-sm">
          We sent an 8-digit code to <span className="font-medium text-foreground">{email}</span>. Enter it below to verify your email and continue.
        </p>
        <p className="text-xs text-muted-foreground mt-1">Only your most recently sent code will work.</p>
      </div>

      {error && (
        <Alert variant="destructive" className="w-full">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {successMsg && (
        <Alert className="w-full bg-green-50 text-green-800 border-green-200">
          <AlertDescription>{successMsg}</AlertDescription>
        </Alert>
      )}

      {notice && (
        <Alert className="w-full">
          <AlertDescription>{notice}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-center w-full py-4">
        <InputOTP 
          maxLength={8} 
          value={token} 
          onChange={setToken}
          disabled={verifyInFlight}
        >
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
            <InputOTPSlot index={6} />
            <InputOTPSlot index={7} />
          </InputOTPGroup>
        </InputOTP>
      </div>

      <Button 
        onClick={handleVerify} 
        className="w-full"
        disabled={verifyInFlight}
      >
        {verifyInFlight ? "Verifying..." : "Verify"}
      </Button>

      <div className="text-sm text-center pt-2">
        <button 
          onClick={handleResend} 
          disabled={resendCountdown > 0 || resending}
          className="text-primary hover:underline disabled:opacity-50 disabled:no-underline disabled:cursor-not-allowed"
        >
          {resending ? "Sending..." : resendCountdown > 0 ? `Resend code in ${resendCountdown}s` : "Resend code"}
        </button>
      </div>
    </div>
  );
};
