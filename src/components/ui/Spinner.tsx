"use client";

import HashLoader from "react-spinners/HashLoader";

interface SpinnerProps {
  size?: number;
  color?: string;
}

export default function Spinner({ size, color }: SpinnerProps) {
  return <HashLoader size={size} color={color} />;
}
