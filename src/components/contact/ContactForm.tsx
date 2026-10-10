"use client";

import { useRef, useState, type FormEvent } from "react";
import { toast } from "react-toastify";
import { Button, Input, Textarea } from "@material-tailwind/react";

const EMAILJS_SERVICE_ID = "service_yo34veg";
const EMAILJS_TEMPLATE_ID = "template_zhnsmkh";
const EMAILJS_PUBLIC_KEY = "IGCLiTemdvjUEWCk4";

const emailErrorText = (error: unknown): unknown =>
  typeof error === "object" && error !== null && "text" in error
    ? error.text
    : undefined;

export default function ContactForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isSending, setIsSending] = useState(false);

  const sendEmail = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = formRef.current;
    if (!form) return;
    setIsSending(true);
    try {
      const { default: emailjs } = await import("@emailjs/browser");
      await emailjs.sendForm(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        form,
        EMAILJS_PUBLIC_KEY
      );
      toast.success("Message sent successfully!");
      form.reset();
    } catch (error) {
      console.error("Error:", emailErrorText(error) || error);
      toast.error("Failed to send message!");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <form ref={formRef} onSubmit={sendEmail} className=" space-y-8">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="email"
            className="text-sm font-semibold text-headingColor"
          >
            your Email
          </label>
          <Input
            type="email"
            name="user_email"
            id="email"
            placeholder="example@gmail.com"
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="subject"
            className="text-sm font-semibold text-headingColor"
          >
            Subject
          </label>
          <Input
            type="text"
            name="subject"
            id="subject"
            placeholder="Let us know how we can be help you"
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="message"
            className="text-sm font-semibold text-headingColor"
          >
            message
          </label>
          <Textarea
            name="message"
            id="message"
            className="h-24"
            placeholder="Let a comment..."
            maxLength={2000}
            required
          />
        </div>
      </div>
      <Button color="primary" type="submit" disabled={isSending}>
        Submit
      </Button>
    </form>
  );
}
