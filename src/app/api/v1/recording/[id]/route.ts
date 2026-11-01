import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Proxy route for OmniDimension call recordings.
 * Allows playing and streaming call recordings in-browser without CORS restrictions,
 * network protocol errors, or localhost resolution failures.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token") || "";

    const targetUrl = `https://omnidim.io/api/v1/recording/${id}${token ? `?token=${token}` : ""}`;

    const headers: Record<string, string> = {};
    if (process.env.OMNIDIM_API_KEY) {
      headers["Authorization"] = `Bearer ${process.env.OMNIDIM_API_KEY}`;
    }

    const res = await fetch(targetUrl, { headers });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Recording provider returned status ${res.status}` },
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
    console.error("Error proxying recording:", err);
    return NextResponse.json(
      { error: "Failed to stream audio recording." },
      { status: 500 }
    );
  }
}
