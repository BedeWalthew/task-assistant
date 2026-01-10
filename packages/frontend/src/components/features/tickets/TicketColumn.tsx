import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Ticket, TicketStatus } from "@task-assistant/shared";
import { DraggableTicketCard } from "./DraggableTicketCard";

type TicketColumnProps = {
  status: TicketStatus;
  tickets: Ticket[];
  projectLabels?: Record<string, string>;
};

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

export function TicketColumn({
  status,
  tickets,
  projectLabels,
}: TicketColumnProps) {
  const { setNodeRef } = useDroppable({
    id: status,
  });

  const ticketIds = tickets.map((t) => t.id as string);

  return (
    <div
      ref={setNodeRef}
      className="flex min-h-[260px] flex-col gap-3 rounded-xl border bg-gradient-to-b from-background via-card/50 to-card p-4 shadow-sm"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{statusTitles[status]}</span>
          <span
            className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${statusAccent[status]}`}
          >
            {tickets.length}
          </span>
        </div>
      </div>
      <SortableContext items={ticketIds} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-3">
          {tickets.length === 0 ? (
            <div className="rounded-lg border border-dashed bg-muted/40 p-4 text-sm text-muted-foreground">
              No tickets in this column.
            </div>
          ) : (
            tickets.map((ticket) => (
              <DraggableTicketCard
                key={ticket.id}
                ticket={ticket}
                projectLabel={projectLabels?.[ticket.projectId]}
              />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
}
