import { useState, useEffect, useCallback } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { FaSync, FaSearch, FaCar } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ENDPOINTS } from "../utilities/endpoints"; 
import UnauthorizedPage from "./UnauthorizedPage";
import ServerErrorPage from "./ServerErrorPage";
import { useLanguage } from "../context/LanguageContext";

const AvailableVehiclesTable = () => {
  const { myLanguage } = useLanguage();
  const [rentedVehicles, setRentedVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorType, setErrorType] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const accessToken = localStorage.getItem("authToken");

  const fetchVehicles = useCallback(async () => {
    // Check for access token
    if (!accessToken) {
      setErrorType("unauthorized");
      return;
    }

    setLoading(true);
    setErrorType(null);

    try {
      // Fetch only rented vehicles
      const rentedRes = await fetch(ENDPOINTS.RENTED_AVAILABLE_VEHICLES, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // Handle unauthorized status
      if (rentedRes.status === 401) {
        setErrorType("unauthorized");
        return;
      }

      // Handle other non-OK responses
      if (!rentedRes.ok) {
        setErrorType("server");
        throw new Error("Error fetching rented vehicles");
      }

      // Parse and set rented vehicles data
      const rentedData = await rentedRes.json();
      setRentedVehicles(Array.isArray(rentedData.results) ? rentedData.results : rentedData);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      setErrorType("server");
      toast.error(myLanguage==="EN"?"Failed to load rented vehicles.":"የኪራይ መኪናዎችን መጫን አልተቻለም።");
    } finally {
      setLoading(false);
    }
  }, [accessToken]); // Re-run effect if accessToken changes

  // Fetch vehicles on component mount
  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  // Filter vehicles based on search term
  const getFilteredVehicles = () => {
    const currentVehicles = rentedVehicles; // Only rented vehicles now
    return currentVehicles.filter((vehicle) => {
      const term = searchTerm.toLowerCase();
      return (
        (vehicle.model && vehicle.model.toLowerCase().includes(term)) ||
        (vehicle.license_plate && vehicle.license_plate.toLowerCase().includes(term)) ||
        (vehicle.capacity && vehicle.capacity.toString().includes(term)) ||
        (vehicle.fuel_type && vehicle.fuel_type.toLowerCase().includes(term)) ||
        (vehicle.driver_name && vehicle.driver_name.toLowerCase().includes(term))
      );
    });
  };

  const filteredVehicles = getFilteredVehicles();

  // Render error pages if applicable
  if (errorType === "unauthorized") return <UnauthorizedPage />;
  if (errorType === "server") return <ServerErrorPage />;

  return (
    <div className="container py-4">
      <ToastContainer position="top-center" autoClose={3000} />

      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="d-flex align-items-center">
          <FaCar className="me-2 text-success" />
        Available Vehicles 
        </h2>
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
            className="btn btn-outline-success d-flex align-items-center"
            onClick={fetchVehicles}
            disabled={loading}
          >
            <FaSync className={loading ? "me-2 spin" : "me-2"} />
            Refresh
          </button>
        </div>
      </div>

      {/* Tab Navigation removed as only Rented Vehicles are displayed */}

      {/* Vehicle Table */}
      <div className="card shadow-sm border-0">
        <div className="card-body p-0">
          <div className="table-responsive">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-success" />
                <div>Loading vehicles...</div>
              </div>
            ) : filteredVehicles.length === 0 ? (
              <div className="text-center text-muted py-5">
                <FaCar className="fs-1 mb-3 text-muted" />
                <p className="fs-5 fw-medium">No rented vehicles found</p>
              </div>
            ) : (
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>#</th>
                    <th>Model</th>
                    <th>License Plate</th>
                    <th>Capacity</th>
                    <th>Fuel Type</th>
                    <th>Driver</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVehicles.map((vehicle, idx) => (
                    <tr key={vehicle.id}>
                      <td>{idx + 1}</td>
                      <td>{vehicle.model || "N/A"}</td>
                      <td>{vehicle.license_plate || "N/A"}</td>
                      <td>{vehicle.capacity || "N/A"}</td>
                      <td>{vehicle.fuel_type || "N/A"}</td>
                      <td>{vehicle.driver_name || "Unassigned"}</td>
                      <td>
                        <span
                          className={`badge ${
                            vehicle.status === "available"
                              ? "bg-success"
                              : vehicle.status === "in_use"
                              ? "bg-warning text-dark"
                              : vehicle.status === "under_service"
                              ? "bg-info text-dark"
                              : "bg-secondary"
                          } py-2 px-3`}
                        >
                          {vehicle.status ? vehicle.status.replace(/_/g, " ").toUpperCase() : "N/A"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
        <div className="card-footer bg-white d-flex justify-content-between py-3">
          <div className="text-muted small">
            Showing <span className="fw-medium">{filteredVehicles.length}</span> vehicles
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

      {/* Spinner animation style */}
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
      `}</style>
    </div>
  );
};

export default AvailableVehiclesTable;
