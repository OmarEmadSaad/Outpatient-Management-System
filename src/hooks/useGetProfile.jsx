import { useState, useEffect, useCallback } from "react";
import { getDatabase, ref, get } from "firebase/database";

const useGetProfile = (relativePath, targetId = null) => {
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
      const dataRef = ref(db, relativePath);
      const snapshot = await get(dataRef);

      if (!snapshot.exists()) {
        setData(null);
        console.warn(`No data found at path: /${relativePath}`);
      } else {
        const result = snapshot.val();

        if (targetId) {
          if (typeof result === "object" && result !== null) {
            const foundItem = Object.values(result).find(
              (item) => item && item.id === targetId
            );

            if (foundItem) {
              setData(foundItem);
            } else {
              setData(null);
              console.warn(
                `Item with ID ${targetId} not found in collection at path: /${relativePath}`
              );
            }
          } else {
            setData(null);
            console.warn(
              `Expected an object collection at path /${relativePath} to find ID ${targetId}, but got:`,
              result
            );
          }
        } else {
          if (typeof result === "object" && result !== null) {
            const isCollection = Object.keys(result).some(
              (key) =>
                typeof result[key] === "object" &&
                result[key] !== null &&
                result[key].id
            );

            if (isCollection) {
              setData(Object.values(result));
            } else {
              setData(result);
            }
          } else {
            setData(result);
          }
        }
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err.message || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, [relativePath, targetId]);

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
