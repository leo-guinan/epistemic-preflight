import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";

// GET /api/papers/[id] - Get a specific paper
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabaseUser = await getUser();
    const { id } = await params;

    if (!supabaseUser?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: supabaseUser.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const paper = await prisma.paper.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!paper) {
      return NextResponse.json({ error: "Paper not found" }, { status: 404 });
    }

    // Parse JSON fields
    const parsedPaper = {
      ...paper,
      coreClaims: JSON.parse(paper.coreClaims),
      comparators: paper.comparators ? JSON.parse(paper.comparators) : null,
      fullAnalysis: paper.fullAnalysis ? JSON.parse(paper.fullAnalysis) : null,
    };

    return NextResponse.json({ paper: parsedPaper });
  } catch (error) {
    console.error("[API] Error fetching paper:", error);
    return NextResponse.json(
      { error: "Failed to fetch paper" },
      { status: 500 }
    );
  }
}

