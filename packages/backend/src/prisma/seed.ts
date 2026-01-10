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
    // PLAN (4)
    {
      title: "Setup database schema",
      status: "DONE",
      priority: "HIGH",
      projectId: byKey.PLAN,
      source: "MANUAL",
      position: 1000,
    },
    {
      title: "Implement ticket filtering API",
      status: "IN_PROGRESS",
      priority: "HIGH",
      projectId: byKey.PLAN,
      source: "MANUAL",
      position: 1000,
    },
    {
      title: "Add pagination defaults",
      status: "TODO",
      priority: "MEDIUM",
      projectId: byKey.PLAN,
      source: "MANUAL",
      position: 1000,
    },
    {
      title: "Auth guard for project routes",
      status: "BLOCKED",
      priority: "HIGH",
      projectId: byKey.PLAN,
      source: "MANUAL",
      position: 1000,
    },

    // AGNT (4)
    {
      title: "Design agent prompt templates",
      status: "TODO",
      priority: "HIGH",
      projectId: byKey.AGNT,
      source: "MANUAL",
      position: 2000,
    },
    {
      title: "Webhook ingestion for Jira",
      status: "IN_PROGRESS",
      priority: "HIGH",
      projectId: byKey.AGNT,
      source: "MANUAL",
      position: 2000,
    },
    {
      title: "Map external tasks to unified schema",
      status: "DONE",
      priority: "HIGH",
      projectId: byKey.AGNT,
      source: "MANUAL",
      position: 2000,
    },
    {
      title: "Agent error handling",
      status: "TODO",
      priority: "CRITICAL",
      projectId: byKey.AGNT,
      source: "MANUAL",
      position: 3000,
    },

    // FRNT (4)
    {
      title: "Implement filter bar with status",
      status: "DONE",
      priority: "MEDIUM",
      projectId: byKey.FRNT,
      source: "MANUAL",
      position: 3000,
    },
    {
      title: "Ticket card redesign",
      status: "IN_PROGRESS",
      priority: "MEDIUM",
      projectId: byKey.FRNT,
      source: "MANUAL",
      position: 3000,
    },
    {
      title: "Board view scaffold",
      status: "TODO",
      priority: "HIGH",
      projectId: byKey.FRNT,
      source: "MANUAL",
      position: 4000,
    },
    {
      title: "Accessibility sweep",
      status: "BLOCKED",
      priority: "HIGH",
      projectId: byKey.FRNT,
      source: "MANUAL",
      position: 4000,
    },

    // OPS (3)
    {
      title: "Configure metrics dashboard",
      status: "TODO",
      priority: "HIGH",
      projectId: byKey.OPS,
      source: "MANUAL",
      position: 5000,
    },
    {
      title: "CD pipeline for backend",
      status: "IN_PROGRESS",
      priority: "HIGH",
      projectId: byKey.OPS,
      source: "MANUAL",
      position: 5000,
    },
    {
      title: "Health check endpoints",
      status: "DONE",
      priority: "LOW",
      projectId: byKey.OPS,
      source: "MANUAL",
      position: 5000,
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
