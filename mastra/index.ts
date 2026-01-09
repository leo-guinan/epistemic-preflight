import { Mastra } from "@mastra/core/mastra";
import { paperAnalysisAgent } from "./agents/paper-analysis-agent";
import { reviewer1Agent, reviewer2Agent, reviewer3Agent, metaReviewerAgent } from "./agents/reviewer-agents";

export const mastra = new Mastra({
  agents: { 
    paperAnalysisAgent,
    reviewer1Agent,
    reviewer2Agent,
    reviewer3Agent,
    metaReviewerAgent,
  },
});

