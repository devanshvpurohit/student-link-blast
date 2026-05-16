import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Briefcase, MapPin, Building, ExternalLink, Filter } from "lucide-react";

type Opportunity = Database['public']['Tables']['alumni_opportunities']['Row'];

const Alumni = () => {
  const [jobs, setJobs] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('alumni_opportunities')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (!error) setJobs(data || []);
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-blue-600" />
            Alumni Network
          </h1>
          <p className="text-muted-foreground text-sm">Career opportunities posted by alumni.</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" /> Filter
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-full py-12 text-center text-muted-foreground animate-pulse">Loading opportunities...</div>
        ) : jobs.length === 0 ? (
          <div className="col-span-full py-12 text-center border border-dashed rounded-lg">
            <p className="text-muted-foreground">No active listings.</p>
          </div>
        ) : (
          jobs.map(job => (
            <Card key={job.id} className="hover:border-primary/40 transition-colors flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <Badge variant="secondary" className="mb-2 capitalize">{job.job_type?.replace('-', ' ')}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(job.created_at).toLocaleDateString()}
                  </span>
                </div>
                <CardTitle className="text-lg">{job.title}</CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <Building className="h-3 w-3" /> {job.company}
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {job.description}
                </p>
                {job.location && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-4">
                    <MapPin className="h-3 w-3" /> {job.location}
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button className="w-full gap-2" variant="outline" asChild>
                  <a href={job.application_url || '#'} target="_blank" rel="noopener noreferrer">
                    Apply Now <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Alumni;
