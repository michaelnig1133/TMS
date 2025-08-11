import { useState, useEffect, useRef } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import "./index.css";
import Home from "./components/Home";
import Services from "./components/Services";
import WhyTMS from "./components/WhyTMS";
import EmailForm from "./components/EmailForm";
import Footer from "./components/Footer";
import NavBar from "./components/NavBar";
import { LanguageProvider } from "./context/LanguageContext";
import { ThemeProvider } from "./context/ThemeContext";
import LoginModal from "./components/LoginModal";
import SignupModal from "./components/SignupModal";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import AdminPage from "./components/AdminPage";
import AdminDepartmentPage from "./components/AdminDepartmentPage";
import AccountPage from "./components/AccountPage";
import HistoryPage from "./components/HistoryPage";
import VehicleManagement from "./components/VehicleManagement";
import EmployeePage from "./components/EmployeePage";
import PleaseLoginPage from "./PleaseLoginPage";
import MaintenanceRequest from "./components/MaintenanceRequest";
import MaintenanceTable from "./components/MaintenanceTable";
import VehicleRequest from "./components/VehicleRequest";
import DriverSchedule from "./components/DriverSchedule";
import RefuelingRequest from "./components/RefuelingRequest";
import FMRefuelingTable from "./components/FMRefuelingTable";
import RefuelingTable from "./components/RefuelingTable";
import ReportPage from "./components/ReportPage";
import TransportRequest from "./components/TransportRequest";
import RequestHistory from "./components/RequestHistory";
import { ENDPOINTS } from "./utilities/endpoints";
import { NotificationProvider } from "./context/NotificationContext";
import CEOMaintenanceTable from "./components/CEOMaintenanceTable";
import FinanceMaintenanceTable from "./components/FinanceMaintenanceTable";
import TMRefuelingTable from "./components/TMRefuelingTable";
import HightCost from "./components/HightCost";
import BUHighCost from "./components/BUHighCost";
import TMhighcostrequests from "./components/TMhighcostrequests";
import FIHighCost from "./components/FIHighCost";
import HighCostDriverSchedule from "./components/HighCostDriverSchedule";
import VehicleServices from "./components/VehicleServices";
import GSmaintenance from "./components/GSmaintenance";
import BUmaintenance from "./components/BUmaintenance";
import CEOhighcost from "./components/CEOhighcost";
import { AuthProvider } from "./context/AuthContext";
import PrivateRoute from "./components/PrivateRoute";
import VehicleServiceTable from "./components/VehicleServiceTable";
import BMService from "./components/BMService";
import CEOService from "./components/CEOService";
import FMService from "./components/FMService";
import GSservice from "./components/GSservice";
import TransportManagerDashboard from "./components/TransportManagerDashboard";
import MonthlyCoupon from "./components/MonthlyCoupon";
import MonthlyCouponTM from "./components/MonthlyCouponTM";
import NotFoundPage from "./components/NotFoundPage";
import UnauthorizedPage from "./components/UnauthorizedPage";
import ServerErrorPage from "./components/ServerErrorPage";
import { Import } from "lucide-react";
import UnderMaintanaceVechile from "./components/UnderMaintanaceVechile";
import CEODashboard from "./components/CEODashboard";
import BMRefulingTable from "./components/BMRefulingTable";
import AvailableVehiclesTable from "./components/AvailableVehiclesTable";
import GSDashboard  from "./components/GSDashboard";
import ActorAccessPage from "./components/ActorAccessPage";
const App = () => {
  const [modalType, setModalType] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authToken, setAuthToken] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const navigate = useNavigate();

  const homeRef = useRef(null);
  const servicesRef = useRef(null);
  const whyTMSRef = useRef(null);
  const emailFormRef = useRef(null);
  const footerRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) {
      setIsAuthenticated(true);
      setAuthToken(token);
      checkUserRole(token);
    }
  }, []);

  const checkUserRole = async (token) => {
    try {
      const response = await fetch(ENDPOINTS.CURRENT_USER, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const userData = await response.json();
        setUserRole(userData.role);
      }
    } catch (error) {
      console.error("Error checking user role:", error);
    }
  };

  const closeModal = () => setModalType(null);

  const handleLogin = async (email, password) => {
    try {
      const response = await fetch(ENDPOINTS.LOGIN, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("authToken", data.access);
        setIsAuthenticated(true);
        setAuthToken(data.access);
        setModalType(null);

        const userResponse = await fetch(ENDPOINTS.CURRENT_USER, {
          method: "GET",
          headers: { Authorization: `Bearer ${data.access}` },
        });

        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUserRole(userData.role);

          // Redirect based on role
          switch (userData.role) {
            case "admin":
              navigate("/admin/admin");
              break;
            case "employee":
              navigate("/employee");
              break;
            case "department_manager":
              navigate("/department-manager/vehicle-request");
              break;
            case "finance_manager":
              navigate("/finance-manager");
              break;
            case "transport_manager":
              navigate("/transport-manager/dashbord");
              break;
            case "ceo":
              navigate("/ceo/dashbord");
              break;
            case "driver":
              navigate("/driver/driver-schedule");
              break;
            default:
              navigate("/"); // Fallback
              break;
          }
        }
      } else {
        alert("Invalid credentials. Please try again.");
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("An error occurred. Please try again later.");
    }
  };

  return (
    <AuthProvider>
      <NotificationProvider>
        <ThemeProvider>
          <LanguageProvider>
            <div className={`app ${modalType ? "blurred" : ""}`}>
              <Routes>
                <Route
                  path="/employee"
                  element={
                    <PrivateRoute allowedRoles={[1]}>
                      <EmployeePage />
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/"
                  element={
                    <>
                      <NavBar
                        homeRef={homeRef}
                        servicesRef={servicesRef}
                        whyTMSRef={whyTMSRef}
                        emailFormRef={emailFormRef}
                        footerRef={footerRef}
                        onOpenModal={setModalType}
                      />
                      <div ref={homeRef}>
                        <Home />
                      </div>
                      <div ref={servicesRef}>
                        <Services />
                      </div>
                      <div ref={whyTMSRef}>
                        <WhyTMS />
                      </div>
                      <div ref={emailFormRef}>
                        <EmailForm />
                      </div>
                      <Footer
                        homeRef={homeRef}
                        servicesRef={servicesRef}
                        aboutRef={whyTMSRef}
                        contactRef={emailFormRef}
                      />
                    </>
                  }
                />

                {/* Protected Routes */}
                <Route
                  path="/employee/*"
                  element={
                    <PrivateRoute allowedRoles={[1]} redirectTo="/-login">
                      <div className="d-flex">
                        <Header role="employee" />
                        <div className="container">
                          <EmployeePage />
                        </div>
                      </div>
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/department-manager/*"
                  element={
                    <PrivateRoute allowedRoles={[2]} redirectTo="/-login">
                      <div className="d-flex">
                        <Header role="department_manager" />
                        <Sidebar role="department_manager" />
                        <div className="container">
                          <Routes>
                            <Route
                              path="vehicle-request"
                              element={<VehicleRequest />}
                            />
                            <Route
                              path="refueling-request"
                              element={<RefuelingRequest />}
                            />
                            <Route
                              path="history"
                              element={<RequestHistory />}
                            />
                            <Route
                              path="maintenance-request"
                              element={<MaintenanceRequest />}
                            />
                            <Route path="hight-cost-request" element={<HightCost />} />
                            <Route
                              path="monthly-coupon"
                              element={<MonthlyCoupon />}
                            />
                            <Route
                              path="vehicle-services"
                              element={<VehicleServices />}
                            />
                            <Route
                              path="refueling-request"
                              element={<RefuelingRequest />}
                            />
                            <Route
                              path="history"
                              element={<RequestHistory />}
                            />
                            <Route
                              path="maintenance-request"
                              element={<MaintenanceRequest />}
                            />
                            <Route path="hight-cost"
                             element={<HightCost />} />
                            
                            <Route
                              path="vehicle-services"
                              element={<VehicleServices />}
                            />
                              <Route
                                  path="available-vehicles"
                                   element={<AvailableVehiclesTable />}
                                    />   
                          </Routes>
                        </div>
                      </div>
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/finance-manager/*"
                  element={
                    <PrivateRoute allowedRoles={[3]} redirectTo="/-login">
                      <div className="d-flex">
                        <Header role="finance_manager" />
                        <Sidebar role="finance_manager" />
                        <div className="container">
                          <Routes>
                            <Route
                              path="financemaintenance-table"
                              element={<FinanceMaintenanceTable />}
                            />
                            <Route
                              path="refueling"
                              element={<FMRefuelingTable />}
                            />
                            <Route path="hight-cost" element={<FIHighCost />} />
                            <Route
                              path="maintenance-request"
                              element={<MaintenanceRequest />}
                            />
                            <Route path="service" element={<FMService />} />
                            <Route
                              path="monthly-coupon"
                              element={<MonthlyCoupon />}
                            />
                            <Route
                              path="vehicle-services"
                              element={<VehicleServices />}
                            />
                            <Route
                              path="refueling-request"
                              element={<RefuelingRequest />}
                            />
                            <Route
                              path="history"
                              element={<RequestHistory />}
                            />
                            <Route
                              path="maintenance-request"
                              element={<MaintenanceRequest />}
                            />
                            <Route path="hight-cost" element={<HightCost />} />
                            <Route
                              path="monthly-coupon"
                              element={<MonthlyCoupon />}
                            />
                            <Route
                              path="vehicle-services"
                              element={<VehicleServices />}
                            />
                              <Route path="hight-cost-request" element={<HightCost />} />
                            <Route
                                  path="available-vehicles"
                                   element={<AvailableVehiclesTable />}
                                    />   
                          </Routes>
                        </div>
                      </div>
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/ceo/*"
                  element={
                    <PrivateRoute allowedRoles={[5]} redirectTo="/-login">
                      <div className="d-flex">
                        <Header role="ceo" />
                        <Sidebar role="ceo" />
                        <div className="container">
                          <Routes>
                            <Route path="high_cost" element={<CEOhighcost />} />
                            <Route
                              path="ceomaintenance-table"
                              element={<CEOMaintenanceTable />}
                            />
                            <Route
                              path="refueling"
                              element={<RefuelingTable />}
                            />
                            <Route
                              path="maintenance-request"
                              element={<MaintenanceRequest />}
                            />
                            <Route
                              path="history"
                              element={<RequestHistory />}
                            />
                            <Route path="service" element={<CEOService />} />
                            <Route
                              path="monthly-coupon"
                              element={<MonthlyCoupon />}
                            />
                            <Route
                              path="vehicle-services"
                              element={<VehicleServices />}
                            />
                            <Route
                              path="refueling-request"
                              element={<RefuelingRequest />}
                            />
                            <Route
                              path="history"
                              element={<RequestHistory />}
                            />
                            <Route
                              path="maintenance-request"
                              element={<MaintenanceRequest />}
                            />
                            <Route path="hight-cost-request" element={<HightCost />} />
                            <Route
                              path="monthly-coupon"
                              element={<MonthlyCoupon />}
                            />
                            <Route
                              path="vehicle-services"
                              element={<VehicleServices />}
                            />
                              <Route
                              path="dashbord"
                              element={<CEODashboard />}
                            />  
                              <Route
                                  path="available-vehicles"
                                   element={<AvailableVehiclesTable />}
                                    />             
                          </Routes>
                        </div>
                      </div>
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/driver/*"
                  element={
                    <PrivateRoute allowedRoles={[6]} redirectTo="/-login">
                      <div className="d-flex">
                        <Header role="driver" />
                        <Sidebar role="driver" />
                        <div className="container">
                          <Routes>
                            <Route
                              path="vehicle-services"
                              element={<VehicleServices />}
                            />
                            <Route
                              path="driver-schedule"
                              element={<DriverSchedule />}
                            />
                            <Route
                              path="refueling-request"
                              element={<RefuelingRequest />}
                            />
                            <Route
                              path="maintenance-request"
                              element={<MaintenanceRequest />}
                            />
                            <Route
                              path="high-cost-schedule"
                              element={<HighCostDriverSchedule />}
                            />
                            <Route
                              path="monthly-coupon"
                              element={<MonthlyCoupon />}
                            />
                          </Routes>
                        </div>
                      </div>
                    </PrivateRoute>
                  }
                />

                {/* Admin Pages */}
                <Route
                  path="/admin/*"
                  element={
                    <PrivateRoute allowedRoles={[7]} redirectTo="/-login">
                      <div className="d-flex">
                        <Header role="admin" />
                        <Sidebar role="admin" />
                        <div className="container">
                          <Routes>
                            <Route path="admin" element={<AdminPage />} />
                            <Route
                              path="admin-department"
                              element={<AdminDepartmentPage />}
                            />
                            <Route
                              path="account-page"
                              element={<AccountPage />}
                            />
                            <Route path="history" element={<HistoryPage />} />
                             <Route path="actor-access"element={<ActorAccessPage/>}/>
                          </Routes>
                        </div>
                      </div>
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/transport-manager/*"
                  element={
                    <PrivateRoute allowedRoles={[4]} redirectTo="/-login">
                      <div className="d-flex">
                        <Header role="transport_manager" />
                        <Sidebar role="transport_manager" />
                        <div className="container">
                          <Routes>
                            <Route
                              path="vehicle-management"
                              element={<VehicleManagement />}
                            />
                            <Route
                              path="maintenance-table"
                              element={<MaintenanceTable />}
                            />
                            <Route
                              path="vehicle-request"
                              element={<TransportRequest />}
                            />
                            <Route
                              path="dashbord"
                              element={<TransportManagerDashboard />}
                            />
                            <Route
                              path="refueling"
                              element={<TMRefuelingTable />}
                            />
                            <Route path="report" element={<ReportPage />} />
                            <Route
                              path="high_cost"
                              element={<TMhighcostrequests />}
                            />
                            <Route
                              path="history"
                              element={<RequestHistory />}
                            />
                            <Route
                              path="maintenance-request"
                              element={<MaintenanceRequest />}
                            />
                            <Route
                              path="service"
                              element={<VehicleServiceTable />}
                            />
                            <Route
                              path="monthly-coupon"
                              element={<MonthlyCoupon />}
                            />
                            <Route
                              path="monthly-coupons"
                              element={<MonthlyCouponTM />}
                            />
                             <Route
                              path="vehicle-services"
                              element={<VehicleServices />}
                            />
                            <Route
                              path="refueling-request"
                              element={<RefuelingRequest />}
                            />
                            <Route
                              path="history"
                              element={<RequestHistory />}
                            />
                            <Route
                              path="maintenance-request"
                              element={<MaintenanceRequest />}
                            />
                            <Route path="hight-cost-request" element={<HightCost />} />
                            <Route
                              path="monthly-coupon"
                              element={<MonthlyCoupon />}
                            />
                            <Route
                              path="vehicle-services"
                              element={<VehicleServices />}
                            />
                            <Route
                              path="under-maintanace-vechile"
                              element={<UnderMaintanaceVechile />}
                            />
                              <Route
                                  path="available-vehicles"
                                   element={<AvailableVehiclesTable />}
                                    />   
                          </Routes>
                        </div>
                      </div>
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/budget-manager/*"
                  element={
                    <PrivateRoute allowedRoles={[9]} redirectTo="/-login">
                      <div className="d-flex">
                        <Header role="budget_manager" />
                        <Sidebar role="budget_manager" />
                        <div className="container">
                          <Routes>
                            <Route path="high_cost" element={<BUHighCost />} />
                            <Route
                              path="refueling"
                              element={<BMRefulingTable/>}
                            />
                            <Route path="report" element={<ReportPage />} />
                            <Route
                              path="maintenance"
                              element={<BUmaintenance />}
                            />
                            <Route
                              path="maintenance-request"
                              element={<MaintenanceRequest />}
                            />
                            <Route
                              path="history"
                              element={<RequestHistory />}
                            />
                            <Route path="service" element={<BMService />} />
                            <Route
                              path="monthly-coupon"
                              element={<MonthlyCoupon />}
                            />
                            <Route
                              path="vehicle-services"
                              element={<VehicleServices />}
                            />
                            <Route
                              path="refueling-request"
                              element={<RefuelingRequest />}
                            />
                            <Route
                              path="history"
                              element={<RequestHistory />}
                            />
                            <Route
                              path="maintenance-request"
                              element={<MaintenanceRequest />}
                            />
                            <Route path="hight-cost" element={<TMhighcostrequests />} />
                             <Route
                              path="monthly-coupon"
                              element={<MonthlyCoupon />}
                            />
                            <Route
                              path="vehicle-services"
                              element={<VehicleServices />}
                            />
                            <Route path="hight-cost-request" element={<HightCost />} />
                              <Route
                                  path="available-vehicles"
                                   element={<AvailableVehiclesTable />}
                                    />   
                          </Routes>
                        </div>
                      </div>
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/general-service/*"
                  element={
                    <PrivateRoute allowedRoles={[8]} redirectTo="/-login">
                      <div className="d-flex">
                        <Header role="general-service" />
                        <Sidebar role="general-service" />
                        <div className="container">
                          <Routes>
                          <Route
                              path="dashbord"
                              element={<GSDashboard/>}
                            />
                            <Route path="high_cost" element={<CEOhighcost />} />

                            <Route
                              path="refueling"
                              element={<RefuelingTable />}
                            />
                            <Route path="report" element={<ReportPage />} />
                            <Route
                              path="maintenance"
                              element={<GSmaintenance />}
                            />
                            <Route
                              path="history"
                              element={<RequestHistory />}
                            />
                            <Route path="service" element={<GSservice />} />
                            <Route
                              path="monthly-coupon"
                              element={<MonthlyCoupon />}
                            />
                            <Route
                              path="vehicle-services"
                              element={<VehicleServices />}
                            />
                            <Route path="hight-cost-request" element={<HightCost />} />
                             <Route
                              path="maintenance-request"
                              element={<MaintenanceRequest />}
                            />
                              <Route
                                  path="available-vehicles"
                                   element={<AvailableVehiclesTable />}
                                    />  
                                    <Route
                              path="refueling-request"
                              element={<RefuelingRequest />}
                            /> 
                          </Routes>
                        </div>
                      </div>
                    </PrivateRoute>
                  }
                />

                <Route path="/-login" element={<PleaseLoginPage />} />
                <Route path="/401" element={<UnauthorizedPage />} />
                <Route path="/500" element={<ServerErrorPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>

              {/* Modals */}
              {modalType === "login" && (
                <div className="modal-overlay">
                  <div className="modal">
                    <button className="close-button" onClick={closeModal}>
                      X
                    </button>
                    <LoginModal onLogin={handleLogin} />
                  </div>
                </div>
              )}
              {modalType === "signup" && (
                <div className="modal-overlay">
                  <div className="modal">
                    <button className="close-button" onClick={closeModal}>
                      X
                    </button>
                    <SignupModal />
                  </div>
                </div>
              )}
            </div>
          </LanguageProvider>
        </ThemeProvider>
      </NotificationProvider>
    </AuthProvider>
  );
};

export default App;
