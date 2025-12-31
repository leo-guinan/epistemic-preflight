import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { randomUUID } from "crypto";

/**
 * Mark upload as complete and trigger processing.
 * Called by the client after successfully uploading directly to Supabase Storage.
 * Allows anonymous processing - files stay in temp bucket until user signs in.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    const { jobId, sessionId } = await request.json();
    
    if (!jobId) {
      return NextResponse.json({ error: "Job ID required" }, { status: 400 });
    }

    // Verify job exists
    const job = await prisma.processingJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Verify session ID matches for anonymous jobs
    if (!job.userId && sessionId && job.sessionId !== sessionId) {
      return NextResponse.json({ error: "Session mismatch" }, { status: 403 });
    }

    // If authenticated and job is anonymous, link it to user account
    if (user && !job.userId) {
      // Verify session ID matches (if provided)
      if (sessionId && job.sessionId !== sessionId) {
        return NextResponse.json({ error: "Session mismatch" }, { status: 403 });
      }

      // Link anonymous job to user account
      if (!user.email) {
        return NextResponse.json(
          { error: "User email is required" },
          { status: 400 }
        );
      }

      let dbUser = await prisma.user.findUnique({
        where: { email: user.email },
      });

      if (!dbUser) {
        dbUser = await prisma.user.create({
          data: {
            id: user.id,
            email: user.email,
            name: user.user_metadata?.full_name || user.user_metadata?.name || null,
            image: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
          },
        });
      }

      // Move file from temp to permanent location
      const newStoragePath = await moveFileToPermanent(job.storageKey, dbUser.id, job.fileName);
      
      // Update job with user ID and new path
      await prisma.processingJob.update({
        where: { id: jobId },
        data: {
          userId: dbUser.id,
          storageKey: newStoragePath,
          bucket: process.env.SUPABASE_STORAGE_BUCKET || "papers",
        },
      });
    } else if (job.userId && user) {
      // Authenticated job - verify user owns it
      if (job.userId !== user.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    }
    // Anonymous jobs can proceed without auth - file stays in temp bucket

    // Get updated job (in case path changed)
    const updatedJob = await prisma.processingJob.findUnique({
      where: { id: jobId },
    });

    if (!updatedJob) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Update status to "uploaded" and trigger processing
    await prisma.processingJob.update({
      where: { id: jobId },
      data: { status: "uploaded" },
    });

    // Trigger processing asynchronously
    setImmediate(() => {
      processPDFFromStorage(jobId, updatedJob.storageKey, updatedJob.bucket).catch((error) => {
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

/**
 * Move file from temp bucket to permanent location
 */
async function moveFileToPermanent(
  tempPath: string,
  userId: string,
  fileName: string
): Promise<string> {
  try {
    const { downloadFromSupabaseStorage, uploadToSupabaseStorage } = await import("@/lib/supabase-storage");
    
    // Download from temp
    const fileBuffer = await downloadFromSupabaseStorage("temp", tempPath);
    
    // Upload to permanent location
    const permanentPath = `${userId}/${randomUUID()}/${fileName}`;
    const bucketName = process.env.SUPABASE_STORAGE_BUCKET || "papers";
    await uploadToSupabaseStorage(bucketName, permanentPath, fileBuffer, "application/pdf");
    
    // Delete from temp (optional - can be cleaned up by cron)
    try {
      const { deleteFromSupabaseStorage } = await import("@/lib/supabase-storage");
      await deleteFromSupabaseStorage("temp", tempPath);
    } catch (error) {
      console.warn("[Move File] Failed to delete temp file:", error);
      // Non-critical, continue
    }
    
    return permanentPath;
  } catch (error) {
    console.error("[Move File] Error:", error);
    throw error;
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

