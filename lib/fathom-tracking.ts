'use client';

import { trackEvent } from 'fathom-client';

/**
 * Track custom events in Fathom Analytics
 * 
 * Event names should match goals set up in your Fathom dashboard.
 * You'll need to create these goals in Fathom and use the goal IDs here.
 */

export const trackFathomEvent = (goalId: string, value: number = 0) => {
  try {
    trackEvent(goalId, value);
  } catch (error) {
    // Silently fail if Fathom isn't loaded yet
    console.debug('[Fathom] Event tracking failed:', error);
  }
};

// Pre-defined event tracking functions for common actions
export const fathomEvents = {
  // Intent declaration
  intentDeclared: (intent: string) => {
    trackFathomEvent('INTENT_DECLARED', 0);
  },

  // Paper upload
  paperUploaded: (method: 'file' | 'paste') => {
    trackFathomEvent('PAPER_UPLOADED', 0);
  },

  // Analysis completed
  analysisCompleted: (claimsCount: number) => {
    trackFathomEvent('ANALYSIS_COMPLETED', claimsCount);
  },

  // Full analysis completed
  fullAnalysisCompleted: () => {
    trackFathomEvent('FULL_ANALYSIS_COMPLETED', 0);
  },

  // Agency choice selected
  agencyChoiceSelected: (choiceId: string) => {
    trackFathomEvent('AGENCY_CHOICE_SELECTED', 0);
  },

  // Synthesis applied
  synthesisApplied: () => {
    trackFathomEvent('SYNTHESIS_APPLIED', 0);
  },

  // Synthesis committed
  synthesisCommitted: () => {
    trackFathomEvent('SYNTHESIS_COMMITTED', 0);
  },
};

