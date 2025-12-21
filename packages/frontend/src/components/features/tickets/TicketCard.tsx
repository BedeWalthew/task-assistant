import { Ticket } from "@task-assistant/shared";
import Link from "next/link";

type TicketCardProps = {
  ticket: Ticket;
  projectLabel?: string;
  compact?: boolean;
};

const statusStyles: Record<Ticket["status"], string> = {
  TODO: "bg-slate-100 text-slate-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  DONE: "bg-emerald-100 text-emerald-700",
  BLOCKED: "bg-amber-100 text-amber-700",
};

const priorityStyles: Record<Ticket["priority"], string> = {
  LOW: "bg-slate-100 text-slate-700",
  MEDIUM: "bg-indigo-100 text-indigo-700",
  HIGH: "bg-orange-100 text-orange-700",
  CRITICAL: "bg-red-100 text-red-700",
};

export default function TicketCard({
  ticket,
  projectLabel,
  compact = false,
}: TicketCardProps) {
  const isCompact = compact;
  return (
    <div
      className={`border rounded-lg shadow-sm hover:shadow-md transition-shadow bg-card ${
        isCompact ? "p-3 space-y-2" : "p-4 space-y-3"
      }`}
    >
      <div className="space-y-1">
        <h3
          className={`font-semibold leading-tight line-clamp-1 ${
            isCompact ? "text-sm" : "text-lg"
          }`}
        >
          {ticket.title}
        </h3>
        {!isCompact && ticket.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {ticket.description}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span
          className={`rounded-full px-2 py-1 font-medium ${
            priorityStyles[ticket.priority]
          }`}
        >
          {ticket.priority}
        </span>
        <span className="font-mono text-[11px]">
          Project: {projectLabel ?? ticket.projectId.slice(0, 8)}
        </span>
      </div>

      {!isCompact && ticket.sourceUrl && (
        <Link
          href={ticket.sourceUrl}
          className="text-xs text-primary underline underline-offset-4"
          target="_blank"
          rel="noreferrer"
        >
          Source
        </Link>
      )}
    </div>
  );
}
