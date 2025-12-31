// Utility functions to save and restore preflight state from localStorage
// This preserves user progress when they sign in

const PREFLIGHT_STATE_KEY = "epistemic_preflight_state";

export interface SavedPreflightState {
  state: string;
  data: {
    intent?: string;
    targetVenue?: string;
    paperContent?: string;
    fileName?: string;
    coreClaims?: Array<{
      id: string;
      text: string;
      type: "foundational" | "downstream" | "supporting";
      importance: number;
    }>;
    riskSignal?: string;
    comparators?: Array<string>; // Store as strings (file names or text)
    fullAnalysis?: any;
    commitId?: string;
  };
}

export function savePreflightState(state: string, data: any): void {
  try {
    // Convert File objects to file names for storage
    const savedData = {
      ...data,
      paperFile: data.paperFile ? { name: data.paperFile.name, size: data.paperFile.size } : undefined,
      comparators: data.comparators?.map((c: any) => 
        typeof c === "string" ? c : (c instanceof File ? c.name : String(c))
      ),
    };

    const stateToSave: SavedPreflightState = {
      state,
      data: savedData,
    };

    localStorage.setItem(PREFLIGHT_STATE_KEY, JSON.stringify(stateToSave));
    console.log("[PreflightState] State saved to localStorage");
  } catch (error) {
    console.error("[PreflightState] Error saving state:", error);
  }
}

export function restorePreflightState(): SavedPreflightState | null {
  try {
    const saved = localStorage.getItem(PREFLIGHT_STATE_KEY);
    if (!saved) return null;

    const state = JSON.parse(saved) as SavedPreflightState;
    console.log("[PreflightState] State restored from localStorage");
    return state;
  } catch (error) {
    console.error("[PreflightState] Error restoring state:", error);
    return null;
  }
}

export function clearPreflightState(): void {
  try {
    localStorage.removeItem(PREFLIGHT_STATE_KEY);
    console.log("[PreflightState] State cleared from localStorage");
  } catch (error) {
    console.error("[PreflightState] Error clearing state:", error);
  }
}

