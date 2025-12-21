export const dynamic = "force-dynamic";

import Link from "next/link";
import { Suspense } from "react";
import {
  TicketFilterSchema,
  type Ticket,
  type TicketFilterInput,
} from "@task-assistant/shared";
import { type Project } from "@task-assistant/shared/src/schemas/project";
import TicketList from "@/components/features/tickets/TicketList";
import { TicketBoard } from "@/components/features/tickets/TicketBoard";
import { FilterBar } from "@/components/features/tickets/FilterBar";
import { CreateTicketModal } from "@/components/features/tickets/CreateTicketModal";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const API_URL = process.env.INTERNAL_API_URL || "http://backend:3001";

type TicketsResponse = {
  items: Ticket[];
  total: number;
  page: number;
  pageSize: number;
};

async function fetchProjects(): Promise<Project[]> {
  try {
    const res = await fetch(`${API_URL}/projects`, { cache: "no-store" });
    if (!res.ok) {
      throw new Error(`Failed to fetch projects: ${res.statusText}`);
    }
    const json = await res.json();
    return json.data as Project[];
  } catch (error) {
    console.error(error);
    return [];
  }
}

const toObject = (
  searchParams: Record<string, string | string[] | undefined>
): Record<string, string> =>
  Object.fromEntries(
    Object.entries(searchParams)
      .map(([key, value]) => {
        if (Array.isArray(value)) {
          return [key, value[0]];
        }
        if (value === undefined) {
          return undefined;
        }
        return [key, value];
      })
      .filter((entry): entry is [string, string] => Boolean(entry))
  );

const buildQuery = (filters: TicketFilterInput): string => {
  const params = new URLSearchParams();
  if (filters.projectId) params.set("projectId", filters.projectId);
  if (filters.status) params.set("status", filters.status);
  if (filters.priority) params.set("priority", filters.priority);
  if (filters.assigneeId) params.set("assigneeId", filters.assigneeId);
  if (filters.search) params.set("search", filters.search);
  if (filters.sortBy) params.set("sortBy", filters.sortBy);
  if (filters.sortOrder) params.set("sortOrder", filters.sortOrder);
  if (filters.page) params.set("page", filters.page.toString());
  if (filters.limit) params.set("limit", filters.limit.toString());
  return params.toString();
};

async function fetchTickets(
  filters: TicketFilterInput
): Promise<{ data?: TicketsResponse; error?: string }> {
  try {
    const query = buildQuery(filters);
    const res = await fetch(`${API_URL}/tickets${query ? `?${query}` : ""}`, {
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch tickets: ${res.statusText}`);
    }
    const json = await res.json();
    return { data: json.data as TicketsResponse };
  } catch (error) {
    console.error(error);
    return { error: "Unable to load tickets right now." };
  }
}

type TicketsPageProps = {
  searchParams:
    | Record<string, string | string[] | undefined>
    | Promise<Record<string, string | string[] | undefined>>;
};

export default async function TicketsPage({ searchParams }: TicketsPageProps) {
  const resolvedSearchParams = await Promise.resolve(searchParams);
  const parsed = TicketFilterSchema.safeParse(toObject(resolvedSearchParams));
  const filters = parsed.success ? parsed.data : TicketFilterSchema.parse({});
  if (!parsed.success) {
    console.error("Invalid search parameters:", parsed.error);
  }
  const projects = await fetchProjects();
  const view =
    (resolvedSearchParams.view?.toString().toLowerCase() ?? "list") === "board"
      ? "board"
      : "list";
  const boardFilters: TicketFilterInput =
    view === "board"
      ? { ...filters, sortBy: "position", sortOrder: "asc" }
      : filters;

  const result = await fetchTickets(boardFilters);
  const projectLabels = Object.fromEntries(
    projects
      .filter((project) => project.id && project.key)
      .map((project) => [project.id as string, project.key as string])
  );

  return (
    <div className="mx-auto max-w-6xl w-full px-6 py-10 space-y-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold">Tickets</h1>
          <p className="text-muted-foreground">
            Create and browse tickets across projects.
          </p>
        </div>
        <CreateTicketModal />
      </div>

      <Suspense
        fallback={<div className="rounded-lg border p-4">Loading filters…</div>}
      >
        <FilterBar
          searchParams={toObject(resolvedSearchParams)}
          projects={projects}
        />
      </Suspense>

      <Suspense fallback={<div>Loading tickets...</div>}>
        {result.error && (
          <Alert variant="destructive">
            <AlertTitle>Could not load tickets</AlertTitle>
            <AlertDescription>{result.error}</AlertDescription>
          </Alert>
        )}
        {result.data && (
          <div className="space-y-4">
            {view === "board" ? (
              <TicketBoard
                items={result.data.items}
                projectLabels={projectLabels}
              />
            ) : (
              <>
                <TicketList
                  items={result.data.items}
                  total={result.data.total}
                  page={result.data.page}
                  pageSize={result.data.pageSize}
                  projectLabels={projectLabels}
                />
                <Pagination
                  total={result.data.total}
                  page={result.data.page}
                  pageSize={result.data.pageSize}
                  searchParams={toObject(resolvedSearchParams)}
                />
              </>
            )}
          </div>
        )}
      </Suspense>
    </div>
  );
}

type PaginationProps = {
  total: number;
  page: number;
  pageSize: number;
  searchParams: Record<string, string>;
};

function Pagination({ total, page, pageSize, searchParams }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const buildHref = (targetPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", targetPage.toString());
    return `/tickets?${params.toString()}`;
  };

  return (
    <div className="flex items-center justify-between gap-3 border rounded-lg px-4 py-3">
      <div className="text-sm text-muted-foreground">
        Page {page} of {totalPages} • {total} tickets
      </div>
      <div className="flex gap-2">
        <Button asChild variant="outline" size="sm" disabled={page <= 1}>
          <Link href={buildHref(Math.max(1, page - 1))}>Previous</Link>
        </Button>
        <Button
          asChild
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
        >
          <Link href={buildHref(Math.min(totalPages, page + 1))}>Next</Link>
        </Button>
      </div>
    </div>
  );
}
