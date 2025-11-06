import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Camera, User, Save, Plus, X, GraduationCap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { PhotoGallery } from '@/components/PhotoGallery';
import { VerificationBadge } from '@/components/VerificationBadge';

interface Profile {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  department?: string;
  bio?: string;
  year_of_study?: number;
  interests?: string[];
  is_alumni: boolean;
  graduation_year?: number;
  current_company?: string;
  current_position?: string;
  linkedin_url?: string;
  open_to_mentoring: boolean;
  verification_status?: 'unverified' | 'pending' | 'verified';
}

interface ProfilePhoto {
  id: string;
  photo_url: string;
  is_primary: boolean;
  display_order: number;
}

const Profile = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Partial<Profile>>({});
  const [newInterest, setNewInterest] = useState('');
  const [uploading, setUploading] = useState(false);
  const [showAlumniFields, setShowAlumniFields] = useState(false);
  const [profilePhotos, setProfilePhotos] = useState<ProfilePhoto[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchPhotos();
    }
  }, [user]);

  const fetchProfile = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user?.id)
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive",
      });
    } else {
      const profileData = {
        ...data,
        verification_status: (data.verification_status as 'unverified' | 'pending' | 'verified') || 'unverified'
      };
      setProfile(profileData);
      setEditedProfile(profileData);
      setShowAlumniFields(data.is_alumni || false);
    }
  };

  const fetchPhotos = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('profile_photos')
      .select('*')
      .eq('user_id', user.id)
      .order('display_order', { ascending: true });

    if (!error && data) {
      setProfilePhotos(data);
    }
  };

  const handleSave = async () => {
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: editedProfile.full_name,
        department: editedProfile.department,
        bio: editedProfile.bio,
        year_of_study: editedProfile.year_of_study,
        interests: editedProfile.interests,
        is_alumni: editedProfile.is_alumni,
        graduation_year: editedProfile.graduation_year,
        current_company: editedProfile.current_company,
        current_position: editedProfile.current_position,
        linkedin_url: editedProfile.linkedin_url,
        open_to_mentoring: editedProfile.open_to_mentoring,
      })
      .eq('id', user?.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Profile updated successfully!",
      });
      setProfile({ ...profile!, ...editedProfile });
      setIsEditing(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${user?.id}-${Math.random()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('post-images')
      .upload(fileName, file);

    if (uploadError) {
      toast({
        title: "Error",
        description: "Failed to upload avatar",
        variant: "destructive",
      });
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('post-images')
      .getPublicUrl(fileName);

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', user?.id);

    if (updateError) {
      toast({
        title: "Error",
        description: "Failed to update avatar",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Avatar updated successfully!",
      });
      setProfile({ ...profile!, avatar_url: publicUrl });
      setEditedProfile({ ...editedProfile, avatar_url: publicUrl });
    }
    
    setUploading(false);
  };

  const addInterest = () => {
    if (newInterest.trim()) {
      const updatedInterests = [...(editedProfile.interests || []), newInterest.trim()];
      setEditedProfile({ ...editedProfile, interests: updatedInterests });
      setNewInterest('');
    }
  };

  const removeInterest = (index: number) => {
    const updatedInterests = editedProfile.interests?.filter((_, i) => i !== index) || [];
    setEditedProfile({ ...editedProfile, interests: updatedInterests });
  };

  if (!profile) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold">My Profile</h1>
          {profile.verification_status && (
            <VerificationBadge status={profile.verification_status} />
          )}
        </div>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)} className="gap-2 w-full sm:w-auto">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Edit Profile</span>
            <span className="sm:hidden">Edit</span>
          </Button>
        ) : (
          <div className="flex gap-2 w-full sm:w-auto">
            <Button onClick={handleSave} className="gap-2 flex-1 sm:flex-none">
              <Save className="h-4 w-4" />
              Save
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsEditing(false);
                setEditedProfile(profile);
              }}
              className="flex-1 sm:flex-none"
            >
              Cancel
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Profile Picture & Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Picture</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="relative mx-auto w-24 h-24 sm:w-32 sm:h-32">
              <Avatar className="w-24 h-24 sm:w-32 sm:h-32">
                <AvatarImage src={profile.avatar_url} />
                <AvatarFallback className="text-xl sm:text-2xl">
                  {profile.full_name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              {isEditing && (
                <label className="absolute bottom-0 right-0 bg-primary text-primary-foreground p-1.5 sm:p-2 rounded-full cursor-pointer hover:bg-primary/90 transition-colors">
                  <Camera className="h-3 w-3 sm:h-4 sm:w-4" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
              )}
            </div>
            {uploading && (
              <p className="text-sm text-muted-foreground">Uploading...</p>
            )}
          </CardContent>
        </Card>

        {/* Photo Gallery */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Photo Gallery</CardTitle>
          </CardHeader>
          <CardContent>
            <PhotoGallery
              userId={user?.id || ''}
              photos={profilePhotos}
              isEditing={isEditing}
              onPhotosUpdate={fetchPhotos}
            />
          </CardContent>
        </Card>

        {/* Basic Information */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Full Name</label>
                {isEditing ? (
                  <Input
                    value={editedProfile.full_name || ''}
                    onChange={(e) => setEditedProfile({ ...editedProfile, full_name: e.target.value })}
                    placeholder="Enter your full name"
                  />
                ) : (
                  <p className="text-muted-foreground">{profile.full_name || 'Not set'}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Email</label>
                <p className="text-muted-foreground">{profile.email}</p>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Department</label>
                {isEditing ? (
                  <Select
                    value={editedProfile.department || ''}
                    onValueChange={(value) => setEditedProfile({ ...editedProfile, department: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="computer-science">Computer Science</SelectItem>
                      <SelectItem value="engineering">Engineering</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                      <SelectItem value="arts">Arts</SelectItem>
                      <SelectItem value="sciences">Sciences</SelectItem>
                      <SelectItem value="medicine">Medicine</SelectItem>
                      <SelectItem value="law">Law</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-muted-foreground">{profile.department || 'Not set'}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Year of Study</label>
                {isEditing ? (
                  <Select
                    value={editedProfile.year_of_study?.toString() || ''}
                    onValueChange={(value) => setEditedProfile({ ...editedProfile, year_of_study: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1st Year</SelectItem>
                      <SelectItem value="2">2nd Year</SelectItem>
                      <SelectItem value="3">3rd Year</SelectItem>
                      <SelectItem value="4">4th Year</SelectItem>
                      <SelectItem value="5">5th Year</SelectItem>
                      <SelectItem value="6">Graduate</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-muted-foreground">
                    {profile.year_of_study ? `${profile.year_of_study}${profile.year_of_study === 1 ? 'st' : profile.year_of_study === 2 ? 'nd' : profile.year_of_study === 3 ? 'rd' : 'th'} Year` : 'Not set'}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Bio</label>
              {isEditing ? (
                <Textarea
                  value={editedProfile.bio || ''}
                  onChange={(e) => setEditedProfile({ ...editedProfile, bio: e.target.value })}
                  placeholder="Tell us about yourself..."
                  rows={3}
                />
              ) : (
                <p className="text-muted-foreground">{profile.bio || 'No bio added yet'}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Alumni Information */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Alumni Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Alumni Status</label>
              {isEditing ? (
                <Switch
                  checked={editedProfile.is_alumni || false}
                  onCheckedChange={(checked) => {
                    setEditedProfile({ ...editedProfile, is_alumni: checked });
                    setShowAlumniFields(checked);
                  }}
                />
              ) : (
                <Badge variant={profile?.is_alumni ? "default" : "secondary"}>
                  {profile?.is_alumni ? "Alumni" : "Current Student"}
                </Badge>
              )}
            </div>

            {(showAlumniFields || profile?.is_alumni) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="text-sm font-medium mb-2 block">Graduation Year</label>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={editedProfile.graduation_year || ''}
                      onChange={(e) => setEditedProfile({ ...editedProfile, graduation_year: parseInt(e.target.value) || undefined })}
                      placeholder="e.g. 2020"
                    />
                  ) : (
                    <p className="text-muted-foreground">{profile?.graduation_year || 'Not set'}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Current Company</label>
                  {isEditing ? (
                    <Input
                      value={editedProfile.current_company || ''}
                      onChange={(e) => setEditedProfile({ ...editedProfile, current_company: e.target.value })}
                      placeholder="Your employer"
                    />
                  ) : (
                    <p className="text-muted-foreground">{profile?.current_company || 'Not set'}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Current Position</label>
                  {isEditing ? (
                    <Input
                      value={editedProfile.current_position || ''}
                      onChange={(e) => setEditedProfile({ ...editedProfile, current_position: e.target.value })}
                      placeholder="Your job title"
                    />
                  ) : (
                    <p className="text-muted-foreground">{profile?.current_position || 'Not set'}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">LinkedIn Profile</label>
                  {isEditing ? (
                    <Input
                      value={editedProfile.linkedin_url || ''}
                      onChange={(e) => setEditedProfile({ ...editedProfile, linkedin_url: e.target.value })}
                      placeholder="https://linkedin.com/in/..."
                    />
                  ) : (
                    <p className="text-muted-foreground">{profile?.linkedin_url || 'Not set'}</p>
                  )}
                </div>

                <div className="flex items-center justify-between sm:col-span-2">
                  <label className="text-sm font-medium">Open to Mentoring</label>
                  {isEditing ? (
                    <Switch
                      checked={editedProfile.open_to_mentoring || false}
                      onCheckedChange={(checked) => setEditedProfile({ ...editedProfile, open_to_mentoring: checked })}
                    />
                  ) : (
                    <Badge variant={profile?.open_to_mentoring ? "default" : "secondary"}>
                      {profile?.open_to_mentoring ? "Yes" : "No"}
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Interests */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Interests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 mb-4">
              {(editedProfile.interests || []).map((interest, index) => (
                <Badge key={index} variant="secondary" className="gap-1">
                  {interest}
                  {isEditing && (
                    <button
                      onClick={() => removeInterest(index)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </Badge>
              ))}
            </div>
            
            {isEditing && (
              <div className="flex gap-2">
                <Input
                  value={newInterest}
                  onChange={(e) => setNewInterest(e.target.value)}
                  placeholder="Add an interest..."
                  onKeyPress={(e) => e.key === 'Enter' && addInterest()}
                />
                <Button onClick={addInterest} size="sm" className="gap-1">
                  <Plus className="h-4 w-4" />
                  Add
                </Button>
              </div>
            )}
            
            {(!editedProfile.interests || editedProfile.interests.length === 0) && !isEditing && (
              <p className="text-muted-foreground">No interests added yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;