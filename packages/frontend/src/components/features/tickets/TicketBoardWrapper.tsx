"use client";

import { useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { TicketBoard } from "./TicketBoard";
import type { Ticket } from "@task-assistant/shared";

type TicketBoardWrapperProps = {
  items: Ticket[];
  projectLabels?: Record<string, string>;
};

async function fetchTickets(): Promise<{ items: Ticket[] }> {
  const res = await fetch("/api/tickets");
  if (!res.ok) throw new Error("Failed to fetch tickets");
  const json = await res.json();
  return { items: json.data?.items ?? [] };
}

export function TicketBoardWrapper({
  items: initialItems,
  projectLabels,
}: TicketBoardWrapperProps) {
  const queryClient = useQueryClient();
  const hasHydrated = useRef(false);

  // Only set initial data once on mount, don't overwrite after mutations
  useEffect(() => {
    if (!hasHydrated.current) {
      queryClient.setQueryData(["tickets"], { items: initialItems });
      hasHydrated.current = true;
    }
  }, [initialItems, queryClient]);

  const { data } = useQuery<{ items: Ticket[] }>({
    queryKey: ["tickets"],
    queryFn: fetchTickets,
    initialData: { items: initialItems },
    staleTime: 30000, // 30 seconds - allows refetch after mutations
  });

  return (
    <TicketBoard items={data?.items ?? []} projectLabels={projectLabels} />
  );
}
