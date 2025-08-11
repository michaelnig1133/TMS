import React, { useState, useEffect } from "react";
import { ENDPOINTS } from "../utilities/endpoints";
import UnauthorizedPage from "./UnauthorizedPage";
import ServerErrorPage from "./ServerErrorPage";

const RequestHistory = () => {
  const itemsPerPage = 5;
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [historyRecords, setHistoryRecords] = useState([]);
  const [detailModal, setDetailModal] = useState({
    open: false,
    data: null,
    loading: false,
    error: null,
  });
  const [errorType, setErrorType] = useState(null); // "unauthorized" | "server" | null

  const filterOptions = [
    { label: "All", value: "all" },
    { label: "Refueling Request", value: "refuelingrequest" },
    { label: "Maintenance Request", value: "maintenancerequest" },
    { label: "High-Cost Request", value: "highcosttransportrequest" },
    { label: "Transport Request", value: "transportrequest" },
  ];

  useEffect(() => {
    const fetchHistoryRecords = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("authToken");
        if (!token) {
          setErrorType("unauthorized");
          setLoading(false);
          setHistoryRecords([]);
          return;
        }
        const response = await fetch(ENDPOINTS.ACTION_LOGS_LIST, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            setErrorType("unauthorized");
          } else {
            setErrorType("server");
          }
          setLoading(false);
          setHistoryRecords([]);
          return;
        }

        const data = await response.json();
        setHistoryRecords(Array.isArray(data) ? data : data.results || []);
      } catch (err) {
        setErrorType("server");
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchHistoryRecords();
  }, []);

  const filteredRequests = historyRecords.filter((record) => {
    if (filter === "all") return true;
    return record.request_type === filter;
  });

  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentPageRequests = filteredRequests.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  const handleViewDetail = async (pk) => {
    setDetailModal({ open: true, data: null, loading: true, error: null });
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(ENDPOINTS.ACTION_LOGS_DETAIL(pk), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setDetailModal({ open: true, data, loading: false, error: null });
    } catch (err) {
      setDetailModal({
        open: true,
        data: null,
        loading: false,
        error: err.message,
      });
    }
  };

  const handleCloseModal = () => {
    setDetailModal({ open: false, data: null, loading: false, error: null });
  };

  // Universal standard and mandatory fields to show for all request types
  function renderStandardDetailFields(detail) {
    return (
      <>
        <p>
          <strong>Action:</strong> {detail.action || "N/A"}
        </p>
        <p>
          <strong>Action By:</strong> {detail.action_by || "N/A"}
        </p>
        <p>
          <strong>Role:</strong> {detail.role_display || "N/A"}
        </p>
        <p>
          <strong>Status at Time:</strong> {detail.status_at_time || "N/A"}
        </p>
        <p>
          <strong>Date:</strong>{" "}
          {detail.timestamp
            ? new Date(detail.timestamp).toLocaleString()
            : detail.date
            ? new Date(detail.date).toLocaleString()
            : "N/A"}
        </p>
        <p>
          <strong>Request Type:</strong> {detail.request_type || "N/A"}
        </p>
        <p>
          <strong>Request ID:</strong> {detail.request_id || "N/A"}
        </p>
        {detail.remarks && (
          <p>
            <strong>Remarks:</strong> {detail.remarks}
          </p>
        )}
      </>
    );
  }

  // Specific fields by request type
  function renderRequestObjectFields(detail) {
    if (!detail || !detail.request_object) return null;
    const ro = detail.request_object;
    switch (detail.request_type) {
      case "transportrequest":
        return (
          <>
            <h6>Transport Request Detail</h6>
            <p>
              <strong>Destination:</strong> {ro.destination ?? "N/A"}
            </p>
            <p>
              <strong>Employees:</strong>{" "}
              {Array.isArray(ro.employees)
                ? ro.employees.length > 0
                  ? ro.employees.join(", ")
                  : "N/A"
                : ro.employees ?? "N/A"}
            </p>
            <p>
              <strong>Start Day:</strong> {ro.start_day ?? "N/A"}
            </p>
            <p>
              <strong>Start Time:</strong> {ro.start_time ?? "N/A"}
            </p>
            <p>
              <strong>Return Day:</strong> {ro.return_day ?? "N/A"}
            </p>
            <p>
              <strong>Reason:</strong> {ro.reason ?? "N/A"}
            </p>
            <p>
              <strong>Status:</strong> {ro.status ?? "N/A"}
            </p>
            {ro.rejection_message && (
              <p>
                <strong>Rejection Message:</strong> {ro.rejection_message}
              </p>
            )}
            <p>
              <strong>Trip Completed:</strong>{" "}
              {"trip_completed" in ro
                ? ro.trip_completed
                  ? "Yes"
                  : "No"
                : "N/A"}
            </p>
            <p>
              <strong>Created At:</strong>{" "}
              {ro.created_at ? new Date(ro.created_at).toLocaleString() : "N/A"}
            </p>
            <p>
              <strong>Updated At:</strong>{" "}
              {ro.updated_at ? new Date(ro.updated_at).toLocaleString() : "N/A"}
            </p>
          </>
        );
      case "refuelingrequest":
        return (
          <>
            <h6>Refueling Request Detail</h6>
            <p>
              <strong>Created At:</strong>{" "}
              {ro.created_at ? new Date(ro.created_at).toLocaleString() : "N/A"}
            </p>
            <p>
              <strong>Date:</strong>{" "}
              {ro.date ? new Date(ro.date).toLocaleString() : "N/A"}
            </p>
            <p>
              <strong>Destination:</strong> {ro.destination ?? "N/A"}
            </p>
            <p>
              <strong>Estimated Distance (km):</strong>{" "}
              {ro.estimated_distance_km ?? "N/A"}
            </p>
            <p>
              <strong>Fuel Efficiency:</strong> {ro.fuel_efficiency ?? "N/A"}
            </p>
            <p>
              <strong>Fuel Needed (Liters):</strong>{" "}
              {ro.fuel_needed_liters ?? "N/A"}
            </p>
            <p>
              <strong>Fuel Price per Liter:</strong>{" "}
              {ro.fuel_price_per_liter ?? "N/A"}
            </p>
            <p>
              <strong>Fuel Type:</strong> {ro.fuel_type ?? "N/A"}
            </p>
            <p>
              <strong>Total Cost:</strong> {ro.total_cost ?? "N/A"}
            </p>
            <p>
              <strong>Requester Name:</strong> {ro.requester_name ?? "N/A"}
            </p>
            <p>
              <strong>Requester's Car:</strong>{" "}
              {ro.requesters_car_name ?? "N/A"}
            </p>
            <p>
              <strong>Status:</strong> {ro.status ?? "N/A"}
            </p>
          </>
        );
      case "maintenancerequest":
        return (
          <>
            <h6>Maintenance Request Detail</h6>
            <p>
              <strong>Date:</strong>{" "}
              {ro.date ? new Date(ro.date).toLocaleDateString() : "N/A"}
            </p>
            <p>
              <strong>Requester Name:</strong> {ro.requester_name ?? "N/A"}
            </p>
            <p>
              <strong>Requester's Car:</strong>{" "}
              {ro.requesters_car_name ?? "N/A"}
            </p>
            <p>
              <strong>Reason:</strong> {ro.reason ?? "N/A"}
            </p>
            <p>
              <strong>Maintenance Letter:</strong>{" "}
              {ro.maintenance_letter ? (
                <a
                  href={ro.maintenance_letter}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Download
                </a>
              ) : (
                "N/A"
              )}
            </p>
            <p>
              <strong>Maintenance Total Cost:</strong>{" "}
              {ro.maintenance_total_cost ?? "N/A"}
            </p>
            <p>
              <strong>Receipt File:</strong>{" "}
              {ro.receipt_file ? (
                <a
                  href={ro.receipt_file}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Download
                </a>
              ) : (
                "N/A"
              )}
            </p>
            <p>
              <strong>Status:</strong> {ro.status ?? "N/A"}
            </p>
            {ro.rejection_message && (
              <p>
                <strong>Rejection Message:</strong> {ro.rejection_message}
              </p>
            )}
          </>
        );
      case "highcosttransportrequest":
        return (
          <>
            <h6>High Cost Transport Request Detail</h6>
            <p>
              <strong>Created At:</strong>{" "}
              {ro.created_at ? new Date(ro.created_at).toLocaleString() : "N/A"}
            </p>
            <p>
              <strong>Updated At:</strong>{" "}
              {ro.updated_at ? new Date(ro.updated_at).toLocaleString() : "N/A"}
            </p>
            <p>
              <strong>Destination:</strong> {ro.destination ?? "N/A"}
            </p>
            <p>
              <strong>Employees:</strong>{" "}
              {Array.isArray(ro.employees)
                ? ro.employees.join(", ")
                : ro.employees ?? "N/A"}
            </p>
            <p>
              <strong>Start Day:</strong> {ro.start_day ?? "N/A"}
            </p>
            <p>
              <strong>Start Time:</strong> {ro.start_time ?? "N/A"}
            </p>
            <p>
              <strong>Return Day:</strong> {ro.return_day ?? "N/A"}
            </p>
            <p>
              <strong>Reason:</strong> {ro.reason ?? "N/A"}
            </p>
            <p>
              <strong>Status:</strong> {ro.status ?? "N/A"}
            </p>
            <p>
              <strong>Trip Completed:</strong>{" "}
              {"trip_completed" in ro
                ? ro.trip_completed
                  ? "Yes"
                  : "No"
                : "N/A"}
            </p>
            {ro.rejection_message && (
              <p>
                <strong>Rejection Message:</strong> {ro.rejection_message}
              </p>
            )}
          </>
        );
      default:
        return (
          <>
            <h6>Request Object Detail</h6>
            <pre style={{ whiteSpace: "pre-wrap" }}>
              {JSON.stringify(detail.request_object, null, 2)}
            </pre>
          </>
        );
    }
  }

  // Main UI rendering
  if (loading) {
    return (
      <div
        className="container py-4"
        style={{ minHeight: "100vh", backgroundColor: "#f8f9fc" }}
      >
        <div
          className="d-flex justify-content-center align-items-center"
          style={{ minHeight: "200px" }}
        >
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <span className="ms-3">Loading history records...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="container py-4"
        style={{ minHeight: "100vh", backgroundColor: "#f8f9fc" }}
      >
        <div className="alert alert-danger" role="alert">
          Error loading history records: {error}
        </div>
      </div>
    );
  }

  if (errorType === "unauthorized") {
    return <UnauthorizedPage />;
  }
  if (errorType === "server") {
    return <ServerErrorPage />;
  }

  return (
    <div
      className="container py-4"
      style={{ minHeight: "100vh", backgroundColor: "#f8f9fc" }}
    >
      <h2 className="h5 mb-4"> History</h2>

      {/* Filter Dropdown */}
      <div className="d-flex justify-content-end mb-3">
        <select
          id="filterDropdown"
          className="form-select form-select-sm w-auto"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          {filterOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="card shadow-sm">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Request Type</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {currentPageRequests.length > 0 ? (
                  currentPageRequests.map((record, index) => (
                    <tr key={record.id || index}>
                      <td>{startIndex + index + 1}</td>
                      <td>{record.role_display || record.name || "N/A"}</td>
                      <td>{record.request_type || "N/A"}</td>
                      <td>
                        {record.timestamp
                          ? new Date(record.timestamp).toLocaleString()
                          : record.date || "N/A"}
                      </td>
                      <td
                        className={
                          record.status_at_time === "approved"
                            ? "text-success fw-bold"
                            : record.status_at_time === "rejected"
                            ? "text-danger fw-bold"
                            : "text-muted fw-bold"
                        }
                      >
                        {record.status_at_time
                          ? record.status_at_time.charAt(0).toUpperCase() +
                            record.status_at_time.slice(1)
                          : "Pending"}
                      </td>
                      <td>
                        <button
                          className="btn btn-sm"
                          style={{ backgroundColor: "#0B455B", color: "#fff" }}
                          onClick={() => handleViewDetail(record.id)}
                        >
                          View Detail
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center">
                      No history records available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Pagination Controls */}
      {filteredRequests.length > 0 && (
        <div className="d-flex justify-content-between align-items-center mt-3">
          <button
            className="btn btn-secondary btn-sm"
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <small>
            Page {currentPage} of {totalPages}
          </small>
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleNextPage}
            disabled={currentPage >= totalPages}
          >
            Next
          </button>
        </div>
      )}

      {/* Detail Modal */}
      {detailModal.open && (
        <div
          className="modal fade show"
          style={{ display: "block", background: "rgba(0,0,0,0.3)" }}
          tabIndex="-1"
          role="dialog"
        >
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">History Record Detail</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleCloseModal}
                ></button>
              </div>
              <div className="modal-body">
                {detailModal.loading && <div>Loading...</div>}
                {detailModal.error && (
                  <div className="alert alert-danger">{detailModal.error}</div>
                )}
                {detailModal.data && (
                  <>
                    {renderStandardDetailFields(detailModal.data)}
                    {renderRequestObjectFields(detailModal.data)}
                  </>
                )}
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={handleCloseModal}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestHistory;
