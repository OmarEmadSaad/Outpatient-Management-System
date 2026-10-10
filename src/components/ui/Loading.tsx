"use client";

import HashLoader from "react-spinners/HashLoader";

export default function Loading() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <HashLoader className="text-blue-400" />
    </div>
  );
}
