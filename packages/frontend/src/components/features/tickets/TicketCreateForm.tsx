"use client";

import { useTransition, useState } from "react";
import { useForm, type SubmitHandler, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CreateTicketInput,
  CreateTicketSchema,
  TicketPriority,
  TicketStatus,
} from "@task-assistant/shared";
import { z } from "zod";
import { createTicket } from "@/actions/createTicket";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type Project } from "@task-assistant/shared";

type TicketCreateFormProps = {
  projectId?: string;
  projects?: Project[];
  onSuccess?: () => void;
};

type FormValues = z.infer<typeof CreateTicketSchema>;

export function TicketCreateForm({
  projectId,
  projects = [],
  onSuccess,
}: TicketCreateFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(CreateTicketSchema) as Resolver<FormValues>,
    defaultValues: {
      title: "",
      description: "",
      status: "TODO",
      priority: "MEDIUM",
      projectId: projectId ?? "",
      assigneeId: "",
      source: "MANUAL",
      sourceUrl: undefined,
    },
  });

  const onSubmit: SubmitHandler<FormValues> = (values) => {
    setError(null);
    // Clean up empty string values that should be undefined
    const cleanedValues = {
      ...values,
      projectId: values.projectId || undefined,
      assigneeId: values.assigneeId || undefined,
      sourceUrl: values.sourceUrl || undefined,
      description: values.description || undefined,
    };
    startTransition(async () => {
      const result = await createTicket(cleanedValues);
      if (result.success) {
        toast({ title: "Ticket created" });
        form.reset({ ...values, title: "", description: "" });
        onSuccess?.();
      } else if (result.error) {
        setError(result.error);
      }
    });
  };

  return (
    <Card className="max-w-xl" data-testid="ticket-create-form">
      <CardHeader>
        <CardTitle>Create Ticket</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Ticket title" {...field} data-testid="ticket-title-input" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="projectId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger data-testid="ticket-project-select">
                        <SelectValue placeholder="Select a project" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id ?? ""}>
                          {project.name} ({project.key})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                      placeholder="Optional description"
                      className="resize-none"
                      {...field}
                      data-testid="ticket-desc-input"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger data-testid="ticket-status-select">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TicketStatus.options.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger data-testid="ticket-priority-select">
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TicketPriority.options.map((priority) => (
                          <SelectItem key={priority} value={priority}>
                            {priority}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {error && (
              <p className="text-sm text-destructive" role="alert" data-testid="ticket-form-error">
                {error}
              </p>
            )}

            <Button 
              type="submit" 
              disabled={isPending} 
              data-testid="ticket-submit-btn"
              onClick={() => {
                console.log('[TicketCreateForm] Submit button clicked');
                const formState = form.formState;
                console.log('[TicketCreateForm] Form state:', {
                  isValid: formState.isValid,
                  isDirty: formState.isDirty,
                  errors: formState.errors,
                  values: form.getValues()
                });
                console.log('[TicketCreateForm] Detailed errors:', JSON.stringify(formState.errors, null, 2));
                
                // Manually trigger validation to see errors
                form.trigger().then(isValid => {
                  console.log('[TicketCreateForm] Manual validation result:', isValid);
                  console.log('[TicketCreateForm] Errors after trigger:', form.formState.errors);
                });
              }}
            >
              {isPending ? "Creating..." : "Create Ticket"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
