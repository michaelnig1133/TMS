import { useState, useEffect, useCallback } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { IoClose } from "react-icons/io5";
import { FaSync, FaSearch, FaTicketAlt, FaCalendarAlt } from "react-icons/fa";
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

const MonthlyCouponTM = () => {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refuelLogs, setRefuelLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [errorType, setErrorType] = useState(null);
  const [searchTerm, setSearchTerm] = useState(""); // For searching coupons

  // Get current month in YYYY-MM format
  const getCurrentMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  };
  const currentMonth = getCurrentMonth();

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
      console.log("Fetched coupon requests:", logsData);
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

  // Submit new coupon request
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Check if coupon for current month already exists
    const alreadyRequested = refuelLogs.some(
      (log) => log.month === currentMonth
    );
    if (alreadyRequested) {
      toast.error("Coupon request already added for this month.");
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
      const payload = { month: currentMonth };
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
      const responseData = await response.json();
      console.log("Submitted coupon request:", responseData);
      toast.success("Refueling coupon submitted!");
      setShowForm(false);
      fetchRefuelLogs();
    } catch (error) {
      toast.error(error.message || "Failed to submit coupon");
    } finally {
      setLoading(false);
    }
  };

  if (errorType === "unauthorized") {
    return <UnauthorizedPage />;
  }
  if (errorType === "server") {
    return <ServerErrorPage />;
  }

  // Search filtering
  const filteredLogs = refuelLogs.filter((log) => {
    const monthStr = formatDisplayMonth(log.month).toLowerCase();
    return (
      monthStr.includes(searchTerm.toLowerCase()) ||
      (log.requester && log.requester.toString().toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.vehicle && log.vehicle.toString().toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  return (
    <div className="container py-4">
      <ToastContainer position="top-center" autoClose={3000} />
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0 d-flex align-items-center">
          <FaTicketAlt className="me-2 text-primary" />
          Monthly Refueling Coupons
        </h2>
        <div className="d-flex gap-2">
          <div className="input-group shadow-sm" style={{ maxWidth: "300px" }}>
            <span className="input-group-text bg-white border-end-0">
              <FaSearch className="text-muted" />
            </span>
            <input
              type="text"
              className="form-control border-start-0"
              placeholder="Search coupons, requester, vehicle..."
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

      {/* Modal Form */}
      {showForm && (
        <div className="modal fade show d-block" style={{ background: "rgba(0,0,0,0.4)" }}>
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
                  <div className="mb-3 text-center">
                    <h3>{formatDisplayMonth(currentMonth)}</h3>
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
                    className="btn btn-primary"
                    style={{ minWidth: "120px" }}
                  >
                    {loading ? "Submitting..." : "Submit"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Table Display */}
      <div className="card shadow-sm border-0 overflow-hidden mt-3">
        <div className="card-body p-0">
          <div className="table-responsive">
            {loadingLogs ? (
              <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "200px" }}>
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading coupons...</span>
                </div>
                <span className="ms-3">Loading coupons...</span>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center text-muted py-5">
                <FaTicketAlt className="fs-1 text-muted mb-3" />
                <p className="mb-1 fw-medium fs-5">No refueling coupons found.</p>
                <small>Check back later or submit your coupon.</small>
              </div>
            ) : (
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>#</th>
                    <th>Month</th>
                    <th>Requester</th>
                    <th>Model</th>
                    <th>Plate Number</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log, idx) => {
                    let model = "";
                    let plate = "";
                    if (log.vehicle_name) {
                      // Example: "Model: Toyota - License Plate: AA6569"
                      const modelMatch = log.vehicle_name.match(/Model:\s*([^\-]*)/);
                      const plateMatch = log.vehicle_name.match(/License Plate:\s*(.*)$/);
                      model = modelMatch ? modelMatch[1].trim() : "";
                      plate = plateMatch ? plateMatch[1].trim() : "";
                    } else if (log.vehicle) {
                      model = log.vehicle;
                    }
                    return (
                      <tr key={log.id}>
                        <td>{idx + 1}</td>
                        <td>{formatDisplayMonth(log.month)}</td>
                        <td>{log.requester_name || log.requester}</td>
                        <td>{model}</td>
                        <td>{plate}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
        <div className="card-footer bg-white d-flex justify-content-between align-items-center py-3 border-0">
          <div className="text-muted small">
            Showing <span className="fw-medium">{filteredLogs.length}</span> coupons
            <span> of <span className="fw-medium">{refuelLogs.length}</span></span>
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

export default MonthlyCouponTM;