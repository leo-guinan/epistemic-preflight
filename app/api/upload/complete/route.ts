import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";

/**
 * Mark upload as complete and trigger processing.
 * Called by the client after successfully uploading directly to Supabase Storage.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobId } = await request.json();
    
    if (!jobId) {
      return NextResponse.json({ error: "Job ID required" }, { status: 400 });
    }

    // Verify job belongs to user
    const job = await prisma.processingJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (job.userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Update status to "uploaded" and trigger processing
    await prisma.processingJob.update({
      where: { id: jobId },
      data: { status: "uploaded" },
    });

    // Trigger processing asynchronously
    const bucketName = process.env.SUPABASE_STORAGE_BUCKET || "papers";
    setImmediate(() => {
      processPDFFromStorage(jobId, job.storageKey, bucketName).catch((error) => {
        console.error("[Upload Complete] Processing error:", error);
      });
    });

    return NextResponse.json({
      jobId: jobId,
      status: "uploaded",
      message: "Upload complete, processing started",
    });
  } catch (error) {
    console.error("[Upload Complete] Error:", error);
    return NextResponse.json(
      { error: "Failed to complete upload" },
      { status: 500 }
    );
  }
}

// Process PDF from Supabase Storage
async function processPDFFromStorage(
  jobId: string,
  storagePath: string,
  bucketName: string
) {
  try {
    // Update status to processing
    await prisma.processingJob.update({
      where: { id: jobId },
      data: { status: "processing" },
    });

    // Download from Supabase Storage
    const { downloadFromSupabaseStorage } = await import("@/lib/supabase-storage");
    const pdfBuffer = await downloadFromSupabaseStorage(bucketName, storagePath);

    // Process PDF
    const { processPDF } = await import("@/lib/pdf-processor");
    const processed = await processPDF(pdfBuffer);

    // Update job with result
    await prisma.processingJob.update({
      where: { id: jobId },
      data: {
        status: "completed",
        extractedText: processed.text,
      },
    });
  } catch (error: any) {
    await prisma.processingJob.update({
      where: { id: jobId },
      data: {
        status: "failed",
        error: error.message || "Processing failed",
      },
    });
  }
}

