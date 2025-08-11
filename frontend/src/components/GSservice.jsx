import React, { useEffect, useState } from "react";
import { ENDPOINTS } from "../utilities/endpoints";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import UnauthorizedPage from "./UnauthorizedPage";
import ServerErrorPage from "./ServerErrorPage";
import { FaSync, FaSearch, FaFilePdf } from "react-icons/fa";
import { MdOutlineClose } from "react-icons/md"; // Import the MdOutlineClose icon
import Button from "@mui/material/Button"; // Assuming MUI Button component

const ListServiceRequestsTable = () => {
  const [serviceRequests, setServiceRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [maintenanceLetter, setMaintenanceLetter] = useState(null);
  const [receiptFile, setReceiptFile] = useState(null);
  const [maintenanceTotalCost, setMaintenanceTotalCost] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // OTP integration
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [otpAction, setOtpAction] = useState(null); // "forward" or "reject"
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false); // To track if OTP was sent
  const [rejectionMessage, setRejectionMessage] = useState(""); // For rejection reason

  const [mylanguage, setMylanguage] = useState("EN"); // State for language

  const [errorType, setErrorType] = useState(null); // "unauthorized" | "server" | null

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      setErrorType("unauthorized");
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(ENDPOINTS.LIST_SERVICE_REQUESTS, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })
      .then((res) => {
        if (!res.ok) {
          if (res.status === 401) {
            setErrorType("unauthorized");
          } else {
            setErrorType("server");
          }
          throw new Error("Failed to fetch");
        }
        return res.json();
      })
      .then((data) => {
        setServiceRequests(data.results || []);
      })
      .catch(() => setServiceRequests([]))
      .finally(() => setLoading(false));
  };

  const handleFileChange = (e, setter) => {
    if (e.target.files && e.target.files[0]) {
      setter(e.target.files[0]);
    }
  };

  const handleSubmitFiles = async (requestId) => {
    if (!maintenanceLetter || !receiptFile || !maintenanceTotalCost) {
      toast.error(
        "Please upload all required files and provide the total cost."
      );
      return;
    }
    setActionLoading(true);
    const token = localStorage.getItem("authToken");
    const formData = new FormData();
    formData.append("service_letter", maintenanceLetter);
    formData.append("receipt_file", receiptFile);
    formData.append("service_total_cost", maintenanceTotalCost);

    try {
      const response = await fetch(ENDPOINTS.SUBMIT_SERVICE_FILES(requestId), {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      if (!response.ok) throw new Error("Failed to submit files.");
      toast.success("Files submitted successfully!");
      fetchRequests();
    } catch (error) {
      toast.error(error.message || "Failed to submit files.");
    } finally {
      setActionLoading(false);
    }
  };

  // OTP: send OTP
  const sendOtp = async (actionType) => {
    setOtpAction(actionType);
    setOtpValue("");
    setRejectionMessage(""); // Clear rejection message on new OTP request
    setOtpModalOpen(true);
    setOtpLoading(true);
    setOtpSent(false); // Reset otpSent state
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
      toast.success("OTP sent to your phone");
      setOtpSent(true); // Set otpSent to true after successful sending
    } catch (err) {
      toast.error(err.message);
      setOtpModalOpen(false);
    } finally {
      setOtpLoading(false);
    }
  };

  // OTP-protected action (forward or reject)
  const handleOtpAction = async () => {
    if (otpValue.length !== 6) {
      toast.error(mylanguage === "EN" ? "Please enter a 6-digit OTP." : "እባክዎ ባለ 6 አሃዝ OTP ያስገቡ።");
      return;
    }

    setOtpLoading(true);
    const token = localStorage.getItem("authToken");
    const payload = {
      action: otpAction,
      otp_code: otpValue,
    };

    if (otpAction === "reject") {
      if (!rejectionMessage.trim()) {
        toast.error(mylanguage === "EN" ? "Please provide a reason for rejection." : "እባክዎ እምቢ ለማለት ምክንያት ያቅርቡ።");
        setOtpLoading(false);
        return;
      }
      payload.rejection_reason = rejectionMessage;
    }

    try {
      const response = await fetch(
        ENDPOINTS.SERVICE_REQUEST_ACTION(selectedRequest.id),
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
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to perform action.");
      }
      toast.success(
        mylanguage === "EN"
          ? `Request ${otpAction}ed successfully!`
          : `ጥያቄው በተሳካ ሁኔታ ${otpAction === "forward" ? "ተልኳል" : "ተቀባይነት አግኝቷል"}!`
      );
      setSelectedRequest(null);
      setMaintenanceLetter(null);
      setReceiptFile(null);
      setMaintenanceTotalCost("");
      setOtpModalOpen(false);
      setOtpValue("");
      setOtpSent(false);
      setOtpAction(null);
      setRejectionMessage("");
      fetchRequests();
    } catch (error) {
      toast.error(error.message || `Failed to ${otpAction} request.`);
    } finally {
      setOtpLoading(false);
    }
  };

  if (errorType === "unauthorized") {
    return <UnauthorizedPage />;
  }
  if (errorType === "server") {
    return <ServerErrorPage />;
  }

  return (
    <div className="container py-4">
      <ToastContainer />
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="mb-0 d-flex align-items-center">
          <FaFilePdf className="me-2 text-success" />
          Service Requests
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
                  <th>Vehicle</th>
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
                ) : serviceRequests.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center text-muted py-5">
                      <div className="py-4">
                        <FaFilePdf className="fs-1 text-muted mb-3" />
                        <p className="mb-1 fw-medium fs-5">
                          No service requests found.
                        </p>
                        <small className="text-muted">
                          Create a new request or check back later.
                        </small>
                      </div>
                    </td>
                  </tr>
                ) : (
                  serviceRequests.map((req, idx) => (
                    <tr key={req.id}>
                      <td>{idx + 1}</td>
                      <td>
                        {req.created_at
                          ? new Date(req.created_at).toLocaleDateString()
                          : "N/A"}
                      </td>
                      <td>{req.vehicle || "N/A"}</td>
                      <td>
                        <span className={`badge ${
                          req.status === "pending"
                            ? "bg-warning text-dark"
                            : req.status === "approved"
                            ? "bg-success"
                            : req.status === "rejected"
                            ? "bg-danger"
                            : "bg-secondary"
                        } py-2 px-3`}>
                          {req.status
                            ? req.status.charAt(0).toUpperCase() +
                              req.status.slice(1)
                            : ""}
                        </span>
                      </td>
                      <td className="text-center">
                        <button
                          className="btn btn-sm btn-outline-success d-flex align-items-center"
                          onClick={() => setSelectedRequest(req)}
                        >
                          <FaSearch className="me-1" />
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal for request details */}
      {selectedRequest && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Maintenance Request Details</h5>
                <MdOutlineClose // Changed from FaWindowClose to MdOutlineClose
                  style={{
                    cursor: "pointer",
                    position: "absolute",
                    top: "16px",
                    right: "16px",
                    fontSize: "1.5rem",
                    color: "#888"
                  }}
                  onClick={() => setSelectedRequest(null)}
                />
              </div>
              <div className="modal-body">
                <p>
                  <strong>Date:</strong>{" "}
                  {selectedRequest.created_at
                    ? new Date(selectedRequest.created_at).toLocaleDateString()
                    : "N/A"}
                </p>
                <p>
                  <strong>Requester's Car:</strong>{" "}
                  {selectedRequest.requesters_car_name || "N/A"}
                </p>
                <p>
                  <a href="http://lms.gdop.gov.et">
                    <strong>Message to service Provider</strong>
                  </a>
                </p>
                <div className="mb-3">
                  <label htmlFor="maintenanceLetter" className="form-label">
                    Service Letter (PDF) <span style={{ color: "red" }}>*</span>
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
                      className="btn btn-outline-secondary mt-2"
                      onClick={() =>
                        window.open(
                          URL.createObjectURL(maintenanceLetter),
                          "_blank"
                        )
                      }
                    >
                      <FaFilePdf className="me-1" /> View
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
                      className="btn btn-outline-secondary mt-2"
                      onClick={() =>
                        window.open(URL.createObjectURL(receiptFile), "_blank")
                      }
                    >
                      <FaFilePdf className="me-1" /> View
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
                <div className="mb-3 d-flex gap-2">
                  <button
                    className="btn btn-success"
                    style={{ minWidth: 120 }}
                    onClick={() => handleSubmitFiles(selectedRequest.id)}
                    disabled={actionLoading}
                  >
                    {actionLoading ? "Submitting..." : "Submit Files"}
                  </button>
                </div>
                <div className="d-flex justify-content-end gap-2 mt-3">
                  <button
                    className="btn"
                    style={{
                      backgroundColor: "#181E4B",
                      color: "white",
                      minWidth: 120,
                      border: "none",
                    }}
                    onClick={() => sendOtp("forward")}
                    disabled={actionLoading}
                  >
                    {actionLoading ? "Processing..." : "Forward"}
                  </button>
                  <button
                    className="btn btn-danger"
                    style={{ minWidth: 120 }}
                    onClick={() => sendOtp("reject")}
                    disabled={actionLoading}
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* OTP Modal */}
      {otpModalOpen && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {mylanguage === "EN" ? "Enter OTP to " : "OTP ያስገቡ ለ "}
                  {otpAction === "forward"
                    ? (mylanguage === "EN" ? "forward" : "ወደ ፊት ለመላክ")
                    : (mylanguage === "EN" ? "reject" : "መሰረዝ")}
                  {mylanguage === "EN" ? " request" : " ጥያቄ"}
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
                >
                  <MdOutlineClose />
                </button>
              </div>
              <div className="modal-body">
                <p>{mylanguage === "EN" ? "Enter the OTP code sent to your phone number." : "ወደ ስልካችሁ የተላከውን OTP ኮድ ያስገቡ።"}</p>
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
                        let newOtp = otpValue.split("");
                        newOtp[idx] = val;
                        if (val && idx < 5) {
                          const next = document.getElementById(
                            `otp-input-${idx + 1}`
                          );
                          if (next) next.focus();
                        } else if (!val && idx > 0 && e.nativeEvent.inputType === 'deleteContentBackward') {
                            const prev = document.getElementById(
                                `otp-input-${idx - 1}`
                            );
                            if (prev) prev.focus();
                        }
                        setOtpValue(newOtp.join("").slice(0, 6));
                      }}
                      onKeyDown={(e) => {
                        if (
                          e.key === "Backspace" &&
                          !otpValue[idx] &&
                          idx > 0
                        ) {
                          const prev = document.getElementById(
                            `otp-input-${idx - 1}`
                          );
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
                    placeholder={mylanguage === "EN" ? "Reason for rejection" : "ምክንያት"}
                    disabled={otpLoading}
                  />
                )}
              </div>
              <div className="modal-footer">
                <Button
                  variant="text"
                  onClick={() => sendOtp(otpAction)} // Pass otpAction to sendOtp
                  disabled={otpLoading}
                >
                  {mylanguage === "EN" ? "Resend OTP" : "OTP እንደገና ይላኩ"}
                </Button>
                <Button
                  variant="outlined" // Changed to outlined for Cancel
                  onClick={() => {
                    setOtpModalOpen(false);
                    setOtpValue("");
                    setOtpSent(false);
                    setOtpAction(null);
                    setRejectionMessage("");
                  }}
                  disabled={otpLoading}
                  style={{ borderColor: "#181E4B", color: "#181E4B" }}
                >
                  {mylanguage === "EN" ? "Cancel" : "ሰርዝ"}
                </Button>
                <Button
                  variant="contained"
                  style={{ backgroundColor: "#181E4B", color: "#fff" }}
                  disabled={otpLoading || otpValue.length !== 6 || (otpAction === "reject" && !rejectionMessage.trim())}
                  onClick={handleOtpAction} // Call new handleOtpAction
                >
                  {otpLoading
                    ? (mylanguage === "EN" ? "Processing..." : "በማከናወን ላይ...")
                    : otpAction === "forward"
                    ? (mylanguage === "EN" ? "Forward" : "ወደ ፊት ያስቀምጡ")
                    : (mylanguage === "EN" ? "Reject" : "አትቀበሉ")}
                </Button>
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
        .modal-header {
          position: relative;
        }
      `}</style>
    </div>
  );
};

export default ListServiceRequestsTable;