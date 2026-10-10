import ArrowLink from "@/components/ui/ArrowLink";
import type { PublicService } from "@/types/domain";

const FALLBACK_IMAGE =
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRLEoaTsWQuPn6bW-_n6hqZvmy5Lh64qwETLg&s";

export default function ServiceCard({ service }: { service: PublicService }) {
  const { name, desc, bgColor, textColor, image } = service;

  return (
    <div
      className="flex flex-col justify-center items-center min-h-[22vh] rounded-lg p-6 shadow-sm "
      style={{ backgroundColor: bgColor }}
    >
      <div className="mb-4">
        <img
          src={image || FALLBACK_IMAGE}
          alt={name}
          loading="lazy"
          decoding="async"
          className="w-24 h-24 rounded-full object-cover border-2 border-white"
        />
      </div>

      <div className="max-w-[600px] w-full py-[10px] px-5 text-center">
        <h2
          className="text-[24px] leading-8 font-[700]"
          style={{ color: textColor }}
        >
          {name}
        </h2>
        <p className="text-[14px] leading-6 font-[400] text-textColor mt-2">
          {desc}
        </p>
      </div>

      <div className="flex items-center justify-center mt-[20px]">
        <ArrowLink
          href={`/services-details?service=${encodeURIComponent(name)}`}
          label={`Doctors for ${name}`}
        />
      </div>
    </div>
  );
}
