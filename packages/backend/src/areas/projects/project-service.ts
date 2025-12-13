import { prisma } from '../../db/client';

export class ProjectService {
  static async getAll() {
    return prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }
}
