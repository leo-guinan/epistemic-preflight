import { NextResponse } from "next/server";
import { loadVenueSpec } from "@/lib/venue-loader";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const spec = loadVenueSpec(id);
    
    if (!spec) {
      return NextResponse.json(
        { error: "Venue not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ venue: spec });
  } catch (error) {
    console.error("[Venue API] Error loading venue:", error);
    return NextResponse.json(
      { error: "Failed to load venue" },
      { status: 500 }
    );
  }
}

