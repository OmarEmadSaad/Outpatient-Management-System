"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

interface LocalDateTimeProps {
  value: string | number | Date | null;
}

export default function LocalDateTime({ value }: LocalDateTimeProps) {
  return useSyncExternalStore(
    subscribe,
    () => (value === null ? "" : new Date(value).toLocaleString()),
    () => ""
  );
}
