import { Ticket } from "@task-assistant/shared";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const API_URL = process.env.INTERNAL_API_URL || "http://backend:3001";

type TicketsResult =
  | { data: Ticket[]; error?: undefined }
  | { data: []; error: string };

async function getTickets(): Promise<TicketsResult> {
  try {
    const res = await fetch(`${API_URL}/tickets`, { cache: "no-store" });
    if (!res.ok) {
      throw new Error(`Failed to fetch tickets: ${res.statusText}`);
    }
    const json = await res.json();
    return { data: json.data };
  } catch (error) {
    console.error(error);
    return { data: [], error: "Unable to load tickets right now." };
  }
}

export default async function TicketList() {
  const result = await getTickets();
  const tickets = result.data;

  if (result.error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Could not load tickets</AlertTitle>
        <AlertDescription>{result.error}</AlertDescription>
      </Alert>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="rounded-lg border p-6">
        <p className="text-sm text-muted-foreground">No tickets yet.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {tickets.map((ticket) => (
        <div
          key={ticket.id}
          className="p-4 border rounded-lg shadow-sm hover:shadow-md transition-shadow space-y-2"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg line-clamp-1">
              {ticket.title}
            </h3>
            <span className="text-xs rounded-full bg-secondary px-2 py-1 text-secondary-foreground">
              {ticket.status}
            </span>
          </div>
          {ticket.description && (
            <p className="text-sm text-muted-foreground line-clamp-3">
              {ticket.description}
            </p>
          )}
          <div className="text-xs text-muted-foreground flex justify-between">
            <span>Priority: {ticket.priority}</span>
            <span>Project: {ticket.projectId.slice(0, 8)}…</span>
          </div>
        </div>
      ))}
    </div>
  );
}
