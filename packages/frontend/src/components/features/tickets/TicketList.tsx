import { Ticket } from "@task-assistant/shared";
import TicketCard from "./TicketCard";

type TicketListProps = {
  items: Ticket[];
  total: number;
  page: number;
  pageSize: number;
  projectLabels?: Record<string, string>;
};

export default function TicketList({
  items,
  total,
  page,
  pageSize,
  projectLabels,
}: TicketListProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-lg border p-6">
        <p className="text-sm text-muted-foreground">
          No tickets match these filters yet.
        </p>
      </div>
    );
  }

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(total, start + items.length - 1);

  return (
    <div className="space-y-3" data-testid="ticket-list">
      <div className="text-xs text-muted-foreground" data-testid="ticket-list-info">
        Showing {start}–{end} of {total}
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((ticket) => (
          <TicketCard
            key={ticket.id}
            ticket={ticket}
            projectLabel={projectLabels?.[ticket.projectId]}
          />
        ))}
      </div>
    </div>
  );
}
