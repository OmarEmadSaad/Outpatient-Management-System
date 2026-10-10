const BASE =
  "inline-flex items-center justify-center border align-middle select-none font-sans font-medium text-center transition-all duration-300 ease-in disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed data-[shape=pill]:rounded-full data-[width=full]:w-full focus:shadow-none";

const SIZES = {
  sm: "text-sm rounded-md py-1.5 px-3 shadow-sm hover:shadow",
  md: "text-sm rounded-md py-2 px-4 shadow-sm hover:shadow-md",
} as const;

const INFO =
  "bg-info border-info text-info-foreground hover:bg-info-light hover:border-info-light";

export const infoButtonClass = (size: keyof typeof SIZES = "md"): string =>
  `${BASE} ${SIZES[size]} ${INFO}`;

export const ghostIconButtonClass =
  "inline-grid place-items-center border align-middle select-none font-sans font-medium text-center transition-all duration-300 ease-in disabled:opacity-50 disabled:shadow-none disabled:pointer-events-none data-[shape=circular]:rounded-full text-sm min-w-[38px] min-h-[38px] rounded-md bg-transparent border-transparent text-secondary-foreground hover:bg-secondary/10 hover:border-secondary/10 hover:shadow-none";
