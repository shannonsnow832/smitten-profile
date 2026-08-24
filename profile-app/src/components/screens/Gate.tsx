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
    <div className="flex flex-col items-center justify-center space-y-6 p-8 w-full max-w-md mx-auto">
      {/* TODO: REMOVE BEFORE LAUNCH */}
      {isDevMode && (
        <div className="w-full bg-destructive/10 text-destructive border border-destructive/20 p-4 rounded-md mb-4 text-center">
          <p className="font-bold mb-2">DEV MODE ACTIVE</p>
          <Button 
            variant="destructive" 
            className="w-full" 
            onClick={handleDevBypass}
            disabled={loading}
          >
            {loading ? "Sending code..." : `Login as ${DEV_EMAIL}`}
          </Button>
        </div>
      )}

      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Sign in</h2>
        <p className="text-muted-foreground text-sm">
          Enter your email and we will send you a verification code.
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="w-full">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="w-full space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input 
            id="email" 
            type="email" 
            autoComplete="email" 
            value={localEmail} 
            onChange={e => setLocalEmail(e.target.value)} 
          />
        </div>

        <Button 
          onClick={handleContinue} 
          className="w-full mt-4"
          disabled={loading}
        >
          {loading ? "Sending code..." : "Continue"}
        </Button>
      </div>

      <div className="w-full bg-muted border rounded-md p-4 text-sm space-y-3">
        <h3 className="font-bold">About your Smitten Singles profile</h3>
        <p>
          Your free profile is how we know who you are and what you are looking for. It is what we use to consider you for event invitations and matches, and to send you updates on what is happening near you. If you opt in, our team can also share your profile with trusted matchmakers.
        </p>
        <div className="h-px bg-border w-full"></div>
        <p className="text-muted-foreground">
          Ticket discounts, invite-only events, dating strategy sessions, and matchmaker visibility come with Private Access and VIP.
        </p>
        <a href="https://join.smittensingles.com/features" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline block">
          See what is included
        </a>
      </div>

      <div className="text-sm text-muted-foreground pt-4">
        Having trouble signing in? <a href="mailto:info@thesmittenproject.com" className="underline text-foreground">Contact us</a>
      </div>
    </div>
  );
};
