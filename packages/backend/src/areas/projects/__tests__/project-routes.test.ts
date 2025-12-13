import request from 'supertest';
import { app } from '../../../app';
import { prisma } from '../../../db/client';

describe('GET /projects', () => {
  beforeAll(async () => {
    // Clean up and seed test data
    await prisma.ticket.deleteMany();
    await prisma.project.deleteMany();
    
    await prisma.project.create({
      data: {
        name: 'Test Project',
        key: 'TEST',
        description: 'A test project',
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should return all projects', async () => {
    const response = await request(app).get('/projects');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBeGreaterThan(0);
  });

  it('should return projects with correct structure', async () => {
    const response = await request(app).get('/projects');

    expect(response.status).toBe(200);
    const project = response.body.data[0];
    
    expect(project).toHaveProperty('id');
    expect(project).toHaveProperty('name');
    expect(project).toHaveProperty('key');
    expect(project).toHaveProperty('createdAt');
    expect(project).toHaveProperty('updatedAt');
  });

  it('should return 404 for non-existent route', async () => {
    const response = await request(app).get('/nonexistent');
    expect(response.status).toBe(404);
  });
});
