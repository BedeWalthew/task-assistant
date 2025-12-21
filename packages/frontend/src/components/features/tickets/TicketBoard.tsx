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

const statusAccent: Record<TicketStatus, string> = {
  TODO: "bg-slate-100 text-slate-700 border-slate-200",
  IN_PROGRESS: "bg-blue-50 text-blue-700 border-blue-100",
  DONE: "bg-emerald-50 text-emerald-700 border-emerald-100",
  BLOCKED: "bg-amber-50 text-amber-800 border-amber-100",
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
          className="flex min-h-[260px] flex-col gap-3 rounded-xl border bg-gradient-to-b from-background via-card/50 to-card p-4 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">
                {statusTitles[status]}
              </span>
              <span
                className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${statusAccent[status]}`}
              >
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
