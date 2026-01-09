/**
 * Utility functions for loading venue specifications
 */
import fs from "fs";
import path from "path";
import type { VenueSpec } from "./venue-spec-types";

const VENUES_DIR = path.join(process.cwd(), "data", "venues");

export function loadVenueSpec(venueId: string): VenueSpec | null {
  try {
    const filePath = path.join(VENUES_DIR, `${venueId}.json`);
    const fileContents = fs.readFileSync(filePath, "utf8");
    return JSON.parse(fileContents) as VenueSpec;
  } catch (error) {
    console.error(`Failed to load venue spec for ${venueId}:`, error);
    return null;
  }
}

export function listAvailableVenues(): Array<{ id: string; name: string; fieldFamily: string }> {
  try {
    const files = fs.readdirSync(VENUES_DIR);
    const venues = files
      .filter((file) => file.endsWith(".json"))
      .map((file) => {
        const venueId = file.replace(".json", "");
        const spec = loadVenueSpec(venueId);
        if (spec) {
          return {
            id: spec.id,
            name: spec.name,
            fieldFamily: spec.fieldFamily,
          };
        }
        return null;
      })
      .filter((v): v is { id: string; name: string; fieldFamily: string } => v !== null);
    return venues;
  } catch (error) {
    console.error("Failed to list venues:", error);
    return [];
  }
}

