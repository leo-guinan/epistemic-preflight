import { NextRequest, NextResponse } from "next/server";
import { uploadToSupabaseStorage } from "@/lib/supabase-storage";
import { getUser } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { randomUUID } from "crypto";

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find or create user in database
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

    const formData = await request.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Generate unique key for Supabase Storage
    const fileId = randomUUID();
    const storagePath = `${dbUser.id}/${fileId}/${file.name}`;
    
    // Upload to Supabase Storage
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const bucketName = process.env.SUPABASE_STORAGE_BUCKET || "papers";
    await uploadToSupabaseStorage(bucketName, storagePath, buffer, file.type);
    
    // Create processing job record
    const job = await prisma.processingJob.create({
      data: {
        id: fileId,
        userId: dbUser.id,
        fileName: file.name,
        storageKey: storagePath,
        bucket: bucketName,
        status: "uploaded",
      },
    });

    // Trigger processing asynchronously (don't wait for it)
    setImmediate(() => {
      processPDFFromStorage(fileId, storagePath, bucketName).catch((error) => {
        console.error("[Upload] Processing error:", error);
      });
    });

    return NextResponse.json({
      jobId: fileId,
      status: "uploaded",
      message: "File uploaded, processing started",
    });
  } catch (error) {
    console.error("[Upload] Error:", error);
    return NextResponse.json(
      { error: "Upload failed" },
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

