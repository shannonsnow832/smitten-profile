import { useState } from "react";
import { useAppContext } from "@/context/AppContext";
import { supabase } from "@/lib/supabase";

export const Header = () => {
  const [imgError, setImgError] = useState(false);
  const { 
    email, 
    setEmail, 
    setPhone, 
    setFirstName, 
    setLastName, 
    setIsExistingUser,
    setIsNewlyCreated,
    setCurrentProfileId,
    setProfileData, 
    setTermsAcceptedAt, 
    setTermsUrl,
    setStep
  } = useAppContext();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    sessionStorage.removeItem('isNewlyCreated');
    setEmail(null);
    setPhone(null);
    setFirstName(null);
    setLastName(null);
    setIsExistingUser(false);
    setIsNewlyCreated(false);
    setCurrentProfileId(null);
    setProfileData({});
    setTermsAcceptedAt(null);
    setTermsUrl(null);
    setStep('gate');
  };

  return (
    <header className="sticky top-0 z-40 flex h-14 w-full shrink-0 items-center justify-between border-b border-border bg-card px-4 sm:h-16 sm:px-6">
      {/* TODO: point to the participant portal once it is live */}
      <a href="https://smittensingles.com" className="flex min-w-0 items-center" target="_self" rel="noopener">
        {!imgError ? (
          <img
            src="https://vibe.filesafe.space/1783906396328761747/attachments/435dc44a-54e4-4c5c-9bac-40f207197e8c.png"
            alt="Smitten Singles"
            className="h-8 w-auto sm:h-10"
            onError={() => setImgError(true)}
          />
        ) : (
          <span className="brand-heading truncate text-lg text-primary sm:text-xl">
            Smitten Singles
          </span>
        )}
      </a>

      {email && (
        <button
          onClick={handleLogout}
          className="brand-eyebrow -mr-2 min-h-[44px] shrink-0 px-2 transition-colors hover:text-foreground"
        >
          Log out
        </button>
      )}
    </header>
  );
};
