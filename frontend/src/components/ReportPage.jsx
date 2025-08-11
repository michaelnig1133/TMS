import { useState, useEffect, useMemo } from "react";
import Logo from "../assets/Logo.jpg";
import { ENDPOINTS } from "../utilities/endpoints";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import UnauthorizedPage from "./UnauthorizedPage";
import ServerErrorPage from "./ServerErrorPage";

const to2dp = (v) => Number(v || 0).toFixed(2);

const totalTypes = [
  { key: "All", label: "All" },
  { key: "Maintenance Request", label: "Maintenance" },
  { key: "Service Request", label: "Service" },
  { key: "Refueling Request", label: "Refueling" },
  { key: "HighCost Request", label: "High Cost" },
];

const apiTypeMap = {
  "Car Request": "Transport",
  "Maintenance Request": "Maintenance",
  "Service Request": "Service",
  "Refueling Request": "Refueling",
  "HighCost Request": "HighCost",
};

const monthOptions = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const typeDisplayNames = {
  Transport: "Transport",
  Maintenance: "Maintenance",
  Refueling: "Refueling",
  HighCost: "HighCost",
  Service: "Service",
};

const reportTypesOrder = [
  "Transport",
  "HighCost",
  "Maintenance",
  "Refueling",
  "Service",
];

const ReportPage = () => {
  const [maintFilter, setMaintFilter] = useState("All");
  const [totalType, setTotalType] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tableData, setTableData] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState("All");
  const [plateSearch, setPlateSearch] = useState("");
  const [driverSearch, setDriverSearch] = useState("");
  const [errorType, setErrorType] = useState(null); // "unauthorized" | "server" | null

  const currentYear = new Date().getFullYear();
  const yearOptions = [];
  for (let y = 2022; y <= currentYear; y++) yearOptions.push(y);

  // Fetch table data when year/month changes
  useEffect(() => {
    const fetchTableData = async () => {
      setLoading(true);
      setError(null);

      const accessToken =
        localStorage.getItem("accessToken") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("token");
      if (!accessToken) {
        setErrorType("unauthorized");
        setLoading(false);
        setTableData([]);
        return;
      }

      try {
        let url;
        if (selectedMonth === "All") {
          url = ENDPOINTS.REPORT_LIST;
        } else {
          const monthNum = (
            "0" +
            (monthOptions.indexOf(selectedMonth) + 1)
          ).slice(-2);
          url = ENDPOINTS.REPORT_BY_MONTH(selectedYear, monthNum);
        }
        const res = await fetch(url, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        });
        if (res.status === 401) {
          setErrorType("unauthorized");
          setLoading(false);
          setTableData([]);
          return;
        }
        if (!res.ok) throw new Error("Failed to fetch report table data.");
        const tableJson = await res.json();
        const vehicles = tableJson.results?.vehicles || [];

        // Group requests by plate, driver, and type to create cumulative totals
        const requestMap = {};

        vehicles.forEach((v) => {
          v.requests.forEach((req) => {
            const key = `${req.plate}_${req.driver}_${req.request_type}`;

            if (!requestMap[key]) {
              requestMap[key] = {
                plate: req.plate,
                driver: req.driver,
                type: req.request_type,
                count: 0,
                totalKm: 0,
                totalFuel: 0,
                totalCost: 0,
              };
            }

            requestMap[key].count += 1;
            requestMap[key].totalKm += Number(req.kilometers) || 0;
            requestMap[key].totalFuel += Number(req.fuel_liters) || 0;
            requestMap[key].totalCost += Number(req.cost) || 0;
          });
        });

        // Convert the map to an array
        const groupedData = Object.values(requestMap);
        setTableData(groupedData);
      } catch (err) {
        setErrorType("server");
        setTableData([]);
      }
      setLoading(false);
    };
    fetchTableData();
  }, [selectedYear, selectedMonth]);

  // Filter data based on search inputs and filter dropdown
  const filteredData = useMemo(() => {
    return tableData.filter((item) => {
      const matchesPlate = item.plate
        .toLowerCase()
        .includes(plateSearch.toLowerCase());
      const matchesDriver = item.driver
        .toLowerCase()
        .includes(driverSearch.toLowerCase());
      const matchesType =
        maintFilter === "All" ||
        (maintFilter === "HighCost Request"
          ? item.type === "HighCost"
          : item.type === apiTypeMap[maintFilter] || item.type === maintFilter);

      return matchesPlate && matchesDriver && matchesType;
    });
  }, [tableData, plateSearch, driverSearch, maintFilter]);

  // Calculate totals for cards and summary
  const { cardTotalRequests, cardTotalCost, totalsByType } = useMemo(() => {
    const cardFiltered =
      totalType === "All"
        ? filteredData
        : filteredData.filter((row) =>
            totalType === "HighCost Request"
              ? row.type === "HighCost"
              : row.type === apiTypeMap[totalType] || row.type === totalType
          );

    // Calculate totals by type
    const typeTotals = {};
    filteredData.forEach((row) => {
      if (!typeTotals[row.type]) {
        typeTotals[row.type] = { count: 0, cost: 0 };
      }
      typeTotals[row.type].count += row.count;
      typeTotals[row.type].cost += row.totalCost;
    });

    return {
      cardTotalRequests: cardFiltered.reduce((sum, row) => sum + row.count, 0),
      cardTotalCost: cardFiltered.reduce((sum, row) => sum + row.totalCost, 0),
      totalsByType: typeTotals,
    };
  }, [filteredData, totalType]);

  // Prepare data for the graph
  const graphData = reportTypesOrder
    .filter((type) => totalsByType[type])
    .map((type) => ({
      name: typeDisplayNames[type] || type,
      Requests: totalsByType[type].count,
      Cost: Number(totalsByType[type].cost),
    }));

  const t = {
    reportPage: "Report Page",
    driver: "Driver",
    kilometers: "Kilometers",
    fuel: "Fuel",
    cost: "Cost",
    type: "Type",
    loading: "Loading...",
  };

  if (loading) return <p>{t.loading}</p>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  const handlePrintTable = () => {
    const tableContent = document.getElementById(
      "print-table-section"
    ).innerHTML;
    const logoImg = Logo.startsWith("data:") ? Logo : Logo;

    const printWindow = window.open("", "", "width=900,height=700");
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Report Table</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ccc; padding: 8px; text-align: center; }
            th { background: #f8f9fc; }
            .logo-header { text-align: center; margin-bottom: 30px; }
            .logo-header img { max-width: 200px; max-height: 120px; }
          </style>
        </head>
        <body>
          <div class="logo-header">
            <img src="${logoImg}" alt="Logo" />
          </div>
          ${tableContent}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  if (errorType === "unauthorized") {
    return <UnauthorizedPage />;
  }
  if (errorType === "server") {
    return <ServerErrorPage />;
  }

  return (
    <div
      className="container"
      style={{
        minHeight: "100vh",
        backgroundColor: "#f8f9fc",
        marginTop: "100px",
      }}
    >
      <h2 className="h4 mb-4" style={{ color: "#14183E", fontWeight: 700 }}>
        {t.reportPage}
      </h2>

      {/* Cards for total requests and total cost with filter */}
      <div className="row mb-4 align-items-end">
        <div className="col-md-3 mb-2">
          <span className="me-2">Filter Totals By:</span>
          <select
            className="form-select form-select-sm"
            style={{ width: "200px", display: "inline-block" }}
            value={totalType}
            onChange={(e) => setTotalType(e.target.value)}
          >
            {totalTypes.map((type) => (
              <option key={type.key} value={type.key}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-4 mb-2">
          <div className="card shadow-sm">
            <div className="card-body text-center">
              <h6 className="mb-1">Total Requests</h6>
              <span className="display-6">{cardTotalRequests}</span>
            </div>
          </div>
        </div>
        <div className="col-md-4 mb-2">
          <div className="card shadow-sm">
            <div className="card-body text-center">
              <h6 className="mb-1">Total Cost</h6>
              <span className="display-6">{to2dp(cardTotalCost)} ETB</span>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <h5 className="mb-3">Requests and Cost by Type</h5>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={graphData}
              margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis
                yAxisId="left"
                label={{
                  value: "Requests",
                  angle: -90,
                  position: "insideLeft",
                }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                label={{
                  value: "Cost (ETB)",
                  angle: 90,
                  position: "insideRight",
                }}
              />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="Requests" fill="#8884d8" />
              <Bar yAxisId="right" dataKey="Cost" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Unified Table Section */}
      <div className="card shadow-sm mb-5">
        <div className="card-body">
          <div className="row mb-3">
            <div className="col-md-2">
              <label className="form-label">Year:</label>
              <select
                className="form-select form-select-sm"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label">Month:</label>
              <select
                className="form-select form-select-sm"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              >
                <option value="All">All</option>
                {monthOptions.map((month) => (
                  <option key={month} value={month}>
                    {month}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label">Filter By Type:</label>
              <select
                className="form-select form-select-sm"
                value={maintFilter}
                onChange={(e) => setMaintFilter(e.target.value)}
              >
                <option value="All">All</option>
                <option value="Car Request">Car Request</option>
                <option value="Maintenance Request">Maintenance</option>
                <option value="Service Request">Service</option>
                <option value="Refueling Request">Refueling</option>
                <option value="HighCost Request">High Cost</option>
              </select>
            </div>
          </div>

          {/* Search Filters */}
          <div className="row mb-3">
            <div className="col-md-6">
              <label className="form-label">Search by Plate Number:</label>
              <input
                type="text"
                className="form-control"
                placeholder="Enter plate number..."
                value={plateSearch}
                onChange={(e) => setPlateSearch(e.target.value)}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Search by Driver Name:</label>
              <input
                type="text"
                className="form-control"
                placeholder="Enter driver name..."
                value={driverSearch}
                onChange={(e) => setDriverSearch(e.target.value)}
              />
            </div>
          </div>

          <h5 className="mb-3">All Requests (Cumulative Report)</h5>
          <div className="table-responsive" id="print-table-section">
            <table className="table table-bordered table-striped">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Plate</th>
                  <th>Driver</th>
                  <th>Request Type</th>
                  <th>Request Count</th>
                  <th>Total Kilometers</th>
                  <th>Total Fuel (L)</th>
                  <th>Total Cost (ETB)</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center">
                      No data found.
                    </td>
                  </tr>
                ) : (
                  filteredData.map((req, idx) => (
                    <tr key={`${req.plate}_${req.driver}_${req.type}_${idx}`}>
                      <td>{idx + 1}</td>
                      <td>{req.plate}</td>
                      <td>{req.driver}</td>
                      <td>{req.type}</td>
                      <td>{req.count}</td>
                      <td>{to2dp(req.totalKm)}</td>
                      <td>{to2dp(req.totalFuel)}</td>
                      <td>{to2dp(req.totalCost)}</td>
                    </tr>
                  ))
                )}

                {/* Totals by request type */}
                {reportTypesOrder.map((type) =>
                  totalsByType[type] ? (
                    <tr
                      key={type}
                      style={{ fontWeight: "bold", background: "#f8f9fc" }}
                    >
                      <td colSpan={4} className="text-end">
                        Total for {typeDisplayNames[type] || type}:
                      </td>
                      <td>{totalsByType[type].count}</td>
                      <td colSpan={2}>{to2dp(totalsByType[type].cost)} ETB</td>
                    </tr>
                  ) : null
                )}

                {/* Overall total */}
                <tr style={{ fontWeight: "bold", background: "#e0e7ef" }}>
                  <td colSpan={4} className="text-end">
                    Overall Total:
                  </td>
                  <td>
                    {filteredData.reduce((sum, row) => sum + row.count, 0)}
                  </td>
                  <td colSpan={2}>
                    {to2dp(
                      filteredData.reduce((sum, row) => sum + row.totalCost, 0)
                    )}{" "}
                    ETB
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="d-flex justify-content-end mt-2">
            <button
              className="btn"
              style={{
                backgroundColor: "#14183E",
                color: "#fff",
                width: "130px",
              }}
              onClick={handlePrintTable}
            >
              Print Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportPage;
