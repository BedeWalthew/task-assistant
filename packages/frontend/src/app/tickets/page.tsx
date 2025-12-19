import { Suspense } from "react";
import TicketList from "@/components/features/tickets/TicketList";
import { TicketCreateForm } from "@/components/features/tickets/TicketCreateForm";

export default function TicketsPage() {
  return (
    <div className="mx-auto max-w-5xl w-full px-6 py-10 space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Tickets</h1>
        <p className="text-muted-foreground">
          Create and browse tickets across projects.
        </p>
      </div>

      <TicketCreateForm />

      <Suspense fallback={<div>Loading tickets...</div>}>
        <TicketList />
      </Suspense>
    </div>
  );
}
