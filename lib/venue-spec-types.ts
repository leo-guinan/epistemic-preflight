/**
 * Venue specification types for reviewer agents
 * These define the norms and expectations for each publication venue
 */

export type ContributionType = 
  | "theory" 
  | "method" 
  | "system" 
  | "dataset" 
  | "empirical-study" 
  | "position";

export type EvidenceType = 
  | "experiments" 
  | "user-study" 
  | "proofs" 
  | "case-studies" 
  | "simulations" 
  | "none-yet";

export type ClaimType = "diagnostic" | "prescriptive" | "both";

export type AudienceType = "technical" | "socio-technical" | "policy" | "mixed";

export type RiskTolerance = "conservative" | "moderate" | "bold";

export interface VenueSpec {
  id: string;
  name: string;
  fieldFamily: string; // "ML" | "HCI" | "Social science" | "Philosophy" | "Interdisciplinary"
  contributionNorms: {
    publishableUnits: string[]; // What counts as a publishable "unit"
    noveltyThreshold: "incremental" | "conceptual" | "both"; // What level of novelty is expected
  };
  expectedEvidence: {
    [key in ContributionType]?: EvidenceType[]; // What evidence is required for each contribution type
  };
  commonRejectionReasons: string[]; // The real landmines
  tonePreferences: {
    formality: "formal" | "punchy" | "balanced";
    speculativeTolerance: "low" | "moderate" | "high"; // How much speculation is allowed
  };
  relatedWorkExpectations: {
    requiredCanon: string[]; // What must be cited
    citationDepth: "light" | "moderate" | "comprehensive";
  };
  methodsCulture: "quant-heavy" | "qual-heavy" | "theory-heavy" | "mixed";
  ethicsRequirements: {
    irbRequired: boolean;
    datasetDocumentation: boolean;
    harmsAnalysis: boolean;
  };
  formatConstraints: {
    pageLimit?: number;
    structureExpectations: string[]; // Expected sections
  };
  optionalReviewers?: string[]; // e.g., "ethics", "theory", "systems"
}

export interface VenueIntake {
  contributionType: ContributionType;
  evidenceTypeAvailable: EvidenceType[];
  claimsAre: ClaimType;
  targetAudience: AudienceType;
  riskTolerance: RiskTolerance;
  whatsNew: string; // 1-2 sentences
  reviewerAttacks: string; // 1-2 sentences
}

export interface ReviewerReport {
  reviewerId: string;
  reviewerName: string;
  summaryIn3Sentences: string;
  mainContribution: string; // 1 line
  strengths: string[]; // 3 bullets
  weaknesses: string[]; // 3 bullets
  questionsForAuthors: string[]; // 5 bullets
  requiredChanges: Array<{
    priority: number; // 1-5, 1 = highest
    description: string;
    claimId?: string; // If tied to a specific claim
    sectionId?: string; // If tied to a specific section
  }>;
  scoreBreakdown: {
    novelty: number; // 1-10
    validity: number; // 1-10
    clarity: number; // 1-10
    impact: number; // 1-10
    fit: number; // 1-10 (venue fit)
  };
  recommendation: "accept" | "weak-accept" | "weak-reject" | "reject";
  confidence: number; // 0-1
  claimActions: Array<{
    claimId?: string;
    action: "narrow" | "scope" | "add-boundary" | "needs-empirical-test" | "missing-prior-art" | "unclear-operationalization" | "conflates-levels";
    description: string;
  }>;
}

export interface MetaReviewerReport {
  consensus: {
    agreement: string; // What all reviewers agree on
    disagreement: string; // Where they diverge
  };
  top2Changes: string[]; // "If you only fix 2 things"
  finalDecisionLikelihood: {
    accept: number; // 0-1
    weakAccept: number;
    weakReject: number;
    reject: number;
  };
  suggestedResubmissionTargets?: string[]; // Alternative venues if reject
  venueFitScorecard: {
    overallFit: number; // 0-1
    reasons: string[]; // Why it belongs/doesn't belong
  };
}

export interface ReviewRun {
  id: string;
  paperId: string;
  venueId: string;
  venueIntake: VenueIntake;
  reviewerReports: ReviewerReport[];
  metaReviewerReport: MetaReviewerReport;
  decisionForecast: {
    accept: number;
    weakAccept: number;
    weakReject: number;
    reject: number;
  };
  createdAt: Date;
}

