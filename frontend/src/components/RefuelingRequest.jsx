import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { ENDPOINTS } from "../utilities/endpoints";
import { IoClose } from "react-icons/io5";
import { FaSearch, FaSync, FaGasPump } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import UnauthorizedPage from "./UnauthorizedPage";
import ServerErrorPage from "./ServerErrorPage";

const RefuelingRequest = () => {
  const [requests, setRequests] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ 
    date: "", 
    destination: "", 
    requesters_car: "" 
  });
  const [errorType, setErrorType] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchRefuelingRequests = async () => {
    const accessToken = localStorage.getItem("authToken");

    if (!accessToken) {
      setErrorType("unauthorized");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(ENDPOINTS.MY_REFUELING_REQUESTS, {
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
      setRequests(data.results || []);
    } catch (error) {
      console.error("Error fetching refueling requests:", error);
      toast.error("Failed to fetch refueling requests");
    } finally {
      setLoading(false);
    }
  };

  const fetchVehicles = async () => {
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

      if (!response.ok) {
        throw new Error("Failed to fetch vehicles");
      }

      const data = await response.json();
      setVehicles(data || []);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      toast.error("Failed to load vehicles");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
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
      const response = await fetch(ENDPOINTS.CREATE_REFUELING_REQUEST, {
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
      
      setRequests((prevRequests) => [{
        ...newRequest,
        requesters_car_details: vehicle
      }, ...prevRequests]);
      
      setFormData({ date: "", destination: "", requesters_car: "" });
      setShowForm(false);
      toast.success("Refueling request created successfully!");
    } catch (error) {
      toast.error(error.message || "Failed to create refueling request");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    fetchRefuelingRequests();
    fetchVehicles();
  }, []);

  if (errorType === "unauthorized") {
    return <UnauthorizedPage />;
  }
  if (errorType === "server") {
    return <ServerErrorPage />;
  }

  // Simplified vehicle display function
  const getVehicleDisplay = (request) => {
    // If we have vehicle details object
    if (request.requesters_car_details) {
      const v = request.requesters_car_details;
      return `${v.model} - ${v.license_plate}`;
    }
    
    // If we have a vehicle ID
    const vehicleId = request.requesters_car;
    if (vehicleId) {
      const vehicle = vehicles.find(v => v.id === vehicleId);
      if (vehicle) {
        return `${vehicle.model} - ${vehicle.license_plate}`;
      }
      return `Vehicle #${vehicleId}`;
    }
    
    return "No vehicle specified";
  };

  const filterRequests = () => {
    let filtered = requests;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          (r.destination && r.destination.toLowerCase().includes(term)) ||
          (r.status && r.status.toLowerCase().includes(term)) ||
          (r.id && r.id.toString().includes(term)) ||
          getVehicleDisplay(r).toLowerCase().includes(term)
      );
    }
    return filtered;
  };

  const filteredRequests = filterRequests();

  return (
    <div className="container py-4">
      <ToastContainer />
      <div className="mb-4">
        <div className="d-flex justify-content-between align-items-center">
          <h1 className="mb-0 d-flex align-items-center">
            <FaGasPump className="me-2 text-success" />
            Refueling Requests
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
              onClick={fetchRefuelingRequests}
              disabled={loading}
            >
              {loading ? (
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
        <div className="d-flex mt-3">
          <button
            className="btn"
            style={{ minWidth: "200px", backgroundColor: "#181E4B", color: "white" }}
            onClick={() => setShowForm(true)}
          >
            New Refueling Request
          </button>
        </div>
      </div>

      {/* Modal Form */}
      {showForm && (
        <div 
          className="modal fade show d-block" 
          style={{ background: "rgba(0,0,0,0.5)", position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 1050 }}
          onClick={(e) => e.target.className.includes("modal fade show d-block") && setShowForm(false)}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h5 className="modal-title">New Refueling Request</h5>
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
                    <label htmlFor="date" className="form-label">
                      Date
                    </label>
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
                    <label htmlFor="requesters_car" className="form-label">
                      Vehicle
                    </label>
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
                          {vehicle.model} - {vehicle.license_plate}
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
                    <label htmlFor="destination" className="form-label">
                      Destination
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="destination"
                      name="destination"
                      value={formData.destination}
                      onChange={handleInputChange}
                      placeholder="Enter the destination"
                      required
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

      {/* Table Display */}
      <div className="card shadow-sm border-0 overflow-hidden">
        <div className="card-body p-0">
          <div className="table-responsive">
            {loading ? (
              <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "200px" }}>
                <div className="spinner-border text-success" role="status">
                  <span className="visually-hidden">Loading data...</span>
                </div>
                <span className="ms-3">Loading refueling requests...</span>
              </div>
            ) : filteredRequests.length > 0 ? (
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>#</th>
                    <th>Date</th>
                    <th>Vehicle (Model - Plate)</th>
                    <th>Destination</th>
                    <th>Status</th>
                    <th className="text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map((request, index) => (
                    <tr key={request.id}>
                      <td>{index + 1}</td>
                      <td>{request.date ? new Date(request.date).toLocaleDateString() : new Date(request.created_at).toLocaleDateString()}</td>
                      <td>{getVehicleDisplay(request)}</td>
                      <td>{request.destination || "N/A"}</td>
                      <td>
                        <span
                          className={`badge ${
                            request.status === "pending"
                              ? "bg-warning text-dark"
                              : request.status === "approved"
                              ? "bg-success"
                              : request.status === "rejected"
                              ? "bg-danger"
                              : "bg-secondary"
                          } py-2 px-3`}
                        >
                          {request.status
                            ? request.status.charAt(0).toUpperCase() + request.status.slice(1)
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
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center text-muted py-5">
                <FaGasPump className="fs-1 text-muted mb-3" />
                <p className="mb-1 fw-medium fs-5">
                  {searchTerm ? "No requests match your search" : "No refueling requests found."}
                </p>
                <small className="text-muted">{searchTerm ? "Try adjusting your search term" : "Check back later"}</small>
              </div>
            )}
          </div>
        </div>
        <div className="card-footer bg-white d-flex justify-content-between align-items-center py-3 border-0">
          <div className="text-muted small">
            Showing <span className="fw-medium">{filteredRequests.length}</span> requests
            <span>
              {" "}
              of <span className="fw-medium">{requests.length}</span>
            </span>
          </div>
          <div className="d-flex gap-2">
            {searchTerm && (
              <button className="btn btn-sm btn-outline-secondary" onClick={() => setSearchTerm("")}>
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
          style={{ backgroundColor: "rgba(0,0,0,0.5)", position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 1050 }}
          onClick={() => setSelectedRequest(null)}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h5 className="modal-title">Refueling Request Details</h5>
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
                  <p>{selectedRequest.date ? new Date(selectedRequest.date).toLocaleDateString() : new Date(selectedRequest.created_at).toLocaleDateString()}</p>
                </div>
                <div className="mb-3">
                  <h6>Vehicle (Model - Plate)</h6>
                  <p>{getVehicleDisplay(selectedRequest)}</p>
                </div>
                <div className="mb-3">
                  <h6>Destination</h6>
                  <p>{selectedRequest.destination}</p>
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
        .cursor-pointer {
          cursor: pointer;
        }
        .card {
          border-radius: 1rem;
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

export default RefuelingRequest;