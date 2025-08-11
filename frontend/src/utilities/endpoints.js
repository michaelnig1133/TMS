const BASE_URL =  "https://tms.gdop.gov.et/api/"; // Replace with your actual base URL

export const ENDPOINTS = {
  // Department endpoints
  DEPARTMENT_LIST: `${BASE_URL}departments/`,
  DEPARTMENT_LIST_FORMAT: `${BASE_URL}departments.{format}/`,
  DEPARTMENT_DETAIL: (pk) => `${BASE_URL}departments/${pk}/`,
  DEPARTMENT_DETAIL_FORMAT: (pk, format) =>
    `${BASE_URL}departments/${pk}.${format}/`,

  // Status History endpoints
  STATUS_HISTORY_LIST: `${BASE_URL}status-history/`,
  STATUS_HISTORY_LIST_FORMAT: `${BASE_URL}status-history.{format}/`,
  STATUS_HISTORY_DETAIL: (pk) => `${BASE_URL}status-history/${pk}/`,
  STATUS_HISTORY_DETAIL_FORMAT: (pk, format) =>
    `${BASE_URL}status-history/${pk}.${format}/`,

  // Authentication endpoints
  API_ROOT: `${BASE_URL}`,
  API_ROOT_FORMAT: `${BASE_URL}<drf_format_suffix:format>/`,
  LOGIN: `${BASE_URL}api/token/`,
  TOKEN_REFRESH: `${BASE_URL}api/token/refresh/`,
  LOGOUT: `${BASE_URL}api/logout/`,
  REGISTER: `${BASE_URL}register/`,

  // User management endpoints
  APPROVE_USER: (user_id) => `${BASE_URL}approve/${user_id}/`,
  USERS: `${BASE_URL}users/`,
  USER_LIST: `${BASE_URL}users-list/`,
  CURRENT_USER: `${BASE_URL}api/users/me/`,
  USER_DETAIL: (user_id) => `${BASE_URL}api/users/${user_id}/`,
  RESUBMIT_USER: (user_id) => `${BASE_URL}resubmit/${user_id}/`,
  ACTIVATE_USER: (user_id) => `${BASE_URL}activate/${user_id}/`,
  DEACTIVATE_USER: (user_id) => `${BASE_URL}deactivate/${user_id}/`,
  UPDATE_ROLE: (user_id) => `${BASE_URL}update-role/${user_id}/`,
  APPROVED_USERS: `${BASE_URL}approved-users/`,

  REQUEST_LIST: `${BASE_URL}transport-requests/list/`,

  AVAILABLE_DRIVERS: `${BASE_URL}available-drivers/`,
  AVAILABLE_VEHICLES: `${BASE_URL}available-vehicles/`,

  
 RENTED_AVAILABLE_VEHICLES: `${BASE_URL}rented-available-vehicles/`, // GET available rented vehicles
  ORGANIZATION_AVAILABLE_VEHICLES: `${BASE_URL}organization-available-vehicles/`, // GET available organization vehicles

  CREATE_REQUEST: `${BASE_URL}transport-requests/create/`,
  TM_APPROVE_REJECT: (request_id) =>
    `${BASE_URL}transport-requests/${request_id}/action/`,
  REQUEST_NOTIFICATIONS: `${BASE_URL}transport-requests/notifications/`,
  UNREADOUNT: `${BASE_URL}transport-requests/notifications/unread-count/`,
  MARKALL_READ: `${BASE_URL}transport-requests/notifications/mark-all-read/`,

  VEHICLE_LIST: `${BASE_URL}vehicles/`,
  VEHICLE_LIST_FORMAT: `${BASE_URL}vehicles.{format}/`,
  VEHICLE_DETAIL: (pk) => `${BASE_URL}vehicles/${pk}/`,
  EDIT_VEHICLE: (pk) => `${BASE_URL}vehicles/${pk}/`,
  VEHICLE_DETAIL_FORMAT: (pk, format) => `${BASE_URL}vehicles/${pk}.${format}/`,
  CURRENT_USER_VEHICLES: `${BASE_URL}my-vehicle/`,
  ADD_MONTHLY_KILOMETERS: (vehicle_id) =>
    `${BASE_URL}vehicles/${vehicle_id}/add-monthly-kilometers/`,
  KILOMETER_LOGS: `${BASE_URL}vehicles/kilometer-logs/`,
  // Action logs endpoints
  ACTION_LOGS_LIST: `${BASE_URL}action-logs/`, // GET all action logs
  ACTION_LOGS_DETAIL: (pk) => `${BASE_URL}action-logs/${pk}/`, // GET action log by id

  //refuling endpoints
  CREATE_HIGH_COST_REQEST: `${BASE_URL}highcost-requests/create/`,
  HIGH_COST_LIST: `${BASE_URL}highcost-requests/list/`,
  CREATE_REFUELING_REQUEST: `${BASE_URL}refueling_requests/create/`,
  REFUELING_REQUEST_LIST: `${BASE_URL}refueling_requests/list/`,
  REFUELING_REQUEST_DETAIL: (pk) => `${BASE_URL}refueling_requests/${pk}/`,
  REFUELING_REQUEST_ESTIMATE: (request_id) =>
    `${BASE_URL}refueling_requests/${request_id}/estimate/`,
  APPREJ_REFUELING_REQUEST: (request_id) =>
    `${BASE_URL}refueling_requests/${request_id}/action/`,
  APPREJ_HIGHCOST_REQUEST: (request_id) =>
    `${BASE_URL}highcost-requests/${request_id}/action/`,
  ESTIMATE_HIGH_COST: (request_id) =>
    `${BASE_URL}highcost-requests/${request_id}/estimate/`,
  ASSIGN_VEHICLE: (request_id) =>
    `${BASE_URL}highcost-requests/${request_id}/assign-vehicle/`,
  HIGH_COST_DETAIL: (request_id) =>
    `${BASE_URL}highcost-requests/${request_id}/`,
  COMPLETE_TRIP: (request_id) =>
    `${BASE_URL}highcost-requests/${request_id}/complete-trip/`,
  COMPLETE_TRANSPORT_TRIP: (request_id) =>
    ` ${BASE_URL}transport-requests/${request_id}/complete-trip/`,
  MY_REFUELING_REQUESTS: `${BASE_URL}refueling_requests/my/`, // List current user's refueling requests

  //maintennace endpoints
  CREATE_MAINTENANCE_REQUEST: `${BASE_URL}maintenance-requests/create/`, // Create a new maintenance request
  LIST_MAINTENANCE_REQUESTS: `${BASE_URL}maintenance-requests/list/`, // List all maintenance requests
  MAINTENANCE_REQUEST_ACTION: (request_id) =>
    `${BASE_URL}maintenance-requests/${request_id}/action/`, // Approve/Reject a maintenance request
  SUBMIT_MAINTENANCE_FILES: (request_id) =>
    `${BASE_URL}maintenance-requests/${request_id}/submit-files/`, // Submit files for a maintenance request
  MY_MAINTENANCE_REQUESTS: `${BASE_URL}maintenance-requests/my/`,
  // List current user's maintenance requests

  
  MAINTAINED_VEHICLES: `${BASE_URL}vehicles/under-maintenance/list/`, // GET method, empty json

  // Add this endpoint for maintained vehicles under maintenance-requests
  MAINTENANCE_REQUESTS_MAINTAINED_VEHICLES: `${BASE_URL}maintenance-requests/maintained-vehicles/ `, // GET method, empty json

  MARK_AS_MAINTENANCE: (vehicle_id) => `${BASE_URL}vehicles/${vehicle_id}/mark-as-maintenance/`,
  MARK_MAINTENANCE_VEHICLE_AVAILABLE: (vehicle_id) => `${BASE_URL}maintenance-requests/${vehicle_id}/mark-available/`, 
  // Report endpoints (corrected and explicit)
  REPORT_LIST: `${BASE_URL}report/`, // GET method, returns JSON, no params
  REPORT_TRANSPORT: `${BASE_URL}report/?request_type=Transport`,
  REPORT_MAINTENANCE: `${BASE_URL}report/?request_type=Maintenance`,
  REPORT_REFUELING: `${BASE_URL}report/?request_type=Refueling`,
  REPORT_HIGHCOST: `${BASE_URL}report/?request_type=HighCost`,
  REPORT_BY_MONTH: (year, month) => `${BASE_URL}report/?month=${year}-${month}`,
   // service endpoints
 VEHICLES_LIST: `${BASE_URL}service-requests/vehicles_list/`, // GET: vehicles with 5000km (for transport manager)
  MARK_VEHICLE_SERVICE: (vehicle_id) =>
    `${BASE_URL}service-requests/${vehicle_id}/mark-service/`, // POST: mark vehicle as under service (empty JSON)
  LIST_SERVICE_REQUESTS: `${BASE_URL}service-requests/list/`, // GET: all roles, service request workflow
  SUBMIT_SERVICE_FILES: (request_id) =>
    `${BASE_URL}service-requests/${request_id}/submit-files/`, // PATCH: submit files (FormData)
  SERVICE_REQUEST_ACTION: (request_id) =>
    `${BASE_URL}service-requests/${request_id}/action/`, // POST: { action: "forward" | "approve" }
  SERVICE_REQUEST_DETAIL: (pk) => `${BASE_URL}service-requests/${pk}/`,
  SERVICED_VEHICLES: `${BASE_URL}service-requests/serviced-vehicles/`, // GET: under service vehicles
  MARK_VEHICLE_AVAILABLE: (id) => `${BASE_URL}service-requests/${id}/mark-available/`, 
  

  ADD_MONTHLY_KILOMETERS: `${BASE_URL}vehicles/add-monthly-kilometers/`,
  
  // Dashboard endpoints
  DASHBOARD_RECENT_VEHICLES: `${BASE_URL}dashboard/recent-vehicles/`,
  DASHBOARD_OVERVIEW: `${BASE_URL}dashboard/overview/`,
  DASHBOARD_MONTHLY_TRENDS: `${BASE_URL}dashboard/monthly-trends/`,
  DASHBOARD_TYPE_DISTRIBUTION: `${BASE_URL}dashboard/type-distribution/`,
  SERVICED_VEHICLES: `${BASE_URL}service-requests/serviced-vehicles/`,
  OTP_REQUEST: `${BASE_URL}otp/request/`,
  CREATE_COUPON_REQUEST: `${BASE_URL}coupon-requests/create/`,
  COUPON_REQUEST_LIST: `${BASE_URL}coupon-requests/list/`,
};