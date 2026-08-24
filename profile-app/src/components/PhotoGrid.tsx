import { useState, useRef, useEffect } from "react";
import { useAppContext } from "@/context/AppContext";
import { supabase } from "@/lib/supabase";
import { rpc } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, ChevronLeft, ChevronRight, X } from "lucide-react";

export const PhotoGrid = () => {
  const { profileData, setField, email, currentProfileId } = useAppContext();
  const { toast } = useToast();
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceIndexRef = useRef<number | null>(null);

  useEffect(() => {
    let initialPhotos: string[] = [];
    if (Array.isArray(profileData.photos) && profileData.photos.length > 0) {
      initialPhotos = [...profileData.photos];
    } else if (profileData.image_url) {
      initialPhotos = [profileData.image_url];
    }
    setPhotos(initialPhotos);
  }, [profileData.image_url, profileData.photos]);

  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

  const handleSavePhotos = async (newPhotos: string[]) => {
    try {
      await rpc('intake_update_profile', {
        p_email: email,
        p_image_url: newPhotos[0] || null,
        p_photos: newPhotos,
        p_clear_photos: true
      });
      setField("image_url", newPhotos[0] || null);
      setField("photos", newPhotos);
      
      if (email) {
        try {
          const freshProfile = await rpc('intake_load_profile', { p_email: email });
          if (freshProfile) {
            setField("completeness_pct", freshProfile.completeness_pct);
            setField("preferences_pct", freshProfile.preferences_pct);
          }
        } catch (e) {
          console.error(e);
        }
      }
    } catch (err) {
      throw err;
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (photos.length >= 6 && replaceIndexRef.current === null) {
      toast({ description: "Maximum 6 photos allowed.", variant: "destructive" });
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      toast({ description: "That photo is too large. Please choose a smaller one.", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const authUserId = sessionData?.session?.user?.id;
      
      if (!authUserId) {
        console.error("Upload failed: No session");
        throw new Error("Your session expired. Please sign in again.");
      }
      if (!currentProfileId) {
        console.error("Upload failed: No currentProfileId");
        throw new Error("Your profile is not ready yet. Please try again in a moment.");
      }

      let uploadFile: File | Blob = file;
      let ext = file.type ? file.type.split('/').pop() : file.name.split('.').pop();
      if (!ext) ext = 'jpg';
      ext = ext.toLowerCase();

      try {
        let image: HTMLImageElement | ImageBitmap;
        // Preserve orientation. If the browser does not apply EXIF rotation automatically, 
        // use createImageBitmap with { imageOrientation: 'from-image' } so portrait photos are not rotated sideways.
        if (typeof createImageBitmap !== 'undefined') {
          image = await createImageBitmap(file, { imageOrientation: 'from-image' });
        } else {
          // Read the selected file into an Image via createObjectURL.
          const url = URL.createObjectURL(file);
          const img = new Image();
          img.src = url;
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
          });
          image = img;
          URL.revokeObjectURL(url);
        }

        const MAX_DIM = 1600;
        let width = image.width;
        let height = image.height;
        
        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }
        
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(image, 0, 0, width, height);
          const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.85));
          if (blob) {
            uploadFile = blob;
            ext = 'jpg';
          }
        }
      } catch (resizeErr) {
        console.error('Photo resize failed, falling back to original:', resizeErr);
      }

      const path = `${authUserId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
      
      const { error } = await supabase.storage.from('profile-photos').upload(path, uploadFile);
      if (error) throw error;

      const url = `${SUPABASE_URL}/storage/v1/object/public/profile-photos/${path}`;
      
      const newPhotos = [...photos];
      if (replaceIndexRef.current !== null) {
        newPhotos[replaceIndexRef.current] = url;
      } else {
        newPhotos.push(url);
      }
      
      await handleSavePhotos(newPhotos);
      setPhotos(newPhotos);
      toast({ description: "Photo uploaded successfully", className: "bg-green-600 text-white" });
    } catch (err: any) {
      console.error('Photo upload failed:', err);
      toast({ 
        description: `We could not save your photo. (${err?.message ?? 'unknown error'})`, 
        variant: "destructive" 
      });
    } finally {
      setUploading(false);
      replaceIndexRef.current = null;
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this photo?")) return;
    
    const newPhotos = [...photos];
    newPhotos.splice(index, 1);
    
    try {
      await handleSavePhotos(newPhotos);
      setPhotos(newPhotos);
    } catch (err) {
      toast({ 
        description: "We could not save your photo. Please try again or contact us at info@thesmittenproject.com", 
        variant: "destructive" 
      });
    }
  };

  const handleMove = async (e: React.MouseEvent, index: number, direction: 'left' | 'right') => {
    e.stopPropagation();
    const newIndex = direction === 'left' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= photos.length) return;
    
    const newPhotos = [...photos];
    const item = newPhotos.splice(index, 1)[0];
    newPhotos.splice(newIndex, 0, item);
    
    try {
      await handleSavePhotos(newPhotos);
      setPhotos(newPhotos);
    } catch (err) {
      toast({ 
        description: "We could not save your photo. Please try again or contact us at info@thesmittenproject.com", 
        variant: "destructive" 
      });
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDrop = async (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const sourceIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (isNaN(sourceIndex) || sourceIndex === targetIndex || targetIndex >= photos.length) return;
    
    const newPhotos = [...photos];
    const item = newPhotos.splice(sourceIndex, 1)[0];
    newPhotos.splice(targetIndex, 0, item);
    
    try {
      await handleSavePhotos(newPhotos);
      setPhotos(newPhotos);
    } catch (err) {
      toast({ 
        description: "We could not save your photo. Please try again or contact us at info@thesmittenproject.com", 
        variant: "destructive" 
      });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const triggerUpload = (index: number | null) => {
    if (uploading) return;
    replaceIndexRef.current = index;
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4 mb-8">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Profile Photos <span className="text-destructive">*</span></h3>
        {uploading && <span className="text-sm text-muted-foreground animate-pulse">Uploading...</span>}
      </div>
      
      <div className="flex flex-col gap-2">
        {/* Main Photo */}
        {(() => {
          const index = 0;
          const photoUrl = photos[index];
          const isFilled = !!photoUrl;

          return (
            <div 
              key={index}
              className="relative aspect-square w-full bg-muted rounded-md overflow-hidden border flex items-center justify-center group cursor-pointer"
              onClick={() => isFilled ? triggerUpload(index) : triggerUpload(null)}
              draggable={isFilled}
              onDragStart={(e) => isFilled && handleDragStart(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              onDragOver={handleDragOver}
            >
              {isFilled ? (
                <>
                  <img 
                    src={photoUrl} 
                    alt={`Profile photo ${index + 1}`} 
                    className="w-full h-full object-cover"
                    onClick={(e) => { e.stopPropagation(); setLightboxIndex(index); }}
                  />
                  
                  <Badge className="absolute top-2 left-2 pointer-events-none">MAIN</Badge>

                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2 md:opacity-0 max-md:opacity-100">
                    <div className="flex justify-end">
                      <Button size="icon" variant="destructive" className="h-8 w-8" onClick={(e) => handleDelete(e, index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex justify-between">
                      <div />
                      {photos.length > 1 ? (
                        <Button size="icon" variant="secondary" className="h-8 w-8" onClick={(e) => handleMove(e, index, 'right')}>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      ) : <div />}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center text-muted-foreground">
                  <Plus className="h-8 w-8 mb-2" />
                  <span className="text-sm font-medium">Add Photo</span>
                </div>
              )}
            </div>
          );
        })()}

        {/* Extra Photos */}
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 5 }).map((_, i) => {
            const index = i + 1;
            const photoUrl = photos[index];
            const isFilled = !!photoUrl;

            return (
              <div 
                key={index}
                className="relative aspect-square w-full bg-muted rounded-md overflow-hidden border flex items-center justify-center group cursor-pointer"
                onClick={() => isFilled ? triggerUpload(index) : triggerUpload(null)}
                draggable={isFilled}
                onDragStart={(e) => isFilled && handleDragStart(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                onDragOver={handleDragOver}
              >
                {isFilled ? (
                  <>
                    <img 
                      src={photoUrl} 
                      alt={`Profile photo ${index + 1}`} 
                      className="w-full h-full object-cover"
                      onClick={(e) => { e.stopPropagation(); setLightboxIndex(index); }}
                    />

                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-1 md:opacity-0 max-md:opacity-100">
                      <div className="flex justify-end">
                        <Button size="icon" variant="destructive" className="h-6 w-6" onClick={(e) => handleDelete(e, index)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="flex justify-between">
                        <Button size="icon" variant="secondary" className="h-6 w-6" onClick={(e) => handleMove(e, index, 'left')}>
                          <ChevronLeft className="h-3 w-3" />
                        </Button>
                        {index < photos.length - 1 ? (
                          <Button size="icon" variant="secondary" className="h-6 w-6" onClick={(e) => handleMove(e, index, 'right')}>
                            <ChevronRight className="h-3 w-3" />
                          </Button>
                        ) : <div />}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center text-muted-foreground">
                    <Plus className="h-6 w-6" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <input 
        type="file" 
        accept="image/*" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileSelect} 
      />

      {lightboxIndex !== null && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute top-4 right-4 text-white hover:bg-white/20"
            onClick={() => setLightboxIndex(null)}
          >
            <X className="h-6 w-6" />
          </Button>
          
          <div className="relative max-w-4xl w-full max-h-full flex items-center justify-center">
            {lightboxIndex > 0 && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute left-4 text-white hover:bg-white/20"
                onClick={() => setLightboxIndex(lightboxIndex - 1)}
              >
                <ChevronLeft className="h-8 w-8" />
              </Button>
            )}
            
            <img 
              src={photos[lightboxIndex]} 
              alt={`Lightbox photo ${lightboxIndex + 1}`} 
              className="max-h-[85vh] max-w-full object-contain"
            />
            
            {lightboxIndex < photos.length - 1 && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute right-4 text-white hover:bg-white/20"
                onClick={() => setLightboxIndex(lightboxIndex + 1)}
              >
                <ChevronRight className="h-8 w-8" />
              </Button>
            )}
            
            <div className="absolute bottom-[-2rem] text-white/70 text-sm">
              {lightboxIndex + 1} of {photos.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
