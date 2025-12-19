"use client";

import { useTransition, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CreateProjectInput,
  CreateProjectSchema,
} from "@task-assistant/shared/src/schemas/project";
import { createProject } from "@/actions/createProject";
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

export function ProjectCreateForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<CreateProjectInput>({
    resolver: zodResolver(CreateProjectSchema),
    defaultValues: {
      name: "",
      key: "",
      description: "",
    },
  });

  const onSubmit = (values: CreateProjectInput) => {
    setError(null);
    startTransition(async () => {
      const result = await createProject(values);
      if (result.success) {
        toast({ title: "Project created" });
        form.reset();
      } else if (result.error) {
        setError(result.error);
      }
    });
  };

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>Create Project</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Project Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="key"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Key</FormLabel>
                  <FormControl>
                    <Input placeholder="PROJ" maxLength={10} {...field} />
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
                      placeholder="Optional description"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}

            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating..." : "Create Project"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
