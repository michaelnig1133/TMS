import React, { useState, useEffect, useRef } from "react"; // Import useRef
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
import { MdOutlineClose } from "react-icons/md"; // Import the close icon from Material Design Icons
import UnauthorizedPage from "./UnauthorizedPage";
import ServerErrorPage from "./ServerErrorPage";

// OTP Modal
const OTPModal = ({
  open,
  loading,
  value, // This will be the full OTP string
  onChange, // This will update the full OTP string
  onClose,
  onResend,
  onSubmit,
  actionLabel,
}) => {
  const inputRefs = useRef([]); // Ref to hold references to each input element

  useEffect(() => {
    // Focus on the first input when modal opens
    if (open && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [open]);

  const handleOtpChange = (e, index) => {
    const val = e.target.value.replace(/\D/g, ""); // Allow only digits

    if (val) {
      // If a digit is entered, update the specific digit and move focus
      const newOtpArray = value.split("");
      newOtpArray[index] = val;
      const newOtp = newOtpArray.join("");
      onChange(newOtp);

      if (index < 5) {
        inputRefs.current[index + 1].focus();
      }
    } else {
      // If backspace/clear, clear the specific digit and move focus back
      const newOtpArray = value.split("");
      newOtpArray[index] = ""; // Clear the current digit
      const newOtp = newOtpArray.join("");
      onChange(newOtp);

      if (index > 0) {
        inputRefs.current[index - 1].focus();
      }
    }
  };

  const handleKeyDown = (e, index) => {
    // If backspace is pressed on an empty input, move to previous
    if (e.key === "Backspace" && !value[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  return open ? (
    <div
      className="modal fade show d-block"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Enter OTP to {actionLabel}</h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              disabled={loading}
            >
              <MdOutlineClose /> {/* Using MdOutlineClose for the close button */}
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
                  value={value[idx] || ""}
                  onChange={(e) => handleOtpChange(e, idx)}
                  onKeyDown={(e) => handleKeyDown(e, idx)}
                  ref={(el) => (inputRefs.current[idx] = el)} // Assign ref to each input
                  disabled={loading}
                />
              ))}
            </div>
          </div>
          <div className="modal-footer">
            <button
              className="btn btn-link"
              onClick={onResend}
              disabled={loading}
            >
              Resend OTP
            </button>
            <button
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              disabled={loading || value.length !== 6}
              onClick={onSubmit}
            >
              {loading ? "Processing..." : actionLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  ) : null;
};

function VehicleServiceManager() {
  const [allVehicles, setAllVehicles] = useState([]);
  const [servicedVehicles, setServicedVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingServiced, setLoadingServiced] = useState(true);
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState("due");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "model",
    direction: "asc",
  });

  // OTP
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpAction, setOtpAction] = useState(null); // { type: 'service'|'available', id }
  const [otpActionLabel, setOtpActionLabel] = useState("");

  // Error handling
  const [errorType, setErrorType] = useState(null); // "unauthorized" | "server" | null

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

  // Fetch all vehicles
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = getAuthToken();
        const response = await fetch(ENDPOINTS.VEHICLES_LIST, {
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        });
        const data = await handleApiResponse(response);
        setAllVehicles(data.results || []);
      } catch (error) {
        toast.error("Failed to load vehicles: " + error.message);
        setAllVehicles([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [refetchTrigger]);

  // Fetch serviced vehicles
  useEffect(() => {
    const fetchServicedVehicles = async () => {
      try {
        setLoadingServiced(true);
        const token = getAuthToken();
        const response = await fetch(ENDPOINTS.SERVICED_VEHICLES, {
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        });
        const data = await handleApiResponse(response);
        setServicedVehicles(data.results || []);
      } catch (error) {
        toast.error("Failed to load serviced vehicles: " + error.message);
        setServicedVehicles([]);
      } finally {
        setLoadingServiced(false);
      }
    };
    fetchServicedVehicles();
  }, [refetchTrigger]);

  // Helper function to display status text
  const getStatusDisplay = (status) => {
    switch (status) {
      case "available":
        return "Available";
      case "service":
      case "under_service":
        return "Under Service";
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  // === OTP Logic ===
  // 1. Request OTP modal for all sensitive actions (service/available)
  const requestOtp = async (actionType, id, label) => {
    try {
      setOtpLoading(true);
      setOtpValue("");
      setOtpAction({ type: actionType, id });
      setOtpActionLabel(label);
      setOtpModalOpen(true);

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
      toast.success("OTP sent to your phone");
    } catch (err) {
      toast.error(err.message);
      setOtpModalOpen(false);
    } finally {
      setOtpLoading(false);
    }
  };

  // 2. OTP submit logic for service/available
  const handleOtpSubmit = async () => {
    if (!otpAction) return;
    setOtpLoading(true);
    try {
      const token = getAuthToken();
      let url = "";
      if (otpAction.type === "service")
        url = ENDPOINTS.MARK_VEHICLE_SERVICE(otpAction.id);
      if (otpAction.type === "available")
        url = ENDPOINTS.MARK_VEHICLE_AVAILABLE(otpAction.id);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ otp_code: otpValue }),
      });

      await handleApiResponse(response);
      setRefetchTrigger((prev) => prev + 1);
      toast.success(
        otpAction.type === "service"
          ? "Vehicle marked as Under Service"
          : "Vehicle marked as Available"
      );
      setOtpModalOpen(false);
      setOtpAction(null);
      setOtpValue("");
    } catch (error) {
      toast.error("Failed to update vehicle status: " + error.message);
    } finally {
      setOtpLoading(false);
    }
  };

  // Filter vehicles based on active tab and search term
  const filterVehicles = () => {
    let filtered = [];
    if (activeTab === "due")
      filtered = allVehicles.filter((v) => v.status === "available");
    else if (activeTab === "under") filtered = servicedVehicles;
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

  // Get filtered and sorted vehicles
  const filteredVehicles = getSortedVehicles(filterVehicles());

  // Get status badge class
  const getStatusClass = (status) => {
    switch (status) {
      case "available":
        return "bg-success";
      case "service":
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

  // Determine if we should show loading state
  const showLoading = () => {
    if (activeTab === "under") return loadingServiced;
    if (activeTab === "due") return loading;
    return loading || loadingServiced;
  };

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
            Vehicle Service Management
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
              disabled={activeTab === "all"}
            />
          </div>
          <button
            className="btn btn-outline-primary d-flex align-items-center"
            onClick={() => setRefetchTrigger((prev) => prev + 1)}
            disabled={loading || loadingServiced}
          >
            <FaSync
              className={loading || loadingServiced ? "me-2 spin" : "me-2"}
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
                  activeTab === "under" ? "active" : ""
                } d-flex align-items-center`}
                onClick={() => setActiveTab("under")}
                style={{ minWidth: "200px" }}
              >
                <FaWrench className="me-2" />
                Under Service
                <span className="badge bg-warning text-dark ms-2">
                  {servicedVehicles.length}
                </span>
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${
                  activeTab === "due" ? "active" : ""
                } d-flex align-items-center`}
                onClick={() => setActiveTab("due")}
                style={{ minWidth: "200px" }}
              >
                <FaWrench className="me-2" />
                Due Service
                <span className="badge bg-danger ms-2">
                  {allVehicles.filter((v) => v.status === "available").length}
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
                  <th
                    onClick={() => handleSort("model")}
                    className="cursor-pointer"
                  >
                    <div className="d-flex align-items-center">
                      Vehicle{getSortIcon("model")}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("license_plate")}
                    className="cursor-pointer"
                  >
                    <div className="d-flex align-items-center">
                      Plate No.{getSortIcon("license_plate")}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("driver_name")}
                    className="cursor-pointer"
                  >
                    <div className="d-flex align-items-center">
                      Driver{getSortIcon("driver_name")}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("total_kilometers")}
                    className="cursor-pointer text-end"
                  >
                    <div className="d-flex align-items-center justify-content-end">
                      Total KM{getSortIcon("total_kilometers")}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("last_service_kilometers")}
                    className="cursor-pointer text-end"
                  >
                    <div className="d-flex align-items-center justify-content-end">
                      Last Service KM{getSortIcon("last_service_kilometers")}
                    </div>
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
                        <div
                          className="spinner-border text-primary"
                          role="status"
                        >
                          <span className="visually-hidden">Loading...</span>
                        </div>
                        <span className="ms-3">
                          {activeTab === "under"
                            ? "Loading serviced vehicles..."
                            : "Loading vehicles..."}
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
                          {activeTab === "due"
                            ? "No vehicles currently due for service"
                            : "No vehicles currently under service"}
                        </p>
                        <small className="text-muted">
                          {searchTerm
                            ? "Try adjusting your search term"
                            : "Add new vehicles or check back later"}
                        </small>
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
                        <span className="badge bg-light text-dark border px-2 py-1 fw-normal">
                          {vehicle.license_plate}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="bg-light rounded-circle p-2 me-2">
                            <FaUser className="fs-5" />
                          </div>
                          <span>{vehicle.driver_name || "Unassigned"}</span>
                        </div>
                      </td>
                      <td className="text-end fw-medium">
                        {vehicle.total_kilometers
                          ? `${vehicle.total_kilometers.toLocaleString()} km`
                          : "N/A"}
                      </td>
                      <td className="text-end">
                        {vehicle.last_service_kilometers
                          ? `${vehicle.last_service_kilometers.toLocaleString()} km`
                          : "N/A"}
                      </td>
                      <td>
                        <span
                          className={`badge ${getStatusClass(
                            vehicle.status
                          )} py-2 px-3`}
                        >
                          {getStatusDisplay(vehicle.status)}
                        </span>
                      </td>
                      <td className="text-center">
                        {vehicle.status === "available" ? (
                          <button
                            className="btn btn-sm btn-outline-primary d-flex align-items-center"
                            onClick={() =>
                              requestOtp(
                                "service",
                                vehicle.id,
                                "mark as Under Service"
                              )
                            }
                          >
                            <FaWrench className="me-1" /> Service (OTP)
                          </button>
                        ) : vehicle.status === "service" ? (
                          <button
                            className="btn btn-sm btn-outline-success d-flex align-items-center"
                            onClick={() =>
                              requestOtp(
                                "available",
                                vehicle.id,
                                "mark as Available"
                              )
                            }
                          >
                            <FaCar className="me-1" /> Available (OTP)
                          </button>
                        ) : (
                          <span className="text-muted">No action</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {activeTab !== "all" && (
          <div className="card-footer bg-white d-flex justify-content-between align-items-center py-3 border-0">
            <div className="text-muted small">
              Showing{" "}
              <span className="fw-medium">{filteredVehicles.length}</span>{" "}
              vehicles
              {activeTab !== "under" && (
                <span>
                  {" "}
                  of{" "}
                  <span className="fw-medium">
                    {activeTab === "due"
                      ? allVehicles.filter((v) => v.status === "available")
                          .length
                      : allVehicles.length}
                  </span>
                </span>
              )}
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
        )}
      </div>

      <OTPModal
        open={otpModalOpen}
        loading={otpLoading}
        value={otpValue}
        onChange={setOtpValue}
        onClose={() => {
          setOtpModalOpen(false);
          setOtpValue("");
          setOtpAction(null);
        }}
        onResend={() =>
          requestOtp(otpAction?.type, otpAction?.id, otpActionLabel)
        }
        onSubmit={handleOtpSubmit}
        actionLabel={otpActionLabel}
      />

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
        .nav-link {
          transition: all 0.2s ease;
          border-radius: 0.5rem 0.5rem 0 0 !important;
        }
        .nav-link.active {
          background-color: #f8f9fa;
          border-bottom: 3px solid #0d6efd;
          font-weight: 500;
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
        .all-vehicles-view h3 {
          border-bottom: 2px solid #e9ecef;
          padding-bottom: 0.5rem;
        }
      `}</style>
    </div>
  );
}

export default VehicleServiceManager;