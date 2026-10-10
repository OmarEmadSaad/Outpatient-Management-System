"use client";

import Link from "next/link";
import { motion as Motion } from "framer-motion";

export default function NotFoundView() {
  return (
    <div
      style={{ backgroundImage: "url(/404-Andromo-AI-Design-2.webp)" }}
      className=" bg-cover bg-center flex flex-col items-center justify-center h-screen bg-gradient-to-br from-gray-900 to-gray-700 text-white px-4"
    >
      <Motion.h1
        className="text-7xl font-bold mb-4"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        404
      </Motion.h1>

      <Motion.h2
        className="text-2xl mb-6 text-center"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
      >
        Sorry, The Page You Are Looking For Was Not Found 😔
      </Motion.h2>

      <Motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.9 }}
      >
        <Link
          href="/"
          className="bg-cyan-500 hover:bg-cyan-600 transition px-6 py-3 rounded-lg text-white font-semibold shadow-lg"
        >
          Back to Home
        </Link>
      </Motion.div>
    </div>
  );
}
