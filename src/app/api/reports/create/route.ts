import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as any).role;
    if (role !== "COORDINATOR" && role !== "LEADER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;

    // Generate unique report ID (MR-YYYY-XXXXX) safely
    const year = new Date().getFullYear();
    let reportId = "";
    let attempts = 0;
    while (attempts < 5) {
      const count = await prisma.meetingReport.count();
      const candidateId = attempts === 0
        ? `MR-${year}-${String(count + 1).padStart(5, "0")}`
        : `MR-${year}-${String(count + 1).padStart(5, "0")}-${Math.floor(100 + Math.random() * 900)}`;

      const exists = await prisma.meetingReport.findUnique({ where: { reportId: candidateId } });
      if (!exists) {
        reportId = candidateId;
        break;
      }
      attempts++;
    }

    if (!reportId) {
      reportId = `MR-${year}-${Date.now().toString().slice(-6)}`;
    }

    const report = await prisma.$transaction(async (tx) => {
      const createdReport = await tx.meetingReport.create({
        data: {
          reportId,
          leaderId: user.id,
          status: "DRAFT",
          version: 1,
        },
      });

      await tx.reportAuditLog.create({
        data: {
          meetingReportId: createdReport.id,
          actorId: user.id,
          action: "DRAFT_CREATED",
          details: `Draft created for Meeting Report ${reportId}`,
        },
      });

      return createdReport;
    }, { maxWait: 20000, timeout: 30000 });

    return NextResponse.json({
      message: "Draft Report Created Successfully",
      id: report.id,
      reportId: report.reportId,
    });
  } catch (err) {
    console.error("POST /api/reports/create error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
