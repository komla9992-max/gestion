import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function PrivateRoute({ children, roles }) {
  const { currentUser } = useAuth();

  if (!currentUser) return <Navigate to="/login" />;

  if (roles && !roles.includes(currentUser.role)) {
    return <Navigate to="/unauthorized" />; // page à créer si nécessaire
  }

  return children;
}
