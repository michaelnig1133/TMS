import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import Logo from "../assets/Logo.jpg"; // Import the logo image
import { ENDPOINTS } from "../utilities/endpoints";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaWindowClose } from "react-icons/fa"; // Import the close icon
import Header from "./Header"; // Import the Header component
import CustomPagination from "./CustomPagination";
import UnauthorizedPage from "./UnauthorizedPage";
import ServerErrorPage from "./ServerErrorPage";
import { useLanguage } from "../context/LanguageContext"; // Import useLanguage

const EmployeePage = () => {
  const [showForm, setShowForm] = useState(false);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [users, setUsers] = useState([]); // State for user list
  const [currentUser, setCurrentUser] = useState(null); // State for current user
  const [formData, setFormData] = useState({
    startDay: "",
    startTime: "",
    returnDay: "",
    employees: [], // Store employee IDs (numbers)
    employeeName: "", // Store selected employee ID
    destination: "",
    reason: "",
  });
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [filterStatus, setFilterStatus] = useState(""); // State for filtering by status
  const [sortField, setSortField] = useState(""); // State for sorting field
  const [sortOrder, setSortOrder] = useState("asc"); // State for sorting order
  const [currentPage, setCurrentPage] = useState(1); // State for current page
  const itemsPerPage = 5; // Number of items per page
  const [errorType, setErrorType] = useState(null); // "unauthorized" | "server" | null

  const accessToken = localStorage.getItem("authToken");
  const { mylanguage } = useLanguage();

  // Helper function to translate labels
  const t = (en, am) => (mylanguage === "EN" ? en : am);

  useEffect(() => {
    fetchRequests();
    fetchUsers();
    fetchCurrentUser();
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
        throw new Error(t("Failed to fetch transport requests", "የመጓጓዣ ጥያቄዎችን ለማምጣት አልተሳካም።"));
      }

      const data = await response.json();
      setRequests(data.results || []);
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentUser = async () => {
    if (!accessToken) {
      setErrorType("unauthorized");
      return;
    }

    try {
      const response = await fetch(ENDPOINTS.CURRENT_USER, {
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
        throw new Error(t("Failed to fetch current user", "የአሁኑን ተጠቃሚ ለማምጣት አልተሳካም።"));
      }

      const data = await response.json();
      setCurrentUser(data);
      console.log("This is the current logged user data:", data);
    } catch (error) {
      console.error("Fetch Current User Error:", error);
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
        throw new Error(t("Failed to fetch users", "ተጠቃሚዎችን ለማምጣት አልተሳካም።"));
      }

      const data = await response.json();
      const filteredUsers = data.results.filter(
        (user) => user.id !== currentUser?.id
      );
      setUsers(filteredUsers || []);
    } catch (error) {
      console.error("Fetch Users Error:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleAddEmployee = () => {
    const selectedEmployeeId = parseInt(formData.employeeName, 10);
    if (
      !isNaN(selectedEmployeeId) &&
      !formData.employees.includes(selectedEmployeeId)
    ) {
      setFormData((prev) => ({
        ...prev,
        employees: [...prev.employees, selectedEmployeeId], // Add employee ID
        employeeName: "", // Reset the dropdown to "Select an employee"
      }));
    }
  };

  const handleRemoveEmployee = (employeeId) => {
    setFormData((prev) => ({
      ...prev,
      employees: prev.employees.filter((id) => id !== employeeId), // Remove employee ID
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!accessToken) {
      console.error("No access token found.");
      return;
    }

    const payload = {
      start_day: formData.startDay,
      return_day: formData.returnDay,
      start_time: `${formData.startTime}:00`, // Ensure time is formatted correctly
      destination: formData.destination,
      reason: formData.reason,
      employees: formData.employees, // Submit all selected employee IDs
    };

    setSubmitting(true);
    try {
      const response = await fetch(ENDPOINTS.CREATE_REQUEST, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(t("Failed to create transport request", "የመጓጓዣ ጥያቄ ለመፍጠር አልተሳካም።"));

      const responseData = await response.json();
      setRequests((prevRequests) => [responseData, ...prevRequests]);

      toast.success(t("Request submitted! Department manager notified.", "ጥያቄ ቀርቧል! የዲፓርትመንት ስራ አስኪያጅ ተነግሯቸዋል።")); // Success toast

      fetchNotifications(); // Fetch updated notifications to reflect the new request

      // Clear the form after submission
      setFormData({
        startDay: "",
        returnDay: "",
        startTime: "",
        employees: [], // Clear employees field
        employeeName: "",
        destination: "",
        reason: "",
      });

      setShowForm(false);
    } catch (error) {
      console.error("Submit Error:", error);
      toast.error(t("Failed to submit request.", "ጥያቄ ለማቅረብ አልተሳካም።")); // Error toast
    } finally {
      setSubmitting(false);
    }
  };

  // Fetch notifications after submission
  const fetchNotifications = async () => {
    try {
      const response = await fetch(ENDPOINTS.REQUEST_NOTIFICATIONS, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!response.ok) throw new Error(t("Failed to fetch notifications", "ማሳወቂያዎችን ለማምጣት አልተሳካም።"));

      const data = await response.json();
      console.log("Updated notifications:", data.results);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const today = new Date().toISOString().split("T")[0];

  // Get employee names from IDs
  const getEmployeeNames = (employeeIds) => {
    return employeeIds
      .map((id) => {
        const employee = users.find((user) => user.id === id);
        return employee ? employee.full_name : t("Unknown", "የማይታወቅ");
      })
      .join(", ");
  };

  // Handle view detail click
  const handleViewDetail = (request) => {
    setSelectedRequest(request);
  };

  // Close detail modal
  const handleCloseDetail = () => {
    setSelectedRequest(null);
  };

  const handleFilterChange = (e) => {
    setFilterStatus(e.target.value);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder((prevOrder) => (prevOrder === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const handleResubmit = (requestId) => {
    const requestToEdit = requests.find((request) => request.id === requestId);
    if (requestToEdit) {
      setFormData({
        startDay: requestToEdit.start_day,
        startTime: requestToEdit.start_time.slice(0, 5), // Extract HH:mm
        returnDay: requestToEdit.return_day,
        employees: requestToEdit.employees,
        employeeName: "",
        destination: requestToEdit.destination,
        reason: requestToEdit.reason,
      });
      setShowForm(true); // Open the form
    }
  };

  const filteredRequests = requests.filter((request) => {
    if (filterStatus === "Approved" && request.status !== "Approved") {
      return false;
    }
    if (filterStatus === "Rejected" && request.status !== "Rejected") {
      return false;
    }
    if (filterStatus === "Forward" && request.status !== "Forward") {
      return false;
    }
    return true; // If status is All or no filter is applied, return true
  });

  const sortedRequests = filteredRequests.sort((a, b) => {
    if (!sortField) return 0;
    const valueA = a[sortField]?.toString().toLowerCase();
    const valueB = b[sortField]?.toString().toLowerCase();
    if (valueA < valueB) return sortOrder === "asc" ? -1 : 1;
    if (valueA > valueB) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  // Calculate paginated requests
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentRequests = sortedRequests.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  // Calculate total pages
  const totalPages = Math.ceil(sortedRequests.length / itemsPerPage);

  // Handle page change
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  if (errorType === "unauthorized") {
    return <UnauthorizedPage />;
  }
  if (errorType === "server") {
    return <ServerErrorPage />;
  }

  return (
    <>
      <Header
        role="employee"
        userId={currentUser?.id}
        onResubmit={handleResubmit}
      />
      <div
        className="container mt-4"
        style={{ minHeight: "100vh", backgroundColor: "#f8f9fc" }}
      >
        <button
          onClick={() => setShowForm(true)}
          className="btn btn mb-3 request"
          style={{ backgroundColor: "#181E4B", color: "#fff" }}
        >
          {t("Request", "ጥያቄ")}
        </button>
        {showForm && (
          <div
            className="modal fade show d-block"
            tabIndex="-1"
            style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
          >
            <div className="modal-dialog">
              <div className="modal-content" style={{ width: "550px" }}>
                <div className="modal-header d-flex justify-content-center align-items-center">
                  <FaWindowClose
                    style={{
                      cursor: "pointer",
                      position: "absolute",
                      top: "10px",
                      right: "10px",
                      fontSize: "1.rem",
                    }}
                    onClick={() => setShowForm(false)}
                  />
                  <h5 className="modal-title d-flex">{t("Transport Request Form", "የመጓጓዣ ጥያቄ ቅጽ")}</h5>
                </div>
                <div className="modal-body">
                  <form
                    onSubmit={handleSubmit}
                    style={{ marginBottom: "-40px", marginTop: "-15px" }}
                  >
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label">{t("Start Day:", "የመነሻ ቀን:")}</label>
                        <input
                          type="date"
                          name="startDay"
                          value={formData.startDay}
                          onChange={handleInputChange}
                          className="form-control"
                          min={today}
                          required
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">{t("Start Time:", "የመነሻ ሰዓት:")}</label>
                        <input
                          type="time"
                          name="startTime"
                          value={formData.startTime}
                          onChange={handleInputChange}
                          className="form-control"
                          required
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">{t("Return Day:", "የመመለሻ ቀን:")}</label>
                        <input
                          type="date"
                          name="returnDay"
                          value={formData.returnDay}
                          onChange={handleInputChange}
                          className="form-control"
                          min={formData.startDay || today}
                          required
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">{t("Destination:", "መድረሻ:")}</label>
                        <input
                          type="text"
                          name="destination"
                          value={formData.destination}
                          onChange={handleInputChange}
                          className="form-control"
                          placeholder={t("Enter destination", "መድረሻ ያስገቡ")}
                          required
                        />
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">{t("Add Employees (Optional):", "ሰራተኞችን ያክሉ (አማራጭ):")}</label>
                      <div className="input-group">
                        <select
                          name="employeeName"
                          value={formData.employeeName}
                          onChange={handleInputChange}
                          className="form-select"
                        >
                          <option value="">{t("Select an employee", "ሰራተኛ ይምረጡ")}</option>
                          {users.map((user) => (
                            <option key={user.id} value={user.id}>
                              {user.full_name}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={handleAddEmployee}
                          disabled={!formData.employeeName}
                        >
                          {t("Add", "አክል")}
                        </button>
                      </div>
                      <div className="mt-2">
                        {formData.employees.length > 0 && (
                          <div className="border p-2 rounded bg-light">
                            <strong>{t("Selected Employees:", "የተመረጡ ሰራተኞች:")}</strong>
                            <ul className="list-unstyled mb-0">
                              {formData.employees.map((id) => (
                                <li
                                  key={id}
                                  className="d-flex justify-content-between align-items-center"
                                >
                                  {
                                    users.find((user) => user.id === id)
                                      ?.full_name
                                  }
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-danger ms-2"
                                    onClick={() => handleRemoveEmployee(id)}
                                  >
                                    X
                                  </button>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">{t("Reason:", "ምክንያት:")}</label>
                      <textarea
                        name="reason"
                        value={formData.reason}
                        onChange={handleInputChange}
                        className="form-control"
                        placeholder={t("Reason for transport", "ለመጓጓዣ ምክንያት")}
                        rows="3"
                        required
                      ></textarea>
                    </div>
                    <div className="d-flex justify-content-end">
                      <button
                        type="submit"
                        className="btn btn-dark"
                        disabled={submitting}
                      >
                        {submitting ? t("Submitting...", "እየቀረበ ነው...") : t("Submit Request", "ጥያቄ አስገባ")}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}
        <div className="d-flex justify-content-between mb-3">
          <h4>{t("Transport Requests", "የመጓጓዣ ጥያቄዎች")}</h4>
          <div className="d-flex">
            <div className="me-3">
              <label htmlFor="filterStatus" className="form-label visually-hidden">
                {t("Filter by Status", "በሁኔታ አጣራ")}
              </label>
              <select
                id="filterStatus"
                className="form-select"
                value={filterStatus}
                onChange={handleFilterChange}
              >
                <option value="">{t("All Statuses", "ሁሉም ሁኔታዎች")}</option>
                <option value="Approved">{t("Approved", "ፀድቋል")}</option>
                <option value="Rejected">{t("Rejected", "ውድቅ ተደርጓል")}</option>
                <option value="Forward">{t("Forward", "የላከው")}</option>
              </select>
            </div>
            <div>
              <label htmlFor="sortField" className="form-label visually-hidden">
                {t("Sort By", "በዚህ አጣራ")}
              </label>
              <select
                id="sortField"
                className="form-select"
                value={sortField}
                onChange={(e) => handleSort(e.target.value)}
              >
                <option value="">{t("Sort By", "በዚህ አጣራ")}</option>
                <option value="start_day">{t("Start Day", "የመነሻ ቀን")}</option>
                <option value="destination">{t("Destination", "መድረሻ")}</option>
                <option value="status">{t("Status", "ሁኔታ")}</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="d-flex justify-content-center align-items-center" style={{ height: "200px" }}>
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">{t("Loading...", "በመጫን ላይ...")}</span>
            </div>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-striped table-hover shadow-sm">
              <thead className="bg-primary text-white">
                <tr>
                  <th scope="col">{t("Start Day", "የመነሻ ቀን")}</th>
                  <th scope="col">{t("Return Day", "የመመለሻ ቀን")}</th>
                  <th scope="col">{t("Start Time", "የመነሻ ሰዓት")}</th>
                  <th scope="col">{t("Destination", "መድረሻ")}</th>
                  <th scope="col">{t("Employees", "ሰራተኞች")}</th>
                  <th scope="col">{t("Reason", "ምክንያት")}</th>
                  <th scope="col">{t("Status", "ሁኔታ")}</th>
                  <th scope="col">{t("Actions", "ድርጊቶች")}</th>
                </tr>
              </thead>
              <tbody>
                {currentRequests.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center">
                      {t("No transport requests found.", "ምንም የመጓጓዣ ጥያቄዎች አልተገኙም።")}
                    </td>
                  </tr>
                ) : (
                  currentRequests.map((request) => (
                    <tr key={request.id}>
                      <td>{request.start_day}</td>
                      <td>{request.return_day}</td>
                      <td>{request.start_time}</td>
                      <td>{request.destination}</td>
                      <td>{getEmployeeNames(request.employees)}</td>
                      <td>{request.reason}</td>
                      <td>{request.status}</td>
                      <td>
                        <button
                          className="btn btn-info btn-sm me-2"
                          onClick={() => handleViewDetail(request)}
                        >
                          {t("View Detail", "ዝርዝር ይመልከቱ")}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        <CustomPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />

        {selectedRequest && (
          <div
            className="modal fade show d-block"
            tabIndex="-1"
            style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
          >
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">{t("Request Details", "የጥያቄ ዝርዝሮች")}</h5>
                  <button
                    type="button"
                    className="btn-close"
                    aria-label="Close"
                    onClick={handleCloseDetail}
                  ></button>
                </div>
                <div className="modal-body">
                  <p><strong>{t("Request ID:", "የጥያቄ መታወቂያ:")}</strong> {selectedRequest.id}</p>
                  <p><strong>{t("Start Day:", "የመነሻ ቀን:")}</strong> {selectedRequest.start_day}</p>
                  <p><strong>{t("Return Day:", "የመመለሻ ቀን:")}</strong> {selectedRequest.return_day}</p>
                  <p><strong>{t("Start Time:", "የመነሻ ሰዓት:")}</strong> {selectedRequest.start_time}</p>
                  <p><strong>{t("Destination:", "መድረሻ:")}</strong> {selectedRequest.destination}</p>
                  <p><strong>{t("Employees:", "ሰራተኞች:")}</strong> {getEmployeeNames(selectedRequest.employees)}</p>
                  <p><strong>{t("Reason:", "ምክንያት:")}</strong> {selectedRequest.reason}</p>
                  <p><strong>{t("Status:", "ሁኔታ:")}</strong> {selectedRequest.status}</p>
                  {selectedRequest.transport_manager_comment && (
                    <p>
                      <strong>{t("Transport Manager Comment:", "የትራንስፖርት ሥራ አስኪያጅ አስተያየት:")}</strong>{" "}
                      {selectedRequest.transport_manager_comment}
                    </p>
                  )}
                  {selectedRequest.finance_manager_comment && (
                    <p>
                      <strong>{t("Finance Manager Comment:", "የፋይናንስ ሥራ አስኪያጅ አስተያየት:")}</strong>{" "}
                      {selectedRequest.finance_manager_comment}
                    </p>
                  )}
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleCloseDetail}
                  >
                    {t("Close", "ዝጋ")}
                  </button>
                  {selectedRequest.status === "Rejected" && (
                    <button
                      type="button"
                      className="btn btn-warning"
                      onClick={() => {
                        handleResubmit(selectedRequest.id);
                        handleCloseDetail();
                      }}
                    >
                      {t("Resubmit", "እንደገና አስገባ")}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
    </>
  );
};

export default EmployeePage;