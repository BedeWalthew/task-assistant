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
    expect(project).toHaveProperty('name', 'Test Project');
    expect(project).toHaveProperty('key', 'TEST');
    expect(project).toHaveProperty('description', 'A test project');
    expect(project).toHaveProperty('createdAt');
    expect(project).toHaveProperty('updatedAt');
  });

  it('should return an empty array if no projects exist', async () => {
    await prisma.project.deleteMany();
    const response = await request(app).get('/projects');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data).toHaveLength(0);
  });

  it('should return 404 for non-existent route', async () => {
    const response = await request(app).get('/nonexistent');
    expect(response.status).toBe(404);
  });
});

describe('POST /projects', () => {
  beforeEach(async () => {
    await prisma.ticket.deleteMany();
    await prisma.project.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should create a project with valid data', async () => {
    const newProject = {
      name: 'New Project',
      key: 'NEWPROJ',
      description: 'A brand new project',
    };

    const response = await request(app)
      .post('/projects')
      .send(newProject);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data.name).toBe(newProject.name);
    expect(response.body.data.key).toBe(newProject.key);
    expect(response.body.data.description).toBe(newProject.description);
  });

  it('should return 400 for invalid data - missing name', async () => {
    const invalidProject = {
      key: 'TEST',
    };

    const response = await request(app)
      .post('/projects')
      .send(invalidProject);

    expect(response.status).toBe(400);
  });

  it('should return 400 for invalid key format', async () => {
    const invalidProject = {
      name: 'Test Project',
      key: 'a', // Too short (min 2 chars)
    };

    const response = await request(app)
      .post('/projects')
      .send(invalidProject);

    expect(response.status).toBe(400);
  });

  it('should return 409 for duplicate key', async () => {
    const project = {
      name: 'Project 1',
      key: 'DUP',
      description: 'First project',
    };

    // Create first project
    await request(app).post('/projects').send(project);

    // Try to create duplicate
    const duplicateProject = {
      name: 'Project 2',
      key: 'DUP', // Same key
      description: 'Duplicate key project',
    };

    const response = await request(app)
      .post('/projects')
      .send(duplicateProject);

    expect(response.status).toBe(409);
  });
});

describe('GET /projects/:id', () => {
  let projectId: string;

  beforeAll(async () => {
    await prisma.ticket.deleteMany();
    await prisma.project.deleteMany();

    const project = await prisma.project.create({
      data: {
        name: 'Single Project',
        key: 'SINGLE',
        description: 'For testing single get',
      },
    });
    projectId = project.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should return a single project by ID', async () => {
    const response = await request(app).get(`/projects/${projectId}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(response.body.data.id).toBe(projectId);
    expect(response.body.data.name).toBe('Single Project');
    expect(response.body.data.key).toBe('SINGLE');
  });

  it('should return 404 for non-existent ID', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const response = await request(app).get(`/projects/${fakeId}`);

    expect(response.status).toBe(404);
  });

  it('should return 400 for invalid UUID format', async () => {
    const response = await request(app).get('/projects/invalid-uuid');

    expect(response.status).toBe(400);
  });
});

describe('PUT /projects/:id', () => {
  let projectId: string;

  beforeEach(async () => {
    await prisma.ticket.deleteMany();
    await prisma.project.deleteMany();

    const project = await prisma.project.create({
      data: {
        name: 'Update Test Project',
        key: 'UPDATE',
        description: 'To be updated',
      },
    });
    projectId = project.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should update project fields', async () => {
    const updates = {
      name: 'Updated Name',
      description: 'Updated description',
    };

    const response = await request(app)
      .put(`/projects/${projectId}`)
      .send(updates);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(response.body.data.name).toBe(updates.name);
    expect(response.body.data.description).toBe(updates.description);
    expect(response.body.data.key).toBe('UPDATE'); // Key should remain unchanged
  });

  it('should return 404 for non-existent ID', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const response = await request(app)
      .put(`/projects/${fakeId}`)
      .send({ name: 'New Name' });

    expect(response.status).toBe(404);
  });

  it('should return 400 for invalid data', async () => {
    const invalidUpdate = {
      key: 'x', // Invalid key (too short)
    };

    const response = await request(app)
      .put(`/projects/${projectId}`)
      .send(invalidUpdate);

    expect(response.status).toBe(400);
  });
});

describe('DELETE /projects/:id', () => {
  let projectId: string;

  beforeEach(async () => {
    await prisma.ticket.deleteMany();
    await prisma.project.deleteMany();

    const project = await prisma.project.create({
      data: {
        name: 'Delete Test Project',
        key: 'DELETE',
        description: 'To be deleted',
      },
    });
    projectId = project.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should delete a project', async () => {
    const response = await request(app).delete(`/projects/${projectId}`);

    expect(response.status).toBe(204);
    expect(response.body).toEqual({});

    // Verify project was actually deleted
    const getResponse = await request(app).get(`/projects/${projectId}`);
    expect(getResponse.status).toBe(404);
  });

  it('should return 404 for non-existent ID', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const response = await request(app).delete(`/projects/${fakeId}`);

    expect(response.status).toBe(404);
  });
});
