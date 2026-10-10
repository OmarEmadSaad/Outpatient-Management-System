"use client";

import { useState } from "react";
import type { ReactNode } from "react";

type DoctorTab = "about" | "feedback";

const TABS: { value: DoctorTab; label: string }[] = [
  { value: "about", label: "About" },
  { value: "feedback", label: "Feedback" },
];

const tabClass = (isActive: boolean) =>
  `${
    isActive ? "border-b border-solid border-primaryColor " : ""
  }py-2 px-5 mr-5 text-[16px] leading-7 text-headingColor font-semibold hover:cursor-pointer`;

export default function DoctorTabs({
  about,
  feedback,
}: {
  about: ReactNode;
  feedback: ReactNode;
}) {
  const [tab, setTab] = useState<DoctorTab>("about");
  const panels: Record<DoctorTab, ReactNode> = { about, feedback };

  return (
    <>
      <div
        role="tablist"
        aria-label="Doctor details"
        className="mt-[5em] border-b border-solid border-[#0066ff34]"
      >
        {TABS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            role="tab"
            id={`doctor-tab-${value}`}
            aria-selected={tab === value}
            aria-controls={`doctor-panel-${value}`}
            onClick={() => setTab(value)}
            className={tabClass(tab === value)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-[50px]">
        {TABS.map(({ value }) => (
          <div
            key={value}
            role="tabpanel"
            id={`doctor-panel-${value}`}
            aria-labelledby={`doctor-tab-${value}`}
            hidden={tab !== value}
          >
            {panels[value]}
          </div>
        ))}
      </div>
    </>
  );
}
