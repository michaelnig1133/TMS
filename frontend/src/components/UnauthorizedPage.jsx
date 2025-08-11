import { Link } from "react-router-dom";
import Unauthorized from "../assets/401.jpg";
const UnauthorizedPage = () => {
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
        src={Unauthorized}
        alt="Unauthorized"
        style={{
          width: "140px",
          maxWidth: "80vw",
          marginBottom: "32px",
          opacity: 0.95,
        }}
      />
      <h1 style={{ fontSize: "2.5rem", margin: "0 0 8px 0", fontWeight: 700 }}>
        401
      </h1>
      <h2 style={{ fontSize: "1.3rem", margin: "0 0 8px 0", fontWeight: 400 }}>
        Unauthorized Access
      </h2>
      <div style={{ color: "#888", marginBottom: "24px", fontSize: "1rem" }}>
        You don't have permission to access this page.
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
        Please login
      </Link>
    </div>
  );
};

export default UnauthorizedPage;
