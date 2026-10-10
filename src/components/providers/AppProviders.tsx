"use client";

import type { ReactNode } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AuthProvider } from "./AuthProvider";
import DriftChat from "./DriftChat";

export default function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <DriftChat />
      <ToastContainer
        theme="dark"
        autoClose={3000}
        position="top-right"
        closeOnClick
        pauseOnHover={false}
        newestOnTop
        style={{
          margin: 0,
          padding: 0,
          position: "fixed",
          top: 0,
          right: 0,
          zIndex: 9999,
        }}
      />
    </AuthProvider>
  );
}
