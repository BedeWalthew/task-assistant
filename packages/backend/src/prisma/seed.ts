import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create a project
  const project = await prisma.project.create({
    data: {
      name: 'Personal Planner',
      key: 'PLAN',
      description: 'Tasks related to the planner project itself',
    },
  });

  console.log(`Created project with id: ${project.id}`);

  // Create some tickets
  await prisma.ticket.createMany({
    data: [
      {
        title: 'Setup Database',
        status: 'DONE',
        priority: 'HIGH',
        projectId: project.id,
        source: 'MANUAL',
      },
      {
        title: 'Implement AI Agent',
        status: 'TODO',
        priority: 'HIGH',
        projectId: project.id,
        source: 'MANUAL',
      },
    ],
  });

  console.log('Seeded tickets');
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
