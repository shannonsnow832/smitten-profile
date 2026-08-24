import { Button } from "@/components/ui/button";

export const Archived = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 max-w-md mx-auto text-center space-y-6">
      <h2 className="text-3xl font-bold uppercase text-primary">Your profile is archived</h2>
      <p className="text-lg text-muted-foreground">
        You have been removed from matching and will not receive further emails or texts from us. If you change your mind, contact us at <a href="mailto:info@thesmittenproject.com" className="underline hover:text-foreground">info@thesmittenproject.com</a>
      </p>
      <div className="pt-4 w-full">
        <Button asChild className="w-full">
          <a href="https://smittensingles.com">Go to Smitten Singles</a>
        </Button>
      </div>
    </div>
  );
};
