import { useState, useEffect } from "react";
import {
  Fuel,
  Wrench,
  Wallet,
  Blocks,
  Car,
  Bus,
  ShieldQuestion,
} from "lucide-react";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";

import { useSpring, animated } from "@react-spring/web";
import axios from "axios";
import { ENDPOINTS } from "../utilities/endpoints";
import UnauthorizedPage from "./UnauthorizedPage";
import ServerErrorPage from "./ServerErrorPage";
import { useLanguage } from "../context/LanguageContext"; // Assuming you have this context

const ProgressBar = ({ value, color = "#007bff" }) => {
  const props = useSpring({
    width: `${value}%`,
    from: { width: "0%" },
    config: { tension: 200, friction: 20 },
  });

  return (
    <div
      style={{
        background: "#e9ecef",
        borderRadius: 6,
        overflow: "hidden",
        height: 18,
      }}
    >
      <animated.div
        style={{
          ...props,
          background: color,
          height: 18,
          color: "#fff",
          fontWeight: "bold",
          textAlign: "center",
        }}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        {value}%
      </animated.div>
    </div>
  );
};

const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize="12px"
      fontWeight="bold"
    >
      {(percent * 100).toFixed(0)}%
    </text>
  );
};

const Dashboard = () => {
  const { mylanguage } = useLanguage();
  const t = (en, am) => (mylanguage === "EN" ? en : am); // Localization helper

  const REQUEST_TYPES = [
    {
      key: "refueling",
      label: t("Refueling Requests", "የነዳጅ ጥያቄዎች"),
      color: "#072a36",
      icon: <Fuel size={30} />,
    },
    {
      key: "maintenance",
      label: t("Maintenance Requests", "የጥገና ጥያቄዎች"),
      color: "#670e80",
      icon: <Wrench size={30} />,
    },
    {
      key: "high_cost",
      label: t("Field Trip Requests", "የመስክ ጉዞ ጥያቄዎች"),
      color: "#c4430c",
      icon: <Wallet size={30} />,
    },
    {
      key: "service",
      label: t("Service Requests", "የአገልግሎት ጥያቄዎች"),
      color: "#4BC0C0",
      icon: <Blocks size={30} />,
    },
  ];

  const monthsList = [
    t("All", "ሁሉም"),
    t("Jan", "ጥር"),
    t("Feb", "የካቲት"),
    t("Mar", "መጋቢት"),
    t("Apr", "ሚያዝያ"),
    t("May", "ግንቦት"),
    t("Jun", "ሰኔ"),
    t("Jul", "ሐምሌ"),
    t("Aug", "ነሐሴ"),
    t("Sep", "መስከረም"),
    t("Oct", "ጥቅምት"),
    t("Nov", "ህዳር"),
    t("Dec", "ታህሳስ"),
  ];

  const COLORS = REQUEST_TYPES.map((rt) => rt.color);

  const [selectedMonth, setSelectedMonth] = useState(monthsList[0]); // Initialize with translated 'All'
  const [pieFilter, setPieFilter] = useState("Annual");
  const [pieMonth, setPieMonth] = useState(monthsList[1]); // Initialize with translated 'Jan'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorType, setErrorType] = useState(null); // "unauthorized" | "server" | null

  // State for dashboard data
  const [overviewData, setOverviewData] = useState({
    active_vehicles: 0,
    under_maintenance: 0,
    under_service: 0,
    total_rental_vehicles: 0,
    refueling_requests: 0,
    maintenance_requests: 0,
    high_cost_requests: 0,
    service_requests: 0,
  });

  const [recentVehicles, setRecentVehicles] = useState([]);
  const [monthlyTrends, setMonthlyTrends] = useState([]);
  const [typeDistribution, setTypeDistribution] = useState({});

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        const token = localStorage.getItem("authToken");
        if (!token) {
          setErrorType("unauthorized");
          setLoading(false);
          return;
        }

        const api = axios.create({
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        // Fetch each endpoint separately and log the result
        const overviewRes = await api.get(ENDPOINTS.DASHBOARD_OVERVIEW);
        console.log("Dashboard Overview Response:", overviewRes.data);
        setOverviewData(overviewRes.data);

        const recentRes = await api.get(ENDPOINTS.DASHBOARD_RECENT_VEHICLES);
        console.log("Dashboard Recent Vehicles Response:", recentRes.data);
        setRecentVehicles(recentRes.data.results || []);

        const trendsRes = await api.get(ENDPOINTS.DASHBOARD_MONTHLY_TRENDS);
        console.log("Dashboard Monthly Trends Response:", trendsRes.data);
        const transformedTrends = transformMonthlyTrends(trendsRes.data);
        setMonthlyTrends(transformedTrends);

        const distributionRes = await api.get(
          ENDPOINTS.DASHBOARD_TYPE_DISTRIBUTION
        );
        console.log("Dashboard Type Distribution Response:", distributionRes.data);
        setTypeDistribution(distributionRes.data);

        setLoading(false);
      } catch (err) {
        setLoading(false);

        if (err.response) {
          if (err.response.status === 401) {
            setErrorType("unauthorized");
          } else if (err.response.status === 403) {
            setError(t("You do not have permission to view this data.", "ይህን ዳታ ለማየት ፍቃድ የለዎትም።"));
          } else {
            setErrorType("server");
          }
        } else if (err.message === "No access token found") {
          setErrorType("unauthorized");
        } else {
          setErrorType("server");
        }
        console.error("Error fetching dashboard data:", err);
      }
    };

    fetchDashboardData();
    // eslint-disable-next-line
  }, []);

  // Transform monthly trends data from API to chart format
  const transformMonthlyTrends = (apiData) => {
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    // Initialize empty data structure
    const result = months.map((month) => ({
      month: t(month, getAmharicMonth(month)), // Translate month names
      refueling: 0,
      maintenance: 0,
      high_cost: 0,
      service: 0,
    }));

    // Fill in the data from API
    Object.keys(apiData).forEach((type) => {
      apiData[type].forEach((item) => {
        const date = new Date(item.month);
        const monthIndex = date.getMonth();
        const monthName = months[monthIndex];

        const foundMonth = result.find((m) => m.month === t(monthName, getAmharicMonth(monthName)));
        if (foundMonth) {
          foundMonth[type] = item.count;
        }
      });
    });

    return result;
  };

  // Helper to get Amharic month name
  const getAmharicMonth = (englishMonth) => {
    switch (englishMonth) {
      case "Jan": return "ጥር";
      case "Feb": return "የካቲት";
      case "Mar": return "መጋቢት";
      case "Apr": return "ሚያዝያ";
      case "May": return "ግንቦት";
      case "Jun": return "ሰኔ";
      case "Jul": return "ሐምሌ";
      case "Aug": return "ነሐሴ";
      case "Sep": return "መስከረም";
      case "Oct": return "ጥቅምት";
      case "Nov": return "ህዳር";
      case "Dec": return "ታህሳስ";
      default: return englishMonth;
    }
  };

  // Get pie chart data based on filter
  const getPieChartData = () => {
    if (pieFilter === "Annual") {
      return REQUEST_TYPES.map((rt) => ({
        name: rt.label,
        value: typeDistribution[rt.key] || 0,
      }));
    } else {
      const monthData = monthlyTrends.find((d) => d.month === pieMonth);
      if (!monthData) return [];

      return REQUEST_TYPES.map((rt) => ({
        name: rt.label,
        value: monthData[rt.key] || 0,
      }));
    }
  };

  // Filter bar data based on month selection
  const filteredBarData =
    selectedMonth === t("All", "ሁሉም")
      ? monthlyTrends
      : monthlyTrends.filter((item) => item.month === selectedMonth);

  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">{t("Loading...", "በመጫን ላይ...")}</span>
        </div>
        <p>{t("Loading dashboard data...", "የዳሽቦርድ መረጃ እየተጫነ ነው።")}</p>
      </div>
    );
  }

  if (errorType === "unauthorized") {
    return <UnauthorizedPage />;
  }
  if (errorType === "server") {
    return <ServerErrorPage />;
  }

  return (
    <div className="container mt-5">
      <h2 className="text-center mb-4">{t("Dashboard Overview", "የዳሽቦርድ አጠቃላይ እይታ")}</h2>

      {/* Vehicle Status Summary Cards */}
      <div className="row text-center mb-4">
        <div className="col-md-3 mb-3">
          <div className="card shadow-sm border-0">
            <div className="card-body">
              <span style={{ fontSize: 30 }}>
                <Car size={30} />
              </span>
              <h5 className="card-title mt-2">{t("Active Vehicles", "ንቁ ተሽከርካሪዎች")}</h5>
              <h3 style={{ fontWeight: "bold", color: "#36A2EB" }}>
                {overviewData.active_vehicles}
              </h3>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card shadow-sm border-0">
            <div className="card-body">
              <span style={{ fontSize: 30 }}>
                <Wrench size={30} />
              </span>
              <h5 className="card-title mt-2">{t("Under Maintenance", "በጥገና ላይ ያሉ")}</h5>
              <h3 style={{ fontWeight: "bold", color: "#FF6384" }}>
                {overviewData.under_maintenance}
              </h3>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card shadow-sm border-0">
            <div className="card-body">
              <span style={{ fontSize: 30 }}>
                <Blocks size={30} />
              </span>
              <h5 className="card-title mt-2">{t("Under Service", "በአገልግሎት ላይ ያሉ")}</h5>
              <h3 style={{ fontWeight: "bold", color: "#4BC0C0" }}>
                {overviewData.under_service}
              </h3>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card shadow-sm border-0">
            <div className="card-body">
              <span style={{ fontSize: 30 }}>
                <Bus size={30} />
              </span>
              <h5 className="card-title mt-2">{t("Total Rental Vehicles", "ጠቅላላ የኪራይ ተሽከርካሪዎች")}</h5>
              <h3 style={{ fontWeight: "bold", color: "#FFCE56" }}>
                {overviewData.total_rental_vehicles}
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* Request Summary Cards */}
      <div className="row text-center">
        {REQUEST_TYPES.map((rt) => (
          <div className="col-md-3 mb-3" key={rt.key}>
            <div className="card shadow-sm border-0">
              <div className="card-body">
                <span style={{ fontSize: 30 }}>{rt.icon}</span>
                <h5 className="card-title mt-2">{rt.label}</h5>
                <h3 style={{ fontWeight: "bold", color: rt.color }}>
                  {overviewData[`${rt.key}_requests`]}
                </h3>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bar and Pie Charts */}
      <div className="row mt-4">
        <div className="col-md-7">
          <div className="card shadow-sm border-0">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h5 className="card-title mb-0">{t("Monthly Request Trends", "ወርሃዊ የጥያቄ አዝማሚያዎች")}</h5>
                {/* Month filter dropdown */}
                <select
                  className="form-select form-select-sm"
                  style={{ width: 140 }}
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                >
                  {monthsList.map((m) => (
                    <option value={m} key={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={filteredBarData}>
                  <XAxis dataKey="month" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  {REQUEST_TYPES.map((rt) => (
                    <Bar
                      key={rt.key}
                      dataKey={rt.key}
                      name={rt.label}
                      fill={rt.color}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <div className="col-md-5">
          <div className="card shadow-sm border-0">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h5 className="card-title mb-0">{t("Request Type Distribution", "የጥያቄ አይነት ስርጭት")}</h5>
                <div className="d-flex align-items-center gap-2">
                  <select
                    className="form-select form-select-sm me-2"
                    style={{ width: 80 }}
                    value={pieFilter}
                    onChange={(e) => setPieFilter(e.target.value)}
                  >
                    <option value="Annual">{t("Annual", "ዓመታዊ")}</option>
                    <option value="Monthly">{t("Monthly", "ወርሃዊ")}</option>
                  </select>
                  {pieFilter === "Monthly" && (
                    <select
                      className="form-select form-select-sm"
                      style={{ width: 80 }}
                      value={pieMonth}
                      onChange={(e) => setPieMonth(e.target.value)}
                    >
                      {monthlyTrends.map((d) => (
                        <option value={d.month} key={d.month}>
                          {d.month}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={getPieChartData()}
                    dataKey="value"
                    outerRadius={110}
                    labelLine={false}
                    label={renderCustomizedLabel}
                  >
                    {getPieChartData().map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Vehicles Table */}
      <div className="card shadow-sm border-0 mt-4">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h5 className="card-title mb-0">{t("Recent Vehicles", "የቅርብ ጊዜ ተሽከርካሪዎች")}</h5>
          </div>
          <div className="table-responsive">
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>{t("Vehicle", "ተሽከርካሪ")}</th>
                  <th>{t("Type", "አይነት")}</th>
                  <th>{t("Status", "ሁኔታ")}</th>
                  <th>{t("Date", "ቀን")}</th>
                </tr>
              </thead>
              <tbody>
                {recentVehicles.map((vehicle, index) => (
                  <tr key={index}>
                    <td>{vehicle.vehicle}</td>
                    <td>
                      <span
                        className="me-1"
                        style={{
                          color:
                            REQUEST_TYPES.find(
                              (rt) =>
                                rt.key ===
                                vehicle.type.toLowerCase().replace(" ", "_")
                            )?.color || "#000",
                        }}
                      >
                        {REQUEST_TYPES.find(
                          (rt) =>
                            rt.key ===
                            vehicle.type.toLowerCase().replace(" ", "_")
                        )?.icon || <ShieldQuestion color="#0d1a4d" />}
                      </span>
                      {vehicle.type}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          vehicle.status === "Completed"
                            ? "bg-success"
                            : vehicle.status === "Pending"
                            ? "bg-warning"
                            : "bg-info"
                        }`}
                      >
                        {t(vehicle.status, 
                           vehicle.status === "Completed" ? "ተጠናቋል" :
                           vehicle.status === "Pending" ? "በሂደት ላይ" : "መረጃ"
                        )}
                      </span>
                    </td>
                    <td>{vehicle.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;