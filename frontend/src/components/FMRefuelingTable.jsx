import { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { ENDPOINTS } from "../utilities/endpoints";
import { IoCloseSharp } from "react-icons/io5";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Logo from "../assets/Logo.jpg";
import UnauthorizedPage from "./UnauthorizedPage";
import ServerErrorPage from "./ServerErrorPage";
import { FaSync, FaSearch, FaCarCrash } from "react-icons/fa";
import CustomPagination from "./CustomPagination";

const RefuelingTable = () => {
  const [refuelingRequests, setRefuelingRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [errorType, setErrorType] = useState(null); // "unauthorized" | "server" | null
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 5;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageRequests = refuelingRequests.slice(startIndex, endIndex);

  // Fetches the list of requests
  const fetchRefuelingRequests = async () => {
    const accessToken = localStorage.getItem("authToken");

    if (!accessToken) {
      setErrorType("unauthorized");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(ENDPOINTS.REFUELING_REQUEST_LIST, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          setErrorType("unauthorized");
        } else {
          setErrorType("server");
        }
        throw new Error("Failed to fetch refueling requests");
      }

      const data = await response.json();
      setRefuelingRequests(data.results || []);
    } catch (error) {
      toast.error("Failed to fetch refueling requests.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch detail for a single request
  const fetchRequestDetail = async (id) => {
    const accessToken = localStorage.getItem("authToken");
    if (!accessToken) {
      setErrorType("unauthorized");
      return;
    }

    setDetailLoading(true);
    try {
      const response = await fetch(ENDPOINTS.REFUELING_REQUEST_DETAIL(id), {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        if (response.status === 401) {
          setErrorType("unauthorized");
        } else {
          setErrorType("server");
        }
        throw new Error("Failed to fetch refueling request detail");
      }
      const data = await response.json();
      setSelectedRequest(data);
    } catch (error) {
      toast.error("Failed to fetch request details.");
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    fetchRefuelingRequests();
  }, []);

  if (errorType === "unauthorized") {
    return <UnauthorizedPage />;
  }
  if (errorType === "server") {
    return <ServerErrorPage />;
  }

  return (
    <div className="container py-4" style={{ minHeight: "100vh", backgroundColor: "#f8f9fc" }}>
      <ToastContainer />
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="mb-0 d-flex align-items-center">
          <FaCarCrash className="me-2 text-success" />
          Refueling Requests
        </h1>
        <button
          className="btn btn-outline-success d-flex align-items-center"
          style={{ minWidth: "160px" }}
          onClick={fetchRefuelingRequests}
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
                  <th>Date</th>
                  <th>Destination</th>
                  <th>Driver</th>
                  <th>Status</th>
                  <th className="text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="text-center py-5">
                      <div className="d-flex justify-content-center align-items-center">
                        <div className="spinner-border text-success" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                        <span className="ms-3">Loading refueling requests...</span>
                      </div>
                    </td>
                  </tr>
                ) : currentPageRequests.length > 0 ? (
                  currentPageRequests.map((request, index) => (
                    <tr key={request.id}>
                      <td>{startIndex + index + 1}</td>
                      <td>
                        {request.created_at
                          ? new Date(request.created_at).toLocaleDateString()
                          : "N/A"}
                      </td>
                      <td>{request.destination || "N/A"}</td>
                      <td>{request.requester_name || "N/A"}</td>
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
                          onClick={() => fetchRequestDetail(request.id)}
                          disabled={detailLoading}
                        >
                          <FaSearch className="me-1" />
                          View Detail
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center text-muted py-5">
                      <div className="py-4">
                        <FaCarCrash className="fs-1 text-muted mb-3" />
                        <p className="mb-1 fw-medium fs-5">
                          No refueling requests found.
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
          totalPages={Math.ceil(refuelingRequests.length / itemsPerPage)}
          handlePageChange={setCurrentPage}
        />
      </div>
      {/* Modal for Viewing Details */}
      {selectedRequest && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              {/* Modal Header (not printed) */}
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
                <h5 className="modal-title">Refueling Request Details</h5>
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
                  onClick={() => setSelectedRequest(null)}
                  aria-label="Close"
                >
                  <IoCloseSharp />
                </button>
              </div>
              <div className="modal-body">
                {/* Print header for print only */}
                <div className="d-none d-print-block" style={{ textAlign: "center" }}>
                  <div style={{ width: "100%", textAlign: "center", marginBottom: "30px", marginTop: "0px" }}>
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
                        <strong>የሾፌሩ ስም:</strong> {selectedRequest.requester_name || "N/A"}
                      </p>
                      <p>
                        <strong>የመኪናው ስም:</strong> {selectedRequest.requesters_car_name || "N/A"}
                      </p>
                      <p>
                        <strong>መድረሻ:</strong> {selectedRequest.destination || "N/A"}
                      </p>
                      <p>
                        <strong>ተገመተ የሚሄደበት ክልል (ኪ.ሜ):</strong> {selectedRequest.estimated_distance_km ?? "N/A"}
                      </p>
                      <p>
                        <strong>የነዳጅ አይነት:</strong> {selectedRequest.fuel_type || "N/A"}
                      </p>
                      <p>
                        <strong>የነዳጅ ትክክለኛነት:</strong> {selectedRequest.fuel_efficiency ?? "N/A"} ኪ.ሜ/ሊትር
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
                  <div className="container-fluid">
                    <div className="row">
                      <div className="col-md-6">
                        <p>
                          <strong>Request Date:</strong>{" "}
                          {selectedRequest.created_at
                            ? new Date(selectedRequest.created_at).toLocaleString()
                            : "N/A"}
                        </p>
                        <p>
                          <strong>Driver:</strong>{" "}
                          {selectedRequest.requester_name || "N/A"}
                        </p>
                        <p>
                          <strong>Vehicle:</strong>{" "}
                          {selectedRequest.requesters_car_name || "N/A"}
                        </p>
                        <p>
                          <strong>Destination:</strong>{" "}
                          {selectedRequest.destination || "N/A"}
                        </p>
                        <p>
                          <strong>Estimated Distance:</strong>{" "}
                          {selectedRequest.estimated_distance_km ?? "N/A"} km
                        </p>
                      </div>
                      <div className="col-md-6">
                        <p>
                          <strong>Fuel Type:</strong>{" "}
                          {selectedRequest.fuel_type || "N/A"}
                        </p>
                        <p>
                          <strong>Fuel Efficiency:</strong>{" "}
                          {selectedRequest.fuel_efficiency ?? "N/A"} km/L
                        </p>
                        <p>
                          <strong>Fuel Needed:</strong>{" "}
                          {selectedRequest.fuel_needed_liters ?? "N/A"} L
                        </p>
                        <p>
                          <strong>Fuel Price per Liter:</strong>{" "}
                          {selectedRequest.fuel_price_per_liter ?? "N/A"}
                        </p>
                        <p>
                          <strong>Total Cost:</strong>{" "}
                          {selectedRequest.total_cost ?? "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer d-print-none">
                <button
                  className="btn btn-secondary"
                  onClick={() => setSelectedRequest(null)}
                >
                  Close
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => window.print()}
                >
                  Print
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Print styles for detail modal */}
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
        }
      `}</style>
    </div>
  );
};

export default RefuelingTable;