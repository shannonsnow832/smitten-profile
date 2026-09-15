import { Button } from "@/components/ui/button";

export const Archived = () => {
  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col items-center justify-center gap-6 px-4 py-12 text-center sm:px-6">
      <h1 className="brand-heading text-2xl text-primary sm:text-3xl">Your profile is archived</h1>
      <p className="text-muted-foreground">
        You have been removed from matching and will not receive further emails or texts from us. If
        you change your mind, contact us at{" "}
        <a
          href="mailto:info@thesmittenproject.com"
          className="font-semibold text-primary underline"
        >
          info@thesmittenproject.com
        </a>
      </p>
      <Button asChild className="min-h-[48px] w-full">
        <a href="https://smittensingles.com">Go to Smitten Singles</a>
      </Button>
    </div>
  );
};
