import { useState } from "react";
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { rpc } from "@/lib/auth";

export const AcceptTerms = () => {
  const { 
    setStep, email, isExistingUser, setCurrentProfileId, orgSlug, termsUrl, setTermsAcceptedAt, setIsNewlyCreated 
  } = useAppContext();

  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    setError(null);

    if (!consent) {
      setError("Please agree to the Terms of Service and Privacy Policy to continue.");
      return;
    }

    setLoading(true);

    try {
      if (!isExistingUser) {
        // NEW ACCOUNT mode
        const termsDate = new Date().toISOString();
        setTermsAcceptedAt(termsDate);
        
        const profileId = await rpc('intake_create_incomplete', {
          p_email: email, 
          p_first_name: null, 
          p_last_name: null, 
          p_phone: null,
          p_org_slug: orgSlug, 
          p_terms_accepted_at: termsDate, 
          p_terms_url: termsUrl
        });
        
        if (profileId) {
          setCurrentProfileId(profileId);
          setIsNewlyCreated(true);
          setStep('profile');
        } else {
          throw new Error("Could not create profile. Please try again.");
        }
      } else {
        // EXISTING PROFILE mode
        await rpc('participant_accept_terms', { p_email: email });
        setStep('profile');
      }
    } catch (e: any) {
      setError(e.message || "An error occurred while accepting terms.");
    } finally {
      setLoading(false);
    }
  };

  const heading = isExistingUser ? "Please review our terms" : "Create your account";
  const bodyCopy = isExistingUser 
    ? "We need you to accept our current Terms of Service before you continue." 
    : "One last thing before we set up your profile.";
  const buttonText = isExistingUser ? "Accept and continue" : "Create my profile";

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="space-y-2 text-center">
        <h1 className="brand-heading text-2xl sm:text-3xl">{heading}</h1>
        <p className="text-sm text-muted-foreground">{bodyCopy}</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="brand-section space-y-4 p-4 sm:p-6">
        <div className="flex items-start gap-3">
          <Checkbox
            id="consent"
            checked={consent}
            onCheckedChange={(c) => setConsent(c === true)}
            className="mt-0.5 h-5 w-5 shrink-0"
          />
          <Label htmlFor="consent" className="text-sm font-normal leading-relaxed text-muted-foreground">
            I agree to the{" "}
            <a
              href={termsUrl || "https://smittensingles.com/terms-of-service"}
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-primary underline"
            >
              Terms of Service
            </a>{" "}
            and{" "}
            <a
              href="https://smittensingles.com/privacy-policy"
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-primary underline"
            >
              Privacy Policy
            </a>
            .
          </Label>
        </div>

        <Button
          onClick={handleContinue}
          className="min-h-[48px] w-full"
          disabled={loading || !consent}
        >
          {loading ? "Saving..." : buttonText}
        </Button>
      </div>
    </div>
  );
};
