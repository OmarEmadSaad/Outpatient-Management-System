import { useState, useEffect, useCallback } from "react";
import { ref, get } from "firebase/database";
import { db } from "../../firebase/config";

const UseFetchDate = (path) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const validatePath = (p) => {
    if (!p || typeof p !== "string") {
      return null;
    }
    const cleanedPath = p
      .replace(/^https?:\/\/[^/]+\//, "")
      .replace(/\.json$/, "");

    if (cleanedPath !== p) {
      console.warn(
        `Path '${p}' was sanitized to '${cleanedPath}' for Firebase SDK.`
      );
    }
    return cleanedPath;
  };

  const fetchData = useCallback(async () => {
    const sanitizedPath = validatePath(path);

    if (!sanitizedPath) {
      if (path === null) {
        setLoading(false);
      } else {
        setError("Invalid path provided to UseFetchDate hook.");
        setLoading(false);
      }
      setData(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const dataRef = ref(db, sanitizedPath);
      const snapshot = await get(dataRef);

      if (!snapshot.exists()) {
        setData(null);
        console.warn(`No data found at path: /${sanitizedPath}`);
      } else {
        const result = snapshot.val();

        if (
          typeof result === "object" &&
          result !== null &&
          !Array.isArray(result)
        ) {
          const isCollection = Object.keys(result).some(
            (key) => typeof result[key] === "object" && result[key] !== null
          );

          if (isCollection) {
            const itemsArray = Object.keys(result).map((key) => ({
              id: result[key].id || key,
              ...result[key],
            }));
            setData(itemsArray);
          } else {
            const lastPathSegment = sanitizedPath.split("/").pop();
            setData({
              id: result.id || lastPathSegment,
              ...result,
            });
          }
        } else {
          setData(result);
        }
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err.message || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, [path]);

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

export default UseFetchDate;
