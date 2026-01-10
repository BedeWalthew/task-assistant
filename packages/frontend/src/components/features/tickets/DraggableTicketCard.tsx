import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Ticket } from "@task-assistant/shared";
import TicketCard from "./TicketCard";

type DraggableTicketCardProps = {
  ticket: Ticket;
  projectLabel?: string;
};

export function DraggableTicketCard({
  ticket,
  projectLabel,
}: DraggableTicketCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: ticket.id as string });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TicketCard
        ticket={ticket}
        projectLabel={projectLabel}
        compact
        isDragging={isDragging}
      />
    </div>
  );
}
