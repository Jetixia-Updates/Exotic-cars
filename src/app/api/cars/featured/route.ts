import { NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

export async function GET() {
  try {
    const res = await fetch(`${API_BASE}/api/cars/featured`);
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("[API] /api/cars/featured", err);
    return NextResponse.json(
      { error: "API server unavailable", message: "Run: pnpm dev (or pnpm dev:api on port 3002)" },
      { status: 503 }
    );
  }
}
