"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { AiFillStar, AiOutlineStar } from "react-icons/ai";
import { toast } from "react-toastify";
import { useAuth } from "@/components/providers/AuthProvider";
import Spinner from "@/components/ui/Spinner";
import { apiRequest, errorStatus, errorText } from "@/lib/client/api";
import { ROLES } from "@/lib/shared/roles";
import { MAX_REVIEW_LENGTH } from "@/lib/shared/validation";
import { Button } from "@material-tailwind/react";
import type { ReviewResponse } from "@/types/api";
import type { ReviewWithAuthor } from "@/types/domain";

const STAR_VALUES = [2, 4, 6, 8, 10];

export default function FeedbackForm({
  doctorId,
  onSubmitSuccess,
}: {
  doctorId: string;
  onSubmitSuccess?: (review: ReviewWithAuthor) => void;
}) {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [loading, setLoading] = useState(false);

  if (user?.role !== ROLES.patient) {
    return (
      <div className="text-center text-[14px] text-textColor mt-6">
        Only patients can submit reviews. Please log in as a patient.
      </div>
    );
  }

  const handleSubmitReview = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!rating || !reviewText.trim()) {
      toast.error("Rating and Review fields are required");
      return;
    }

    setLoading(true);
    try {
      const { review } = await apiRequest<ReviewResponse>("/api/reviews", {
        method: "POST",
        body: { doctorId, rating, reviewText },
      });
      toast.success("Review submitted successfully");
      setRating(0);
      setHover(0);
      setReviewText("");
      onSubmitSuccess?.(review);
    } catch (error) {
      toast.error(
        errorStatus(error) === 401
          ? "Please log in to submit a review."
          : `Failed to submit review: ${errorText(error)}`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmitReview} className="mt-6 w-full max-w-lg">
      <div>
        <h3 className="text-[14px] sm:text-[16px] text-headingColor mb-4 leading-6 font-semibold">
          How would you rate the overall experience? (1-10)
        </h3>
        <div className="flex gap-1 flex-wrap">
          {STAR_VALUES.map((starValue) => {
            const isHalfStar = hover > starValue - 1 && hover < starValue;
            return (
              <button
                key={starValue}
                type="button"
                className={`bg-transparent border-none outline-none focus-visible:ring-2 focus-visible:ring-primaryColor rounded-sm text-[16px] sm:text-[18px] cursor-pointer ${
                  starValue <= (hover || rating)
                    ? "text-yellowColor"
                    : "text-gray-400"
                }`}
                onClick={() => setRating(starValue)}
                onMouseEnter={() => setHover(starValue)}
                onMouseLeave={() => setHover(rating)}
                onDoubleClick={() => {
                  setHover(0);
                  setRating(0);
                }}
                aria-label={`Rate ${starValue} out of 10`}
              >
                {isHalfStar ? <AiOutlineStar /> : <AiFillStar />}
              </button>
            );
          })}
        </div>
        {rating > 0 && (
          <p className="text-[14px] text-textColor mt-2">
            You rated: {rating}/10
          </p>
        )}
      </div>

      <div className="mt-6">
        <h3 className="text-[14px] sm:text-[16px] text-headingColor mb-4 leading-6 font-semibold">
          Share your feedback or suggestions
        </h3>
        <textarea
          value={reviewText}
          onChange={(event) => setReviewText(event.target.value)}
          className="border border-solid border-[#0066ff34] w-full px-3 py-2 rounded-md focus:outline focus:outline-primaryColor text-[13px] sm:text-[14px]"
          rows={5}
          placeholder="Write your feedback or suggestions"
          maxLength={MAX_REVIEW_LENGTH}
          aria-label="Feedback or suggestions"
        />
      </div>

      <div className="mt-4 text-center">
        <Button color="primary" type="submit" disabled={loading}>
          {loading ? <Spinner size={20} color="#fff" /> : "Submit Feedback"}
        </Button>
      </div>
    </form>
  );
}
