import { Mastra } from "@mastra/core/mastra";
import { paperAnalysisAgent } from "./agents/paper-analysis-agent";

export const mastra = new Mastra({
  agents: { 
    paperAnalysisAgent 
  },
});

