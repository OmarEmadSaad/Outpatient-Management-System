"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useAuth } from "@/components/providers/AuthProvider";
import Spinner from "@/components/ui/Spinner";
import { Button } from "@material-tailwind/react";
import { errorText } from "@/lib/client/api";
import type { LoginRequest } from "@/types/api";

const inputClass =
  "w-full px-4 py-3 border border-gray-300 focus:outline-none text-[16px] leading-7 focus:border-primaryColor text-headingColor placeholder:text-textColor rounded-md";

export default function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [credentials, setCredentials] = useState<LoginRequest>({
    email: "",
    password: "",
    role: "patient",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleInputChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setCredentials({ ...credentials, [event.target.name]: event.target.value });
  };

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(credentials);
      toast.success("Logged in successfully!");
      router.push("/");
      router.refresh();
    } catch (loginError) {
      setError(errorText(loginError));
      toast.error(errorText(loginError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="py-4 md:py-0" onSubmit={handleLogin}>
      <div className="mb-5 text-left">
        <label
          htmlFor="login-role"
          className="block text-sm font-medium text-headingColor mb-1"
        >
          Your Role
        </label>
        <select
          id="login-role"
          name="role"
          value={credentials.role}
          onChange={handleInputChange}
          required
          className={inputClass}
        >
          <option value="patient">Patient</option>
          <option value="doctor">Doctor</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <div className="mb-5 text-left">
        <label
          htmlFor="login-email"
          className="block text-sm font-medium text-headingColor mb-1"
        >
          Your Email
        </label>
        <input
          id="login-email"
          type="email"
          name="email"
          autoComplete="email"
          value={credentials.email}
          onChange={handleInputChange}
          placeholder="name@mail.com"
          required
          className={inputClass}
        />
      </div>

      <div className="mb-5 text-left">
        <label
          htmlFor="login-password"
          className="block text-sm font-medium text-headingColor mb-1"
        >
          Password
        </label>
        <input
          id="login-password"
          type="password"
          name="password"
          autoComplete="current-password"
          value={credentials.password}
          onChange={handleInputChange}
          placeholder="********"
          required
          className={inputClass}
        />
      </div>

      {error && <p className="text-red-500 text-left text-sm mb-2">{error}</p>}

      <div className="mt-7">
        <Button
          color="primary"
          className="w-full"
          type="submit"
          disabled={loading}
        >
          {loading ? <Spinner size={25} color="#fff" /> : "Login"}
        </Button>
      </div>

      <p className="mt-4">
        Do not have an account?
        <Link href="/register" className="text-primaryColor font-medium ml-1">
          Register
        </Link>
      </p>
      <p className="mt-2">
        <Link href="/forgot-password" className="text-primaryColor font-medium">
          Forgot password?
        </Link>
      </p>
    </form>
  );
}
