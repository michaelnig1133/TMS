import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const PrivateRoute = ({ children, allowedRoles }) => {
  const { auth } = useAuth();

  if (!auth || !auth.token) {
    return <Navigate to="/" replace />;
  }

  return allowedRoles.includes(auth.role) ? (
    children
  ) : (
    <Navigate to="/" replace />
  );
};

export default PrivateRoute;
