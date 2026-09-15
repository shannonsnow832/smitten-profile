import { useState, useEffect } from "react";
import { useAppContext } from "@/context/AppContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getProfileOptions } from "@/lib/options";
import { ActivitiesSection } from "./ActivitiesSection";

export const Lifestyle = ({ onNext, onBack }: { onNext: () => void, onBack: () => void }) => {
  const { profileData, setField } = useAppContext();
  const [options, setOptions] = useState<Record<string, {value: string, label: string}[]>>({});

  useEffect(() => {
    getProfileOptions().then(setOptions).catch(console.error);
  }, []);

  const [heightFt, setHeightFt] = useState("");
  const [heightIn, setHeightIn] = useState("");

  useEffect(() => {
    if (profileData.height_inches) {
      setHeightFt(Math.floor(profileData.height_inches / 12).toString());
      setHeightIn((profileData.height_inches % 12).toString());
    }
  }, [profileData.height_inches]);

  const handleHeightChange = (type: 'ft' | 'in', val: string) => {
    const newFt = type === 'ft' ? val : heightFt;
    const newIn = type === 'in' ? val : heightIn;
    if (type === 'ft') setHeightFt(val);
    if (type === 'in') setHeightIn(val);
    if (!newFt || !newIn) {
      setField("height_inches", null);
    } else {
      setField("height_inches", parseInt(newFt) * 12 + parseInt(newIn));
    }
  };

  const ethnicityValue = Array.isArray(profileData.ethnicity) && profileData.ethnicity.length > 0 
    ? profileData.ethnicity[0] 
    : "";

  const handleEthnicityChange = (val: string) => {
    setField("ethnicity", [val]);
  };

  const activities = Array.isArray(profileData.activities_hobbies) ? profileData.activities_hobbies : [];
  const handleActivityChange = (val: string, checked: boolean) => {
    if (checked) {
      setField("activities_hobbies", [...activities, val]);
    } else {
      setField("activities_hobbies", activities.filter(a => a !== val));
    }
  };

  const filterOptions = (opts: {value: string, label: string}[] = []) => {
    return opts.filter(opt => {
      const lower = opt.label.toLowerCase();
      return lower !== "any" && lower !== "any / all";
    });
  };

  return (
    <div className="space-y-8 py-4">
      <section className="space-y-4">
        <h3 className="brand-subheading text-lg sm:text-xl">Your life</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Height</Label>
            <div className="flex space-x-2">
              <Select value={heightFt} onValueChange={(value: string) => handleHeightChange('ft', value)}>
                <SelectTrigger id="height_ft">
                  <SelectValue placeholder="Feet" />
                </SelectTrigger>
                <SelectContent>
                  {[4, 5, 6, 7].map(ft => (
                    <SelectItem key={ft} value={ft.toString()}>{ft} ft</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={heightIn} onValueChange={(value: string) => handleHeightChange('in', value)}>
                <SelectTrigger id="height_in">
                  <SelectValue placeholder="Inches" />
                </SelectTrigger>
                <SelectContent>
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(inc => (
                    <SelectItem key={inc} value={inc.toString()}>{inc} in</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="education">Education</Label>
            <Select 
              value={profileData.education || ""} 
              onValueChange={(value: string) => setField("education", value)}
            >
              <SelectTrigger id="education">
                <SelectValue placeholder="Select education" />
              </SelectTrigger>
              <SelectContent>
                {filterOptions(options.education).map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="university">University / College (optional)</Label>
            <Input
              id="university"
              placeholder="e.g. University of Nebraska"
              value={profileData.university || ""}
              onChange={e => setField("university", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="occupation">Occupation / Industry</Label>
            <Input 
              id="occupation" 
              placeholder="e.g. Software Engineer, Healthcare"
              value={profileData.occupation || ""} 
              onChange={e => setField("occupation", e.target.value)} 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="employer">Employer</Label>
            <Input 
              id="employer" 
              placeholder="Company name"
              value={profileData.employer || ""} 
              onChange={e => setField("employer", e.target.value)} 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="kids">Do you have kids?</Label>
            <Select 
              value={profileData.kids || ""} 
              onValueChange={(value: string) => setField("kids", value)}
            >
              <SelectTrigger id="kids">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {filterOptions(options.kids).map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="want_kids">Do you want kids?</Label>
            <Select 
              value={profileData.want_kids || ""} 
              onValueChange={(value: string) => setField("want_kids", value)}
            >
              <SelectTrigger id="want_kids">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {filterOptions(options.want_kids).map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="smoking">Smoking</Label>
            <Select 
              value={profileData.smoking || ""} 
              onValueChange={(value: string) => setField("smoking", value)}
            >
              <SelectTrigger id="smoking">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {filterOptions(options.smoking).map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="drinking">Drinking</Label>
            <Select 
              value={profileData.drinking || ""} 
              onValueChange={(value: string) => setField("drinking", value)}
            >
              <SelectTrigger id="drinking">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {filterOptions(options.drinking).map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="religion">Religion</Label>
            <Select 
              value={profileData.religion || ""} 
              onValueChange={(value: string) => setField("religion", value)}
            >
              <SelectTrigger id="religion">
                <SelectValue placeholder="Select religion" />
              </SelectTrigger>
              <SelectContent>
                {filterOptions(options.religion).map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="politics">Politics</Label>
            <Select 
              value={profileData.politics || ""} 
              onValueChange={(value: string) => setField("politics", value)}
            >
              <SelectTrigger id="politics">
                <SelectValue placeholder="Select politics" />
              </SelectTrigger>
              <SelectContent>
                {filterOptions(options.politics).map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="income_level">Income Level</Label>
            <Select 
              value={profileData.income_level || ""} 
              onValueChange={(value: string) => setField("income_level", value)}
            >
              <SelectTrigger id="income_level">
                <SelectValue placeholder="Select income level" />
              </SelectTrigger>
              <SelectContent>
                {filterOptions(options.income_level).map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ethnicity">Ethnicity</Label>
            <Select 
              value={ethnicityValue} 
              onValueChange={handleEthnicityChange}
            >
              <SelectTrigger id="ethnicity">
                <SelectValue placeholder="Select ethnicity" />
              </SelectTrigger>
              <SelectContent>
                {filterOptions(options.ethnicity).map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="body_type">Body Type</Label>
            <Select 
              value={profileData.body_type || ""} 
              onValueChange={(value: string) => setField("body_type", value)}
            >
              <SelectTrigger id="body_type">
                <SelectValue placeholder="Select body type" />
              </SelectTrigger>
              <SelectContent>
                {filterOptions(options.body_type).map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="hair_color">Hair Color</Label>
            <Select 
              value={profileData.hair_color || ""} 
              onValueChange={(value: string) => setField("hair_color", value)}
            >
              <SelectTrigger id="hair_color">
                <SelectValue placeholder="Select hair color" />
              </SelectTrigger>
              <SelectContent>
                {filterOptions(options.hair_color).map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="eye_color">Eye Color</Label>
            <Select 
              value={profileData.eye_color || ""} 
              onValueChange={(value: string) => setField("eye_color", value)}
            >
              <SelectTrigger id="eye_color">
                <SelectValue placeholder="Select eye color" />
              </SelectTrigger>
              <SelectContent>
                {filterOptions(options.eye_color).map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pets">Pets</Label>
            <Input 
              id="pets" 
              placeholder="e.g. Dog, Cat, None"
              value={profileData.pets || ""} 
              onChange={e => setField("pets", e.target.value)} 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="languages">Languages Spoken</Label>
            <Input 
              id="languages" 
              placeholder="e.g. English, Spanish"
              value={profileData.languages || ""} 
              onChange={e => setField("languages", e.target.value)} 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="relationship_status">Relationship Status</Label>
            <Select 
              value={profileData.relationship_status || ""} 
              onValueChange={(value: string) => setField("relationship_status", value)}
            >
              <SelectTrigger id="relationship_status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {filterOptions(options.relationship_status).map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <ActivitiesSection 
        activities={activities}
        options={options.activities || []}
        handleActivityChange={handleActivityChange}
        filterOptions={filterOptions}
      />

      <section className="space-y-4">
        <h3 className="brand-subheading text-lg sm:text-xl">Ideal Match Description</h3>
        <div className="space-y-2">
          <Textarea 
            id="ideal_match" 
            rows={3} 
            placeholder="Describe who you are looking for..." 
            value={profileData.ideal_match || ""}
            onChange={e => setField("ideal_match", e.target.value)}
          />
        </div>
      </section>

      <div className="flex flex-col gap-2 pt-6 sm:flex-row sm:justify-between">
        <Button variant="outline" onClick={onBack} className="min-h-[48px] w-full sm:w-auto">
          Back: about you
        </Button>
        <Button variant="outline" onClick={onNext} className="min-h-[48px] w-full sm:w-auto">
          Next: your matches
        </Button>
      </div>
    </div>
  );
};
