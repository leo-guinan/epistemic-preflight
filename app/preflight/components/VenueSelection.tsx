"use client";

import { useState, useEffect } from "react";
import styles from "./VenueSelection.module.css";

interface Venue {
  id: string;
  name: string;
  fieldFamily: string;
}

interface VenueSelectionProps {
  onSubmit: (venueId: string, fieldFamily: string) => void;
  onSkip?: () => void;
}

export function VenueSelection({ onSubmit, onSkip }: VenueSelectionProps) {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/venues")
      .then((res) => res.json())
      .then((data) => {
        setVenues(data.venues || []);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Failed to load venues:", error);
        setLoading(false);
      });
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedVenue) {
      const venue = venues.find((v) => v.id === selectedVenue);
      if (venue) {
        onSubmit(venue.id, venue.fieldFamily);
      }
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <p>Loading venues...</p>
      </div>
    );
  }

  // Group venues by field family
  const venuesByFamily = venues.reduce((acc, venue) => {
    if (!acc[venue.fieldFamily]) {
      acc[venue.fieldFamily] = [];
    }
    acc[venue.fieldFamily].push(venue);
    return acc;
  }, {} as Record<string, Venue[]>);

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Select Target Venue</h1>
      <p className={styles.subtitle}>
        Choose the publication venue you're targeting. This helps us provide venue-specific review feedback.
      </p>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.venueGroups}>
          {Object.entries(venuesByFamily).map(([family, familyVenues]) => (
            <div key={family} className={styles.venueGroup}>
              <h3 className={styles.familyLabel}>{family}</h3>
              <div className={styles.options}>
                {familyVenues.map((venue) => (
                  <label key={venue.id} className={styles.option}>
                    <input
                      type="radio"
                      name="venue"
                      value={venue.id}
                      checked={selectedVenue === venue.id}
                      onChange={(e) => setSelectedVenue(e.target.value)}
                    />
                    <span>{venue.name}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className={styles.actions}>
          <button
            type="submit"
            disabled={!selectedVenue}
            className={styles.submitButton}
          >
            Continue
          </button>
          {onSkip && (
            <button
              type="button"
              onClick={onSkip}
              className={styles.skipButton}
            >
              Skip for now
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

