import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import HashLoader from "react-spinners/HashLoader";
import Swal from "sweetalert2";
import { authContext } from "../../context/AuthContext";

import { ref, get, child, set, update } from "firebase/database";
import { db } from "../../../firebase/config";

const Patients = () => {
  const { userId, role } = useContext(authContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [admins, setAdmins] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!userId || userId === "null" || userId === "") {
        toast.error("Please log in to view patients.");
        navigate("/login");
        return;
      }

      if (role !== "admin") {
        toast.error("Access denied. Admin role required.");
        navigate("/home");
        return;
      }

      setLoading(true);
      try {
        const dbRef = ref(db);
        const usersSnapshot = await get(child(dbRef, "users"));

        const userMap = new Map();

        if (usersSnapshot.exists()) {
          usersSnapshot.forEach((childSnapshot) => {
            const user = {
              id: childSnapshot.key,
              ...childSnapshot.val(),
            };

            if (!userMap.has(user.id)) {
              userMap.set(user.id, user);
            }
          });
        }

        const allUsersData = Array.from(userMap.values());

        const regularUsers = allUsersData.filter(
          (user) =>
            (user.role === "patient" || !user.role) &&
            user.id !== userId &&
            !(user.id === "1" && user.role === "admin")
        );

        const currentAdmins = allUsersData.filter(
          (user) =>
            user.role === "admin" &&
            user.id !== userId &&
            !(user.id === "1" && user.role === "admin")
        );

        setUsers(regularUsers);
        setAdmins(currentAdmins);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load users: " + error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId, role, navigate]);

  const handleMakeAdmin = async (userToPromote) => {
    const result = await Swal.fire({
      title: "Confirm Promotion",
      text: `Are you sure you want to promote ${userToPromote.name} to admin?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, promote!",
      cancelButtonText: "Cancel",
      allowOutsideClick: false,
      allowEscapeKey: false,
    });

    if (!result.isConfirmed) return;

    try {
      const userRef = ref(db, `users/${userToPromote.id}`);
      await update(userRef, { role: "admin" });

      const updatedUser = { ...userToPromote, role: "admin" };
      setAdmins((prev) => [...prev, updatedUser]);
      setUsers((prev) => prev.filter((u) => u.id !== userToPromote.id));

      toast.success(`${userToPromote.name} has been promoted to admin`);
    } catch (error) {
      console.error("Error promoting user:", error);
      toast.error("Failed to promote user: " + error.message);
    }
  };

  const handleRemoveAdmin = async (adminToRemove) => {
    const result = await Swal.fire({
      title: "Confirm Demotion",
      text: `Are you sure you want to remove ${adminToRemove.name} from admins?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, demote!",
      cancelButtonText: "Cancel",
      allowOutsideClick: false,
      allowEscapeKey: false,
    });

    if (!result.isConfirmed) return;

    try {
      const adminRef = ref(db, `users/${adminToRemove.id}`);
      await update(adminRef, { role: "patient" });

      const updatedUser = { ...adminToRemove, role: "patient" };
      setUsers((prev) => [...prev, updatedUser]);
      setAdmins((prev) => prev.filter((a) => a.id !== adminToRemove.id));

      toast.success(`${adminToRemove.name} has been demoted to patient`);
    } catch (error) {
      console.error("Error demoting admin:", error);
      toast.error("Failed to remove admin: " + error.message);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <HashLoader size={40} color="#0066ff" />
        </div>
      ) : (
        <>
          <h1 className="text-2xl font-bold mb-6 text-blue-500">
            All Patients & Admins
          </h1>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white shadow-md rounded-lg border border-gray-200">
              <thead>
                <tr className="bg-gray-100 text-headingColor">
                  <th className="py-3 px-4 text-left text-sm font-semibold">
                    ID
                  </th>
                  <th className="py-3 px-4 text-left text-sm font-semibold">
                    Photo
                  </th>
                  <th className="py-3 px-4 text-left text-sm font-semibold">
                    Name
                  </th>
                  <th className="py-3 px-4 text-left text-sm font-semibold">
                    Email
                  </th>
                  <th className="py-3 px-4 text-left text-sm font-semibold">
                    Gender
                  </th>
                  <th className="py-3 px-4 text-left text-sm font-semibold">
                    Role
                  </th>
                  <th className="py-3 px-4 text-left text-sm font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 && admins.length === 0 ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="py-4 px-4 text-center text-textColor"
                    >
                      No users available.
                    </td>
                  </tr>
                ) : (
                  <>
                    {users.map((user) => (
                      <tr
                        key={user.id}
                        className="border-b hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-3 px-4 text-sm text-textColor">
                          {user.id}
                        </td>
                        <td className="py-3 px-4 text-sm text-textColor">
                          <img
                            src={user.photo}
                            alt={user.name}
                            className="w-10 h-10 rounded-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src =
                                "https://placehold.co/40x40/cccccc/000000?text=No+Img";
                            }}
                          />
                        </td>
                        <td className="py-3 px-4 text-sm text-textColor">
                          {user.name}
                        </td>
                        <td className="py-3 px-4 text-sm text-textColor">
                          {user.email}
                        </td>
                        <td className="py-3 px-4 text-sm text-textColor capitalize">
                          {user.gender}
                        </td>
                        <td className="py-3 px-4 text-sm text-textColor capitalize">
                          Patient
                        </td>
                        <td className="py-3 px-4 text-sm">
                          <button
                            type="button"
                            onClick={() => handleMakeAdmin(user)}
                            className="text-white bg-blue-600 px-3 py-1.5 rounded-md text-sm hover:bg-blue-700 mr-2"
                          >
                            Make Admin
                          </button>
                        </td>
                      </tr>
                    ))}
                    {admins.map((admin) => (
                      <tr
                        key={admin.id}
                        className="border-b hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-3 px-4 text-sm text-textColor">
                          {admin.id}
                        </td>
                        <td className="py-3 px-4 text-sm text-textColor">
                          <img
                            src={admin.photo}
                            alt={admin.name}
                            className="w-10 h-10 rounded-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src =
                                "https://placehold.co/40x40/cccccc/000000?text=No+Img";
                            }}
                          />
                        </td>
                        <td className="py-3 px-4 text-sm text-textColor">
                          {admin.name}
                        </td>
                        <td className="py-3 px-4 text-sm text-textColor">
                          {admin.email}
                        </td>
                        <td className="py-3 px-4 text-sm text-textColor capitalize">
                          {admin.gender}
                        </td>
                        <td className="py-3 px-4 text-sm text-textColor capitalize">
                          Admin
                        </td>
                        <td className="py-3 px-4 text-sm">
                          <button
                            type="button"
                            onClick={() => handleRemoveAdmin(admin)}
                            className="text-white bg-red-600 px-3 py-1.5 rounded-md text-sm hover:bg-red-700"
                          >
                            Remove Admin
                          </button>
                        </td>
                      </tr>
                    ))}
                  </>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default Patients;
