import { useAppContext } from "@/context/AppContext";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Circle } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export const CompletenessCard = () => {
  const { profileData } = useAppContext();

  const isFilled = (val: any) => {
    if (Array.isArray(val)) return val.length > 0;
    if (val === null || val === undefined || val === "") return false;
    return true;
  };

  const hasPhoto = Array.isArray(profileData.photos) ? profileData.photos.length > 0 : isFilled(profileData.image_url);

  const checklist = [
    { label: "Profile photo", filled: hasPhoto },
    { label: "Gender", filled: isFilled(profileData.gender) },
    { label: "Date of birth", filled: isFilled(profileData.date_of_birth) },
    { label: "Seeking", filled: isFilled(profileData.seeking) },
    { label: "Has kids", filled: isFilled(profileData.kids) },
    { label: "Wants kids", filled: isFilled(profileData.want_kids) },
    { label: "Politics", filled: isFilled(profileData.politics) },
    { label: "Religion", filled: isFilled(profileData.religion) },
    { label: "Income", filled: isFilled(profileData.income_level) },
    { label: "Min age preference", filled: isFilled(profileData.min_age) },
    { label: "Max age preference", filled: isFilled(profileData.max_age) },
    { label: "Zip / postal code", filled: isFilled(profileData.postal_code) },
  ];

  const filledCount = checklist.filter(item => item.filled).length;
  
  let completenessPct = profileData.completeness_pct || 0;
  if (completenessPct === 0 && filledCount > 0) {
    completenessPct = filledCount === 12 ? 100 : filledCount * 8;
  }

  const preferencesPct = profileData.preferences_pct || 0;

  const isComplete = completenessPct >= 100;

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="brand-subheading">Profile completeness</CardTitle>
          <span className={`font-bold ${isComplete ? 'text-green-600' : 'text-primary'}`}>
            {completenessPct}%
          </span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          These are the most commonly used matchmaking fields. Completing your entire profile gives matchmakers the full picture and leads to better matches.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <Progress 
          value={completenessPct} 
          className="h-2" 
          indicatorClassName={isComplete ? "bg-green-600" : "bg-primary"}
        />

        <div className="grid grid-cols-1 gap-2 text-sm">
          {checklist.map((item, idx) => (
            <div key={idx} className={`flex items-center gap-2 ${item.filled ? 'text-foreground' : 'text-muted-foreground'}`}>
              {item.filled ? (
                <Check className="h-4 w-4 text-green-600 shrink-0" />
              ) : (
                <Circle className="h-4 w-4 shrink-0 opacity-20" />
              )}
              <span>{item.label}</span>
            </div>
          ))}
        </div>

        <Separator />

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="brand-eyebrow">Match preferences</h3>
            <span className="font-bold text-primary text-sm">{preferencesPct}%</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Sharing your preferences helps us find even better matches for you.
          </p>
          <Progress value={preferencesPct} className="h-1.5" indicatorClassName="bg-primary" />
        </div>
      </CardContent>
    </Card>
  );
};
