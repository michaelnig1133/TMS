import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ENDPOINTS } from "../utilities/endpoints";
import {
  FaCar,
  FaWrench,
  FaSearch,
  FaSync,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaUser,
} from "react-icons/fa";
import UnauthorizedPage from "./UnauthorizedPage";
import ServerErrorPage from "./ServerErrorPage";

function VehicleServiceManager() {
  const [availableVehicles, setAvailableVehicles] = useState([]);
  const [maintenanceVehicles, setMaintenanceVehicles] = useState([]);
  const [loadingAvailable, setLoadingAvailable] = useState(true);
  const [loadingMaintenance, setLoadingMaintenance] = useState(true);
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState("available");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "model",
    direction: "asc",
  });

  // Error handling
  const [errorType, setErrorType] = useState(null); // "unauthorized" | "server" | null

  // OTP Modal State
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [otpVehicleId, setOtpVehicleId] = useState(null);
  const [otpActionType, setOtpActionType] = useState(""); // "maintenance" | "available"
  const [otpError, setOtpError] = useState("");

  // Helper function to get auth token
  const getAuthToken = () => {
    return (
      localStorage.getItem("accessToken") ||
      localStorage.getItem("authToken") ||
      localStorage.getItem("token")
    );
  };

  // Handle API responses consistently
  const handleApiResponse = async (response) => {
    if (!response.ok) {
      if (response.status === 401) {
        setErrorType("unauthorized");
      } else {
        setErrorType("server");
      }
      let errorMsg = "Server error";
      try {
        const data = await response.json();
        errorMsg = data.detail || JSON.stringify(data);
      } catch {
        // ignore
      }
      throw new Error(errorMsg);
    }
    if (response.status === 204) return {};
    return response.json();
  };

  // Fetch available vehicles (not under maintenance)
  useEffect(() => {
    const fetchAvailableVehicles = async () => {
      try {
        setLoadingAvailable(true);
        const token = getAuthToken();
        const response = await fetch(ENDPOINTS.VEHICLES_LIST, {
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        });
        const data = await handleApiResponse(response);
        setAvailableVehicles(
          (data.results || []).filter(
            v => v.status === "available"
          )
        );
      } catch (error) {
        toast.error("Failed to load vehicles: " + error.message);
        setAvailableVehicles([]);
      } finally {
        setLoadingAvailable(false);
      }
    };
    fetchAvailableVehicles();
  }, [refetchTrigger]);

  // Fetch vehicles under maintenance
  useEffect(() => {
    const fetchMaintenanceVehicles = async () => {
      try {
        setLoadingMaintenance(true);
        const token = getAuthToken();
        // Use both endpoints, merge vehicles, avoid duplicates
        const [response1, response2] = await Promise.all([
          fetch(ENDPOINTS.MAINTAINED_VEHICLES, {
            headers: {
              "Content-Type": "application/json",
              ...(token && { Authorization: `Bearer ${token}` }),
            },
          }),
          fetch(ENDPOINTS.MAINTENANCE_REQUESTS_MAINTAINED_VEHICLES, {
            headers: {
              "Content-Type": "application/json",
              ...(token && { Authorization: `Bearer ${token}` }),
            },
          }),
        ]);
        const data1 = await handleApiResponse(response1);
        const data2 = await handleApiResponse(response2);
        const results1 = data1.results || data1 || [];
        const results2 = data2.results || data2 || [];
        const merged = [
          ...results1,
          ...results2.filter(
            v2 => !results1.some(v1 => v1.id === v2.id)
          ),
        ];
        setMaintenanceVehicles(merged);
      } catch (error) {
        toast.error("Failed to load maintenance vehicles: " + error.message);
        setMaintenanceVehicles([]);
      } finally {
        setLoadingMaintenance(false);
      }
    };
    fetchMaintenanceVehicles();
  }, [refetchTrigger]);

  // Helper function to display status text
  const getStatusDisplay = (status) => {
    switch (status) {
      case "available":
        return "Available";
      case "maintenance":
      case "under_maintenance":
      case "under-maintenance":
        return "Under Maintenance";
      default:
        return status
          ? status.charAt(0).toUpperCase() + status.slice(1)
          : "";
    }
  };

  // OTP request for vehicle status change
  const sendOtp = async (vehicleId, actionType) => {
    setOtpModalOpen(true);
    setOtpLoading(true);
    setOtpValue("");
    setOtpVehicleId(vehicleId);
    setOtpActionType(actionType);
    setOtpError("");
    try {
      const token = getAuthToken();
      const response = await fetch(ENDPOINTS.OTP_REQUEST, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({}),
      });
      if (!response.ok) throw new Error("Failed to send OTP");
      toast.success("OTP sent to your phone.");
    } catch (err) {
      toast.error("Failed to send OTP. " + err.message);
      setOtpModalOpen(false);
    } finally {
      setOtpLoading(false);
    }
  };

  // Confirm OTP and update vehicle status
  const handleOtpConfirm = async () => {
    if (otpValue.length !== 6) {
      setOtpError("Please enter the 6-digit OTP code.");
      return;
    }
    setOtpLoading(true);
    setOtpError("");
    try {
      const token = getAuthToken();
      let endpoint = "";
      let fetchOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      };
      if (otpActionType === "maintenance") {
        endpoint = ENDPOINTS.MARK_AS_MAINTENANCE(otpVehicleId);
        fetchOptions.body = JSON.stringify({ otp_code: otpValue });
      } else if (otpActionType === "available") {
        endpoint = ENDPOINTS.MARK_MAINTENANCE_VEHICLE_AVAILABLE(otpVehicleId);
        fetchOptions.body = JSON.stringify({ otp_code: otpValue });
      }
      const response = await fetch(endpoint, fetchOptions);
      await handleApiResponse(response);

      toast.success(
        otpActionType === "maintenance"
          ? "Vehicle marked as Under Maintenance"
          : "Vehicle marked as Available"
      );
      setOtpModalOpen(false);
      setRefetchTrigger((prev) => prev + 1);
    } catch (error) {
      setOtpError("Failed to update vehicle status: " + error.message);
      toast.error("Failed to update vehicle status: " + error.message);
    } finally {
      setOtpLoading(false);
    }
  };

  // Filter vehicles per tab
  const filterVehicles = () => {
    let filtered =
      activeTab === "available" ? availableVehicles : maintenanceVehicles;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (v) =>
          (v.model && v.model.toLowerCase().includes(term)) ||
          (v.license_plate && v.license_plate.toLowerCase().includes(term)) ||
          (v.driver_name && v.driver_name.toLowerCase().includes(term))
      );
    }
    return filtered;
  };

  // Handle sorting
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc")
      direction = "desc";
    setSortConfig({ key, direction });
  };

  // Apply sorting to filtered vehicles
  const getSortedVehicles = (vehicles) => {
    if (!sortConfig.key) return vehicles;
    return [...vehicles].sort((a, b) => {
      const aValue = a[sortConfig.key] || "";
      const bValue = b[sortConfig.key] || "";
      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  };

  // Get filtered and sorted vehicles for the current tab
  const filteredVehicles = getSortedVehicles(filterVehicles());

  // Get status badge class
  const getStatusClass = (status) => {
    switch (status) {
      case "available":
        return "bg-success";
      case "maintenance":
      case "under_maintenance":
      case "under-maintenance":
        return "bg-warning text-dark";
      default:
        return "bg-secondary";
    }
  };

  // Get sort icon for column
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <FaSort className="text-muted ms-1" />;
    return sortConfig.direction === "asc" ? (
      <FaSortUp className="text-primary ms-1" />
    ) : (
      <FaSortDown className="text-primary ms-1" />
    );
  };

  // Determine loading state for current tab
  const showLoading = () =>
    activeTab === "available" ? loadingAvailable : loadingMaintenance;

  if (errorType === "unauthorized") {
    return <UnauthorizedPage />;
  }
  if (errorType === "server") {
    return <ServerErrorPage />;
  }

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="mb-0 d-flex align-items-center">
            <FaCar className="me-2 text-primary" />
            Vehicle Maintenance Management
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
              placeholder="Search vehicles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            className="btn btn-outline-primary d-flex align-items-center"
            onClick={() => setRefetchTrigger((prev) => prev + 1)}
            disabled={loadingAvailable || loadingMaintenance}
          >
            <FaSync
              className={
                loadingAvailable || loadingMaintenance ? "me-2 spin" : "me-2"
              }
            />
            Refresh
          </button>
        </div>
      </div>

      <div className="card shadow-sm border-0 overflow-hidden">
        <div className="card-header bg-white border-0 py-3">
          <ul
            className="nav nav-tabs card-header-tabs border-0 flex-nowrap justify-content-start"
            style={{ gap: "2rem" }}
          >
            <li className="nav-item">
              <button
                className={`nav-link ${
                  activeTab === "available" ? "active" : ""
                } d-flex align-items-center`}
                onClick={() => setActiveTab("available")}
                style={{ minWidth: "200px" }}
              >
                <FaCar className="me-2" />
                Available
                <span className="badge bg-success ms-2">
                  {availableVehicles.length}
                </span>
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${
                  activeTab === "maintenance" ? "active" : ""
                } d-flex align-items-center`}
                onClick={() => setActiveTab("maintenance")}
                style={{ minWidth: "200px" }}
              >
                <FaWrench className="me-2" />
                Under Maintenance
                <span className="badge bg-warning text-dark ms-2">
                  {maintenanceVehicles.length}
                </span>
              </button>
            </li>
          </ul>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th onClick={() => handleSort("model")} className="cursor-pointer">
                    <div className="d-flex align-items-center">Vehicle{getSortIcon("model")}</div>
                  </th>
                  <th onClick={() => handleSort("license_plate")} className="cursor-pointer">
                    <div className="d-flex align-items-center">Plate No.{getSortIcon("license_plate")}</div>
                  </th>
                  <th onClick={() => handleSort("driver_name")} className="cursor-pointer">
                    <div className="d-flex align-items-center">Driver{getSortIcon("driver_name")}</div>
                  </th>
                  <th onClick={() => handleSort("total_kilometers")} className="cursor-pointer text-end">
                    <div className="d-flex align-items-center justify-content-end">Total KM{getSortIcon("total_kilometers")}</div>
                  </th>
                  <th onClick={() => handleSort("last_service_kilometers")} className="cursor-pointer text-end">
                    <div className="d-flex align-items-center justify-content-end">Last Service KM{getSortIcon("last_service_kilometers")}</div>
                  </th>
                  <th>Status</th>
                  <th className="text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {showLoading() ? (
                  <tr>
                    <td colSpan={7} className="text-center py-5">
                      <div className="d-flex justify-content-center align-items-center">
                        <div className="spinner-border text-primary" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                        <span className="ms-3">
                          {activeTab === "available" ? "Loading available vehicles..." : "Loading maintenance vehicles..."}
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : filteredVehicles.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center text-muted py-5">
                      <div className="py-4">
                        <FaCar className="fs-1 text-muted mb-3" />
                        <p className="mb-1 fw-medium fs-5">
                          {searchTerm ? "No vehicles match your search" : activeTab === "available" ? "No vehicles currently available" : "No vehicles currently under maintenance"}
                        </p>
                        <small className="text-muted">{searchTerm ? "Try adjusting your search term" : "Check back later"}</small>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredVehicles.map((vehicle) => (
                    <tr key={vehicle.id}>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="bg-light rounded p-2 me-3">
                            <FaCar className="fs-4 text-primary" />
                          </div>
                          <div>
                            <div className="fw-medium">{vehicle.model}</div>
                            <small className="text-muted">ID: {vehicle.id}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border px-2 py-1 fw-normal">{vehicle.license_plate}</span>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="bg-light rounded-circle p-2 me-2">
                            <FaUser className="fs-5" />
                          </div>
                          <span>{vehicle.driver_name || "Unassigned"}</span>
                        </div>
                      </td>
                      <td className="text-end fw-medium">{vehicle.total_kilometers ? `${vehicle.total_kilometers.toLocaleString()} km` : "N/A"}</td>
                      <td className="text-end">{vehicle.last_service_kilometers ? `${vehicle.last_service_kilometers.toLocaleString()} km` : "N/A"}</td>
                      <td>
                        <span className={`badge ${getStatusClass(vehicle.status)} py-2 px-3`}>{getStatusDisplay(vehicle.status)}</span>
                      </td>
                      <td className="text-center">
                        {activeTab === "available" ? (
                          <button className="btn btn-sm btn-outline-warning d-flex align-items-center" onClick={() => sendOtp(vehicle.id, "maintenance")} disabled={loadingAvailable}>
                            <FaWrench className="me-1" /> Mark Under Maintenance
                          </button>
                        ) : (
                          <button className="btn btn-sm btn-outline-success d-flex align-items-center" onClick={() => sendOtp(vehicle.id, "available")} disabled={loadingMaintenance}>
                            <FaCar className="me-1" /> Mark Available
                          </button>
                        )}
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
            Showing <span className="fw-medium">{filteredVehicles.length}</span> vehicles
            <span> of <span className="fw-medium">{activeTab === "available" ? availableVehicles.length : maintenanceVehicles.length}</span></span>
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

      {/* OTP Modal */}
      {otpModalOpen && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{otpActionType === "maintenance" ? "Mark Vehicle Under Maintenance" : "Mark Vehicle Available"}</h5>
                <button type="button" className="btn-close" onClick={() => setOtpModalOpen(false)} disabled={otpLoading}></button>
              </div>
              <div className="modal-body">
                <p>Enter the 6-digit OTP code sent to your phone to confirm this action.</p>
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
                {otpError && (
                  <div className="text-danger mb-2">{otpError}</div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setOtpModalOpen(false)}
                  disabled={otpLoading}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleOtpConfirm}
                  disabled={otpLoading || otpValue.length !== 6}
                >
                  {otpLoading ? "Processing..." : "Confirm"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ToastContainer position="top-right" autoClose={3000} />
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
}

export default VehicleServiceManager;