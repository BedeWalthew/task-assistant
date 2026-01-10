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

  describe("PATCH /tickets/:id/reorder", () => {
    let projectId: string;
    let ticketId: string;

    beforeEach(async () => {
      await prisma.ticket.deleteMany();
      await prisma.project.deleteMany();
      const project = await createProject();
      projectId = project.id;

      const ticket = await prisma.ticket.create({
        data: {
          title: "Reorderable ticket",
          projectId: project.id,
          status: "TODO",
          position: 1000,
        },
      });
      ticketId = ticket.id;
    });

    it("should reorder a ticket to a new position", async () => {
      const response = await request(app)
        .patch(`/tickets/${ticketId}/reorder`)
        .send({ position: 2000 });

      expect(response.status).toBe(200);
      expect(response.body.data.position).toBe(2000);
    });

    it("should change status and position when moving across columns", async () => {
      const response = await request(app)
        .patch(`/tickets/${ticketId}/reorder`)
        .send({ status: "IN_PROGRESS", position: 500 });

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe("IN_PROGRESS");
      expect(response.body.data.position).toBe(500);
    });

    it("should handle position conflicts by adjusting position slightly", async () => {
      // Create another ticket at position 1500
      await prisma.ticket.create({
        data: {
          title: "Blocking ticket",
          projectId,
          status: "TODO",
          position: 1500,
        },
      });

      const response = await request(app)
        .patch(`/tickets/${ticketId}/reorder`)
        .send({ position: 1500 });

      expect(response.status).toBe(200);
      // Should adjust position slightly to avoid conflict
      expect(response.body.data.position).toBeCloseTo(1500.001, 3);
    });

    it("should keep the same status when only position changes", async () => {
      const response = await request(app)
        .patch(`/tickets/${ticketId}/reorder`)
        .send({ position: 3000 });

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe("TODO");
      expect(response.body.data.position).toBe(3000);
    });

    it("should return 404 for non-existent ticket", async () => {
      const response = await request(app)
        .patch("/tickets/00000000-0000-0000-0000-000000000000/reorder")
        .send({ position: 1000 });

      expect(response.status).toBe(404);
    });

    it("should return 400 for invalid uuid", async () => {
      const response = await request(app)
        .patch("/tickets/not-a-uuid/reorder")
        .send({ position: 1000 });

      expect(response.status).toBe(400);
    });

    it("should return 400 for missing position", async () => {
      const response = await request(app)
        .patch(`/tickets/${ticketId}/reorder`)
        .send({ status: "DONE" });

      expect(response.status).toBe(400);
    });

    it("should return 400 for invalid status", async () => {
      const response = await request(app)
        .patch(`/tickets/${ticketId}/reorder`)
        .send({ status: "INVALID_STATUS", position: 1000 });

      expect(response.status).toBe(400);
    });

    it("should return 400 for non-positive position", async () => {
      const response = await request(app)
        .patch(`/tickets/${ticketId}/reorder`)
        .send({ position: 0 });

      expect(response.status).toBe(400);
    });
  });
});
