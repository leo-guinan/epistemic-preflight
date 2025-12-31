import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUser } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    const sessionId = request.nextUrl.searchParams.get("sessionId");
    
    const job = await prisma.processingJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Check authorization: either user owns it, or it's an anonymous job with matching session
    const user = await getUser();
    
    if (job.userId) {
      // Authenticated job - verify user owns it
      if (!user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      
      const dbUser = await prisma.user.findUnique({
        where: { email: user.email },
      });

      if (!dbUser || job.userId !== dbUser.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    } else {
      // Anonymous job - verify session ID matches
      if (!sessionId || job.sessionId !== sessionId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    return NextResponse.json({
      status: job.status,
      extractedText: job.extractedText,
      error: job.error,
    });
  } catch (error) {
    console.error("[Upload Status] Error:", error);
    return NextResponse.json(
      { error: "Failed to get status" },
      { status: 500 }
    );
  }
}

