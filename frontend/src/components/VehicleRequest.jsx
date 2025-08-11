import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Logo from "../assets/Logo.jpg";
import { IoMdClose } from "react-icons/io";
import { IoCloseSharp } from "react-icons/io5";
import { FaSync, FaSearch, FaBuilding, FaBus } from "react-icons/fa";
import { ENDPOINTS } from "../utilities/endpoints";
import UnauthorizedPage from "./UnauthorizedPage";
import ServerErrorPage from "./ServerErrorPage";

const DepartementPage = () => {
  const [requests, setRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showApproveConfirmation, setShowApproveConfirmation] = useState(false);
  const [errorType, setErrorType] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "start_day", direction: "desc" });

  const accessToken = localStorage.getItem("authToken");

  useEffect(() => {
    fetchRequests();
    fetchUsers();
  }, []);

  const fetchRequests = async () => {
    if (!accessToken) {
      setErrorType("unauthorized");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(ENDPOINTS.REQUEST_LIST, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        if (response.status === 401) setErrorType("unauthorized");
        else setErrorType("server");
        throw new Error("Failed to fetch transport requests");
      }
      const data = await response.json();
      setRequests(data.results || []);
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    if (!accessToken) {
      setErrorType("unauthorized");
      return;
    }
    try {
      const response = await fetch(ENDPOINTS.USER_LIST, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        if (response.status === 401) setErrorType("unauthorized");
        else setErrorType("server");
        throw new Error("Failed to fetch users");
      }
      const data = await response.json();
      setUsers(data.results || []);
    } catch (error) {
      console.error("Fetch Users Error:", error);
    }
  };

  // Get employee names from IDs
  const getEmployeeNames = (employeeIds) => {
    return employeeIds
      .map((id) => {
        const employee = users.find((user) => user.id === id);
        return employee ? employee.full_name : "Unknown";
      })
      .join(", ");
  };

  // Filtering and sorting
  const filterRequests = () => {
    let filtered = requests;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          (r.destination && r.destination.toLowerCase().includes(term)) ||
          (r.status && r.status.toLowerCase().includes(term)) ||
          (r.start_day && r.start_day.toLowerCase().includes(term)) ||
          (r.return_day && r.return_day.toLowerCase().includes(term)) ||
          (r.id && r.id.toString().includes(term))
      );
    }
    return filtered;
  };

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") direction = "desc";
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <FaSearch className="text-muted ms-1" />;
    return sortConfig.direction === "asc" ? (
      <span className="text-primary ms-1">&#9650;</span>
    ) : (
      <span className="text-primary ms-1">&#9660;</span>
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

  const handleViewDetail = (request) => setSelectedRequest(request);

  const handleCloseDetail = () => {
    setSelectedRequest(null);
    setRejectionReason("");
    setShowRejectionModal(false);
    setShowConfirmation(false);
    setShowApproveConfirmation(false);
  };

  const handleApprove = async (requestId) => {
    if (!accessToken) {
      console.error("No access token found.");
      return;
    }
    try {
      const response = await fetch(ENDPOINTS.TM_APPROVE_REJECT(requestId), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "forward" }),
      });
      if (!response.ok) throw new Error("Failed to forward transport request");
      setRequests((prevRequests) =>
        prevRequests.filter((req) => req.id !== requestId)
      );
      setSelectedRequest(null);
      toast.success("Request forwarded to transport manager successfully!");
    } catch (error) {
      console.error("Approve Error:", error);
      toast.error("Failed to forward request.");
    }
  };

  const handleReject = async (requestId) => {
    if (!accessToken) {
      console.error("No access token found.");
      return;
    }
    if (!rejectionReason) {
      toast.error("Please provide a reason for rejection.");
      return;
    }
    try {
      const response = await fetch(ENDPOINTS.TM_APPROVE_REJECT(requestId), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "reject", rejection_message: rejectionReason }),
      });
      if (!response.ok) throw new Error("Failed to reject transport request");
      setRequests((prevRequests) =>
        prevRequests.filter((req) => req.id !== requestId)
      );
      setSelectedRequest(null);
      setRejectionReason("");
      setShowRejectionModal(false);
      toast.success("Request rejected successfully!");
    } catch (error) {
      console.error("Reject Error:", error);
      toast.error("Failed to reject request.");
    }
  };

  const handleRejectClick = () => setShowRejectionModal(true);
  const handleConfirmReject = () => setShowConfirmation(true);
  const handleConfirmAction = () => {
    handleReject(selectedRequest.id);
    setShowConfirmation(false);
  };
  const handleApproveClick = () => setShowApproveConfirmation(true);
  const handleConfirmApprove = () => {
    handleApprove(selectedRequest.id);
    setShowApproveConfirmation(false);
  };

  if (errorType === "unauthorized") return <UnauthorizedPage />;
  if (errorType === "server") return <ServerErrorPage />;

  return (
    <div className="container py-4">
      <ToastContainer />
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="mb-0 d-flex align-items-center">
            <FaBus className="me-2 text-primary" />
            Vehicle Requests
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
              placeholder="Search requests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            className="btn btn-outline-success d-flex align-items-center"
            onClick={fetchRequests}
            disabled={loading}
          >
            <FaSync className={loading ? "me-2 spin" : "me-2"} />
            Refresh
          </button>
        </div>
      </div>
      <div className="card shadow-sm border-0 overflow-hidden">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th onClick={() => handleSort("start_day")} className="cursor-pointer">
                    <div className="d-flex align-items-center">
                      Start Day {getSortIcon("start_day")}
                    </div>
                  </th>
                  <th onClick={() => handleSort("start_time")} className="cursor-pointer">
                    <div className="d-flex align-items-center">
                      Start Time {getSortIcon("start_time")}
                    </div>
                  </th>
                  <th onClick={() => handleSort("return_day")} className="cursor-pointer">
                    <div className="d-flex align-items-center">
                      Return Day {getSortIcon("return_day")}
                    </div>
                  </th>
                  <th onClick={() => handleSort("destination")} className="cursor-pointer">
                    <div className="d-flex align-items-center">
                      Destination {getSortIcon("destination")}
                    </div>
                  </th>
                  <th onClick={() => handleSort("status")} className="cursor-pointer">
                    <div className="d-flex align-items-center">
                      Status {getSortIcon("status")}
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
                        <div className="spinner-border text-success" role="status">
                          <span className="visually-hidden">Loading data...</span>
                        </div>
                        <span className="ms-3">Loading department requests...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredRequests.length > 0 ? (
                  filteredRequests.map((request) => (
                    <tr key={request.id}>
                      <td>{request.start_day}</td>
                      <td>{request.start_time}</td>
                      <td>{request.return_day}</td>
                      <td>{request.destination}</td>
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
                    <td colSpan="6" className="text-center text-muted py-5">
                      <div className="py-4">
                        <FaBuilding className="fs-1 text-muted mb-3" />
                        <p className="mb-1 fw-medium fs-5">
                          {searchTerm
                            ? "No requests match your search"
                            : "No department requests found."}
                        </p>
                        <small className="text-muted">
                          {searchTerm
                            ? "Try adjusting your search term"
                            : "Check back later"}
                        </small>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card-footer bg-white d-flex justify-content-between align-items-center py-3 border-0">
          <div className="text-muted small">
            Showing <span className="fw-medium">{filteredRequests.length}</span> requests
            <span> of <span className="fw-medium">{requests.length}</span></span>
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
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: "700px" }}>
            <div className="modal-content">
              <div className="modal-header">
                <div className="d-flex align-items-center">
                  <img src={Logo} alt="Logo" style={{ width: "80px", height: "50px", marginRight: "10px" }} />
                  <h5 className="modal-title">Transport Request Details</h5>
                </div>
                <button type="button" className="btn-close" onClick={handleCloseDetail}>
                  <IoCloseSharp size={24} />
                </button>
              </div>
              <div className="modal-body">
                <p><strong>Start Day:</strong> {selectedRequest.start_day}</p>
                <p><strong>Start Time:</strong> {selectedRequest.start_time}</p>
                <p><strong>Return Day:</strong> {selectedRequest.return_day}</p>
                <p><strong>Employees:</strong> {getEmployeeNames(selectedRequest.employees)}</p>
                <p><strong>Destination:</strong> {selectedRequest.destination}</p>
                <p><strong>Reason:</strong> {selectedRequest.reason}</p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-info"
                  style={{ backgroundColor: "#0B455B", color: "white", minWidth: "120px" }}
                  onClick={handleApproveClick}
                >
                  Forward
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  style={{ minWidth: "120px" }}
                  onClick={handleRejectClick}
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Rejection Modal */}
      {showRejectionModal && (
        <div className="modal fade show d-block" tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Reject Request</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowRejectionModal(false)}
                >
                  <IoCloseSharp size={24} />
                </button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label htmlFor="rejectionReason" className="form-label">
                    Rejection Reason
                  </label>
                  <textarea
                    id="rejectionReason"
                    className="form-control"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Provide a reason for rejection"
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-danger w-80"
                  onClick={handleConfirmReject}
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirm Rejection</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowConfirmation(false)}
                >
                  <IoCloseSharp size={24} />
                </button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to reject this request?</p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowConfirmation(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleConfirmAction}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Approve Confirmation Modal */}
      {showApproveConfirmation && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirm Approval</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowApproveConfirmation(false)}
                >
                  <IoCloseSharp size={24} />
                </button>
              </div>
              <div className="modal-body">
                <p>
                  Are you sure you want to forward this request to the transport manager?
                </p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-info"
                  style={{ backgroundColor: "#0B455B", color: "white" }}
                  onClick={handleConfirmApprove}
                >
                  Confirm
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
          from { transform: rotate(0deg);}
          to { transform: rotate(360deg);}
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

export default DepartementPage;