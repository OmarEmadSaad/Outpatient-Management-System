import LoginForm from "@/components/auth/LoginForm";
import { privatePageMetadata } from "@/lib/shared/site";

export const metadata = privatePageMetadata("Login");

export default function LoginPage() {
  return (
    <section className="px-5 lg:px-0 text-center">
      <div className="w-full max-w-[570px] mx-auto rounded-lg shadow-md md:p-10">
        <h1 className="text-headingColor text-[22px] leading-9 font-bold mb-10">
          Hello <span className="text-primaryColor">Welcome👋 </span> Back 😊🎉
        </h1>
        <LoginForm />
      </div>
    </section>
  );
}
