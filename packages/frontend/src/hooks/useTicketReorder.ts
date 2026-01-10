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
      // Use partial matching to cancel all ticket queries regardless of filters
      await queryClient.cancelQueries({ queryKey: ["tickets"] });

      // Get all ticket query caches and update them
      const queryCache = queryClient.getQueryCache();
      const ticketQueries = queryCache.findAll({ queryKey: ["tickets"] });
      
      const previousData = new Map<string, { items: Ticket[] }>();
      
      ticketQueries.forEach((query) => {
        const key = JSON.stringify(query.queryKey);
        const data = query.state.data as { items: Ticket[] } | undefined;
        if (data) {
          previousData.set(key, data);
          // Optimistically update this cache entry
          queryClient.setQueryData<{ items: Ticket[] }>(query.queryKey, {
            ...data,
            items: data.items.map((t) =>
              t.id === input.ticketId
                ? { ...t, status: input.status, position: input.position }
                : t
            ),
          });
        }
      });

      return { previousData };
    },
    onSuccess: (updatedTicket) => {
      // Update all ticket query caches with the actual server response
      const queryCache = queryClient.getQueryCache();
      const ticketQueries = queryCache.findAll({ queryKey: ["tickets"] });
      
      ticketQueries.forEach((query) => {
        queryClient.setQueryData<{ items: Ticket[] }>(query.queryKey, (old) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.map((t) =>
              t.id === updatedTicket.id ? updatedTicket : t
            ),
          };
        });
      });
    },
    onError: (_err, _input, context) => {
      // Rollback all caches to previous state on error
      if (context?.previousData) {
        context.previousData.forEach((data, key) => {
          const queryKey = JSON.parse(key);
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error("Failed to move ticket. Please try again.");
    },
  });
}
