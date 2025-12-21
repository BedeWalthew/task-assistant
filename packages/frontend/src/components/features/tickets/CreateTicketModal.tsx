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

type CreateTicketModalProps = {
  projectId?: string;
};

export function CreateTicketModal({ projectId }: CreateTicketModalProps) {
  const [open, setOpen] = useState(false);

  const close = () => setOpen(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">Create ticket</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl p-0">
        <DialogHeader className="border-b px-6 py-4 text-left">
          <DialogTitle>Create ticket</DialogTitle>
          <DialogDescription>
            Capture a new issue or task and link it to a project.
          </DialogDescription>
        </DialogHeader>
        <div className="p-6">
          <TicketCreateForm projectId={projectId} onSuccess={close} />
        </div>
        <DialogClose asChild>
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-3 top-3 h-9 w-9 rounded-full"
            aria-label="Close create ticket"
          >
            ✕
          </Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
