import React, { useEffect, useState, useMemo } from "react";
import { Flex } from "@chakra-ui/react";
import ReusableCard from "@/components/ReusableCard";
import ChartComponent from "@/components/ChartComponent";
import { useAuth } from "@/Auth";
import Loading from "@/components/Loading";
import styles from "../Dashboard.module.css";
import discountStyles from "./Discount.module.css";

function DiscountHome({ navigate }) {
  const { axiosAPI } = useAuth();
  const [loading, setLoading] = useState(false);
  const [discountData, setDiscountData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchDiscountDashboard() {
      try {
        setLoading(true);
        const res = await axiosAPI.get("/dashboard/discounts");
        console.log("Discount Dashboard Response:", res.data);
        setDiscountData(res.data);
      } catch (err) {
        console.error("Discount dashboard fetch error:", err);
        setError(err?.response?.data?.message || "Failed to load discount dashboard");
      } finally {
        setLoading(false);
      }
    }
    fetchDiscountDashboard();
  }, []);

  // Transform backend data for Chart.js format
  const trendData = useMemo(() => {
    if (!discountData?.discountsTrend || !Array.isArray(discountData.discountsTrend)) {
      return {
        labels: ["Feb", "Mar", "Apr", "May", "Jun", "Jul"],
        datasets: [
          {
            label: "Discounts ₹",
            data: [0, 0, 0, 0, 0, 0],
            borderColor: "#2a4d9b",
            backgroundColor: "rgba(42,77,155,0.1)",
            fill: true,
            tension: 0.3,
          },
        ],
      };
    }

    const labels = discountData.discountsTrend.map(item => item.month);
    const data = discountData.discountsTrend.map(item => item.amount);

    return {
      labels,
      datasets: [
        {
          label: "Discounts ₹",
          data,
          borderColor: "#2a4d9b",
          backgroundColor: "rgba(42,77,155,0.1)",
          fill: true,
          tension: 0.3,
        },
      ],
    };
  }, [discountData?.discountsTrend]);

  const typeData = useMemo(() => {
    if (!discountData?.discountProductTypeShare || !Array.isArray(discountData.discountProductTypeShare)) {
      return {
        labels: ["Packed", "Loose"],
        datasets: [
          {
            label: "₹",
            data: [0, 0],
            backgroundColor: ["#4e73df", "#1cc88a"],
          },
        ],
      };
    }

    const labels = discountData.discountProductTypeShare.map(item => item.type);
    const data = discountData.discountProductTypeShare.map(item => item.amount);

    return {
      labels,
      datasets: [
        {
          label: "₹",
          data,
          backgroundColor: ["#4e73df", "#1cc88a", "#36b9cc", "#f6c23e", "#e74a3b"],
        },
      ],
    };
  }, [discountData?.discountProductTypeShare]);

  return (
    <>
      {/* Error Display */}
      {error && (
        <div className="container-fluid">
          <div className="row m-0 p-3">
            <div className="col text-center">
              <div className="alert alert-danger">
                <strong>Error loading discount dashboard</strong>
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
          <button
            className="homebtn"
            onClick={() => navigate("/discounts/bill-to-bill")}
          >
            Bill-to-Bill
          </button>
          <button
            className="homebtn"
            onClick={() => navigate("/discounts/monthly")}
          >
            Monthly Discount
          </button>
          
          {/* Enable/Disable Switch for Monthly Discount */}
          <div className="d-inline-block ms-3">
            <label className={discountStyles["switch-label"]}>Enable/Disable:</label>
            <label className={discountStyles.switch}>
              <input type="checkbox" defaultChecked />
              <span className={discountStyles.slider}></span>
            </label>
          </div>
        </div>
      </div>

      {/* Cards */}
      <Flex wrap="wrap" justify="space-between" px={4}>
        <ReusableCard 
          title="Total Discounts" 
          value={loading ? <Loading /> : `₹${Number(discountData?.totalDiscounts ?? 0).toLocaleString("en-IN")}`} 
        />
        <ReusableCard 
          title="Avg Discount Per Unit" 
          value={discountData?.avgDiscountPerUnit ?? (loading ? <Loading /> : "0")} 
          color="blue.500" 
        />
        <ReusableCard 
          title="Product Types" 
          value={discountData?.discountProductTypeShare?.length ?? (loading ? <Loading /> : "0")} 
          color="green.500" 
        />
        <ReusableCard 
          title="Trend Months" 
          value={discountData?.discountsTrend?.length ?? (loading ? <Loading /> : "0")} 
          color="yellow.500" 
        />
      </Flex>

      {/* Charts */}
      <div className={styles["charts-grid"]}>
        {trendData && trendData.datasets && trendData.datasets[0] && trendData.datasets[0].data && trendData.datasets[0].data.length > 0 && (
          <ChartComponent
            type="line"
            title="Discounts Trend"
            data={trendData}
            options={{ responsive: true }}
          />
        )}
        {typeData && typeData.datasets && typeData.datasets[0] && typeData.datasets[0].data && typeData.datasets[0].data.length > 0 && (
          <ChartComponent
            type="doughnut"
            title="Discount by Product Type"
            data={typeData}
            options={{ responsive: true }}
            legendPosition="left"
          />
        )}
      </div>
    </>
  );
}

export default DiscountHome;
