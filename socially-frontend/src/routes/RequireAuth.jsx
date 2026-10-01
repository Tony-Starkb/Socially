import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RequireAuth({ children }) {
  const { status } = useAuth();
  const location = useLocation();

  if (status === "loading") return null; // could swap for a splash/spinner
  if (status === "signed-out") {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}
