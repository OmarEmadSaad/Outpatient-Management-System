import "server-only";
import { unstable_cache } from "next/cache";
import type {
  DoctorDetails,
  PublicDoctor,
  PublicReview,
  PublicService,
  ReviewWithAuthor,
} from "@/types/domain";
import type {
  DoctorRecord,
  ReviewRecord,
  ServiceRecord,
  UserRecord,
} from "@/types/firebase";
import {
  averageRating,
  reviewsForDoctor,
  withRatings,
} from "../../shared/ratings";
import { isValidFirebaseKey } from "../../shared/validation";
import {
  queryByChildVariants,
  readCollection,
  readValue,
} from "../firebaseAdmin";
import { CACHE_TAGS, PUBLIC_REVALIDATE_SECONDS, type CacheTag } from "./cacheTags";
import { toPublicDoctor, toPublicReview, toPublicService } from "./projections";

const cachePolicy = (tags: CacheTag[]) => ({
  tags,
  revalidate: PUBLIC_REVALIDATE_SECONDS,
});

export const listServices = unstable_cache(
  async (): Promise<PublicService[]> =>
    (await readCollection<ServiceRecord>("services")).map(({ key, record }) =>
      toPublicService(key, record)
    ),
  ["public-services"],
  cachePolicy([CACHE_TAGS.services])
);

export const listReviews = unstable_cache(
  async (): Promise<PublicReview[]> =>
    (await readCollection<ReviewRecord>("reviews")).map(({ key, record }) =>
      toPublicReview(key, record)
    ),
  ["public-reviews"],
  cachePolicy([CACHE_TAGS.reviews])
);

const listDoctorsRaw = unstable_cache(
  async (): Promise<PublicDoctor[]> =>
    (await readCollection<DoctorRecord>("doctors")).map(({ key, record }) =>
      toPublicDoctor(key, record)
    ),
  ["public-doctors"],
  cachePolicy([CACHE_TAGS.doctors])
);

export const listDoctors = async (): Promise<PublicDoctor[]> => {
  const [doctors, reviews] = await Promise.all([
    listDoctorsRaw(),
    listReviews(),
  ]);
  return withRatings(doctors, reviews);
};

export const listDoctorsBySpecialization = async (
  specialization: string
): Promise<PublicDoctor[]> => {
  const target = specialization.trim().toLowerCase();
  return (await listDoctorsRaw()).filter(
    (doctor) => doctor.specialization.toLowerCase() === target
  );
};

const resolveReviewAuthor = async (
  userId: string
): Promise<UserRecord | null> => {
  if (!userId) return null;
  if (isValidFirebaseKey(userId)) {
    const byKey = await readValue<UserRecord>(`users/${userId}`);
    if (byKey) return byKey;
  }
  const [byId] = await queryByChildVariants<UserRecord>("users", "id", userId);
  return byId?.record ?? null;
};

const reviewsWithAuthors = unstable_cache(
  async (doctorId: string): Promise<ReviewWithAuthor[]> => {
    const doctorReviews = reviewsForDoctor(await listReviews(), doctorId);
    const authorIds = [...new Set(doctorReviews.map((review) => review.userId))];
    const authors = await Promise.all(authorIds.map(resolveReviewAuthor));
    const authorsById = new Map(
      authorIds.map((id, index) => [id, authors[index] ?? null] as const)
    );
    return doctorReviews.map((review) => {
      const author = authorsById.get(review.userId);
      return {
        ...review,
        userName: author?.name || "Unknown User",
        userPhoto: author?.photo || "",
      };
    });
  },
  ["public-doctor-reviews"],
  cachePolicy([CACHE_TAGS.reviews])
);

export const getPublicDoctor = async (
  doctorId: unknown
): Promise<DoctorDetails | null> => {
  if (typeof doctorId !== "string" || !doctorId || doctorId.length > 64) {
    return null;
  }
  const doctor = (await listDoctorsRaw()).find((item) => item.id === doctorId);
  if (!doctor) return null;

  const reviews = await reviewsWithAuthors(doctorId);
  const average = averageRating(reviews);
  return {
    doctor,
    reviews,
    totalRating: reviews.length,
    averageRating: average === null ? 0 : average.toFixed(1),
  };
};
