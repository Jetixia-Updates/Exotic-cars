import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxy(params, "GET", _req);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxy(params, "POST", req);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxy(params, "PATCH", req);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxy(params, "PUT", req);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxy(params, "DELETE", _req);
}

async function proxy(
  params: Promise<{ path: string[] }>,
  method: string,
  req: NextRequest
) {
  const { path } = await params;
  const pathStr = path?.length ? path.join("/") : "";
  const url = `${API_BASE}/api/${pathStr}${req.nextUrl.search}`;
  const headers: HeadersInit = {};
  req.headers.forEach((value, key) => {
    if (
      key.toLowerCase() === "authorization" ||
      key.toLowerCase() === "content-type"
    ) {
      headers[key] = value;
    }
  });
  try {
    const body = method !== "GET" && method !== "DELETE" ? await req.text() : undefined;
  if (body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }
  const res = await fetch(url, {
      method,
      headers,
      body,
    });
    const data = await res.text();
    try {
      const json = JSON.parse(data);
      return NextResponse.json(json, { status: res.status });
    } catch {
      return new NextResponse(data, { status: res.status });
    }
  } catch (err) {
    console.error("[API proxy]", url, err);
    return NextResponse.json(
      {
        error: "API server unavailable",
        message: "شغّل سيرفر Exotic Cars: pnpm dev (السيرفر يعمل على البورت 3002)",
      },
      { status: 503 }
    );
  }
}
