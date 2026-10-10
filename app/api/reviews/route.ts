import { findDoctorById } from "@/lib/server/data/appointments";
import { CACHE_TAGS, invalidate } from "@/lib/server/data/cacheTags";
import { getAdminDatabase } from "@/lib/server/firebaseAdmin";
import { HttpError, handleApi, readJsonBody } from "@/lib/server/http";
import { enforceRateLimit } from "@/lib/server/rateLimit";
import { requireApiSession } from "@/lib/server/session";
import { ROLES } from "@/lib/shared/roles";
import {
  cleanText,
  isValidRating,
  MAX_REVIEW_LENGTH,
} from "@/lib/shared/validation";

export const POST = handleApi(async (request) => {
  const session = await requireApiSession([ROLES.patient]);
  const body = await readJsonBody(request);

  const rating = Number(body.rating);
  const reviewText = cleanText(body.reviewText, MAX_REVIEW_LENGTH);
  if (!isValidRating(rating) || !reviewText) {
    throw new HttpError(400, "Rating and Review fields are required");
  }

  const doctor = await findDoctorById(body.doctorId);
  if (!doctor) throw new HttpError(404, "Doctor information is missing");
  await enforceRateLimit(`review:${session.uid}`, {
    windowMs: 60 * 60 * 1000,
    limit: 10,
  });
  await enforceRateLimit(`review:${session.uid}:${doctor.id}`, {
    windowMs: 24 * 60 * 60 * 1000,
    limit: 3,
  });

  const review = {
    userId: session.key,
    doctorId: doctor.id,
    rating,
    reviewText,
    role: ROLES.patient,
    createdAt: new Date().toISOString(),
  };
  await getAdminDatabase().ref("reviews").push(review);
  invalidate(CACHE_TAGS.reviews);

  return {
    review: {
      ...review,
      userName: session.record.name || "Unknown User",
      userPhoto: session.record.photo || "",
    },
  };
});
