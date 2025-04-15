import { useState } from "react";
import { LiefContext } from "../Context/MyContext";

export const AuthProvider = ({ children }) => {
  const [userId, setUserId] = useState(localStorage.getItem("user_id") || null);
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [role, setRole] = useState(localStorage.getItem("role") || null);

  const login = (userId, token, role) => {
    if (!userId || !token || !role) {
      console.error("Invalid login credentials");
      return;
    }
    console.log("login triggered");
    setUserId(userId);
    setToken(token);
    setRole(role);
    localStorage.setItem("user_id", userId);
    localStorage.setItem("token", token);
    localStorage.setItem("role", role);
  };

  const logout = () => {
    setUserId(null);
    setToken(null);
    setRole(null);
    localStorage.removeItem("user_id");
    localStorage.removeItem("token");
    localStorage.removeItem("role");
  };

  return (
    <LiefContext.Provider value={{ userId, token, role, login, logout }}>
      {children}
    </LiefContext.Provider>
  );
};