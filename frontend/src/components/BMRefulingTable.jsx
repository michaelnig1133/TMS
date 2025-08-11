import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { ENDPOINTS } from "../utilities/endpoints";
import { IoClose } from "react-icons/io5";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Logo from "../assets/Logo.jpg";
import UnauthorizedPage from "./UnauthorizedPage";
import ServerErrorPage from "./ServerErrorPage";
import { FaGasPump, FaSearch, FaSync } from "react-icons/fa";

const RefuelingTable = () => {
  const [refuelingRequests, setRefuelingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionMessage, setRejectionMessage] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);

  // OTP states
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpAction, setOtpAction] = useState(null); // "approve" or "reject"

  // Error handling state
  const [errorType, setErrorType] = useState(null); // "unauthorized" | "server" | null

  // Fetches the list of requests
  const fetchRefuelingRequests = async () => {
    const accessToken = localStorage.getItem("authToken");
    if (!accessToken) {
      setErrorType("unauthorized");
      return;
    }
    try {
      const response = await fetch(ENDPOINTS.REFUELING_REQUEST_LIST, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        if (response.status === 401) setErrorType("unauthorized");
        else setErrorType("server");
        throw new Error("Failed to fetch refueling requests");
      }
      const data = await response.json();
      setRefuelingRequests(data.results || []);
    } catch (error) {
      console.error("Error fetching refueling requests:", error);
      toast.error("Failed to fetch refueling requests.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch detail for a single request
  const fetchRequestDetail = async (id) => {
    const accessToken = localStorage.getItem("authToken");
    if (!accessToken) {
      console.error("No access token found.");
      return;
    }
    setDetailLoading(true);
    try {
      const response = await fetch(ENDPOINTS.REFUELING_REQUEST_DETAIL(id), {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) throw new Error("Failed to fetch refueling request detail");
      const data = await response.json();
      setSelectedRequest(data);
    } catch (error) {
      console.error("Error fetching request details:", error);
      toast.error("Failed to fetch request details.");
    } finally {
      setDetailLoading(false);
    }
  };

  // OTP: Send OTP using backend endpoint
  const sendOtp = async () => {
    setOtpLoading(true);
    try {
      const accessToken = localStorage.getItem("authToken");
      const response = await fetch(ENDPOINTS.OTP_REQUEST, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });
      if (!response.ok) throw new Error("Failed to send OTP");
      setOtpSent(true);
      toast.success("OTP sent to your phone");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setOtpLoading(false);
    }
  };

  // Handle OTP verification and action (approve/reject)
  const handleOtpAction = async (otp, action) => {
    setOtpLoading(true);
    try {
      const accessToken = localStorage.getItem("authToken");
      let payload = {
        action: action === "approve" ? "approve" : "reject",
        otp_code: otp,
      };
      if (action === "reject") payload.rejection_message = rejectionMessage;
      const response = await fetch(
        ENDPOINTS.APPREJ_REFUELING_REQUEST(selectedRequest.id),
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );
      if (!response.ok) {
        const data = await response.json();
        throw new Error(
          data.detail || `Failed to ${action} the refueling request`
        );
      }
      await fetchRefuelingRequests();
      setSelectedRequest(null);
      setRejectionMessage("");
      setOtpModalOpen(false);
      setOtpValue("");
      setOtpSent(false);
      setOtpAction(null);
      toast.success(
        `Request ${
          action === "approve" ? "approved" : "rejected"
        } successfully!`
      );
    } catch (error) {
      toast.error(`Failed to ${action} the request.`);
    } finally {
      setOtpLoading(false);
      setActionLoading(false);
    }
  };

  // Show OTP modal and send OTP
  const handleActionWithOtp = async (actionType) => {
    setOtpAction(actionType);
    setOtpModalOpen(true);
    await sendOtp();
  };

  useEffect(() => {
    fetchRefuelingRequests();
  }, []);

  // Render error pages if needed
  if (errorType === "unauthorized") return <UnauthorizedPage />;
  if (errorType === "server") return <ServerErrorPage />;

  return (
    <div className="container py-4">
      <ToastContainer />
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="mb-0 d-flex align-items-center">
          <FaGasPump className="me-2 text-success" />
          Refueling Requests
        </h1>
        <button
          className="btn btn-outline-success d-flex align-items-center"
          onClick={fetchRefuelingRequests}
          disabled={loading}
        >
          <FaSync className={`me-2${loading ? " spin" : ""}`} />
          Refresh
        </button>
      </div>
      {loading ? (
        <div className="text-center">
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p>Loading refueling requests...</p>
        </div>
      ) : (
        <div className="card shadow-sm border-0 overflow-hidden">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>#</th>
                    <th>Date</th>
                    <th>Destination</th>
                    <th>Driver</th>
                    <th>Status</th>
                    <th className="text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {refuelingRequests.length > 0 ? (
                    refuelingRequests.map((request, index) => (
                      <tr key={request.id}>
                        <td>{index + 1}</td>
                        <td>{new Date(request.created_at).toLocaleDateString()}</td>
                        <td>{request.destination || "N/A"}</td>
                        <td>{request.requester_name || "N/A"}</td>
                        <td>
                          <span className={`badge ${
                            request.status === "pending"
                              ? "bg-warning text-dark"
                              : request.status === "approved"
                              ? "bg-success"
                              : request.status === "rejected"
                              ? "bg-danger"
                              : "bg-secondary"
                          } py-2 px-3`}>
                            {request.status
                              ? request.status.charAt(0).toUpperCase() +
                                request.status.slice(1)
                              : ""}
                          </span>
                        </td>
                        <td className="text-center">
                          <button
                            className="btn btn-sm btn-outline-success d-flex align-items-center"
                            onClick={() => fetchRequestDetail(request.id)}
                          >
                            <FaSearch className="me-1" />
                            View Detail
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center text-muted py-5">
                        <div className="py-4">
                          <FaGasPump className="fs-1 text-muted mb-3" />
                          <p className="mb-1 fw-medium fs-5">
                            No refueling requests found.
                          </p>
                          <small className="text-muted">
                            Check back later.
                          </small>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Viewing Details */}
      {selectedRequest && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <img
                  src={Logo}
                  alt="Logo"
                  style={{
                    width: "100px",
                    height: "70px",
                    marginRight: "10px",
                  }}
                />
                <h5 className="modal-title">Refueling Request Details</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setSelectedRequest(null)}
                  aria-label="Close"
                >
                  <IoClose />
                </button>
              </div>
              <div className="modal-body">
                {detailLoading ? (
                  <div className="text-center">
                    <div className="spinner-border text-success" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p>Loading details...</p>
                  </div>
                ) : (
                  <div className="container-fluid">
                    <div className="row">
                      <div className="col-md-6">
                        <p>
                          <strong>Request Date:</strong>{" "}
                          {new Date(selectedRequest.created_at).toLocaleString()}
                        </p>
                        <p>
                          <strong>Driver:</strong>{" "}
                          {selectedRequest.requester_name || "N/A"}
                        </p>
                        <p>
                          <strong>Vehicle:</strong>{" "}
                          {selectedRequest.requesters_car_name || "N/A"}
                        </p>
                        <p>
                          <strong>Destination:</strong>{" "}
                          {selectedRequest.destination || "N/A"}
                        </p>
                        <p>
                          <strong>Estimated Distance:</strong>{" "}
                          {selectedRequest.estimated_distance_km ?? "N/A"} km
                        </p>
                      </div>
                      <div className="col-md-6">
                        <p>
                          <strong>Fuel Type:</strong>{" "}
                          {selectedRequest.fuel_type || "N/A"}
                        </p>
                        <p>
                          <strong>Fuel Efficiency:</strong>{" "}
                          {selectedRequest.fuel_efficiency ?? "N/A"} km/L
                        </p>
                        <p>
                          <strong>Fuel Needed:</strong>{" "}
                          {selectedRequest.fuel_needed_liters ?? "N/A"} L
                        </p>
                        <p>
                          <strong>Fuel Price per Liter:</strong>{" "}
                          {selectedRequest.fuel_price_per_liter ?? "N/A"}
                        </p>
                        <p>
                          <strong>Total Cost:</strong>{" "}
                          {selectedRequest.total_cost ?? "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  className="btn"
                  style={{ backgroundColor: "#181E4B", color: "white", minWidth: "120px" }}
                  onClick={() => handleActionWithOtp("approve")}
                  disabled={actionLoading}
                >
                  {actionLoading ? "Processing..." : "Approve"}
                </button>
                <button
                  className="btn btn-danger"
                  style={{ minWidth: "120px" }}
                  onClick={() => handleActionWithOtp("reject")}
                  disabled={actionLoading}
                >
                  {actionLoading ? "Processing..." : "Reject"}
                </button>
                <button
                  className="btn btn-secondary"
                  style={{ minWidth: "120px" }}
                  onClick={() => setSelectedRequest(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* OTP Modal */}
      {otpModalOpen && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Enter OTP to {otpAction === "approve" ? "approve" : "reject"} request
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setOtpModalOpen(false);
                    setOtpValue("");
                    setOtpSent(false);
                    setOtpAction(null);
                    setRejectionMessage("");
                  }}
                  disabled={otpLoading}
                  aria-label="Close"
                >
                  <IoClose />
                </button>
              </div>
              <div className="modal-body">
                <p>Enter the OTP code sent to your phone number.</p>
                <div className="d-flex justify-content-center gap-2 mb-3">
                  {[...Array(6)].map((_, idx) => (
                    <input
                      key={idx}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      className="form-control text-center"
                      style={{
                        width: "40px",
                        height: "40px",
                        fontSize: "1.5rem",
                        borderRadius: "6px",
                        border: "1px solid #ccc",
                        boxShadow: "none",
                      }}
                      value={otpValue[idx] || ""}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "");
                        if (!val) return;
                        let newOtp = otpValue.split("");
                        newOtp[idx] = val;
                        if (val && idx < 5) {
                          const next = document.getElementById(`otp-input-${idx + 1}`);
                          if (next) next.focus();
                        }
                        setOtpValue(newOtp.join("").slice(0, 6));
                      }}
                      onKeyDown={(e) => {
                        if (
                          e.key === "Backspace" &&
                          !otpValue[idx] &&
                          idx > 0
                        ) {
                          const prev = document.getElementById(`otp-input-${idx - 1}`);
                          if (prev) prev.focus();
                        }
                      }}
                      id={`otp-input-${idx}`}
                      disabled={otpLoading}
                    />
                  ))}
                </div>
                {otpAction === "reject" && (
                  <textarea
                    className="form-control mt-3"
                    rows={2}
                    value={rejectionMessage}
                    onChange={(e) => setRejectionMessage(e.target.value)}
                    placeholder="Reason for rejection"
                    disabled={otpLoading}
                  />
                )}
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-link"
                  onClick={sendOtp}
                  disabled={otpLoading}
                >
                  Resend OTP
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setOtpModalOpen(false);
                    setOtpValue("");
                    setOtpSent(false);
                    setOtpAction(null);
                    setRejectionMessage("");
                  }}
                  disabled={otpLoading}
                >
                  Cancel
                </button>
                <button
                  className={`btn ${otpAction === "approve" ? "" : "btn-danger"}`}
                  style={
                    otpAction === "approve"
                      ? { backgroundColor: "#181E4B", color: "white" }
                      : {}
                  }
                  disabled={otpLoading || otpValue.length !== 6}
                  onClick={() => handleOtpAction(otpValue, otpAction)}
                >
                  {otpLoading
                    ? "Processing..."
                    : otpAction === "approve"
                    ? "Approve"
                    : "Reject"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <style jsx>{`
        .cursor-pointer {
          cursor: pointer;
        }
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .card {
          border-radius: 1rem;
          overflow: hidden;
        }
        .table th {
          background-color: #f8fafc;
          border-top: 1px solid #e9ecef;
          border-bottom: 2px solid #e9ecef;
        }
      `}</style>
    </div>
  );
};

export default RefuelingTable;