import { Link } from "react-router-dom";
import ServerError from "../assets/500.jpg";
const ServerErrorPage = () => {
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
        src={ServerError}
        alt="Server Error"
        style={{
          width: "160px",
          maxWidth: "80vw",
          marginBottom: "32px",
          opacity: 0.95,
        }}
      />
      <h1 style={{ fontSize: "2.7rem", margin: "0 0 8px 0", fontWeight: 700 }}>
        500
      </h1>
      <h2 style={{ fontSize: "1.4rem", margin: "0 0 8px 0", fontWeight: 400 }}>
        Server Error
      </h2>
      <div style={{ color: "#888", marginBottom: "24px", fontSize: "1rem" }}>
        Our servers encountered an internal error.
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
        Please try again later or contact support if the problem persists.
      </div>
      <div style={{ display: "flex", gap: "16px" }}>
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            window.location.reload();
          }}
          style={{
            color: "#ec931e",
            textDecoration: "underline",
            fontSize: "1rem",
            fontWeight: 500,
            letterSpacing: "0.02em",
            cursor: "pointer",
          }}
        >
          Please try again
        </a>
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
          Go to Home Page
        </Link>
      </div>
    </div>
  );
};

export default ServerErrorPage;
