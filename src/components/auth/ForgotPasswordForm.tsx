"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { toast } from "react-toastify";
import Spinner from "@/components/ui/Spinner";
import { apiRequest, errorText } from "@/lib/client/api";
import type { MessageResponse } from "@/types/api";
import { Button } from "@material-tailwind/react";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    try {
      const data = await apiRequest<MessageResponse>(
        "/api/auth/password-reset",
        {
          method: "POST",
          body: { email },
        }
      );
      setMessage(data.message);
      toast.success(data.message);
    } catch (error) {
      toast.error(errorText(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="py-4 md:py-0" onSubmit={handleSubmit}>
      <div className="mb-5 text-left">
        <label
          htmlFor="reset-email"
          className="block text-sm font-medium text-headingColor mb-1"
        >
          Your Email
        </label>
        <input
          id="reset-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="name@mail.com"
          required
          className="w-full px-4 py-3 border border-gray-300 focus:outline-none text-[16px] leading-7 focus:border-primaryColor text-headingColor placeholder:text-textColor rounded-md"
        />
      </div>
      {message && (
        <p className="text-left text-sm mb-2 text-textColor">{message}</p>
      )}
      <div className="mt-7">
        <Button
          color="primary"
          className="w-full"
          type="submit"
          disabled={loading}
        >
          {loading ? <Spinner size={25} color="#fff" /> : "Send reset link"}
        </Button>
      </div>
      <p className="mt-4">
        Remembered your password?
        <Link href="/login" className="text-primaryColor font-medium ml-1">
          Login
        </Link>
      </p>
    </form>
  );
}
