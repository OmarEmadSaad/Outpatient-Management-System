import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";
import { privatePageMetadata } from "@/lib/shared/site";

export const metadata = privatePageMetadata("Reset Password");

export default function ForgotPasswordPage() {
  return (
    <section className="px-5 lg:px-0 text-center">
      <div className="w-full max-w-[570px] mx-auto rounded-lg shadow-md md:p-10">
        <h1 className="text-headingColor text-[22px] leading-9 font-bold mb-10">
          Reset your <span className="text-primaryColor">password</span>
        </h1>
        <ForgotPasswordForm />
      </div>
    </section>
  );
}
