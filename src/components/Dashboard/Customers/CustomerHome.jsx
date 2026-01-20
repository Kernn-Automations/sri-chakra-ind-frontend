import React, { useEffect, useState, useMemo } from "react";
import styles from "./Customer.module.css";
import { Flex } from "@chakra-ui/react";
import ReusableCard from "../../ReusableCard";
import ChartComponent from "../../ChartComponent";
import { useAuth } from "@/Auth";
import Loading from "@/components/Loading";
import dashboardStyles from "../Dashboard.module.css";

function CustomerHome({ navigate, isAdmin }) {
  const { axiosAPI } = useAuth();
  const [loading, setLoading] = useState(false);
  const [customerData, setCustomerData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchCustomerDashboard() {
      try {
        setLoading(true);
        const res = await axiosAPI.get("/dashboard/customers");
        console.log("Customer Dashboard Response:", res.data);
        setCustomerData(res.data);
      } catch (err) {
        console.error("Customer dashboard fetch error:", err);
        setError(err?.response?.data?.message || "Failed to load customer dashboard");
      } finally {
        setLoading(false);
      }
    }
    fetchCustomerDashboard();
  }, []);

  // Transform backend data for Chart.js format
  const trendData = useMemo(() => {
    if (!customerData?.newCustomersTrend || !Array.isArray(customerData.newCustomersTrend)) {
      return {
        labels: ["Feb", "Mar", "Apr", "May", "Jun", "Jul"],
        datasets: [
          {
            label: "New Customers",
            data: [0, 0, 0, 0, 0, 0],
            borderColor: "#2a4d9b",
            backgroundColor: "rgba(42,77,155,0.1)",
            fill: true,
            tension: 0.3,
          },
        ],
      };
    }

    const labels = customerData.newCustomersTrend.map(item => item.month);
    const data = customerData.newCustomersTrend.map(item => item.count);

    return {
      labels,
      datasets: [
        {
          label: "New Customers",
          data,
          borderColor: "#2a4d9b",
          backgroundColor: "rgba(42,77,155,0.1)",
          fill: true,
          tension: 0.3,
        },
      ],
    };
  }, [customerData?.newCustomersTrend]);

  const typeData = useMemo(() => {
    if (!customerData?.customerTypes || !Array.isArray(customerData.customerTypes)) {
      return {
        labels: ["Bill-to-Bill", "Monthly"],
        datasets: [
          {
            label: "Customers",
            data: [0, 0],
            backgroundColor: [
              "#1cc88a",
              "#36b9cc",
            ],
          },
        ],
      };
    }

    const labels = customerData.customerTypes.map(item => item.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));
    const data = customerData.customerTypes.map(item => item.count);

    return {
      labels,
      datasets: [
        {
          label: "Customers",
          data,
          backgroundColor: [
            "#1cc88a",
            "#36b9cc",
            "#f6c23e",
            "#e74a3b",
            "#858796",
          ],
        },
      ],
    };
  }, [customerData?.customerTypes]);

  return (
    <>
      {/* Error Display */}
      {error && (
        <div className="container-fluid">
          <div className="row m-0 p-3">
            <div className="col text-center">
              <div className="alert alert-danger">
                <strong>Error loading customer dashboard</strong>
                <br />
                <small>{error}</small>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Buttons - Always visible */}
      <div className="row m-0 p-3">
        <div className="col">
          {isAdmin && (
            <button
              className="homebtn"
              onClick={() => navigate("/customers/create")}
            >
              Create Customer
            </button>
          )}
          <button
            className="homebtn"
            onClick={() => navigate("/customers/customer-list")}
          >
            Customers List
          </button>
          <button
            className="homebtn"
            onClick={() => navigate("/customers/kyc-approvals")}
          >
            KYC Approvals
          </button>
          <button
            className="homebtn"
            onClick={() => navigate("/customers/reports")}
          >
            Customer Reports
          </button>
          <button
            className="homebtn"
            onClick={() => navigate("/customers/transfer")}
          >
            Customer Transfer
          </button>
          <button
            className="homebtn"
            onClick={() => navigate("/customers/journal-voucher")}
          >
            Journal Voucher
          </button>
        </div>
      </div>

      {/* Cards */}
      <Flex wrap="wrap" justify="space-between" px={4} marginTop={50}>
        <ReusableCard 
          title="Total Customers" 
          value={customerData?.totalCustomers ?? (loading ? <Loading /> : "0")} 
        />
        <ReusableCard 
          title="Active Customers" 
          value={customerData?.activeCustomers ?? (loading ? <Loading /> : "0")} 
          color="green.500" 
        />
        <ReusableCard 
          title="Pending KYC" 
          value={customerData?.pendingKYC ?? (loading ? <Loading /> : "0")} 
          color="yellow.500" 
        />
      </Flex>

      {/* Charts */}
      <div className={dashboardStyles["charts-grid"]}>
        {trendData && trendData.datasets && trendData.datasets[0] && trendData.datasets[0].data && trendData.datasets[0].data.length > 0 && (
          <ChartComponent
            type="line"
            title="New Customers Trend"
            data={trendData}
            options={{ responsive: true }}
          />
        )}
        {typeData && typeData.datasets && typeData.datasets[0] && typeData.datasets[0].data && typeData.datasets[0].data.length > 0 && (
          <ChartComponent
            type="doughnut"
            title="Customer Types"
            data={typeData}
            options={{ responsive: true }}
            legendPosition="left"
          />
        )}
      </div>
    </>
  );
}

export default CustomerHome;
