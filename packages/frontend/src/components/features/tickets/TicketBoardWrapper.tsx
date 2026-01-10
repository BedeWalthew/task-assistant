"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { TicketBoard } from "./TicketBoard";
import type { Ticket } from "@task-assistant/shared";

type TicketBoardWrapperProps = {
  items: Ticket[];
  projectLabels?: Record<string, string>;
};

export function TicketBoardWrapper({
  items: initialItems,
  projectLabels,
}: TicketBoardWrapperProps) {
  const queryClient = useQueryClient();

  useEffect(() => {
    queryClient.setQueryData(["tickets"], { items: initialItems });
  }, [initialItems, queryClient]);

  const { data } = useQuery<{ items: Ticket[] }>({
    queryKey: ["tickets"],
    initialData: { items: initialItems },
    staleTime: Infinity,
  });

  return (
    <TicketBoard items={data?.items ?? []} projectLabels={projectLabels} />
  );
}
