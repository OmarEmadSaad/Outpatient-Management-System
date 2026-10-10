import type { PublicDoctor } from "@/types/domain";

interface RatedReview {
  doctorId: string;
  rating: number | string;
}

export const reviewsForDoctor = <T extends RatedReview>(
  reviews: T[],
  doctorId: string
): T[] => reviews.filter((review) => review.doctorId === doctorId);

export const averageRating = (reviews: RatedReview[]): number | null => {
  if (!reviews.length) return null;
  const total = reviews.reduce(
    (sum, review) => sum + (Number(review.rating) || 0),
    0
  );
  return total / reviews.length;
};

export interface StarBreakdown {
  full: number;
  half: number;
  empty: number;
}

export const starBreakdown = (
  rating: number | null | undefined,
  maxStars = 5
): StarBreakdown => {
  const normalized = rating && !Number.isNaN(rating) ? rating / 2 : 0;
  const full = Math.min(Math.floor(normalized), maxStars);
  const half = normalized % 1 >= 0.5 && full < maxStars ? 1 : 0;
  return { full, half, empty: maxStars - full - half };
};

type RatableDoctor = Pick<PublicDoctor, "id" | "avgRating" | "totalRating">;

export const withRatings = <T extends RatableDoctor>(
  doctors: T[],
  reviews: RatedReview[]
): T[] =>
  doctors.map((doctor) => {
    const doctorReviews = reviewsForDoctor(reviews, doctor.id);
    const average = averageRating(doctorReviews);
    return {
      ...doctor,
      avgRating: average !== null ? average : Number(doctor.avgRating) || 0,
      totalRating: doctorReviews.length || Number(doctor.totalRating) || 0,
    };
  });

type ListableDoctor = Pick<PublicDoctor, "id" | "avgRating" | "specialization">;

export const filterDoctorsForListing = <T extends ListableDoctor>(
  doctors: T[],
  query: string,
  excludedDoctorId: string | null
): T[] => {
  const trimmedQuery = query.trim().toLowerCase();
  const visible = doctors.filter((doctor) => doctor.id !== excludedDoctorId);
  const filtered = trimmedQuery
    ? visible.filter((doctor) =>
        (doctor.specialization || "").toLowerCase().includes(trimmedQuery)
      )
    : visible.filter((doctor) => doctor.avgRating && doctor.avgRating >= 3.5);
  return [...filtered].sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0));
};

export const formatDate = (
  date: string | number | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string =>
  new Date(date ?? Number.NaN).toLocaleDateString(
    "en-us",
    options ?? { day: "numeric", month: "short", year: "numeric" }
  );
