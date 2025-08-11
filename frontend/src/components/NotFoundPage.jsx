import { Link } from "react-router-dom";
import NotFound from "../assets/404.jpg";
const NotFoundPage = () => {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#fff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "inherit",
        color: "#222",
        padding: "32px 8px",
      }}
    >
      <img
        src={NotFound}
        alt="404"
        style={{
          width: "180px",
          maxWidth: "80vw",
          marginBottom: "32px",
          opacity: 0.95,
        }}
      />
      <h1 style={{ fontSize: "3rem", margin: "0 0 8px 0", fontWeight: 700 }}>
        404
      </h1>
      <h2 style={{ fontSize: "1.5rem", margin: "0 0 8px 0", fontWeight: 400 }}>
        Page Not Found
      </h2>
      <div style={{ color: "#888", marginBottom: "24px", fontSize: "1rem" }}>
        Oops! You're lost.
      </div>
      <div
        style={{
          color: "#666",
          marginBottom: "32px",
          maxWidth: "400px",
          textAlign: "center",
          fontSize: "1rem",
        }}
      >
        The page you are looking for might have been removed, had its name
        changed, or is temporarily unavailable.
      </div>
      <Link
        to="/"
        style={{
          color: "#ec931e",
          textDecoration: "underline",
          fontSize: "1rem",
          fontWeight: 500,
          letterSpacing: "0.02em",
        }}
      >
        Back to Home
      </Link>
    </div>
  );
};

export default NotFoundPage;
