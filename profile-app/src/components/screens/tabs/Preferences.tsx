import { useState, useEffect } from "react";
import { useAppContext } from "@/context/AppContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getProfileOptions } from "@/lib/options";

export const Preferences = ({ onBack }: { onBack: () => void }) => {
  const { profileData, setField } = useAppContext();
  const [options, setOptions] = useState<Record<string, {value: string, label: string}[]>>({});

  useEffect(() => {
    getProfileOptions().then(setOptions).catch(console.error);
  }, []);

  const handleArrayToggle = (fieldKey: string, value: string, checked: boolean, groupOptions: {value: string, label: string}[] = []) => {
    const currentArray = Array.isArray(profileData[fieldKey]) ? profileData[fieldKey] : [];
    
    const toggledOption = groupOptions.find(opt => opt.value === value);
    const isAny = toggledOption ? (toggledOption.label.toLowerCase() === "any" || toggledOption.label.toLowerCase() === "any / all") : false;

    if (checked) {
      if (isAny) {
        const valuesToSet = groupOptions
          .filter(opt => opt.label.toLowerCase() !== "prefer not to say" && opt.label.toLowerCase() !== "other")
          .map(opt => opt.value);
        setField(fieldKey, valuesToSet);
      } else {
        setField(fieldKey, [...currentArray, value]);
      }
    } else {
      if (isAny) {
        setField(fieldKey, []);
      } else {
        setField(fieldKey, currentArray.filter((v: string) => v !== value));
      }
    }
  };

  const renderCheckboxGroup = (fieldKey: string, categoryName: string) => {
    const groupOptions = options[categoryName] || [];
    const currentArray = Array.isArray(profileData[fieldKey]) ? profileData[fieldKey] : [];
    
    const anyOption = groupOptions.find(opt => opt.label.toLowerCase() === "any" || opt.label.toLowerCase() === "any / all");
    const isAnyChecked = anyOption ? currentArray.includes(anyOption.value) : false;

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {groupOptions.map(opt => {
          const isThisAny = opt.label.toLowerCase() === "any" || opt.label.toLowerCase() === "any / all";
          const isException = opt.label.toLowerCase() === "prefer not to say" || opt.label.toLowerCase() === "other";
          const isDisabled = isAnyChecked && !isThisAny && !isException;
          
          return (
            <div key={opt.value} className="flex items-center space-x-2">
              <Checkbox 
                id={`${fieldKey}-${opt.value}`} 
                checked={currentArray.includes(opt.value)}
                disabled={isDisabled}
                onCheckedChange={(checked) => handleArrayToggle(fieldKey, opt.value, checked === true, groupOptions)}
              />
              <Label 
                htmlFor={`${fieldKey}-${opt.value}`} 
                className={`font-normal cursor-pointer ${isDisabled ? 'text-muted-foreground' : ''}`}
              >
                {opt.label}
              </Label>
            </div>
          );
        })}
      </div>
    );
  };

  const dealbreakers = Array.isArray(profileData.dealbreakers) ? profileData.dealbreakers : [];
  const dealbreakersOptions = options.dealbreakers || [];
  const otherOption = dealbreakersOptions.find(opt => opt.label.toLowerCase() === "other");
  const isOtherChecked = otherOption ? dealbreakers.includes(otherOption.value) : false;

  const handleIntChange = (fieldKey: string, value: string) => {
    const parsed = parseInt(value, 10);
    if (isNaN(parsed)) {
      setField(fieldKey, null);
    } else {
      setField(fieldKey, parsed);
    }
  };

  return (
    <div className="space-y-8 py-4">
      <section className="space-y-4">
        <h3 className="text-xl font-semibold">Who you are hoping to meet</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="min_age">Minimum Age</Label>
            <Input 
              id="min_age" 
              type="number"
              min={18}
              max={99}
              placeholder="e.g. 28"
              value={profileData.min_age || ""} 
              onChange={e => handleIntChange("min_age", e.target.value)} 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="max_age">Maximum Age</Label>
            <Input 
              id="max_age" 
              type="number"
              min={18}
              max={99}
              placeholder="e.g. 45"
              value={profileData.max_age || ""} 
              onChange={e => handleIntChange("max_age", e.target.value)} 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="max_distance">Maximum Distance (miles)</Label>
            <Select 
              value={profileData.max_distance ? profileData.max_distance.toString() : ""} 
              onValueChange={(value: string) => handleIntChange("max_distance", value)}
            >
              <SelectTrigger id="max_distance">
                <SelectValue placeholder="Select distance" />
              </SelectTrigger>
              <SelectContent>
                {(options.max_distance || []).map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2" />

          <div className="space-y-2">
            <Label htmlFor="preferred_height_min">Preferred Height Min</Label>
            <Input 
              id="preferred_height_min" 
              placeholder="e.g. 5'4&quot;"
              value={profileData.preferred_height_min || ""} 
              onChange={e => setField("preferred_height_min", e.target.value)} 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="preferred_height_max">Preferred Height Max</Label>
            <Input 
              id="preferred_height_max" 
              placeholder="e.g. 6'2&quot;"
              value={profileData.preferred_height_max || ""} 
              onChange={e => setField("preferred_height_max", e.target.value)} 
            />
          </div>
        </div>

        <div className="space-y-6 pt-4">
          <div className="space-y-3">
            <Label className="text-base font-medium">Preferred Body Type</Label>
            {renderCheckboxGroup("preferred_body_type", "preferred_body_type")}
          </div>

          <div className="space-y-3">
            <Label className="text-base font-medium">Preferred Ethnicity</Label>
            {renderCheckboxGroup("preferred_ethnicities", "ethnicity")}
          </div>

          <div className="space-y-3">
            <Label className="text-base font-medium">Preferred Religion</Label>
            {renderCheckboxGroup("preferred_religion", "preferred_religion")}
          </div>

          <div className="space-y-3">
            <Label className="text-base font-medium">Preferred Politics</Label>
            {renderCheckboxGroup("preferred_politics", "preferred_politics")}
          </div>

          <div className="space-y-3">
            <Label className="text-base font-medium">Preferred Education</Label>
            {renderCheckboxGroup("preferred_education", "preferred_education")}
          </div>

          <div className="space-y-3">
            <Label className="text-base font-medium">Preferred Smoking</Label>
            {renderCheckboxGroup("preferred_smoking", "preferred_smoking")}
          </div>

          <div className="space-y-3">
            <Label className="text-base font-medium">Preferred Drinking</Label>
            {renderCheckboxGroup("preferred_alcohol", "preferred_alcohol")}
          </div>

          <div className="space-y-3">
            <Label className="text-base font-medium">Preferred Relationship Status</Label>
            {renderCheckboxGroup("preferred_relationship_status", "preferred_relationship_status")}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="preferred_income">Preferred Income Level</Label>
            <Select 
              value={profileData.preferred_income || ""} 
              onValueChange={(value: string) => setField("preferred_income", value)}
            >
              <SelectTrigger id="preferred_income">
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                {(options.preferred_income || []).map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-xl font-semibold">What matters to you</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="date_with_kids">Open to dating someone with kids?</Label>
            <Select 
              value={profileData.date_with_kids || ""} 
              onValueChange={(value: string) => setField("date_with_kids", value)}
            >
              <SelectTrigger id="date_with_kids">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {(options.date_with_kids || []).map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="relocation_in">Willing to relocate (In State)?</Label>
            <Select 
              value={profileData.relocation_in || ""} 
              onValueChange={(value: string) => setField("relocation_in", value)}
            >
              <SelectTrigger id="relocation_in">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {(options.relocation || []).map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="relocation_out">Willing to relocate (Out of State)?</Label>
            <Select 
              value={profileData.relocation_out || ""} 
              onValueChange={(value: string) => setField("relocation_out", value)}
            >
              <SelectTrigger id="relocation_out">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {(options.relocation || []).map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-xl font-semibold">Absolute no-gos</h3>
        <p className="text-sm text-muted-foreground">Any strict dealbreakers our matchmakers should know about?</p>
        
        <div className="space-y-4">
          {renderCheckboxGroup("dealbreakers", "dealbreakers")}
          
          {isOtherChecked && (
            <div className="pt-2">
              <Textarea 
                id="dealbreakers_other" 
                rows={2}
                placeholder="Describe any other dealbreakers..."
                value={profileData.dealbreakers_other || ""} 
                onChange={e => setField("dealbreakers_other", e.target.value)} 
              />
            </div>
          )}
        </div>
      </section>

      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={onBack}>Back: Your Life</Button>
      </div>
    </div>
  );
};
