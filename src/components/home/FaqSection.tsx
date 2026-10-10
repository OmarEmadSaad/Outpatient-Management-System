import Image from "next/image";
import { faqs } from "@/assets/data/faqs";
import faqImg from "@/assets/images/faq-img.png";
import FaqItem from "./FaqItem";

export default function FaqSection() {
  return (
    <section>
      <div className=" container">
        <div className=" flex justify-between gap-[50px] lg:gap-0 ">
          <div className=" hidden w-1/2 md:block">
            <Image src={faqImg} alt="Frequently asked questions" quality={90} />
          </div>

          <div className="w-full md:w-1/2 flex flex-col justify-center gap-[3em]">
            <h2 className="heading ">Most question by our beloved patients</h2>
            <div className="gap-[2em]">
              <ul className="mt-[38px]">
                {faqs.map((item, index) => (
                  <FaqItem item={item} key={index} />
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
