import React from "react";
import { useNavigate } from "react-router-dom";

const ROLE_CARDS = [
  {
    role: 2,
    label: "Department Manager",
    description: "Manage department vehicle requests.",
    path: "/department-manager/vehicle-request",
    color: "#4caf50",
    icon: "🏢"
  },
  {
    role: 3,
    label: "Finance Manager",
    description: "Oversee refueling and finance tasks.",
    path: "/finance-manager/refueling",
    color: "#ff9800",
    icon: "💰"
  },
  {
    role: 4,
    label: "Transport Manager",
    description: "Transport dashboard and vehicle operations.",
    path: "/transport-manager/dashbord",
    color: "#9c27b0",
    icon: "🚚"
  },
  {
    role: 5,
    label: "CEO",
    description: "Executive dashboard for CEOs.",
    path: "/ceo/dashbord",
    color: "#e91e63",
    icon: "👑"
  },
  {
    role: 6,
    label: "Driver",
    description: "Driver's high-cost schedule and assignments.",
    path: "/driver/high-cost-schedule",
    color: "#00bcd4",
    icon: "🚗"
  },
  {
    role: 8,
    label: "General Service Executor",
    description: "General service and refueling dashboard.",
    path: "/general-service/refueling",
    color: "#3f51b5",
    icon: "🛠️"
  },
  {
    role: 9,
    label: "Budget Manager",
    description: "Manage and monitor high cost and budget.",
    path: "/budget-manager/high_cost",
    color: "#8bc34a",
    icon: "📊"
  },
];

const ActorAccessPage = () => {
  const navigate = useNavigate();

  return (
    <div className="container py-5" style={{ minHeight: "100vh", background: "#f6f7fb" }}>
      <h2 className="mb-4 text-center fw-bold">Actors Access Panel</h2>
      <div className="row justify-content-center">
        {ROLE_CARDS.map((card) => (
          <div key={card.role} className="col-12 col-sm-6 col-md-4 col-lg-3 mb-4">
            <div
              className="card shadow-sm h-100"
              style={{
                borderRadius: "16px",
                border: "none",
                background: "#fff",
                cursor: "pointer",
                transition: "transform 0.14s",
              }}
              onClick={() => navigate(card.path)}
              onMouseEnter={e => e.currentTarget.style.transform = "scale(1.04)"}
              onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
            >
              <div
                className="card-body d-flex flex-column align-items-center justify-content-center"
                style={{
                  minHeight: 185,
                  padding: "2rem 1rem"
                }}
              >
                <div style={{
                  fontSize: "2.6rem",
                  marginBottom: ".5rem",
                  color: card.color
                }}>
                  {card.icon}
                </div>
                <h5 className="card-title fw-bold text-center" style={{ color: card.color }}>
                  {card.label}
                </h5>
                <p className="card-text text-muted text-center" style={{ fontSize: "0.98rem", minHeight: "55px" }}>
                  {card.description}
                </p>
              </div>
              <div className="card-footer text-center bg-transparent border-0">
                <button
                  className="btn"
                  style={{
                    backgroundColor: card.color,
                    color: "#fff",
                    borderRadius: "25px",
                    minWidth: "110px",
                    fontWeight: "500"
                  }}
                  onClick={e => {
                    e.stopPropagation();
                    navigate(card.path);
                  }}
                >
                  Access
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActorAccessPage;