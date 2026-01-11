import { NextRequest } from "next/server";

const AGENT_URL = process.env.INTERNAL_AGENT_URL || "http://agent:8000";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${AGENT_URL}/chat/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: body.message,
        user_id: body.userId || "default_user",
        session_id: body.sessionId || null,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Agent request failed:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Agent request failed", details: errorText }),
        { status: response.status, headers: { "Content-Type": "application/json" } }
      );
    }

    // Forward SSE stream to client
    return new Response(response.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Agent chat error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to connect to agent" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
