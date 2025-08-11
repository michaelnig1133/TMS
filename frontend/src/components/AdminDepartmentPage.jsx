import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import axios from "axios";
import { ENDPOINTS } from "../utilities/endpoints";
import CustomPagination from "./CustomPagination";
import UnauthorizedPage from "./UnauthorizedPage";
import ServerErrorPage from "./ServerErrorPage";
import { useLanguage } from "../context/LanguageContext";
const AdminDepartmentPage = () => {
  const { myLanguage } = useLanguage();
  const [departments, setDepartments] = useState([]); // Ensure it's always an array
  const [users, setUsers] = useState([]); // State for users
  const [showModal, setShowModal] = useState(false);
  const [currentDepartment, setCurrentDepartment] = useState(null);
  const [formValues, setFormValues] = useState({
    name: "",
    manager: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [errorType, setErrorType] = useState(null); // "unauthorized" | "server" | null

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentDepartments = departments.slice(startIndex, endIndex);

  // Get the token from localStorage
  const token = localStorage.getItem("authToken");

  // Set Authorization header if token exists
  const axiosInstance = axios.create({
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  // Fetch departments and users when the component loads
  useEffect(() => {
    const fetchDepartmentsAndUsers = async () => {
      try {
        const departmentResponse = await axiosInstance.get(
          ENDPOINTS.DEPARTMENT_LIST
        );
        const userResponse = await axiosInstance.get(ENDPOINTS.USERS);

        const fetchedDepartments = departmentResponse.data || [];
        const fetchedUsers = userResponse.data.results || [];

        setDepartments(fetchedDepartments);
        setUsers(fetchedUsers);
      } catch (error) {
        if (error.response && error.response.status === 401) {
          setErrorType("unauthorized");
        } else {
          setErrorType("server");
        }
        setDepartments([]);
        setUsers([]);
      }
    };

    fetchDepartmentsAndUsers();
  }, []);

  const validateInput = () => {
    const errors = {};
    if (!formValues.name) errors.name = "Department name is required.";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddOrEdit = async () => {
    if (!validateInput()) return;

    try {
      let response;
      if (currentDepartment) {
        // Edit existing department
        response = await axiosInstance.put(
          ENDPOINTS.DEPARTMENT_DETAIL(currentDepartment.id),
          formValues
        );
        setDepartments((prev) =>
          prev.map((dept) =>
            dept.id === currentDepartment.id ? { ...dept, ...formValues } : dept
          )
        );
      } else {
        // Add new department
        response = await axiosInstance.post(
          ENDPOINTS.DEPARTMENT_LIST,
          formValues
        );
        setDepartments((prev) => [...prev, response.data]);
      }
      handleCloseModal();
    } catch (error) {
      console.error("Error saving department:", error);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormValues({ name: "", manager: "" });
    setFormErrors({});
    setCurrentDepartment(null);
  };

  const handleEdit = (department) => {
    setCurrentDepartment(department);
    setFormValues(department);
    setShowModal(true);
  };

  if (errorType === "unauthorized") {
    return <UnauthorizedPage />;
  }
  if (errorType === "server") {
    return <ServerErrorPage />;
  }

  return (
    <div
      className="d-flex mt-4"
      style={{ minHeight: "100vh", backgroundColor: "#f8f9fc" }}
    >
      <div className="flex-grow-1">
        <div className="d-flex justify-content-between align-items-center mb-4 mt-4">
          <h2 className="h5">{myLanguage==="EN"?"Department Management":"የመምሪያው አስተዳደር"}</h2>
        </div>

        <div className="container py-4">
          <div className="d-flex justify-content-start align-items-center mb-2">
            <button
              className="btn"
              style={{
                backgroundColor: "#0b455b",
                color: "#fff",
                height: "50px",
                width: "200px",
              }}
              onClick={() => setShowModal(true)}
            >
              {myLanguage==="EN"?"Add Department":"ዲፓርትመንት አክል"}
            </button>
          </div>

          <div className="card shadow-sm">
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>#</th>
                      <th>{myLanguage==="EN"?"Department Name":"የመምሪያው ስም"}</th>
                      <th>{myLanguage==="EN"?"Manager":"አስተዳዳሪ"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentDepartments.length > 0 ? (
                      currentDepartments.map((dept, index) => (
                        <tr key={dept.id}>
                          <td>
                            {(currentPage - 1) * itemsPerPage + index + 1}
                          </td>{" "}
                          {/* Correct numbering */}
                          <td>{dept.name}</td>
                          <td>
                            {dept.department_manager
                              ? dept.department_manager
                              : (myLanguage === "EN" ? "No Manager Assigned" : "የአስተዳዳሪ መለያ የለም")}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="text-center">
                          {myLanguage === "EN" ? "No departments added yet." : "ምንም ክፍሎች አልተጨመሩም።"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="d-flex justify-content-center align-items-center">
          <CustomPagination
            currentPage={currentPage}
            totalPages={Math.ceil(departments.length / itemsPerPage)}
            handlePageChange={(page) => setCurrentPage(page)}
          />
        </div>

        {showModal && (
          <div
            className="modal fade show d-block"
            style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
          >
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    {currentDepartment ? (myLanguage === "EN" ? "Edit Department" : "ዲፓርትመንት ቀይር") : (myLanguage === "EN" ? "Add Department" : "ዲፓርትመንት አክል")}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={handleCloseModal}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">{myLanguage === "EN" ? "Department Name" : "የመምሪያው ስም"}</label>
                    <input
                      type="text"
                      className="form-control"
                      name="name"
                      value={formValues.name}
                      onChange={(e) =>
                        setFormValues({ ...formValues, name: e.target.value })
                      }
                    />
                    {formErrors.name && (
                      <small className="text-danger">{formErrors.name}</small>
                    )}
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleCloseModal}
                  >
                    { myLanguage === "EN" ? "Cancel" : "ሰርዝ"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleAddOrEdit}
                  >
                    {myLanguage === "EN" ? "Save" : "አስቀምጥ"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDepartmentPage;
