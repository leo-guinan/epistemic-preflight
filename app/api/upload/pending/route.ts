import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";

/**
 * Get pending uploads for the current user's session
 * Called after sign-in to find and process anonymous uploads
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessionId = request.nextUrl.searchParams.get("sessionId");
    
    if (!sessionId) {
      return NextResponse.json({ error: "Session ID required" }, { status: 400 });
    }

    // Find pending jobs for this session
    const pendingJobs = await prisma.processingJob.findMany({
      where: {
        sessionId: sessionId,
        userId: null, // Anonymous jobs
        status: {
          in: ["uploaded", "uploading"], // Jobs that are uploaded but not processed
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      jobs: pendingJobs.map((job) => ({
        jobId: job.id,
        fileName: job.fileName,
        status: job.status,
        createdAt: job.createdAt,
      })),
    });
  } catch (error) {
    console.error("[Pending Uploads] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch pending uploads" },
      { status: 500 }
    );
  }
}

