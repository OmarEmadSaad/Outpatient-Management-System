import { createContext, useContext, useEffect, useReducer } from "react";

const initialState = {
  user: null,
  role: localStorage.getItem("role") || null,
  token: localStorage.getItem("token") || null,
  userId: localStorage.getItem("userId") || null,
};

export const authContext = createContext(initialState);

const authReducer = (state, action) => {
  switch (action.type) {
    case "LOGIN_START":
      return {
        user: null,
        role: null,
        token: null,
        userId: null,
      };
    case "LOGIN_SUCCESS":
      return {
        user: action.payload.user,
        token: action.payload.token,
        role: action.payload.role,
        userId: action.payload.userId,
      };
    case "LOGOUT":
      return {
        user: null,
        role: null,
        token: null,
        userId: null,
      };
    default:
      return state;
  }
};

export const AuthContextProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    if (state.token) localStorage.setItem("token", state.token);
    else localStorage.removeItem("token");

    if (state.userId) localStorage.setItem("userId", state.userId);
    else localStorage.removeItem("userId");

    if (state.role) localStorage.setItem("role", state.role);
    else localStorage.removeItem("role");

    localStorage.removeItem("user");
  }, [state]);

  return (
    <authContext.Provider
      value={{
        user: state.user,
        token: state.token,
        role: state.role,
        userId: state.userId,
        dispatch,
      }}
    >
      {children}
    </authContext.Provider>
  );
};
