import { Suspense } from "react";
import ProjectList from "@/components/features/projects/ProjectList";
import { ProjectCreateForm } from "@/components/features/projects/ProjectCreateForm";

export default function ProjectsPage() {
  return (
    <div className="mx-auto max-w-5xl w-full px-6 py-10 space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Projects</h1>
        <p className="text-muted-foreground">
          Create projects and view them below. Each project can have tickets
          (coming soon).
        </p>
      </div>

      <ProjectCreateForm />

      <Suspense fallback={<div>Loading projects...</div>}>
        <ProjectList />
      </Suspense>
    </div>
  );
}
