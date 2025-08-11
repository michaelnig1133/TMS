import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { IoClose } from "react-icons/io5";
import axios from "axios";
import { ENDPOINTS } from "../utilities/endpoints";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import UnauthorizedPage from "./UnauthorizedPage";
import ServerErrorPage from "./ServerErrorPage";
import { FaCarSide, FaSync } from "react-icons/fa";

const VehicleServices = () => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    vehicle: "",
    kilometers_driven: "",
  });
  const [loading, setLoading] = useState(false);
  const [errorType, setErrorType] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [kilometerLogs, setKilometerLogs] = useState([]);

  // Helper function to format vehicle display
  const getVehicleDisplay = (vehicle) => {
    return `${vehicle.model} - ${vehicle.license_plate}`;
  };

  // Fetch kilometer logs
  const fetchKilometerLogs = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        setErrorType("unauthorized");
        return;
      }
      const response = await axios.get(ENDPOINTS.KILOMETER_LOGS, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setKilometerLogs(response.data.results || []);
    } catch (error) {
      if (error.response?.status === 401) {
        setErrorType("unauthorized");
      } else if (error.response?.status === 403) {
        toast.error("Access denied to kilometer logs");
      } else {
        setErrorType("server");
      }
      console.error("Error fetching kilometer logs:", error);
    }
  };

  // Fetch user vehicles
  const fetchUserVehicles = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        setErrorType("unauthorized");
        return;
      }
      const response = await axios.get(ENDPOINTS.CURRENT_USER_VEHICLES, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      // Ensure we always have an array of vehicles
      const vehiclesData = Array.isArray(response.data) 
        ? response.data 
        : response.data.results 
          ? response.data.results 
          : [response.data];
      
      setVehicles(vehiclesData);
      
      // Set default vehicle if available
      if (vehiclesData.length > 0) {
        setFormData(prev => ({ 
          ...prev, 
          vehicle: vehiclesData[0].id.toString() 
        }));
      }
    } catch (error) {
      if (error.response?.status === 401) {
        setErrorType("unauthorized");
      } else {
        setErrorType("server");
      }
      console.error("Error fetching user vehicles:", error);
      toast.error("Failed to load vehicles");
    }
  };

  useEffect(() => {
    fetchKilometerLogs();
    fetchUserVehicles();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.vehicle) {
      toast.error("Please select a vehicle.");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(
        ENDPOINTS.ADD_MONTHLY_KILOMETERS,
        {
          vehicle: parseInt(formData.vehicle, 10), // Ensure vehicle ID is a number
          kilometers_driven: parseInt(formData.kilometers_driven, 10),
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        }
      );

      await fetchKilometerLogs();

      setShowForm(false);
      setFormData({ 
        vehicle: vehicles.length > 0 ? vehicles[0].id.toString() : "", 
        kilometers_driven: "" 
      });
      toast.success("Kilometer log added successfully!");
    } catch (error) {
      console.error("Error adding kilometer log:", error);

      let errorMessage = "Failed to add kilometer log.";

      if (error.response) {
        if (error.response.status === 403) {
          errorMessage = "You don't have permission to add logs.";
        } else if (error.response.data && error.response.data.detail) {
          errorMessage = error.response.data.detail;
        } else if (error.response.data && typeof error.response.data === "string") {
          errorMessage = error.response.data;
        } else if (error.response.statusText) {
          errorMessage = `Error: ${error.response.statusText}`;
        }
      } else if (error.request) {
        errorMessage = "No response from server. Please check your network connection.";
      } else {
        errorMessage = `Error setting up request: ${error.message}`;
      }

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  if (errorType === "unauthorized") return <UnauthorizedPage />;
  if (errorType === "server") return <ServerErrorPage />;

  return (
    <div className="container py-4">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="mb-0 d-flex align-items-center">
          <FaCarSide className="me-2 text-success" />
          Vehicle Kilometer Logs
        </h1>
        <button
          className="btn btn-outline-success d-flex align-items-center"
          style={{ minWidth: "200px" }}
          onClick={fetchKilometerLogs}
          disabled={loading}
        >
          <FaSync className={loading ? "me-2 spin" : "me-2"} />
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div className="mb-4">
        <button
          className="btn"
          style={{ minWidth: "250px", backgroundColor: "#181E4B", color: "white" }}
          onClick={() => setShowForm(true)}
          disabled={loading}
        >
          {loading ? "Processing..." : "Add Monthly Kilometers"}
        </button>
      </div>

      {showForm && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add Monthly Kilometers</h5>
                <button
                  className="btn-close"
                  onClick={() => setShowForm(false)}
                  disabled={loading}
                >
                  <IoClose />
                </button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleSubmit}>
                  {/* Vehicle Select */}
                  <div className="mb-3">
                    <label htmlFor="vehicle" className="form-label">
                      Vehicle
                    </label>
                    <select
                      id="vehicle"
                      name="vehicle"
                      className="form-select"
                      value={formData.vehicle}
                      onChange={handleInputChange}
                      required
                      disabled={loading || vehicles.length === 0}
                    >
                      {vehicles.length === 0 ? (
                        <option value="">No vehicles available</option>
                      ) : (
                        <>
                          <option value="">-- Select a vehicle --</option>
                          {vehicles.map((vehicle) => (
                            <option key={vehicle.id} value={vehicle.id.toString()}>
                              {getVehicleDisplay(vehicle)}
                            </option>
                          ))}
                        </>
                      )}
                    </select>
                  </div>

                  {/* Kilometers Driven Input */}
                  <div className="mb-3">
                    <label htmlFor="kilometers_driven" className="form-label">
                      Kilometers Driven
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      id="kilometers_driven"
                      name="kilometers_driven"
                      value={formData.kilometers_driven}
                      onChange={handleInputChange}
                      placeholder="Enter kilometers driven"
                      required
                      min="0"
                      disabled={loading}
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn"
                    style={{ width: "100%", backgroundColor: "#181E4B", color: "white" }}
                    disabled={loading || vehicles.length === 0}
                  >
                    {loading ? "Submitting..." : "Submit"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card shadow-sm border-0 overflow-hidden">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>#</th>
                  <th>Month</th>
                  <th>Kilometers Driven</th>
                  <th>Vehicle</th>
                  <th>Recorded By</th>
                  <th>Created At</th>
                </tr>
              </thead>
              <tbody>
                {kilometerLogs.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center text-muted py-5">
                      <div className="py-4">
                        <FaCarSide className="fs-1 text-muted mb-3" />
                        <p className="mb-1 fw-medium fs-5">No kilometer logs found.</p>
                        <small className="text-muted">Add a new log or check back later.</small>
                      </div>
                    </td>
                  </tr>
                ) : (
                  kilometerLogs.map((log, idx) => (
                    <tr key={log.id}>
                      <td>{idx + 1}</td>
                      <td>{log.month}</td>
                      <td>{log.kilometers_driven}</td>
                      <td>
                        {(() => {
                          const vehicle = vehicles.find(v => v.id === log.vehicle);
                          return vehicle 
                            ? getVehicleDisplay(vehicle)
                            : `Vehicle ${log.vehicle}`;
                        })()}
                      </td>
                      <td>{log.recorded_by || "Loading..."}</td>
                      <td>{log.created_at ? new Date(log.created_at).toLocaleString() : "Loading..."}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <style jsx>{`
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

export default VehicleServices;