import { prisma } from "../../db/client";
import type {
  CreateProjectInput,
  UpdateProjectInput,
} from "@task-assistant/shared";
import { AppError } from "../../common/utils/AppError";

export const getAll = async () => {
  return prisma.project.findMany({
    orderBy: { createdAt: "desc" },
  });
};

export const getById = async (id: string) => {
  const project = await prisma.project.findUnique({
    where: { id },
  });

  if (!project) {
    throw new AppError("Project not found", 404);
  }

  return project;
};

export const create = async (data: CreateProjectInput) => {
  try {
    return await prisma.project.create({
      data,
    });
  } catch (error: any) {
    // Handle duplicate key error
    if (error.code === "P2002") {
      throw new AppError("Project with this key already exists", 409);
    }
    throw error;
  }
};

export const update = async (id: string, data: UpdateProjectInput) => {
  try {
    return await prisma.project.update({
      where: { id },
      data,
    });
  } catch (error: any) {
    if (error.code === "P2025") {
      throw new AppError("Project not found", 404);
    }
    if (error.code === "P2002") {
      throw new AppError("Project with this key already exists", 409);
    }
    throw error;
  }
};

export const deleteProject = async (id: string) => {
  try {
    await prisma.project.delete({
      where: { id },
    });
  } catch (error: any) {
    if (error.code === "P2025") {
      throw new AppError("Project not found", 404);
    }
    throw error;
  }
};
