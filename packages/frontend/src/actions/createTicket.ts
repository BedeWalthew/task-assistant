"use server";

import { CreateTicketSchema } from "@task-assistant/shared";
import { revalidatePath } from "next/cache";

const API_URL = process.env.INTERNAL_API_URL || "http://backend:3001";

export type CreateTicketResult =
  | { success: true }
  | { success?: false; error: string };

export async function createTicket(
  input: unknown
): Promise<CreateTicketResult> {
  const parsed = CreateTicketSchema.safeParse(input);
  if (!parsed.success) {
    const message =
      parsed.error.issues.map((i) => i.message).join(", ") || "Invalid input";
    return { error: message };
  }

  const payload = parsed.data;

  try {
    const response = await fetch(`${API_URL}/tickets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      let errorMessage = "Failed to create ticket";
      try {
        const body = await response.json();
        if (body?.message) {
          errorMessage = body.message;
        }
      } catch {
        // ignore parse errors
      }
      return { error: errorMessage };
    }

    revalidatePath("/tickets");
    return { success: true };
  } catch (error) {
    console.error("createTicket failed", error);
    return { error: "Unexpected error creating ticket" };
  }
}
