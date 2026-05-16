import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Clock, Users, Plus } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type CampusEvent = Database['public']['Tables']['campus_events']['Row'];

const Events = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<CampusEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Simple Create Form State
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    location: "",
    start_time: "",
    event_type: "social"
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('campus_events')
      .select('*')
      .order('start_time', { ascending: true })
      .gte('start_time', new Date().toISOString()); // Only future events

    if (!error) setEvents(data || []);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!user) return;
    if (!newEvent.title || !newEvent.start_time) {
      toast.error("Title and Start Time required");
      return;
    }

    const { error } = await supabase.from('campus_events').insert({
      title: newEvent.title,
      description: newEvent.description,
      location: newEvent.location,
      start_time: new Date(newEvent.start_time).toISOString(),
      event_type: newEvent.event_type as any, // Cast for simplicity logic
      created_by: user.id
    });

    if (error) {
      toast.error("Failed to create event");
      console.error(error);
    } else {
      toast.success("Event created!");
      setIsCreateOpen(false);
      fetchEvents();
    }
  };

  const handleRSVP = async (eventId: string) => {
    if (!user) return;
    const { error } = await supabase.from('event_rsvps').insert({
      event_id: eventId,
      user_id: user.id,
      status: 'going'
    });

    if (error) {
      if (error.code === '23505') toast.info("You're already going!");
      else toast.error("RSVP failed");
    } else {
      toast.success("RSVP sent!");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Events</h1>
          <p className="text-muted-foreground text-sm">What's happening on campus.</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Create Event</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Host an Event</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Event Title</Label>
                <Input value={newEvent.title} onChange={e => setNewEvent({ ...newEvent, title: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>When?</Label>
                <Input type="datetime-local" onChange={e => setNewEvent({ ...newEvent, start_time: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Where?</Label>
                <Input placeholder="Location" value={newEvent.location} onChange={e => setNewEvent({ ...newEvent, location: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={newEvent.description} onChange={e => setNewEvent({ ...newEvent, description: e.target.value })} />
              </div>
              <Button className="w-full" onClick={handleCreate}>Publish Event</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading calendar...</div>
        ) : events.length === 0 ? (
          <div className="text-center py-12 border border-dashed rounded-lg">
            <Calendar className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">No upcoming events.</p>
          </div>
        ) : (
          events.map(event => (
            <Card key={event.id} className="flex flex-col sm:flex-row overflow-hidden hover:border-primary/40 transition-colors">
              {/* Date Block */}
              <div className="bg-muted/30 w-full sm:w-32 flex flex-col items-center justify-center p-4 border-b sm:border-b-0 sm:border-r border-border">
                <span className="text-xs font-semibold uppercase text-muted-foreground">
                  {format(new Date(event.start_time), 'MMM')}
                </span>
                <span className="text-3xl font-bold font-mono">
                  {format(new Date(event.start_time), 'dd')}
                </span>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(event.start_time), 'eee')}
                </span>
              </div>

              {/* Details */}
              <div className="flex-1 p-4 sm:p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="outline" className="capitalize font-normal">{event.event_type}</Badge>
                    <Button variant="outline" size="sm" onClick={() => handleRSVP(event.id)}>RSVP</Button>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{event.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {event.description}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {format(new Date(event.start_time), 'h:mm a')}
                  </div>
                  {event.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {event.location}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Events;
