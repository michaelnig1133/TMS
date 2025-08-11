import React, { useState, useEffect } from "react";
import "../index.css";
import axios from "axios";
import { IoMdClose } from "react-icons/io";
import CustomPagination from "./CustomPagination";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ENDPOINTS } from "../utilities/endpoints";
import UnauthorizedPage from "./UnauthorizedPage";
import ServerErrorPage from "./ServerErrorPage";

const VehicleManagement = () => {
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState(""); // new state for search
  const [newVehicle, setNewVehicle] = useState({
    license_plate: "",
    model: "",
    capacity: "",
    source: "owned",
    rental_company: "",
    driver: "",
    status: "available",
    fuel_type: "",
    fuel_efficiency: "",
    libre_number: "",
    motor_number: "",
    chassis_number: "",
  });
  const [assignDepartmentId, setAssignDepartmentId] = useState("");
  const [driverLocation, setDriverLocation] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [errorType, setErrorType] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [viewVehicleDetail, setViewVehicleDetail] = useState(null);
  const [viewDetailLoading, setViewDetailLoading] = useState(false);

  const token = localStorage.getItem("authToken");
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  // Filtering logic: status and search
  const filteredVehicles = vehicles
    .filter(
      (vehicle) => statusFilter === "all" || vehicle.status === statusFilter
    )
    .filter((vehicle) => {
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return (
        (vehicle.license_plate && vehicle.license_plate.toLowerCase().includes(query)) ||
        (vehicle.model && vehicle.model.toLowerCase().includes(query)) ||
        (vehicle.driver_name && vehicle.driver_name.toLowerCase().includes(query)) ||
        (vehicle.rental_company && vehicle.rental_company.toLowerCase().includes(query)) ||
        (vehicle.status && vehicle.status.toLowerCase().includes(query)) ||
        (vehicle.source && (vehicle.source === "organization" ? "owned" : vehicle.source).toLowerCase().includes(query))
      );
    });

  const currentPageVehicles = filteredVehicles.slice(startIndex, endIndex);

  const fetchUsers = async () => {
    try {
      if (!token) {
        setErrorType("unauthorized");
        return [];
      }
      const response = await fetch(ENDPOINTS.AVAILABLE_DRIVERS, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        if (response.status === 401) setErrorType("unauthorized");
        else setErrorType("server");
        return [];
      }
      const usersData = await response.json();
      return Array.isArray(usersData) ? usersData : usersData || [];
    } catch (error) {
      setErrorType("server");
      console.error("Error fetching users:", error);
      return [];
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userData = await fetchUsers();
        setDrivers(userData);
        await fetchVehicles();
        await fetchDepartments();
      } catch {}
      finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [token]);

  const getDriverNameById = (driverId) => {
    const driver = drivers.find((driver) => driver.id === driverId);
    return driver ? driver.full_name : "No Driver Assigned";
  };

  const fetchVehicles = async () => {
    try {
      if (!token) {
        setErrorType("unauthorized");
        setVehicles([]);
        return;
      }
      const response = await axios.get(ENDPOINTS.VEHICLE_LIST, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const vehiclesData = (response.data || []).map((vehicle) => ({
        ...vehicle,
        total_km: vehicle.total_kilometers,
      }));
      setVehicles(vehiclesData);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        setErrorType("unauthorized");
      } else {
        setErrorType("server");
      }
      setVehicles([]);
      console.error("Error fetching vehicles:", error);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await axios.get(ENDPOINTS.DEPARTMENT_LIST, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDepartments(response.data || response.data || []);
    } catch {
      setDepartments([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const {
      license_plate,
      model,
      capacity,
      source,
      rental_company,
      driver,
      status,
      fuel_type,
      fuel_efficiency,
      libre_number,
      motor_number,
      chassis_number,
    } = newVehicle;

    let errorFields = [];
    if (source === "owned") {
      if (!license_plate) errorFields.push("License Plate");
      if (!model) errorFields.push("Model");
      if (!capacity) errorFields.push("Capacity");
      if (!fuel_type) errorFields.push("Fuel Type");
      if (!motor_number) errorFields.push("Motor Number");
      if (!chassis_number) errorFields.push("Chassis Number");
      if (!libre_number) errorFields.push("Libre Number");
      if (!fuel_efficiency) errorFields.push("Fuel Efficiency");
      if (!assignDepartmentId) errorFields.push("Department");
    } else if (source === "rented") {
      if (!license_plate) errorFields.push("License Plate");
      if (!model) errorFields.push("Model");
      if (!capacity) errorFields.push("Capacity");
      if (!rental_company) errorFields.push("Rental Company");
      if (!driverLocation) errorFields.push("Driver Location");
      if (!driver) errorFields.push("Driver");
    }

    if (errorFields.length > 0) {
      setErrorMessage(`Please fill in the required fields: ${errorFields.join(", ")}`);
      toast.error(`Missing fields: ${errorFields.join(", ")}`);
      return;
    }

    const vehicleData = {
      license_plate,
      model,
      capacity: Number(capacity),
      source: source === "owned" ? "organization" : source,
      rental_company: source === "owned" ? null : rental_company,
      ...(driver && { driver }),
      status,
      fuel_type: source === "owned" ? fuel_type : undefined,
      fuel_efficiency: source === "owned" ? Number(fuel_efficiency) : undefined,
      libre_number: source === "owned" ? libre_number : undefined,
      motor_number: source === "owned" ? motor_number : undefined,
      chassis_number: source === "owned" ? chassis_number : undefined,
      department: source === "owned" ? assignDepartmentId : undefined,
      drivers_location: source === "rented" ? driverLocation : undefined,
    };

    try {
      if (editingVehicle) {
        await axios.put(
          ENDPOINTS.EDIT_VEHICLE(editingVehicle.id),
          vehicleData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success("Vehicle updated successfully!");
        await fetchVehicles();
      } else {
        const response = await axios.post(ENDPOINTS.VEHICLE_LIST, vehicleData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Vehicle added successfully!");
        setVehicles((prev) => [...prev, response.data]);
      }
      setShowModal(false);
      setEditingVehicle(null);
      setNewVehicle({
        license_plate: "",
        model: "",
        capacity: "",
        source: "owned",
        rental_company: "",
        driver: "",
        status: "available",
        fuel_type: "",
        fuel_efficiency: "",
        libre_number: "",
        motor_number: "",
        chassis_number: "",
      });
      setAssignDepartmentId("");
      setDriverLocation("");
    } catch (error) {
      setErrorMessage(
        "An error occurred while saving the vehicle. Please try again."
      );
      toast.error("Failed to save the vehicle.");
    }
  };

  const handleSourceChange = (e) => {
    const source = e.target.value;
    setNewVehicle({
      license_plate: "",
      model: "",
      capacity: "",
      source,
      rental_company: "",
      driver: "",
      status: "available",
      ...(source === "owned" && {
        fuel_type: "",
        fuel_efficiency: "",
        libre_number: "",
        motor_number: "",
        chassis_number: ""
      })
    });
    setDriverLocation("");
    setAssignDepartmentId("");
  };

  const handleEdit = (vehicle) => {
    let editSource = vehicle.source;
    if (!editSource || (editSource !== "owned" && editSource !== "organization" && editSource !== "rented")) {
      editSource = "owned";
    }
    setEditingVehicle(vehicle);
    setNewVehicle({
      license_plate: vehicle.license_plate,
      model: vehicle.model,
      capacity: vehicle.capacity,
      source: editSource === "organization" ? "owned" : editSource,
      rental_company: vehicle.rental_company || "",
      driver: vehicle.driver,
      status: vehicle.status || "available",
      ...(editSource === "owned" || editSource === "organization" ? {
        fuel_type: vehicle.fuel_type || "",
        fuel_efficiency: vehicle.fuel_efficiency || "",
        libre_number: vehicle.libre_number || "",
        motor_number: vehicle.motor_number || "",
        chassis_number: vehicle.chassis_number || "",
      } : {})
    });
    setAssignDepartmentId(vehicle.assign_vehicle || "");
    setDriverLocation(vehicle.drivers_location || "");
    setShowModal(true);
  };

  const handleDeactivate = async (vehicleId) => {
    console.log("Deactivating vehicle with ID:", vehicleId);
    // Deactivation logic
  };

  const openAddVehicleModal = () => {
    setEditingVehicle(null);
    setNewVehicle({
      license_plate: "",
      model: "",
      capacity: "",
      source: "owned",
      rental_company: "",
      driver: "",
      status: "available",
      fuel_type: "",
      fuel_efficiency: "",
      libre_number: "",
      motor_number: "",
      chassis_number: "",
    });
    setAssignDepartmentId("");
    setDriverLocation("");
    setShowModal(true);
  };

  const handleViewDetail = async (vehicleId) => {
    setViewDetailLoading(true);
    try {
      const response = await axios.get(ENDPOINTS.VEHICLE_DETAIL(vehicleId), {
        headers: { Authorization: `Bearer ${token}` },
      });
      setViewVehicleDetail(response.data);
    } catch (error) {
      toast.error("Failed to fetch vehicle details.");
      setViewVehicleDetail(null);
    } finally {
      setViewDetailLoading(false);
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (errorType === "unauthorized") return <UnauthorizedPage />;
  if (errorType === "server") return <ServerErrorPage />;

  return (
    <div className="container mt-4">
      <ToastContainer />
      <button
        className="btn addve"
        onClick={openAddVehicleModal}
        style={{ backgroundColor: "#0b455b", color: "#fff", width: "150px" }}
      >
        + Add Vehicle
      </button>
      <div className="table-responsive">
        {/* Filter and Search next to each other */}
        <div className="d-flex justify-content-end align-items-center mb-3 p-2" style={{ gap: "1rem" }}>
          <select
            className="form-select"
            style={{ width: 220, maxWidth: "100%", fontWeight: "500" }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="available">Available</option>
            <option value="in_use">In Use</option>
            <option value="service">Service</option>
            <option value="maintenance">Maintenance</option>
          </select>
          <input
            type="text"
            className="form-control"
            style={{ width: 290, maxWidth: "100%" }}
            placeholder="Search by License Plate, Model, Driver, etc."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        <table className="table table-hover align-middle">
          <thead>
            <tr>
              <th>#</th>
              <th>Driver</th>
              <th>License Plate</th>
              <th>Model</th>
              <th>Capacity</th>
              <th>Total KM</th>
              <th>Status</th>
              <th>Ownership</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentPageVehicles.map((vehicle, index) => (
              <tr key={vehicle.id}>
                <td>{startIndex + index + 1}</td>
                <td>{vehicle.driver_name}</td>
                <td>{vehicle.license_plate}</td>
                <td>{vehicle.model}</td>
                <td>{vehicle.capacity}</td>
                <td>
                  <span
                    style={{
                      color:
                        Number(vehicle.total_km) >= 5000
                          ? "red"
                          : Number(vehicle.total_km) >= 2500
                          ? "#b8860b"
                          : "green",
                      fontWeight: "bold",
                    }}
                  >
                    {vehicle.total_km || "0"}
                  </span>
                </td>
                <td>{vehicle.status}</td>
                <td>
                  {vehicle.source === "organization"
                   ? "Owned"
                    : vehicle.source === "rented"
                    ? "Rented"
                    : "-"}
                </td>
                <td>
                  <button
                    className="btn btn-sm me-2"
                    onClick={() => handleEdit(vehicle)}
                    style={{ backgroundColor: "#0b455b", color: "#fff" }}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-danger btn-sm me-2"
                    onClick={() => handleDeactivate(vehicle.id)}
                  >
                    Deactivate
                  </button>
                  <button
                    className="btn btn-info btn-sm"
                    onClick={() => handleViewDetail(vehicle.id)}
                    style={{ color: "#fff", backgroundColor: "#17a2b8" }}
                  >
                    View Detail
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div
          className="d-flex justify-content-center align-items-center"
          style={{ height: "100px" }}
        >
          <CustomPagination
            currentPage={currentPage}
            totalPages={Math.ceil(filteredVehicles.length / itemsPerPage)}
            handlePageChange={(page) => setCurrentPage(page)}
          />
        </div>
      </div>
      {showModal && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div
              className="modal-content"
              style={{
                borderRadius: "20px",
                boxShadow: "0 8px 32px rgba(44,62,80,0.18)",
                border: "none",
                overflow: "hidden",
                position: "relative",
              }}
            >
              <div className="modal-header">
                <h5 className="mb-0">
                  {editingVehicle ? "Edit Vehicle" : "Add New Vehicle"}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                  aria-label="Close"
                  style={{
                    position: "absolute",
                    right: "16px",
                    top: "16px",
                    zIndex: 2,
                    background: "transparent",
                    border: "none",
                    fontSize: "1.5rem",
                  }}
                >
                  <IoMdClose size={24} />
                </button>
              </div>
              <div className="modal-body">
                {errorMessage && (
                  <div className="alert alert-danger">{errorMessage}</div>
                )}
                <form onSubmit={handleSubmit}>
                  <div className="row mb-3">
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-semibold text-secondary">
                        Source
                      </label>
                      <select
                        className="form-control"
                        value={newVehicle.source}
                        onChange={handleSourceChange}
                      >
                        <option value="">Select Source</option>
                        <option value="owned">Owned</option>
                        <option value="rented">Rented</option>
                      </select>
                    </div>
                    
                    {/* Owned Vehicle Fields */}
                    {newVehicle.source === "owned" && (
                      <>
                        <div className="col-md-6 mb-3">
                          <label className="form-label fw-semibold text-secondary">
                            License Plate
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            value={newVehicle.license_plate}
                            onChange={(e) =>
                              setNewVehicle({
                                ...newVehicle,
                                license_plate: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="col-md-6 mb-3">
                          <label className="form-label fw-semibold text-secondary">
                            Model
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            value={newVehicle.model}
                            onChange={(e) =>
                              setNewVehicle({
                                ...newVehicle,
                                model: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="col-md-6 mb-3">
                          <label className="form-label fw-semibold text-secondary">
                            Capacity
                          </label>
                          <input
                            type="number"
                            className="form-control"
                            value={newVehicle.capacity}
                            onChange={(e) =>
                              setNewVehicle({
                                ...newVehicle,
                                capacity: e.target.value,
                              })
                            }
                            min="1"
                          />
                        </div>
                        <div className="col-md-6 mb-3">
                          <label className="form-label fw-semibold text-secondary">
                            Fuel Type
                          </label>
                          <select
                            className="form-control"
                            value={newVehicle.fuel_type || ""}
                            onChange={(e) =>
                              setNewVehicle({
                                ...newVehicle,
                                fuel_type: e.target.value,
                              })
                            }
                          >
                            <option value="">Select Fuel Type</option>
                            <option value="benzene">Benzene</option>
                            <option value="naphtha">Naphtha</option>
                          </select>
                        </div>
                        <div className="col-md-6 mb-3">
                          <label className="form-label fw-semibold text-secondary">
                            Motor Number
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            value={newVehicle.motor_number}
                            onChange={(e) =>
                              setNewVehicle({
                                ...newVehicle,
                                motor_number: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="col-md-6 mb-3">
                          <label className="form-label fw-semibold text-secondary">
                            Chassis Number
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            value={newVehicle.chassis_number}
                            onChange={(e) =>
                              setNewVehicle({
                                ...newVehicle,
                                chassis_number: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="col-md-6 mb-3">
                          <label className="form-label fw-semibold text-secondary">
                            Libre Number
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            value={newVehicle.libre_number}
                            onChange={(e) =>
                              setNewVehicle({
                                ...newVehicle,
                                libre_number: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="col-md-6 mb-3">
                          <label className="form-label fw-semibold text-secondary">
                            Fuel Efficiency (km/l)
                          </label>
                          <input
                            type="number"
                            className="form-control"
                            value={newVehicle.fuel_efficiency || ""}
                            onChange={(e) =>
                              setNewVehicle({
                                ...newVehicle,
                                fuel_efficiency: e.target.value,
                              })
                            }
                            min="0"
                            step="0.01"
                          />
                        </div>
                        <div className="col-md-6 mb-3">
                          <label className="form-label fw-semibold text-secondary">
                            Assign Department
                          </label>
                          <select
                            className="form-control"
                            value={assignDepartmentId}
                            onChange={(e) => setAssignDepartmentId(e.target.value)}
                            required
                          >
                            <option value="">Select Department</option>
                            {departments.map((dept) => (
                              <option key={dept.id} value={dept.id}>
                                {dept.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="col-md-6 mb-3">
                          <label className="form-label fw-semibold text-secondary">
                            Driver (Optional)
                          </label>
                          <select
                            className="form-control"
                            value={newVehicle.driver}
                            onChange={(e) =>
                              setNewVehicle({
                                ...newVehicle,
                                driver: e.target.value,
                              })
                            }
                          >
                            <option value="">Select Driver (Optional)</option>
                            {drivers.map((driver) => (
                              <option key={driver.id} value={driver.id}>
                                {driver.full_name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </>
                    )}
                    
                    {/* Rented Vehicle Fields */}
                    {newVehicle.source === "rented" && (
                      <>
                        <div className="col-md-6 mb-3">
                          <label className="form-label fw-semibold text-secondary">
                            License Plate
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            value={newVehicle.license_plate}
                            onChange={(e) =>
                              setNewVehicle({
                                ...newVehicle,
                                license_plate: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="col-md-6 mb-3">
                          <label className="form-label fw-semibold text-secondary">
                            Model
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            value={newVehicle.model}
                            onChange={(e) =>
                              setNewVehicle({
                                ...newVehicle,
                                model: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="col-md-6 mb-3">
                          <label className="form-label fw-semibold text-secondary">
                            Capacity
                          </label>
                          <input
                            type="number"
                            className="form-control"
                            value={newVehicle.capacity}
                            onChange={(e) =>
                              setNewVehicle({
                                ...newVehicle,
                                capacity: e.target.value,
                              })
                            }
                            min="1"
                          />
                        </div>
                        <div className="col-md-6 mb-3">
                          <label className="form-label fw-semibold text-secondary">
                            Rental Company
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            value={newVehicle.rental_company}
                            onChange={(e) =>
                              setNewVehicle({
                                ...newVehicle,
                                rental_company: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="col-md-6 mb-3">
                          <label className="form-label fw-semibold text-secondary">
                            Driver Location
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            value={driverLocation}
                            onChange={e => setDriverLocation(e.target.value)}
                            placeholder="Enter Driver Location"
                          />
                        </div>
                        <div className="col-md-6 mb-3">
                          <label className="form-label fw-semibold text-secondary">
                            Driver (Required)
                          </label>
                          <select
                            className="form-control"
                            value={newVehicle.driver}
                            onChange={(e) =>
                              setNewVehicle({
                                ...newVehicle,
                                driver: e.target.value,
                              })
                            }
                            required
                          >
                            <option value="">Select Driver</option>
                            {drivers.map((driver) => (
                              <option key={driver.id} value={driver.id}>
                                {driver.full_name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="d-flex gap-2 mt-4 justify-content-end">
                    <button
                      type="submit"
                      style={{
                        backgroundColor: "#0B455B",
                        color: "#fff",
                        width: "150px",
                        fontWeight: "bold",
                        letterSpacing: "1px",
                        boxShadow: "0 2px 8px rgba(24,30,75,0.08)",
                      }}
                      className="btn shadow-sm"
                    >
                      {editingVehicle ? "Update" : "Save"}
                    </button>
                    <button
                      type="button"
                      className="btn"
                      style={{
                        backgroundColor: "#dc3545",
                        color: "#fff",
                        width: "120px",
                        fontWeight: "bold",
                        boxShadow: "0 2px 8px rgba(220,53,69,0.08)",
                      }}
                      onClick={() => {
                        setNewVehicle({
                          license_plate: "",
                          model: "",
                          capacity: "",
                          source: "owned",
                          rental_company: "",
                          driver: "",
                          status: "available",
                          fuel_type: "",
                          fuel_efficiency: "",
                          libre_number: "",
                          motor_number: "",
                          chassis_number: "",
                        });
                        setAssignDepartmentId("");
                        setDriverLocation("");
                      }}
                    >
                      Clear
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
      {viewVehicleDetail && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div
              className="modal-content"
              style={{
                borderRadius: "20px",
                boxShadow: "0 8px 32px rgba(44,62,80,0.18)",
                border: "none",
                overflow: "hidden",
                position: "relative",
              }}
            >
              <div className="modal-header">
                <h5 className="mb-0">Vehicle Details</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setViewVehicleDetail(null)}
                  aria-label="Close"
                  style={{
                    position: "absolute",
                    right: "16px",
                    top: "16px",
                    zIndex: 2,
                    background: "transparent",
                    border: "none",
                    fontSize: "1.5rem",
                  }}
                >
                  <IoMdClose size={24} />
                </button>
              </div>
              <div className="modal-body" style={{ background: "#f4f7fa", padding: "2rem 2.5rem" }}>
                <div className="row mb-2">
                  <div className="col-md-6 mb-2"><strong>Driver:</strong> {getDriverNameById(viewVehicleDetail.driver)}</div>
                  <div className="col-md-6 mb-2"><strong>License Plate:</strong> {viewVehicleDetail.license_plate}</div>
                  <div className="col-md-6 mb-2"><strong>Model:</strong> {viewVehicleDetail.model}</div>
                  <div className="col-md-6 mb-2"><strong>Capacity:</strong> {viewVehicleDetail.capacity}</div>
                  <div className="col-md-6 mb-2"><strong>Ownership:</strong> {viewVehicleDetail.source === "organization" ? "Owned" : viewVehicleDetail.source === "rented" ? "Rented" : "-"}</div>
                  <div className="col-md-6 mb-2"><strong>Status:</strong> {viewVehicleDetail.status}</div>
                  {viewVehicleDetail.source === "rented" && (
                    <div className="col-md-6 mb-2"><strong>Rental Company:</strong> {viewVehicleDetail.rental_company || "-"}</div>
                  )}
                  <div className="col-md-6 mb-2"><strong>Fuel Type:</strong> {viewVehicleDetail.fuel_type}</div>
                  <div className="col-md-6 mb-2"><strong>Fuel Efficiency:</strong> {viewVehicleDetail.fuel_efficiency}</div>
                  <div className="col-md-6 mb-2"><strong>Total KM:</strong> {viewVehicleDetail.total_km}</div>
                  <div className="col-md-6 mb-2"><strong>Libre Number:</strong> {viewVehicleDetail.libre_number}</div>
                  <div className="col-md-6 mb-2"><strong>Motor Number:</strong> {viewVehicleDetail.motor_number}</div>
                  <div className="col-md-6 mb-2"><strong>Chassis Number:</strong> {viewVehicleDetail.chassis_number}</div>
                  <div className="col-md-6 mb-2"><strong>Department:</strong> {
                    viewVehicleDetail.department_name
                      ? viewVehicleDetail.department_name
                      : (departments.find(d => d.id === viewVehicleDetail.department)?.name || (viewVehicleDetail.department === 5 ? "Transport Department" : "N/A"))
                  }</div>
                  {viewVehicleDetail.drivers_location && (
                    <div className="col-md-6 mb-2"><strong>Driver Location:</strong> {viewVehicleDetail.drivers_location}</div>
                  )}
                </div>
                <div className="d-flex justify-content-end">
                  <button
                    className="btn btn-secondary"
                    onClick={() => setViewVehicleDetail(null)}
                    style={{ minWidth: "110px" }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleManagement;