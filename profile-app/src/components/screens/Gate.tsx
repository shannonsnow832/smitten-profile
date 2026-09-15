import { useState } from "react";
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { rpc, sendOtp } from "@/lib/auth";

// TODO: REMOVE BEFORE LAUNCH
const DEV_EMAIL = "shannon@thesmittenproject.com"; 

export const Gate = () => {
  const { 
    setStep, setEmail, setTermsAcceptedAt, setTermsUrl, setHasAuthAccount, setIsExistingUser, setCurrentProfileId 
  } = useAppContext();

  const [localEmail, setLocalEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // TODO: REMOVE BEFORE LAUNCH
  const isDevMode = 
    import.meta.env.DEV || 
    window.location.hostname.includes("preview") || 
    window.location.hostname.includes("vibepreview") || 
    window.location.hostname.includes("localhost");

  // TODO: REMOVE BEFORE LAUNCH
  const handleDevBypass = async () => {
    setLoading(true);
    setError(null);
    try {
      let existingUser = false;
      let existingAuth = false;
      try {
        const status = await rpc('participant_signin_status', { p_email: DEV_EMAIL });
        existingUser = status.profile_exists;
        existingAuth = status.auth_exists;
      } catch (e) {
        existingUser = false;
        existingAuth = false;
      }

      if (existingUser && !existingAuth) {
        const ensureRes = await fetch('https://qgctltxcgsnbrdtbhmay.supabase.co/functions/v1/ensure-participant-auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: DEV_EMAIL })
        });
        if (!ensureRes.ok) {
          throw new Error("We could not prepare your account for sign in. Please contact support.");
        }
        existingAuth = true;
      }

      await sendOtp(DEV_EMAIL, existingAuth);

      setEmail(DEV_EMAIL);
      setHasAuthAccount(existingAuth);
      setIsExistingUser(existingUser);
      setStep('otp');
    } catch (e: any) {
      setError(e.message || "An error occurred while sending the verification code.");
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = async () => {
    setError(null);

    if (!localEmail.trim()) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);

    const processedEmail = localEmail.trim().toLowerCase();

    try {
      let existingUser = false;
      let existingAuth = false;
      try {
        const status = await rpc('participant_signin_status', { p_email: processedEmail });
        existingUser = status.profile_exists;
        existingAuth = status.auth_exists;
      } catch (e) {
        existingUser = false;
        existingAuth = false;
      }

      if (existingUser && !existingAuth) {
        const ensureRes = await fetch('https://qgctltxcgsnbrdtbhmay.supabase.co/functions/v1/ensure-participant-auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: processedEmail })
        });
        if (!ensureRes.ok) {
          throw new Error("We could not prepare your account for sign in. Please contact support.");
        }
        existingAuth = true;
      }

      await sendOtp(processedEmail, existingAuth);

      setEmail(processedEmail);
      setHasAuthAccount(existingAuth);
      setIsExistingUser(existingUser);
      setStep('otp');
    } catch (e: any) {
      setError(e.message || "An error occurred while sending the verification code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-8 sm:px-6">
      {/* TODO: REMOVE BEFORE LAUNCH */}
      {isDevMode && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-center">
          <p className="brand-eyebrow mb-2 text-destructive">Dev mode active</p>
          <Button
            variant="destructive"
            className="min-h-[44px] w-full"
            onClick={handleDevBypass}
            disabled={loading}
          >
            {loading ? "Sending code..." : `Login as ${DEV_EMAIL}`}
          </Button>
        </div>
      )}

      <div className="space-y-2 text-center">
        <h1 className="brand-heading text-2xl sm:text-3xl">Sign in</h1>
        <p className="text-sm text-muted-foreground">
          Enter your email and we will send you a verification code.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="brand-section space-y-4 p-4 sm:p-6">
        <div className="space-y-2">
          <Label htmlFor="email" className="brand-eyebrow">
            Email address
          </Label>
          <Input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            autoCorrect="off"
            className="h-12"
            value={localEmail}
            onChange={e => setLocalEmail(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter") handleContinue();
            }}
          />
        </div>

        <Button onClick={handleContinue} className="min-h-[48px] w-full" disabled={loading}>
          {loading ? "Sending code..." : "Continue"}
        </Button>
      </div>

      <div className="brand-section space-y-3 p-4 text-sm sm:p-6">
        <h2 className="brand-subheading">About your Smitten Singles profile</h2>
        <p className="text-muted-foreground">
          Your free profile is how we know who you are and what you are looking for. It is what we use
          to consider you for event invitations and matches, and to send you updates on what is
          happening near you. If you opt in, our team can also share your profile with trusted
          matchmakers.
        </p>
        <div className="h-px w-full bg-border"></div>
        <p className="text-muted-foreground">
          Ticket discounts, invite-only events, dating strategy sessions, and matchmaker visibility
          come with Private Access and VIP.
        </p>
        <a
          href="https://join.smittensingles.com/features"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block font-semibold text-primary hover:underline"
        >
          See what is included
        </a>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Having trouble signing in?{" "}
        <a href="mailto:info@thesmittenproject.com" className="font-semibold text-primary hover:underline">
          Contact us
        </a>
      </p>
    </div>
  );
};
