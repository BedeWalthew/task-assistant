import { prisma } from "../../db/client";
import { Prisma, type Ticket } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

import type {
  CreateTicketInput,
  TicketFilterInput,
  UpdateTicketInput,
  ReorderTicketInput,
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
      orderBy: [
        { status: "asc" },
        { position: "asc" },
        { [safeSortBy]: safeSortOrder },
      ],
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

const POSITION_GAP = 1000;
const MIN_GAP = 0.001;

function calculatePosition(
  beforePosition: number | null,
  afterPosition: number | null
): number {
  if (beforePosition === null && afterPosition === null) {
    return POSITION_GAP;
  }
  if (beforePosition === null) {
    return afterPosition! / 2;
  }
  if (afterPosition === null) {
    return beforePosition + POSITION_GAP;
  }

  const newPosition = (beforePosition + afterPosition) / 2;

  if (afterPosition - beforePosition < MIN_GAP) {
    throw new AppError("Position gap too small, rebalancing required", 409);
  }

  return newPosition;
}

export const reorderTicket = async (
  ticketId: string,
  input: ReorderTicketInput
): Promise<Ticket> => {
  return prisma.$transaction(async (tx) => {
    const ticket = await tx.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new AppError("Ticket not found", 404);

    const targetStatus = input.status ?? ticket.status;
    
    // If position not provided, calculate position at top of column
    let targetPosition = input.position;
    if (targetPosition === undefined) {
      // Find the lowest position in the target column and place before it
      const topTicket = await tx.ticket.findFirst({
        where: {
          projectId: ticket.projectId,
          status: targetStatus,
          id: { not: ticketId },
        },
        orderBy: { position: 'asc' },
        select: { position: true },
      });
      
      if (topTicket) {
        // Place before the first ticket (half its position)
        targetPosition = topTicket.position / 2;
      } else {
        // Empty column, use default gap
        targetPosition = POSITION_GAP;
      }
    }

    const conflicting = await tx.ticket.findFirst({
      where: {
        projectId: ticket.projectId,
        status: targetStatus,
        position: targetPosition,
        id: { not: ticketId },
      },
    });

    let finalPosition = targetPosition;
    if (conflicting) {
      finalPosition = targetPosition + 0.001;
    }

    return tx.ticket.update({
      where: { id: ticketId },
      data: {
        status: targetStatus,
        position: finalPosition,
      },
    });
  });
};

export const rebalanceColumn = async (
  projectId: string,
  status: string
): Promise<void> => {
  await prisma.$transaction(async (tx) => {
    const tickets = await tx.ticket.findMany({
      where: { projectId, status },
      orderBy: { position: "asc" },
      select: { id: true },
    });

    const updates = tickets.map((ticket, index) =>
      tx.ticket.update({
        where: { id: ticket.id },
        data: { position: (index + 1) * POSITION_GAP },
      })
    );

    await Promise.all(updates);
  });
};
