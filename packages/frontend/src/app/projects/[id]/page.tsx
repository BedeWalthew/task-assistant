import { notFound } from "next/navigation";
import { Project } from "@task-assistant/shared/src/schemas/project";

const API_URL = process.env.INTERNAL_API_URL || "http://backend:3001";

async function getProject(id: string): Promise<Project | null> {
  try {
    const res = await fetch(`${API_URL}/projects/${id}`, { cache: "no-store" });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Failed to fetch project ${id}`);
    const json = await res.json();
    return json.data;
  } catch (error) {
    console.error(error);
    return null;
  }
}

type ProjectPageProps = {
  params: { id: string };
};

export default async function ProjectPage({ params }: ProjectPageProps) {
  const project = await getProject(params.id);
  if (!project) return notFound();

  return (
    <div className="mx-auto max-w-5xl w-full px-6 py-10 space-y-6">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Project</p>
        <h1 className="text-3xl font-bold">{project.name}</h1>
        <p className="text-muted-foreground">
          {project.description || "No description provided."}
        </p>
        <p className="text-sm text-muted-foreground">Key: {project.key}</p>
      </div>

      <div className="rounded-lg border p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-2">Tickets</h2>
        <p className="text-sm text-muted-foreground">
          Ticket list and creation will appear here (coming soon).
        </p>
      </div>
    </div>
  );
}
