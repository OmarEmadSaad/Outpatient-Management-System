import Link from "next/link";
import { BsArrowRight } from "react-icons/bs";

interface ArrowLinkProps {
  href: string;
  label: string;
}

export default function ArrowLink({ href, label }: ArrowLinkProps) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="w-[44px] h-[44px] rounded-full border border-solid border-[#181A1E] 
                    flex items-center justify-center transition duration-300 group hover:bg-primaryColor 
                    hover:border-none"
    >
      <BsArrowRight className="group-hover:text-white w-6 h-5" />
    </Link>
  );
}
