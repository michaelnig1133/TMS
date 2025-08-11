import React, { useState, useEffect, useRef } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { ENDPOINTS } from "../utilities/endpoints";
import { IoClose } from "react-icons/io5";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Logo from "../assets/Logo.jpg";
import UnauthorizedPage from "./UnauthorizedPage";
import ServerErrorPage from "./ServerErrorPage";
import {
  FaCar,
  FaSearch,
  FaSync,
  FaUser,
  FaSort,
  FaSortUp,
  FaSortDown,
} from "react-icons/fa";

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
  const [otp, setOtp] = useState(new Array(6).fill("")); // Changed from string to array
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpAction, setOtpAction] = useState(null); // "forward" or "reject"
  const otpInputRefs = useRef([]); // Ref for OTP inputs

  const [errorType, setErrorType] = useState(null); // "unauthorized" | "server" | null
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "created_at",
    direction: "desc",
  });

  // Helper for auth token
  const getAuthToken = () =>
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("token");

  const fetchRefuelingRequests = async () => {
    const accessToken = getAuthToken();
    if (!accessToken) {
      setErrorType("unauthorized");
      return;
    }
    try {
      setLoading(true);
      const response = await fetch(ENDPOINTS.REFUELING_REQUEST_LIST, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          setErrorType("unauthorized");
        } else {
          setErrorType("server");
        }
        throw new Error("Failed to fetch refueling requests");
      }

      const data = await response.json();
      setRefuelingRequests(data.results || []);
    } catch (error) {
      toast.error("Failed to fetch refueling requests.");
    } finally {
      setLoading(false);
    }
  };

  const fetchRequestDetail = async (id) => {
    const accessToken = getAuthToken();
    if (!accessToken) {
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
      if (!response.ok) {
        throw new Error("Failed to fetch refueling request detail");
      }
      const data = await response.json();
      setSelectedRequest(data);
    } catch (error) {
      toast.error("Failed to fetch request details.");
    } finally {
      setDetailLoading(false);
    }
  };

  // Send OTP using backend endpoint
  const sendOtp = async () => {
    setOtpLoading(true);
    try {
      const accessToken = getAuthToken();
      const response = await fetch(ENDPOINTS.OTP_REQUEST, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        throw new Error("Failed to send OTP");
      }

      setOtpSent(true);
      toast.success("OTP sent to your phone");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setOtpLoading(false);
    }
  };

  // Handle OTP verification and action (forward/reject)
  const handleOtpAction = async (otpCode, action) => {
    setOtpLoading(true);
    try {
      const accessToken = getAuthToken();
      let payload = { action, otp_code: otpCode };
      if (action === "reject") {
        payload.rejection_message = rejectionMessage;
      }
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
      setOtp(new Array(6).fill("")); // Reset OTP array
      setOtpSent(false);
      setOtpAction(null);
      toast.success(
        `Request ${
          action === "forward" ? "forwarded" : "rejected"
        } successfully!`
      );
    } catch (error) {
      toast.error(error.message || `Failed to ${action} the request.`);
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
  
  // *** NEW: OTP Input Handlers ***
  const handleOtpChange = (element, index) => {
    const value = element.value;
    // Allow only numeric input
    if (/[^0-9]/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Focus next input
    if (value && index < 5) {
      otpInputRefs.current[index + 1].focus();
    }
  };

  const handleOtpKeyDown = (e, index) => {
    // Focus previous input on backspace
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1].focus();
    }
  };

  const handleOtpPaste = (e) => {
      e.preventDefault();
      const pasteData = e.clipboardData.getData("text").slice(0, 6);
      if (/[^0-9]/.test(pasteData)) return;

      const newOtp = [...otp];
      for (let i = 0; i < pasteData.length; i++) {
        if (i < 6) {
            newOtp[i] = pasteData[i];
        }
      }
      setOtp(newOtp);
      const lastInputIndex = Math.min(pasteData.length -1, 5);
      otpInputRefs.current[lastInputIndex].focus();
  };

  // Search and filter logic
  const filterRequests = () => {
    let filtered = refuelingRequests;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          (r.requesters_car_name &&
            r.requesters_car_name.toLowerCase().includes(term)) ||
          (r.requester_name && r.requester_name.toLowerCase().includes(term)) ||
          (r.destination && r.destination.toLowerCase().includes(term)) ||
          (r.status && r.status.toLowerCase().includes(term)) ||
          (r.id && r.id.toString().includes(term))
      );
    }
    return filtered;
  };

  // Sorting logic
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc")
      direction = "desc";
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <FaSort className="text-muted ms-1" />;
    return sortConfig.direction === "asc" ? (
      <FaSortUp className="text-primary ms-1" />
    ) : (
      <FaSortDown className="text-primary ms-1" />
    );
  };

  const getSortedRequests = (requests) => {
    if (!sortConfig.key) return requests;
    return [...requests].sort((a, b) => {
      const aValue = a[sortConfig.key] || "";
      const bValue = b[sortConfig.key] || "";
      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  };

  const filteredRequests = getSortedRequests(filterRequests());

  useEffect(() => {
    fetchRefuelingRequests();
  }, []);
  
  useEffect(() => {
    // Auto-focus the first OTP input when the modal opens
    if (otpModalOpen) {
      otpInputRefs.current[0]?.focus();
    }
  }, [otpModalOpen]);

  if (errorType === "unauthorized") {
    return <UnauthorizedPage />;
  }
  if (errorType === "server") {
    return <ServerErrorPage />;
  }

  return (
    <div className="container py-4">
      <ToastContainer position="top-right" autoClose={3000} />
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="mb-0 d-flex align-items-center">
            <FaCar className="me-2 text-primary" />
            Refueling Requests
          </h1>
        </div>
        <div className="d-flex gap-2">
          <div className="input-group shadow-sm" style={{ maxWidth: "300px" }}>
            <span className="input-group-text bg-white border-end-0">
              <FaSearch className="text-muted" />
            </span>
            <input
              type="text"
              className="form-control border-start-0"
              placeholder="Search refueling requests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            className="btn btn-outline-primary d-flex align-items-center"
            onClick={fetchRefuelingRequests}
            disabled={loading}
          >
            <FaSync className={loading ? "me-2 spin" : "me-2"} />
            Refresh
          </button>
        </div>
      </div>
      {/* Table */}
      <div className="card shadow-sm border-0 overflow-hidden">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>#</th>
                  <th
                    onClick={() => handleSort("created_at")}
                    className="cursor-pointer"
                  >
                    <div className="d-flex align-items-center">
                      Date{getSortIcon("created_at")}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("destination")}
                    className="cursor-pointer"
                  >
                    <div className="d-flex align-items-center">
                      Destination{getSortIcon("destination")}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("requester_name")}
                    className="cursor-pointer"
                  >
                    <div className="d-flex align-items-center">
                      Driver{getSortIcon("requester_name")}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("status")}
                    className="cursor-pointer"
                  >
                    <div className="d-flex align-items-center">
                      Status{getSortIcon("status")}
                    </div>
                  </th>
                  <th className="text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-5">
                      <div className="d-flex justify-content-center align-items-center">
                        <div
                          className="spinner-border text-primary"
                          role="status"
                        >
                          <span className="visually-hidden">Loading...</span>
                        </div>
                        <span className="ms-3">
                          Loading refueling requests...
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center text-muted py-5">
                      <div className="py-4">
                        <FaCar className="fs-1 text-muted mb-3" />
                        <p className="mb-1 fw-medium fs-5">
                          No refueling requests found
                        </p>
                        <small className="text-muted">
                          {searchTerm
                            ? "Try adjusting your search term"
                            : "Check back later"}
                        </small>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((request, index) => (
                    <tr key={request.id}>
                      <td>{index + 1}</td>
                      <td>
                        {request.created_at
                          ? new Date(request.created_at).toLocaleDateString()
                          : ""}
                      </td>
                      <td>{request.destination || "N/A"}</td>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="bg-light rounded-circle p-2 me-2">
                            <FaUser className="fs-5" />
                          </div>
                          <span>{request.requester_name || "N/A"}</span>
                        </div>
                      </td>
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
                            : "N/A"}
                        </span>
                      </td>
                      <td className="text-center">
                        <button
                          className="btn btn-sm btn-outline-primary d-flex align-items-center"
                          onClick={() => fetchRequestDetail(request.id)}
                        >
                          <FaSearch className="me-1" />
                          View Detail
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card-footer bg-white d-flex justify-content-between align-items-center py-3 border-0">
          <div className="text-muted small">
            Showing{" "}
            <span className="fw-medium">{filteredRequests.length}</span>{" "}
            requests
            <span>
              {" "}
              of{" "}
              <span className="fw-medium">{refuelingRequests.length}</span>
            </span>
          </div>
          <div className="d-flex gap-2">
            {searchTerm && (
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => setSearchTerm("")}
              >
                Clear Search
              </button>
            )}
          </div>
        </div>
      </div>
      {/* Modal for Viewing Details */}
      {selectedRequest && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
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
                  disabled={detailLoading}
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
                  <div className="container-fluid">
                    <div className="row">
                      <div className="col-md-6">
                        <p>
                          <strong>Request Date:</strong>{" "}
                          {selectedRequest.created_at
                            ? new Date(
                                selectedRequest.created_at
                              ).toLocaleString()
                            : ""}
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
                  style={{ backgroundColor: "#181E4B", color: "white" }}
                  onClick={() => handleActionWithOtp("forward")}
                  disabled={actionLoading}
                >
                  {actionLoading ? "Processing..." : "Forward"}
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => handleActionWithOtp("reject")}
                  disabled={actionLoading}
                >
                  {actionLoading ? "Processing..." : "Reject"}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => setSelectedRequest(null)}
                  disabled={actionLoading}
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
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Enter OTP to {otpAction === "forward" ? "forward" : "reject"}{" "}
                  request
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setOtpModalOpen(false);
                    setOtp(new Array(6).fill(""));
                    setOtpSent(false);
                    setOtpAction(null);
                    setRejectionMessage("");
                  }}
                  disabled={otpLoading}
                >
                  <IoClose />
                </button>
              </div>
              <div className="modal-body">
                <p>Enter the 6-digit code sent to your phone number.</p>
                
                {/* *** MODIFIED: OTP Input Section *** */}
                <div className="d-flex justify-content-center gap-2 mb-3" onPaste={handleOtpPaste}>
                    {otp.map((data, index) => {
                        return (
                            <input
                                key={index}
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                className="otp-input text-center form-control"
                                maxLength="1"
                                value={data}
                                onChange={(e) => handleOtpChange(e.target, index)}
                                onKeyDown={(e) => handleOtpKeyDown(e, index)}
                                ref={(el) => (otpInputRefs.current[index] = el)}
                                disabled={otpLoading}
                            />
                        );
                    })}
                </div>
                {/* *** END MODIFICATION *** */}

                {otpAction === "reject" && (
                  <textarea
                    className="form-control mt-3"
                    rows={2}
                    value={rejectionMessage}
                    onChange={(e) => setRejectionMessage(e.target.value)}
                    placeholder="Reason for rejection (required)"
                    disabled={otpLoading}
                  />
                )}
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-link"
                  onClick={() => sendOtp()}
                  disabled={otpLoading}
                >
                  Resend OTP
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setOtpModalOpen(false);
                    setOtp(new Array(6).fill(""));
                    setOtpSent(false);
                    setOtpAction(null);
                    setRejectionMessage("");
                  }}
                  disabled={otpLoading}
                >
                  Cancel
                </button>
                <button
                  className={`btn ${
                    otpAction === "forward" ? "" : "btn-danger"
                  }`}
                  style={
                    otpAction === "forward"
                      ? { backgroundColor: "#181E4B", color: "white" }
                      : {}
                  }
                  disabled={
                    otpLoading || 
                    otp.join("").length !== 6 ||
                    (otpAction === 'reject' && !rejectionMessage)
                  }
                  onClick={() => handleOtpAction(otp.join(""), otpAction)}
                >
                  {otpLoading
                    ? "Processing..."
                    : otpAction === "forward"
                    ? "Forward"
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
        /* *** NEW: OTP Input Styles *** */
        .otp-input {
            width: 45px;
            height: 50px;
            font-size: 1.5rem;
            font-weight: 500;
        }
        .otp-input:focus {
            border-color: #181E4B;
            box-shadow: 0 0 0 0.25rem rgba(24, 30, 75, 0.25);
        }
      `}</style>
    </div>
  );
};

export default RefuelingTable;