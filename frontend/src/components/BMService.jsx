import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { ENDPOINTS } from "../utilities/endpoints";
import { IoClose } from "react-icons/io5";
import CustomPagination from "./CustomPagination";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import UnauthorizedPage from "./UnauthorizedPage";
import ServerErrorPage from "./ServerErrorPage";
import { FaFilePdf, FaSync, FaSearch } from "react-icons/fa";

const CEOService = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionMessage, setRejectionMessage] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpAction, setOtpAction] = useState(null);
  const [errorType, setErrorType] = useState(null);
  const itemsPerPage = 5;

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageRequests = requests.slice(startIndex, endIndex);

  // Fetch service requests
  const fetchRequests = async () => {
    const accessToken = localStorage.getItem("authToken");
    if (!accessToken) {
      setErrorType("unauthorized");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(ENDPOINTS.LIST_SERVICE_REQUESTS, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        if (response.status === 401) setErrorType("unauthorized");
        else setErrorType("server");
        throw new Error("Failed to fetch service requests");
      }
      const data = await response.json();
      setRequests(data.results || []);
    } catch (error) {
      toast.error("Failed to fetch service requests.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch request detail
  const fetchRequestDetail = async (id) => {
    setDetailLoading(true);
    const accessToken = localStorage.getItem("authToken");
    if (!accessToken) {
      setErrorType("unauthorized");
      setDetailLoading(false);
      return;
    }
    try {
      const endpoint = ENDPOINTS.SERVICE_REQUEST_DETAIL(id);
      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) throw new Error("Failed to fetch request details");
      const data = await response.json();
      setSelectedRequest(data);
    } catch (error) {
      toast.error("Failed to fetch request details.");
      setSelectedRequest(null);
    } finally {
      setDetailLoading(false);
    }
  };

  // Send OTP for approve or reject
  const sendOtp = async (actionType) => {
    setOtpAction(actionType);
    setOtpValue("");
    setOtpModalOpen(true);
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
      toast.success("OTP sent to your phone");
    } catch (err) {
      toast.error(err.message);
      setOtpModalOpen(false);
    } finally {
      setOtpLoading(false);
    }
  };

  // Handle OTP verification and action (approve, reject)
  const handleOtpAction = async () => {
    setOtpLoading(true);
    try {
      const accessToken = localStorage.getItem("authToken");
      let body = { action: otpAction, otp_code: otpValue };
      if (otpAction === "reject") {
        body.rejection_message = rejectionMessage;
      }
      const endpoint = ENDPOINTS.SERVICE_REQUEST_ACTION(selectedRequest.id);
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) throw new Error(`Failed to ${otpAction} the service request`);

      await fetchRequests();
      setSelectedRequest(null);
      setRejectionMessage("");
      setOtpModalOpen(false);
      setOtpValue("");
      setOtpAction(null);
      toast.success(
        `Request ${
          otpAction === "approve" ? "approved" : "rejected"
        } successfully!`
      );
    } catch (error) {
      toast.error(`Failed to ${otpAction} the request.`);
    } finally {
      setOtpLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    fetchRequests();
  }, []);

  if (errorType === "unauthorized") return <UnauthorizedPage />;
  if (errorType === "server") return <ServerErrorPage />;

  return (
    <div className="container py-4">
      <ToastContainer />
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="mb-0 d-flex align-items-center">
          <FaFilePdf className="me-2 text-success" />
          CEO Service Requests
        </h1>
        <button
          className="btn btn-outline-success d-flex align-items-center"
          style={{ minWidth: "160px" }}
          onClick={fetchRequests}
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
                  <th>Requester's Car</th>
                  <th>Status</th>
                  <th className="text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="text-center py-5">
                      <div className="d-flex justify-content-center align-items-center">
                        <div className="spinner-border text-success" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                        <span className="ms-3">Loading service requests...</span>
                      </div>
                    </td>
                  </tr>
                ) : currentPageRequests.length > 0 ? (
                  currentPageRequests.map((request, index) => (
                    <tr key={request.id}>
                      <td>{startIndex + index + 1}</td>
                      <td>{new Date(request.created_at).toLocaleDateString()}</td>
                      <td>{request.vehicle || "N/A"}</td>
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
                    <td colSpan="5" className="text-center text-muted py-5">
                      <div className="py-4">
                        <FaFilePdf className="fs-1 text-muted mb-3" />
                        <p className="mb-1 fw-medium fs-5">
                          No service requests found.
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
          totalPages={Math.ceil(requests.length / itemsPerPage)}
          handlePageChange={setCurrentPage}
        />
      </div>
      {/* Modal for Viewing Details */}
      {selectedRequest && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Service Request Details</h5>
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
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p>Loading details...</p>
                  </div>
                ) : (
                  <>
                    <p>
                      <strong>Created At:</strong>{" "}
                      {selectedRequest.created_at
                        ? new Date(selectedRequest.created_at).toLocaleDateString()
                        : "N/A"}
                    </p>
                    <p>
                      <strong>Vehicle:</strong> {selectedRequest.vehicle || "N/A"}
                    </p>
                    <p>
                      <strong>Status:</strong> {selectedRequest.status}
                    </p>
                    <p>
                      <strong>Total Cost:</strong> {selectedRequest.service_total_cost} ETB
                    </p>
                    {selectedRequest.service_letter && (
                      <p>
                        <strong>Service Letter:</strong>{" "}
                        <a
                          href={selectedRequest.service_letter}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View Service Letter
                        </a>
                      </p>
                    )}
                    {selectedRequest.receipt_file && (
                      <p>
                        <strong>Receipt File:</strong>{" "}
                        <a
                          href={selectedRequest.receipt_file}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View Receipt
                        </a>
                      </p>
                    )}
                  </>
                )}
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  style={{ minWidth: "120px" }}
                  onClick={() => setSelectedRequest(null)}
                >
                  Close
                </button>
                <button
                  className="btn"
                  style={{ backgroundColor: "#181E4B", color: "white", minWidth: "120px" }}
                  onClick={() => {
                    setOtpAction("approve");
                    sendOtp("approve");
                  }}
                  disabled={actionLoading || detailLoading}
                >
                  Approve
                </button>
                <button
                  className="btn btn-danger"
                  style={{ minWidth: "120px" }}
                  onClick={() => {
                    setShowRejectModal(true);
                  }}
                  disabled={actionLoading || detailLoading}
                >
                  Reject
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
                    setOtpAction(null);
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
                  onClick={() => sendOtp(otpAction)}
                  disabled={otpLoading}
                >
                  Resend OTP
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setOtpModalOpen(false);
                    setOtpValue("");
                    setOtpAction(null);
                  }}
                  disabled={otpLoading}
                >
                  Cancel
                </button>
                <button
                  className="btn"
                  style={{ backgroundColor: "#181E4B", color: "white" }}
                  disabled={otpLoading || otpValue.length !== 6}
                  onClick={handleOtpAction}
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
                <button
                  className="btn btn-danger"
                  onClick={() => {
                    setShowRejectModal(false);
                    setOtpAction("reject");
                    sendOtp("reject");
                  }}
                  disabled={actionLoading}
                >
                  Reject (with OTP)
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

export default CEOService;