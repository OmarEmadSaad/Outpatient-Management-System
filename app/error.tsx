"use client";

import dynamic from "next/dynamic";

const ErrorState = dynamic(() => import("@/components/ui/ErrorState"));

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorState reference={error?.digest} onRetry={reset} />;
}
