'use client';

import { trackEvent } from 'fathom-client';

/**
 * Track custom events in Fathom Analytics
 * 
 * Events are automatically created in your Fathom dashboard when first tracked.
 * Event names should be readable and recognizable (e.g., "paper uploaded" not "PAPER_UPLOADED").
 * 
 * @param eventName - Human-readable event name (e.g., "paper uploaded")
 * @param value - Optional value in cents (default: 0)
 */
export const trackFathomEvent = (eventName: string, value: number = 0) => {
  try {
    if (value > 0) {
      trackEvent(eventName, { _value: value });
    } else {
      trackEvent(eventName);
    }
  } catch (error) {
    // Silently fail if Fathom isn't loaded yet
    console.debug('[Fathom] Event tracking failed:', error);
  }
};

// Pre-defined event tracking functions for common actions
export const fathomEvents = {
  // Claim narrowing events
  claimNarrowingApplied: () => trackFathomEvent('claim narrowing applied'),
  narrowingImpactViewed: () => trackFathomEvent('narrowing impact viewed'),
  narrowingExported: () => trackFathomEvent('narrowing exported'),
  // Intent declaration
  intentDeclared: (intent: string) => {
    trackFathomEvent('intent declared');
  },

  // Paper upload
  paperUploaded: (method: 'file' | 'paste') => {
    trackFathomEvent('paper uploaded');
  },

  // Analysis completed
  analysisCompleted: (claimsCount: number) => {
    // Value is the number of claims extracted
    trackFathomEvent('analysis completed', claimsCount);
  },

  // Full analysis completed
  fullAnalysisCompleted: () => {
    trackFathomEvent('full analysis completed');
  },

  // Agency choice selected
  agencyChoiceSelected: (choiceId: string) => {
    trackFathomEvent('agency choice selected');
  },

  // Synthesis applied
  synthesisApplied: () => {
    trackFathomEvent('synthesis applied');
  },

  // Synthesis committed
  synthesisCommitted: () => {
    trackFathomEvent('synthesis committed');
  },

  // Demo events
  demoViewed: (demoId: string) => {
    trackFathomEvent(`demo viewed: ${demoId}`);
  },
  demoCardClicked: (demoId: string) => {
    trackFathomEvent(`demo card clicked: ${demoId}`);
  },
  signupFromDemo: (demoId: string) => {
    trackFathomEvent(`signup from demo: ${demoId}`);
  },
  signup: (source?: string) => {
    if (source) {
      trackFathomEvent(`signup: ${source}`);
    } else {
      trackFathomEvent('signup');
    }
  },
};

