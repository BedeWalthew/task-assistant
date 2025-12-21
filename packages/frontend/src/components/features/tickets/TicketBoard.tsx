import { Ticket, TicketStatus } from "@task-assistant/shared";
import TicketCard from "./TicketCard";

type TicketBoardProps = {
  items: Ticket[];
  projectLabels?: Record<string, string>;
};

const statusOrder = TicketStatus.options;
const statusTitles: Record<TicketStatus, string> = {
  TODO: "Todo",
  IN_PROGRESS: "In Progress",
  DONE: "Done",
  BLOCKED: "Blocked",
};

export function TicketBoard({ items, projectLabels }: TicketBoardProps) {
  const grouped = statusOrder.map((status) => ({
    status,
    tickets: items.filter((ticket) => ticket.status === status),
  }));

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {grouped.map(({ status, tickets }) => (
        <div
          key={status}
          className="flex min-h-[240px] flex-col gap-3 rounded-xl border bg-card/60 p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">
                {statusTitles[status]}
              </span>
              <span className="text-xs text-muted-foreground">
                {tickets.length}
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            {tickets.length === 0 ? (
              <div className="rounded-lg border border-dashed bg-muted/40 p-4 text-sm text-muted-foreground">
                No tickets in this column.
              </div>
            ) : (
              tickets.map((ticket) => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  projectLabel={projectLabels?.[ticket.projectId]}
                  compact
                />
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
