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
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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
      <div className="flex flex-col space-y-6 p-4 md:p-8 w-full max-w-5xl mx-auto">
        <div>
          <h2 className="text-2xl font-bold">{getHeading()}</h2>
          <p className="text-sm text-muted-foreground mt-1">{getSubHeading()}</p>
        </div>
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-[280px] shrink-0">
            <Skeleton className="h-[280px] w-full" />
          </div>
          <div className="flex-1 min-w-0">
            <Skeleton className="h-[40px] w-full" />
            <Skeleton className="h-[400px] w-full mt-4" />
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="flex flex-col space-y-6 p-4 md:p-8 w-full max-w-5xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold">{getHeading()}</h2>
        <p className="text-sm text-muted-foreground mt-1">{getSubHeading()}</p>
      </div>
      
      <div className="flex flex-col md:flex-row gap-6 md:gap-8">
        <div className="contents md:block md:w-[280px] md:shrink-0">
          
          {/* Mobile Photo Row */}
          <div className="order-1 md:hidden flex items-center gap-4 mb-2">
            <div className="relative shrink-0 w-[72px] h-[72px] rounded-full overflow-hidden bg-muted border flex items-center justify-center">
              {profileData?.image_url ? (
                <img src={profileData.image_url} alt="Main profile" className="w-full h-full object-cover" />
              ) : (
                <Camera className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            <div className="flex flex-col items-start">
              <Button variant="outline" size="sm" onClick={() => setShowMobilePhotos(true)}>
                Manage photos
              </Button>
              <span className="text-xs text-muted-foreground mt-1 ml-1">
                {photoCount} of 6
              </span>
            </div>
          </div>

          <div className={showMobilePhotos ? "fixed inset-0 z-50 bg-background overflow-y-auto pb-8 block md:relative md:inset-auto md:z-auto md:bg-transparent md:overflow-visible md:pb-0 md:mb-6" : "hidden md:block md:mb-6"}>
            {showMobilePhotos && (
              <div className="sticky top-0 bg-background border-b z-10 flex items-center p-4 md:hidden">
                <Button variant="ghost" size="icon" onClick={() => setShowMobilePhotos(false)} className="mr-2">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <h2 className="text-lg font-semibold">Profile Photos</h2>
              </div>
            )}
            <div className={showMobilePhotos ? "p-4 max-w-md mx-auto md:p-0 md:max-w-none md:mx-0" : ""}>
              <PhotoGrid />
            </div>
          </div>
          
          <div className="order-3 md:order-none mt-6 md:mt-0 mb-6 md:mb-0">
            <CompletenessCard />
          </div>
          <Card className="order-4 md:order-none w-full bg-muted/30 md:mt-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Your Privacy</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Your profile is only visible to Smitten Singles staff and the matchmakers you have opted in to work with. It is never shown to other participants.
              </p>
            </CardContent>
          </Card>
        </div>
        
        <div className="contents md:block md:flex-1 md:min-w-0">
          <div className="order-2 md:order-none w-full">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">About You</TabsTrigger>
                <TabsTrigger value="lifestyle">Your Life</TabsTrigger>
                <TabsTrigger value="preferences">Your Matches</TabsTrigger>
              </TabsList>
              <TabsContent value="basic" className="p-4 border rounded-md mt-4">
                <BasicInfo onNext={() => setActiveTab("lifestyle")} />
              </TabsContent>
              <TabsContent value="lifestyle" className="p-4 border rounded-md mt-4">
                <Lifestyle onBack={() => setActiveTab("basic")} onNext={() => setActiveTab("preferences")} />
              </TabsContent>
              <TabsContent value="preferences" className="p-4 border rounded-md mt-4">
                <Preferences onBack={() => setActiveTab("lifestyle")} />
              </TabsContent>
            </Tabs>
          </div>
          <div className="order-5 md:order-none mt-8 md:mt-0 w-full">
            <ArchiveAccount />
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 bg-background border-t p-4 mt-8 z-10 flex justify-between items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="text-destructive text-sm font-medium whitespace-pre-wrap max-w-lg">
          {saveError}
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : (isExistingUser ? "Update Profile" : "Complete Profile")}
        </Button>
      </div>
    </div>
  );
};
