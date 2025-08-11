import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Logo from "../assets/Logo.jpg";
import { IoMdClose } from "react-icons/io";
import { IoClose } from "react-icons/io5";
import { FaSync, FaSearch, FaBus } from "react-icons/fa";
import { ENDPOINTS } from "../utilities/endpoints";
import CustomPagination from "./CustomPagination";
import UnauthorizedPage from "./UnauthorizedPage";
import ServerErrorPage from "./ServerErrorPage";

const TransportRequest = () => {
  const [requests, setRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [showApproveConfirmation, setShowApproveConfirmation] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
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

  // Fetch available vehicles from both endpoints and combine them
  const fetchVehicles = async () => {
    setVehicles([]);
    try {
      const [rentedResponse, orgResponse] = await Promise.all([
        fetch(ENDPOINTS.RENTED_AVAILABLE_VEHICLES, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }),
        fetch(ENDPOINTS.ORGANIZATION_AVAILABLE_VEHICLES, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }),
      ]);

      if (!rentedResponse.ok && !orgResponse.ok) {
        throw new Error("Failed to fetch vehicles");
      }

      const rentedData = rentedResponse.ok ? await rentedResponse.json() : { results: [] };
      const orgData = orgResponse.ok ? await orgResponse.json() : { results: [] };

      const allVehicles = [
        ...(rentedData.results || []),
        ...(orgData.results || [])
      ].filter(vehicle => vehicle.status === "available");

      setVehicles(allVehicles);
    } catch (error) {
      toast.error("Failed to fetch vehicles.");
      setVehicles([]);
    }
  };

  useEffect(() => {
    if (showApproveConfirmation) {
      fetchVehicles();
    }
  }, [showApproveConfirmation]);

  const getEmployeeNames = (employeeIds) => {
    return employeeIds
      .map((id) => {
        const employee = users.find((user) => user.id === id);
        return employee ? employee.full_name : "Unknown";
      })
      .join(", ");
  };

  const handleViewDetail = (request) => setSelectedRequest(request);

  const handleCloseDetail = () => {
    setSelectedRequest(null);
    setRejectionReason("");
    setShowRejectionModal(false);
    setShowApproveConfirmation(false);
    setVehicles([]);
    setSelectedVehicle(null);
  };

  const handleApproveClick = () => setShowApproveConfirmation(true);

  const handleVehicleChange = (e) => {
    const vehicleId = e.target.value;
    const vehicle = vehicles.find((vehicle) => vehicle.id.toString() === vehicleId);
    setSelectedVehicle(vehicle || null);
  };

  // Approve: send vehicle_id and driver_id
  const handleConfirmApprove = async (requestId) => {
    if (!selectedVehicle) {
      toast.error("Please select a vehicle before approving.");
      return;
    }
    if (!selectedVehicle.driver) {
      toast.error("Selected vehicle does not have a driver assigned.");
      return;
    }
    try {
      setRequests((prevRequests) =>
        prevRequests.filter((req) => req.id !== requestId)
      );
      const response = await fetch(
        ENDPOINTS.TM_APPROVE_REJECT(requestId),
        {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "approve",
            vehicle_id: selectedVehicle.id,
            driver_id: selectedVehicle.driver
          }),
        }
      );
      if (response.ok) {
        toast.success("Request approved successfully!");
        handleCloseDetail();
      }
    } catch {
      toast.error("Failed to approve request.");
      fetchRequests();
    }
  };

  const handleRejectClick = () => setShowRejectionModal(true);

  const handleConfirmReject = async () => {
    if (!rejectionReason) {
      toast.error("Please provide a reason for rejection.");
      return;
    }
    try {
      const response = await fetch(
        `${ENDPOINTS.TM_APPROVE_REJECT}${selectedRequest.id}/action/`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
          body: JSON.stringify({ action: "reject", rejection_message: rejectionReason }),
        }
      );
      if (response.ok) {
        toast.success("Request rejected successfully!");
        handleCloseDetail();
        fetchRequests();
      }
    } catch {
      toast.error("Failed to reject request.");
    }
  };

  // Filtering and sorting logic
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
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentPageRequests = filteredRequests.slice(startIndex, startIndex + itemsPerPage);

  if (errorType === "unauthorized") return <UnauthorizedPage />;
  if (errorType === "server") return <ServerErrorPage />;

  return (
    <div className="container py-4">
      <ToastContainer />
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="mb-0 d-flex align-items-center">
            <FaBus className="me-2 text-primary" />
            Transport Requests
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
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>#</th>
                  <th onClick={() => handleSort("start_day")} className="cursor-pointer">
                    <div className="d-flex align-items-center">
                      Start Day
                      {getSortIcon("start_day")}
                    </div>
                  </th>
                  <th onClick={() => handleSort("start_time")} className="cursor-pointer">
                    <div className="d-flex align-items-center">
                      Start Time
                      {getSortIcon("start_time")}
                    </div>
                  </th>
                  <th onClick={() => handleSort("return_day")} className="cursor-pointer">
                    <div className="d-flex align-items-center">
                      Return Day
                      {getSortIcon("return_day")}
                    </div>
                  </th>
                  <th onClick={() => handleSort("destination")} className="cursor-pointer">
                    <div className="d-flex align-items-center">
                      Destination
                      {getSortIcon("destination")}
                    </div>
                  </th>
                  <th onClick={() => handleSort("status")} className="cursor-pointer">
                    <div className="d-flex align-items-center">
                      Status
                      {getSortIcon("status")}
                    </div>
                  </th>
                  <th className="text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-5">
                      <div className="d-flex justify-content-center align-items-center">
                        <div className="spinner-border text-primary" role="status">
                          <span className="visually-hidden">Loading data...</span>
                        </div>
                        <span className="ms-3">Loading transport requests...</span>
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
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center text-muted py-5">
                      <div className="py-4">
                        <FaBus className="fs-1 text-muted mb-3" />
                        <p className="mb-1 fw-medium fs-5">
                          {searchTerm
                            ? "No requests match your search"
                            : "No transport requests found."}
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
      {filteredRequests.length > itemsPerPage && (
        <div className="d-flex justify-content-center mt-4">
          <CustomPagination
            currentPage={currentPage}
            totalPages={Math.ceil(filteredRequests.length / itemsPerPage)}
            handlePageChange={setCurrentPage}
          />
        </div>
      )}
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
                  <IoClose />
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
                <button type="button" className="btn btn-success" onClick={handleApproveClick}>
                  Approve
                </button>
                <button type="button" className="btn btn-danger" onClick={handleRejectClick}>
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Rejection Modal */}
      {showRejectionModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Reject Request</h5>
                <button type="button" className="btn-close" onClick={handleCloseDetail}>
                  <IoMdClose size={30} />
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
                <button type="button" className="btn btn-danger" onClick={handleConfirmReject}>
                  Submit Rejection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Approve Modal */}
      {showApproveConfirmation && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: "600px" }}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Assign Vehicle</h5>
                <button type="button" className="btn-close" onClick={() => setShowApproveConfirmation(false)}></button>
              </div>
              <div className="modal-body">
                <p><strong>Start Day:</strong> {selectedRequest.start_day}</p>
                <p><strong>Start Time:</strong> {selectedRequest.start_time}</p>
                <p><strong>Return Day:</strong> {selectedRequest.return_day}</p>
                <p><strong>Employees:</strong> {getEmployeeNames(selectedRequest.employees)}</p>
                <p><strong>Destination:</strong> {selectedRequest.destination}</p>
                <p><strong>Reason:</strong> {selectedRequest.reason}</p>
                <div className="mb-3">
                  <label htmlFor="vehicleSelect" className="form-label">
                    Select Vehicle:
                  </label>
                  <select
                    id="vehicleSelect"
                    className="form-select"
                    value={selectedVehicle ? selectedVehicle.id : ""}
                    onChange={handleVehicleChange}
                  >
                    <option value="">Select a vehicle</option>
                    {vehicles.length === 0 && (
                      <option disabled>No available vehicles</option>
                    )}
                    {vehicles.map((vehicle) => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {`Plate Number: ${vehicle.license_plate}, Model: ${vehicle.model}, Driver: ${vehicle.driver_name || "No Driver Assigned"}, Capacity: ${vehicle.capacity}`}
                      </option>
                    ))}
                  </select>
                </div>
                {selectedVehicle && (
                  <div className="mb-3">
                    <label className="form-label"><strong>Assigned Driver:</strong></label>
                    <input
                      className="form-control"
                      disabled
                      value={selectedVehicle.driver_name || "No Driver Assigned"}
                    />
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowApproveConfirmation(false)}>
                  Cancel
                </button>
                <button type="button" className="btn btn-primary" onClick={() => handleConfirmApprove(selectedRequest.id)}>
                  Confirm Approval
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

export default TransportRequest;