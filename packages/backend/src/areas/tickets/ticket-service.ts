import { prisma } from "../../db/client";
import { Prisma, type Ticket } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

import type {
  CreateTicketInput,
  TicketFilterInput,
  UpdateTicketInput,
  MoveTicketInput,
} from "@task-assistant/shared";
import { AppError } from "../../common/utils/AppError";

export const getAll = async (filters: TicketFilterInput) => {
  const {
    projectId,
    status,
    priority,
    assigneeId,
    search,
    sortBy,
    sortOrder,
    page,
    limit,
  } = filters;

  type SortField = TicketFilterInput["sortBy"];
  const safeSortBy: SortField = sortBy ?? "createdAt";
  const safeSortOrder = sortOrder ?? "desc";
  const safeLimit = limit ?? 20;
  const safePage = page ?? 1;

  const where: Prisma.TicketWhereInput = {
    ...(projectId && { projectId }),
    ...(status && { status }),
    ...(priority && { priority }),
    ...(assigneeId && { assigneeId }),
    ...(search && {
      OR: [
        {
          title: { contains: search, mode: "insensitive" as Prisma.QueryMode },
        },
        {
          description: {
            contains: search,
            mode: "insensitive" as Prisma.QueryMode,
          },
        },
      ],
    }),
  };

  const skip = (safePage - 1) * safeLimit;

  // Custom priority ordering pushed to the DB (LOW > MEDIUM > HIGH > CRITICAL for asc, reversed for desc)
  if (safeSortBy === "priority") {
    const whereClauses: Prisma.Sql[] = [];

    if (projectId) {
      whereClauses.push(Prisma.sql`"projectId" = ${projectId}`);
    }
    if (status) {
      whereClauses.push(Prisma.sql`"status" = ${status}`);
    }
    if (priority) {
      whereClauses.push(Prisma.sql`"priority" = ${priority}`);
    }
    if (assigneeId) {
      whereClauses.push(Prisma.sql`"assigneeId" = ${assigneeId}`);
    }
    if (search) {
      const pattern = `%${search}%`;
      whereClauses.push(
        Prisma.sql`(title ILIKE ${pattern} OR description ILIKE ${pattern})`
      );
    }

    const whereSql =
      whereClauses.length > 0
        ? Prisma.sql`WHERE ${Prisma.join(whereClauses, " AND ")}`
        : Prisma.sql``;
    const priorityCase = Prisma.sql`
      CASE priority
        WHEN 'LOW' THEN 1
        WHEN 'MEDIUM' THEN 2
        WHEN 'HIGH' THEN 3
        WHEN 'CRITICAL' THEN 4
        ELSE 5
      END
    `;
    const sortDirection =
      safeSortOrder === "asc" ? Prisma.sql`ASC` : Prisma.sql`DESC`;

    const items = await prisma.$queryRaw<Ticket[]>`
      SELECT * FROM "tickets"
      ${whereSql}
      ORDER BY ${priorityCase} ${sortDirection}, "createdAt" DESC
      OFFSET ${skip}
      LIMIT ${safeLimit}
    `;

    const [{ count }] = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::bigint as count FROM "tickets"
      ${whereSql}
    `;

    return {
      items,
      total: Number(count),
      page: safePage,
      pageSize: safeLimit,
    };
  }

  const isPositionSort = safeSortBy === "position";
  const orderBy:
    | Prisma.TicketOrderByWithRelationInput
    | Prisma.TicketOrderByWithRelationInput[] = isPositionSort
    ? ([
        { status: "asc" },
        { position: safeSortOrder as Prisma.SortOrder },
      ] as unknown as Prisma.TicketOrderByWithRelationInput[])
    : ({
        [safeSortBy]: safeSortOrder,
      } as unknown as Prisma.TicketOrderByWithRelationInput);

  const [items, total] = await Promise.all([
    prisma.ticket.findMany({
      where,
      orderBy,
      skip,
      take: safeLimit,
    }),
    prisma.ticket.count({ where }),
  ]);

  return {
    items,
    total,
    page: safePage,
    pageSize: safeLimit,
  };
};

export const getById = async (id: string) => {
  const ticket = await prisma.ticket.findUnique({
    where: { id },
  });

  if (!ticket) {
    throw new AppError("Ticket not found", 404);
  }

  return ticket;
};

export const create = async (data: CreateTicketInput) => {
  try {
    const status = data.status ?? "TODO";
    const projectId = data.projectId;
    const requestedPosition = data.position;

    const [{ max }] = await prisma.$queryRaw<{ max: number | null }[]>`
      SELECT MAX("position") as max
      FROM "tickets"
      WHERE status = ${status} AND "projectId" = ${projectId};
    `;
    const nextPosition = (max ?? -1) + 1;

    return await prisma.ticket.create({
      data: {
        ...data,
        status,
        position: requestedPosition ?? nextPosition,
      },
    });
  } catch (error: unknown) {
    if (error instanceof PrismaClientKnownRequestError) {
      if (error.code === "P2003") {
        throw new AppError("Project not found", 404);
      }
    }
    throw error;
  }
};

export const move = async (id: string, input: MoveTicketInput) => {
  const { status: targetStatus, position: targetPosition } = input;

  const ticket = await prisma.ticket.findUnique({
    where: { id },
  });
  if (!ticket) {
    throw new AppError("Ticket not found", 404);
  }

  return prisma.$transaction(async (tx) => {
    const { status: currentStatus, projectId } = ticket;

    if (currentStatus === targetStatus) {
      const currentColumn = await tx.ticket.findMany({
        where: { status: currentStatus, projectId },
        orderBy: [{ position: "asc" }, { createdAt: "asc" }],
      });

      const without = currentColumn.filter((t) => t.id !== id);
      const insertAt = Math.max(0, Math.min(targetPosition, without.length));
      const next = [...without];
      const moving = currentColumn.find((t) => t.id === id)!;
      next.splice(insertAt, 0, { ...moving, status: targetStatus });

      await Promise.all(
        next.map((t, idx) =>
          tx.ticket.update({
            where: { id: t.id },
            data: { position: idx },
          })
        )
      );

      return { ...moving, status: targetStatus, position: insertAt };
    }

    const sourceColumn = await tx.ticket.findMany({
      where: { status: currentStatus, projectId },
      orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    });
    const targetColumnList = await tx.ticket.findMany({
      where: { status: targetStatus, projectId },
      orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    });

    const sourceRemaining = sourceColumn.filter((t) => t.id !== id);
    await Promise.all(
      sourceRemaining.map((t, idx) =>
        tx.ticket.update({
          where: { id: t.id },
          data: { position: idx },
        })
      )
    );

    const insertAt = Math.max(
      0,
      Math.min(targetPosition, targetColumnList.length)
    );
    const targetNext = [...targetColumnList];
    targetNext.splice(insertAt, 0, {
      ...ticket,
      status: targetStatus,
    });

    await Promise.all(
      targetNext.map((t, idx) =>
        tx.ticket.update({
          where: { id: t.id },
          data: { status: targetStatus, position: idx },
        })
      )
    );

    return { ...ticket, status: targetStatus, position: insertAt };
  });
};

export const update = async (id: string, data: UpdateTicketInput) => {
  try {
    return await prisma.ticket.update({
      where: { id },
      data,
    });
  } catch (error: unknown) {
    if (error instanceof PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        throw new AppError("Ticket not found", 404);
      }
      if (error.code === "P2003") {
        throw new AppError("Project not found", 404);
      }
    }
    throw error;
  }
};

export const deleteTicket = async (id: string) => {
  try {
    await prisma.ticket.delete({
      where: { id },
    });
  } catch (error: unknown) {
    if (error instanceof PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        throw new AppError("Ticket not found", 404);
      }
    }
    throw error;
  }
};
