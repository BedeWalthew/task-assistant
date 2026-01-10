import { Project } from "@task-assistant/shared";

const API_URL = process.env.INTERNAL_API_URL || 'http://backend:3001';

async function getProjects(): Promise<Project[]> {
  try {
    const res = await fetch(`${API_URL}/projects`, {
      cache: 'no-store',
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch projects: ${res.statusText}`);
    }

    const json = await res.json();
    return json.data;
  } catch (error) {
    console.error(error);
    return [];
  }
}

export default async function ProjectList() {
  const projects = await getProjects();

  return (
    <div className="space-y-4" data-testid="project-list">
      <h2 className="text-xl font-bold">Projects ({projects.length})</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <div key={project.id} className="p-4 border rounded-lg shadow-sm hover:shadow-md transition-shadow" data-testid="project-card">
            <h3 className="font-semibold text-lg" data-testid="project-card-name">{project.name}</h3>
            <p className="text-sm text-gray-500 mb-2" data-testid="project-card-key">{project.key}</p>
            {project.description && (
              <p className="text-gray-700" data-testid="project-card-desc">{project.description}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
