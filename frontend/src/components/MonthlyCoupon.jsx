import React, { useState, useEffect, useCallback } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { FaSync, FaSearch, FaUser } from "react-icons/fa";
import { FaTicketAlt } from "react-icons/fa";
import { IoClose } from "react-icons/io5";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ENDPOINTS } from "../utilities/endpoints";
import UnauthorizedPage from "./UnauthorizedPage";
import ServerErrorPage from "./ServerErrorPage";

function formatDisplayMonth(monthString) {
  if (!monthString) return "";
  const [year, month] = monthString.split("-");
  const date = new Date(year, month - 1);
  return date.toLocaleString("default", { month: "long", year: "numeric" });
}

// Helper function to format vehicle display
const getVehicleDisplay = (vehicle) => {
  if (!vehicle) return "";
  return `${vehicle.model || "Unknown Model"} - ${vehicle.license_plate || "No Plate"}`;
};

const MonthlyCoupon = () => {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refuelLogs, setRefuelLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [userVehicles, setUserVehicles] = useState([]);
  const [errorType, setErrorType] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "month", direction: "asc" });
  const [formData, setFormData] = useState({ 
    vehicle: "",
    month: ""
  });

  // Get current month in YYYY-MM format
  const getCurrentMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  };

  // Fetch current user
  const fetchCurrentUser = useCallback(async () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      setErrorType("unauthorized");
      return;
    }
    try {
      const res = await fetch(ENDPOINTS.CURRENT_USER, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.status === 401) {
        setErrorType("unauthorized");
        return;
      }
      if (!res.ok) {
        setErrorType("server");
        return;
      }
      const user = await res.json();
      setCurrentUser(user);
    } catch {
      setErrorType("server");
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  // Fetch coupon requests
  const fetchRefuelLogs = useCallback(async () => {
    setLoadingLogs(true);
    const token = localStorage.getItem("authToken");
    if (!token) {
      setErrorType("unauthorized");
      setLoadingLogs(false);
      setRefuelLogs([]);
      return;
    }
    try {
      const logsResponse = await fetch(ENDPOINTS.COUPON_REQUEST_LIST, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (logsResponse.status === 401) {
        setErrorType("unauthorized");
        setRefuelLogs([]);
        setLoadingLogs(false);
        return;
      }
      if (!logsResponse.ok) {
        setErrorType("server");
        throw new Error("Failed to load coupon requests");
      }
      const logsData = await logsResponse.json();
      setRefuelLogs(Array.isArray(logsData.results) ? logsData.results : []);
    } catch (error) {
      setErrorType("server");
      setRefuelLogs([]);
    } finally {
      setLoadingLogs(false);
    }
  }, []);

  useEffect(() => {
    fetchRefuelLogs();
  }, [fetchRefuelLogs]);

  // Fetch current user vehicles
  const fetchUserVehicles = useCallback(async () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      setErrorType("unauthorized");
      return;
    }
    try {
      const res = await fetch(ENDPOINTS.CURRENT_USER_VEHICLES, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.status === 401) {
        setErrorType("unauthorized");
        return;
      }
      if (!res.ok) {
        setErrorType("server");
        return;
      }
      const vehicles = await res.json();
      // Handle different response formats
      const vehiclesArray = Array.isArray(vehicles) 
        ? vehicles 
        : vehicles.results 
          ? vehicles.results 
          : [vehicles];
      
      setUserVehicles(vehiclesArray);
      
      // Set initial form data when vehicles are loaded
      if (vehiclesArray.length > 0) {
        setFormData(prev => ({ 
          ...prev, 
          vehicle: vehiclesArray[0].id.toString(),
          month: getCurrentMonth()
        }));
      }
    } catch {
      setErrorType("server");
    }
  }, []);

  useEffect(() => {
    fetchUserVehicles();
  }, [fetchUserVehicles]);

  // Submit new coupon request
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validate form data
    if (!formData.vehicle || !formData.month) {
      toast.error("Please select both vehicle and month.");
      setLoading(false);
      return;
    }

    // Check if coupon for selected month and vehicle already exists
    const alreadyRequested = refuelLogs.some(
      (log) =>
        log.month === formData.month &&
        log.requester === currentUser?.id &&
        (log.vehicle === formData.vehicle || log.vehicle?.id === formData.vehicle)
    );
    if (alreadyRequested) {
      toast.error("Coupon request already exists for this vehicle and month.");
      setLoading(false);
      return;
    }

    const token = localStorage.getItem("authToken");
    if (!token) {
      toast.error("You are not authorized. Please log in.");
      setLoading(false);
      return;
    }

    try {
      // Prepare payload with the specified JSON structure
      const payload = {
        vehicle: parseInt(formData.vehicle, 10), // Ensure vehicle is a number
        month: formData.month
      };

      const response = await fetch(ENDPOINTS.CREATE_COUPON_REQUEST, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 401) {
        toast.error("You are not authorized. Please log in.");
        setLoading(false);
        return;
      }

      if (!response.ok) {
        let errorMsg = "Failed to submit coupon";
        try {
          const errData = await response.json();
          errorMsg =
            typeof errData === "string"
              ? errData
              : errData.detail || JSON.stringify(errData);
        } catch {}
        toast.error(errorMsg);
        setLoading(false);
        return;
      }

      toast.success("Refueling coupon submitted successfully!");
      setShowForm(false);
      fetchRefuelLogs();
    } catch (error) {
      toast.error(error.message || "Failed to submit coupon");
    } finally {
      setLoading(false);
    }
  };

  // Search and filter logic
  const filterCoupons = () => {
    if (!searchTerm) return refuelLogs;
    const term = searchTerm.toLowerCase();
    return refuelLogs.filter(
      (log) =>
        formatDisplayMonth(log.month).toLowerCase().includes(term) ||
        (currentUser?.full_name?.toLowerCase().includes(term)) ||
        userVehicles.some(
          (vehicle) =>
            vehicle.id === log.vehicle &&
            (vehicle.license_plate?.toLowerCase().includes(term) ||
            vehicle.model?.toLowerCase().includes(term))
        )
    );
  };

  // Sorting logic
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") direction = "desc";
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <span className="text-muted ms-1"><FaSearch /></span>;
    return sortConfig.direction === "asc" ? (
      <span className="text-primary ms-1">&#9650;</span>
    ) : (
      <span className="text-primary ms-1">&#9660;</span>
    );
  };

  const getSortedCoupons = (coupons) => {
    if (!sortConfig.key) return coupons;
    return [...coupons].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];
      
      // Handle vehicle sorting by finding the vehicle object
      if (sortConfig.key === "vehicle") {
        const vehicleA = userVehicles.find(v => v.id === a.vehicle);
        const vehicleB = userVehicles.find(v => v.id === b.vehicle);
        aValue = getVehicleDisplay(vehicleA) || "";
        bValue = getVehicleDisplay(vehicleB) || "";
      }
      
      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  };

  const filteredCoupons = getSortedCoupons(
    filterCoupons().filter((log) => log.requester === currentUser?.id)
  );

  if (errorType === "unauthorized") return <UnauthorizedPage />;
  if (errorType === "server") return <ServerErrorPage />;

  return (
    <div className="container py-4" style={{ minHeight: "100vh", backgroundColor: "#f8f9fc" }}>
      <ToastContainer position="top-center" autoClose={3000} />
      <div className="mb-4">
        <h2 className="mb-0 d-flex align-items-center">
          <FaTicketAlt className="me-2 text-primary" />
          Refueling Coupons
        </h2>
        <div className="d-flex justify-content-between align-items-center mt-3">
          <button
            className="btn"
            style={{
              width: "200px",
              backgroundColor: "rgba(31, 41, 55, 0.9)",
              color: "#fff",
            }}
            onClick={() => setShowForm(true)}
          >
            Add Refueling Coupon
          </button>
          <div className="d-flex gap-2">
            <div className="input-group shadow-sm" style={{ maxWidth: "300px" }}>
              <span className="input-group-text bg-white border-end-0">
                <FaSearch className="text-muted" />
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Search by month, name or vehicle..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              className="btn btn-outline-primary d-flex align-items-center"
              onClick={fetchRefuelLogs}
              disabled={loadingLogs}
            >
              <FaSync className={loadingLogs ? "me-2 spin" : "me-2"} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Modal Form */}
      {showForm && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          role="dialog"
          aria-modal="true"
          style={{ background: "rgba(0,0,0,0.4)" }}
        >
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <form onSubmit={handleSubmit}>
                <div className="modal-header d-flex justify-content-between align-items-start">
                  <h5 className="modal-title">Add Refueling Coupon</h5>
                  <button
                    type="button"
                    className="btn p-0"
                    aria-label="Close"
                    onClick={() => setShowForm(false)}
                    style={{
                      border: "none",
                      background: "none",
                      fontSize: "1.5rem",
                      lineHeight: 1,
                      position: "absolute",
                      top: "16px",
                      right: "20px",
                    }}
                  >
                    <IoClose />
                  </button>
                </div>
                <div className="modal-body">
                  {/* Vehicle Select Dropdown */}
                  <div className="mb-3">
                    <label htmlFor="vehicle" className="form-label">
                      Vehicle
                    </label>
                    <select
                      id="vehicle"
                      name="vehicle"
                      className="form-select"
                      value={formData.vehicle}
                      onChange={(e) =>
                        setFormData(prev => ({ ...prev, vehicle: e.target.value }))
                      }
                      required
                      disabled={userVehicles.length === 0}
                    >
                      {userVehicles.length === 0 ? (
                        <option value="">No vehicles available</option>
                      ) : (
                        <>
                          <option value="">-- Select a vehicle --</option>
                          {userVehicles.map((vehicle) => (
                            <option key={vehicle.id} value={vehicle.id}>
                              {getVehicleDisplay(vehicle)}
                            </option>
                          ))}
                        </>
                      )}
                    </select>
                  </div>

                  {/* Month Selection */}
                  <div className="mb-3">
                    <label htmlFor="month" className="form-label">
                      Month
                    </label>
                    <input
                      type="month"
                      className="form-control"
                      id="month"
                      name="month"
                      value={formData.month}
                      onChange={(e) =>
                        setFormData(prev => ({ ...prev, month: e.target.value }))
                      }
                      required
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowForm(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn"
                    style={{
                      backgroundColor: "rgba(31, 41, 55, 0.9)",
                      color: "#fff",
                    }}
                    disabled={loading || userVehicles.length === 0}
                  >
                    {loading ? "Submitting..." : "Submit"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Card Display */}
      <div className="card shadow-sm border-0 overflow-hidden">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th onClick={() => handleSort("month")} className="cursor-pointer">
                    <div className="d-flex align-items-center">
                      Month{getSortIcon("month")}
                    </div>
                  </th>
                  <th onClick={() => handleSort("requester")} className="cursor-pointer">
                    <div className="d-flex align-items-center">
                      Requester{getSortIcon("requester")}
                    </div>
                  </th>
                  <th onClick={() => handleSort("vehicle")} className="cursor-pointer">
                    <div className="d-flex align-items-center">
                      Vehicle{getSortIcon("vehicle")}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {loadingLogs ? (
                  <tr>
                    <td colSpan="3" className="text-center py-5">
                      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "200px" }}>
                        <div className="spinner-border text-primary" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : !currentUser ? (
                  <tr>
                    <td colSpan="3" className="text-center text-muted py-5">
                      Loading user info...
                    </td>
                  </tr>
                ) : filteredCoupons.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="text-center py-5">
                      <div className="py-4">
                        <FaUser className="fs-1 text-muted mb-3" />
                        <p className="mb-1 fw-medium fs-5">No refueling coupons found.</p>
                        <small className="text-muted">Check back later or adjust your search.</small>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredCoupons.map((log) => {
                    const vehicle = userVehicles.find(v => v.id === log.vehicle);
                    return (
                      <tr key={log.id}>
                        <td>{formatDisplayMonth(log.month)}</td>
                        <td>{currentUser.full_name}</td>
                        <td>
                          {vehicle ? (
                            getVehicleDisplay(vehicle)
                          ) : (
                            `Vehicle #${log.vehicle}`
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

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

export default MonthlyCoupon;