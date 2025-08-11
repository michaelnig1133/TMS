import React, { useState } from "react";

const BMHistoryPage = () => {
  const itemsPerPage = 5; // Number of items to display per page
  const [currentPage, setCurrentPage] = useState(1); // Current page number
  const [filter, setFilter] = useState("all"); // Default filter is "all"

  // Sample data for demonstration
  const sampleRequests = [
    {
      id: 1,
      name: "John Doe",
      email: "johndoe@example.com",
      request_type: "Budget Approval",
      department: "Finance",
      action: "Requested budget approval",
      date: "2025-01-25",
      status: "Approved",
    },
    {
      id: 2,
      name: "Jane Smith",
      email: "janesmith@example.com",
      request_type: "Project Approval",
      department: "HR",
      action: "Requested project approval",
      date: "2025-01-26",
      status: "Rejected",
    },
    {
      id: 3,
      name: "Alice Johnson",
      email: "alice.johnson@example.com",
      request_type: "Policy Change",
      department: "Operations",
      action: "Requested policy change",
      date: "2025-01-27",
      status: "Approved",
    },
    {
      id: 4,
      name: "Bob Brown",
      email: "bob.brown@example.com",
      request_type: "Hiring Approval",
      department: "HR",
      action: "Requested hiring approval",
      date: "2025-01-28",
      status: "Approved",
    },
  ];

  // Filter requests based on request type
  const filteredRequests = sampleRequests.filter((record) => {
    if (filter === "Budget Approval") return record.request_type === "Budget Approval";
    if (filter === "Project Approval") return record.request_type === "Project Approval";
    if (filter === "Policy Change") return record.request_type === "Policy Change";
    if (filter === "Hiring Approval") return record.request_type === "Hiring Approval";
    return true; // Show all records if filter is "all"
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentPageRequests = filteredRequests.slice(startIndex, startIndex + itemsPerPage);

  const handleNextPage = () => {
    if (currentPage * itemsPerPage < filteredRequests.length) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="container py-4" style={{ minHeight: "100vh", backgroundColor: "#f8f9fc" }}>
      <h2 className="h5 mb-4">CEO/Manager History</h2>

      {/* Filter Dropdown */}
      <div className="d-flex justify-content-end mb-3">
        <select
          id="filterDropdown"
          className="form-select form-select-sm w-auto"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">All</option>
          <option value="Budget Approval">Budget Approval</option>
          <option value="Project Approval">Project Approval</option>
          <option value="Policy Change">Policy Change</option>
          <option value="Hiring Approval">Hiring Approval</option>
        </select>
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
                  <th>Request Type</th>
                  <th>Department</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {currentPageRequests.length > 0 ? (
                  currentPageRequests.map((record, index) => (
                    <tr key={record.id}>
                      <td>{startIndex + index + 1}</td>
                      <td>{record.name}</td>
                      <td>{record.email}</td>
                      <td>{record.request_type}</td>
                      <td>{record.department}</td>
                      <td>{record.date}</td>
                      <td
                        className={
                          record.status === "Approved"
                            ? "text-success fw-bold"
                            : "text-danger fw-bold"
                        }
                      >
                        {record.status}
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

      {/* Pagination */}
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
          disabled={currentPage * itemsPerPage >= filteredRequests.length}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default BMHistoryPage;