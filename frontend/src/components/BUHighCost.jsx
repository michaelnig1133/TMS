import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Logo from "../assets/Logo.jpg";
import { IoCloseSharp } from "react-icons/io5";
import { ENDPOINTS } from "../utilities/endpoints";
import CustomPagination from "./CustomPagination";
import UnauthorizedPage from "./UnauthorizedPage";
import ServerErrorPage from "./ServerErrorPage";
import { FaCarCrash, FaSync, FaSearch } from "react-icons/fa";

const BUHighCost = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // OTP
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpAction, setOtpAction] = useState(null); // "approve" | "reject"

  const itemsPerPage = 5;
  const accessToken = localStorage.getItem("authToken");
  const [errorType, setErrorType] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    if (!accessToken) {
      setErrorType("unauthorized");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(ENDPOINTS.HIGH_COST_LIST, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        if (response.status === 401) setErrorType("unauthorized");
        else setErrorType("server");
        throw new Error("Failed to fetch high-cost requests");
      }
      const data = await response.json();
      setRequests(data.results || []);
    } catch (error) {
      toast.error("Unable to retrieve high-cost requests.");
    } finally {
      setLoading(false);
    }
  };

  const fetchHighCostDetails = async (requestId) => {
    if (!accessToken) {
      setErrorType("unauthorized");
      return;
    }
    try {
      const response = await fetch(ENDPOINTS.HIGH_COST_DETAIL(requestId), {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        if (response.status === 401) setErrorType("unauthorized");
        else setErrorType("server");
        throw new Error("Failed to fetch high-cost request details");
      }
      const data = await response.json();
      setSelectedRequest(data);
    } catch (error) {
      toast.error("Unable to fetch high-cost request details.");
    }
  };

  const handleViewDetail = async (request) => {
    setSelectedRequest(null);
    await fetchHighCostDetails(request.id);
  };

  // OTP send
  const sendOtp = async (actionType) => {
    setOtpAction(actionType);
    setOtpValue("");
    setOtpModalOpen(true);
    setOtpLoading(true);
    try {
      const response = await fetch(ENDPOINTS.OTP_REQUEST, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });
      if (!response.ok) throw new Error("Failed to send OTP");
      toast.success("OTP has been sent to your phone.");
    } catch (err) {
      toast.error("Failed to send OTP. " + err.message);
      setOtpModalOpen(false);
    } finally {
      setOtpLoading(false);
    }
  };

  // OTP approve/reject handler
  const handleOtpAction = async () => {
    setOtpLoading(true);
    try {
      if (otpAction === "approve") {
        const response = await fetch(
          ENDPOINTS.APPREJ_HIGHCOST_REQUEST(selectedRequest.id),
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              action: "approve",
              otp_code: otpValue,
            }),
          }
        );
        if (!response.ok) throw new Error("Failed to approve request");
        setRequests((prevRequests) =>
          prevRequests.map((req) =>
            req.id === selectedRequest.id
              ? { ...req, status: "forwarded" }
              : req
          )
        );
        setSelectedRequest(null);
        toast.success("Request has been approved and forwarded.");
      } else if (otpAction === "reject") {
        if (!rejectionReason) {
          toast.error("Please provide a reason for rejection.");
          setOtpLoading(false);
          return;
        }
        const response = await fetch(
          ENDPOINTS.APPREJ_HIGHCOST_REQUEST(selectedRequest.id),
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              action: "reject",
              rejection_message: rejectionReason,
              otp_code: otpValue,
            }),
          }
        );
        if (!response.ok) throw new Error("Failed to reject request");
        setRequests((prevRequests) =>
          prevRequests.map((req) =>
            req.id === selectedRequest.id ? { ...req, status: "rejected" } : req
          )
        );
        setSelectedRequest(null);
        setRejectionReason("");
        toast.success("Request has been rejected.");
      }
      setOtpModalOpen(false);
      setOtpValue("");
      setOtpAction(null);
      setShowRejectionModal(false);
    } catch (error) {
      toast.error(error.message || "Failed to process the request.");
    } finally {
      setOtpLoading(false);
    }
  };

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageRequests = requests.slice(startIndex, endIndex);

  if (errorType === "unauthorized") return <UnauthorizedPage />;
  if (errorType === "server") return <ServerErrorPage />;

  return (
    <div className="container py-4" style={{ minHeight: "100vh", backgroundColor: "#f8f9fc" }}>
      <ToastContainer />
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="mb-0 d-flex align-items-center">
          <FaCarCrash className="me-2 text-success" />
          Field Trip
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
                  <th>Start Day</th>
                  <th>Start Time</th>
                  <th>Return Day</th>
                  <th>Destination</th>
                  <th>Status</th>
                  <th className="text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" className="text-center py-5">
                      <div className="d-flex justify-content-center align-items-center">
                        <div className="spinner-border text-success" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                        <span className="ms-3">Loading requests...</span>
                      </div>
                    </td>
                  </tr>
                ) : currentPageRequests.length > 0 ? (
                  currentPageRequests.map((request, index) => (
                    <tr key={request.id}>
                      <td>{startIndex + index + 1}</td>
                      <td>{request.start_day}</td>
                      <td>{request.start_time}</td>
                      <td>{request.return_day}</td>
                      <td>{request.destination}</td>
                      <td>
                        <span className={`badge ${
                          request.status === "forwarded"
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
                          onClick={() => handleViewDetail(request)}
                        >
                          <FaSearch className="me-1" />
                          View Detail
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center text-muted py-5">
                      <div className="py-4">
                        <FaCarCrash className="fs-1 text-muted mb-3" />
                        <p className="mb-1 fw-medium fs-5">
                          No transport requests found.
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
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}>
          <div className="modal-dialog">
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
                <h5 className="modal-title">Transport Request Details</h5>
                <button
                  type="button"
                  className="btn"
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "1.5rem",
                    color: "#000",
                    marginLeft: "auto",
                  }}
                  onClick={() => setSelectedRequest(null)}
                  aria-label="Close"
                >
                  <IoCloseSharp />
                </button>
              </div>
              <div className="modal-body">
                <p>
                  <strong>Requester:</strong> {selectedRequest.requester}
                </p>
                <p>
                  <strong>Employees:</strong>{" "}
                  {selectedRequest.employees?.join(", ") || "N/A"}
                </p>
                <p>
                  <strong>Estimated Vehicle:</strong>{" "}
                  {selectedRequest.estimated_vehicle || "N/A"}
                </p>
                <p>
                  <strong>Start Day:</strong> {selectedRequest.start_day}
                </p>
                <p>
                  <strong>Return Day:</strong> {selectedRequest.return_day}
                </p>
                <p>
                  <strong>Start Time:</strong> {selectedRequest.start_time}
                </p>
                <p>
                  <strong>Destination:</strong> {selectedRequest.destination}
                </p>
                <p>
                  <strong>Reason:</strong> {selectedRequest.reason}
                </p>
                <p>
                  <strong>Status:</strong> {selectedRequest.status}
                </p>
                <p>
                  <strong>Vehicle Assigned:</strong>{" "}
                  {selectedRequest.vehicle_assigned ? "Yes" : "No"}
                </p>
                <p>
                  <strong>Estimated Distance (km):</strong>{" "}
                  {selectedRequest.estimated_distance_km || "N/A"}
                </p>
                <p>
                  <strong>Fuel Price per Liter:</strong>{" "}
                  {selectedRequest.fuel_price_per_liter || "N/A"}
                </p>
                <p>
                  <strong>Fuel Needed (Liters):</strong>{" "}
                  {selectedRequest.fuel_needed_liters || "N/A"}
                </p>
                <p>
                  <strong>Total Cost:</strong>{" "}
                  {selectedRequest.total_cost || "N/A"} ETB
                </p>
                <p>
                  <strong>Created At:</strong>{" "}
                  {new Date(selectedRequest.created_at).toLocaleString()}
                </p>
                {selectedRequest.employee_list_file && (
  <div className="mb-3 d-flex flex-column align-items-center gap-2">
    <strong>Employee List File:</strong>
    <a
      href={selectedRequest.employee_list_file}
      target="_blank"
      rel="noopener noreferrer"
      className="btn btn-sm"
      style={{
        backgroundColor: "#181E4B",
        color: "white",
        minWidth: "160px",
        fontWeight: "bold",
        letterSpacing: "0.5px",
        border: "none",
      }}
      download
    >
      Download Excel
    </a>
    <button
      className="btn btn-sm"
      type="button"
      style={{
        backgroundColor: "hsl(32.1, 94.6%, 43.7%)",
        color: "white",
        minWidth: "160px",
        fontWeight: "bold",
        letterSpacing: "0.5px",
        border: "none",
      }}
      onClick={() => {
        const previewUrl = `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(
          selectedRequest.employee_list_file
        )}`;
        window.open(
          previewUrl,
          "_blank",
          "toolbar=0,location=0,menubar=0,width=" +
            window.screen.width +
            ",height=" +
            window.screen.height +
            ",top=0,left=0"
        );
      }}
    >
      Preview
    </button>
  </div>
)}
              </div>
              <div className="modal-footer">
                <button
                  className="btn"
                  style={{ backgroundColor: "#181E4B", color: "white", minWidth: "120px" }}
                  onClick={() => sendOtp("approve")}
                >
                  Approve
                </button>
                <button
                  className="btn btn-danger"
                  style={{ minWidth: "120px" }}
                  onClick={() => setShowRejectionModal(true)}
                >
                  Reject
                </button>
                <button
                  type="button"
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
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Enter OTP to {otpAction === "approve" ? "approve" : "reject"} request
                </h5>
                <button
                  type="button"
                  className="btn"
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "1.5rem",
                    color: "#000",
                    marginLeft: "auto",
                  }}
                  onClick={() => {
                    setOtpModalOpen(false);
                    setOtpValue("");
                    setOtpAction(null);
                  }}
                  aria-label="Close"
                  disabled={otpLoading}
                >
                  <IoCloseSharp />
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
                          const next = document.getElementById(
                            `otp-input-${idx + 1}`
                          );
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
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
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
                  type="button"
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
                  type="button"
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

export default BUHighCost;