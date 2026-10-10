"use client";

import Image from "next/image";
import { HiStar } from "react-icons/hi";
import { Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/pagination";
import patientAvatar from "@/assets/images/patient-avatar.png";

const testimonials = ["Dr.Mohamed", "Dr.Ahmed", "Dr.Salah"];

const breakpoints = {
  640: { slidesPerView: 1, spaceBetween: 0 },
  768: { slidesPerView: 2, spaceBetween: 20 },
  1024: { slidesPerView: 3, spaceBetween: 30 },
};

export default function Testimonial() {
  return (
    <div className="mt-[30px] lg:mt-[55px]">
      <Swiper
        modules={[Pagination]}
        spaceBetween={30}
        slidesPerView={1}
        pagination={{ clickable: true }}
        breakpoints={breakpoints}
      >
        {testimonials.map((name) => (
          <SwiperSlide key={name}>
            <div className="py-[30px] px-5 rounded-3">
              <div className="flex items-center gap-[13px]">
                <Image src={patientAvatar} alt="" />
                <div>
                  <h3 className="text-[18px] leading-[30px] font-semibold text-headingColor">
                    {name}
                  </h3>
                  <div className="flex items-center gap-[2px]">
                    {Array.from({ length: 5 }, (_, index) => (
                      <HiStar
                        key={index}
                        className="text-yellowColor h-5 w-[18px]"
                      />
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-textColor font-[400]">
                the is the Greed Doctor
              </p>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
