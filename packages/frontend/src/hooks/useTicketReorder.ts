import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Ticket, TicketStatus } from "@task-assistant/shared";

type ReorderInput = {
  ticketId: string;
  status: TicketStatus;
  position: number;
};

async function reorderTicketApi(input: ReorderInput): Promise<Ticket> {
  const res = await fetch(`/api/tickets/${input.ticketId}/reorder`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: input.status, position: input.position }),
  });
  if (!res.ok) throw new Error("Failed to reorder ticket");
  const json = await res.json();
  return json.data;
}

export function useTicketReorder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: reorderTicketApi,
    onMutate: async (input) => {
      // Cancel any outgoing refetches to prevent overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ["tickets"] });

      const previousTickets = queryClient.getQueryData<{ items: Ticket[] }>([
        "tickets",
      ]);

      // Optimistically update the cache
      queryClient.setQueryData<{ items: Ticket[] }>(["tickets"], (old) => {
        if (!old) return old;
        return {
          ...old,
          items: old.items.map((t) =>
            t.id === input.ticketId
              ? { ...t, status: input.status, position: input.position }
              : t
          ),
        };
      });

      return { previousTickets };
    },
    onSuccess: (updatedTicket) => {
      // Update cache with the actual server response (no refetch needed)
      queryClient.setQueryData<{ items: Ticket[] }>(["tickets"], (old) => {
        if (!old) return old;
        return {
          ...old,
          items: old.items.map((t) =>
            t.id === updatedTicket.id ? updatedTicket : t
          ),
        };
      });
    },
    onError: (_err, _input, context) => {
      // Rollback to previous state on error
      if (context?.previousTickets) {
        queryClient.setQueryData(["tickets"], context.previousTickets);
      }
      toast.error("Failed to move ticket. Please try again.");
    },
    // No onSettled invalidation - we update directly in onSuccess
  });
}
