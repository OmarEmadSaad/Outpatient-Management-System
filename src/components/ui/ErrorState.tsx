"use client";

import { startTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@material-tailwind/react";
import { HiOutlineExclamationTriangle } from "react-icons/hi2";

interface ErrorStateProps {
  title?: string;
  message?: string;
  reference?: string;
  onRetry?: () => void;
}

export default function ErrorState({
  title = "Something went wrong",
  message = "We couldn't load this page right now. Please try again in a moment.",
  reference,
  onRetry,
}: ErrorStateProps) {
  const router = useRouter();

  const retry = () => {
    if (!onRetry) {
      window.location.reload();
      return;
    }
    startTransition(() => {
      router.refresh();
      onRetry();
    });
  };

  return (
    <section className="flex items-center justify-center px-5">
      <div role="alert" className="w-full max-w-lg text-center">
        <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-full bg-primaryColor/10 text-primaryColor">
          <HiOutlineExclamationTriangle
            aria-hidden="true"
            className="h-10 w-10"
          />
        </div>
        <h1 className="text-[28px] leading-9 md:text-[32px] md:leading-10 font-bold text-headingColor">
          {title}
        </h1>
        <p className="text__para text-textColor">{message}</p>

        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Button color="primary" size="lg" onClick={retry}>
            Try again
          </Button>
          <Button
            color="primary"
            variant="outline"
            size="lg"
            onClick={() => router.push("/")}
          >
            Go home
          </Button>
        </div>

        <p className="mt-6 text-sm text-textColor">
          Still having trouble?{" "}
          <Link
            href="/contact"
            className="font-semibold text-primaryColor hover:underline"
          >
            Contact us
          </Link>
        </p>
        {reference && (
          <p className="mt-2 text-xs text-textColor/70">
            Reference: {reference}
          </p>
        )}
      </div>
    </section>
  );
}
