import { prisma } from "../../db/client";
import { Prisma } from "@prisma/client";
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

  // Custom priority ordering (HIGH > MEDIUM > LOW > CRITICAL for desc, reversed for asc)
  if (safeSortBy === "priority") {
    const priorityOrder = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
    const orderIndex = (value: string) =>
      priorityOrder.findIndex((p) => p === value);
    const all = await prisma.ticket.findMany({
      where,
    });
    const sorted = all.sort((a, b) => {
      const diff = orderIndex(a.priority) - orderIndex(b.priority);
      return safeSortOrder === "asc" ? diff : -diff;
    });
    const paged = sorted.slice(skip, skip + safeLimit);
    return {
      items: paged,
      total: sorted.length,
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
