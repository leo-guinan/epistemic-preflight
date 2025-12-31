/**
 * Type definitions for demo paper data
 * These match the structure used in the live analysis flow
 */

export interface DemoClaim {
  id: string;
  text: string;
  type: "foundational" | "downstream" | "supporting";
  importance: number;
}

export interface DemoRiskSignal {
  text: string;
}

export interface DemoFullAnalysis {
  overlap?: {
    summary: string;
    details: string[];
  };
  conflict?: {
    summary: string;
    details: string[];
  };
  risks: string[]; // Exactly 3 reviewer risks
  claimClaimMatrix?: {
    claimIds: string[];
    relationships: Array<{
      claim1: string;
      claim2: string;
      relationship: "overlap" | "conflict" | "synthesis" | "independent";
      explanation: string;
    }>;
  };
}

export interface DemoSynthesisPreview {
  claimShifts: Array<{
    claimId: string;
    claimLabel: string;
    before: string;
    after: string;
  }>;
  originalAbstract: string;
  synthesisAbstract: string;
  abstractHighlights: {
    added: string[];
    softened: string[];
    scopeConditions: string[];
  };
  summary: {
    rescoped: number;
    reframed: number;
    weakened: number;
  };
}

export interface DemoPaper {
  id: string;
  title: string;
  authors: string;
  year: number;
  venue: string;
  description: string; // Why this demo is important
  paperContent?: string; // Full text (optional, for display)
  abstract: string;
  coreClaims: DemoClaim[];
  riskSignal?: string;
  fullAnalysis: DemoFullAnalysis;
  synthesisPreview?: DemoSynthesisPreview;
  // Demo-specific metadata
  demoType: "foundational" | "conflict" | "governance";
  keyInsights: string[]; // What this demo reveals
  featuredMoment?: {
    title: string;
    description: string;
    type: "claim-extraction" | "adversarial" | "synthesis" | "boundary";
  };
}

