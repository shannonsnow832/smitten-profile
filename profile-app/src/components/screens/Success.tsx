import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";

export const Success = () => {
  const { setStep } = useAppContext();

  return (
    <div className="flex flex-col items-center justify-center space-y-6 p-8 max-w-md mx-auto mt-12 text-center">
      <h2 className="text-3xl font-bold uppercase text-primary">Profile Saved</h2>
      <p className="text-lg text-muted-foreground">
        Thanks. Your profile is saved and our team can see it.
      </p>
      <div className="flex flex-col w-full space-y-3 mt-4">
        <Button asChild className="w-full">
          <a href="https://smittensingles.com">Go to Smitten Singles</a>
        </Button>
        <Button onClick={() => setStep('profile')} variant="outline" className="w-full">
          Back to My Profile
        </Button>
      </div>
    </div>
  );
};
