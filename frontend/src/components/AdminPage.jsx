import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";
import Lottie from "lottie-react";
import animationData from "./Lottie Lego (1).json";
import { IoCloseSharp } from "react-icons/io5";
import { ENDPOINTS } from "../utilities/endpoints";
import CustomPagination from "./CustomPagination";
import UnauthorizedPage from "./UnauthorizedPage";
import ServerErrorPage from "./ServerErrorPage";
import { useLanguage } from "../context/LanguageContext";
const AdminPage = () => {
  const { myLanguage } = useLanguage();
  const [data, setData] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // Number of items per page
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [userToApprove, setUserToApprove] = useState(null);
  const [editAccount, setEditAccount] = useState(null);
  const [formValues, setFormValues] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
    department: "",
  });
  const [errorType, setErrorType] = useState(null); 
  const navigate = useNavigate();

  const ROLE_CHOICES = [
    { value: 1, label: myLanguage === "EN" ? "Employee" : "ሰራተኛ" },
    { value: 2, label: myLanguage === "EN" ? "Department Manager" : "የክፍል አስተዳዳሪ" },
    { value: 3, label: myLanguage === "EN" ? "Finance Manager" : "የፋይናንስ አስተዳዳሪ" },
    { value: 4, label: myLanguage === "EN" ? "Transport Manager" : "የትራንስፖርት አስተዳዳሪ" },
    { value: 5, label: myLanguage === "EN" ? "CEO" : "ዋና አስተዳዳሪ" },
    { value: 6, label: myLanguage === "EN" ? "Driver" : "ሹፌር" },
    { value: 7, label: myLanguage ==="EN"? "System Admin":"የስርዓት አስተዳዳሪ" },
    { value: 8, label: myLanguage ==="EN"? "General System Excuter":"የመሰረታዊ አገልግሎት ስራ አስኪያጅ" }, 
    { value: 9, label: myLanguage ==="EN"?"Budget Manager":"የበጀት አስተዳዳሪ" }, 
  ];

  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        setErrorType("unauthorized");
        throw new Error("Token is missing. Please log in again.");
      }

      const response = await fetch(ENDPOINTS.DEPARTMENT_LIST, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const result = await response.json();
        setDepartments(result);
      } else {
        if (response.status === 401) {
          setErrorType("unauthorized");
        } else {
          setErrorType("server");
        }
        const errorData = await response.json();
        throw new Error(errorData.detail || myLanguage==="EN"?"Failed to fetch departments.":"" + "ክፍሎች ማግኘት አልተቻለም።");
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        setErrorType("unauthorized");
        throw new Error("Token is missing. Please log in again.");
      }

      const response = await fetch(ENDPOINTS.USERS, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const result = await response.json();
        console.log("data",data); // Debugging log
        setData(result);
      } else {
        if (response.status === 401) {
          setErrorType("unauthorized");
        } else {
          setErrorType("server");
        }
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to fetch users.");
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    setShowApproveModal(false); // Close the modal immediately
    setIsProcessing(true); // Start showing the animation

    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        toast.error(myLanguage==="EN"?"You need to be logged in to approve users.":"ተጠቃሚዎችን ለማጽደቅ በመለያ መግባት አለብዎት።");
        return;
      }

      const response = await fetch(ENDPOINTS.APPROVE_USER(userToApprove.id), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "approve" }),
      });

      if (response.ok) {
        toast.success(myLanguage==="EN"?"User approved successfully!":"ተጠቃሚ በተሳካ ሁኔታ ጸድቋል!");
        fetchUsers(); // Refresh user list
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || myLanguage==="EN"?"Failed to approve user.":"ተጠቃሚን ማጽደቅ አልተቻለም።");
      }
    } catch (error) {
      toast.error(myLanguage==="EN"?"An error occurred while approving the user.":"ተጠቃሚን ማጽደቅ አልተቻለም።");
    } finally {
      setIsProcessing(false); // Stop animation after process completes
    }
  };

  const getRoleLabel = (roleId) => {
    const role = ROLE_CHOICES.find((role) => role.value === roleId);
    return role ? role.label : myLanguage==="EN"?"Unknown Role":"የማይታወቅ ሚና";
  };

  const handleReject = (userId) => {
    setSelectedUserId(userId);
    setShowRejectModal(true);
  };

  const confirmRejection = () => {
    if (!rejectionReason) {
      toast.error(myLanguage==="EN"?"Please provide a rejection message.":"እባክዎን መልእክት ያቅርቡ");
      return;
    }
    sendRejectionEmail(rejectionReason);
  };

  const sendRejectionEmail = async (rejectionReason) => {
    setIsProcessing(true); // Start animation
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        toast.error(myLanguage==="EN"?"You need to be logged in to reject users.":"ተጠቃሚዎችን ለመሰረዝ በመለያ መግባት አለብዎት።");
        return;
      }

      const response = await fetch(ENDPOINTS.APPROVE_USER(selectedUserId), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "reject",
          rejection_message: rejectionReason,
        }),
      });

      if (response.ok) {
        toast.success(myLanguage==="EN"?"User rejected successfully!":"ተጠቃሚ በተሳካ ሁኔታ ተሰርዟል!");
        fetchUsers();
        setShowRejectModal(false);
        setRejectionReason("");
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || myLanguage==="EN"?"Failed to reject user.":"ተጠቃሚን ማሰረዝ አልተቻለም።");
      }
    } catch (error) {
      toast.error(myLanguage==="EN"?"An error occurred while rejecting the user.":"ተጠቃሚን ማሰረዝ አልተቻለም።");
    } finally {
      setIsProcessing(false); // Stop animation
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      navigate("/login");
    } else {
      fetchDepartments();
      fetchUsers();
    }
  }, [currentPage, navigate]);

  const handleEdit = (account) => {
    setEditAccount(account);
    setFormValues({
      name: account.full_name,
      email: account.email,
      phone: account.phone,
      role: account.role,
      department: account.department,
    });
  };

  const handleSaveEdit = async () => {
    const token = localStorage.getItem("authToken");

    try {
      await axios.patch(
        ENDPOINTS.UPDATE_ROLE(editAccount.id),
        { role: formValues.role },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(myLanguage==="EN"?"Role updated successfully!":"ሚና በተሳካ ሁኔታ ተሻሽሏል!");
      fetchUsers();
      setEditAccount(null);
    } catch (error) {
      setError(myLanguage==="EN"?"Failed to update role.":"ሚና ማሻሻያ አልተቻለም።");
      toast.error(myLanguage==="EN"?"Failed to update role.":"ሚና ማሻሻያ አልተቻለም።");
    }
  };

  const handleCancelEdit = () => {
    setEditAccount(null);
  };

  const handleRoleChange = (e) => {
    setFormValues({ ...formValues, role: e.target.value });
  };

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageData = data.slice(startIndex, endIndex);

  if (errorType === "unauthorized") {
    return <UnauthorizedPage />;
  }
  if (errorType === "server") {
    return <ServerErrorPage />;
  }

  return (
    <div className="admin-container d-flex flex-column mt-5">
      <div className="container-fluid">
        <div className="row mt-4">
          <div className="col-12 col-md-9 col-lg-10 admin-content p-4">
            {error && <p className="text-danger">{error}</p>}
            {isLoading && <p>Loading users...</p>}
            {isProcessing && (
              <div className="loading-overlay">
                <Lottie
                  animationData={animationData}
                  loop
                  autoPlay
                  style={{ width: 300, height: 300 }}
                />
              </div>
            )}

            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead>
                  <tr>
                    <th>#</th>
                  <th>{myLanguage === "EN" ? "Name" : "ስም"}</th>
<th>{myLanguage === "EN" ? "Email" : "ኢሜይል"}</th>
<th>{myLanguage === "EN" ? "Role" : "ሚና"}</th>
<th>{myLanguage === "EN" ? "Department" : "ክፍል"}</th>
<th>{myLanguage === "EN" ? "Status" : "ሁኔታ"}</th>
<th>{myLanguage === "EN" ? "Actions" : "እርምጃዎች"}</th>

                  </tr>
                </thead>
                <tbody>
                  {currentPageData.length > 0 ? (
                    currentPageData.map((user, index) => (
                      <tr key={user.id}>
                        <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>{" "}
                        {/* Correct numbering */}
                        <td>{user.full_name || "N/A"}</td>
                        <td>{user.email}</td>
                        <td>
                          {editAccount && editAccount.id === user.id ? (
                            <select
                              value={formValues.role}
                              onChange={handleRoleChange}
                            >
                              {ROLE_CHOICES.map((role) => (
                                <option key={role.value} value={role.value}>
                                  {role.label}
                                </option>
                              ))}
                            </select>
                          ) : (
                            getRoleLabel(user.role)
                          )}
                        </td>
                        <td>
                          {(departments &&
                            departments.find(
                              (dept) => dept.id === user.department
                            )?.name) ||
                            "N/A"}
                        </td>
                        <td>{user.is_active ? myLanguage==="EN"?"Active":" ንቁ" : myLanguage==="EN"?"Pending":"በመጠባበቅ ላይ"}</td>
                        <td>
                          <div
                            style={{
                              display: "flex",
                              gap: "10px",
                              alignItems: "center",
                            }}
                          >
                            <button
                              className="btn btn-sm"
                              style={{
                                backgroundColor: "#0b455b",
                                color: "white",
                              }}
                              onClick={() => handleEdit(user)}
                            >
                              {myLanguage === "EN" ? "Edit" : "ለውጥ አድርግ"}
                            </button>
                            {editAccount && editAccount.id === user.id && (
                              <div>
                                <button
                                  className="btn btn-sm btn-primary"
                                  onClick={handleSaveEdit}
                                >
                                  {myLanguage === "EN" ? "Save" : "አስቀምጥ"}
                                </button>
                                <button
                                  className="btn btn-sm btn-secondary"
                                  onClick={handleCancelEdit}
                                >
                                  {myLanguage === "EN" ? "Cancel" : "ሰርዝ"}
                                </button>
                              </div>
                            )}
                            {!user.is_active && (
                              <>
                                <button
                                  className="btn btn-sm btn-success"
                                  onClick={() => {
                                    setUserToApprove(user);
                                    setShowApproveModal(true);
                                  }}
                                >
                                  {myLanguage === "EN" ? "Approve" : "አጽድቀው"}
                                </button>
                                <button
                                  className="btn btn-sm btn-danger"
                                  onClick={() => handleReject(user.id)}
                                >
                                  {myLanguage === "EN" ? "Reject" : "ውድቅ አድርግ"}
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6">{myLanguage === "EN" ? "No users found." : "ምንም ተጠቃሚዎች አልተገኙም።"}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div
              className="d-flex justify-content-center align-items-center"
              style={{ height: "100px" }}
            >
              <CustomPagination
                currentPage={currentPage}
                totalPages={Math.ceil(data.length / itemsPerPage)}
                handlePageChange={(page) => setCurrentPage(page)}
              />
            </div>
          </div>
        </div>
      </div>
      {showApproveModal && (
        <div className="modal show" style={{ display: "block" }} tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{myLanguage === "EN" ? "Approve User" : "ተጠቃሚውን አጽድቅ"}</h5>
                <button
                  onClick={() => setShowApproveModal(false)} // Or setShowRejectModal(false)
                  style={{
                    position: "absolute",
                    top: "10px",
                    right: "10px",
                    background: "none",
                    border: "none",
                    fontSize: "20px",
                    cursor: "pointer",
                  }}
                >
                  <IoCloseSharp />
                </button>
              </div>
              <div className="modal-body">
                <p>
                  {myLanguage==="EN"?"Are you sure you want to approve":"እርግጠኛ ነዎት ማጽደቅ ይፈልጋሉ"} {userToApprove?.full_name}?
                </p>
              </div>
              <div
                className="modal-footer"
                style={{ display: "flex", gap: "10px" }}
              >
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={handleApprove}
                >
                  {myLanguage==="EN"?"Approve":"አጽድቅ"}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowApproveModal(false)}
                >
                  {myLanguage==="EN"?"Cancel":"ሰርዝ"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="modal show" style={{ display: "block" }} tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{myLanguage==="EN"?"Reject User":"ተቀባይነት አላገኘም"}</h5>
                <button
                  type="button"
                  className="close"
                  onClick={() => setShowRejectModal(false)}
                  style={{
                    position: "absolute",
                    top: "10px",
                    right: "10px",
                    background: "none",
                    border: "none",
                    fontSize: "20px",
                    cursor: "pointer",
                  }}
                >
                  <IoCloseSharp />
                </button>
              </div>
              <div className="modal-body">
                <label htmlFor="rejectionReason">{myLanguage==="EN"?"Rejection Reason:":"ውድቅ የተደረገ ምክንያት"}</label>
                <textarea
                  id="rejectionReason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows="4"
                  className="form-control"
                />
              </div>
              <div
                className="modal-footer"
                style={{ display: "flex", gap: "10px" }}
              >
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={confirmRejection}
                >
                 {myLanguage==="EN"?"Reject":"ውድቅ አድርግ"}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowRejectModal(false)}
                >
                  {myLanguage==="EN"?"Cancel":"ሰርዝ"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
