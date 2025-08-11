import { Navigate } from "react-router-dom";

// ProtectedRoute checks if the user is authenticated
const ProtectedRoute = ({ isAuthenticated, children }) => {
  if (!isAuthenticated) {
    // If not authenticated, navigate to login page or show a message
    return <Navigate to="/-login" />;
  }

  return children; // Return children components if authenticated
};

export default ProtectedRoute;
