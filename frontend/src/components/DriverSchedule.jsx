import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { ENDPOINTS } from "../utilities/endpoints";
import { IoClose } from "react-icons/io5";
import { FaSearch, FaSync, FaCarSide } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Logo from "../assets/Logo.jpg";
import UnauthorizedPage from "./UnauthorizedPage";
import ServerErrorPage from "./ServerErrorPage";

const DriverSchedule = () => {
  const [requests, setRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [errorType, setErrorType] = useState(null);
  const [searchTerm, setSearchTerm] = useState(""); // For search

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
        if (response.status === 401) {
          setErrorType("unauthorized");
        } else {
          setErrorType("server");
        }
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
        if (response.status === 401) {
          setErrorType("unauthorized");
        } else {
          setErrorType("server");
        }
        throw new Error("Failed to fetch users");
      }

      const data = await response.json();
      setUsers(data.results || []);
    } catch (error) {
      console.error("Fetch Users Error:", error);
    }
  };

  const getEmployeeNames = (employeeIds) => {
    return employeeIds
      .map((id) => {
        const employee = users.find((user) => user.id === id);
        return employee ? employee.full_name : "Unknown";
      })
      .join(", ");
  };

  const handleViewDetail = (request) => {
    setSelectedRequest(request);
  };

  const handleCloseDetail = () => {
    setSelectedRequest(null);
  };

  const handleNotify = async (requestId) => {
    if (!accessToken) {
      console.error("No access token found.");
      return;
    }

    try {
      const response = await fetch(
        ENDPOINTS.COMPLETE_TRANSPORT_TRIP(requestId),
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        }
      );

      if (!response.ok) throw new Error("Failed to send notification");

      toast.success("Notification sent successfully!");

      setRequests((prevRequests) =>
        prevRequests.filter((req) => req.id !== requestId)
      );

      handleCloseDetail();
    } catch (error) {
      console.error("Notify Error:", error);
      toast.error("Failed to send notification.");
    }
  };

  if (errorType === "unauthorized") {
    return <UnauthorizedPage />;
  }
  if (errorType === "server") {
    return <ServerErrorPage />;
  }

  // Search filtering
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
  const filteredRequests = filterRequests();

  return (
    <div className="container py-4">
      <ToastContainer />
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="mb-0 d-flex align-items-center">
          <FaCarSide className="me-2 text-primary" />
          Driver Schedule
        </h1>
        <div className="d-flex gap-2">
          <div className="input-group shadow-sm" style={{ maxWidth: "300px" }}>
            <span className="input-group-text bg-white border-end-0">
              <FaSearch className="text-muted" />
            </span>
            <input
              type="text"
              className="form-control border-start-0"
              placeholder="Search schedule..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            className="btn btn-outline-primary d-flex align-items-center"
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
            {loading ? (
              <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "200px" }}>
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading data...</span>
                </div>
                <span className="ms-3">Loading schedule...</span>
              </div>
            ) : filteredRequests.length > 0 ? (
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Start Day</th>
                    <th>Start Time</th>
                    <th>Return Day</th>
                    <th>Destination</th>
                    <th>Status</th>
                    <th className="text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map((request) => (
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
                          className="btn btn-sm btn-outline-primary d-flex align-items-center"
                          onClick={() => handleViewDetail(request)}
                        >
                          <FaSearch className="me-1" />
                          View Detail
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center text-muted py-5">
                <FaCarSide className="fs-1 text-muted mb-3" />
                <p className="mb-1 fw-medium fs-5">
                  {searchTerm
                    ? "No requests match your search"
                    : "No driver schedule found."}
                </p>
                <small className="text-muted">
                  {searchTerm
                    ? "Try adjusting your search term"
                    : "Check back later"}
                </small>
              </div>
            )}
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
                </div>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleCloseDetail}
                >
                  <IoClose />
                </button>
              </div>
              <div className="modal-body">
                <p>
                  <strong>Start Day:</strong> {selectedRequest.start_day}
                </p>
                <p>
                  <strong>Start Time:</strong> {selectedRequest.start_time}
                </p>
                <p>
                  <strong>Return Day:</strong> {selectedRequest.return_day}
                </p>
                <p>
                  <strong>Employees:</strong>{" "}
                  {getEmployeeNames(selectedRequest.employees)}
                </p>
                <p>
                  <strong>Destination:</strong> {selectedRequest.destination}
                </p>
                <p>
                  <strong>Reason:</strong> {selectedRequest.reason}
                </p>
              </div>
              <div className="modal-footer text-center" style={{ justifyContent: "center" }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ minWidth: "150px" }}
                  onClick={() => handleNotify(selectedRequest.id)}
                >
                  Notify
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

export default DriverSchedule;