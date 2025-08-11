import React, { useState, useEffect } from "react";
import axios from "axios";
import "../index.css";
import { ENDPOINTS } from "../utilities/endpoints";
import CustomPagination from "./CustomPagination";
import UnauthorizedPage from "./UnauthorizedPage";
import ServerErrorPage from "./ServerErrorPage";

const HistoryPage = () => {
  const itemsPerPage = 5;
  const [history, setHistory] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("");
  const [errorType, setErrorType] = useState(null); // "unauthorized" | "server" | null

  const token = localStorage.getItem("authToken");

  useEffect(() => {
    const fetchHistory = async () => {
      if (!token) {
        setErrorType("unauthorized");
        setLoading(false);
        console.error("Error: No token found in localStorage");
        return;
      }

      try {
        const response = await axios.get(ENDPOINTS.STATUS_HISTORY_LIST, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.status === 401) {
          setErrorType("unauthorized");
          setLoading(false);
          return;
        }

        // Log the API response
        console.log("API Response:", response.data);
          setHistory(response.data);

        setLoading(false);
      } catch (err) {
        if (err.response && err.response.status === 401) {
          setErrorType("unauthorized");
        } else {
          setErrorType("server");
        }
        setLoading(false);
        console.error("API Error:", err);
      }
    };

    fetchHistory();
  }, [token]);

  // Filter history based on status
  const filteredHistory = history.filter((record) => {
    if (filter === "approved") return record.status === "approve";
    if (filter === "rejected") return record.status === "reject";

    return true;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentPageHistory = filteredHistory.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const handleNextPage = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  const handlePreviousPage = () =>
    setCurrentPage((prev) => Math.max(prev - 1, 1));

  if (errorType === "unauthorized") {
    return <UnauthorizedPage />;
  }
  if (errorType === "server") {
    return <ServerErrorPage />;
  }

  return (
    <div
      className="container-fluid py-4"
      style={{ minHeight: "100vh", backgroundColor: "#f8f9fc" }}
    >
      <h2 className="h5 mb-4">History</h2>

      {loading && <p>Loading...</p>}
      {error && <div className="alert alert-danger">{error}</div>}

      {/* Filter Options */}
      <div className="mb-3 d-flex flex-wrap">
        <button
          className="btn btn-success me-2 mb-2"
          onClick={() => setFilter("approved")}
        >
          Approved
        </button>
        <button
          className="btn btn-danger me-2 mb-2"
          onClick={() => setFilter("rejected")}
        >
          Rejected
        </button>
        <button
          className="btn btn-secondary mb-2"
          onClick={() => setFilter("")}
        >
          All
        </button>
      </div>

      <div className="card shadow-sm">
        <div className="card-body">
          {/* Responsive Table */}
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th className="d-none d-md-table-cell">Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {currentPageHistory.length > 0 ? (
                  currentPageHistory.map((record, index) => (
                    <tr key={record.id}>
                      <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                      <td>{record.user_full_name}</td>
                      <td>{record.user_email}</td>
                      <td className="d-none d-md-table-cell">
                        {record.status === "approve" ? (
                          <span className="text-success fw-bold">Approved</span>
                        ) : (
                          <span className="text-danger fw-bold">Rejected</span>
                        )}
                      </td>
                      <td>{new Date(record.timestamp).toLocaleDateString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center">
                      No history records available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div
          className="d-flex justify-content-center align-items-center"
          style={{ height: "100px" }} // Center pagination
        >
          <CustomPagination
            currentPage={currentPage}
            totalPages={totalPages}
            handlePageChange={(page) => setCurrentPage(page)} // Update current page
          />
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
