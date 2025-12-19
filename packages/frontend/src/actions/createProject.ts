"use server";

import { CreateProjectSchema } from "@task-assistant/shared/src/schemas/project";
import { revalidatePath } from "next/cache";

const API_URL = process.env.INTERNAL_API_URL || "http://backend:3001";

export type CreateProjectResult =
  | { success: true }
  | { success?: false; error: string };

export async function createProject(
  input: unknown
): Promise<CreateProjectResult> {
  const parsed = CreateProjectSchema.safeParse(input);
  if (!parsed.success) {
    const message =
      parsed.error.issues.map((i) => i.message).join(", ") || "Invalid input";
    return { error: message };
  }

  const payload = parsed.data;

  try {
    const response = await fetch(`${API_URL}/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      let errorMessage = "Failed to create project";
      try {
        const body = await response.json();
        if (body?.message) {
          errorMessage = body.message;
        }
      } catch {
        // ignore json parse error
      }
      return { error: errorMessage };
    }

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("createProject failed", error);
    return { error: "Unexpected error creating project" };
  }
}
