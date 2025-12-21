import request from "supertest";
import { app } from "../../../app";
import { prisma } from "../../../db/client";

const createProject = async () => {
  return prisma.project.create({
    data: {
      name: "Test Project",
      key: `T${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      description: "Project for ticket tests",
    },
  });
};

describe("Tickets API", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("GET /tickets", () => {
    beforeEach(async () => {
      await prisma.ticket.deleteMany();
      await prisma.project.deleteMany();
      const project = await createProject();
      await prisma.ticket.createMany({
        data: [
          {
            title: "First ticket",
            projectId: project.id,
            priority: "HIGH",
            status: "TODO",
          },
          {
            title: "Second ticket",
            projectId: project.id,
            priority: "MEDIUM",
            status: "IN_PROGRESS",
          },
        ],
      });
    });

    it("should list tickets with pagination envelope", async () => {
      const response = await request(app).get("/tickets");

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty("items");
      expect(response.body.data).toHaveProperty("total", 2);
      expect(response.body.data.items.length).toBe(2);
      expect(response.body.data.items[0]).toHaveProperty("projectId");
      expect(response.body.data).toMatchObject({ page: 1, pageSize: 20 });
    });

    it("should filter by status", async () => {
      const response = await request(app)
        .get("/tickets")
        .query({ status: "TODO" });

      expect(response.status).toBe(200);
      expect(response.body.data.total).toBe(1);
      expect(response.body.data.items[0].status).toBe("TODO");
    });

    it("should return empty array when none exist", async () => {
      await prisma.ticket.deleteMany();
      const response = await request(app).get("/tickets");

      expect(response.status).toBe(200);
      expect(response.body.data.total).toBe(0);
      expect(response.body.data.items).toHaveLength(0);
    });
  });

  describe("POST /tickets", () => {
    let projectId: string;

    beforeEach(async () => {
      await prisma.ticket.deleteMany();
      await prisma.project.deleteMany();
      const project = await createProject();
      projectId = project.id;
    });

    it("should create a ticket with valid data", async () => {
      const payload = {
        title: "Create ticket",
        description: "A new ticket",
        status: "IN_PROGRESS",
        priority: "CRITICAL",
        projectId,
      };

      const response = await request(app).post("/tickets").send(payload);

      expect(response.status).toBe(201);
      expect(response.body.data.title).toBe(payload.title);
      expect(response.body.data.projectId).toBe(projectId);
      expect(response.body.data.status).toBe(payload.status);
      expect(response.body.data.priority).toBe(payload.priority);
    });

    it("should return 400 for invalid data", async () => {
      const response = await request(app)
        .post("/tickets")
        .send({ description: "missing title", projectId });

      expect(response.status).toBe(400);
    });

    it("should return 404 for non-existent project", async () => {
      const response = await request(app).post("/tickets").send({
        title: "No project",
        projectId: "00000000-0000-0000-0000-000000000000",
      });

      expect(response.status).toBe(404);
    });
  });

  describe("GET /tickets/:id", () => {
    let ticketId: string;

    beforeAll(async () => {
      await prisma.ticket.deleteMany();
      await prisma.project.deleteMany();
      const project = await createProject();
      const ticket = await prisma.ticket.create({
        data: {
          title: "Single ticket",
          projectId: project.id,
        },
      });
      ticketId = ticket.id;
    });

    it("should get ticket by id", async () => {
      const response = await request(app).get(`/tickets/${ticketId}`);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(ticketId);
    });

    it("should return 404 for unknown id", async () => {
      const response = await request(app).get(
        "/tickets/00000000-0000-0000-0000-000000000000"
      );

      expect(response.status).toBe(404);
    });

    it("should return 400 for invalid uuid", async () => {
      const response = await request(app).get("/tickets/not-a-uuid");

      expect(response.status).toBe(400);
    });
  });

  describe("PUT /tickets/:id", () => {
    let ticketId: string;

    beforeEach(async () => {
      await prisma.ticket.deleteMany();
      await prisma.project.deleteMany();
      const project = await createProject();
      const ticket = await prisma.ticket.create({
        data: {
          title: "Updatable ticket",
          projectId: project.id,
        },
      });
      ticketId = ticket.id;
    });

    it("should update a ticket", async () => {
      const response = await request(app).put(`/tickets/${ticketId}`).send({
        title: "Updated title",
        status: "DONE",
      });

      expect(response.status).toBe(200);
      expect(response.body.data.title).toBe("Updated title");
      expect(response.body.data.status).toBe("DONE");
    });

    it("should return 404 for non-existent ticket", async () => {
      const response = await request(app).put(
        "/tickets/00000000-0000-0000-0000-000000000000"
      );

      expect(response.status).toBe(404);
    });
  });

  describe("DELETE /tickets/:id", () => {
    let ticketId: string;

    beforeEach(async () => {
      await prisma.ticket.deleteMany();
      await prisma.project.deleteMany();
      const project = await createProject();
      const ticket = await prisma.ticket.create({
        data: {
          title: "Deletable ticket",
          projectId: project.id,
        },
      });
      ticketId = ticket.id;
    });

    it("should delete a ticket", async () => {
      const response = await request(app).delete(`/tickets/${ticketId}`);

      expect(response.status).toBe(204);

      const getResponse = await request(app).get(`/tickets/${ticketId}`);
      expect(getResponse.status).toBe(404);
    });

    it("should return 404 for non-existent id", async () => {
      const response = await request(app).delete(
        "/tickets/00000000-0000-0000-0000-000000000000"
      );

      expect(response.status).toBe(404);
    });
  });

  describe("POST /tickets/:id/move", () => {
    let projectId: string;
    let todoIds: string[];

    beforeEach(async () => {
      await prisma.ticket.deleteMany();
      await prisma.project.deleteMany();
      const project = await createProject();
      projectId = project.id;

      const created = await prisma.ticket.createMany({
        data: [
          { title: "A", projectId, status: "TODO", position: 0 },
          { title: "B", projectId, status: "TODO", position: 1 },
          { title: "C", projectId, status: "TODO", position: 2 },
        ],
      });

      const all = await prisma.ticket.findMany({
        where: { projectId },
        orderBy: { createdAt: "asc" },
      });
      todoIds = all.map((t) => t.id);
      expect(created.count).toBe(3);
    });

    it("reorders within a column", async () => {
      const targetId = todoIds[2];

      const response = await request(app)
        .post(`/tickets/${targetId}/move`)
        .send({ status: "TODO", position: 0 });

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe("TODO");
      expect(response.body.data.position).toBe(0);

      const after = await request(app)
        .get("/tickets")
        .query({ status: "TODO", sortBy: "position", sortOrder: "asc" });

      expect(after.status).toBe(200);
      const ids = after.body.data.items.map((t: { id: string }) => t.id);
      const positions = after.body.data.items.map(
        (t: { position: number }) => t.position
      );
      expect(ids).toEqual([targetId, todoIds[0], todoIds[1]]);
      expect(positions).toEqual([0, 1, 2]);
    });

    it("moves across columns and compacts positions", async () => {
      const moveId = todoIds[0];

      const response = await request(app)
        .post(`/tickets/${moveId}/move`)
        .send({ status: "IN_PROGRESS", position: 0 });

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe("IN_PROGRESS");
      expect(response.body.data.position).toBe(0);

      const todo = await request(app)
        .get("/tickets")
        .query({ status: "TODO", sortBy: "position", sortOrder: "asc" });
      const inProgress = await request(app)
        .get("/tickets")
        .query({ status: "IN_PROGRESS", sortBy: "position", sortOrder: "asc" });

      expect(
        todo.body.data.items.map((t: { position: number }) => t.position)
      ).toEqual([0, 1]);
      expect(
        inProgress.body.data.items.map((t: { id: string }) => t.id)
      ).toEqual([moveId]);
      expect(inProgress.body.data.items[0].position).toBe(0);
    });

    it("returns 404 for unknown id", async () => {
      const response = await request(app)
        .post("/tickets/00000000-0000-0000-0000-000000000000/move")
        .send({ status: "TODO", position: 0 });

      expect(response.status).toBe(404);
    });
  });
});
