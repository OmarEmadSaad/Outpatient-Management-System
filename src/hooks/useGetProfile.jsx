import { useState, useEffect, useCallback } from "react";
import { getDatabase, ref, get, child } from "firebase/database"; // Import 'child'

const useGetProfile = (relativePath, firebaseKey = null) => {
  // Renamed targetId to firebaseKey for clarity
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!relativePath || typeof relativePath !== "string") {
      setError("A valid relative path is required.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const db = getDatabase();
      let userRef;

      if (firebaseKey) {
        // If firebaseKey is provided, target the specific user node
        userRef = ref(db, `${relativePath}/${firebaseKey}`); // Correct path: users/FIREBASE_KEY
      } else {
        // If no specific key, fetch the entire collection (less common for a profile hook)
        userRef = ref(db, relativePath);
      }

      const snapshot = await get(userRef);

      if (!snapshot.exists()) {
        setData(null);
        setError(
          `No data found at path: /${relativePath}${
            firebaseKey ? "/" + firebaseKey : ""
          }`
        );
        console.warn(
          `No data found at path: /${relativePath}${
            firebaseKey ? "/" + firebaseKey : ""
          }`
        );
      } else {
        setData(snapshot.val()); // Directly set the value of the snapshot
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err.message || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, [relativePath, firebaseKey]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
};

export default useGetProfile;
