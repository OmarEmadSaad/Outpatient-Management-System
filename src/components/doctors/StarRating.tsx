import { FaRegStar, FaStar, FaStarHalfAlt } from "react-icons/fa";
import { starBreakdown } from "@/lib/shared/ratings";

const starClass = "w-4 h-4 text-yellow-400";

export default function StarRating({
  rating,
}: {
  rating: number | null | undefined;
}) {
  const { full, half, empty } = starBreakdown(rating);
  return (
    <>
      {Array.from({ length: full }, (_, index) => (
        <FaStar key={`full-${index}`} className={starClass} title="Full star" />
      ))}
      {half === 1 && <FaStarHalfAlt className={starClass} title="Half star" />}
      {Array.from({ length: empty }, (_, index) => (
        <FaRegStar
          key={`empty-${index}`}
          className={starClass}
          title="Empty star"
        />
      ))}
    </>
  );
}
