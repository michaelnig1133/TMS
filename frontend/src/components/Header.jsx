import React, { useState, useEffect } from "react";
import { FaSignOutAlt, FaArrowLeft, FaTimes } from "react-icons/fa";
import { MdAccountCircle } from "react-icons/md";
import { IoIosNotificationsOutline } from "react-icons/io";
import "bootstrap/dist/css/bootstrap.min.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { ENDPOINTS } from "../utilities/endpoints";
import "../index.css";
import { IoEye, IoEyeOff } from "react-icons/io5";
import { Spinner } from "react-bootstrap";
import classNames from "classnames"; // npm install classnames

const Header = ({ setRole, onResubmit }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    phone_number: "",
    old_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [signature, setSignature] = useState(null);
  const [signaturePreview, setSignaturePreview] = useState(null);
  const [initialUserData, setInitialUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState({
    old: false,
    new: false,
    confirm: false,
  });
  const [errors, setErrors] = useState({});
  const [shake, setShake] = useState({});

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get(ENDPOINTS.CURRENT_USER, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        });
        const user = response.data;
        setInitialUserData(user);

        if (setRole) setRole(user.role);

        setFormData({
          full_name: user.full_name || "",
          phone_number: user.phone_number || "",
          old_password: "",
          new_password: "",
          confirm_password: "",
        });
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    };

    fetchUserData();
    fetchNotifications();
    fetchUnreadCount();
    // eslint-disable-next-line
  }, []);

  const getFullSignatureUrl = (signaturePath) => {
    if (!signaturePath) return null;
    if (signaturePath.startsWith("http")) return signaturePath;
    if (signaturePath.startsWith("/")) {
      return `https://tms-api-23gs.onrender.com${signaturePath}`;
    }
    return `https://tms-api-23gs.onrender.com/${signaturePath}`;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSignatureChange = (e) => {
    const file = e.target.files[0];
    setSignature(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSignaturePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setSignaturePreview(
        initialUserData?.signature_image
          ? getFullSignatureUrl(initialUserData.signature_image)
          : null
      );
    }
  };

  // Password strength check
  const isStrongPassword = (password) => {
    // At least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(
      password
    );
  };

  // Validation
  const validate = () => {
    const newErrors = {};
    // For full_name, only required if changed and not empty
    if (
      formData.full_name !== initialUserData?.full_name &&
      !formData.full_name.trim()
    )
      newErrors.full_name = "Full name is required";
    // For phone_number, only required if changed and not empty
    if (
      formData.phone_number !== initialUserData?.phone_number &&
      !formData.phone_number.trim()
    )
      newErrors.phone_number = "Phone number is required";
    // Only validate password fields if any are filled (allow phone update without password, or password update without phone)
    if (
      formData.old_password ||
      formData.new_password ||
      formData.confirm_password
    ) {
      if (!formData.old_password)
        newErrors.old_password = "Old password is required";
      if (!formData.new_password)
        newErrors.new_password = "New password is required";
      else if (!isStrongPassword(formData.new_password))
        newErrors.new_password =
          "Password must be at least 8 characters, include uppercase, lowercase, number, and special character";
      if (formData.new_password !== formData.confirm_password)
        newErrors.confirm_password = "Passwords do not match";
    }
    return newErrors;
  };

  // Handle form submission with validation and shake effect
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);

    // Shake effect for invalid fields
    if (Object.keys(validationErrors).length > 0) {
      const newShake = {};
      Object.keys(validationErrors).forEach((key) => {
        newShake[key] = true;
      });
      setShake(newShake);
      setTimeout(() => setShake({}), 500);
      return;
    }

    setIsLoading(true);

    try {
      const formDataToSend = new FormData();
      // Only send updated fields
      if (
        formData.full_name !== initialUserData?.full_name &&
        formData.full_name.trim()
      )
        formDataToSend.append("full_name", formData.full_name);
      if (
        formData.phone_number !== initialUserData?.phone_number &&
        formData.phone_number.trim()
      )
        formDataToSend.append("phone_number", formData.phone_number);

      // Only send password fields if all are filled
      if (
        formData.old_password.trim() &&
        formData.new_password.trim() &&
        formData.confirm_password.trim()
      ) {
        formDataToSend.append("old_password", formData.old_password);
        formDataToSend.append("new_password", formData.new_password);
        formDataToSend.append("confirm_password", formData.confirm_password);
      }

      if (signature) {
        formDataToSend.append("signature_image", signature);
      }

      const response = await axios.put(ENDPOINTS.CURRENT_USER, formDataToSend, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });

      const updatedUser = response.data;
      setInitialUserData(updatedUser);

      setSignaturePreview(
        updatedUser.signature_image
          ? getFullSignatureUrl(updatedUser.signature_image)
          : null
      );

      setIsEditing(false);
      setSignature(null);
      setFormData((prev) => ({
        ...prev,
        old_password: "",
        new_password: "",
        confirm_password: "",
      }));
      setErrors({});
    } catch (error) {
      // Custom error handling
      let customErrors = {};
      const apiError =
        error.response?.data?.error || error.response?.data?.detail || "";
      if (apiError) {
        if (
          apiError.toLowerCase().includes("old password") ||
          apiError.toLowerCase().includes("incorrect")
        ) {
          customErrors.old_password = "Old password is not correct";
        } else if (
          apiError.toLowerCase().includes("match") ||
          apiError.toLowerCase().includes("do not match")
        ) {
          customErrors.confirm_password = "New passwords do not match";
        } else if (
          apiError.toLowerCase().includes("strong") ||
          apiError.toLowerCase().includes("weak")
        ) {
          customErrors.new_password =
            "Password must be at least 8 characters, include uppercase, lowercase, number, and special character";
        } else {
          customErrors.submit = apiError;
        }
      } else {
        customErrors.submit = "Failed to update profile.";
      }
      setErrors(customErrors);
      // Shake effect for error fields
      const newShake = {};
      Object.keys(customErrors).forEach((key) => {
        newShake[key] = true;
      });
      setShake(newShake);
      setTimeout(() => setShake({}), 500);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("refresh_token");
    navigate("/");
  };

  // --- Notification logic ---
  const fetchNotifications = () => {
    axios
      .get(ENDPOINTS.REQUEST_NOTIFICATIONS, {
        params: { unread_only: false },
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      })
      .then((response) => {
        setNotifications(response.data.results || []);
        setUnreadCount(response.data.unread_count || 0);
      })
      .catch((error) => console.error("Error fetching notifications:", error));
  };

  const fetchUnreadCount = () => {
    axios
      .get(ENDPOINTS.UNREADOUNT, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      })
      .then((response) => {
        setUnreadCount(response.data.unread_count || 0);
      })
      .catch((error) => console.error("Error fetching unread count:", error));
  };

  const handleNotificationClick = () => {
    if (!showNotifications) {
      fetchNotifications();
    }
    setShowNotifications(!showNotifications);
  };

  const markAllNotificationsAsRead = () => {
    axios
      .post(
        ENDPOINTS.MARKALL_READ,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        }
      )
      .then(() => {
        setUnreadCount(0);
        fetchNotifications();
      })
      .catch((error) =>
        console.error("Error marking notifications as read:", error)
      );
  };

  const handleCloseNotifications = () => {
    markAllNotificationsAsRead();
    setShowNotifications(false);
  };

  const handleResubmit = (requestId) => {
    if (onResubmit) onResubmit(requestId);
    setShowNotifications(false);
  };

  const renderNotificationContent = (notification) => {
    const notificationDate = new Date(notification.created_at);
    const formattedDate = notificationDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const formattedTime = notificationDate.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

    let notificationClass = "mb-3 p-3 border-bottom";
    if (notification.notification_type === "forwarded") {
      notificationClass += " bg-light";
    } else if (notification.notification_type === "approved") {
      notificationClass += " bg-success bg-opacity-10";
    } else if (notification.notification_type === "rejected") {
      notificationClass += " bg-danger bg-opacity-10";
    } else if (notification.notification_type === "new_maintenance") {
      notificationClass += " bg-warning bg-opacity-10";
    } else if (notification.notification_type === "service_due") {
      notificationClass += " bg-info bg-opacity-10";
    }

    return (
      <div key={notification.id} className={notificationClass}>
        <h6 className="fw-bold mb-1">{notification.title || "Service Due"}</h6>
        <div className="small text-muted">
          {notification.notification_type === "service_due" &&
            notification.metadata && (
              <>
                <div className="d-flex justify-content-between">
                  <strong>Vehicle:</strong>{" "}
                  <span>{notification.metadata.vehicle_model}</span>
                </div>
                <div className="d-flex justify-content-between">
                  <strong>Plate:</strong>{" "}
                  <span>{notification.metadata.license_plate}</span>
                </div>
                <div className="d-flex justify-content-between">
                  <strong>Kilometer:</strong>{" "}
                  <span>{notification.metadata.kilometer}</span>
                </div>
              </>
            )}
          {notification.metadata &&
            notification.notification_type !== "service_due" && (
              <>
                {notification.metadata.requester && (
                  <div className="d-flex justify-content-between">
                    <strong>Requester:</strong>{" "}
                    <span>{notification.metadata.requester}</span>
                  </div>
                )}
                {notification.metadata.destination && (
                  <div className="d-flex justify-content-between">
                    <strong>Destination:</strong>{" "}
                    <span>{notification.metadata.destination}</span>
                  </div>
                )}
                {notification.metadata.passengers && (
                  <div className="d-flex justify-content-between">
                    <strong>Passengers:</strong>{" "}
                    <span>{notification.metadata.passengers}</span>
                  </div>
                )}
                {notification.notification_type === "rejected" &&
                  notification.metadata.rejection_reason && (
                    <div className="d-flex justify-content-between">
                      <strong>Reason:</strong>{" "}
                      <span>{notification.metadata.rejection_reason}</span>
                    </div>
                  )}
              </>
            )}
        </div>
        <div className="d-flex justify-content-between align-items-center mt-2">
          <small className="text-muted">
            {formattedDate} at {formattedTime}
          </small>
          {notification.notification_type === "rejected" &&
            notification.metadata.request_id && (
              <button
                className="btn btn-sm btn-outline-primary"
                onClick={() => handleResubmit(notification.metadata.request_id)}
              >
                Resubmit
              </button>
            )}
        </div>
        {notification.notification_type === "service_due" && (
          <div
            className="alert alert-warning mt-2 mb-0 py-2 px-3"
            style={{ fontSize: "0.95em" }}
          >
            {notification.message}
          </div>
        )}
      </div>
    );
  };

  const profileRef = React.useRef(null);

  useEffect(() => {
    if (!isEditing) return;

    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsEditing(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isEditing]);

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light px-4 shadow-sm">
      <div className="ms-auto d-flex align-items-center position-relative">
        {/* Notification Bell */}
        <div className="position-relative">
          <IoIosNotificationsOutline
            size={30}
            className="me-3 cursor-pointer"
            onClick={handleNotificationClick}
            style={{ cursor: "pointer" }}
          />
          {unreadCount > 0 && (
            <span
              onClick={handleNotificationClick}
              className="position-absolute translate-middle badge d-flex align-items-center justify-content-center"
              style={{
                textAlign: "center",
                width: "22px",
                height: "22px",
                top: "7px",
                left: "25px",
                backgroundColor: "red",
                borderRadius: "50%",
                fontSize: "12px",
                color: "white",
                cursor: "pointer",
              }}
            >
              {unreadCount}
            </span>
          )}
        </div>

        {/* Notification Dropdown */}
        {showNotifications && (
          <div
            className="dropdown-menu show position-absolute end-0 mt-2 shadow rounded p-3 bg-white"
            style={{
              zIndex: 1050,
              top: "100%",
              width: "350px",
              maxHeight: "500px",
              overflowY: "auto",
            }}
          >
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0">Notifications</h5>
              <FaTimes
                size={20}
                className="cursor-pointer"
                onClick={handleCloseNotifications}
                style={{ cursor: "pointer" }}
              />
            </div>
            {notifications.length > 0 ? (
              notifications.map((notification) =>
                renderNotificationContent(notification)
              )
            ) : (
              <div className="text-center py-3">
                <p className="text-muted">No new notifications</p>
              </div>
            )}
          </div>
        )}

        {/* Profile Icon with user info */}
        <div
          className="user-menu d-flex align-items-center"
          onClick={() => setIsEditing(!isEditing)}
          style={{ cursor: "pointer" }}
        >
          <MdAccountCircle size={32} className="me-2" />
          {initialUserData && (
            <span className="d-none d-md-inline">
              {initialUserData.full_name || "My Account"}
            </span>
          )}
        </div>

        {/* Edit Profile Dropdown */}
        {isEditing && (
          <div
            ref={profileRef}
            className="dropdown-menu show position-absolute end-0 mt-2 shadow rounded p-3 bg-white"
            style={{ zIndex: 1050, top: "100%", width: "320px" }}
          >
            <h5 className="mb-3 text-center" style={{ fontSize: "16px" }}>
              Edit Profile
            </h5>
            <form onSubmit={handleFormSubmit} autoComplete="off">
              <div className="mb-3">
                <label htmlFor="full_name" className="form-label fw-semibold">
                  Full Name
                </label>
                <input
                  type="text"
                  className={classNames("form-control", {
                    "is-invalid": errors.full_name,
                    shake: shake.full_name,
                  })}
                  id="full_name"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  autoComplete="off"
                  placeholder={initialUserData?.full_name || "Full Name"}
                />
                {errors.full_name && (
                  <div className="invalid-feedback">{errors.full_name}</div>
                )}
              </div>

              <div className="mb-3">
                <label
                  htmlFor="phone_number"
                  className="form-label fw-semibold"
                >
                  Phone Number
                </label>
                <input
                  type="tel"
                  className={classNames("form-control", {
                    "is-invalid": errors.phone_number,
                    shake: shake.phone_number,
                  })}
                  id="phone_number"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleChange}
                  autoComplete="off"
                  placeholder={initialUserData?.phone_number || "Phone Number"}
                />
                {errors.phone_number && (
                  <div className="invalid-feedback">{errors.phone_number}</div>
                )}
              </div>

              <div className="mb-3">
                <label
                  htmlFor="old_password"
                  className="form-label fw-semibold"
                >
                  Old Password
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={passwordVisible.old ? "text" : "password"}
                    className={classNames("form-control", {
                      "is-invalid": errors.old_password,
                      shake: shake.old_password,
                    })}
                    id="old_password"
                    name="old_password"
                    value={formData.old_password}
                    onChange={handleChange}
                    autoComplete="off"
                    placeholder="Enter old password to change"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() =>
                      setPasswordVisible((v) => ({ ...v, old: !v.old }))
                    }
                    style={{
                      position: "absolute",
                      right: "8px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      border: "none",
                      background: "none",
                      padding: 0,
                      margin: 0,
                      outline: "none",
                      cursor: "pointer",
                      color: "#888",
                      height: "24px",
                      width: "24px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    aria-label={
                      passwordVisible.old ? "Hide password" : "Show password"
                    }
                  >
                    {passwordVisible.old ? (
                      <IoEyeOff size={20} />
                    ) : (
                      <IoEye size={20} />
                    )}
                  </button>
                </div>
                {errors.old_password && (
                  <div className="invalid-feedback">{errors.old_password}</div>
                )}
              </div>

              <div className="mb-3">
                <label
                  htmlFor="new_password"
                  className="form-label fw-semibold"
                >
                  New Password
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={passwordVisible.new ? "text" : "password"}
                    className={classNames("form-control", {
                      "is-invalid": errors.new_password,
                      shake: shake.new_password,
                    })}
                    id="new_password"
                    name="new_password"
                    value={formData.new_password}
                    onChange={handleChange}
                    autoComplete="off"
                    placeholder="Leave blank to keep current"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() =>
                      setPasswordVisible((v) => ({ ...v, new: !v.new }))
                    }
                    style={{
                      position: "absolute",
                      right: "8px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      border: "none",
                      background: "none",
                      padding: 0,
                      margin: 0,
                      outline: "none",
                      cursor: "pointer",
                      color: "#888",
                      height: "24px",
                      width: "24px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    aria-label={
                      passwordVisible.new ? "Hide password" : "Show password"
                    }
                  >
                    {passwordVisible.new ? (
                      <IoEyeOff size={20} />
                    ) : (
                      <IoEye size={20} />
                    )}
                  </button>
                </div>
                {errors.new_password && (
                  <div className="invalid-feedback">{errors.new_password}</div>
                )}
              </div>

              <div className="mb-3">
                <label
                  htmlFor="confirm_password"
                  className="form-label fw-semibold"
                >
                  Confirm New Password
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={passwordVisible.confirm ? "text" : "password"}
                    className={classNames("form-control", {
                      "is-invalid": errors.confirm_password,
                      shake: shake.confirm_password,
                    })}
                    id="confirm_password"
                    name="confirm_password"
                    value={formData.confirm_password}
                    onChange={handleChange}
                    autoComplete="off"
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() =>
                      setPasswordVisible((v) => ({ ...v, confirm: !v.confirm }))
                    }
                    style={{
                      position: "absolute",
                      right: "8px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      border: "none",
                      background: "none",
                      padding: 0,
                      margin: 0,
                      outline: "none",
                      cursor: "pointer",
                      color: "#888",
                      height: "24px",
                      width: "24px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    aria-label={
                      passwordVisible.confirm
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {passwordVisible.confirm ? (
                      <IoEyeOff size={20} />
                    ) : (
                      <IoEye size={20} />
                    )}
                  </button>
                </div>
                {errors.confirm_password && (
                  <div className="invalid-feedback">
                    {errors.confirm_password}
                  </div>
                )}
              </div>

              {errors.submit && (
                <div className="alert alert-danger py-2">{errors.submit}</div>
              )}

              <div className="d-flex justify-content-between mt-4">
                <button
                  type="submit"
                  className="btn w-100 text-white"
                  style={{ backgroundColor: "#0B455B" }}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                        className="me-2"
                      />
                      Saving...
                    </>
                  ) : (
                    "Save"
                  )}
                </button>
                <button
                  onClick={handleLogout}
                  className="btn btn-link text-danger p-0 ms-3"
                  style={{ fontSize: "12px" }}
                  type="button"
                >
                  <FaSignOutAlt className="me-2" />
                  Logout
                </button>
              </div>
            </form>
            {/* Add shake animation style */}
            <style>
              {`
                .shake {
                  animation: shake 0.3s;
                }
                @keyframes shake {
                  0% { transform: translateX(0); }
                  20% { transform: translateX(-6px); }
                  40% { transform: translateX(6px); }
                  60% { transform: translateX(-4px); }
                  80% { transform: translateX(4px); }
                  100% { transform: translateX(0); }
                }
              `}
            </style>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Header;