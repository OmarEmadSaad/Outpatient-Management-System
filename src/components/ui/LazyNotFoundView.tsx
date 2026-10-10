"use client";

import dynamic from "next/dynamic";

const NotFoundView = dynamic(() => import("./NotFoundView"));

export default function LazyNotFoundView() {
  return <NotFoundView />;
}
