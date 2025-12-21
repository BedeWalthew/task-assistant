import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.ticket.deleteMany();
  await prisma.project.deleteMany();

  const projects = await prisma.project.createMany({
    data: [
      {
        name: "Personal Planner",
        key: "PLAN",
        description: "Tasks related to the planner product itself",
      },
      {
        name: "AI Agent",
        key: "AGNT",
        description: "Conversational agent features and integrations",
      },
      {
        name: "Frontend Revamp",
        key: "FRNT",
        description: "UI/UX improvements and component library work",
      },
      {
        name: "Infra & Ops",
        key: "OPS",
        description: "Reliability, monitoring, and developer tooling",
      },
    ],
  });

  console.log(`Created ${projects.count} projects`);

  const projectRecords = await prisma.project.findMany({
    orderBy: { createdAt: "asc" },
  });
  const byKey = Object.fromEntries(projectRecords.map((p) => [p.key, p.id]));

  const tickets = [
    // PLAN (8)
    {
      title: "Setup database schema",
      status: "DONE",
      priority: "HIGH",
      projectId: byKey.PLAN,
      source: "MANUAL",
    },
    {
      title: "Implement ticket filtering API",
      status: "IN_PROGRESS",
      priority: "HIGH",
      projectId: byKey.PLAN,
      source: "MANUAL",
    },
    {
      title: "Add pagination defaults",
      status: "TODO",
      priority: "MEDIUM",
      projectId: byKey.PLAN,
      source: "MANUAL",
    },
    {
      title: "Project detail page polish",
      status: "TODO",
      priority: "LOW",
      projectId: byKey.PLAN,
      source: "MANUAL",
    },
    {
      title: "Add project search indexing",
      status: "TODO",
      priority: "MEDIUM",
      projectId: byKey.PLAN,
      source: "MANUAL",
    },
    {
      title: "Auth guard for project routes",
      status: "BLOCKED",
      priority: "HIGH",
      projectId: byKey.PLAN,
      source: "MANUAL",
    },
    {
      title: "Add project activity timeline",
      status: "TODO",
      priority: "LOW",
      projectId: byKey.PLAN,
      source: "MANUAL",
    },
    {
      title: "Write project route tests",
      status: "IN_PROGRESS",
      priority: "MEDIUM",
      projectId: byKey.PLAN,
      source: "MANUAL",
    },

    // AGNT (9)
    {
      title: "Design agent prompt templates",
      status: "TODO",
      priority: "HIGH",
      projectId: byKey.AGNT,
      source: "MANUAL",
    },
    {
      title: "Webhook ingestion for Jira",
      status: "IN_PROGRESS",
      priority: "HIGH",
      projectId: byKey.AGNT,
      source: "MANUAL",
    },
    {
      title: "GitHub Actions polling",
      status: "TODO",
      priority: "MEDIUM",
      projectId: byKey.AGNT,
      source: "MANUAL",
    },
    {
      title: "Map external tasks to unified schema",
      status: "DONE",
      priority: "HIGH",
      projectId: byKey.AGNT,
      source: "MANUAL",
    },
    {
      title: "Voice input prototype",
      status: "IN_PROGRESS",
      priority: "MEDIUM",
      projectId: byKey.AGNT,
      source: "MANUAL",
    },
    {
      title: "Agent error handling",
      status: "TODO",
      priority: "CRITICAL",
      projectId: byKey.AGNT,
      source: "MANUAL",
    },
    {
      title: "Session context retention",
      status: "TODO",
      priority: "HIGH",
      projectId: byKey.AGNT,
      source: "MANUAL",
    },
    {
      title: "Improve entity extraction",
      status: "TODO",
      priority: "MEDIUM",
      projectId: byKey.AGNT,
      source: "MANUAL",
    },
    {
      title: "Telemetry for agent requests",
      status: "DONE",
      priority: "LOW",
      projectId: byKey.AGNT,
      source: "MANUAL",
    },

    // FRNT (9)
    {
      title: "Implement filter bar with status",
      status: "DONE",
      priority: "MEDIUM",
      projectId: byKey.FRNT,
      source: "MANUAL",
    },
    {
      title: "Add project filter to tickets page",
      status: "DONE",
      priority: "HIGH",
      projectId: byKey.FRNT,
      source: "MANUAL",
    },
    {
      title: "Ticket card redesign",
      status: "IN_PROGRESS",
      priority: "MEDIUM",
      projectId: byKey.FRNT,
      source: "MANUAL",
    },
    {
      title: "Board view scaffold",
      status: "TODO",
      priority: "HIGH",
      projectId: byKey.FRNT,
      source: "MANUAL",
    },
    {
      title: "Drag-and-drop experiment",
      status: "TODO",
      priority: "MEDIUM",
      projectId: byKey.FRNT,
      source: "MANUAL",
    },
    {
      title: "Empty states for tickets",
      status: "DONE",
      priority: "LOW",
      projectId: byKey.FRNT,
      source: "MANUAL",
    },
    {
      title: "Dark mode polish",
      status: "IN_PROGRESS",
      priority: "LOW",
      projectId: byKey.FRNT,
      source: "MANUAL",
    },
    {
      title: "Pagination component",
      status: "TODO",
      priority: "MEDIUM",
      projectId: byKey.FRNT,
      source: "MANUAL",
    },
    {
      title: "Accessibility sweep",
      status: "TODO",
      priority: "HIGH",
      projectId: byKey.FRNT,
      source: "MANUAL",
    },

    // OPS (9)
    {
      title: "Add request logging",
      status: "IN_PROGRESS",
      priority: "MEDIUM",
      projectId: byKey.OPS,
      source: "MANUAL",
    },
    {
      title: "Configure metrics dashboard",
      status: "TODO",
      priority: "HIGH",
      projectId: byKey.OPS,
      source: "MANUAL",
    },
    {
      title: "Alerts for 5xx spikes",
      status: "TODO",
      priority: "CRITICAL",
      projectId: byKey.OPS,
      source: "MANUAL",
    },
    {
      title: "Database backups schedule",
      status: "DONE",
      priority: "MEDIUM",
      projectId: byKey.OPS,
      source: "MANUAL",
    },
    {
      title: "CD pipeline for backend",
      status: "IN_PROGRESS",
      priority: "HIGH",
      projectId: byKey.OPS,
      source: "MANUAL",
    },
    {
      title: "Container image hardening",
      status: "TODO",
      priority: "MEDIUM",
      projectId: byKey.OPS,
      source: "MANUAL",
    },
    {
      title: "Sentry rollout",
      status: "TODO",
      priority: "LOW",
      projectId: byKey.OPS,
      source: "MANUAL",
    },
    {
      title: "Health check endpoints",
      status: "DONE",
      priority: "LOW",
      projectId: byKey.OPS,
      source: "MANUAL",
    },
    {
      title: "Infra cost report",
      status: "TODO",
      priority: "LOW",
      projectId: byKey.OPS,
      source: "MANUAL",
    },
  ];

  const created = await prisma.ticket.createMany({ data: tickets });
  console.log(`Seeded ${created.count} tickets`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
