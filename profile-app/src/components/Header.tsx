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
    <header className="w-full bg-background border-b border-border h-16 flex items-center justify-between px-4 md:px-8 shrink-0">
      {/* TODO: point to the participant portal once it is live */}
      <a 
        href="https://smittensingles.com" 
        className="flex items-center"
        target="_self"
        rel="noopener"
      >
        {!imgError ? (
          <img 
            src="https://vibe.filesafe.space/1783906396328761747/attachments/435dc44a-54e4-4c5c-9bac-40f207197e8c.png" 
            alt="Smitten Singles" 
            style={{ height: "40px", width: "auto" }}
            onError={() => setImgError(true)}
          />
        ) : (
          <span className="text-primary font-bold uppercase text-xl tracking-wider">
            SMITTEN SINGLES
          </span>
        )}
      </a>

      {email && (
        <button 
          onClick={handleLogout}
          className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
        >
          Log out
        </button>
      )}
    </header>
  );
};
