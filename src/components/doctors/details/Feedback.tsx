"use client";

import { useState } from "react";
import { AiFillStar } from "react-icons/ai";
import { formatDate } from "@/lib/shared/ratings";
import avatar from "@/assets/images/avatar-icon.png";
import FeedbackForm from "./FeedbackForm";
import type { ReviewWithAuthor } from "@/types/domain";
import { Button } from "@material-tailwind/react";

export default function Feedback({
  reviews,
  totalRating,
  doctorId,
}: {
  reviews: ReviewWithAuthor[];
  totalRating: number;
  doctorId: string;
}) {
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [localReviews, setLocalReviews] = useState(reviews);

  const handleFeedbackSubmit = (newReview: ReviewWithAuthor) => {
    setLocalReviews((current) => [...current, newReview]);
    setShowFeedbackForm(false);
  };

  return (
    <div className="container mx-auto px-4">
      <div className="mb-8 sm:mb-12">
        <h2 className="text-[18px] sm:text-[20px] leading-[26px] sm:leading-[30px] font-bold text-headingColor mb-6 sm:mb-8">
          All Reviews ({totalRating})
        </h2>
        {localReviews.map((review, index) => (
          <div
            key={review.key || index}
            className="flex flex-col sm:flex-row sm:justify-between gap-4 sm:gap-10 mb-6 sm:mb-8"
          >
            <div className="flex items-center gap-3">
              <figure className="w-10 h-10 rounded-full overflow-hidden mb-13">
                <img
                  src={review.userPhoto || avatar.src}
                  className="w-full h-full object-cover"
                  alt={review.userName}
                  loading="lazy"
                />
              </figure>
              <div className="flex flex-col">
                <h3 className="text-[14px] sm:text-[16px] leading-5 sm:leading-6 text-irisBlueColor font-bold">
                  {review.userName}
                </h3>
                <p className="text-[12px] sm:text-[14px] leading-5 sm:leading-6 text-textColor">
                  {formatDate(review.createdAt)}
                </p>
                <p className="mt-2 text-[13px] sm:text-[15px] text__para font-medium">
                  {review.reviewText}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex gap-1">
                {Array.from({ length: review.rating || 0 }, (_, starIndex) => (
                  <AiFillStar key={starIndex} color="#0067FF" size={16} />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
      {!showFeedbackForm && (
        <div className="text-center">
          <Button color="primary" onClick={() => setShowFeedbackForm(true)}>
            Give Feedback
          </Button>
        </div>
      )}
      {showFeedbackForm && (
        <FeedbackForm
          doctorId={doctorId}
          onSubmitSuccess={handleFeedbackSubmit}
        />
      )}
    </div>
  );
}
