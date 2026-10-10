import Image from "next/image";
import SignupForm from "@/components/auth/SignupForm";
import { privatePageMetadata } from "@/lib/shared/site";
import signupImg from "@/assets/images/signup.webp";

export const metadata = privatePageMetadata("Create an Account");

export default function RegisterPage() {
  return (
    <section className="px-5 xl:px-0">
      <div className="mx-auto max-w-[1170px]">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          <div className="hidden lg:block bg-primaryColor rounded-l-lg">
            <figure className="rounded-l-lg">
              <Image
                src={signupImg}
                className="w-full rounded-l-lg"
                alt="Signup"
                unoptimized
              />
            </figure>
          </div>

          <div className="rounded-l-lg lg:pl-16 py-10">
            <h1 className="text-headingColor text-[22px] leading-9 mb-10">
              Create an <span className="text-primaryColor">account</span>
            </h1>
            <SignupForm />
          </div>
        </div>
      </div>
    </section>
  );
}
