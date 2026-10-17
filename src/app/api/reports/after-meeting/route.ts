import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ error: "Deprecated. Update drafts via PUT /api/reports/[id] instead." }, { status: 410 });
}
