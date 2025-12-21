import { prisma } from "../../db/client";
import { Prisma, type Ticket } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

import type {
  CreateTicketInput,
  TicketFilterInput,
  UpdateTicketInput,
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

  const safeSortBy = sortBy ?? "createdAt";
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

  const [items, total] = await Promise.all([
    prisma.ticket.findMany({
      where,
      orderBy: { [safeSortBy]: safeSortOrder },
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
    return await prisma.ticket.create({
      data,
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
