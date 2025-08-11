import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { toast, ToastContainer } from "react-toastify"; // For toast messages
import "react-toastify/dist/ReactToastify.css";
import Logo from "../assets/Logo.jpg"; // Import the logo image
import { IoMdClose } from "react-icons/io";
import { ENDPOINTS } from "../utilities/endpoints";
import CustomPagination from "./CustomPagination";
import UnauthorizedPage from "./UnauthorizedPage";
import ServerErrorPage from "./ServerErrorPage";

const HighCostDriverSchedule = () => {
  const [requests, setRequests] = useState([]);
  const [users, setUsers] = useState([]); // State for employees
  const [loading, setLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null); // Selected request for modal
  const [rejectionReason, setRejectionReason] = useState(""); // State for rejection reason
  const [showRejectionModal, setShowRejectionModal] = useState(false); // State for rejection modal
  const [showConfirmation, setShowConfirmation] = useState(false); // State for rejection confirmation dialog
  const [showApproveConfirmation, setShowApproveConfirmation] = useState(false); // State for approve confirmation dialog
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // Number of items per page
  const [errorType, setErrorType] = useState(null); // "unauthorized" | "server" | null

  const accessToken = localStorage.getItem("authToken");
  useEffect(() => {
    fetchRequests();
    fetchUsers();
  }, []);

  const fetchRequests = async () => {
    if (!accessToken) {
      setErrorType("unauthorized");
      return;
    }

    setLoading(true);
    try {
      // Fetch high-cost requests
      const highCostRequests = await fetchHighCostRequests();

      // Add a "requestType" property to high-cost requests
      const highCostRequestsWithLabel = highCostRequests.map((request) => ({
        ...request,
        requestType: "High Cost", // Label as high-cost
      }));

      setRequests(highCostRequestsWithLabel); // Set high-cost requests to state
    } catch (error) {
      if (error.message && error.message.toLowerCase().includes("401")) {
        setErrorType("unauthorized");
      } else {
        setErrorType("server");
      }
      console.error("Fetch Requests Error:", error);
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
        if (response.status === 401) {
          setErrorType("unauthorized");
        } else {
          setErrorType("server");
        }
        throw new Error("Failed to fetch users");
      }

      const data = await response.json();
      setUsers(data.results || []); // Set users data
    } catch (error) {
      console.error("Fetch Users Error:", error);
    }
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
        if (response.status === 401) {
          setErrorType("unauthorized");
        } else {
          setErrorType("server");
        }
        throw new Error("Failed to fetch high-cost transport requests");
      }

      const data = await response.json();
      return data.results || []; // Return fetched high-cost requests
    } catch (error) {
      console.error("Fetch High-Cost Requests Error:", error);
      return [];
    }
  };

  // Get employee names from IDs
  const getEmployeeNames = (employeeIds) => {
    return employeeIds
      .map((id) => {
        const employee = users.find((user) => user.id === id);
        return employee ? employee.full_name : "Unknown";
      })
      .join(", ");
  };

  const handleViewDetail = (request) => {
    setSelectedRequest(request);
  };

  const handleCloseDetail = () => {
    setSelectedRequest(null);
    setRejectionReason(""); // Clear rejection reason
    setShowRejectionModal(false); // Close rejection modal
    setShowConfirmation(false); // Close rejection confirmation dialog
    setShowApproveConfirmation(false); // Close approve confirmation dialog
  };

  const handleApprove = async (requestId) => {
    if (!accessToken) {
      console.error("No access token found.");
      return;
    }

    try {
      const response = await fetch(
        `${ENDPOINTS.APPREJ_HIGHCOST_REQUEST(requestId)}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "forward",
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to forward transport request");

      // Update the status locally after forwarding
      setRequests((prevRequests) =>
        prevRequests.map((req) =>
          req.id === requestId ? { ...req, status: "forwarded" } : req
        )
      );

      setSelectedRequest(null); // Close modal
      toast.success("Request forwarded to transport manager successfully!"); // Show success toast
    } catch (error) {
      console.error("Approve Error:", error);
      toast.error("Failed to forward request."); // Show error toast
    }
  };

  const handleReject = async (requestId) => {
    if (!accessToken) {
      console.error("No access token found.");
      return;
    }

    if (!rejectionReason) {
      toast.error("Please provide a reason for rejection."); // Show error toast
      return;
    }

    try {
      const response = await fetch(
        `${ENDPOINTS.APPREJ_HIGHCOST_REQUEST(requestId)}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "reject",
            rejection_message: rejectionReason, // Use the provided reason
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to reject transport request");

      setRequests((prevRequests) =>
        prevRequests.map((req) =>
          req.id === requestId ? { ...req, status: "rejected" } : req
        )
      );

      setSelectedRequest(null); // Close modal
      setRejectionReason(""); // Clear rejection reason
      setShowRejectionModal(false); // Close rejection modal
      toast.success("Request rejected successfully!"); // Show success toast
    } catch (error) {
      console.error("Reject Error:", error);
      toast.error("Failed to reject request."); // Show error toast
    }
  };

  const handleRejectClick = () => {
    setShowRejectionModal(true);
  };

  const handleConfirmReject = () => {
    setShowConfirmation(true);
  };

  const handleConfirmAction = () => {
    handleReject(selectedRequest.id);
    setShowConfirmation(false);
  };

  const handleApproveClick = () => {
    setShowApproveConfirmation(true);
  };

  const handleConfirmApprove = () => {
    handleApprove(selectedRequest.id); // Call handleApprove
    setShowApproveConfirmation(false); // Close approve confirmation dialog
  };

  const handleNotify = async (requestId) => {
    if (!accessToken) {
      console.error("No access token found.");
      return;
    }

    try {
      const response = await fetch(ENDPOINTS.COMPLETE_TRIP(requestId), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) throw new Error("Failed to send notification");

      toast.success("Notification sent successfully!");

      // Remove the notified request from the table
      setRequests((prevRequests) =>
        prevRequests.filter((req) => req.id !== requestId)
      );

      handleCloseDetail(); // Close the modal
    } catch (error) {
      console.error("Notify Error:", error);
      toast.error("Failed to send notification.");
    }
  };

  // Only requests that have NOT been notified will show in the table
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageRequests = requests.slice(startIndex, endIndex);

  if (errorType === "unauthorized") {
    return <UnauthorizedPage />;
  }
  if (errorType === "server") {
    return <ServerErrorPage />;
  }

  return (
    <div
      className="container mt-4"
      style={{ minHeight: "100vh", backgroundColor: "#f8f9fc" }}
    >
      <ToastContainer />
      {loading ? (
        <div className="text-center mt-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p>Loading data...</p>
        </div>
      ) : (
        <div
          className="table-responsive"
          style={{ width: "100%", overflowX: "auto" }}
        >
          <table className="table table-hover align-middle">
            <thead className="table">
              <tr>
                <th>#</th> {/* Add numbering column */}
                <th>Start Day</th>
                <th>Start Time</th>
                <th>Return Day</th>
                <th>Destination</th>
                <th>Request Type</th> {/* Add Request Type column */}
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {currentPageRequests.length > 0 ? (
                currentPageRequests.map((request, index) => (
                  <tr key={request.id}>
                    <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>{" "}
                    {/* Correct numbering */}
                    <td>{request.start_day}</td>
                    <td>{request.start_time}</td>
                    <td>{request.return_day}</td>
                    <td>{request.destination}</td>
                    <td>{request.requestType || ""}</td>
                    <td>{request.status}</td>
                    <td>
                      <button
                        className="btn btn-sm"
                        style={{ backgroundColor: "#181E4B", color: "white" }}
                        onClick={() => handleViewDetail(request)}
                      >
                        View Detail
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="text-center">
                    No transport requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "100px" }}
      >
        <CustomPagination
          currentPage={currentPage}
          totalPages={Math.ceil(requests.length / itemsPerPage)}
          handlePageChange={(page) => setCurrentPage(page)}
        />
      </div>

      {selectedRequest && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <img
                  src={Logo}
                  alt="Logo"
                  style={{
                    width: "100px",
                    height: "70px",
                    marginRight: "10px",
                  }}
                />
                <h5 className="modal-title">Transport Request Details</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleCloseDetail}
                >
                  <IoMdClose />
                </button>
              </div>
              <div className="modal-body">
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
                  <strong>Employees:</strong>{" "}
                  {getEmployeeNames(selectedRequest.employees)}
                </p>
                <p>
                  <strong>Destination:</strong> {selectedRequest.destination}
                </p>
                <p>
                  <strong>Reason:</strong> {selectedRequest.reason}
                </p>
              </div>
              <div
                className="modal-footer text-center"
                style={{ justifyContent: "center" }}
              >
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleNotify(selectedRequest.id)}
                >
                  Notify
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showRejectionModal && (
        <div className="modal fade show d-block" tabIndex="-1">
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
                <p>
                  Are you sure you want to forward this request to the General
                  Service?
                </p>
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
    </div>
  );
};
export default HighCostDriverSchedule;