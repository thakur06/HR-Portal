import { useContext } from "react";
import { LiefContext } from "../Context/MyContext";

export const useAuth = () => {
  const context = useContext(LiefContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};