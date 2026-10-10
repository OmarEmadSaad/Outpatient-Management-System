"use client";

import { useState } from "react";
import { Button } from "@material-tailwind/react";
import { AiOutlineClose } from "react-icons/ai";
import { BiMenu } from "react-icons/bi";

export type DoctorTab = "overview" | "appointments" | "settings";

interface TadsProps {
  tab: DoctorTab;
  setTab: (tab: DoctorTab) => void;
}

const TABS: { value: DoctorTab; label: string }[] = [
  { value: "overview", label: "Overview" },
  { value: "appointments", label: "Appointments" },
  { value: "settings", label: "Profile" },
];

export default function Tads({ tab, setTab }: TadsProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div>
      <span className="lg:hidden">
        {isMenuOpen ? (
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setIsMenuOpen(false)}
          >
            <AiOutlineClose className="w-6 h-6 cursor-pointer" />
          </button>
        ) : (
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setIsMenuOpen(true)}
          >
            <BiMenu className="w-6 h-6 cursor-pointer" />
          </button>
        )}
      </span>

      <div
        className={`${
          isMenuOpen ? "flex" : "hidden"
        } lg:flex mt-[7em] sm:mt-[7em] lg:mt-[0em] flex-col p-[30px] bg-white shadow-panelShadow items-center h-max rounded-md gap-4 absolute top-12 left-0 w-full md:w-64 z-50 lg:static lg:w-auto transition-all duration-300 ease-in-out`}
      >
        {TABS.map(({ value, label }) => (
          <Button
            key={value}
            variant="ghost"
            color="primary"
            isFullWidth
            aria-pressed={tab === value}
            onClick={() => {
              setTab(value);
              setIsMenuOpen(false);
            }}
            className={
              tab === value
                ? "bg-indigo-100 text-primaryColor"
                : "text-headingColor"
            }
          >
            {label}
          </Button>
        ))}
      </div>
    </div>
  );
}
