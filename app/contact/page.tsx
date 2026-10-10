import type { Metadata } from "next";
import ContactForm from "@/components/contact/ContactForm";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get a technical issue or want to send feedback about a beta feature? Contact the Outpatient Management System team.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <section>
      <div className="px-4 mx-auto max-w-screen-md">
        <h1 className="heading text-center">Contact Us</h1>
        <p className="mb-8 lg:mb-16 font-light text-center text__para">
          Got a technical issue? Want to send feedback about a beta feature? Let
          us know
        </p>
        <ContactForm />
      </div>
    </section>
  );
}
