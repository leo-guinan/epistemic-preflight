import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const createPaperSchema = z.object({
  title: z.string().optional(),
  intent: z.string().optional(),
  targetVenue: z.string().optional(),
  paperContent: z.string().min(1),
  fileName: z.string().optional(),
  coreClaims: z.array(
    z.object({
      id: z.string(),
      text: z.string(),
      type: z.enum(["foundational", "downstream", "supporting"]),
      importance: z.number(),
    })
  ),
  riskSignal: z.string().optional(),
  comparators: z.array(z.string()).optional(),
  fullAnalysis: z
    .object({
      overlap: z.string(),
      conflict: z.string(),
      novel: z.string(),
      risks: z.array(z.string()),
      reframing: z.array(z.string()),
    })
    .nullable()
    .optional(),
});

// GET /api/papers - Get all papers for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const supabaseUser = await getUser();

    if (!supabaseUser?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find or create user in our database (synced from Supabase auth)
    let user = await prisma.user.findUnique({
      where: { email: supabaseUser.email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          id: supabaseUser.id,
          email: supabaseUser.email,
          name: supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || null,
          image: supabaseUser.user_metadata?.avatar_url || supabaseUser.user_metadata?.picture || null,
        },
      });
    }

    const papers = await prisma.paper.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ papers });
  } catch (error) {
    console.error("[API] Error fetching papers:", error);
    return NextResponse.json(
      { error: "Failed to fetch papers" },
      { status: 500 }
    );
  }
}

// POST /api/papers - Create a new paper
export async function POST(request: NextRequest) {
  try {
    const supabaseUser = await getUser();

    if (!supabaseUser?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createPaperSchema.parse(body);

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email: supabaseUser.email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          id: supabaseUser.id,
          email: supabaseUser.email,
          name: supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || null,
          image: supabaseUser.user_metadata?.avatar_url || supabaseUser.user_metadata?.picture || null,
        },
      });
    }

    const paper = await prisma.paper.create({
      data: {
        userId: user.id,
        title: parsed.title || null,
        intent: parsed.intent || null,
        targetVenue: parsed.targetVenue || null,
        paperContent: parsed.paperContent,
        fileName: parsed.fileName || null,
        coreClaims: JSON.stringify(parsed.coreClaims),
        riskSignal: parsed.riskSignal || null,
        comparators: parsed.comparators
          ? JSON.stringify(parsed.comparators)
          : null,
        fullAnalysis: parsed.fullAnalysis
          ? JSON.stringify(parsed.fullAnalysis)
          : null,
      },
    });

    return NextResponse.json({ paper });
  } catch (error) {
    console.error("[API] Error creating paper:", error);
    if (error instanceof z.ZodError) {
      console.error("[API] Validation errors:", JSON.stringify(error.errors, null, 2));
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }
    // Log the full error for debugging
    if (error instanceof Error) {
      console.error("[API] Error details:", error.message, error.stack);
    }
    return NextResponse.json(
      { error: "Failed to create paper", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

