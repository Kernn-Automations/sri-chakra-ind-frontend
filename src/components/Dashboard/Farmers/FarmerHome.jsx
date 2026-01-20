import React, { useEffect, useState, useMemo } from "react";
import styles from "./Farmer.module.css";
import { Flex } from "@chakra-ui/react";
import ReusableCard from "../../ReusableCard";
import ChartComponent from "../../ChartComponent";
import { useAuth } from "@/Auth";
import Loading from "@/components/Loading";
import dashboardStyles from "../Dashboard.module.css";

function FarmerHome({ navigate, isAdmin }) {
  const { axiosAPI } = useAuth();
  const [loading, setLoading] = useState(false);
  const [farmerData, setFarmerData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchFarmerDashboard() {
      try {
        setLoading(true);
        const res = await axiosAPI.get("/dashboard/farmers");
        console.log("Farmer Dashboard Response:", res.data);
        setFarmerData(res.data);
      } catch (err) {
        console.error("Farmer dashboard fetch error:", err);
        setError(err?.response?.data?.message || "Failed to load farmer dashboard");
      } finally {
        setLoading(false);
      }
    }
    fetchFarmerDashboard();
  }, []);

  // Transform backend data for Chart.js format
  const trendData = useMemo(() => {
    if (!farmerData?.data?.newFarmersTrend) {
      return {
        labels: ["Feb", "Mar", "Apr", "May", "Jun", "Jul"],
        datasets: [
          {
            label: "New Farmers",
            data: [0, 0, 0, 0, 0, 0],
            borderColor: "#2a4d9b",
            backgroundColor: "rgba(42,77,155,0.1)",
            fill: true,
            tension: 0.3,
          },
        ],
      };
    }

    const { months, data } = farmerData.data.newFarmersTrend;

    return {
      labels: months,
      datasets: [
        {
          label: "New Farmers",
          data: data,
          borderColor: "#2a4d9b",
          backgroundColor: "rgba(42,77,155,0.1)",
          fill: true,
          tension: 0.3,
        },
      ],
    };
  }, [farmerData?.data?.newFarmersTrend]);

  const typeData = useMemo(() => {
    if (!farmerData?.data?.farmerTypes) {
      return {
        labels: ["Small Farmer", "Medium Farmer", "Large Farmer"],
        datasets: [
          {
            label: "Farmers",
            data: [0, 0, 0],
            backgroundColor: [
              "#1cc88a",
              "#36b9cc",
              "#f6c23e",
            ],
          },
        ],
      };
    }

    const farmerTypes = farmerData.data.farmerTypes;
    const labels = Object.keys(farmerTypes).map(type => 
      type.charAt(0).toUpperCase() + type.slice(1) + " Farmer"
    );
    const data = Object.values(farmerTypes);

    return {
      labels,
      datasets: [
        {
          label: "Farmers",
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
  }, [farmerData?.data?.farmerTypes]);

  return (
    <>
      {/* Error Display */}
      {error && (
        <div className="container-fluid">
          <div className="row m-0 p-3">
            <div className="col text-center">
              <div className="alert alert-danger">
                <strong>Error loading farmer dashboard</strong>
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
              onClick={() => navigate("/farmers/create")}
            >
              Create Farmer
            </button>
          )}
          <button
            className="homebtn"
            onClick={() => navigate("/farmers/farmer-list")}
          >
            Farmers List
          </button>

        </div>
      </div>

             {/* Cards */}
       <Flex wrap="wrap" justify="space-between" px={4} marginTop={50}>
         <ReusableCard 
           title="Total Farmers" 
           value={farmerData?.data?.summary?.totalFarmers ?? (loading ? <Loading /> : "0")} 
         />
         <ReusableCard 
           title="Active Farmers" 
           value={farmerData?.data?.summary?.activeFarmers ?? (loading ? <Loading /> : "0")} 
           color="green.500" 
         />
         <ReusableCard 
           title="Inactive Farmers" 
           value={farmerData?.data?.summary?.inactiveFarmers ?? (loading ? <Loading /> : "0")} 
           color="red.500" 
         />
       </Flex>

      {/* Charts */}
      <div className={dashboardStyles["charts-grid"]}>
        {trendData && trendData.datasets && trendData.datasets[0] && trendData.datasets[0].data && trendData.datasets[0].data.length > 0 && (
          <ChartComponent
            type="line"
            title="New Farmers Trend"
            data={trendData}
            options={{ responsive: true }}
          />
        )}
        {typeData && typeData.datasets && typeData.datasets[0] && typeData.datasets[0].data && typeData.datasets[0].data.length > 0 && (
          <ChartComponent
            type="doughnut"
            title="Farmer Types"
            data={typeData}
            options={{ responsive: true }}
            legendPosition="left"
          />
        )}
      </div>
    </>
  );
}

export default FarmerHome;
