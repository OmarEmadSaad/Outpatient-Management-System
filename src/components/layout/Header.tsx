"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BiMenu } from "react-icons/bi";
import { toast } from "react-toastify";
import { useAuth } from "@/components/providers/AuthProvider";
import { dashboardPathForRole, ROLES } from "@/lib/shared/roles";
import logo from "@/assets/images/logo.png";
import userImg from "@/assets/images/avatar-icon.png";
import ThemeToggle from "./ThemeToggle";

const navLinks = [
  { path: "/", display: "Home" },
  { path: "/doctors", display: "Find a Doctor" },
  { path: "/services", display: "Services" },
  { path: "/contact", display: "Contact" },
];

const addDoctorClass =
  "bg-green-600 py-2 px-4 text-white font-[600] h-[44px] items-center justify-center rounded-[50px] cursor-pointer";

export default function Header() {
  const headerRef = useRef<HTMLElement | null>(null);
  const menuRef = useRef<HTMLElement | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const isAdmin = user?.role === ROLES.admin;

  useEffect(() => {
    const handleStickyHeader = () => {
      const isScrolled =
        document.body.scrollTop > 80 || document.documentElement.scrollTop > 80;
      headerRef.current?.classList.toggle("sticky__header", isScrolled);
    };
    window.addEventListener("scroll", handleStickyHeader, { passive: true });
    return () => window.removeEventListener("scroll", handleStickyHeader);
  }, []);

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out successfully!");
    router.push("/login");
  };

  const toggleMenu = () => menuRef.current?.classList.toggle("show__menu");
  const userPhoto = user?.photo || userImg.src;

  return (
    <header className="header flex items-center" ref={headerRef}>
      <div className="container">
        <div className="flex items-center justify-between">
          <div>
            <Image src={logo} alt="Logo" preload />
          </div>

          <nav
            className="navigation"
            aria-label="Main"
            ref={menuRef}
            onClick={toggleMenu}
          >
            <ul className="menu flex items-center gap-[2.7rem] flex-col md:flex-row">
              {navLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    href={link.path}
                    className={
                      pathname === link.path
                        ? "text-primaryColor text-[16px] leading-7 font-[600]"
                        : "text-textColor text-[16px] leading-7 font-[500] hover:text-primaryColor"
                    }
                  >
                    {link.display}
                  </Link>
                </li>
              ))}
              {isAdmin && (
                <li className="md:hidden">
                  <button
                    onClick={() => router.push("/register")}
                    className={`${addDoctorClass} flex w-full`}
                  >
                    Add Doctor
                  </button>
                </li>
              )}
            </ul>
          </nav>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <Link href={dashboardPathForRole(user.role)}>
                  <figure className="w-[50px] h-[80px] cursor-pointer">
                    <img
                      src={userPhoto}
                      width={50}
                      height={50}
                      className="w-[100%] h-[7vh] mt-[2em] rounded-full"
                      alt="My dashboard"
                    />
                  </figure>
                </Link>
                {isAdmin && (
                  <button
                    onClick={() => router.push("/register")}
                    className={`hidden md:flex ${addDoctorClass}`}
                  >
                    Add Doctor
                  </button>
                )}
                <button
                  onClick={handleLogout}
                  className="bg-red-600 py-2 px-4 text-white font-[600] h-[44px] flex items-center justify-center rounded-[50px] cursor-pointer"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link href="/login">
                <span className="bg-primaryColor py-2 px-6 text-white font-[600] h-[44px] flex items-center justify-center rounded-[50px] cursor-pointer">
                  Login
                </span>
              </Link>
            )}

            <ThemeToggle />

            <button
              type="button"
              className="md:hidden"
              onClick={toggleMenu}
              aria-label="Open menu"
            >
              <BiMenu className="w-6 h-6 cursor-pointer" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
