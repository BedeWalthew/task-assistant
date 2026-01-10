"use client";

import { useState } from "react";
import { TicketCreateForm } from "./TicketCreateForm";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { type Project } from "@task-assistant/shared";

type CreateTicketModalProps = {
  projectId?: string;
  projects?: Project[];
};

export function CreateTicketModal({ projectId, projects = [] }: CreateTicketModalProps) {
  const [open, setOpen] = useState(false);

  const close = () => setOpen(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" data-testid="create-ticket-btn">Create ticket</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl p-0" data-testid="create-ticket-modal">
        <DialogHeader className="border-b px-6 py-4 text-left">
          <DialogTitle>Create ticket</DialogTitle>
          <DialogDescription>
            Capture a new issue or task and link it to a project.
          </DialogDescription>
        </DialogHeader>
        <div className="p-6">
          <TicketCreateForm projectId={projectId} projects={projects} onSuccess={close} />
        </div>
        <DialogClose asChild>
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-3 top-3 h-9 w-9 rounded-full"
            aria-label="Close create ticket"
            data-testid="close-ticket-modal"
          >
            ✕
          </Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
