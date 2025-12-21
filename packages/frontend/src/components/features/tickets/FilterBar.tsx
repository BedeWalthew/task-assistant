"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  TicketPriority,
  TicketSortBy,
  TicketSortOrder,
  TicketStatus,
} from "@task-assistant/shared";
import { type Project } from "@task-assistant/shared/src/schemas/project";
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

export function FilterBar({ searchParams, projects }: FilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const current = useSearchParams();

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

  const handleSortChange = (value: string) => {
    const [sortBy, sortOrder] = value.split(":");
    updateParams({
      sortBy: sortBy || TicketSortBy.options[0],
      sortOrder: sortOrder || TicketSortOrder.options[1],
    });
  };

  const combinedSortValue = `${searchParams.sortBy ?? "createdAt"}:${
    searchParams.sortOrder ?? "desc"
  }`;

  return (
    <div className="rounded-lg border px-4 py-3 grid gap-3 md:grid-cols-2 lg:grid-cols-4 items-center">
      <Input
        placeholder="Search title or description"
        defaultValue={searchParams.search ?? ""}
        onChange={(event) =>
          updateParams({ search: event.target.value.trim() || undefined })
        }
      />

      <Select
        defaultValue={searchParams.projectId ?? "ANY"}
        onValueChange={(value) =>
          updateParams({ projectId: value === "ANY" ? undefined : value })
        }
      >
        <SelectTrigger>
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

      <Select
        defaultValue={searchParams.status ?? "ANY"}
        onValueChange={(value) =>
          updateParams({ status: value === "ANY" ? undefined : value })
        }
      >
        <SelectTrigger>
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

      <Select
        defaultValue={searchParams.priority ?? "ANY"}
        onValueChange={(value) =>
          updateParams({ priority: value === "ANY" ? undefined : value })
        }
      >
        <SelectTrigger>
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

      <Select defaultValue={combinedSortValue} onValueChange={handleSortChange}>
        <SelectTrigger>
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

      <div className="md:col-span-2 lg:col-span-4 flex flex-wrap gap-2">
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
            })
          }
        >
          Clear filters
        </Button>
      </div>
    </div>
  );
}
