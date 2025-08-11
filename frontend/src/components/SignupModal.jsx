import React, { useState, useEffect } from "react";
import axios from "axios";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import { toast } from "react-toastify";
import SignUpLogo from "../assets/Signup.jpg";
import { IoClose, IoEye, IoEyeOff } from "react-icons/io5";
import { ENDPOINTS } from "../utilities/endpoints";
const SignupModal = ({ onClose }) => {
  const [formData, setFormData] = useState({
    full_name: "",
    phone_number: "",
    email: "",
    department: "",
    password: "",
    confirm_password: "",
  });

  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { mylanguage } = useLanguage();
  const { myTheme } = useTheme();

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await axios.get(ENDPOINTS.DEPARTMENT_LIST);
        console.log("Departments API Response:", response.data); // Debugging log
        setDepartments(response.data); // Extract the results array
      } catch (error) {
        console.error("Error fetching departments:", error);
        setError("Failed to load departments.");
        toast.error("Failed to load departments.");
      } finally {
        setLoading(false);
      }
    };
  
    fetchDepartments();
  }, []);
  
  

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (Object.values(formData).some((field) => !field)) {
      toast.error("Please fill in all fields.");
      return;
    }

    if (formData.password !== formData.confirm_password) {
      toast.error("Passwords do not match.");
      return;
    }

    const phoneRegex = /^(09|07)\d{8}$/;
    if (!phoneRegex.test(formData.phone_number)) {
      toast.error("Phone number should start with 09 or 07 and be 10 digits long.");
      return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(formData.password)) {
      toast.error("Password must be at least 8 characters long and include an uppercase letter, a lowercase letter, a number, and a special character.");
      return;
    }

    try {
      const response = await axios.post(
        ENDPOINTS.REGISTER,
        { ...formData, role: 1 },
        { headers: { "Content-Type": "application/json" } }
      );

      toast.success(response.data.message || "Registration successful!");
      setFormData({
        full_name: "",
        phone_number: "",
        email: "",
        department: "",
        password: "",
        confirm_password: "",
      });

      setTimeout(() => onClose(), 2000);
    } catch (err) {
      toast.error(err.response?.data?.detail || "There was an issue with registration.");
    }
  };

  return (
    <div className="modal-overlay">
      <div
        className={`card shadow modal-card d-flex flex-row ${myTheme === "dark" ? "dark" : "light"}`}
        style={{ maxWidth: "45rem", position: "relative" }}
      >
        <button
          className="btn-close"
          style={{ position: "absolute", right: "30px" }}
          onClick={onClose}
        >
          <IoClose size={30} />
        </button>

        {/* Left Side - Image */}
        <div style={{ flex: 1, display: "flex", justifyContent: "flex-start" }}>
          <img
            src={SignUpLogo}
            alt="Sign Up"
            style={{ maxWidth: "100%", borderRadius: "10px", height: "100%" }}
          />
        </div>

        {/* Right Side - Form */}
        <div style={{ flex: 1, padding: "20px" }}>
          <h1 className="text-center mb-4">
            {mylanguage === "EN" ? "Sign Up" : "ይመዝገቡ"}
          </h1>

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <input
                type="text"
                name="full_name"
                className="form-control"
                placeholder={mylanguage === "EN" ? "Full Name" : "ሙሉ ስም"}
                value={formData.full_name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="mb-3">
              <input
                type="text"
                name="phone_number"
                className="form-control"
                placeholder={mylanguage === "EN" ? "Phone Number" : "ስልክ ቁጥር"}
                value={formData.phone_number}
                onChange={handleChange}
                required
              />
            </div>
            <div className="mb-3">
              <input
                type="email"
                name="email"
                className="form-control"
                placeholder={mylanguage === "EN" ? "Email" : "ኢሜል"}
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label fw-semibold text-secondary">
                {mylanguage === "EN" ? "Assign Department" : "ክፍል ይመድቡ"}
              </label>
              <select
                name="department"
                className="form-control"
                value={formData.department}
                onChange={handleChange}
                required
              >
                <option value="">
                  {loading
                    ? (mylanguage === "EN" ? "Loading..." : "በመጫን ላይ...")
                    : mylanguage === "EN"
                    ? "Select Department"
                    : "ክፍል ይምረጡ"}
                </option>
                {departments && departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-3 position-relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                className="form-control"
                placeholder={mylanguage === "EN" ? "Password" : "ፕስወርድ"}
                value={formData.password}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="btn position-absolute end-0 top-0"
                style={{ background: "none", border: "none" }}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <IoEyeOff size={20} /> : <IoEye size={20} />}
              </button>
            </div>
            <div className="mb-3 position-relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirm_password"
                className="form-control"
                placeholder={mylanguage === "EN" ? "Confirm Password" : "ፕስወርድን ያረጋግጡ"}
                value={formData.confirm_password}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="btn position-absolute end-0 top-0"
                style={{ background: "none", border: "none" }}
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <IoEyeOff size={20} /> : <IoEye size={20} />}
              </button>
            </div>
            <button
              type="submit"
              className="btn w-100"
              style={{ backgroundColor: "#27485D", color: "#ffffff" }}
            >
              {mylanguage === "EN" ? "Sign Up" : "ይመዝገቡ"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignupModal;
