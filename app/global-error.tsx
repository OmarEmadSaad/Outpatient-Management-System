"use client";

import "./globals.css";
import dynamic from "next/dynamic";

const ErrorState = dynamic(() => import("@/components/ui/ErrorState"));

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen grid place-items-center">
        <ErrorState reference={error?.digest} onRetry={reset} />
      </body>
    </html>
  );
}
