import { describe, expect, it } from "vitest";
import {
  averageRating,
  filterDoctorsForListing,
  starBreakdown,
  withRatings,
} from "@/lib/shared/ratings";

interface ListedDoctor {
  id: string;
  specialization: string;
  avgRating: number;
  totalRating: number;
}

describe("ratings", () => {
  it("computes averages and star breakdowns on a 10 point scale", () => {
    expect(averageRating([])).toBeNull();
    expect(averageRating([
        { doctorId: "a", rating: 8 },
        { doctorId: "a", rating: 10 },
      ])).toBe(9);
    expect(starBreakdown(9)).toEqual({ full: 4, half: 1, empty: 0 });
    expect(starBreakdown(0)).toEqual({ full: 0, half: 0, empty: 5 });
    expect(starBreakdown(10)).toEqual({ full: 5, half: 0, empty: 0 });
  });

  it("filters the doctor listing like the original page", () => {
    const doctors = withRatings<ListedDoctor>(
      [
        {
          id: "a",
          specialization: "Dermatology",
          avgRating: 0,
          totalRating: 0,
        },
        {
          id: "b",
          specialization: "Neurology",
          avgRating: 0,
          totalRating: 0,
        },
        {
          id: "c",
          specialization: "Surgery",
          avgRating: 2,
          totalRating: 0,
        },
      ],
      [
        { doctorId: "a", rating: 8 },
        { doctorId: "b", rating: 10 },
      ]
    );
    expect(filterDoctorsForListing(doctors, "", null).map((d) => d.id)).toEqual(
      ["b", "a"]
    );
    expect(
      filterDoctorsForListing(doctors, "neuro", null).map((d) => d.id)
    ).toEqual(["b"]);
    expect(filterDoctorsForListing(doctors, "", "b").map((d) => d.id)).toEqual([
      "a",
    ]);
  });
});
