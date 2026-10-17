import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ error: "Deprecated. Use /api/reports/[id]/review instead." }, { status: 410 });
}
