import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { ENDPOINTS } from "../utilities/endpoints";
import { IoClose } from "react-icons/io5";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Logo from "../assets/Logo.jpg";
import UnauthorizedPage from "./UnauthorizedPage";
import ServerErrorPage from "./ServerErrorPage";
import { FaWrench, FaSearch, FaSync } from "react-icons/fa";

const MaintenanceRequest = () => {
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ 
    date: "", 
    reason: "", 
    requesters_car: "" 
  });
  const [vehicles, setVehicles] = useState([]);
  const [errorType, setErrorType] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchMaintenanceRequests = async () => {
    const accessToken = localStorage.getItem("authToken");
    if (!accessToken) {
      setErrorType("unauthorized");
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const response = await fetch(ENDPOINTS.MY_MAINTENANCE_REQUESTS, {
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
      setRequests(data.results || []);
    } catch (error) {
      console.error("Error fetching maintenance requests:", error);
      toast.error("Failed to fetch maintenance requests");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserVehicles = async () => {
    const accessToken = localStorage.getItem("authToken");
    if (!accessToken) return;

    try {
      const response = await fetch(ENDPOINTS.CURRENT_USER_VEHICLES, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) throw new Error("Failed to fetch vehicles");
      const data = await response.json();
      setVehicles(data.results || data || []);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      toast.error("Failed to load vehicles");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const accessToken = localStorage.getItem("authToken");
    if (!accessToken) {
      toast.error("You are not authorized. Please log in again.");
      setIsSubmitting(false);
      return;
    }
    try {
      const response = await fetch(ENDPOINTS.CREATE_MAINTENANCE_REQUEST, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          requesters_car: parseInt(formData.requesters_car)
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create request");
      }
      
      const newRequest = await response.json();
      const vehicle = vehicles.find(v => v.id === parseInt(formData.requesters_car));
      setRequests((prev) => [{
        ...newRequest,
        requesters_car: vehicle || formData.requesters_car
      }, ...prev]);
      
      setFormData({ date: "", reason: "", requesters_car: "" });
      setShowForm(false);
      toast.success("Maintenance request created successfully!");
    } catch (error) {
      console.error("Error creating request:", error);
      toast.error(error.message || "Failed to create request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShowDetails = (request) => {
    setSelectedRequest(request);
  };

  const filterRequests = () => {
    return requests.filter(request => 
      request.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (request.requesters_car?.license_plate || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.id?.toString().includes(searchTerm) ||
      (request.requester_name || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  useEffect(() => {
    fetchUserVehicles();
    fetchMaintenanceRequests();
  }, []);

  if (errorType === "unauthorized") return <UnauthorizedPage />;
  if (errorType === "server") return <ServerErrorPage />;

  const filteredRequests = filterRequests();
  
  const getVehicleDisplay = (request) => {
    if (request.requesters_car_name) {
      return request.requesters_car_name;
    }
    
    const vehicleId = request.requesters_car;
    
    if (typeof request.requesters_car === 'object') {
      return `${request.requesters_car.make} (${request.requesters_car.license_plate})`;
    }
    
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (vehicle) {
      return `${vehicle.make} (${vehicle.license_plate})`;
    }
    
    return `Vehicle #${vehicleId}`;
  };

  return (
    <div className="container py-4">
      <ToastContainer position="top-right" autoClose={5000} />
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="mb-0 d-flex align-items-center">
          <FaWrench className="me-2 text-success" />
          Maintenance Requests
        </h1>
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
            onClick={fetchMaintenanceRequests}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                Loading...
              </>
            ) : (
              <>
                <FaSync className="me-2" />
                Refresh
              </>
            )}
          </button>
        </div>
      </div>
      
      <div className="d-flex mb-4">
        <button
          className="btn"
          style={{ minWidth: "250px", backgroundColor: "#181E4B", color: "white" }}
          onClick={() => setShowForm(true)}
        >
          New Maintenance Request
        </button>
      </div>

      {/* New Maintenance Request Modal */}
      {showForm && (
        <div 
          className="modal fade show d-block" 
          style={{ backgroundColor: "rgba(0,0,0,0.5)", position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 1050 }}
          onClick={(e) => e.target.className.includes("modal fade show d-block") && setShowForm(false)}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h5 className="modal-title">New Maintenance Request</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowForm(false)}
                  aria-label="Close"
                >
                  <IoClose />
                </button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label htmlFor="date" className="form-label">Date</label>
                    <input
                      type="date"
                      className="form-control"
                      id="date"
                      name="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="requesters_car" className="form-label">Select Vehicle</label>
                    <select
                      className="form-select"
                      id="requesters_car"
                      name="requesters_car"
                      value={formData.requesters_car}
                      onChange={handleInputChange}
                      required
                      disabled={vehicles.length === 0}
                    >
                      <option value="">-- Select a vehicle --</option>
                      {vehicles.map((vehicle) => (
                        <option key={vehicle.id} value={vehicle.id}>
                          {vehicle.make} ({vehicle.license_plate})
                        </option>
                      ))}
                    </select>
                    {vehicles.length === 0 && (
                      <div className="text-danger small mt-1">
                        No vehicles available. Please add a vehicle first.
                      </div>
                    )}
                  </div>
                  <div className="mb-3">
                    <label htmlFor="reason" className="form-label">Reason</label>
                    <textarea
                      className="form-control"
                      id="reason"
                      name="reason"
                      value={formData.reason}
                      onChange={handleInputChange}
                      placeholder="Enter the reason for maintenance"
                      required
                      style={{ minHeight: "100px" }}
                    />
                  </div>
                  <div className="d-flex gap-2">
                    <button
                      type="button"
                      className="btn btn-secondary flex-grow-1"
                      onClick={() => setShowForm(false)}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn flex-grow-1"
                      style={{ backgroundColor: "#181E4B", color: "white" }}
                      disabled={isSubmitting || vehicles.length === 0}
                    >
                      {isSubmitting ? (
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      ) : null}
                      {isSubmitting ? "Submitting..." : "Submit Request"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Requests Table */}
      <div className="card shadow-sm border-0 overflow-hidden">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>#</th>
                  <th>Date</th>
                  <th>Vehicle</th>
                  <th>Requested By</th>
                  <th>Status</th>
                  <th className="text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan="6" className="text-center py-5">
                      <div className="d-flex justify-content-center align-items-center">
                        <div className="spinner-border text-primary me-3" role="status"></div>
                        <span>Loading maintenance requests...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredRequests.length > 0 ? (
                  filteredRequests.map((request, index) => (
                    <tr key={request.id}>
                      <td>{index + 1}</td>
                      <td>{request.date ? new Date(request.date).toLocaleDateString() : "N/A"}</td>
                      <td>{getVehicleDisplay(request)}</td>
                      <td>{request.requester_name || "N/A"}</td>
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
                          {request.status?.charAt(0).toUpperCase() + request.status?.slice(1)}
                        </span>
                      </td>
                      <td className="text-center">
                        <button
                          className="btn btn-sm btn-outline-success d-flex align-items-center mx-auto"
                          onClick={() => handleShowDetails(request)}
                        >
                          <FaSearch className="me-1" />
                          Details
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
                          {searchTerm ? "No matching requests found" : "No maintenance requests yet"}
                        </p>
                        <small className="text-muted">
                          {searchTerm 
                            ? "Try a different search term" 
                            : "Click 'New Maintenance Request' to create one"}
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
            Showing <span className="fw-medium">{filteredRequests.length}</span> of{" "}
            <span className="fw-medium">{requests.length}</span> requests
          </div>
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

      {/* Details Modal */}
      {selectedRequest && (
        <div 
          className="modal fade show d-block" 
          style={{ backgroundColor: "rgba(0,0,0,0.5)", position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 1050 }}
          onClick={() => setSelectedRequest(null)}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div className="d-flex align-items-center">
                  <img
                    src={Logo}
                    alt="Logo"
                    style={{ width: "80px", height: "50px", marginRight: "10px" }}
                    className="img-fluid"
                  />
                  <h5 className="modal-title">Maintenance Request Details</h5>
                </div>
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
                <div className="mb-3">
                  <h6>Date</h6>
                  <p>{selectedRequest.date || "N/A"}</p>
                </div>
                <div className="mb-3">
                  <h6>Requested By</h6>
                  <p>{selectedRequest.requester_name || "N/A"}</p>
                </div>
                <div className="mb-3">
                  <h6>Vehicle</h6>
                  <p>{getVehicleDisplay(selectedRequest)}</p>
                </div>
                <div className="mb-3">
                  <h6>Status</h6>
                  <p>
                    <span className={`badge ${
                      selectedRequest.status === "pending"
                        ? "bg-warning text-dark"
                        : selectedRequest.status === "approved"
                        ? "bg-success"
                        : selectedRequest.status === "rejected"
                        ? "bg-danger"
                        : "bg-secondary"
                    } py-2 px-3`}>
                      {selectedRequest.status?.charAt(0).toUpperCase() + selectedRequest.status?.slice(1)}
                    </span>
                  </p>
                </div>
                <div className="mb-3">
                  <h6>Reason</h6>
                  <p className="bg-light p-3 rounded">{selectedRequest.reason}</p>
                </div>
              </div>
              <div className="modal-footer">
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

      <style jsx>{`
        .card {
          border-radius: 0.75rem;
          overflow: hidden;
          border: 1px solid #e9ecef;
        }
        .table th {
          background-color: #f8fafc;
          border-top: 1px solid #e9ecef;
          border-bottom: 2px solid #e9ecef;
          font-weight: 600;
          color: #495057;
        }
        .table td {
          vertical-align: middle;
        }
        .text-truncate {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .badge {
          font-weight: 500;
          letter-spacing: 0.5px;
        }
        .modal-content {
          border-radius: 0.75rem;
          border: none;
          box-shadow: 0 0.5rem 1.5rem rgba(0,0,0,0.2);
        }
        .modal-header {
          border-bottom: 1px solid #e9ecef;
          padding: 1rem 1.5rem;
        }
        .modal-footer {
          border-top: 1px solid #e9ecef;
          padding: 1rem 1.5rem;
        }
        .btn-outline-success:hover {
          background-color: #198754;
          color: white;
        }
      `}</style>
    </div>
  );
};

export default MaintenanceRequest;