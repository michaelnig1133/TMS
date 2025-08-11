import React, { useState, useEffect, useCallback } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { ENDPOINTS } from "../utilities/endpoints";
import CustomPagination from "./CustomPagination";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useLanguage } from "../context/LanguageContext";
import {
  FaCar,
  FaSearch,
  FaSync,
  FaUser,
  FaTools,
  FaWrench,
  FaSort,
  FaSortUp,
  FaSortDown,
} from "react-icons/fa";
import UnauthorizedPage from "./UnauthorizedPage";
import ServerErrorPage from "./ServerErrorPage";

const MaintenanceTable = () => {
  const [maintenanceRequests, setMaintenanceRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpAction, setOtpAction] = useState(null); // "forward", "reject", or "approve"
  const [rejectionMessage, setRejectionMessage] = useState("");
  const [errorType, setErrorType] = useState(null); // "unauthorized" | "server" | null
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "date",
    direction: "desc",
  });

  const itemsPerPage = 5;
  const { mylanguage } = useLanguage();

  // Helper for auth token
  const getAuthToken = () =>
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("token");

  // Fetch maintenance requests
  const fetchMaintenanceRequests = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setErrorType("unauthorized");
      toast.error(
        mylanguage === "EN" ? "Authentication required" : "ማረጋገጫ ያስፈልጋል"
      );
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(ENDPOINTS.LIST_MAINTENANCE_REQUESTS, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          setErrorType("unauthorized");
        } else {
          setErrorType("server");
        }
        throw new Error(
          mylanguage === "EN"
            ? "Failed to fetch requests"
            : "ጥያቄዎችን ማግኘት አልተቻለም"
        );
      }

      const data = await response.json();
      setMaintenanceRequests(data.results || []);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }, [mylanguage]);

  // Send OTP using backend endpoint
  const sendOtp = async () => {
    setOtpLoading(true);
    try {
      const token = getAuthToken();
      const response = await fetch(ENDPOINTS.OTP_REQUEST, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        throw new Error(
          mylanguage === "EN" ? "Failed to send OTP" : "OTP መላክ አልተቻለም"
        );
      }

      setOtpSent(true);
      toast.success(
        mylanguage === "EN" ? "OTP sent to your phone" : "OTP ወደ ስልክዎ ተልኳል"
      );
    } catch (err) {
      toast.error(err.message);
    } finally {
      setOtpLoading(false);
    }
  };

  // Handle OTP verification and action (forward, reject, approve)
  const handleOtpAction = async (otp, action) => {
    setOtpLoading(true);
    try {
      const token = getAuthToken();
      let payload = { action, otp_code: otp };

      if (action === "reject") {
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
        throw new Error(
          data.detail ||
            (mylanguage === "EN"
              ? `Failed to ${action} request`
              : `ጥያቄ ላይ ${action} አልተቻለም`)
        );
      }

      // Success message based on action
      let successMessage = "";
      if (action === "forward") {
        successMessage =
          mylanguage === "EN" ? "Request forwarded!" : "ጥያቄ ተቀድሷል!";
      } else if (action === "reject") {
        successMessage =
          mylanguage === "EN" ? "Request rejected!" : "ጥያቄ ተቀባይነት አላገኘም!";
      } else if (action === "approve") {
        successMessage =
          mylanguage === "EN" ? "Request approved!" : "ጥያቄ ተፈቅዷል!";
      }

      toast.success(successMessage);

      // Reset states
      setSelectedRequest(null);
      setOtpModalOpen(false);
      setOtpValue("");
      setOtpSent(false);
      setOtpAction(null);
      setRejectionMessage("");
      setOtpDigits(["", "", "", "", "", ""]);

      // Refresh the requests list
      fetchMaintenanceRequests();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setOtpLoading(false);
    }
  };

  // Fetch maintenance requests on mount
  useEffect(() => {
    fetchMaintenanceRequests();
  }, [fetchMaintenanceRequests]);

  // OTP input handlers
  const handleOtpChange = (e, idx) => {
    const value = e.target.value.replace(/\D/g, "");
    if (!value) return;
    const newOtp = [...otpDigits];
    newOtp[idx] = value[0];
    setOtpDigits(newOtp);
    // Move to next input if not last
    if (value && idx < 5) {
      document.getElementById(`otp-input-${idx + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (e, idx) => {
    if (e.key === "Backspace" && !otpDigits[idx] && idx > 0) {
      document.getElementById(`otp-input-${idx - 1}`)?.focus();
    }
  };

  const otpValueCombined = otpDigits.join("");

  // Search and filter logic
  const filterRequests = () => {
    let filtered = maintenanceRequests;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          (r.requesters_car_name &&
            r.requesters_car_name.toLowerCase().includes(term)) ||
          (r.requester_name && r.requester_name.toLowerCase().includes(term)) ||
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

  // Compose filtered and sorted data
  const filteredRequests = getSortedRequests(filterRequests());
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentPageRequests = filteredRequests.slice(
    startIndex,
    startIndex + itemsPerPage
  );

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
            <FaTools className="me-2 text-warning" />
            {mylanguage === "EN" ? "Maintenance Requests" : "የጥገና ጥያቄዎች"}
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
              placeholder={
                mylanguage === "EN"
                  ? "Search requests..."
                  : "ጥያቄ ፈልግ..."
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            className="btn btn-outline-primary d-flex align-items-center"
            onClick={fetchMaintenanceRequests}
            disabled={loading}
          >
            <FaSync className={loading ? "me-2 spin" : "me-2"} />
            {mylanguage === "EN" ? "Refresh" : "ዳግም አስተካክል"}
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
                    onClick={() => handleSort("date")}
                    className="cursor-pointer"
                  >
                    <div className="d-flex align-items-center">
                      {mylanguage === "EN" ? "Date" : "ቀን"}
                      {getSortIcon("date")}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("requester_name")}
                    className="cursor-pointer"
                  >
                    <div className="d-flex align-items-center">
                      {mylanguage === "EN" ? "Requester" : "ለማን"}
                      {getSortIcon("requester_name")}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("requesters_car_name")}
                    className="cursor-pointer"
                  >
                    <div className="d-flex align-items-center">
                      {mylanguage === "EN" ? "Vehicle" : "መኪና"}
                      {getSortIcon("requesters_car_name")}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("status")}
                    className="cursor-pointer"
                  >
                    <div className="d-flex align-items-center">
                      {mylanguage === "EN" ? "Status" : "ሁኔታ"}
                      {getSortIcon("status")}
                    </div>
                  </th>
                  <th className="text-center">
                    {mylanguage === "EN" ? "Actions" : "ድርጊቶች"}
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-5">
                      <div className="d-flex justify-content-center align-items-center">
                        <div
                          className="spinner-border text-warning"
                          role="status"
                        >
                          <span className="visually-hidden">
                            {mylanguage === "EN"
                              ? "Loading..."
                              : "በመጫን ላይ..."}
                          </span>
                        </div>
                        <span className="ms-3">
                          {mylanguage === "EN"
                            ? "Loading maintenance requests..."
                            : "የጥገና ጥያቄዎችን በመጫን ላይ..."}
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : currentPageRequests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center text-muted py-5">
                      <div className="py-4">
                        <FaTools className="fs-1 text-muted mb-3" />
                        <p className="mb-1 fw-medium fs-5">
                          {searchTerm
                            ? mylanguage === "EN"
                              ? "No requests match your search"
                              : "ምንም ጥያቄ አልተገኘም"
                            : mylanguage === "EN"
                            ? "No maintenance requests found"
                            : "የጥገና ጥያቄዎች አልተገኙም"}
                        </p>
                        <small className="text-muted">
                          {searchTerm
                            ? mylanguage === "EN"
                              ? "Try adjusting your search term"
                              : "የፍለጋ ቃልዎን ይቀይሩ"
                            : mylanguage === "EN"
                            ? "Check back later"
                            : "በኋላ ይመልከቱ"}
                        </small>
                      </div>
                    </td>
                  </tr>
                ) : (
                  currentPageRequests.map((request, index) => (
                    <tr key={request.id}>
                      <td>{startIndex + index + 1}</td>
                      <td>
                        {request.date
                          ? new Date(request.date).toLocaleDateString()
                          : ""}
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="bg-light rounded-circle p-2 me-2">
                            <FaUser className="fs-5" />
                          </div>
                          <span>{request.requester_name}</span>
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="bg-light rounded p-2 me-2">
                            <FaCar className="fs-5 text-primary" />
                          </div>
                          <span>{request.requesters_car_name}</span>
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
                            : ""}
                        </span>
                      </td>
                      <td className="text-center">
                        <button
                          className="btn btn-sm btn-outline-primary d-flex align-items-center"
                          onClick={() => setSelectedRequest(request)}
                        >
                          <FaSearch className="me-1" />
                          {mylanguage === "EN" ? "View" : "እይታ"}
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
              <span className="fw-medium">{maintenanceRequests.length}</span>
            </span>
          </div>
          <div className="d-flex gap-2">
            {searchTerm && (
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => setSearchTerm("")}
              >
                {mylanguage === "EN" ? "Clear Search" : "ፍለጋ አጥፋ"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Pagination */}
      {filteredRequests.length > itemsPerPage && (
        <div className="d-flex justify-content-center mt-4">
          <CustomPagination
            currentPage={currentPage}
            totalPages={Math.ceil(filteredRequests.length / itemsPerPage)}
            handlePageChange={setCurrentPage}
          />
        </div>
      )}

      {/* Request Details Modal */}
      {selectedRequest && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {mylanguage === "EN"
                    ? "Maintenance Request Details"
                    : "የጥገና ጥያቄ ዝርዝሮች"}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setSelectedRequest(null)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6">
                    <p>
                      <strong>
                        {mylanguage === "EN" ? "Request ID:" : "የጥያቄ መለያ፡"}
                      </strong>{" "}
                      {selectedRequest.id}
                    </p>
                    <p>
                      <strong>{mylanguage === "EN" ? "Date:" : "ቀን፡"}</strong>{" "}
                      {selectedRequest.date
                        ? new Date(selectedRequest.date).toLocaleString()
                        : ""}
                    </p>
                    <p>
                      <strong>
                        {mylanguage === "EN" ? "Requester:" : "ለማን፡"}
                      </strong>{" "}
                      {selectedRequest.requester_name}
                    </p>
                  </div>
                  <div className="col-md-6">
                    <p>
                      <strong>
                        {mylanguage === "EN" ? "Vehicle:" : "መኪና፡"}
                      </strong>{" "}
                      {selectedRequest.requesters_car_name}
                    </p>
                    <p>
                      <strong>
                        {mylanguage === "EN" ? "Status:" : "ሁኔታ፡"}
                      </strong>{" "}
                      {selectedRequest.status
                        ? selectedRequest.status.charAt(0).toUpperCase() +
                          selectedRequest.status.slice(1)
                        : ""}
                    </p>
                  </div>
                </div>
                <div className="mt-3">
                  <h5>
                    {mylanguage === "EN" ? "Request Details" : "የጥያቄ ዝርዝሮች"}
                  </h5>
                  <div className="border p-3 rounded bg-light">
                    {selectedRequest.reason ||
                      (mylanguage === "EN"
                        ? "No details provided"
                        : "ዝርዝሮች አልተሰጡም")}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn"
                  style={{ backgroundColor: "#14183E", color: "#fff" }}
                  onClick={async () => {
                    setOtpAction("forward");
                    setOtpModalOpen(true);
                    await sendOtp();
                  }}
                  disabled={otpLoading}
                >
                  {mylanguage === "EN" ? "Send OTP" : "OTP ይላኩ"}
                </button>

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSelectedRequest(null)}
                  disabled={otpLoading}
                >
                  {mylanguage === "EN" ? "Close" : "ዝጋ"}
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
                  {mylanguage === "EN"
                    ? "Enter OTP and choose action"
                    : "OTP ያስገቡ እና ድርጊት ይምረጡ"}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => {
                    setOtpModalOpen(false);
                    setOtpValue("");
                    setOtpSent(false);
                    setOtpAction(null);
                    setRejectionMessage("");
                    setOtpDigits(["", "", "", "", "", ""]);
                  }}
                  disabled={otpLoading}
                ></button>
              </div>
              <div className="modal-body">
                <p>
                  {mylanguage === "EN"
                    ? "Enter the OTP code sent to your phone number."
                    : "ወደ ስልክዎ የተላከውን OTP ያስገቡ።"}
                </p>
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
                <div className="d-flex gap-2 mt-3">
                  <button
                    className="btn flex-fill"
                    style={{ backgroundColor: "#14183E", color: "#fff" }}
                    disabled={otpLoading || otpValueCombined.length !== 6}
                    onClick={() => handleOtpAction(otpValueCombined, "forward")}
                  >
                    {mylanguage === "EN" ? "Forward" : "ቀጥል"}
                  </button>
                  <button
                    className="btn btn-danger flex-fill"
                    disabled={otpLoading || otpValueCombined.length !== 6}
                    onClick={() => handleOtpAction(otpValueCombined, "reject")}
                  >
                    {mylanguage === "EN" ? "Reject" : "አትቀበል"}
                  </button>
                </div>
                {otpAction === "reject" && (
                  <textarea
                    className="form-control mt-3"
                    rows={2}
                    value={rejectionMessage}
                    onChange={(e) => setRejectionMessage(e.target.value)}
                    placeholder={
                      mylanguage === "EN"
                        ? "Reason for rejection"
                        : "የመቀበል ምክንያት"
                    }
                    disabled={otpLoading}
                  />
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-link"
                  onClick={() => sendOtp()}
                  disabled={otpLoading}
                >
                  {mylanguage === "EN" ? "Resend OTP" : "OTP ደግመው ይላኩ"}
                </button>
                <button
                  type="button"
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
                  {mylanguage === "EN" ? "Cancel" : "ይቅር"}
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

export default MaintenanceTable;