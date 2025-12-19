import { Suspense } from "react";

export default function Home() {
  return (
    <main className="min-h-screen p-8 md:p-16 lg:p-24 space-y-8">
      <div className="flex flex-col gap-4">
        <h1 className="text-4xl font-bold">Task Assistant</h1>
        <p className="text-muted-foreground max-w-2xl">
          Welcome back. Use the navigation above to manage your projects and
          tickets.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-2">Projects</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Create and manage your projects. Track tickets per project.
          </p>
          <a
            href="/projects"
            className="text-sm font-semibold text-primary hover:underline"
          >
            Go to Projects →
          </a>
        </div>
        <div className="rounded-lg border p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-2">Tickets</h2>
          <p className="text-sm text-muted-foreground mb-4">
            View and filter tickets across projects (coming soon).
          </p>
        </div>
      </div>
    </main>
  );
}
