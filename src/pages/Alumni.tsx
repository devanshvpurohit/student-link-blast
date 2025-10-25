import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Briefcase, Users, GraduationCap, Calendar, MapPin, ExternalLink, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface Opportunity {
  id: string;
  title: string;
  company: string;
  description: string;
  location: string | null;
  job_type: string;
  application_url: string | null;
  created_at: string;
  expires_at: string | null;
  posted_by: string;
  profiles: {
    full_name: string;
    current_position: string | null;
  };
}

interface AlumniProfile {
  id: string;
  full_name: string;
  email: string;
  graduation_year: number | null;
  current_company: string | null;
  current_position: string | null;
  department: string | null;
  open_to_mentoring: boolean;
  avatar_url: string | null;
  linkedin_url: string | null;
}

const Alumni = () => {
  const { user } = useAuth();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [alumni, setAlumni] = useState<AlumniProfile[]>([]);
  const [isAlumni, setIsAlumni] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [newOpportunity, setNewOpportunity] = useState({
    title: "",
    company: "",
    description: "",
    location: "",
    job_type: "full-time",
    application_url: "",
  });

  useEffect(() => {
    if (user) {
      checkAlumniStatus();
      fetchOpportunities();
      fetchAlumni();
    }
  }, [user]);

  const checkAlumniStatus = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from("profiles")
      .select("is_alumni")
      .eq("id", user.id)
      .single();
    
    setIsAlumni(data?.is_alumni || false);
  };

  const fetchOpportunities = async () => {
    const { data, error } = await supabase
      .from("alumni_opportunities")
      .select(`
        *,
        profiles:posted_by (full_name, current_position)
      `)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load opportunities");
      return;
    }

    setOpportunities(data || []);
  };

  const fetchAlumni = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("is_alumni", true)
      .order("graduation_year", { ascending: false });

    if (error) {
      toast.error("Failed to load alumni");
      return;
    }

    setAlumni(data || []);
  };

  const createOpportunity = async () => {
    if (!user || !isAlumni) {
      toast.error("Only alumni can post opportunities");
      return;
    }

    if (!newOpportunity.title || !newOpportunity.company || !newOpportunity.description) {
      toast.error("Please fill in all required fields");
      return;
    }

    const { error } = await supabase
      .from("alumni_opportunities")
      .insert({
        ...newOpportunity,
        posted_by: user.id,
      });

    if (error) {
      toast.error("Failed to create opportunity");
      return;
    }

    toast.success("Opportunity posted successfully!");
    setShowCreateDialog(false);
    setNewOpportunity({
      title: "",
      company: "",
      description: "",
      location: "",
      job_type: "full-time",
      application_url: "",
    });
    fetchOpportunities();
  };

  const filteredAlumni = alumni.filter(
    (profile) =>
      profile.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.current_company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getJobTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      "full-time": "bg-green-500/10 text-green-500",
      "part-time": "bg-blue-500/10 text-blue-500",
      internship: "bg-purple-500/10 text-purple-500",
      contract: "bg-orange-500/10 text-orange-500",
      volunteer: "bg-pink-500/10 text-pink-500",
    };
    return colors[type] || "";
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <GraduationCap className="h-8 w-8" />
            Alumni Network
          </h1>
          <p className="text-muted-foreground mt-2">
            Connect with alumni, find mentors, and explore career opportunities
          </p>
        </div>
      </div>

      <Tabs defaultValue="opportunities" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="opportunities">
            <Briefcase className="h-4 w-4 mr-2" />
            Opportunities
          </TabsTrigger>
          <TabsTrigger value="alumni">
            <Users className="h-4 w-4 mr-2" />
            Alumni Directory
          </TabsTrigger>
        </TabsList>

        <TabsContent value="opportunities" className="space-y-4">
          {isAlumni && (
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Post Opportunity
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Post a New Opportunity</DialogTitle>
                  <DialogDescription>
                    Share job openings, internships, or volunteer positions with students
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Position Title *</Label>
                    <Input
                      id="title"
                      value={newOpportunity.title}
                      onChange={(e) => setNewOpportunity({ ...newOpportunity, title: e.target.value })}
                      placeholder="e.g. Software Engineer, Marketing Intern"
                    />
                  </div>
                  <div>
                    <Label htmlFor="company">Company *</Label>
                    <Input
                      id="company"
                      value={newOpportunity.company}
                      onChange={(e) => setNewOpportunity({ ...newOpportunity, company: e.target.value })}
                      placeholder="Company name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="job_type">Type *</Label>
                    <Select
                      value={newOpportunity.job_type}
                      onValueChange={(value) => setNewOpportunity({ ...newOpportunity, job_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full-time">Full-time</SelectItem>
                        <SelectItem value="part-time">Part-time</SelectItem>
                        <SelectItem value="internship">Internship</SelectItem>
                        <SelectItem value="contract">Contract</SelectItem>
                        <SelectItem value="volunteer">Volunteer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={newOpportunity.location}
                      onChange={(e) => setNewOpportunity({ ...newOpportunity, location: e.target.value })}
                      placeholder="e.g. New York, Remote"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      value={newOpportunity.description}
                      onChange={(e) => setNewOpportunity({ ...newOpportunity, description: e.target.value })}
                      placeholder="Describe the role, requirements, and responsibilities..."
                      rows={4}
                    />
                  </div>
                  <div>
                    <Label htmlFor="application_url">Application Link</Label>
                    <Input
                      id="application_url"
                      value={newOpportunity.application_url}
                      onChange={(e) => setNewOpportunity({ ...newOpportunity, application_url: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                  <Button onClick={createOpportunity} className="w-full">
                    Post Opportunity
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}

          <div className="grid gap-4">
            {opportunities.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  No opportunities posted yet. Alumni can post job openings and internships here.
                </CardContent>
              </Card>
            ) : (
              opportunities.map((opp) => (
                <Card key={opp.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <CardTitle>{opp.title}</CardTitle>
                        <CardDescription className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4" />
                          {opp.company}
                        </CardDescription>
                      </div>
                      <Badge className={getJobTypeBadge(opp.job_type)}>
                        {opp.job_type}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm">{opp.description}</p>
                    {opp.location && (
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {opp.location}
                      </p>
                    )}
                    <div className="flex flex-col sm:flex-row gap-2 justify-between items-start sm:items-center pt-2 border-t">
                      <p className="text-sm text-muted-foreground">
                        Posted by {opp.profiles.full_name}
                        {opp.profiles.current_position && ` • ${opp.profiles.current_position}`}
                      </p>
                      {opp.application_url && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={opp.application_url} target="_blank" rel="noopener noreferrer">
                            Apply Now
                            <ExternalLink className="h-4 w-4 ml-2" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="alumni" className="space-y-4">
          <Input
            placeholder="Search alumni by name, company, or department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <div className="grid gap-4 md:grid-cols-2">
            {filteredAlumni.length === 0 ? (
              <Card className="md:col-span-2">
                <CardContent className="pt-6 text-center text-muted-foreground">
                  No alumni profiles found
                </CardContent>
              </Card>
            ) : (
              filteredAlumni.map((profile) => (
                <Card key={profile.id}>
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-xl font-semibold">
                        {profile.full_name?.charAt(0) || "?"}
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg">{profile.full_name}</CardTitle>
                        {profile.current_position && (
                          <CardDescription>{profile.current_position}</CardDescription>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {profile.current_company && (
                      <p className="text-sm flex items-center gap-2">
                        <Briefcase className="h-4 w-4" />
                        {profile.current_company}
                      </p>
                    )}
                    {profile.graduation_year && (
                      <p className="text-sm flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Class of {profile.graduation_year}
                      </p>
                    )}
                    {profile.department && (
                      <p className="text-sm text-muted-foreground">{profile.department}</p>
                    )}
                    <div className="flex gap-2 pt-2">
                      {profile.open_to_mentoring && (
                        <Badge variant="secondary">Open to Mentoring</Badge>
                      )}
                      {profile.linkedin_url && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer">
                            LinkedIn
                            <ExternalLink className="h-4 w-4 ml-2" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Alumni;
