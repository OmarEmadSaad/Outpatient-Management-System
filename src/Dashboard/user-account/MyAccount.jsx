import { useContext, useState } from "react";
import { authContext } from "../../context/AuthContext";
import MyBookings from "./MyBookings";
import Profile from "./Profile";
import { BASE_URL, token } from "../../config";
import Loading from "../../Components/Loader/Loading";
import Error from "../../Components/Error/Error";
import Swal from "sweetalert2";
import HashLoader from "react-spinners/HashLoader";
import useGetProfile from "../../hooks/useGetProfile";

const MyAccount = () => {
  const { dispatch, userId } = useContext(authContext);
  const [tab, setTab] = useState("bookings");
  const [loading, setLoading] = useState(false);

  const {
    data: userData,
    loading: profileLoading,
    error,
  } = useGetProfile("users", userId);

  const handleDeleteAccount = async () => {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        setLoading(true);
        try {
          const res = await fetch(`${BASE_URL}/users/${userId}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) throw new Error("Failed to delete account");

          Swal.fire({
            title: "Deleted!",
            text: "Your account has been deleted.",
            icon: "success",
          });

          dispatch({ type: "LOGOUT" });
        } catch (error) {
          Swal.fire({
            title: "Error!",
            text: error.message,
            icon: "error",
          });
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const defaultAvatar =
    "https://static.vecteezy.com/system/resources/previews/009/292/244/non_2x/default-avatar-icon-of_social_media_user_vector.jpg";

  return (
    <section>
      <div className="max-w-[1170px] px-5 mx-auto">
        {profileLoading && !error && <Loading />}
        {error && !profileLoading && <Error errMessage={error} />}

        {!profileLoading && !error && (
          <div className="grid md:grid-cols-3 gap-10">
            <div className="pb-[50px] px-[30px] rounded-md">
              <div className="flex items-center justify-center">
                <figure className="w-[100px] h-[100px] rounded-full border-2 border-solid border-primaryColor mt-1">
                  <img
                    src={userData?.photo || defaultAvatar}
                    className="w-full h-full rounded-full"
                    alt="Avatar"
                  />
                </figure>
              </div>

              <div className="text-center mt-4">
                <h3 className="text-[18px] leading-[30px] text-headingColor font-bold">
                  {userData?.name || "N/A"}
                </h3>
                <p className="text-textColor text-[15px] leading-6 font-medium">
                  {userData?.email || "N/A"}
                </p>
                <p className="text-textColor text-[15px] leading-6 font-medium">
                  Blood Type:
                  <span className="ml-2 text-headingColor text-[22px] leading-8">
                    {userData?.bloodType || "N/A"}
                  </span>
                </p>
              </div>
              <div className="mt-[50px] md:mt-[100px]">
                <button
                  onClick={handleDeleteAccount}
                  disabled={loading}
                  className="btn btn-info p-3 mt-4 bg-red-600 border-none rounded-md w-full text-white disabled:opacity-50"
                >
                  {loading ? (
                    <HashLoader size={25} color="#ffffff" />
                  ) : (
                    "Delete Account"
                  )}
                </button>
              </div>
            </div>
            <div className="md:col-span-2 md:px-[30px]">
              <div>
                <button
                  onClick={() => setTab("bookings")}
                  className={`${
                    tab === "bookings" &&
                    "bg-primaryColor font-normal text-white"
                  } p-2 mr-5 btn px-5 mt-2 rounded-md text-headingColor font-semibold text-[16px]
                  leading-7 border border-solid border-primaryColor`}
                >
                  My Bookings
                </button>
                <button
                  onClick={() => setTab("settings")}
                  className={`${
                    tab === "settings" &&
                    "bg-primaryColor font-normal text-white"
                  } p-2 btn mr-5 px-5 mt-2 rounded-md text-headingColor font-semibold text-[16px]
                  leading-7 border border-solid border-primaryColor`}
                >
                  Profile Settings
                </button>
              </div>
              {tab === "bookings" && <MyBookings />}
              {tab === "settings" && <Profile user={userData} />}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default MyAccount;
