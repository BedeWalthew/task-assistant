"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Ticket, TicketStatus } from "@task-assistant/shared";
import TicketCard from "./TicketCard";
import { useRouter } from "next/navigation";
import { useDroppable } from "@dnd-kit/core";

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

type Column = {
  status: TicketStatus;
  tickets: Ticket[];
};

const groupTickets = (items: Ticket[]): Column[] =>
  statusOrder.map((status) => ({
    status,
    tickets: items
      .filter((ticket) => ticket.status === status)
      .sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return a.position - b.position || timeA - timeB;
      }),
  }));

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

function DroppableColumn({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const { setNodeRef } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className="flex flex-col gap-3">
      {children}
    </div>
  );
}

function DraggableCard({
  ticket,
  projectLabel,
}: {
  ticket: Ticket;
  projectLabel?: string;
}) {
  if (!ticket.id) return null;

  const sortableId = ticket.id as string;
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: sortableId,
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    touchAction: "manipulation",
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TicketCard ticket={ticket} projectLabel={projectLabel} compact />
    </div>
  );
}

export function TicketBoard({ items, projectLabels }: TicketBoardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [columns, setColumns] = useState<Column[]>(() => groupTickets(items));
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  useEffect(() => {
    setColumns(groupTickets(items));
  }, [items]);

  const ticketLookup = useMemo(
    () =>
      new Map(
        columns.flatMap((col) =>
          col.tickets.map((t) => [t.id, col.status] as const)
        )
      ),
    [columns]
  );

  const moveTicket = async (
    id: string,
    status: TicketStatus,
    position: number
  ) => {
    const res = await fetch(`${API_URL}/tickets/${id}/move`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, position }),
    });
    if (!res.ok) {
      const msg = await res.text();
      throw new Error(msg || "Failed to move ticket");
    }
  };

  const updateColumns = (
    ticketId: string,
    targetStatus: TicketStatus,
    targetIndex: number
  ): Column[] => {
    const sourceStatus = ticketLookup.get(ticketId);
    if (!sourceStatus) return columns;

    const next = columns.map((col) => {
      let tickets = col.tickets;
      if (col.status === sourceStatus) {
        tickets = tickets.filter((t) => t.id !== ticketId);
      }
      if (col.status === targetStatus) {
        const targetTicket =
          columns.flatMap((c) => c.tickets).find((t) => t.id === ticketId) ??
          null;
        const updatedTicket = targetTicket
          ? { ...targetTicket, status: targetStatus }
          : null;
        if (updatedTicket) {
          const copy = [...tickets];
          copy.splice(targetIndex, 0, updatedTicket);
          tickets = copy;
        }
      }
      return {
        ...col,
        tickets: tickets.map((t, idx) => ({ ...t, position: idx })),
      };
    });

    return next;
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    const sourceStatus = ticketLookup.get(activeId);
    if (!sourceStatus) return;

    const targetColumn =
      statusOrder.find((status) => status === overId) ??
      columns.find((col) => col.tickets.some((t) => t.id === overId))?.status;

    if (!targetColumn) return;

    const targetTickets =
      columns.find((col) => col.status === targetColumn)?.tickets ?? [];

    const targetIndex =
      statusOrder.includes(overId as TicketStatus) || targetTickets.length === 0
        ? targetTickets.length
        : targetTickets.findIndex((t) => t.id === overId);

    const optimistic = updateColumns(activeId, targetColumn, targetIndex);
    setColumns(optimistic);

    try {
      await moveTicket(activeId, targetColumn, targetIndex);
      startTransition(() => router.refresh());
    } catch (error) {
      console.error(error);
      setColumns(columns); // revert
    }
  };

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {columns.map(({ status, tickets }) => (
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
            <DroppableColumn id={status}>
              {tickets.length === 0 ? (
                <div className="rounded-lg border border-dashed bg-muted/40 p-4 text-sm text-muted-foreground">
                  No tickets in this column.
                </div>
              ) : (
                <SortableContext
                  items={tickets.filter((t) => t.id).map((t) => t.id as string)}
                >
                  <div className="flex flex-col gap-3">
                    {tickets.map((ticket) =>
                      ticket.id ? (
                        <DraggableCard
                          key={ticket.id}
                          ticket={ticket}
                          projectLabel={projectLabels?.[ticket.projectId]}
                        />
                      ) : null
                    )}
                  </div>
                </SortableContext>
              )}
            </DroppableColumn>
          </div>
        ))}
      </div>
      {isPending && (
        <div className="fixed bottom-4 right-4 rounded-full bg-card border shadow px-3 py-2 text-xs text-muted-foreground">
          Syncing…
        </div>
      )}
    </DndContext>
  );
}
