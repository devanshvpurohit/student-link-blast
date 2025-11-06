import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Calendar, MapPin, Users, Plus, Clock, CheckCircle2, Star } from "lucide-react";
import { format, isAfter, isBefore } from "date-fns";

interface Event {
  id: string;
  title: string;
  description: string | null;
  event_type: string;
  location: string | null;
  start_time: string;
  end_time: string | null;
  max_attendees: number | null;
  created_by: string;
  profiles: {
    full_name: string;
  };
  rsvp_count?: number;
  user_rsvp?: string | null;
}

const Events = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    event_type: "social",
    location: "",
    start_time: "",
    end_time: "",
    max_attendees: "",
  });

  useEffect(() => {
    if (user) {
      fetchEvents();
    }
  }, [user]);

  const fetchEvents = async () => {
    if (!user) return;

    // First get events
    const { data: eventsData, error: eventsError } = await supabase
      .from("campus_events")
      .select("*")
      .gte("start_time", new Date().toISOString())
      .order("start_time", { ascending: true });

    if (eventsError) {
      toast.error("Failed to load events");
      return;
    }

    if (!eventsData || eventsData.length === 0) {
      setEvents([]);
      return;
    }

    // Get creator profiles
    const creatorIds = eventsData.map(e => e.created_by);
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", creatorIds);

    // Get RSVP counts and user's RSVP status
    const eventsWithData = await Promise.all(
      eventsData.map(async (event) => {
        const { count } = await supabase
          .from("event_rsvps")
          .select("*", { count: "exact", head: true })
          .eq("event_id", event.id)
          .eq("status", "going");

        const { data: userRsvp } = await supabase
          .from("event_rsvps")
          .select("status")
          .eq("event_id", event.id)
          .eq("user_id", user.id)
          .maybeSingle();

        const profile = profilesData?.find(p => p.id === event.created_by);

        return {
          ...event,
          profiles: {
            full_name: profile?.full_name || "Unknown",
          },
          rsvp_count: count || 0,
          user_rsvp: userRsvp?.status || null,
        };
      })
    );

    setEvents(eventsWithData);
  };

  const createEvent = async () => {
    if (!user) return;

    if (!newEvent.title || !newEvent.start_time) {
      toast.error("Please fill in required fields");
      return;
    }

    const { error } = await supabase.from("campus_events").insert({
      ...newEvent,
      max_attendees: newEvent.max_attendees ? parseInt(newEvent.max_attendees) : null,
      created_by: user.id,
    });

    if (error) {
      toast.error("Failed to create event");
      return;
    }

    toast.success("Event created successfully!");
    setShowCreateDialog(false);
    setNewEvent({
      title: "",
      description: "",
      event_type: "social",
      location: "",
      start_time: "",
      end_time: "",
      max_attendees: "",
    });
    fetchEvents();
  };

  const handleRSVP = async (eventId: string, status: string) => {
    if (!user) return;

    const { error } = await supabase
      .from("event_rsvps")
      .upsert({
        event_id: eventId,
        user_id: user.id,
        status,
      });

    if (error) {
      toast.error("Failed to update RSVP");
      return;
    }

    toast.success(status === "going" ? "You're attending!" : "RSVP updated");
    fetchEvents();
  };

  const getEventTypeBadge = (type: string) => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      academic: "default",
      social: "secondary",
      sports: "outline",
      club: "secondary",
      career: "default",
      other: "outline",
    };
    return variants[type] || "secondary";
  };

  const filteredEvents = events.filter(event => {
    if (filter === "all") return true;
    if (filter === "attending") return event.user_rsvp === "going";
    if (filter === "interested") return event.user_rsvp === "interested";
    return event.event_type === filter;
  });

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Calendar className="h-8 w-8" />
            Campus Events
          </h1>
          <p className="text-muted-foreground mt-2">
            Discover and attend campus activities
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Event
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Campus Event</DialogTitle>
              <DialogDescription>
                Organize a new event for the campus community
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Event Title *</Label>
                <Input
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  placeholder="Study Group for Finals"
                />
              </div>
              <div>
                <Label>Event Type *</Label>
                <Select
                  value={newEvent.event_type}
                  onValueChange={(value) => setNewEvent({ ...newEvent, event_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="academic">Academic</SelectItem>
                    <SelectItem value="social">Social</SelectItem>
                    <SelectItem value="sports">Sports</SelectItem>
                    <SelectItem value="club">Club Activity</SelectItem>
                    <SelectItem value="career">Career</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  placeholder="Describe the event..."
                  rows={3}
                />
              </div>
              <div>
                <Label>Location</Label>
                <Input
                  value={newEvent.location}
                  onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                  placeholder="Library Room 301"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Time *</Label>
                  <Input
                    type="datetime-local"
                    value={newEvent.start_time}
                    onChange={(e) => setNewEvent({ ...newEvent, start_time: e.target.value })}
                  />
                </div>
                <div>
                  <Label>End Time</Label>
                  <Input
                    type="datetime-local"
                    value={newEvent.end_time}
                    onChange={(e) => setNewEvent({ ...newEvent, end_time: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>Max Attendees (optional)</Label>
                <Input
                  type="number"
                  value={newEvent.max_attendees}
                  onChange={(e) => setNewEvent({ ...newEvent, max_attendees: e.target.value })}
                  placeholder="Leave empty for unlimited"
                />
              </div>
              <Button onClick={createEvent} className="w-full">
                Create Event
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="all" onValueChange={setFilter}>
        <TabsList className="mb-6">
          <TabsTrigger value="all">All Events</TabsTrigger>
          <TabsTrigger value="attending">Attending</TabsTrigger>
          <TabsTrigger value="interested">Interested</TabsTrigger>
          <TabsTrigger value="academic">Academic</TabsTrigger>
          <TabsTrigger value="social">Social</TabsTrigger>
          <TabsTrigger value="sports">Sports</TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-0">
          <div className="grid gap-4 md:grid-cols-2">
            {filteredEvents.length === 0 ? (
              <Card className="md:col-span-2">
                <CardContent className="p-12 text-center text-muted-foreground">
                  <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-lg">No events found</p>
                  <p className="text-sm mt-2">Be the first to create an event!</p>
                </CardContent>
              </Card>
            ) : (
              filteredEvents.map((event) => (
                <Card key={event.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-xl">{event.title}</CardTitle>
                        <CardDescription className="mt-1">
                          by {event.profiles.full_name}
                        </CardDescription>
                      </div>
                      <Badge variant={getEventTypeBadge(event.event_type)}>
                        {event.event_type}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {event.description && (
                      <p className="text-sm line-clamp-2">{event.description}</p>
                    )}
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {format(new Date(event.start_time), "PPp")}
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {event.location}
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        {event.rsvp_count} attending
                        {event.max_attendees && ` / ${event.max_attendees} max`}
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      {event.user_rsvp === "going" ? (
                        <Button
                          variant="default"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleRSVP(event.id, "not_going")}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Attending
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleRSVP(event.id, "going")}
                        >
                          Attend
                        </Button>
                      )}
                      <Button
                        variant={event.user_rsvp === "interested" ? "secondary" : "outline"}
                        size="sm"
                        onClick={() =>
                          handleRSVP(
                            event.id,
                            event.user_rsvp === "interested" ? "not_going" : "interested"
                          )
                        }
                      >
                        <Star className="h-4 w-4" />
                      </Button>
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

export default Events;
