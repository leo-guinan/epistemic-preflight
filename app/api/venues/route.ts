import { NextResponse } from "next/server";
import { listAvailableVenues } from "@/lib/venue-loader";

export async function GET() {
  try {
    const venues = listAvailableVenues();
    return NextResponse.json({ venues });
  } catch (error) {
    console.error("[Venues API] Error listing venues:", error);
    return NextResponse.json(
      { error: "Failed to list venues" },
      { status: 500 }
    );
  }
}

