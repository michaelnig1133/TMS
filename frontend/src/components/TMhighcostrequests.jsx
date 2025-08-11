import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ENDPOINTS } from "../utilities/endpoints";
import CustomPagination from "./CustomPagination";
import UnauthorizedPage from "./UnauthorizedPage";
import ServerErrorPage from "./ServerErrorPage";
import { FaSearch, FaSync, FaCheck, FaTimes, FaGasPump } from "react-icons/fa";
import { IoClose } from "react-icons/io5";
import Logo from "../assets/Logo.jpg";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import { useLanguage } from "../context/LanguageContext";

const TMhighcostrequests = () => {
  const [requests, setRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showEstimateModal, setShowEstimateModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [availableVehicles, setAvailableVehicles] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [estimatedDistance, setEstimatedDistance] = useState("");
  const [fuelPrice, setFuelPrice] = useState("");
  const [isCostCalculated, setIsCostCalculated] = useState(false);
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpAction, setOtpAction] = useState(null);
  const [otpSent, setOtpSent] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "start_day", direction: "desc" });
  const [errorType, setErrorType] = useState(null);
  const { mylanguage } = useLanguage();
  const accessToken = localStorage.getItem("authToken");

  useEffect(() => {
    fetchRequests();
    fetchUsers();
    fetchAvailableVehicles();
  }, []);

  const fetchRequests = async () => {
    if (!accessToken) {
      setErrorType("unauthorized");
      return;
    }
    setLoading(true);
    try {
      const highCostRequests = await fetchHighCostRequests();
      setRequests(highCostRequests.map((r) => ({ ...r, requestType: "High Cost" })));
    } catch (error) {
      if (error.message && error.message.toLowerCase().includes("401")) setErrorType("unauthorized");
      else setErrorType("server");
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
        if (response.status === 401) setErrorType("unauthorized");
        else setErrorType("server");
        throw new Error("Failed to fetch users");
      }
      const data = await response.json();
      setUsers(data.results || []);
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
        if (response.status === 401) setErrorType("unauthorized");
        else setErrorType("server");
        throw new Error("Failed to fetch high-cost transport requests");
      }
      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error("Fetch High-Cost Requests Error:", error);
      return [];
    }
  };

  const fetchAvailableVehicles = async () => {
    if (!accessToken) return;
    try {
      const response = await fetch(ENDPOINTS.ORGANIZATION_AVAILABLE_VEHICLES, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) throw new Error("Failed to fetch available vehicles");
      const data = await response.json();
      setAvailableVehicles(data.results || []);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      toast.error("Failed to fetch available vehicles.");
    }
  };

  const fetchHighCostDetails = async (requestId) => {
    if (!accessToken) return;
    try {
      const response = await fetch(ENDPOINTS.HIGH_COST_DETAIL(requestId), {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) throw new Error("Failed to fetch high-cost request details");
      const data = await response.json();
      setSelectedRequest(data);
    } catch (error) {
      console.error("Fetch High-Cost Details Error:", error);
      toast.error("Failed to fetch high-cost request details.");
    }
  };

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
    setIsCostCalculated(!!request.total_cost);
  };

  const handleCloseDetail = () => {
    setSelectedRequest(null);
    setRejectionReason("");
    setShowEstimateModal(false);
    setOtpModalOpen(false);
    setOtpAction(null);
    setOtpValue("");
    setOtpSent(false);
    setIsCostCalculated(false);
  };

  const estimateCost = async () => {
    if (!selectedVehicleId || !fuelPrice || !estimatedDistance) {
      toast.error("Please provide all required inputs.");
      return;
    }
    try {
      const response = await fetch(
        ENDPOINTS.ESTIMATE_HIGH_COST(selectedRequest.id),
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            estimated_distance_km: estimatedDistance,
            fuel_price_per_liter: fuelPrice,
            estimated_vehicle_id: selectedVehicleId,
          }),
        }
      );
      if (!response.ok) throw new Error("Failed to estimate cost");
      toast.success("Cost estimated successfully!");
      setShowEstimateModal(false);
      fetchHighCostDetails(selectedRequest.id);
      setIsCostCalculated(true);
    } catch (error) {
      console.error("Estimate Cost Error:", error);
      toast.error("Failed to estimate cost.");
    }
  };

  const sendOtp = async () => {
    setOtpLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(ENDPOINTS.OTP_REQUEST, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });
      if (!response.ok) throw new Error("Failed to send OTP");
      setOtpSent(true);
      toast.success("OTP sent to your phone");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleOtpAction = async (otp, action) => {
    setOtpLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      let payload = { action, otp_code: otp };
      if (action === "reject") {
        if (!rejectionReason.trim()) {
          toast.error("Rejection message cannot be empty.");
          setOtpLoading(false);
          return;
        }
        payload.rejection_message = rejectionReason;
      }
      const response = await fetch(
        ENDPOINTS.APPREJ_HIGHCOST_REQUEST(selectedRequest.id),
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || `Failed to ${action} request`);
      }
      toast.success(
        action === "approve"
          ? "Request approved!"
          : action === "forward"
          ? "Request forwarded!"
          : "Request rejected!"
      );
      handleCloseDetail();
      fetchRequests();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setOtpLoading(false);
    }
  };

  const filterRequests = () => {
    let filtered = requests;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          (r.destination && r.destination.toLowerCase().includes(term)) ||
          (r.requester && r.requester.toLowerCase().includes(term)) ||
          (r.status && r.status.toLowerCase().includes(term)) ||
          (r.id && r.id.toString().includes(term))
      );
    }
    return filtered;
  };

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") direction = "desc";
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <FaSearch className="text-muted ms-1" />;
    return sortConfig.direction === "asc" ? (
      <FaCheck className="text-primary ms-1" />
    ) : (
      <FaTimes className="text-primary ms-1" />
    );
  };

  const getSortedRequests = (requests) => {
    if (!sortConfig.key) return requests;
    return [...requests].sort((a, b) => {
      const aValue = a[sortConfig.key] || "";
      const bValue = b[sortConfig.key] || "";
      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  };

  const filteredRequests = getSortedRequests(filterRequests());
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentPageRequests = filteredRequests.slice(startIndex, startIndex + itemsPerPage);

  if (errorType === "unauthorized") return <UnauthorizedPage />;
  if (errorType === "server") return <ServerErrorPage />;

  return (
    <div className="container py-4">
      <ToastContainer />
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="mb-0 d-flex align-items-center">
            <FaGasPump className="me-2 text-success" />
            {mylanguage === "EN" ? "High Cost Requests" : "የከፍተኛ ወጪ ጥያቄዎች"}
          </h1>
        </div>
        <div className="d-flex gap-2">
          <div className="input-group shadow-sm" style={{ maxWidth: "300px" }}>
            <span className="input-group-text bg-white border-end-0">
              <FaSearch className="text-muted" />
            </span>
            <input
              type="text"
              className="form-control border-start-0"
              placeholder={mylanguage === "EN" ? "Search requests..." : "ጥያቄዎችን ይፈልጉ..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            className="btn btn-outline-success d-flex align-items-center"
            onClick={fetchRequests}
            disabled={loading}
          >
            <FaSync className={loading ? "me-2 spin" : "me-2"} />
            {mylanguage === "EN" ? "Refresh" : "ዳግም ያድሱ"}
          </button>
        </div>
      </div>
      <div className="card shadow-sm border-0 overflow-hidden">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>#</th>
                  <th onClick={() => handleSort("start_day")} className="cursor-pointer">
                    <div className="d-flex align-items-center">
                      {mylanguage === "EN" ? "Start Day" : "የመጀመሪያ ቀን"}
                      {getSortIcon("start_day")}
                    </div>
                  </th>
                  <th onClick={() => handleSort("start_time")} className="cursor-pointer">
                    <div className="d-flex align-items-center">
                      {mylanguage === "EN" ? "Start Time" : "የመጀመሪያ ሰዓት"}
                      {getSortIcon("start_time")}
                    </div>
                  </th>
                  <th onClick={() => handleSort("return_day")} className="cursor-pointer">
                    <div className="d-flex align-items-center">
                      {mylanguage === "EN" ? "Return Day" : "የመመለሻ ቀን"}
                      {getSortIcon("return_day")}
                    </div>
                  </th>
                  <th onClick={() => handleSort("destination")} className="cursor-pointer">
                    <div className="d-flex align-items-center">
                      {mylanguage === "EN" ? "Destination" : "መድረሻ"}
                      {getSortIcon("destination")}
                    </div>
                  </th>
                  <th onClick={() => handleSort("requestType")} className="cursor-pointer">
                    <div className="d-flex align-items-center">
                      {mylanguage === "EN" ? "Request Type" : "የጥያቄ አይነት"}
                      {getSortIcon("requestType")}
                    </div>
                  </th>
                  <th onClick={() => handleSort("status")} className="cursor-pointer">
                    <div className="d-flex align-items-center">
                      {mylanguage === "EN" ? "Status" : "ሁኔታ"}
                      {getSortIcon("status")}
                    </div>
                  </th>
                  <th className="text-center">
                    {mylanguage === "EN" ? "Action" : "ተግባር"}
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-5">
                      <div className="d-flex justify-content-center align-items-center">
                        <div className="spinner-border text-success" role="status">
                          <span className="visually-hidden">
                            {mylanguage === "EN" ? "Loading data..." : "በመጫን ላይ..."}
                          </span>
                        </div>
                        <span className="ms-3">
                          {mylanguage === "EN" ? "Loading high cost requests..." : "የከፍተኛ ወጪ ጥያቄዎች በመጫን ላይ..."}
                        </span>
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
                      <td>{request.requestType}</td>
                      <td>
                        <span className={`badge ${
                          request.status === "pending"
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
                          {mylanguage === "EN" ? "View Detail" : "ዝርዝር ይመልከቱ"}
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="text-center text-muted py-5">
                      <div className="py-4">
                        <FaGasPump className="fs-1 text-muted mb-3" />
                        <p className="mb-1 fw-medium fs-5">
                          {searchTerm
                            ? (mylanguage === "EN"
                              ? "No requests match your search"
                              : "ምንም ጥያቄ የፍለጋዎን ውጤት አልተመለከተም")
                            : (mylanguage === "EN"
                              ? "No high cost requests found."
                              : "ምንም የከፍተኛ ወጪ ጥያቄዎች አልተገኙም።")}
                        </p>
                        <small className="text-muted">
                          {searchTerm
                            ? (mylanguage === "EN"
                              ? "Try adjusting your search term"
                              : "የፍለጋዎን ቃል ይቀይሩ")
                            : (mylanguage === "EN"
                              ? "Check back later"
                              : "ተመልከቱ ቅርብ ጊዜ")}
                        </small>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card-footer bg-white d-flex justify-content-between align-items-center py-3 border-0">
          <div className="text-muted small">
            Showing{" "}
            <span className="fw-medium">{filteredRequests.length}</span>{" "}
            requests
            <span>
              {" "}
              of{" "}
              <span className="fw-medium">{requests.length}</span>
            </span>
          </div>
          <div className="d-flex gap-2">
            {searchTerm && (
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => setSearchTerm("")}
              >
                {mylanguage === "EN" ? "Clear Search" : "ፍለጋ ይዝጉ"}
              </button>
            )}
          </div>
        </div>
      </div>
      {/* Pagination */}
      {filteredRequests.length > itemsPerPage && (
        <div className="d-flex justify-content-center mt-4">
          <CustomPagination
            currentPage={currentPage}
            totalPages={Math.ceil(filteredRequests.length / itemsPerPage)}
            handlePageChange={setCurrentPage}
          />
        </div>
      )}
      {/* Modal for Viewing Details */}
      {selectedRequest && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: "700px" }}>
            <div className="modal-content">
              <div className="modal-header">
                <div className="d-flex align-items-center">
                  <img src={Logo} alt="Logo" style={{ width: "80px", height: "50px", marginRight: "10px" }} />
                  <h5 className="modal-title">
                    {mylanguage === "EN"
                      ? "Estimate Cost and Assign Vehicle"
                      : "ወጪ ይቅዱና ተሽከርካሪ ይመድቡ"}
                  </h5>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleCloseDetail}
                >
                  <IoClose size={30} />
                </button>
              </div>
              <div className="modal-body">
                <p>
                  <strong>{mylanguage === "EN" ? "Requester:" : "ጠየቀው ሰው:"}</strong> {selectedRequest.requester}
                </p>
                <p>
                  <strong>{mylanguage === "EN" ? "Employees:" : "ሰራተኞች:"}</strong>{" "}
                  {selectedRequest.employees?.join(", ") || (mylanguage === "EN" ? "N/A" : "አልተገኙም")}
                </p>
                <p>
                  <strong>{mylanguage === "EN" ? "Start Day:" : "የመጀመሪያ ቀን:"}</strong> {selectedRequest.start_day}
                </p>
                <p>
                  <strong>{mylanguage === "EN" ? "Return Day:" : "የመመለሻ ቀን:"}</strong> {selectedRequest.return_day}
                </p>
                <p>
                  <strong>{mylanguage === "EN" ? "Destination:" : "መድረሻ:"}</strong> {selectedRequest.destination}
                </p>
                <p>
                  <strong>{mylanguage === "EN" ? "Reason:" : "ምክንያት:"}</strong> {selectedRequest.reason}
                </p>
                {isCostCalculated && (
                  <>
                    <p>
                      <strong>{mylanguage === "EN" ? "Estimated Vehicle:" : "ተገመተው የተመደበ ተሽከርካሪ:"}</strong>{" "}
                      {selectedRequest.estimated_vehicle}
                    </p>
                    <p>
                      <strong>{mylanguage === "EN" ? "Estimated Distance (km):" : "ተገመተው ርቀት (ኪ.ሜ):"}</strong>{" "}
                      {selectedRequest.estimated_distance_km}
                    </p>
                    <p>
                      <strong>{mylanguage === "EN" ? "Fuel Price per Liter:" : "የነዳጅ ዋጋ በሊትር:"}</strong>{" "}
                      {selectedRequest.fuel_price_per_liter}
                    </p>
                    <p>
                      <strong>{mylanguage === "EN" ? "Fuel Needed (Liters):" : "የሚያስፈልገው ነዳጅ (ሊትር):"}</strong>{" "}
                      {selectedRequest.fuel_needed_liters}
                    </p>
                    <p>
                      <strong>{mylanguage === "EN" ? "Total Cost:" : "ጠቅላላ ወጪ:"}</strong>{" "}
                      {selectedRequest.total_cost} ETB
                    </p>
                  </>
                )}
              </div>
              <div className="modal-footer">
                {selectedRequest.status === "forwarded" && !isCostCalculated && (
                  <Button
                    style={{
                      color: "#ffffff",
                      backgroundColor: "#181E4B",
                      width: "150px",
                    }}
                    onClick={() => setShowEstimateModal(true)}
                  >
                    {mylanguage === "EN" ? "Estimate Cost" : "ወጪ ይቅዱ"}
                  </Button>
                )}
                {selectedRequest.status === "forwarded" && isCostCalculated && (
                  <Stack direction="row" spacing={2}>
                    <Button
                      style={{ color: "#ffffff", backgroundColor: "#181E4B" }}
                      onClick={async () => {
                        setOtpAction("forward");
                        setOtpModalOpen(true);
                        await sendOtp();
                      }}
                    >
                      {mylanguage === "EN" ? "Forward" : "ወደ ፊት ያስቀምጡ"}
                    </Button>
                    <Button
                      style={{ color: "#ffffff", backgroundColor: "#d32f2f" }}
                      onClick={async () => {
                        setOtpAction("reject");
                        setOtpModalOpen(true);
                        await sendOtp();
                      }}
                    >
                      {mylanguage === "EN" ? "Reject" : "አትቀበሉ"}
                    </Button>
                    <Button
                      style={{ color: "#ffffff", backgroundColor: "#ffa726" }}
                      onClick={() => setShowEstimateModal(true)}
                    >
                      {mylanguage === "EN" ? "Recalculate" : "ዳግም ይቅዱ"}
                    </Button>
                  </Stack>
                )}
                {selectedRequest.status === "approved" && (
                  <Button
                    style={{
                      color: "#ffffff",
                      backgroundColor: "#4caf50",
                      width: "150px",
                    }}
                    onClick={async () => {
                      setOtpAction("approve");
                      setOtpModalOpen(true);
                      await sendOtp();
                    }}
                  >
                    {mylanguage === "EN" ? "Assign Vehicle" : "ተሽከርካሪ ይመድቡ"}
                  </Button>
                )}
                <Button
                  variant="outlined"
                  style={{ color: "#181E4B", borderColor: "#181E4B" }}
                  onClick={handleCloseDetail}
                >
                  {mylanguage === "EN" ? "Close" : "ዝጋ"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showEstimateModal && (
        <div className="modal fade show d-block">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {mylanguage === "EN" ? "Estimate Cost" : "ወጪ ይቅዱ"}
                </h5>
                <button
                  className="btn-close"
                  onClick={() => setShowEstimateModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label htmlFor="vehicleSelect" className="form-label">
                    {mylanguage === "EN" ? "Select Vehicle" : "ተሽከርካሪ ይምረጡ"}
                  </label>
                  <select
                    id="vehicleSelect"
                    className="form-select"
                    value={selectedVehicleId}
                    onChange={(e) => setSelectedVehicleId(e.target.value)}
                  >
                    <option value="">
                      {mylanguage === "EN" ? "Select a vehicle" : "ተሽከርካሪ ይምረጡ"}
                    </option>
                    {availableVehicles.map((vehicle) => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.model} - {vehicle.license_plate}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label htmlFor="fuelPrice" className="form-label">
                    {mylanguage === "EN"
                      ? "Fuel Price per Liter"
                      : "የነዳጅ ዋጋ በሊትር"}
                  </label>
                  <input
                    id="fuelPrice"
                    type="number"
                    className="form-control"
                    value={fuelPrice}
                    onChange={(e) => setFuelPrice(e.target.value)}
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="estimatedDistance" className="form-label">
                    {mylanguage === "EN"
                      ? "Estimated Distance (km)"
                      : "ተገመተው ርቀት (ኪ.ሜ)"}
                  </label>
                  <input
                    id="estimatedDistance"
                    type="number"
                    className="form-control"
                    value={estimatedDistance}
                    onChange={(e) => setEstimatedDistance(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <Stack direction="row" spacing={2}>
                  <Button
                    style={{ color: "#ffffff", backgroundColor: "#181E4B" }}
                    onClick={estimateCost}
                  >
                    {mylanguage === "EN" ? "Calculate" : "አስላክ"}
                  </Button>
                  <Button
                    variant="outlined"
                    style={{ color: "#d32f2f", borderColor: "#d32f2f" }}
                    onClick={() => setShowEstimateModal(false)}
                  >
                    {mylanguage === "EN" ? "Close" : "ዝጋ"}
                  </Button>
                </Stack>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* OTP Modal */}
      {otpModalOpen && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Enter OTP to {otpAction === "approve"
                    ? "assign vehicle"
                    : otpAction === "forward"
                    ? "forward request"
                    : "reject request"}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleCloseDetail}
                  disabled={otpLoading}
                >
                  <IoClose />
                </button>
              </div>
              <div className="modal-body">
                <p>Enter the OTP code sent to your phone number.</p>
                <div className="d-flex justify-content-center gap-2 mb-3">
                  {[...Array(6)].map((_, idx) => (
                    <input
                      key={idx}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      className="form-control text-center"
                      style={{
                        width: "40px",
                        height: "40px",
                        fontSize: "1.5rem",
                        borderRadius: "6px",
                        border: "1px solid #ccc",
                        boxShadow: "none",
                      }}
                      value={otpValue[idx] || ""}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "");
                        if (!val) return;
                        let newOtp = otpValue.split("");
                        newOtp[idx] = val;
                        if (val && idx < 5) {
                          const next = document.getElementById(
                            `otp-input-${idx + 1}`
                          );
                          if (next) next.focus();
                        }
                        setOtpValue(newOtp.join("").slice(0, 6));
                      }}
                      onKeyDown={(e) => {
                        if (
                          e.key === "Backspace" &&
                          !otpValue[idx] &&
                          idx > 0
                        ) {
                          const prev = document.getElementById(
                            `otp-input-${idx - 1}`
                          );
                          if (prev) prev.focus();
                        }
                      }}
                      id={`otp-input-${idx}`}
                      disabled={otpLoading}
                    />
                  ))}
                </div>
                {otpAction === "reject" && (
                  <textarea
                    className="form-control mt-3"
                    rows={2}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Reason for rejection"
                    disabled={otpLoading}
                  />
                )}
              </div>
              <div className="modal-footer">
                <Button
                  variant="text"
                  onClick={() => sendOtp()}
                  disabled={otpLoading}
                >
                  Resend OTP
                </Button>
                <Button
                  variant="contained"
                  style={{ backgroundColor: "#181E4B", color: "#fff" }}
                  disabled={otpLoading || otpValue.length !== 6}
                  onClick={() => handleOtpAction(otpValue, otpAction)}
                >
                  {otpLoading
                    ? "Processing..."
                    : otpAction === "approve"
                    ? "Assign Vehicle"
                    : otpAction === "forward"
                    ? "Forward"
                    : "Reject"}
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleCloseDetail}
                  disabled={otpLoading}
                  style={{ borderColor: "#181E4B", color: "#181E4B" }}
                >
                  Cancel
                </Button>
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
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
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
      `}</style>
    </div>
  );
};

export default TMhighcostrequests;