import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, isToday, isTomorrow } from "date-fns";
import { CalendarDays, Plus, Pencil, Trash2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertCalendarEventSchema, type CalendarEvent, type InsertCalendarEvent } from "@shared/schema";
import { z } from "zod";

interface CalendarSidebarProps {
  currentMode: 'emotional' | 'secretary';
}

// Form schema extending the insert schema for client-side validation
const eventFormSchema = insertCalendarEventSchema.extend({
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().optional(),
}).omit({ startTime: true, endTime: true });

type EventFormValues = {
  title: string;
  description?: string;
  startTime: string;
  endTime?: string;
  priority: string;
  category?: string;
  completed?: boolean;
};

export function CalendarSidebar({ currentMode }: CalendarSidebarProps) {
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const { toast } = useToast();

  const { data: events = [], isLoading } = useQuery<CalendarEvent[]>({ 
    queryKey: ['calendarEvents'],
    queryFn: () => apiRequest('GET', '/api/calendar').then(res => res.json()),
  });

  const form = useForm<EventFormValues>({
    resolver: zodResolver(z.object({
      title: z.string().min(1, "Title is required"),
      description: z.string().optional(),
      startTime: z.string().min(1, "Start time is required"),
      endTime: z.string().optional(),
      priority: z.string().default("medium"),
      category: z.string().optional(),
    })),
    defaultValues: {
      title: '',
      description: '',
      startTime: '',
      endTime: '',
      priority: 'medium',
      category: '',
    },
  });


  const handleAddEvent = () => {
    setEditingEvent(null);
    form.reset({
      title: '',
      description: '',
      startTime: '',
      endTime: '',
      priority: 'medium',
      category: '',
    });
    setShowDialog(true);
  };

  const handleEditEvent = (event: CalendarEvent) => {
    setEditingEvent(event);
    form.reset({
      title: event.title,
      description: event.description || '',
      startTime: event.startTime ? format(new Date(event.startTime), "yyyy-MM-dd'T'HH:mm") : '',
      endTime: event.endTime ? format(new Date(event.endTime), "yyyy-MM-dd'T'HH:mm") : '',
      priority: event.priority,
      category: event.category || '',
    });
    setShowDialog(true);
  };

  const deleteMutation = useMutation({
    mutationFn: (eventId: string) => apiRequest('DELETE', `/api/calendar/${eventId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendarEvents'] });
      toast({ title: "Event deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete event", variant: "destructive" });
    }
  });

  const handleDeleteEvent = (eventId: string) => {
    deleteMutation.mutate(eventId);
  };

  const eventMutation = useMutation({
    mutationFn: (eventData: InsertCalendarEvent) => {
      const url = editingEvent ? `/api/calendar/${editingEvent.id}` : '/api/calendar';
      const method = editingEvent ? 'PATCH' : 'POST';
      return apiRequest(method, url, eventData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendarEvents'] });
      setShowDialog(false);
      form.reset();
      toast({ title: editingEvent ? "Event updated" : "Event added" });
    },
    onError: () => {
      toast({ title: "Failed to save event", variant: "destructive" });
    }
  });

  const onSubmit = (values: EventFormValues) => {
    const eventData = {
      title: values.title,
      description: values.description || null,
      startTime: new Date(values.startTime),
      endTime: values.endTime ? new Date(values.endTime) : null,
      priority: values.priority as 'low' | 'medium' | 'high',
      category: values.category || null,
    };
    
    eventMutation.mutate(eventData);
  };

  const toggleCompleteMutation = useMutation({
    mutationFn: (event: CalendarEvent) => 
      apiRequest('PATCH', `/api/calendar/${event.id}`, { completed: !event.completed }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendarEvents'] });
    },
  });

  const toggleComplete = (event: CalendarEvent) => {
    toggleCompleteMutation.mutate(event);
  };

  const getTimeLabel = (event: CalendarEvent) => {
    if (!event.startTime) return '';
    const date = new Date(event.startTime);
    
    if (isToday(date)) {
      return `Today ${format(date, 'h:mm a')}`;
    } else if (isTomorrow(date)) {
      return `Tomorrow ${format(date, 'h:mm a')}`;
    } else {
      return format(date, 'MMM d, h:mm a');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-destructive/20 text-destructive border-destructive/30';
      case 'medium': return 'bg-primary/20 text-primary border-primary/30';
      case 'low': return 'bg-muted text-muted-foreground border-muted-foreground/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const sortedEvents = [...events].sort((a, b) => 
    new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-8 border-b">
        <h2 className="text-2xl font-serif font-medium mb-4">Your Goals & Tasks</h2>
        <Button 
          onClick={handleAddEvent} 
          className="w-full gap-2"
          data-testid="button-add-task"
        >
          <Plus className="w-4 h-4" />
          Add Task
        </Button>
      </div>

      {/* Events List */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {sortedEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <CalendarDays className="w-12 h-12 opacity-20 mb-4" />
            <p className="text-lg font-medium mb-2">No tasks yet</p>
            <p className="text-sm text-muted-foreground">Add your first goal to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedEvents.map((event) => (
              <Card 
                key={event.id} 
                className={`p-4 group relative ${event.completed ? 'opacity-60' : ''}`}
                data-testid={`card-event-${event.id}`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-start gap-3 flex-1">
                    <input
                      type="checkbox"
                      checked={event.completed}
                      onChange={() => toggleComplete(event)}
                      className="mt-1 w-4 h-4 cursor-pointer"
                      data-testid={`checkbox-complete-${event.id}`}
                    />
                    <div className="flex-1">
                      <h3 className={`text-base font-medium ${event.completed ? 'line-through' : ''}`}>
                        {event.title}
                      </h3>
                      {event.description && (
                        <p className="text-sm opacity-80 mt-1">{event.description}</p>
                      )}
                    </div>
                  </div>
                  
                  <Badge className={`text-xs px-2 py-1 ${getPriorityColor(event.priority)}`}>
                    {event.priority}
                  </Badge>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                  <Clock className="w-3 h-3" />
                  <span>{getTimeLabel(event)}</span>
                  {event.category && (
                    <>
                      <span>•</span>
                      <span className="capitalize">{event.category}</span>
                    </>
                  )}
                </div>

                {/* Hover actions */}
                <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => handleEditEvent(event)}
                    data-testid={`button-edit-${event.id}`}
                  >
                    <Pencil className="w-3 h-3" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => handleDeleteEvent(event.id)}
                    data-testid={`button-delete-${event.id}`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Event Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent data-testid="dialog-event-form">
          <DialogHeader>
            <DialogTitle>{editingEvent ? 'Edit Event' : 'Add New Event'}</DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g., Morning workout"
                        data-testid="input-event-title"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Add details..."
                        rows={3}
                        data-testid="input-event-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="datetime-local"
                          data-testid="input-event-start"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Time</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="datetime-local"
                          data-testid="input-event-end"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-priority">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., fitness"
                          data-testid="input-event-category"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setShowDialog(false)} data-testid="button-cancel-event">
                  Cancel
                </Button>
                <Button type="submit" data-testid="button-save-event">
                  {editingEvent ? 'Update' : 'Add'} Event
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
