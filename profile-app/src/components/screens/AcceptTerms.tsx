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
    <div className="flex flex-col items-center justify-center space-y-6 p-8 w-full max-w-md mx-auto">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">{heading}</h2>
        <p className="text-muted-foreground text-sm">
          {bodyCopy}
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="w-full">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="w-full space-y-4">
        <div className="flex items-start space-x-2 pt-2">
          <Checkbox 
            id="consent" 
            checked={consent} 
            onCheckedChange={(c) => setConsent(c === true)} 
            className="mt-1"
          />
          <Label htmlFor="consent" className="text-sm leading-snug font-normal text-muted-foreground">
            I agree to the <a href={termsUrl || "https://smittensingles.com/terms-of-service"} target="_blank" rel="noreferrer" className="underline text-foreground">Terms of Service</a> and <a href="https://smittensingles.com/privacy-policy" target="_blank" rel="noreferrer" className="underline text-foreground">Privacy Policy</a>.
          </Label>
        </div>

        <Button 
          onClick={handleContinue} 
          className="w-full mt-4"
          disabled={loading || !consent}
        >
          {loading ? "Saving..." : buttonText}
        </Button>
      </div>
    </div>
  );
};
