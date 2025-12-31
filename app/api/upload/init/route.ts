import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { randomUUID } from "crypto";

/**
 * Initialize an upload job and return the storage path.
 * The client will upload directly to Supabase Storage to bypass Vercel's 4.5MB limit.
 */
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

    const { fileName, fileSize } = await request.json();
    
    if (!fileName) {
      return NextResponse.json({ error: "File name required" }, { status: 400 });
    }

    // Generate unique key for Supabase Storage
    const fileId = randomUUID();
    const storagePath = `${dbUser.id}/${fileId}/${fileName}`;
    
    // Create processing job record (status: "uploading" - client will upload directly)
    const job = await prisma.processingJob.create({
      data: {
        id: fileId,
        userId: dbUser.id,
        fileName: fileName,
        storageKey: storagePath,
        status: "uploading", // Client will update this to "uploaded" when done
      },
    });

    const bucketName = process.env.SUPABASE_STORAGE_BUCKET || "papers";

    return NextResponse.json({
      jobId: fileId,
      storagePath: storagePath,
      bucket: bucketName,
      message: "Upload initialized - upload file directly to Supabase Storage",
    });
  } catch (error) {
    console.error("[Upload Init] Error:", error);
    return NextResponse.json(
      { error: "Failed to initialize upload" },
      { status: 500 }
    );
  }
}

