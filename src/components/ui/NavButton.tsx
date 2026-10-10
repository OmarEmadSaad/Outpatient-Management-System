"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@material-tailwind/react";

interface NavButtonProps {
  href: string;
  className?: string;
  children: ReactNode;
}

export default function NavButton({
  href,
  className,
  children,
}: NavButtonProps) {
  const router = useRouter();
  return (
    <Button
      color="primary"
      className={className}
      onClick={() => router.push(href)}
    >
      {children}
    </Button>
  );
}
