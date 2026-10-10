import { NextResponse } from "next/server";
import { getSession, toClientUser } from "@/lib/server/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  return NextResponse.json(
    { user: toClientUser(session) },
    { headers: { "Cache-Control": "private, no-store" } }
  );
}
