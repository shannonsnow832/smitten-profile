import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface ActivitiesSectionProps {
  activities: string[];
  options: { value: string; label: string }[];
  handleActivityChange: (val: string, checked: boolean) => void;
  filterOptions: (opts: { value: string; label: string }[]) => { value: string; label: string }[];
}

export const ActivitiesSection = ({ activities, options, handleActivityChange, filterOptions }: ActivitiesSectionProps) => {
  return (
    <section className="space-y-4">
      <h3 className="text-xl font-semibold">Activities and Hobbies</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filterOptions(options).map(opt => (
          <div key={opt.value} className="flex items-center space-x-2">
            <Checkbox 
              id={`activity-${opt.value}`} 
              checked={activities.includes(opt.value)}
              onCheckedChange={(checked) => handleActivityChange(opt.value, checked === true)}
            />
            <Label htmlFor={`activity-${opt.value}`} className="font-normal cursor-pointer">{opt.label}</Label>
          </div>
        ))}
      </div>
    </section>
  );
};
