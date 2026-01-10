"use client";

import { useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { TicketBoard } from "./TicketBoard";
import type { Ticket } from "@task-assistant/shared";

type TicketBoardWrapperProps = {
  items: Ticket[];
  projectLabels?: Record<string, string>;
  searchParams?: Record<string, string>;
};

async function fetchTickets(searchParams?: Record<string, string>): Promise<{ items: Ticket[] }> {
  const params = new URLSearchParams();
  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
      // Exclude view param from API call
      if (key !== "view" && value) {
        params.set(key, value);
      }
    });
  }
  const query = params.toString();
  const url = query ? `/api/tickets?${query}` : "/api/tickets";
  
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch tickets");
  const json = await res.json();
  return { items: json.data?.items ?? [] };
}

export function TicketBoardWrapper({
  items: initialItems,
  projectLabels,
  searchParams,
}: TicketBoardWrapperProps) {
  const queryClient = useQueryClient();
  const hasHydrated = useRef(false);

  // Create a stable query key based on filter params
  const queryKey = ["tickets", searchParams ?? {}];

  // Only set initial data once on mount, don't overwrite after mutations
  useEffect(() => {
    if (!hasHydrated.current) {
      queryClient.setQueryData(queryKey, { items: initialItems });
      hasHydrated.current = true;
    }
  }, [initialItems, queryClient, queryKey]);

  const { data } = useQuery<{ items: Ticket[] }>({
    queryKey,
    queryFn: () => fetchTickets(searchParams),
    initialData: { items: initialItems },
    staleTime: 30000, // 30 seconds - allows refetch after mutations
  });

  return (
    <TicketBoard items={data?.items ?? []} projectLabels={projectLabels} />
  );
}
