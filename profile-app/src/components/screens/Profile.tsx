import { useState, useEffect, useRef } from 'react';
import { Camera, ArrowLeft } from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { rpc } from "@/lib/auth";
import { getProfileOptions } from "@/lib/options";
import { BasicInfo } from "./tabs/BasicInfo";
import { Lifestyle } from "./tabs/Lifestyle";
import { Preferences } from "./tabs/Preferences";
import { PhotoGrid } from "@/components/PhotoGrid";
import { CompletenessCard } from "@/components/CompletenessCard";
import { ArchiveAccount } from "@/components/ArchiveAccount";
import { performSaveProfile } from "@/lib/saveProfile";
import { useToast } from "@/hooks/use-toast";

export const Profile = () => {
  const { setStep, email, profileData, setProfileData, isExistingUser, isNewlyCreated, currentProfileId, orgSlug, setCurrentProfileId } = useAppContext();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("basic");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showMobilePhotos, setShowMobilePhotos] = useState(false);
  const { toast } = useToast();
  
  const photoCount = Array.isArray(profileData?.photos) ? profileData.photos.length : (profileData?.image_url ? 1 : 0);
  
  const autosaveTimer = useRef<NodeJS.Timeout | null>(null);
  const autosaveInProgress = useRef(false);
  const lastSavedData = useRef(JSON.stringify(profileData));
  const hasSetApp = useRef(false);
  const hasExistingProfileRef = useRef(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        await getProfileOptions(); // Cache options on mount
        if (email) {
          const profile = await rpc('intake_load_profile', { p_email: email });
          if (profile) {
            // For new users, clear any first_name auto-derived from the email local-part
            if (!isExistingUser && profile.first_name && email) {
              const localPart = email.split('@')[0];
              if (profile.first_name === localPart) {
                profile.first_name = null;
              }
            }
            // Load orientation from extras RPC
            try {
              const extras = await rpc('participant_profile_extras', { p_email: email });
              if (extras && extras.orientation) {
                profile.orientation = extras.orientation;
              }
            } catch (e) {
              console.warn('Failed to load profile extras', e);
            }
            if (profile && profile.id) {
              hasExistingProfileRef.current = true;
            }
            setProfileData(profile);
            lastSavedData.current = JSON.stringify(profile);
          }
        }
      } catch (err) {
        console.error("Failed to load profile", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [email, setProfileData, isExistingUser]);
  useEffect(() => {
    if (!loading && email && !hasSetApp.current) {
      hasSetApp.current = true;
      rpc('participant_set_app', {
        p_email: email,
        p_app: 'profile.smittensingles.com',
        p_created_via: 'profile_app'
      }).catch(e => console.error("Failed to set app source", e));
    }
  }, [loading, email]);

  useEffect(() => {
    if (!currentProfileId || loading) return;

    const currentDataStr = JSON.stringify(profileData);
    if (currentDataStr === lastSavedData.current) return;

    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);

    autosaveTimer.current = setTimeout(async () => {
      if (autosaveInProgress.current) return;
      autosaveInProgress.current = true;
      
      const res = await performSaveProfile(true, profileData, email, isExistingUser, currentProfileId, orgSlug);
      if (res.success) {
        toast({ description: "Draft saved" });
        // Save orientation via separate RPC
        try {
          await rpc('participant_set_orientation', { p_email: email, p_orientation: profileData.orientation || null });
        } catch (e) {
          console.warn('Failed to save orientation', e);
        }
        if (email) {
          try {
            const freshProfile = await rpc('intake_load_profile', { p_email: email });
            if (freshProfile) {
              setProfileData(prev => {
                const newData = {
                  ...prev,
                  completeness_pct: freshProfile.completeness_pct,
                  preferences_pct: freshProfile.preferences_pct
                };
                lastSavedData.current = JSON.stringify(newData);
                return newData;
              });
            } else {
              lastSavedData.current = currentDataStr;
            }
          } catch (e) {
            console.error(e);
            lastSavedData.current = currentDataStr;
          }
        } else {
          lastSavedData.current = currentDataStr;
        }
      } else {
        toast({ description: "We could not save your changes. Please check your connection.", variant: "destructive" });
      }
      
      autosaveInProgress.current = false;
    }, 800);

    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
  }, [profileData, currentProfileId, email, isExistingUser, orgSlug, loading, toast]);

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    
    const res = await performSaveProfile(false, profileData, email, isExistingUser, currentProfileId, orgSlug);
    
    if (res.success) {
      if (res.id) setCurrentProfileId(res.id);
      
      // Save orientation via separate RPC
      try {
        await rpc('participant_set_orientation', { p_email: email, p_orientation: profileData.orientation || null });
      } catch (e) {
        console.warn('Failed to save orientation', e);
      }
      
      if (email) {
        try {
          const freshProfile = await rpc('intake_load_profile', { p_email: email });
          if (freshProfile) {
            setProfileData(prev => {
              const newData = {
                ...prev,
                completeness_pct: freshProfile.completeness_pct,
                preferences_pct: freshProfile.preferences_pct
              };
              lastSavedData.current = JSON.stringify(newData);
              return newData;
            });
          }
        } catch (e) {
          console.error(e);
        }
      }
      
      setStep('success');
    } else {
      setSaveError(res.error || "Failed to save profile");
      setSaving(false);
    }
  };

  const getHeading = () => {
    // A returning participant is anyone with an existing profile, detected either
    // via the OTP flow setting isExistingUser, or via the loaded profile having an id.
    const isReturning = (isExistingUser || hasExistingProfileRef.current) && !isNewlyCreated;
    if (isReturning) {
      return profileData?.first_name ? `Welcome back, ${profileData.first_name}` : "Welcome back";
    }
    return profileData?.first_name ? `Nice to meet you, ${profileData.first_name}` : "Let's build your profile";
  };

  const getSubHeading = () => {
    const isReturning = (isExistingUser || hasExistingProfileRef.current) && !isNewlyCreated;
    if (isReturning) {
      return "Keep this current so we match you well.";
    }
    return "Fill this out and our team can start matching you at events.";
  };

  if (loading) {
    return (
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 md:px-8">
        <div>
          <h1 className="brand-heading text-xl sm:text-2xl">{getHeading()}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{getSubHeading()}</p>
        </div>
        <div className="flex flex-col gap-6 md:flex-row md:gap-8">
          <div className="w-full shrink-0 md:w-[280px]">
            <Skeleton className="h-[280px] w-full" />
          </div>
          <div className="min-w-0 flex-1">
            <Skeleton className="h-[44px] w-full" />
            <Skeleton className="mt-4 h-[400px] w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 md:px-8">
      <div>
        <h1 className="brand-heading text-xl sm:text-2xl">{getHeading()}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{getSubHeading()}</p>
      </div>

      <div className="flex flex-col gap-6 md:flex-row md:gap-8">
        <div className="contents md:block md:w-[280px] md:shrink-0 md:space-y-6">
          {/* Phone: a compact avatar plus an entry point to the full photo manager. */}
          <div className="brand-section order-1 flex items-center gap-4 p-3 md:hidden">
            <div className="relative flex h-[72px] w-[72px] shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-muted">
              {profileData?.image_url ? (
                <img src={profileData.image_url} alt="Main profile" className="h-full w-full object-cover" />
              ) : (
                <Camera className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            <div className="flex min-w-0 flex-col items-start gap-1">
              <Button
                variant="outline"
                onClick={() => setShowMobilePhotos(true)}
                className="min-h-[44px]"
              >
                Manage photos
              </Button>
              <span className="text-xs text-muted-foreground">{photoCount} of 6</span>
            </div>
          </div>

          {/*
            On a phone the photo manager takes over the screen rather than
            pushing the form down. On desktop it is simply the sidebar panel.
          */}
          <div
            className={
              showMobilePhotos
                ? "fixed inset-0 z-50 block overflow-y-auto bg-background pb-8 md:relative md:inset-auto md:z-auto md:overflow-visible md:bg-transparent md:pb-0"
                : "hidden md:block"
            }
          >
            {showMobilePhotos && (
              <div className="sticky top-0 z-10 flex items-center border-b border-border bg-card p-4 md:hidden">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowMobilePhotos(false)}
                  className="mr-2 min-h-[44px] min-w-[44px]"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <h2 className="brand-subheading">Profile photos</h2>
              </div>
            )}
            <div className={showMobilePhotos ? "mx-auto max-w-md p-4 md:mx-0 md:max-w-none md:p-0" : ""}>
              <PhotoGrid />
            </div>
          </div>

          <div className="order-3 md:order-none">
            <CompletenessCard />
          </div>

          {/*
            A plain bordered note, not another Card. The sidebar already
            carries one, and the style guide rules out stacking cards inside
            cards inside cards.
          */}
          <div className="brand-section order-4 space-y-1 p-4 md:order-none">
            <h2 className="brand-eyebrow">Your privacy</h2>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Your profile is only visible to Smitten Singles staff and the matchmakers you have
              opted in to work with. It is never shown to other participants.
            </p>
          </div>
        </div>

        <div className="contents md:block md:min-w-0 md:flex-1">
          <div className="order-2 w-full md:order-none">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">About you</TabsTrigger>
                <TabsTrigger value="lifestyle">Your life</TabsTrigger>
                <TabsTrigger value="preferences">Your matches</TabsTrigger>
              </TabsList>
              <TabsContent value="basic" className="brand-section mt-4 p-4 sm:p-6">
                <BasicInfo onNext={() => setActiveTab("lifestyle")} />
              </TabsContent>
              <TabsContent value="lifestyle" className="brand-section mt-4 p-4 sm:p-6">
                <Lifestyle onBack={() => setActiveTab("basic")} onNext={() => setActiveTab("preferences")} />
              </TabsContent>
              <TabsContent value="preferences" className="brand-section mt-4 p-4 sm:p-6">
                <Preferences onBack={() => setActiveTab("lifestyle")} />
              </TabsContent>
            </Tabs>
          </div>
          <div className="order-5 mt-8 w-full md:order-none md:mt-6">
            <ArchiveAccount />
          </div>
        </div>
      </div>

      {/*
        Save bar. Stacks on a phone so a long validation message never squeezes
        the button off the edge, and clears the iOS home indicator.
      */}
      <div className="sticky bottom-0 z-10 -mx-4 mt-2 flex flex-col gap-3 border-t border-border bg-card px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:-mx-6 sm:px-6 md:-mx-8 md:flex-row md:items-center md:justify-between md:px-8">
        {saveError && (
          <div className="max-w-lg whitespace-pre-wrap text-sm font-medium text-destructive">
            {saveError}
          </div>
        )}
        <Button
          onClick={handleSave}
          disabled={saving}
          className="min-h-[48px] w-full md:ml-auto md:w-auto md:min-w-[200px]"
        >
          {saving ? "Saving..." : isExistingUser ? "Update profile" : "Complete profile"}
        </Button>
      </div>
    </div>
  );
};
