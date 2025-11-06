import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Camera, X, Upload } from "lucide-react";

interface Photo {
  id: string;
  photo_url: string;
  is_primary: boolean;
  display_order: number;
}

interface PhotoGalleryProps {
  userId: string;
  photos: Photo[];
  isEditing: boolean;
  onPhotosUpdate: () => void;
}

export const PhotoGallery = ({ userId, photos, isEditing, onPhotosUpdate }: PhotoGalleryProps) => {
  const [uploading, setUploading] = useState(false);

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      for (let i = 0; i < Math.min(files.length, 6 - photos.length); i++) {
        const file = files[i];
        const fileExt = file.name.split(".").pop();
        const fileName = `${userId}-${Date.now()}-${i}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("post-images")
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("post-images").getPublicUrl(fileName);

        const { error: insertError } = await supabase.from("profile_photos").insert({
          user_id: userId,
          photo_url: publicUrl,
          display_order: photos.length + i,
          is_primary: photos.length === 0 && i === 0,
        });

        if (insertError) throw insertError;
      }

      toast.success("Photos uploaded successfully!");
      onPhotosUpdate();
    } catch (error) {
      toast.error("Failed to upload photos");
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const deletePhoto = async (photoId: string) => {
    const { error } = await supabase.from("profile_photos").delete().eq("id", photoId);

    if (error) {
      toast.error("Failed to delete photo");
      return;
    }

    toast.success("Photo deleted");
    onPhotosUpdate();
  };

  const setPrimaryPhoto = async (photoId: string) => {
    // Remove primary from all photos
    await supabase
      .from("profile_photos")
      .update({ is_primary: false })
      .eq("user_id", userId);

    // Set new primary
    const { error } = await supabase
      .from("profile_photos")
      .update({ is_primary: true })
      .eq("id", photoId);

    if (error) {
      toast.error("Failed to set primary photo");
      return;
    }

    toast.success("Primary photo updated");
    onPhotosUpdate();
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {photos.map((photo) => (
          <Card key={photo.id} className="relative aspect-square overflow-hidden group">
            <img
              src={photo.photo_url}
              alt="Profile"
              className="w-full h-full object-cover"
            />
            {photo.is_primary && (
              <div className="absolute top-2 left-2">
                <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                  Primary
                </span>
              </div>
            )}
            {isEditing && (
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {!photo.is_primary && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setPrimaryPhoto(photo.id)}
                  >
                    <Camera className="h-4 w-4 mr-1" />
                    Set Primary
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => deletePhoto(photo.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </Card>
        ))}

        {isEditing && photos.length < 6 && (
          <label className="relative aspect-square border-2 border-dashed rounded-lg cursor-pointer hover:border-primary transition-colors flex flex-col items-center justify-center">
            <Upload className="h-8 w-8 text-muted-foreground mb-2" />
            <span className="text-sm text-muted-foreground">
              Add Photo ({photos.length}/6)
            </span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoUpload}
              className="hidden"
              disabled={uploading}
            />
          </label>
        )}
      </div>

      {uploading && (
        <p className="text-sm text-muted-foreground text-center">Uploading photos...</p>
      )}
    </div>
  );
};
