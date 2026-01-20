import React, { useEffect, useState, useMemo } from "react";
import { Flex } from "@chakra-ui/react";
import ReusableCard from "@/components/ReusableCard";
import ChartComponent from "@/components/ChartComponent";
import { useAuth } from "@/Auth";
import Loading from "@/components/Loading";

function StockHome({ navigate }) {
  const { axiosAPI } = useAuth();
  const [loading, setLoading] = useState(false);
  const [stockData, setStockData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchStockTransferDashboard() {
      try {
        setLoading(true);
        const res = await axiosAPI.get("/dashboard/stock-transfer");
        console.log("Stock Transfer Dashboard Response:", res.data);
        setStockData(res.data);
      } catch (err) {
        console.error("Stock transfer dashboard fetch error:", err);
        setError(err?.response?.data?.message || "Failed to load stock transfer dashboard");
      } finally {
        setLoading(false);
      }
    }
    fetchStockTransferDashboard();
  }, []);

  // Transform backend data for Chart.js
  const trendData = useMemo(() => {
    if (!stockData?.transfersTrend || !Array.isArray(stockData.transfersTrend)) {
      return {
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
        datasets: [
          {
            label: "Transfers",
            data: [0, 0, 0, 0, 0, 0],
            backgroundColor: "#4F8EF7"
          }
        ]
      };
    }

    const labels = stockData.transfersTrend.map(item => item.month || item.label || item.date || "");
    const data = stockData.transfersTrend.map(item => item.count ?? 0);

    return {
      labels,
      datasets: [
        {
          label: "Transfers",
          data,
          backgroundColor: "#4F8EF7"
        }
      ]
    };
  }, [stockData?.transfersTrend]);

  const productData = useMemo(() => {
    if (!stockData?.topProductsTransferred || !Array.isArray(stockData.topProductsTransferred)) {
      return {
        labels: ["No Products"],
        datasets: [
          {
            label: "Quantity",
            data: [0],
            backgroundColor: "#F7B32B"
          }
        ]
      };
    }

    const labels = stockData.topProductsTransferred.map(item => item.product || item.name || "");
    const data = stockData.topProductsTransferred.map(item => item.quantity ?? 0);

    return {
      labels,
      datasets: [
        {
          label: "Quantity",
          data,
          backgroundColor: "#F7B32B"
        }
      ]
    };
  }, [stockData?.topProductsTransferred]);

  return (
    <>
      {/* Error Display */}
      {error && (
        <div className="container-fluid">
          <div className="row m-0 p-3">
            <div className="col text-center">
              <div className="alert alert-danger">
                <strong>Error loading stock transfer dashboard</strong>
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
            onClick={() => navigate("/stock-transfer/transfer")}
          >
            Stock Transfer
          </button>
          <button
            className="homebtn"
            onClick={() => navigate("/stock-transfer/list")}
          >
            Transfer List
          </button>
        </div>
      </div>

      {/* Cards */}
      <Flex wrap="wrap" justify="space-between" px={4}>
        <ReusableCard 
          title="Transfers This Month" 
          value={stockData?.transfersThisMonth || (loading ? <Loading /> : "0")} 
        />
        <ReusableCard 
          title="From Central WH" 
          value={stockData?.fromCentralWH || (loading ? <Loading /> : "0")} 
          color="blue.500" 
        />
        <ReusableCard 
          title="From Regional WH" 
          value={stockData?.fromLocalWH || (loading ? <Loading /> : "0")} 
          color="purple.500" 
        />
        <ReusableCard 
          title="Total Quantity" 
          value={stockData?.totalQuantity || (loading ? <Loading /> : "0")} 
          color="green.500" 
        />
      </Flex>

      {/* Charts */}
      <Flex wrap="wrap" px={4}>
        {trendData.labels.length > 0 && trendData.datasets[0].data.length > 0 && (
          <ChartComponent
            type="bar"
            title="Transfers Trend"
            data={trendData}
            options={{ responsive: true }}
          />
        )}
        {productData.labels.length > 0 && productData.datasets[0].data.length > 0 && (
          <ChartComponent
            type="bar"
            title="Top Products Transferred"
            data={productData}
            options={{ responsive: true }}
          />
        )}
      </Flex>
    </>
  );
}

export default StockHome;
