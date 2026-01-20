import React, { useEffect, useState, useMemo } from "react";
import { Flex } from "@chakra-ui/react";
import ReusableCard from "@/components/ReusableCard";
import ChartComponent from "@/components/ChartComponent";
import { useAuth } from "@/Auth";
import Loading from "@/components/Loading";
import styles from "../Dashboard.module.css";

function EmployeeHome({ navigate, isAdmin }) {
  const { axiosAPI } = useAuth();
  const [loading, setLoading] = useState(false);
  const [employeeData, setEmployeeData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchEmployeeDashboard() {
      try {
        setLoading(true);
        
        // ✅ Get division ID from localStorage for division filtering
        const currentDivisionId = localStorage.getItem('currentDivisionId');
        const currentDivisionName = localStorage.getItem('currentDivisionName');
        
        // ✅ Add division parameters to endpoint
        let endpoint = "/dashboard/employees";
        if (currentDivisionId && currentDivisionId !== '1') {
          endpoint += `?divisionId=${currentDivisionId}`;
        } else if (currentDivisionId === '1') {
          endpoint += `?showAllDivisions=true`;
        }
        
        console.log('EmployeeHome - Fetching employee dashboard with endpoint:', endpoint);
        console.log('EmployeeHome - Division ID:', currentDivisionId);
        console.log('EmployeeHome - Division Name:', currentDivisionName);
        
        const res = await axiosAPI.get(endpoint);
        console.log("Employee Dashboard Response:", res.data);
        setEmployeeData(res.data);
      } catch (err) {
        console.error("Employee dashboard fetch error:", err);
        setError(err?.response?.data?.message || "Failed to load employee dashboard");
      } finally {
        setLoading(false);
      }
    }
    fetchEmployeeDashboard();
  }, []);

  // Transform backend data for Chart.js format
  const trendData = React.useMemo(() => {
    console.log("employeesTrend data:", employeeData?.employeesTrend);
    
    if (!employeeData?.employeesTrend || !Array.isArray(employeeData.employeesTrend)) {
      console.log("Using fallback trend data");
      return {
    labels: ["Feb", "Mar", "Apr", "May", "Jun", "Jul"],
    datasets: [
      {
        label: "Employees",
        data: [45, 47, 50, 51, 52, 52],
        borderColor: "#2a4d9b",
        backgroundColor: "rgba(42,77,155,0.1)",
        fill: true,
        tension: 0.3,
      },
    ],
  };
    }

    // Transform the array data to Chart.js format
    const labels = employeeData.employeesTrend.map(item => item.month || item.label || item.date || "");
    const data = employeeData.employeesTrend.map(item => item.count ?? item.value ?? item.employees ?? 0);

    console.log("Transformed trend data:", { labels, data });

    return {
      labels,
      datasets: [
        {
          label: "Employees",
          data,
          borderColor: "#2a4d9b",
          backgroundColor: "rgba(42,77,155,0.1)",
          fill: true,
          tension: 0.3,
        },
      ],
    };
  }, [employeeData?.employeesTrend]);

  const roleData = React.useMemo(() => {
    console.log("employeesByRole data:", employeeData?.employeesByRole);
    
    if (!employeeData?.employeesByRole || !Array.isArray(employeeData.employeesByRole)) {
      console.log("Using fallback role data");
      return {
    labels: ["Warehouse", "Sales", "Admin", "Manager", "Support", "Driver"],
    datasets: [
      {
        label: "Roles",
        data: [15, 12, 8, 5, 6, 6],
        backgroundColor: [
          "#4e73df",
          "#1cc88a",
          "#36b9cc",
          "#f6c23e",
          "#e74a3b",
          "#858796",
        ],
      },
    ],
  };
    }

    // Transform the array data to Chart.js format
    const labels = employeeData.employeesByRole.map(item => item.role || item.name || "");
    const data = employeeData.employeesByRole.map(item => item.count ?? item.value ?? 0);

    console.log("Transformed role data:", { labels, data });

    return {
      labels,
      datasets: [
        {
          label: "Roles",
          data,
          backgroundColor: [
            "#4e73df",
            "#1cc88a",
            "#36b9cc",
            "#f6c23e",
            "#e74a3b",
            "#858796",
          ],
        },
      ],
    };
  }, [employeeData?.employeesByRole]);

  return (
    <>
      {/* Buttons - Always visible */}
      <div className="row m-0 p-3">
        <div className="col">
          {isAdmin && (
            <button
              className="homebtn"
              onClick={() => navigate("/employees/create-employee")}
            >
              Create Employee
            </button>
          )}
          <button
            className="homebtn"
            onClick={() => navigate("/employees/manage-employees")}
          >
            Manage Employees
          </button>
          <button
            className="homebtn"
            onClick={() => navigate("/employees/team-transfer")}
          >
            Team Transfer
          </button>
          <button
            className="homebtn"
            onClick={() => navigate("/teams")}
          >
            Teams
          </button>
        </div>
      </div>

      {/* Cards */}
      <Flex wrap="wrap" justify="space-between" px={4}>
        <ReusableCard 
          title="Total Employees" 
          value={employeeData?.totalEmployees || (loading ? <Loading /> : "52")} 
        />
        <ReusableCard 
          title="Active Employees" 
          value={employeeData?.activeEmployees || (loading ? <Loading /> : "48")} 
          color="green.500" 
        />
        <ReusableCard 
          title="Inactive Employees" 
          value={employeeData?.inactiveEmployees || (loading ? <Loading /> : "4")} 
          color="red.500" 
        />
        <ReusableCard 
          title="Roles Covered" 
          value={employeeData?.rolesCovered || (loading ? <Loading /> : "6")} 
          color="purple.500" 
        />
      </Flex>

      {/* Charts */}
      <div className={styles["charts-grid"]}>
        {trendData && trendData.datasets && trendData.datasets[0] && trendData.datasets[0].data && trendData.datasets[0].data.length > 0 && (
          <ChartComponent
            type="line"
            title="Employees Trend"
            data={trendData}
            options={{ responsive: true }}
          />
        )}
        {roleData && roleData.datasets && roleData.datasets[0] && roleData.datasets[0].data && roleData.datasets[0].data.length > 0 && (
          <ChartComponent
            type="doughnut"
            title="Employees by Role"
            data={roleData}
            options={{ responsive: true }}
            legendPosition="left"
          />
        )}
      </div>
    </>
  );
}

export default EmployeeHome;
