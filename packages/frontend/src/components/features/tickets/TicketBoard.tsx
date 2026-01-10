"use client";

import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useState, useEffect } from "react";
import { useTicketReorder } from "@/hooks/useTicketReorder";
import { TicketColumn } from "./TicketColumn";
import TicketCard from "./TicketCard";
import type { Ticket, TicketStatus } from "@task-assistant/shared";

type TicketBoardProps = {
  items: Ticket[];
  projectLabels?: Record<string, string>;
};

const statusOrder: TicketStatus[] = ["TODO", "IN_PROGRESS", "DONE", "BLOCKED"];

export function TicketBoard({ items, projectLabels }: TicketBoardProps) {
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const { mutate: reorderTicket } = useTicketReorder();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const ticket = items.find((t) => t.id === event.active.id);
    setActiveTicket(ticket ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTicket(null);
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const ticketId = active.id as string;
    const overId = over.id as string;

    const activeTicket = items.find((t) => t.id === ticketId);
    if (!activeTicket) return;

    let targetStatus: TicketStatus;
    if (statusOrder.includes(overId as TicketStatus)) {
      targetStatus = overId as TicketStatus;
    } else {
      const overTicket = items.find((t) => t.id === overId);
      targetStatus = overTicket?.status ?? activeTicket.status;
    }

    const columnTickets = items
      .filter((t) => t.status === targetStatus && t.id !== ticketId)
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

    let newPosition: number;

    if (statusOrder.includes(overId as TicketStatus)) {
      if (columnTickets.length > 0) {
        newPosition =
          (columnTickets[columnTickets.length - 1].position ?? 0) + 1000;
      } else {
        newPosition = 1000;
      }
    } else {
      const overIndex = columnTickets.findIndex((t) => t.id === overId);

      if (overIndex === -1) {
        newPosition =
          columnTickets.length > 0
            ? (columnTickets[columnTickets.length - 1].position ?? 0) + 1000
            : 1000;
      } else {
        const before =
          overIndex > 0 ? columnTickets[overIndex - 1].position ?? 0 : 0;
        const after = columnTickets[overIndex].position ?? before + 2000;
        newPosition =
          before === 0 && after > 0 ? after / 2 : (before + after) / 2;

        if (newPosition <= 0) {
          newPosition = 1;
        }
      }
    }

    reorderTicket({ ticketId, status: targetStatus, position: newPosition });
  };

  const grouped = statusOrder.map((status) => ({
    status,
    tickets: items
      .filter((ticket) => ticket.status === status)
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0)),
  }));

  // Prevent DndContext from rendering on server to avoid hydration mismatch
  if (!isMounted) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" data-testid="ticket-board">
        {grouped.map(({ status, tickets }) => (
          <TicketColumn
            key={status}
            status={status}
            tickets={tickets}
            projectLabels={projectLabels}
          />
        ))}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" data-testid="ticket-board">
        {grouped.map(({ status, tickets }) => (
          <TicketColumn
            key={status}
            status={status}
            tickets={tickets}
            projectLabels={projectLabels}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTicket && (
          <TicketCard
            ticket={activeTicket}
            projectLabel={projectLabels?.[activeTicket.projectId]}
            compact
            isDragging
          />
        )}
      </DragOverlay>
    </DndContext>
  );
}
