import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Logo from "../assets/Logo.jpg";
import { IoClose } from "react-icons/io5";
import { ENDPOINTS } from "../utilities/endpoints";
import CustomPagination from "./CustomPagination";
import UnauthorizedPage from "./UnauthorizedPage";
import ServerErrorPage from "./ServerErrorPage";
import { FaWrench, FaSync, FaSearch } from "react-icons/fa";

const CEOMaintenanceTable = () => {
  const [maintenanceRequests, setMaintenanceRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionMessage, setRejectionMessage] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpAction, setOtpAction] = useState(null); // "forward" or "reject"
  const [otpSent, setOtpSent] = useState(false);
  const [errorType, setErrorType] = useState(null); // "unauthorized" | "server" | null

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageRequests = maintenanceRequests.slice(startIndex, endIndex);

  // Fetch maintenance requests
  const fetchMaintenanceRequests = async () => {
    const accessToken = localStorage.getItem("authToken");
    if (!accessToken) {
      setErrorType("unauthorized");
      return;
    }
    try {
      const response = await fetch(ENDPOINTS.LIST_MAINTENANCE_REQUESTS, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        if (response.status === 401) setErrorType("unauthorized");
        else setErrorType("server");
        throw new Error("Failed to fetch maintenance requests");
      }
      const data = await response.json();
      setMaintenanceRequests(data.results || []);
    } catch (error) {
      console.error("Error fetching maintenance requests:", error);
      toast.error("Failed to fetch maintenance requests.");
    } finally {
      setLoading(false);
    }
  };

  // Send OTP using backend endpoint
  const sendOtp = async () => {
    setOtpLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(ENDPOINTS.OTP_REQUEST, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
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

  // Handle OTP verification and action (forward or reject)
  const handleOtpAction = async (otp, action) => {
    setOtpLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      let payload = { action, otp_code: otp };
      if (action === "reject") {
        if (!rejectionMessage.trim()) {
          toast.error("Rejection message cannot be empty.");
          setOtpLoading(false);
          return;
        }
        payload.rejection_message = rejectionMessage;
      }
      const response = await fetch(
        ENDPOINTS.MAINTENANCE_REQUEST_ACTION(selectedRequest.id),
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || `Failed to ${action} request`);
      }
      toast.success(
        action === "forward" ? "Request forwarded!" : "Request rejected!"
      );
      setSelectedRequest(null);
      setOtpModalOpen(false);
      setOtpValue("");
      setOtpSent(false);
      setOtpAction(null);
      setRejectionMessage("");
      fetchMaintenanceRequests();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setOtpLoading(false);
    }
  };

  // Handle actions (forward, reject)
  const handleAction = async (id, action) => {
    const accessToken = localStorage.getItem("authToken");
    if (!accessToken) {
      console.error("No access token found.");
      return;
    }
    setActionLoading(true);
    try {
      const body = { action };
      if (action === "reject") {
        body.rejection_message = rejectionMessage;
      }
      const response = await fetch(ENDPOINTS.MAINTENANCE_REQUEST_ACTION(id), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error(`Failed to ${action} the maintenance request`);
      fetchMaintenanceRequests();
      setSelectedRequest(null);
      toast.success(
        `Request ${action === "forward" ? "forwarded" : "rejected"} successfully!`
      );
    } catch (error) {
      console.error(`Error performing ${action} action:`, error);
      toast.error(`Failed to ${action} the request.`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmAction = () => {
    if (pendingAction && selectedRequest) {
      handleAction(selectedRequest.id, pendingAction);
    }
    setShowConfirmModal(false);
  };

  const handleRejectAction = () => {
    if (rejectionMessage.trim() && selectedRequest) {
      handleAction(selectedRequest.id, "reject");
      setShowRejectModal(false);
    } else {
      toast.error("Rejection message cannot be empty.");
    }
  };

  useEffect(() => {
    fetchMaintenanceRequests();
  }, []);

  if (errorType === "unauthorized") return <UnauthorizedPage />;
  if (errorType === "server") return <ServerErrorPage />;

  return (
    <div className="container py-4">
      <ToastContainer />
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="mb-0 d-flex align-items-center">
          <FaWrench className="me-2 text-success" />
          CEO Maintenance Requests
        </h1>
        <button
          className="btn btn-outline-success d-flex align-items-center"
          style={{ minWidth: "160px" }}
          onClick={fetchMaintenanceRequests}
        >
          <FaSync className="me-2" />
          Refresh
        </button>
      </div>
      <div className="card shadow-sm border-0 overflow-hidden">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>#</th>
                  <th>Date</th>
                  <th>Requester Name</th>
                  <th>Requester's Car</th>
                  <th>Status</th>
                  <th className="text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="text-center py-5">
                      <div className="d-flex justify-content-center align-items-center">
                        <div className="spinner-border text-success" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                        <span className="ms-3">Loading maintenance requests...</span>
                      </div>
                    </td>
                  </tr>
                ) : currentPageRequests.length > 0 ? (
                  currentPageRequests.map((request, index) => (
                    <tr key={request.id}>
                      <td>{startIndex + index + 1}</td>
                      <td>{new Date(request.date).toLocaleDateString()}</td>
                      <td>{request.requester_name || "N/A"}</td>
                      <td>{request.requesters_car_name || "N/A"}</td>
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
                          onClick={() => setSelectedRequest(request)}
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
                        <FaWrench className="fs-1 text-muted mb-3" />
                        <p className="mb-1 fw-medium fs-5">
                          No maintenance requests found.
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
      <div className="d-flex justify-content-center align-items-center" style={{ height: "100px" }}>
        <CustomPagination
          currentPage={currentPage}
          totalPages={Math.ceil(maintenanceRequests.length / itemsPerPage)}
          handlePageChange={setCurrentPage}
        />
      </div>

      {/* Modal for Viewing Details */}
      {selectedRequest && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <img
                  src={Logo}
                  alt="Logo"
                  style={{
                    width: "80px",
                    height: "50px",
                    marginRight: "10px",
                  }}
                />
                <h5 className="modal-title">Maintenance Request Details</h5>
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
                <p>
                  <strong>Date:</strong> {new Date(selectedRequest.date).toLocaleDateString()}
                </p>
                <p>
                  <strong>Reason:</strong> {selectedRequest.reason}
                </p>
                <p>
                  <strong>Requester Name:</strong> {selectedRequest.requester_name}
                </p>
                <p>
                  <strong>Requester's Car:</strong> {selectedRequest.requesters_car_name}
                </p>
                <p>
                  <strong>Status:</strong> {selectedRequest.status}
                </p>
                <p>
                  <strong>Current Approver Role:</strong> {selectedRequest.current_approver_role}
                </p>
                <p>
                  <strong>Maintenance Total Cost:</strong> {selectedRequest.maintenance_total_cost} ETB
                </p>
                <p>
                  <strong>Maintenance Letter:</strong>{" "}
                  <a
                    href={selectedRequest.maintenance_letter}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                  >
                    Download Maintenance Letter
                  </a>
                </p>
                <p>
                  <strong>Receipt File:</strong>{" "}
                  <a
                    href={selectedRequest.receipt_file}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                  >
                    Download Receipt
                  </a>
                </p>
                <p>
                  <strong>Rejection Message:</strong>{" "}
                  {selectedRequest.rejection_message || "N/A"}
                </p>
              </div>
              <div className="modal-footer">
                <button
                  className="btn"
                  style={{
                    backgroundColor: "#181E4B",
                    color: "white",
                    minWidth: "120px",
                  }}
                  onClick={async () => {
                    setOtpAction("forward");
                    setOtpModalOpen(true);
                    await sendOtp();
                  }}
                  disabled={actionLoading}
                >
                  Forward
                </button>
                <button
                  className="btn btn-danger"
                  style={{ minWidth: "120px" }}
                  onClick={async () => {
                    setOtpAction("reject");
                    setOtpModalOpen(true);
                    await sendOtp();
                  }}
                  disabled={actionLoading}
                >
                  Reject
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
                  Enter OTP and confirm {otpAction === "forward" ? "approval" : "rejection"}
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
                  className="btn"
                  style={{ backgroundColor: "#181E4B", color: "white" }}
                  disabled={otpLoading || otpValue.length !== 6}
                  onClick={() => handleOtpAction(otpValue, otpAction)}
                >
                  {otpAction === "forward" ? "Forward" : "Rejection"}
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
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirm Action</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowConfirmModal(false)}
                  aria-label="Close"
                >
                  <IoClose />
                </button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to forward this request?</p>
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowConfirmModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleConfirmAction}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Reject Request</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowRejectModal(false)}
                  aria-label="Close"
                >
                  <IoClose />
                </button>
              </div>
              <div className="modal-body">
                <textarea
                  className="form-control"
                  placeholder="Enter rejection reason"
                  value={rejectionMessage}
                  onChange={(e) => setRejectionMessage(e.target.value)}
                />
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowRejectModal(false)}
                >
                  Cancel
                </button>
                <button className="btn btn-danger" onClick={handleRejectAction}>
                  Reject
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
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
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

export default CEOMaintenanceTable;