import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { randomUUID } from "crypto";

/**
 * Initialize an upload job and return the storage path.
 * Supports both authenticated and anonymous uploads.
 * Anonymous uploads go to temp bucket and are rate-limited.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    const { fileName, fileSize, sessionId } = await request.json();
    
    if (!fileName) {
      return NextResponse.json({ error: "File name required" }, { status: 400 });
    }

    // Validate file type
    if (!fileName.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ error: "Only PDF files are allowed" }, { status: 400 });
    }

    // Validate file size (50MB max)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (fileSize && fileSize > maxSize) {
      return NextResponse.json({ error: "File size exceeds 50MB limit" }, { status: 400 });
    }

    // Get client IP for rate limiting
    const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0] || 
                      request.headers.get("x-real-ip") || 
                      "unknown";

    let dbUser = null;
    let bucketName = "temp"; // Default to temp for anonymous
    let userId: string | null = null;
    let finalSessionId = sessionId;

    if (user?.email) {
      // Authenticated user - use permanent bucket
      dbUser = await prisma.user.findUnique({
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

      bucketName = process.env.SUPABASE_STORAGE_BUCKET || "papers";
      userId = dbUser.id;
    } else {
      // Anonymous user - check rate limit
      const rateLimit = await checkRateLimit(ipAddress);
      if (!rateLimit.allowed) {
        return NextResponse.json(
          { 
            error: "Upload rate limit exceeded. Please sign in to continue uploading, or try again later.",
            retryAfter: rateLimit.retryAfter 
          },
          { status: 429 }
        );
      }

      // Generate session ID if not provided
      if (!finalSessionId) {
        finalSessionId = randomUUID();
      }
    }

    // Generate unique key for Supabase Storage
    const fileId = randomUUID();
    const storagePath = userId 
      ? `${userId}/${fileId}/${fileName}` 
      : `temp/${finalSessionId}/${fileId}/${fileName}`;
    
    // Create processing job record
    const job = await prisma.processingJob.create({
      data: {
        id: fileId,
        userId: userId,
        sessionId: finalSessionId,
        ipAddress: ipAddress,
        fileName: fileName,
        storageKey: storagePath,
        bucket: bucketName,
        status: "uploading",
      },
    });

    return NextResponse.json({
      jobId: fileId,
      storagePath: storagePath,
      bucket: bucketName,
      sessionId: finalSessionId, // Return session ID for anonymous users
      requiresAuth: !user, // Tell client if auth is required for processing
      message: user 
        ? "Upload initialized - upload file directly to Supabase Storage"
        : "Upload initialized. Sign in to process your file.",
    });
  } catch (error) {
    console.error("[Upload Init] Error:", error);
    return NextResponse.json(
      { error: "Failed to initialize upload" },
      { status: 500 }
    );
  }
}

/**
 * Check rate limit for anonymous uploads
 * Returns: { allowed: boolean, retryAfter?: number }
 */
async function checkRateLimit(ipAddress: string): Promise<{ allowed: boolean; retryAfter?: number }> {
  const RATE_LIMIT_COUNT = 3; // 3 uploads
  const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds

  try {
    const now = new Date();
    const resetAt = new Date(now.getTime() + RATE_LIMIT_WINDOW);

    // Find or create rate limit record
    let rateLimit = await prisma.uploadRateLimit.findUnique({
      where: { ipAddress },
    });

    if (!rateLimit) {
      // First upload from this IP
      await prisma.uploadRateLimit.create({
        data: {
          ipAddress,
          count: 1,
          resetAt,
        },
      });
      return { allowed: true };
    }

    // Check if window has expired
    if (rateLimit.resetAt < now) {
      // Reset the counter
      await prisma.uploadRateLimit.update({
        where: { ipAddress },
        data: {
          count: 1,
          resetAt,
        },
      });
      return { allowed: true };
    }

    // Check if limit exceeded
    if (rateLimit.count >= RATE_LIMIT_COUNT) {
      const retryAfter = Math.ceil((rateLimit.resetAt.getTime() - now.getTime()) / 1000);
      return { allowed: false, retryAfter };
    }

    // Increment counter
    await prisma.uploadRateLimit.update({
      where: { ipAddress },
      data: {
        count: { increment: 1 },
      },
    });

    return { allowed: true };
  } catch (error) {
    console.error("[Rate Limit] Error:", error);
    // On error, allow the upload (fail open)
    return { allowed: true };
  }
}
