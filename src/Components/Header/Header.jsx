import { useEffect, useRef, useContext, useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { BiMenu } from "react-icons/bi";
import { authContext } from "../../context/AuthContext";
import { toast } from "react-toastify";
import { User_URL, doctor_URL, admin_URL } from "../../config";
import logo from "../../assets/images/logo.png";
import userImg from "../../assets/images/avatar-icon.png";

const navLinks = [
  { path: "/home", display: "Home" },
  { path: "/doctors", display: "Find a Doctor" },
  { path: "/services", display: "Services" },
  { path: "/Contcat", display: "Contcat" },
];

function Header() {
  const headerRef = useRef(null);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const { user, userId, dispatch } = useContext(authContext);
  const [fetchedUser, setFetchedUser] = useState(null);

  const isLoggedIn =
    localStorage.getItem("token") && localStorage.getItem("role");

  const fetchUserData = async () => {
    const storedUserId = localStorage.getItem("userId");
    const role = localStorage.getItem("role");

    if (
      !isLoggedIn ||
      !storedUserId ||
      storedUserId === "null" ||
      storedUserId === ""
    ) {
      setFetchedUser(null);
      return;
    }

    let baseUrl;
    if (role === "doctor") {
      baseUrl = doctor_URL.replace(".json", "");
    } else if (role === "admin") {
      baseUrl = admin_URL.replace(".json", "");
    } else {
      baseUrl = User_URL.replace(".json", "");
    }

    const endpoint = `${baseUrl}/${storedUserId}.json`;

    try {
      const res = await fetch(endpoint);
      if (!res.ok) {
        console.error("Request failed:", res.status);
        setFetchedUser(null);
        return;
      }
      const data = await res.json();
      setFetchedUser(data);
    } catch (err) {
      setFetchedUser(null);
      console.error("Error fetching user data:", err);
    }
  };

  useEffect(() => {
    fetchUserData();

    const handleStorageChange = () => {
      fetchUserData();
    };

    window.addEventListener("customStorageChange", handleStorageChange);

    return () => {
      window.removeEventListener("customStorageChange", handleStorageChange);
    };
  }, [userId, localStorage.getItem("role")]);

  useEffect(() => {
    const handleStickyHeader = () => {
      if (
        document.body.scrollTop > 80 ||
        document.documentElement.scrollTop > 80
      ) {
        headerRef.current.classList.add("sticky__header");
      } else {
        headerRef.current.classList.remove("sticky__header");
      }
    };

    window.addEventListener("scroll", handleStickyHeader);
    return () => window.removeEventListener("scroll", handleStickyHeader);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("userId");
    localStorage.removeItem("user");

    dispatch({ type: "LOGOUT" });

    toast.success("Logged out successfully!");
    setFetchedUser(null);
    navigate("/login");
    window.dispatchEvent(new Event("customStorageChange"));
  };

  const handleAddDoctor = () => {
    navigate("/register");
  };

  const toggleMenu = () => menuRef.current.classList.toggle("show__menu");

  const userPhoto =
    fetchedUser?.photo && fetchedUser.photo !== ""
      ? fetchedUser.photo
      : user?.photo && user.photo !== ""
      ? user.photo
      : userImg;

  return (
    <header className="header flex items-center" ref={headerRef}>
      <div className="container">
        <div className="flex items-center justify-between">
          <div>
            <img src={logo} alt="Logo" />
          </div>

          <div className="navigation" ref={menuRef} onClick={toggleMenu}>
            <ul className="menu flex items-center gap-[2.7rem] flex-col md:flex-row">
              {navLinks.map((link, index) => (
                <li key={index}>
                  <NavLink
                    to={link.path}
                    className={(navClass) =>
                      navClass.isActive
                        ? "text-primaryColor text-[16px] leading-7 font-[600]"
                        : "text-textColor text-[16px] leading-7 font-[500] hover:text-primaryColor"
                    }
                  >
                    {link.display}
                  </NavLink>
                </li>
              ))}
              {isLoggedIn && localStorage.getItem("role") === "admin" && (
                <li className="md:hidden">
                  <button
                    onClick={handleAddDoctor}
                    className="bg-green-600 py-2 px-4 text-white font-[600] h-[44px] flex items-center justify-center rounded-[50px] cursor-pointer w-full"
                  >
                    Add Doctor
                  </button>
                </li>
              )}
            </ul>
          </div>

          <div className="flex items-center gap-4">
            {isLoggedIn && (user || fetchedUser) ? (
              <div className="flex items-center gap-4">
                <Link
                  to={
                    localStorage.getItem("role") === "doctor"
                      ? "/doctors/profile/me"
                      : localStorage.getItem("role") === "admin"
                      ? "/admin/profile/me"
                      : "/user/profile/me"
                  }
                >
                  <figure className="w-[50px] h-[80px] cursor-pointer">
                    <img
                      src={userPhoto}
                      className="w-[100%] h-[7vh] mt-[2em] rounded-full"
                      alt="User Avatar"
                    />
                  </figure>
                </Link>
                {localStorage.getItem("role") === "admin" && (
                  <button
                    onClick={handleAddDoctor}
                    className="hidden md:flex bg-green-600 py-2 px-4 text-white font-[600] h-[44px] items-center justify-center rounded-[50px] cursor-pointer"
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
              <Link to="/login">
                <button className="bg-primaryColor py-2 px-6 text-white font-[600] h-[44px] flex items-center justify-center rounded-[50px] cursor-pointer">
                  Login
                </button>
              </Link>
            )}

            <label className="swap swap-rotate">
              <input
                type="checkbox"
                className="theme-controller"
                value="coffee"
              />
              <svg
                className="swap-off h-10 w-10 fill-current"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
              >
                <path d="M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17ZM5,12a1,1,0,0,0-1-1H3a1,1,0,0,0,0,2H4A1,1,0,0,0,5,12Zm7-7a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4A1,1,0,0,0,12,5ZM5.64,7.05a1,1,0,0,0,.7.29,1,1,0,0,0,.71-.29,1,1,0,0,0,0-1.41l-.71-.71A1,1,0,0,0,4.93,6.34Zm12,.29a1,1,0,0,0,.7-.29l.71-.71a1,1,0,1,0-1.41-1.41L17,5.64a1,1,0,0,0,0,1.41A1,1,0,0,0,17.66,7.34ZM21,11H20a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2Zm-9,8a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V20A1,1,0,0,0,12,19ZM18.36,17A1,1,0,0,0,17,18.36l.71.71a1,1,0,0,0,1.41,0,1,1,0,0,0,0-1.41ZM12,6.5A5.5,5.5,0,1,0,17.5,12,5.51,5.51,0,0,0,12,6.5Zm0,9A3.5,3.5,0,1,1,15.5,12,3.5,3.5,0,0,1,12,15.5Z" />
              </svg>
              <svg
                className="swap-on h-10 w-10 fill-current"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
              >
                <path d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Zm-9.5,6.69A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z" />
              </svg>
            </label>

            <span className="md:hidden" onClick={toggleMenu}>
              <BiMenu className="w-6 h-6 cursor-pointer" />
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
