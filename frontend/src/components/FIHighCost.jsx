import React, { useState, useEffect, useRef } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Logo from "../assets/Logo.jpg";
import { IoMdClose } from "react-icons/io";
import { ENDPOINTS } from "../utilities/endpoints";
import CustomPagination from "./CustomPagination";
import UnauthorizedPage from "./UnauthorizedPage";
import ServerErrorPage from "./ServerErrorPage";
import { FaSync, FaSearch, FaCarCrash } from "react-icons/fa";

const FIHighCost = () => {
  const [requests, setRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showApproveConfirmation, setShowApproveConfirmation] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [errorType, setErrorType] = useState(null);

  const printDetailRef = useRef();

  const accessToken = localStorage.getItem("authToken");
  useEffect(() => {
    fetchRequests();
    fetchUsers();
    // eslint-disable-next-line
  }, []);

  const fetchRequests = async () => {
    if (!accessToken) {
      setErrorType("unauthorized");
      return;
    }
    setLoading(true);
    try {
      const highCostRequests = await fetchHighCostRequests();
      const highCostRequestsWithLabel = highCostRequests.map((request) => ({
        ...request,
        requestType: "High Cost",
      }));
      setRequests(highCostRequestsWithLabel);
    } catch (error) {
      if (error.message && error.message.toLowerCase().includes("401")) {
        setErrorType("unauthorized");
      } else {
        setErrorType("server");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    if (!accessToken) {
      setErrorType("unauthorized");
      return;
    }
    try {
      const response = await fetch(ENDPOINTS.USER_LIST, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        if (response.status === 401) setErrorType("unauthorized");
        else setErrorType("server");
        throw new Error("Failed to fetch users");
      }
      const data = await response.json();
      setUsers(data.results || []);
    } catch (error) {}
  };

  const fetchHighCostRequests = async () => {
    if (!accessToken) {
      setErrorType("unauthorized");
      return [];
    }
    try {
      const response = await fetch(ENDPOINTS.HIGH_COST_LIST, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        if (response.status === 401) setErrorType("unauthorized");
        else setErrorType("server");
        throw new Error("Failed to fetch high-cost transport requests");
      }
      const data = await response.json();
      return data.results || [];
    } catch (error) {
      return [];
    }
  };

  const fetchHighCostDetail = async (requestId) => {
    if (!accessToken) {
      setErrorType("unauthorized");
      return;
    }
    try {
      const response = await fetch(ENDPOINTS.HIGH_COST_DETAIL(requestId), {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        if (response.status === 401) setErrorType("unauthorized");
        else setErrorType("server");
        throw new Error("Failed to fetch high-cost request details");
      }
      const data = await response.json();
      setSelectedRequest(data);
    } catch {}
  };

  const getEmployeeNames = (employeeIds = []) => {
    return employeeIds
      .map((id) => {
        const employee = users.find((user) => user.id === id);
        return employee ? employee.full_name : "Unknown";
      })
      .join(", ");
  };

  const handleViewDetail = (request) => {
    fetchHighCostDetail(request.id);
  };

  const handleCloseDetail = () => {
    setSelectedRequest(null);
    setRejectionReason("");
    setShowRejectionModal(false);
    setShowConfirmation(false);
    setShowApproveConfirmation(false);
  };

  const handleApprove = async (requestId) => {
    if (!accessToken) return;
    try {
      const response = await fetch(
        ENDPOINTS.APPREJ_HIGHCOST_REQUEST(requestId),
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ action: "approve" }),
        }
      );
      if (!response.ok) throw new Error("Failed to approve transport request");
      setRequests((prevRequests) =>
        prevRequests.map((req) =>
          req.id === requestId ? { ...req, status: "approved" } : req
        )
      );
      setSelectedRequest(null);
      toast.success("Request approved successfully!");
    } catch {
      toast.error("Failed to approve request.");
    }
  };

  const handleReject = async (requestId) => {
    if (!accessToken) return;
    if (!rejectionReason) {
      toast.error("Please provide a reason for rejection.");
      return;
    }
    try {
      const response = await fetch(
        ENDPOINTS.APPREJ_HIGHCOST_REQUEST(requestId),
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "reject",
            rejection_message: rejectionReason,
          }),
        }
      );
      if (!response.ok) throw new Error("Failed to reject transport request");
      setRequests((prevRequests) =>
        prevRequests.map((req) =>
          req.id === requestId ? { ...req, status: "rejected" } : req
        )
      );
      setSelectedRequest(null);
      setRejectionReason("");
      setShowRejectionModal(false);
      toast.success("Request rejected successfully!");
    } catch {
      toast.error("Failed to reject request.");
    }
  };

  const handleRejectClick = () => setShowRejectionModal(true);
  const handleConfirmReject = () => setShowConfirmation(true);
  const handleConfirmAction = () => {
    handleReject(selectedRequest.id);
    setShowConfirmation(false);
  };
  const handleApproveClick = () => setShowApproveConfirmation(true);
  const handleConfirmApprove = () => {
    handleApprove(selectedRequest.id);
    setShowApproveConfirmation(false);
  };

  const handlePrintDetail = () => window.print();

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageRequests = requests.slice(startIndex, endIndex);

  if (errorType === "unauthorized") return <UnauthorizedPage />;
  if (errorType === "server") return <ServerErrorPage />;

  return (
    <div className="container py-4" style={{ minHeight: "100vh", backgroundColor: "#f8f9fc" }}>
      <ToastContainer />
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="mb-0 d-flex align-items-center">
          <FaCarCrash className="me-2 text-success" />
          High-Cost Requests
        </h1>
        <button
          className="btn btn-outline-success d-flex align-items-center"
          style={{ minWidth: "160px" }}
          onClick={fetchRequests}
          disabled={loading}
        >
          <FaSync className={`me-2${loading ? " spin" : ""}`} />
          Refresh
        </button>
      </div>
      <div className="card shadow-sm border-0 overflow-hidden">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>#</th>
                  <th>Start Day</th>
                  <th>Start Time</th>
                  <th>Return Day</th>
                  <th>Destination</th>
                  <th>Status</th>
                  <th className="text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" className="text-center py-5">
                      <div className="d-flex justify-content-center align-items-center">
                        <div className="spinner-border text-success" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                        <span className="ms-3">Loading requests...</span>
                      </div>
                    </td>
                  </tr>
                ) : currentPageRequests.length > 0 ? (
                  currentPageRequests.map((request, index) => (
                    <tr key={request.id}>
                      <td>{startIndex + index + 1}</td>
                      <td>{request.start_day}</td>
                      <td>{request.start_time}</td>
                      <td>{request.return_day}</td>
                      <td>{request.destination}</td>
                      <td>
                        <span className={`badge ${
                          request.status === "forwarded"
                            ? "bg-warning text-dark"
                            : request.status === "approved"
                            ? "bg-success"
                            : request.status === "rejected"
                            ? "bg-danger"
                            : "bg-secondary"
                        } py-2 px-3`}>
                          {request.status
                            ? request.status.charAt(0).toUpperCase() +
                              request.status.slice(1)
                            : ""}
                        </span>
                      </td>
                      <td className="text-center">
                        <button
                          className="btn btn-sm btn-outline-success d-flex align-items-center"
                          onClick={() => handleViewDetail(request)}
                        >
                          <FaSearch className="me-1" />
                          View Detail
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center text-muted py-5">
                      <div className="py-4">
                        <FaCarCrash className="fs-1 text-muted mb-3" />
                        <p className="mb-1 fw-medium fs-5">
                          No transport requests found.
                        </p>
                        <small className="text-muted">
                          Check back later.
                        </small>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div className="d-flex justify-content-center align-items-center" style={{ height: "100px" }}>
        <CustomPagination
          currentPage={currentPage}
          totalPages={Math.ceil(requests.length / itemsPerPage)}
          handlePageChange={(page) => setCurrentPage(page)}
        />
      </div>
      {selectedRequest && (
        <div
          ref={printDetailRef}
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header d-print-none">
                <img
                  src={Logo}
                  alt="Logo"
                  style={{
                    width: "80px",
                    height: "50px",
                    marginRight: "10px",
                  }}
                />
                <h5 className="modal-title">High-Cost Request Details</h5>
                <button
                  type="button"
                  className="btn"
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "1.5rem",
                    color: "#000",
                    marginLeft: "auto",
                  }}
                  onClick={handleCloseDetail}
                  aria-label="Close"
                >
                  <IoMdClose />
                </button>
              </div>
              <div className="modal-body">
                {/* Print-only Amharic content */}
                <div className="d-none d-print-block" style={{ textAlign: "center" }}>
                  <div style={{ width: "100%", textAlign: "center", marginBottom: "0px", marginTop: "0px" }}>
                    <img
                      src={Logo}
                      alt="Logo"
                      style={{ width: "150px", height: "100px", display: "block", margin: "0 auto 0px auto" }}
                    />
                  </div>
                  <div style={{ textAlign: "left", marginLeft: "50px", marginRight: "auto", minWidth: "350px", maxWidth: "500px", marginTop: "0px" }}>
                    <div>
                      <p>
                        <strong>ቀን:</strong> {selectedRequest.created_at ? new Date(selectedRequest.created_at).toLocaleDateString() : "N/A"}
                      </p>
                      <p>
                        <strong>መድረሻ:</strong> {selectedRequest.destination || "N/A"}
                      </p>
                      <p>
                        <strong>መኪና:</strong> {selectedRequest.vehicle || "N/A"}
                      </p>
                      <p>
                        <strong>ተገመተ የሚሄደበት ክልል (ኪ.ሜ):</strong> {selectedRequest.estimated_distance_km ?? "N/A"}
                      </p>
                      <p>
                        <strong>ተገመተ መኪና:</strong> {selectedRequest.estimated_vehicle || "N/A"}
                      </p>
                      <p>
                        <strong>የሚያስፈልገው ነዳጅ (ሊትር):</strong> {selectedRequest.fuel_needed_liters ?? "N/A"}
                      </p>
                      <p>
                        <strong>የነዳጅ ዋጋ በሊትር:</strong> {selectedRequest.fuel_price_per_liter ?? "N/A"}
                      </p>
                      <p>
                        <strong>ጠቅላላ ወጪ:</strong> {selectedRequest.total_cost ?? "N/A"} ብር
                      </p>
                      <p>
                        <strong>የሾፌር ስም:</strong> {selectedRequest.requester || "N/A"}
                      </p>
                      <p>
                        <strong>ሰራተኞች:</strong> {selectedRequest.employees ? selectedRequest.employees.join(", ") : "N/A"}
                      </p>
                      <p>
                        <strong>የመነሻ ቀን:</strong> {selectedRequest.start_day || "N/A"}
                      </p>
                      <p>
                        <strong>የመነሻ ሰአት:</strong> {selectedRequest.start_time || "N/A"}
                      </p>
                      <p>
                        <strong>የመመለሻ ቀን:</strong> {selectedRequest.return_day || "N/A"}
                      </p>
                    </div>
                    {/* Signature section for print only */}
                    <div className="mt-5" style={{ width: "100%" }}>
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          style={{
                            marginBottom: "30px",
                            display: "flex",
                            justifyContent: "flex-start",
                            alignItems: "center",
                            gap: "40px",
                            width: "100%",
                          }}
                        >
                          <div
                            style={{
                              fontWeight: "bold",
                              width: "220px",
                              textAlign: "left",
                            }}
                          >
                            {i === 1 && "የጠያቂው ክፍል ሰራተኛ"}
                            {i === 2 && "የደገፈው ሃላፊ "}
                            {i === 3 && "ያፀደቀው ኃላፊ "}
                          </div>
                          <div>
                            <span>ስም:</span>
                            <div
                              style={{
                                borderBottom: "1px solid #000",
                                width: "120px",
                                height: "24px",
                                margin: "0 0 0 10px",
                                display: "inline-block",
                                verticalAlign: "middle",
                              }}
                            ></div>
                          </div>
                          <div>
                            <span>ፊርማ:</span>
                            <div
                              style={{
                                borderBottom: "1px solid #000",
                                width: "120px",
                                height: "24px",
                                margin: "0 0 0 10px",
                                display: "inline-block",
                                verticalAlign: "middle",
                              }}
                            ></div>
                          </div>
                          <div>
                            <span>ቀን:</span>
                            <div
                              style={{
                                borderBottom: "1px solid #000",
                                width: "80px",
                                height: "24px",
                                margin: "0 0 0 10px",
                                display: "inline-block",
                                verticalAlign: "middle",
                              }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                {/* Normal view detail content (English, not print) */}
                <div className="d-print-none">
                  <p>
                    <strong>Created At:</strong>{" "}
                    {new Date(selectedRequest.created_at).toLocaleString()}
                  </p>
                  <p>
                    <strong>Updated At:</strong>{" "}
                    {new Date(selectedRequest.updated_at).toLocaleString()}
                  </p>
                  <p>
                    <strong>Requester:</strong> {selectedRequest.requester}
                  </p>
                  <p>
                    <strong>Destination:</strong> {selectedRequest.destination}
                  </p>
                  <p>
                    <strong>Employees:</strong>{" "}
                    {selectedRequest.employees ? selectedRequest.employees.join(", ") : ""}
                  </p>
                  <p>
                    <strong>Estimated Distance (km):</strong>{" "}
                    {selectedRequest.estimated_distance_km}
                  </p>
                  <p>
                    <strong>Estimated Vehicle:</strong>{" "}
                    {selectedRequest.estimated_vehicle}
                  </p>
                  <p>
                    <strong>Fuel Needed (liters):</strong>{" "}
                    {selectedRequest.fuel_needed_liters}
                  </p>
                  <p>
                    <strong>Fuel Price Per Liter:</strong>{" "}
                    {selectedRequest.fuel_price_per_liter}
                  </p>
                  <p>
                    <strong>Total Cost:</strong> {selectedRequest.total_cost}
                  </p>
                  <p>
                    <strong>Start Day:</strong> {selectedRequest.start_day}
                  </p>
                  <p>
                    <strong>Start Time:</strong> {selectedRequest.start_time}
                  </p>
                  <p>
                    <strong>Return Day:</strong> {selectedRequest.return_day}
                  </p>
                  <p>
                    <strong>Vehicle:</strong> {selectedRequest.vehicle}
                  </p>
                  {selectedRequest.employee_list_file && (
  <div className="mb-3 d-flex flex-column align-items-center gap-2">
    <strong>Employee List File:</strong>
    <a
      href={selectedRequest.employee_list_file}
      target="_blank"
      rel="noopener noreferrer"
      className="btn btn-sm"
      style={{
        backgroundColor: "#181E4B",
        color: "white",
        minWidth: "160px",
        fontWeight: "bold",
        letterSpacing: "0.5px",
        border: "none",
      }}
      download
    >
      Download Excel
    </a>
    <button
      className="btn btn-sm"
      type="button"
      style={{
        backgroundColor: "hsl(32.1, 94.6%, 43.7%)",
        color: "white",
        minWidth: "160px",
        fontWeight: "bold",
        letterSpacing: "0.5px",
        border: "none",
      }}
      onClick={() => {
        const previewUrl = `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(
          selectedRequest.employee_list_file
        )}`;
        window.open(
          previewUrl,
          "_blank",
          "toolbar=0,location=0,menubar=0,width=" +
            window.screen.width +
            ",height=" +
            window.screen.height +
            ",top=0,left=0"
        );
      }}
    >
      Preview
    </button>
  </div>
)}
                  <div className="d-flex justify-content-end gap-2 mt-3 d-print-none">
                    <button
                      className="btn btn-primary"
                      onClick={handlePrintDetail}
                    >
                      Print
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {showRejectionModal && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(184, 113, 113, 0.5)" }}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Reject Request</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowRejectionModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label htmlFor="rejectionReason" className="form-label">
                    Rejection Reason
                  </label>
                  <textarea
                    id="rejectionReason"
                    className="form-control"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Provide a reason for rejection"
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleConfirmReject}
                >
                  Submit Rejection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showConfirmation && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirm Rejection</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowConfirmation(false)}
                >
                  <IoMdClose size={30} />
                </button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to reject this request?</p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowConfirmation(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleConfirmAction}
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showApproveConfirmation && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirm Approval</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowApproveConfirmation(false)}
                ></button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to Approve This request?</p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowApproveConfirmation(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleConfirmApprove}
                >
                  Confirm Approval
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
        @media print {
          body * {
            visibility: hidden !important;
          }
          .modal-content, .modal-content * {
            visibility: visible !important;
          }
          .modal-content {
            position: fixed !important;
            left: 50% !important;
            top: 50% !important;
            transform: translate(-50%, -50%) !important;
            width: 700px !important;
            max-width: 95vw !important;
            background: white !important;
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            padding: 0 !important;
            page-break-after: avoid !important;
            page-break-before: avoid !important;
            page-break-inside: avoid !important;
          }
          .btn, .pagination, .modal-footer, .Toastify__toast-container, .btn-close, .d-print-none, .modal-header.d-print-none {
            display: none !important;
          }
          .d-print-block {
            display: block !important;
            text-align: center !important;
            width: 100% !important;
            margin-left: auto !important;
            margin-right: auto !important;
          }
          .d-print-block * {
            text-align: left !important;
            margin-left: auto !important;
            margin-right: auto !important;
            font-family: "Noto Sans Ethiopic", "Arial", sans-serif !important;
          }
          .container-fluid, .row, .col-md-6 {
            width: 100% !important;
            display: block !important;
            text-align: left !important;
            margin-left: auto !important;
            margin-right: auto !important;
          }
          p, div, img, h2, h5 {
            text-align: left !important;
            margin-left: auto !important;
            margin-right: auto !important;
            font-family: "Noto Sans Ethiopic", "Arial", sans-serif !important;
          }
          a {
            display: none !important;
          }
          html, body {
            height: auto !important;
            overflow: visible !important;
          }
          @page {
            size: auto;
            margin: 10mm 10mm 10mm 10mm;
          }
        }
      `}</style>
    </div>
  );
};

export default FIHighCost;