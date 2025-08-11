import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { ENDPOINTS } from "../utilities/endpoints";
import { IoClose } from "react-icons/io5";
import CustomPagination from "./CustomPagination";
import { Eye } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Logo from "../assets/Logo.jpg";
import UnauthorizedPage from "./UnauthorizedPage";
import ServerErrorPage from "./ServerErrorPage";
import { FaWrench, FaSearch, FaSync } from "react-icons/fa";

const GSmaintenance = () => {
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
  const [maintenanceLetter, setMaintenanceLetter] = useState(null);
  const [receiptFile, setReceiptFile] = useState(null);
  const [maintenanceTotalCost, setMaintenanceTotalCost] = useState("");
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpAction, setOtpAction] = useState(null);
  const [otpSent, setOtpSent] = useState(false);
  const [errorType, setErrorType] = useState(null);
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageRequests = maintenanceRequests.slice(startIndex, endIndex);

  const handleFileChange = (e, setFile) => {
    const file = e.target.files[0];
    if (file && file.type === "application/pdf") {
      setFile(file);
    } else {
      toast.error("Please upload a valid PDF file.");
    }
  };

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

  // Handle OTP verification and action (approve or reject)
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
        action === "forward" ? "Request Forwarded!" : "Request rejected!"
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
    if (!maintenanceLetter || !receiptFile || !maintenanceTotalCost) {
      toast.error(
        "Please upload all required files and provide the total cost before proceeding."
      );
      return;
    }

    const accessToken = localStorage.getItem("authToken");

    if (!accessToken) {
      console.error("No access token found.");
      return;
    }

    setActionLoading(true);
    try {
      const body = { action };
      if (action === "reject") {
        if (!rejectionMessage.trim()) {
          toast.error("Rejection message cannot be empty.");
          return;
        }
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
      toast.success(`Request ${action}ed successfully.`);
    } catch (error) {
      console.error(`Error performing ${action} action:`, error);
      toast.error(`Failed to ${action} the maintenance request.`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitFiles = async (id) => {
    const accessToken = localStorage.getItem("authToken");

    if (!accessToken) {
      console.error("No access token found.");
      return;
    }

    if (!maintenanceLetter || !receiptFile || !maintenanceTotalCost) {
      toast.error(
        "Please upload all required files and provide the total cost."
      );
      return;
    }

    const formData = new FormData();
    formData.append("maintenance_letter_file", maintenanceLetter);
    formData.append("maintenance_receipt_file", receiptFile);
    formData.append("maintenance_total_cost", maintenanceTotalCost);

    try {
      const response = await fetch(ENDPOINTS.SUBMIT_MAINTENANCE_FILES(id), {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Backend response:", errorText);
        throw new Error("Failed to submit maintenance files");
      }

      toast.success("Files submitted successfully!");
      fetchMaintenanceRequests();
    } catch (error) {
      console.error("Error submitting maintenance files:", error);
      toast.error("Failed to submit maintenance files.");
    }
  };

  const handleConfirmAction = () => {
    if (pendingAction && selectedRequest) {
      handleAction(selectedRequest.id, pendingAction);
    }
    setShowConfirmModal(false);
  };

  const handleRejectAction = () => {
    if (!rejectionMessage.trim()) {
      toast.error("Rejection message cannot be empty.");
      return;
    }
    if (selectedRequest) {
      handleAction(selectedRequest.id, "reject");
      setShowRejectModal(false);
    }
  };

  useEffect(() => {
    fetchMaintenanceRequests();
  }, []);

  if (errorType === "unauthorized") return <UnauthorizedPage />;
  if (errorType === "server") return <ServerErrorPage />;

  const handleOtpChange = (e, idx) => {
    const value = e.target.value.replace(/\D/g, "");
    if (!value) return;
    const newOtp = [...otpDigits];
    newOtp[idx] = value[0];
    setOtpDigits(newOtp);
    if (value && idx < 5) document.getElementById(`otp-input-${idx + 1}`).focus();
  };

  const handleOtpKeyDown = (e, idx) => {
    if (e.key === "Backspace" && !otpDigits[idx] && idx > 0) {
      document.getElementById(`otp-input-${idx - 1}`).focus();
    }
  };

  const otpValueCombined = otpDigits.join("");

  return (
    <div className="container py-4">
      <ToastContainer />
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="mb-0 d-flex align-items-center">
          <FaWrench className="me-2 text-success" />
          Maintenance Requests
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
      {loading ? (
        <div className="text-center">
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p>Loading maintenance requests...</p>
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
                    <th>Requester Name</th>
                    <th>Requester's Car</th>
                    <th>Status</th>
                    <th className="text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {currentPageRequests.length > 0 ? (
                    currentPageRequests.map((request, index) => (
                      <tr key={request.id}>
                        <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
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
                            Create a new request or check back later.
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
      <div className="d-flex justify-content-center align-items-center" style={{ height: "100px" }}>
        <CustomPagination
          currentPage={currentPage}
          totalPages={Math.ceil(maintenanceRequests.length / itemsPerPage)}
          handlePageChange={(page) => setCurrentPage(page)}
        />
      </div>

      {/* Modal for Viewing Details */}
      {selectedRequest && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <div className="d-flex align-items-center">
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
                </div>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setSelectedRequest(null)}
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
                  <a href="http://lms.gdop.gov.et">
                    <strong>Message to Maintenance Provider</strong>
                  </a>
                </p>
                <div className="mb-3">
                  <label htmlFor="maintenanceLetter" className="form-label">
                    Maintenance Letter (PDF) <span style={{ color: "red" }}>*</span>
                  </label>
                  <input
                    type="file"
                    className="form-control"
                    id="maintenanceLetter"
                    accept="application/pdf"
                    onChange={(e) => handleFileChange(e, setMaintenanceLetter)}
                  />
                  {maintenanceLetter && (
                    <button
                      className="btn"
                      onClick={() =>
                        window.open(
                          URL.createObjectURL(maintenanceLetter),
                          "_blank"
                        )
                      }
                    >
                      <Eye />
                    </button>
                  )}
                </div>

                <div className="mb-3">
                  <label htmlFor="receiptFile" className="form-label">
                    Receipt File (PDF) <span style={{ color: "red" }}>*</span>
                  </label>
                  <input
                    type="file"
                    className="form-control"
                    id="receiptFile"
                    accept="application/pdf"
                    onChange={(e) => handleFileChange(e, setReceiptFile)}
                  />
                  {receiptFile && (
                    <button
                      className="btn"
                      onClick={() =>
                        window.open(URL.createObjectURL(receiptFile), "_blank")
                      }
                    >
                      <Eye />
                    </button>
                  )}
                </div>

                <div className="mb-3">
                  <label htmlFor="maintenanceTotalCost" className="form-label">
                    Total Cost <span style={{ color: "red" }}>*</span>
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    id="maintenanceTotalCost"
                    value={maintenanceTotalCost}
                    onChange={(e) => setMaintenanceTotalCost(e.target.value)}
                    placeholder="Enter total cost"
                  />
                </div>

                <div className="mb-3">
                  <button
                    className="btn"
                    style={{
                      backgroundColor: "#181E4B",
                      color: "white",
                      width: "120px",
                    }}
                    onClick={() => handleSubmitFiles(selectedRequest.id)}
                  >
                    Submit Files
                  </button>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  className="btn"
                  style={{ backgroundColor: "#181E4B", color: "white" }}
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
                  Enter OTP and confirm {otpAction === "forward" ? "forward" : "rejection"}
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
                    setOtpDigits(["", "", "", "", "", ""]);
                  }}
                  disabled={otpLoading}
                >
                  <IoClose />
                </button>
              </div>
              <div className="modal-body">
                <p>Enter the OTP code sent to your phone number.</p>
                <div className="d-flex justify-content-center gap-2 mb-3">
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      id={`otp-input-${idx}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      className="form-control text-center"
                      style={{
                        width: "40px",
                        height: "40px",
                        fontSize: "1.5rem",
                        borderRadius: "8px",
                        border: "1px solid #ccc",
                      }}
                      value={digit}
                      onChange={(e) => handleOtpChange(e, idx)}
                      onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                      disabled={otpLoading}
                      autoFocus={idx === 0}
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
                  style={{ color: "#181E4B", width: "160px" }}
                  onClick={() => sendOtp()}
                  disabled={otpLoading}
                >
                  Resend OTP
                </button>
                <button
                  className="btn"
                  style={{ backgroundColor: "#181E4B", color: "white" }}
                  disabled={otpLoading || otpValueCombined.length !== 6}
                  onClick={() => handleOtpAction(otpValueCombined, otpAction)}
                >
                  {otpAction === "forward" ? "Forward" : "Reject"}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setOtpModalOpen(false);
                    setOtpValue("");
                    setOtpSent(false);
                    setOtpAction(null);
                    setRejectionMessage("");
                    setOtpDigits(["", "", "", "", "", ""]);
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

export default GSmaintenance;