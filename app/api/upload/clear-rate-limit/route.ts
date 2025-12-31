import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * Clear rate limit for testing (development only)
 * DELETE /api/upload/clear-rate-limit?ipAddress=xxx
 */
export async function DELETE(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Not available in production" },
      { status: 403 }
    );
  }

  try {
    const ipAddress = request.nextUrl.searchParams.get("ipAddress");
    
    if (!ipAddress) {
      return NextResponse.json(
        { error: "IP address required" },
        { status: 400 }
      );
    }

    // Delete rate limit record
    await prisma.uploadRateLimit.deleteMany({
      where: { ipAddress },
    });

    return NextResponse.json({
      message: `Rate limit cleared for IP: ${ipAddress}`,
    });
  } catch (error) {
    console.error("[Clear Rate Limit] Error:", error);
    return NextResponse.json(
      { error: "Failed to clear rate limit" },
      { status: 500 }
    );
  }
}

/**
 * Clear all rate limits for testing (development only)
 * DELETE /api/upload/clear-rate-limit?all=true
 */
export async function GET(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Not available in production" },
      { status: 403 }
    );
  }

  try {
    const clearAll = request.nextUrl.searchParams.get("all") === "true";
    
    if (clearAll) {
      // Delete all rate limit records
      const result = await prisma.uploadRateLimit.deleteMany({});
      return NextResponse.json({
        message: `Cleared all rate limits (${result.count} records)`,
      });
    }

    return NextResponse.json({
      message: "Use ?all=true to clear all rate limits, or DELETE with ?ipAddress=xxx to clear specific IP",
    });
  } catch (error) {
    console.error("[Clear Rate Limit] Error:", error);
    return NextResponse.json(
      { error: "Failed to clear rate limits" },
      { status: 500 }
    );
  }
}

