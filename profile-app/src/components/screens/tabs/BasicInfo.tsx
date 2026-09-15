import { useState, useEffect } from "react";
import { useAppContext } from "@/context/AppContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getProfileOptions } from "@/lib/options";

// State options are loaded from profile_options category "state"

const SEEKING_OPTIONS = [
  "Date Men",
  "Date Women",
  "Date Any/Other Gender",
  "Friendship"
];

const displayPhone = (val: string) => {
  if (!val) return "";
  const digits = val.replace(/\D/g, "");
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  return digits;
};

export const BasicInfo = ({ onNext }: { onNext: () => void }) => {
  const { profileData, setField, email } = useAppContext();
  const [genderOptions, setGenderOptions] = useState<{value: string, label: string}[]>([]);
  const [orientationOptions, setOrientationOptions] = useState<{value: string, label: string}[]>([]);
  const [stateOptions, setStateOptions] = useState<{value: string, label: string}[]>([]);

  const today = new Date();
  const maxDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate()).toISOString().split('T')[0];
  const minDate = new Date(today.getFullYear() - 120, today.getMonth(), today.getDate()).toISOString().split('T')[0];

  useEffect(() => {
    getProfileOptions().then(options => {
      if (options.gender) {
        setGenderOptions(options.gender);
      }
      if (options.orientation) {
        setOrientationOptions(options.orientation);
      }
      if (options.state) {
        setStateOptions(options.state);
      }
    }).catch(console.error);
  }, []);

  const handleSeekingChange = (option: string, checked: boolean) => {
    const current = Array.isArray(profileData.seeking) ? profileData.seeking : [];
    if (checked) {
      setField("seeking", [...current, option]);
    } else {
      setField("seeking", current.filter(item => item !== option));
    }
  };

  return (
    <div className="space-y-8 py-4">
      <section className="space-y-4">
        <h3 className="brand-subheading text-lg sm:text-xl">About you</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="first_name">First Name *</Label>
            <Input 
              id="first_name" 
              value={profileData.first_name || ""} 
              onChange={e => setField("first_name", e.target.value)} 
              required 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="last_name">Last Name *</Label>
            <Input 
              id="last_name" 
              value={profileData.last_name || ""} 
              onChange={e => setField("last_name", e.target.value)} 
              required 
            />
            <p className="text-xs text-muted-foreground">Kept private</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input 
              id="email" 
              type="email" 
              value={email || ""} 
              readOnly 
              className="bg-muted" 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input 
              id="phone" 
              type="tel" 
              value={displayPhone(profileData.phone || "")} 
              onChange={e => setField("phone", e.target.value.replace(/\D/g, ""))} 
            />
            <p className="text-xs text-muted-foreground">Kept private</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="date_of_birth">Date of Birth *</Label>
            <Input 
              id="date_of_birth" 
              type="date" 
              value={profileData.date_of_birth || ""} 
              onChange={e => setField("date_of_birth", e.target.value)} 
              min={minDate}
              max={maxDate}
              required 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="gender">Gender *</Label>
            <Select 
              value={profileData.gender || ""} 
              onValueChange={(value: string) => setField("gender", value)}
            >
              <SelectTrigger id="gender">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                {genderOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="orientation">Orientation</Label>
            <Select 
              value={profileData.orientation || ""} 
              onValueChange={(value: string) => setField("orientation", value)}
            >
              <SelectTrigger id="orientation">
                <SelectValue placeholder="Select orientation" />
              </SelectTrigger>
              <SelectContent>
                {orientationOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Helps us understand who you are looking to meet.</p>
          </div>
          
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="street_address">Street Address</Label>
            <Input 
              id="street_address" 
              value={profileData.street_address || ""} 
              onChange={e => setField("street_address", e.target.value)} 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="city">City *</Label>
            <Input 
              id="city" 
              value={profileData.city || ""} 
              onChange={e => setField("city", e.target.value)} 
              required 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="state">State *</Label>
            <Select 
              value={profileData.state || ""} 
              onValueChange={(value: string) => setField("state", value)}
            >
              <SelectTrigger id="state">
                <SelectValue placeholder="Select state" />
              </SelectTrigger>
              <SelectContent>
                {stateOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="postal_code">Postal Code *</Label>
            <Input 
              id="postal_code" 
              value={profileData.postal_code || ""} 
              onChange={e => setField("postal_code", e.target.value)} 
              required 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="closest_major_city">Closest Major City</Label>
            <Input 
              id="closest_major_city" 
              value={profileData.closest_major_city || ""} 
              onChange={e => setField("closest_major_city", e.target.value)} 
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="brand-subheading text-lg sm:text-xl">Who you want to meet *</h3>
        <div className="flex flex-col gap-3">
          {SEEKING_OPTIONS.map(option => (
            <div key={option} className="flex items-center space-x-2">
              <Checkbox 
                id={`seeking-${option}`} 
                checked={Array.isArray(profileData.seeking) && profileData.seeking.includes(option)}
                onCheckedChange={(checked) => handleSeekingChange(option, checked as boolean)}
              />
              <Label htmlFor={`seeking-${option}`} className="font-normal">{option}</Label>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="brand-subheading text-lg sm:text-xl">In your words</h3>
        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea 
            id="bio" 
            rows={4} 
            placeholder="Write a short bio about yourself..." 
            value={profileData.bio || ""}
            onChange={e => setField("bio", e.target.value)}
          />
          <p className="text-xs text-muted-foreground">This will be visible to your matchmaker.</p>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="brand-subheading text-lg sm:text-xl">Permissions and contact</h3>
        
        <div className="space-y-6">
          <div className="flex items-start space-x-3">
            <Checkbox 
              id="share_with_matchmakers" 
              checked={profileData.share_with_matchmakers || false}
              onCheckedChange={checked => setField("share_with_matchmakers", checked === true)}
              className="mt-1"
            />
            <div className="space-y-1">
              <Label htmlFor="share_with_matchmakers" className="font-bold cursor-pointer">Share my profile with matchmakers</Label>
              <p className="text-sm text-muted-foreground">By checking this box, you give permission for your information to be shared with trusted matchmakers for the purpose of potential matchmaking. You acknowledge that Smitten may receive a referral fee if a matchmaker chooses to work with you or facilitates a match.</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Checkbox 
              id="interested_in_matchmaking" 
              checked={profileData.interested_in_matchmaking || false}
              onCheckedChange={checked => setField("interested_in_matchmaking", checked === true)}
              className="mt-1"
            />
            <div className="space-y-1">
              <Label htmlFor="interested_in_matchmaking" className="font-bold cursor-pointer">I am interested in learning more about matchmaking services</Label>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Checkbox 
              id="email_opt_in" 
              checked={profileData.email_opt_in || false}
              onCheckedChange={checked => setField("email_opt_in", checked === true)}
              className="mt-1"
            />
            <div className="space-y-1">
              <Label htmlFor="email_opt_in" className="font-bold cursor-pointer">Email Opt-In</Label>
              <p className="text-sm text-muted-foreground">By checking this box, you agree to receive occasional emails from Smitten about groups, events, and opportunities. You can unsubscribe at any time.</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Checkbox 
              id="services_text_opt_in" 
              checked={profileData.services_text_opt_in || false}
              onCheckedChange={checked => setField("services_text_opt_in", checked === true)}
              className="mt-1"
            />
            <div className="space-y-1">
              <Label htmlFor="services_text_opt_in" className="font-bold cursor-pointer">Services Text Opt-In</Label>
              <p className="text-sm text-muted-foreground">By checking this box, I consent to receive transactional messages related to my account, orders, or services I have requested. These messages may include appointment reminders, order confirmations, and account notifications. Message frequency may vary. Message and Data rates may apply. Reply HELP for help or STOP to opt-out.</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Checkbox 
              id="marketing_text_opt_in" 
              checked={profileData.marketing_text_opt_in || false}
              onCheckedChange={checked => setField("marketing_text_opt_in", checked === true)}
              className="mt-1"
            />
            <div className="space-y-1">
              <Label htmlFor="marketing_text_opt_in" className="font-bold cursor-pointer">Marketing Text Opt-Ins</Label>
              <p className="text-sm text-muted-foreground">By checking this box, I consent to receive marketing and promotional messages, including special offers, discounts, and new product updates. Message frequency may vary. Message and Data rates may apply. Reply HELP for help or STOP to opt-out.</p>
            </div>
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-2 pt-6 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={onNext} className="min-h-[48px] w-full sm:w-auto">
          Next: your life
        </Button>
      </div>
    </div>
  );
};
