import React, { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import styles from "./Sales.module.css";
import { useAuth } from "@/Auth";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#A020F0",
  "#FF66CC",
  "#00fe11ff",
  "#6b689bff",
  "#a44040ff",
];

// 🧩 Custom Tooltip Component
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length > 0) {
    const data = payload[0].payload;
    return (
      <div className={styles.tooltipBox}>
        <p className={styles.tooltipTitle}>{data.name}</p>
        <p>
          <strong>Bags :</strong> {data.bags?.toLocaleString() || 0}
        </p>
        <p>
          <strong>Alt Qty :</strong> {data.tons?.toLocaleString() || 0}
        </p>
        <p>
          <strong>Value :</strong> {data.value?.toLocaleString() || 0}
        </p>
      </div>
    );
  }
  return null;
};

const SalesPieChart = () => {
  const [salesData, setSalesData] = useState(null);
  const { axiosAPI } = useAuth();
  const [filter, setFilter] = useState("division");

  useEffect(() => {
    async function fetchSalesData() {
      try {
        const res = await axiosAPI.get(
          `/dashboard/sales-pie-charts?filter=${filter}&value=all`
        );
        setSalesData(res.data);
        console.log(res)
      } catch (error) {
        console.error("Error fetching chart data:", error);
      }
    }
    fetchSalesData();
  }, [filter]);

  if (!salesData) {
    return <p className={styles.loading}>Loading charts...</p>;
  }

  const {
    confirmedSalesOrders,
    dispatchedSalesOrders,
    pendingSalesOrders,
    cancelledSalesOrders,
  } = salesData.data;

  const chartConfigs = [
    { title: "Confirmed Sales Orders", data: confirmedSalesOrders },
    { title: "Dispatched Sales Orders", data: dispatchedSalesOrders },
    { title: "Pending Sales Orders", data: pendingSalesOrders },
    { title: "Cancelled Sales Orders", data: cancelledSalesOrders },
  ];

  return (
    <div className={styles.pieContainer}>
      <div className="d-flex justify-content-between align-items-center">
        <h2 className={styles.mainTitle}>Sales Details</h2>
        <select
          className={styles.selectDropdown}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="division">Division</option>
          <option value="zone">Zone</option>
          <option value="sub-zone">Sub Zone</option>
          <option value="team">Teams</option>
        </select>
      </div>

      <div className={styles.chartGrid}>
        {chartConfigs.map((chart, index) => {
          const totalBags = chart.data.reduce(
            (sum, item) => sum + item.bags,
            0
          );

          return (
            <div key={index} className={styles.chartCard}>
              <h3 className={styles.chartTitle}>{chart.title}</h3>

              {chart.data && chart.data.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={chart.data}
                        dataKey="bags"
                        nameKey="name"
                        outerRadius={80}
                        labelLine={false}
                      >
                        {chart.data.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>

                  <div className={styles.legendContainer}>
                    {chart.data.map((item, i) => (
                      <div key={i} className={styles.legendItem}>
                        <span
                          className={styles.legendColor}
                          style={{ backgroundColor: COLORS[i % COLORS.length] }}
                        ></span>
                        <span className={styles.legendLabel}>
                          {item.name}: {item.bags} Bags
                        </span>
                      </div>
                    ))}
                  </div>

                  <p className={styles.totalText}>
                    <strong>Total:</strong> {totalBags.toLocaleString()} Bags
                  </p>
                </>
              ) : (
                <p className={styles.noData}>No data available</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SalesPieChart;
