import Image from "next/image";
import Link from "next/link";
import featureImg from "@/assets/images/feature-img.png";
import videoImg from "@/assets/images/video-icon.png";
import avatarIcon from "@/assets/images/avatar-icon.png";
import { infoButtonClass } from "@/components/ui/buttonClasses";

export default function VirtualTreatment() {
  return (
    <section className="Ahmed py-[60px] lg:py-[100px] flex justify-center items-center ">
      <div className="container mx-auto px-4 ">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="xl:w-[670px] text-center lg:text-left ">
            <h2 className="heading mb-4">Get virtual treatment</h2>
            <ul className="pl-4 space-y-2">
              <li className="text__para">
                1. Scheduling the appointment description
              </li>
              <li className="text__para">
                2. Search for your physician here and contact their office
              </li>
              <li className="text__para">
                3. View our physicians who are accepting new patients
              </li>
            </ul>
            <Link href="/">
              <span className={`${infoButtonClass()} mt-6`} data-shape="default" data-width="default">
                Learn more
              </span>
            </Link>
          </div>
          <div className=" relative z-10 xl:w-[770px] flex justify-end mt-[50px] lg:mt-0">
            <Image
              src={featureImg}
              className="w-3/4"
              alt="Virtual treatment"
              quality={90}
            />
            <div
              className="w-[150px] lg:w-[248px] bg-white absolute bottom-[50px] left-0
               md:bottom-[100px] md:left-5 z-20 p-2 pb-3 lg:pt-4 lg:px-4 lg:pb-[26px] rounded-[10px]"
            >
              <div className=" flex items-center justify-between">
                <div className=" flex items-center gap-[6px] lg:gap-3">
                  <p className="text-[10px]  leading-[10px] lg:text-[14px] lg:leading-5 font-[600] text-headingColor ">
                    Tru,24
                  </p>
                  <p className="text-[10px]  leading-[10px] lg:text-[14px] lg:leading-5 font-[400] text-textColor ">
                    10:00
                  </p>
                </div>
                <span className="w-5 h-5 lg:w-[34px] lg:h-[34px] flex items-center justify-center bg-yellowColor rounded py-1 px-[6px] lg:py-3 lg:px-[9px] ">
                  <Image src={videoImg} alt="" />
                </span>
              </div>
              <div
                className="w-[65px] lg:w-[96px] bg-[#CCF0F3] py-1 px-2 lg:py-[6px] lg:px-[10px] text-[8px] leading-[8px] 
                lg:text-[12px] lg:leading-4 text-irisBlueColor font-[500] mt-2 lg:mt-4 rounded-full text-center "
              >
                Consultation
              </div>
              <div className="flex items-center gap-[6px] lg:gap-[10px] mt-2 lg:mt-[18px] ">
                <Image src={avatarIcon} alt="" />
                <h2>wayne Conlline</h2>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
