"use client";

import { useId, useState } from "react";
import { AiOutlineMinus, AiOutlinePlus } from "react-icons/ai";
import type { FaqEntry } from "@/assets/data/faqs";

export default function FaqItem({ item }: { item: FaqEntry }) {
  const [isOpen, setIsOpen] = useState(false);
  const answerId = useId();

  return (
    <li className="p-3 lg:p-5 rounded-[12px] border border-solid border-[#D9DCE2] mb-5 cursor-pointer">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={answerId}
        className="flex w-full items-center justify-between gap-5 text-left cursor-pointer"
        onClick={() => setIsOpen((open) => !open)}
      >
        <h3 className="text-[16px] leading-7 lg:leading-8 text-headingColor">
          {item.question}
        </h3>
        <span
          className={`${
            isOpen && "bg-primaryColor text-white border-none"
          }w-7 h-7 lg:w-8 lg:h-8 border border-solid border-[#141F21] rounded flex shrink-0 justify-center items-center`}
        >
          {isOpen ? <AiOutlineMinus /> : <AiOutlinePlus />}
        </span>
      </button>
      <p
        id={answerId}
        hidden={!isOpen}
        className="mt-4 text-[16px] leading-7 font-[400] text-textColor"
      >
        {item.content}
      </p>
    </li>
  );
}
