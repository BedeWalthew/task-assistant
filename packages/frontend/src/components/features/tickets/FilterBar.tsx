"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  TicketPriority,
  TicketSortBy,
  TicketSortOrder,
  TicketStatus,
  type Project,
} from "@task-assistant/shared";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

type FilterBarProps = {
  searchParams: Record<string, string>;
  projects: Project[];
};

const statusOptions = ["ANY", ...TicketStatus.options] as const;
const priorityOptions = ["ANY", ...TicketPriority.options] as const;
const projectOptions = ["ANY"] as const;
const viewOptions = ["list", "board"] as const;

export function FilterBar({ searchParams, projects }: FilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const current = useSearchParams();

  // Determine current view
  const currentView = (searchParams.view ?? "list").toLowerCase() === "board" ? "board" : "list";
  const isBoardView = currentView === "board";

  const updateParams = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(current?.toString() ?? "");
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    // Reset pagination when filters change
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  };

  const currentSortBy = TicketSortBy.options.includes(
    searchParams.sortBy as (typeof TicketSortBy.options)[number]
  )
    ? searchParams.sortBy
    : TicketSortBy.options[0];

  const currentSortOrder = TicketSortOrder.options.includes(
    searchParams.sortOrder as (typeof TicketSortOrder.options)[number]
  )
    ? searchParams.sortOrder
    : TicketSortOrder.options[1];

  const combinedSortValue = `${currentSortBy}:${currentSortOrder}`;

  const handleSortChange = (value: string) => {
    const [sortBy, sortOrder] = value.split(":");
    const safeSortBy = TicketSortBy.options.includes(
      sortBy as (typeof TicketSortBy.options)[number]
    )
      ? sortBy
      : TicketSortBy.options[0];
    const safeSortOrder = TicketSortOrder.options.includes(
      sortOrder as (typeof TicketSortOrder.options)[number]
    )
      ? sortOrder
      : TicketSortOrder.options[1];

    updateParams({
      sortBy: safeSortBy,
      sortOrder: safeSortOrder,
    });
  };

  return (
    <div className="rounded-lg border px-4 py-3 grid gap-3 md:grid-cols-2 lg:grid-cols-4 items-center" data-testid="filter-bar">
      <Input
        placeholder="Search title or description"
        defaultValue={searchParams.search ?? ""}
        onChange={(event) =>
          updateParams({ search: event.target.value.trim() || undefined })
        }
        data-testid="filter-search"
      />

      <Select
        defaultValue={searchParams.projectId ?? "ANY"}
        onValueChange={(value) =>
          updateParams({ projectId: value === "ANY" ? undefined : value })
        }
      >
        <SelectTrigger data-testid="filter-project">
          <SelectValue placeholder="Project" />
        </SelectTrigger>
        <SelectContent>
          {projectOptions.map((project) => (
            <SelectItem key={project} value={project}>
              Any project
            </SelectItem>
          ))}
          {projects.map((project) => (
            <SelectItem
              key={project.id ?? project.name}
              value={project.id ?? ""}
            >
              {project.name} ({project.key})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Status filter hidden in board view - board already groups by status */}
      {!isBoardView && (
        <Select
          defaultValue={searchParams.status ?? "ANY"}
          onValueChange={(value) =>
            updateParams({ status: value === "ANY" ? undefined : value })
          }
        >
          <SelectTrigger data-testid="filter-status">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((status) => (
              <SelectItem key={status} value={status}>
                {status === "ANY" ? "Any status" : status.replace("_", " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <Select
        defaultValue={searchParams.priority ?? "ANY"}
        onValueChange={(value) =>
          updateParams({ priority: value === "ANY" ? undefined : value })
        }
      >
        <SelectTrigger data-testid="filter-priority">
          <SelectValue placeholder="Priority" />
        </SelectTrigger>
        <SelectContent>
          {priorityOptions.map((priority) => (
            <SelectItem key={priority} value={priority}>
              {priority === "ANY" ? "Any priority" : priority}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={combinedSortValue} onValueChange={handleSortChange}>
        <SelectTrigger data-testid="filter-sort">
          <SelectValue placeholder="Sort" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="createdAt:desc">Newest</SelectItem>
          <SelectItem value="createdAt:asc">Oldest</SelectItem>
          <SelectItem value="priority:desc">Priority (High → Low)</SelectItem>
          <SelectItem value="priority:asc">Priority (Low → High)</SelectItem>
          <SelectItem value="status:asc">Status (A → Z)</SelectItem>
        </SelectContent>
      </Select>

      <div className="md:col-span-2 lg:col-span-4 flex flex-wrap gap-2 items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-[0.08em] text-muted-foreground">
            View
          </span>
          <div className="inline-flex rounded-md border bg-card p-1" data-testid="view-toggle">
            {viewOptions.map((option) => {
              const isActive =
                (searchParams.view ?? "list").toLowerCase() === option;
              return (
                <Button
                  key={option}
                  size="sm"
                  variant={isActive ? "secondary" : "ghost"}
                  className="px-3"
                  onClick={() => updateParams({ view: option })}
                  data-testid={`view-toggle-${option}`}
                >
                  {option === "list" ? "List" : "Board"}
                </Button>
              );
            })}
          </div>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            updateParams({
              search: undefined,
              status: undefined,
              priority: undefined,
              sortBy: undefined,
              sortOrder: undefined,
              projectId: undefined,
              assigneeId: undefined,
              view: undefined,
            })
          }
          data-testid="clear-filters"
        >
          Clear filters
        </Button>
      </div>
    </div>
  );
}
