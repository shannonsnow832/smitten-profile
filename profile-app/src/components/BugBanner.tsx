import { useState } from "react";
import { X } from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export const BugBanner = () => {
  const [isWelcomeVisible, setIsWelcomeVisible] = useState(true);
  const [isBugVisible, setIsBugVisible] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { email, currentProfileId, profileData } = useAppContext();
  const { toast } = useToast();

  const [reporterName, setReporterName] = useState("");
  const [reporterEmail, setReporterEmail] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isWelcomeVisible && !isBugVisible) return null;

  const handleOpen = () => {
    if (email) {
      const first = profileData?.first_name || "";
      const last = profileData?.last_name || "";
      const fullName = [first, last].filter(Boolean).join(" ");
      setReporterName(fullName);
      setReporterEmail(email);
    } else {
      setReporterName("");
      setReporterEmail("");
    }
    setIsModalOpen(true);
  };

  const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const handleSubmit = async () => {
    if (!reporterEmail.trim() || !description.trim()) return;
    
    if (!isValidEmail(reporterEmail.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      let screenshot_path = null;

      if (file) {
        const ext = file.name.split('.').pop();
        const path = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
        try {
          const { data, error: uploadError } = await supabase.storage.from('bug-screenshots').upload(path, file);
          if (!uploadError && data) {
            screenshot_path = data.path;
          }
        } catch (e) {
          // Ignore upload error
        }
      }

      const { error: dbError } = await supabase.from('bug_reports').insert({
        app: 'profile.smittensingles.com',
        page_url: window.location.href,
        reporter_name: reporterName.trim() || null,
        reporter_email: reporterEmail.trim(),
        profile_id: currentProfileId || null,
        description: description.trim(),
        screenshot_path,
        user_agent: navigator.userAgent
      });

      if (dbError) throw dbError;

      setIsModalOpen(false);
      setDescription("");
      setFile(null);
      toast({
        title: "Thank you. We got your report.",
      });
    } catch (err: any) {
      setError(err.message || "Failed to submit report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {isBugVisible && (
        <div className="flex flex-col items-center justify-between gap-2 bg-brand-gray-dark px-4 py-2 text-sm text-white sm:flex-row">
          <div className="flex-1 text-center sm:text-left">
            You are using an early version of the Smitten Singles profile. Things may change. We appreciate your patience.
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={handleOpen} 
              className="min-h-[36px] whitespace-nowrap px-1 underline hover:opacity-80"
            >
              Report a Bug
            </button>
            <button 
              onClick={() => setIsBugVisible(false)} 
              className="flex min-h-[36px] min-w-[36px] items-center justify-center p-1 hover:opacity-80"
              aria-label="Dismiss"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {isWelcomeVisible && (
        <div className="flex flex-col items-center justify-between gap-2 border-b border-border bg-muted px-4 py-2 text-sm text-muted-foreground sm:flex-row">
          <div className="flex-1 text-center sm:text-left">
            Welcome to our new profile system. Having trouble? Try <a href="https://me.smittensingles.com" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary underline hover:opacity-80">me.smittensingles.com</a> or contact <a href="mailto:info@thesmittenproject.com" className="font-semibold text-primary underline hover:opacity-80">info@thesmittenproject.com</a>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsWelcomeVisible(false)} 
              className="flex min-h-[36px] min-w-[36px] items-center justify-center p-1 hover:opacity-80"
              aria-label="Dismiss"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      <Dialog open={isModalOpen} onOpenChange={(open: boolean) => {
        if (!submitting) {
          setIsModalOpen(open);
          if (!open) {
            setDescription("");
            setFile(null);
            setError(null);
          }
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report a bug</DialogTitle>
            <DialogDescription className="pt-2">
              Tell us what went wrong. A screenshot helps a lot.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {error && (
              <div className="text-sm font-medium text-destructive">{error}</div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="bug-name">Your Name</Label>
              <Input
                id="bug-name"
                value={reporterName}
                onChange={(e) => setReporterName(e.target.value)}
                placeholder="Optional"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bug-email">Your Email *</Label>
              <Input
                id="bug-email"
                type="email"
                value={reporterEmail}
                onChange={(e) => setReporterEmail(e.target.value)}
                placeholder="name@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bug-description">Description *</Label>
              <Textarea
                id="bug-description"
                rows={4}
                placeholder="What happened?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bug-screenshot">Screenshot (optional)</Label>
              <Input
                id="bug-screenshot"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    setFile(e.target.files[0]);
                  } else {
                    setFile(null);
                  }
                }}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!description.trim() || !reporterEmail.trim() || submitting}>
              {submitting ? "Sending..." : "Send Report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
