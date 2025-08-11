import { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Logo from "../assets/Logo.jpg";
import { IoMdClose } from "react-icons/io";
import { ENDPOINTS } from "../utilities/endpoints";
import UnauthorizedPage from "./UnauthorizedPage";
import ServerErrorPage from "./ServerErrorPage";

const FinanceManagerPage = () => {
  const [requests, setRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showApproveConfirmation, setShowApproveConfirmation] = useState(false);
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
      const response = await fetch(ENDPOINTS.REQUEST_LIST, {
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
        throw new Error("Failed to fetch transport requests");
      }

      const data = await response.json();
      const financeManagerRequests = data.results.filter(
        (request) =>
          request.status === "forwarded" &&
          request.current_approver_role === "CEO"
      );

      setRequests(financeManagerRequests || []);
    } catch (error) {
      console.error("Fetch Error:", error);
      toast.error("Failed to fetch requests");
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
      setUsers(data.results || []);
    } catch (error) {
      console.error("Fetch Users Error:", error);
    }
  };

  const getEmployeeNames = (employeeIds) => {
    if (!employeeIds || !Array.isArray(employeeIds)) return "Unknown";

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
    setRejectionReason("");
    setShowRejectionModal(false);
    setShowConfirmation(false);
    setShowApproveConfirmation(false);
  };

  const handleApprove = async (requestId) => {
    if (!accessToken) {
      console.error("No access token found.");
      return;
    }

    try {
      const response = await fetch(
        `${ENDPOINTS.TM_APPROVE_REJECT}${requestId}/action/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "forward", // Forward to transport manager
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to forward transport request");

      // Refresh the list after successful action
      await fetchRequests();

      setSelectedRequest(null);
      toast.success("Request forwarded to transport manager successfully!");
    } catch (error) {
      console.error("Approve Error:", error);
      toast.error("Failed to forward request.");
    }
  };

  const handleReject = async (requestId) => {
    if (!accessToken) {
      console.error("No access token found.");
      return;
    }

    if (!rejectionReason) {
      toast.error("Please provide a reason for rejection.");
      return;
    }

    try {
      const response = await fetch(
        `${ENDPOINTS.TM_APPROVE_REJECT}${requestId}/action/`,
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

      // Refresh the list after successful action
      await fetchRequests();

      setSelectedRequest(null);
      setRejectionReason("");
      setShowRejectionModal(false);
      toast.success("Request rejected successfully!");
    } catch (error) {
      console.error("Reject Error:", error);
      toast.error("Failed to reject request.");
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
    handleApprove(selectedRequest.id);
    setShowApproveConfirmation(false);
  };

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
        <div className="table-responsive">
          <table className="table table-bordered mt-4">
            <thead className="table">
              <tr>
                <th>Start Day</th>
                <th>Start Time</th>
                <th>Return Day</th>
                <th>Destination</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {requests.length > 0 ? (
                requests.map((request) => (
                  <tr key={request.id}>
                    <td>{request.start_day}</td>
                    <td>{request.start_time}</td>
                    <td>{request.return_day}</td>
                    <td>{request.destination}</td>
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
                  <td colSpan="6" className="text-center">
                    No CEO-approved requests available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals remain the same */}
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
                  <IoMdClose size={24} />
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
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCloseDetail}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="btn"
                  style={{ backgroundColor: "#28a745", color: "white" }}
                  onClick={handleApproveClick}
                >
                  Approve
                </button>
                <button
                  type="button"
                  className="btn"
                  style={{ backgroundColor: "#dc3545", color: "white" }}
                  onClick={handleRejectClick}
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Other modals remain unchanged */}
      {showRejectionModal && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
        >
          {/* ... existing rejection modal code ... */}
        </div>
      )}

      {showConfirmation && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
        >
          {/* ... existing confirmation modal code ... */}
        </div>
      )}

      {showApproveConfirmation && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
        >
          {/* ... existing approve confirmation modal code ... */}
        </div>
      )}
    </div>
  );
};

export default FinanceManagerPage;
