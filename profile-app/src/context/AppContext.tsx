import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { rpc } from '@/lib/auth';

type Step = 'gate' | 'otp' | 'accept_terms' | 'profile' | 'success' | 'archived';

interface AppState {
  orgSlug: string;
  step: Step;
  initializing: boolean;
  email: string | null;
  phone: string | null;
  firstName: string | null;
  lastName: string | null;
  hasAuthAccount: boolean;
  isExistingUser: boolean; // representing hasProfile
  isNewlyCreated: boolean; // true when the profile was just created in this session
  currentProfileId: string | null;
  termsAcceptedAt: string | null;
  termsUrl: string | null;
  profileData: Record<string, any>;
  setStep: (step: Step) => void;
  setEmail: (email: string | null) => void;
  setPhone: (phone: string | null) => void;
  setFirstName: (firstName: string | null) => void;
  setLastName: (lastName: string | null) => void;
  setHasAuthAccount: (hasAuth: boolean) => void;
  setIsExistingUser: (isExisting: boolean) => void;
  setIsNewlyCreated: (isNew: boolean) => void;
  setCurrentProfileId: (id: string | null) => void;
  setTermsAcceptedAt: (date: string | null) => void;
  setTermsUrl: (url: string | null) => void;
  setField: (key: string, value: any) => void;
  setProfileData: (data: Record<string, any>) => void;
}

const AppContext = createContext<AppState | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [orgSlug, setOrgSlug] = useState('smitten-singles');
  const [step, setStep] = useState<Step>('gate');
  const [initializing, setInitializing] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [firstName, setFirstName] = useState<string | null>(null);
  const [lastName, setLastName] = useState<string | null>(null);
  const [hasAuthAccount, setHasAuthAccount] = useState<boolean>(false);
  const [isExistingUser, setIsExistingUser] = useState<boolean>(false);
  const [isNewlyCreated, setIsNewlyCreatedState] = useState<boolean>(false);
  const setIsNewlyCreated = (isNew: boolean) => {
    setIsNewlyCreatedState(isNew);
    if (isNew) {
      sessionStorage.setItem('isNewlyCreated', 'true');
    } else {
      sessionStorage.removeItem('isNewlyCreated');
    }
  };
  const [currentProfileId, setCurrentProfileId] = useState<string | null>(null);
  const [termsAcceptedAt, setTermsAcceptedAt] = useState<string | null>(null);
  const [termsUrl, setTermsUrl] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<Record<string, any>>({});

  const setField = (key: string, value: any) => {
    setProfileData(prev => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const org = params.get('org');
    if (org) {
      setOrgSlug(org);
    }
  }, []);

  // Restore session on mount: skip sign-in if a valid session exists
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session || !session.user?.email) {
          setInitializing(false);
          return;
        }

        const sessionEmail = session.user.email;
        setEmail(sessionEmail);
        setHasAuthAccount(true);

        let profileExists = false;
        let needsTerms = false;
        try {
          const status = await rpc('participant_terms_status', { p_email: sessionEmail });
          profileExists = status.profile_exists;
          needsTerms = status.needs_acceptance;
          if (status.terms_url) setTermsUrl(status.terms_url);
        } catch (e) {
          console.warn('Failed to check terms status', e);
        }

        let profileId = null;
        try {
          const profile = await rpc('intake_load_profile', { p_email: sessionEmail });
          if (profile && profile.id) {
            profileId = profile.id;
          }
        } catch (e) {
          console.warn('Failed to load profile', e);
        }

        setIsExistingUser(profileExists);
        setCurrentProfileId(profileId);

        // Restore isNewlyCreated flag from sessionStorage so it survives reloads within the session
        if (sessionStorage.getItem('isNewlyCreated') === 'true') {
          setIsNewlyCreatedState(true);
        }

        if (needsTerms) {
          setStep('accept_terms');
        } else {
          setStep('profile');
        }
      } catch (e) {
        console.error('Session restore failed', e);
      } finally {
        setInitializing(false);
      }
    };
    restoreSession();
  }, []);

  return (
    <AppContext.Provider value={{ 
      orgSlug, step, initializing, email, phone, firstName, lastName, hasAuthAccount, isExistingUser, isNewlyCreated, currentProfileId, termsAcceptedAt, termsUrl, profileData,
      setStep, setEmail, setPhone, setFirstName, setLastName, setHasAuthAccount, setIsExistingUser, setIsNewlyCreated, setCurrentProfileId, setTermsAcceptedAt, setTermsUrl, setField, setProfileData
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
