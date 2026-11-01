import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { resolveRecordingUrl } from "@/lib/omnidimension";

export const dynamic = "force-dynamic";

/**
 * Streams call audio recording by CallAttempt ID or Provider Call ID.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Search by CallAttempt.id or providerCallId
    const attempt = await (prisma as any).callAttempt.findFirst({
      where: {
        OR: [
          { id },
          { providerCallId: id },
        ],
      },
      select: {
        id: true,
        providerCallId: true,
        recordingUrl: true,
        status: true,
      },
    });

    let targetUrl: string | null = null;
    if (attempt?.recordingUrl) {
      targetUrl = resolveRecordingUrl(attempt.recordingUrl);
    } else if (attempt?.providerCallId) {
      targetUrl = `https://omnidim.io/api/v1/recording/${attempt.providerCallId}`;
    } else {
      // If id is directly a provider call id
      targetUrl = `https://omnidim.io/api/v1/recording/${id}`;
    }

    if (!targetUrl) {
      return NextResponse.json(
        { error: "Recording URL not found for this call." },
        { status: 404 }
      );
    }

    const fetchHeaders: Record<string, string> = {};
    if (process.env.OMNIDIM_API_KEY) {
      fetchHeaders["Authorization"] = `Bearer ${process.env.OMNIDIM_API_KEY}`;
    }

    const res = await fetch(targetUrl, { headers: fetchHeaders });
    if (!res.ok) {
      return NextResponse.json(
        { error: `Provider returned status ${res.status}` },
        { status: res.status }
      );
    }

    const contentType = res.headers.get("content-type") || "audio/mpeg";
    const contentLength = res.headers.get("content-length");
    const arrayBuffer = await res.arrayBuffer();

    const responseHeaders: Record<string, string> = {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400, immutable",
      "Accept-Ranges": "bytes",
    };

    if (contentLength) {
      responseHeaders["Content-Length"] = contentLength;
    }

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: responseHeaders,
    });
  } catch (err: any) {
    console.error("Error streaming call recording:", err);
    return NextResponse.json(
      { error: "Failed to stream audio recording." },
      { status: 500 }
    );
  }
}
