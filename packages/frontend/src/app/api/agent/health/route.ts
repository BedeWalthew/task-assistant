import { NextResponse } from "next/server";

const AGENT_URL = process.env.INTERNAL_AGENT_URL || "http://agent:8000";

export async function GET() {
  try {
    const response = await fetch(`${AGENT_URL}/health`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json({ status: "unhealthy" }, { status: 503 });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Agent health check failed:", error);
    return NextResponse.json({ status: "unavailable" }, { status: 503 });
  }
}
