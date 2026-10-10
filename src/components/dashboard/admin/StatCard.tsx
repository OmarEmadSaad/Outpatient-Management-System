import LocalDateTime from "@/components/ui/LocalDateTime";
import NavButton from "@/components/ui/NavButton";

interface StatCardProps {
  title: string;
  totalLabel: string;
  total: number;
  lastLabel: string;
  name: string | null;
  when: string | null | undefined;
  fallback: string;
  href: string;
}

export default function StatCard({
  title,
  totalLabel,
  total,
  lastLabel,
  name,
  when,
  fallback,
  href,
}: StatCardProps) {
  return (
    <div className="bg-white shadow-lg rounded-lg p-6 border border-gray-200">
      <h2 className="text-2xl font-bold text-headingColor mb-4">{title}</h2>
      <p className="text-lg text-textColor">
        {totalLabel}: <span className="font-semibold">{total}</span>
      </p>
      <p className="text-lg text-textColor">
        {lastLabel}:
        <span className="font-semibold">
          {name !== null ? (
            <>
              {name} ({when ? <LocalDateTime value={when} /> : fallback})
            </>
          ) : (
            fallback
          )}
        </span>
      </p>
      <NavButton href={href} className="mt-4">
        View Details
      </NavButton>
    </div>
  );
}
