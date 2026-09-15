import { useState, useEffect } from "react";
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { rpc, sendOtp, verifyOtp } from "@/lib/auth";
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
  
  const [resendCountdown, setResendCountdown] = useState(0);

  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

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
    if (!email || resendCountdown > 0) return;
    
    setError(null);
    setSuccessMsg(null);

    try {
      await sendOtp(email, hasAuthAccount);
      setSuccessMsg("A new code was sent. Your previous code no longer works.");
      setResendCountdown(60);
    } catch (e) {
      setError("Could not resend. Please wait 60 seconds before trying again.");
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="space-y-2 text-center">
        <h1 className="brand-heading text-2xl sm:text-3xl">Check your email</h1>
        <p className="text-sm text-muted-foreground">
          We sent an 8-digit code to{" "}
          <span className="break-all font-semibold text-foreground">{email}</span>. Enter it below to
          verify your email and continue.
        </p>
        <p className="text-xs text-muted-foreground">Only your most recently sent code will work.</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {successMsg && (
        <Alert className="border-green-200 bg-green-50 text-green-800">
          <AlertDescription>{successMsg}</AlertDescription>
        </Alert>
      )}

      <div className="brand-section space-y-4 p-4 sm:p-6">
        {/*
          The group is width-constrained rather than fixed: eight stock 40px
          slots need 320px and overflow a 360px phone, which is the one screen
          nobody can route around.
        */}
        <InputOTP maxLength={8} value={token} onChange={setToken} disabled={verifyInFlight}>
          <InputOTPGroup className="gap-0">
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

        <Button onClick={handleVerify} className="min-h-[48px] w-full" disabled={verifyInFlight}>
          {verifyInFlight ? "Verifying..." : "Verify"}
        </Button>

        <div className="text-center">
          <button
            onClick={handleResend}
            disabled={resendCountdown > 0}
            className="min-h-[44px] px-2 text-sm font-semibold text-primary hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
          >
            {resendCountdown > 0 ? `Resend code (${resendCountdown}s)` : "Resend code"}
          </button>
        </div>
      </div>
    </div>
  );
};
