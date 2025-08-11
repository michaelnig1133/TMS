import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { ENDPOINTS } from "../utilities/endpoints";
import UnauthorizedPage from "./UnauthorizedPage";
import ServerErrorPage from "./ServerErrorPage";

const RejectUserModal = ({ userId, closeModal, reloadData }) => {
  const [rejectionMessage, setRejectionMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false); // Add state for confirmation modal
  const [errorType, setErrorType] = useState(null); // "unauthorized" | "server" | null

  const handleReject = async () => {
    if (!rejectionMessage.trim()) {
      toast.error("Please provide a rejection message.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        setErrorType("unauthorized");
        setLoading(false);
        return;
      }
      const response = await axios.post(
        ENDPOINTS.APPROVE_USER,
        {
          action: "reject",
          rejection_message: rejectionMessage,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 200) {
        toast.success("User rejected successfully!");
        reloadData(); // Reload the user data list after rejection
        closeModal(); // Close the rejection modal
      }
    } catch (err) {
      if (err.response && err.response.status === 401) {
        setErrorType("unauthorized");
      } else {
        setErrorType("server");
      }
      setError("An error occurred while rejecting the user. Please try again.");
      toast.error("An error occurred while rejecting the user.");
    } finally {
      setLoading(false);
    }
  };

  const confirmRejection = () => {
    setShowConfirmation(true); // Show the confirmation modal when trying to reject
  };

  const cancelRejection = () => {
    setShowConfirmation(false); // Close the confirmation modal without rejecting
  };

  if (errorType === "unauthorized") {
    return <UnauthorizedPage />;
  }
  if (errorType === "server") {
    return <ServerErrorPage />;
  }

  return (
    <div>
      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="confirmation-modal">
          <div className="confirmation-modal-content">
            <h3>Are you sure you want to reject this user?</h3>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={cancelRejection}>
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={handleReject}
                disabled={loading}
              >
                {loading ? "Rejecting..." : "Yes, Reject"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {!showConfirmation && (
        <div className="modal">
          <div className="modal-content">
            <h2>Reject User</h2>
            <textarea
              value={rejectionMessage}
              onChange={(e) => setRejectionMessage(e.target.value)}
              placeholder="Enter rejection message..."
              rows="4"
              className="form-control"
            />
            {error && <p className="error-message">{error}</p>}
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={closeModal}>
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={confirmRejection}
                disabled={loading}
              >
                {loading ? "Rejecting..." : "Reject User"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RejectUserModal;
