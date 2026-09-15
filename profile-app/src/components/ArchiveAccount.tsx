import { useState, useEffect } from "react";
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { rpc } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { getProfileOptions } from "@/lib/options";

export const ArchiveAccount = () => {
  const { email, setStep, setProfileData, setEmail, setPhone, setFirstName, setLastName, setIsExistingUser, setCurrentProfileId, setTermsAcceptedAt, setTermsUrl } = useAppContext();
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<{value: string, label: string}[]>([]);
  const [relationshipSourceOptions, setRelationshipSourceOptions] = useState<{value: string, label: string}[]>([]);
  const [reason, setReason] = useState("");
  const [relationshipSource, setRelationshipSource] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [archiving, setArchiving] = useState(false);

  useEffect(() => {
    if (open && options.length === 0) {
      getProfileOptions().then(opts => {
        if (opts.archive_reason) {
          setOptions(opts.archive_reason);
        }
        if (opts.relationship_source) {
          setRelationshipSourceOptions(opts.relationship_source);
        }
      }).catch(console.error);
    }
  }, [open, options.length]);

  const isOther = reason === "other";
  const isInRelationship = reason === "in_relationship";
  const isValid = reason && 
    (!isOther || (isOther && note.trim().length > 0)) &&
    (!isInRelationship || (isInRelationship && relationshipSource));

  const handleArchive = async () => {
    if (!email || !isValid) return;
    
    setArchiving(true);
    setError(null);
    
    try {
      await rpc('participant_archive_profile', {
        p_email: email,
        p_reason: reason,
        p_note: note.trim() || null,
        p_relationship_source: reason === 'in_relationship' ? relationshipSource : null
      });
      
      await supabase.auth.signOut();
      
      // Clear local state
      setProfileData({});
      setEmail(null);
      setPhone(null);
      setFirstName(null);
      setLastName(null);
      setIsExistingUser(false);
      setCurrentProfileId(null);
      setTermsAcceptedAt(null);
      setTermsUrl(null);
      
      setOpen(false);
      setStep('archived');
    } catch (err: any) {
      setError(err.message || "Failed to archive profile. Please try again.");
      setArchiving(false);
    }
  };

  return (
    <div className="mt-12 flex justify-center border-t border-border pt-8">
      <Dialog open={open} onOpenChange={(isOpen: boolean) => {
        if (!archiving) {
          setOpen(isOpen);
          if (!isOpen) {
            setReason("");
            setRelationshipSource("");
            setNote("");
            setError(null);
          }
        }
      }}>
        <DialogTrigger asChild>
          <button className="min-h-[44px] px-3 text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline">
            Archive my profile
          </button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="brand-heading text-lg">Archive your profile</DialogTitle>
            <DialogDescription className="pt-2">
              Archiving removes you from matching and stops all emails and texts from us. Your profile is kept but hidden, and you can contact us if you want to come back.
              <br/><br/>
              We keep records of events you attended and any purchases, as we are required to.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {error && (
              <div className="text-sm font-medium text-destructive">{error}</div>
            )}
            <div className="space-y-2">
              <Label htmlFor="reason" className="brand-eyebrow">Reason *</Label>
              <Select value={reason} onValueChange={(val: string) => setReason(val)}>
                <SelectTrigger id="reason">
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  {options.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {isInRelationship && (
              <div className="space-y-2">
                <Label htmlFor="relationship_source" className="brand-eyebrow">Did you meet them through Smitten? *</Label>
                <Select value={relationshipSource} onValueChange={(val: string) => setRelationshipSource(val)}>
                  <SelectTrigger id="relationship_source">
                    <SelectValue placeholder="Select an option" />
                  </SelectTrigger>
                  <SelectContent>
                    {relationshipSourceOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="note" className="brand-eyebrow">
                Additional details {isOther ? "*" : "(optional)"}
              </Label>
              <Textarea 
                id="note" 
                placeholder={isOther ? "Please tell us more" : "Anything you want us to know? (optional)"} 
                value={note}
                onChange={e => setNote(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={archiving}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleArchive} disabled={!isValid || archiving}>
              {archiving ? "Archiving..." : "Archive my profile"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
