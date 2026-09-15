import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";

export const Success = () => {
  const { setStep } = useAppContext();

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-12 text-center sm:px-6">
      <div className="space-y-3">
        <h1 className="brand-heading text-2xl text-primary sm:text-3xl">Profile saved</h1>
        <p className="text-muted-foreground">
          Thanks. Your profile is saved and our team can see it.
        </p>
      </div>
      <div className="flex flex-col gap-3">
        <Button asChild className="min-h-[48px] w-full">
          <a href="https://smittensingles.com">Go to Smitten Singles</a>
        </Button>
        <Button onClick={() => setStep('profile')} variant="outline" className="min-h-[48px] w-full">
          Back to my profile
        </Button>
      </div>
    </div>
  );
};
