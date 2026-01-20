import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../Dashboard/HomePage/HomePage.module.css";
import Productbox from "../Dashboard/HomePage/Productbox";
import LowStockAlerts from "../Dashboard/HomePage/LowStockAlerts";
import storeHomeStyles from "./StoreHome.module.css";
import storeService from "../../services/storeService";
import ErrorModal from "@/components/ErrorModal";
import {
  FaUsers,
  FaShoppingCart,
  FaTruck,
  FaExclamationTriangle,
  FaCheckCircle,
  FaClock,
  FaBoxes,
  FaRupeeSign,
  FaUserCheck,
  FaUserClock,
  FaUserTimes,
  FaChartLine,
  FaMoneyCheckAlt,
  FaUniversity,
  FaWallet,
  FaStore,
  FaExchangeAlt,
} from "react-icons/fa";

import {
  isStoreManager,
  isAdmin,
  isSuperAdmin,
  isDivisionHead,
} from "../../utils/roleUtils";

// ------------------ SKELETON STYLES (INLINE) ------------------
const skeletonStyle = {
  background: "linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 37%, #e5e7eb 63%)",
  backgroundSize: "400% 100%",
  animation: "shimmer 1.4s ease infinite",
  borderRadius: "8px",
};

const Skeleton = ({ height = 16, width = "100%" }) => (
  <div style={{ ...skeletonStyle, height, width }} />
);

// Inject keyframes once
if (!document.getElementById("skeleton-keyframes")) {
  const style = document.createElement("style");
  style.id = "skeleton-keyframes";
  style.innerHTML = `
    @keyframes shimmer {
      0% { background-position: 100% 0; }
      100% { background-position: -100% 0; }
    }
  `;
  document.head.appendChild(style);
}

export default function StoreHome() {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState({
    keyMetrics: {
      todayOrders: 0,
      todaySales: 0,
      lowStockAlerts: 0,
      totalCustomers: 0,
      activeCustomers: 0,
    },
    salesActivity: [],
    pendingIndents: [],
    lowStockProducts: [],
    quickInsights: {
      pendingReturns: 0,
      activeCustomers: 0,
      avgOrderValue: 0,
      deliveredToday: 0,
    },
    dayWiseSales: [],
    totalSales7Days: 0,
    paymentReports: {
      cashBalance: 0,
      bankBalance: 0,
      recentPayments: [],
      totalPayments: 0,
    },
  });

  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [storeId, setStoreId] = useState(null);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [storePerformance, setStorePerformance] = useState([]);
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const isAdminUser = isAdmin(user);

  useEffect(() => {
    // Get store ID from multiple sources
    try {
      // Try from user context
      const userData = JSON.parse(localStorage.getItem("user") || "{}");
      const user = userData.user || userData;
      let id = user.storeId || user.store?.id;

      // Fallback to selectedStore
      if (!id) {
        const selectedStore = localStorage.getItem("selectedStore");
        if (selectedStore) {
          const store = JSON.parse(selectedStore);
          id = store.id;
        }
      }

      // Fallback to currentStoreId
      if (!id) {
        const currentStoreId = localStorage.getItem("currentStoreId");
        id = currentStoreId ? parseInt(currentStoreId) : null;
      }

      if (id) {
        setStoreId(id);
        console.log("Store ID set:", id);
      } else {
        console.warn("No store ID found");
      }
    } catch (e) {
      console.error("Error getting store ID:", e);
    }
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Fetch dashboard data
  useEffect(() => {
    if (!storeId) return;
    // Fetch dashboard data - storeId can be null for store manager/employee
    fetchDashboardData();
    fetchStorePerformance();
  }, [storeId]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("Fetching dashboard data for storeId:", storeId);
      const response = await storeService.getStoreDashboard(storeId);
      console.log("Dashboard API response:", response);

      if (response.success && response.data) {
        setDashboardData(response.data);
        console.log("Dashboard data set successfully");
      } else {
        const errorMsg = response.message || "Failed to fetch dashboard data";
        console.error("Dashboard API error:", errorMsg);
        setError(errorMsg);
        setIsModalOpen(true);
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        "Failed to fetch dashboard data";
      setError(errorMsg);
      setIsModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchStorePerformance = async () => {
    try {
      const response = await storeService.getStorePerformanceComparison();

      if (response.success && response.data) {
        const mappedData = Array.isArray(response.data)
          ? response.data.map((store) => ({
              storeName: store.store || store.storeName || "-",
              sales: store.sales || 0,
              orders: store.orders || 0,
              performance: store.performance || 0,
            }))
          : [];
        setStorePerformance(mappedData);
      }
    } catch (err) {
      console.error("Error fetching store performance:", err);
      // Don't show error for performance data, just log it
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setError(null);
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // Get user and store information for welcome message
  const [username, setUsername] = useState("");
  const [storeName, setStoreName] = useState("");

  useEffect(() => {
    // Get username from user data
    try {
      const userData = JSON.parse(localStorage.getItem("user") || "{}");
      const user = userData.user || userData;
      const name =
        user?.name ||
        user?.employee_name ||
        user?.username ||
        user?.fullName ||
        "User";
      setUsername(name);
    } catch (e) {
      console.error("Error parsing user data:", e);
      setUsername("User");
    }

    // Get store name from selectedStore
    try {
      const selectedStore = localStorage.getItem("selectedStore");
      if (selectedStore) {
        const store = JSON.parse(selectedStore);
        setStoreName(store.name || "");
      } else {
        // Fallback to currentStoreName
        const currentStoreName = localStorage.getItem("currentStoreName");
        setStoreName(currentStoreName || "");
      }
    } catch (e) {
      console.error("Error parsing store data:", e);
      const currentStoreName = localStorage.getItem("currentStoreName");
      setStoreName(currentStoreName || "");
    }
  }, []);

  // Get greeting based on time
  const hour = new Date().getHours();
  let greeting;
  if (hour < 12) {
    greeting = "Good Morning";
  } else if (hour < 18) {
    greeting = "Good Afternoon";
  } else {
    greeting = "Good Evening";
  }

  // Format current date
  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      {error && (
        <ErrorModal message={error} isOpen={isModalOpen} onClose={closeModal} />
      )}
      <div
        className={`${storeHomeStyles["store-home-container"]} ${isMobile ? storeHomeStyles.mobile : ""}`}
        style={{ padding: isMobile ? "12px" : "20px" }}
      >
        {/* Welcome Message Section */}
        <div
          className={styles.dashboardHeader}
          style={{ marginBottom: "24px" }}
        >
          <div className={styles.welcomeSection}>
            <div className={styles.welcomeText}>
              <h2 className={styles.wish}>
                Hello, {greeting} {username} !! 👋
              </h2>
              <p className={styles.subtitle}>
                Welcome back to {storeName} store ! Here's what's happening with
                your business today.
              </p>
            </div>
          </div>
          <div className={styles.dateTime}>
            <div className={styles.dateIcon}>
              <FaClock />
            </div>
            <div className={styles.currentDate}>{currentDate}</div>
          </div>
        </div>

        {/* Statistics Cards Row */}
        <div className={storeHomeStyles.statsGrid}>
          {/* Card 1: Create Sale */}
          <div
            className={storeHomeStyles.summaryCard}
            onClick={() => navigate("/store/sales?mode=create")}
          >
            <div className={storeHomeStyles.cardIcon}>
              <FaShoppingCart />
            </div>
            <div className={storeHomeStyles.cardContent}>
              <h3>Create Sale</h3>
              <p>New Order</p>
            </div>
          </div>

          {/* Card 4: Closing Stock */}
          <div
            className={storeHomeStyles.summaryCard}
            onClick={() => navigate("/store/stock-summary")}
          >
            <div className={storeHomeStyles.cardIcon}>
              <FaBoxes />
            </div>
            <div className={storeHomeStyles.cardContent}>
              <h3>Closing Stock</h3>
              <p>View Summary</p>
            </div>
          </div>

          {/* Card: Stock Transfer */}
          <div
            className={storeHomeStyles.summaryCard}
            onClick={() => navigate("/store/stock-transfer")}
          >
            <div className={storeHomeStyles.cardIcon}>
              <FaExchangeAlt />
            </div>
            <div className={storeHomeStyles.cardContent}>
              <h3>Stock Transfer</h3>
              <p>Manage Transfers</p>
            </div>
          </div>

          {/* Card 2: Today Sales */}
          <div
            className={storeHomeStyles.summaryCard}
            onClick={() => navigate("/store/sales?mode=orders")}
          >
            <div className={storeHomeStyles.cardIcon}>
              <FaRupeeSign />
            </div>

            <div className={storeHomeStyles.cardContent}>
              <h3>
                {loading ? (
                  <Skeleton width="120px" height={22} />
                ) : (
                  `₹${dashboardData.keyMetrics?.todaySales?.toLocaleString() || 0}`
                )}
              </h3>

              <p>Today Sales</p>
            </div>
          </div>

          {/* Card 3: Stock In */}
          <div
            className={storeHomeStyles.summaryCard}
            onClick={() => navigate("/store/indents/all")}
          >
            <div className={storeHomeStyles.cardIcon}>
              <FaTruck />
            </div>

            <div className={storeHomeStyles.cardContent}>
              <h3>
                {loading ? (
                  <Skeleton width="40px" height={22} />
                ) : (
                  dashboardData.pendingIndents?.length || 0
                )}
              </h3>

              <p>Stock In</p>

              <span
                className={storeHomeStyles.alertIndicator}
                style={{
                  color: "var(--primary-color)",
                  background: "rgba(59, 130, 246, 0.1)",
                }}
              >
                View Available Stock
              </span>
            </div>
          </div>

          {/* Card 5: Available Cash */}
          <div
            className={storeHomeStyles.summaryCard}
            onClick={() => navigate("/store/cashdeposit")}
          >
            <div className={storeHomeStyles.cardIcon}>
              <FaWallet />
            </div>

            <div className={storeHomeStyles.cardContent}>
              <h3>
                {loading ? (
                  <Skeleton width="110px" height={22} />
                ) : (
                  `₹${(dashboardData.paymentReports?.cashBalance || 0).toLocaleString()}`
                )}
              </h3>

              <p>Available Cash</p>

              <span className={storeHomeStyles.statusIndicator}>
                View Details
              </span>
            </div>
          </div>
        </div>

        {/* Main Dashboard Content */}
        <div className={styles.dashboardContainer}>
          <div className={styles.dashboardGrid}>
            {/* Row 1: Sales Activity + Pending Indents */}
            <div className={styles.firstRow}>
              {/* Sales Activity Card */}
              <div className={styles.orderStatusCard}>
                <h4
                  style={{
                    margin: 0,
                    marginBottom: "20px",
                    fontFamily: "Poppins",
                    fontWeight: 600,
                    fontSize: "20px",
                    color: "var(--primary-color)",
                  }}
                >
                  Sales Activity
                </h4>

                <div>
                  {loading ? (
                    // 🔹 Skeleton Loader
                    Array.from({ length: 4 }).map((_, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "12px",
                          borderRadius: "8px",
                          marginBottom: "8px",
                        }}
                      >
                        <div>
                          <Skeleton width="140px" height={14} />
                          <div style={{ marginTop: "6px" }}>
                            <Skeleton width="80px" height={12} />
                          </div>
                        </div>
                        <Skeleton width="60px" height={16} />
                      </div>
                    ))
                  ) : dashboardData.salesActivity &&
                    dashboardData.salesActivity.length > 0 ? (
                    // 🔹 Original Content (UNCHANGED)
                    dashboardData.salesActivity.map((s, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "12px",
                          background:
                            idx % 2 === 0
                              ? "rgba(59, 130, 246, 0.03)"
                              : "transparent",
                          borderRadius: "8px",
                          marginBottom: "8px",
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontWeight: 600,
                              color: "#111827",
                              fontFamily: "Poppins",
                              fontSize: "14px",
                            }}
                          >
                            {s.customerName || "-"}
                          </div>
                          <div
                            style={{
                              fontSize: 12,
                              color: "#6b7280",
                              fontFamily: "Poppins",
                            }}
                          >
                            {s.timeAgo || "-"}
                          </div>
                        </div>
                        <div
                          style={{
                            fontWeight: 700,
                            color: "#059669",
                            fontFamily: "Poppins",
                            fontSize: "16px",
                          }}
                        >
                          ₹{(s.amount || 0).toLocaleString()}
                        </div>
                      </div>
                    ))
                  ) : (
                    // 🔹 Empty State (UNCHANGED)
                    <div
                      style={{
                        padding: "20px",
                        textAlign: "center",
                        color: "#6b7280",
                        fontFamily: "Poppins",
                      }}
                    >
                      No recent sales activity
                    </div>
                  )}
                </div>
              </div>

              {/* Pending Indents Card */}
              <div className={styles.orderStatusCard}>
                <h4
                  style={{
                    margin: 0,
                    marginBottom: "20px",
                    fontFamily: "Poppins",
                    fontWeight: 600,
                    fontSize: "20px",
                    color: "var(--primary-color)",
                  }}
                >
                  Pending Indents
                </h4>

                {loading ? (
                  // 🔹 Skeleton Loader
                  Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "12px",
                        borderRadius: "8px",
                        marginBottom: "8px",
                      }}
                    >
                      <div>
                        <Skeleton width="120px" height={14} />
                        <div style={{ marginTop: "6px" }}>
                          <Skeleton width="80px" height={12} />
                        </div>
                      </div>
                      <Skeleton width="70px" height={16} />
                    </div>
                  ))
                ) : dashboardData.pendingIndents &&
                  dashboardData.pendingIndents.length > 0 ? (
                  // 🔹 Original Content (UNCHANGED)
                  dashboardData.pendingIndents.map((ind, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "12px",
                        background:
                          i % 2 === 0
                            ? "rgba(59, 130, 246, 0.03)"
                            : "transparent",
                        borderRadius: "8px",
                        marginBottom: "8px",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontWeight: 600,
                            color: "#111827",
                            fontFamily: "Poppins",
                            fontSize: "14px",
                          }}
                        >
                          {ind.indentCode || "-"}
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: "#6b7280",
                            fontFamily: "Poppins",
                          }}
                        >
                          {ind.status || "-"}
                        </div>
                      </div>
                      <div
                        style={{
                          fontWeight: 600,
                          color: "var(--primary-color)",
                          fontFamily: "Poppins",
                          fontSize: "16px",
                        }}
                      >
                        ₹{(ind.amount || 0).toLocaleString()}
                      </div>
                    </div>
                  ))
                ) : (
                  // 🔹 Empty State (UNCHANGED)
                  <div
                    style={{
                      padding: "20px",
                      textAlign: "center",
                      color: "#6b7280",
                      fontFamily: "Poppins",
                    }}
                  >
                    No pending indents
                  </div>
                )}
              </div>
            </div>

            {/* Row 2: Low Stock Products + Quick Insights */}
            <div className={styles.secondRow}>
              {/* Row 2: Low Stock Products + Quick Insights */}
              <div className={styles.secondRow}>
                {/* Low Stock Products Card */}
                <div className={styles.orderStatusCard}>
                  <h4
                    style={{
                      margin: 0,
                      marginBottom: "20px",
                      fontFamily: "Poppins",
                      fontWeight: 600,
                      fontSize: "20px",
                      color: "var(--primary-color)",
                    }}
                  >
                    Low Stock Products
                  </h4>

                  <div style={{ overflowX: "auto" }}>
                    <table
                      className="table"
                      style={{ marginBottom: 0, fontFamily: "Poppins" }}
                    >
                      <thead>
                        <tr>
                          <th
                            style={{
                              fontFamily: "Poppins",
                              fontWeight: 600,
                              fontSize: "13px",
                            }}
                          >
                            Product
                          </th>
                          <th
                            style={{
                              fontFamily: "Poppins",
                              fontWeight: 600,
                              fontSize: "13px",
                            }}
                          >
                            Current
                          </th>
                          <th
                            style={{
                              fontFamily: "Poppins",
                              fontWeight: 600,
                              fontSize: "13px",
                            }}
                          >
                            Threshold
                          </th>
                          <th
                            style={{
                              fontFamily: "Poppins",
                              fontWeight: 600,
                              fontSize: "13px",
                            }}
                          >
                            Status
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {loading ? (
                          Array.from({ length: 5 }).map((_, i) => (
                            <tr key={i}>
                              <td>
                                <Skeleton height={14} />
                              </td>
                              <td>
                                <Skeleton height={14} width="40px" />
                              </td>
                              <td>
                                <Skeleton height={14} width="40px" />
                              </td>
                              <td>
                                <Skeleton height={14} width="60px" />
                              </td>
                            </tr>
                          ))
                        ) : dashboardData.lowStockProducts &&
                          dashboardData.lowStockProducts.length > 0 ? (
                          dashboardData.lowStockProducts.map((p, i) => (
                            <tr
                              key={i}
                              style={{
                                background:
                                  i % 2 === 0
                                    ? "rgba(59, 130, 246, 0.03)"
                                    : "transparent",
                              }}
                            >
                              <td
                                style={{
                                  fontFamily: "Poppins",
                                  fontSize: "13px",
                                }}
                              >
                                {p.product || p.productName || "-"}
                              </td>
                              <td
                                style={{
                                  fontFamily: "Poppins",
                                  fontSize: "13px",
                                }}
                              >
                                {p.current || p.currentStock || 0}
                              </td>
                              <td
                                style={{
                                  fontFamily: "Poppins",
                                  fontSize: "13px",
                                }}
                              >
                                {p.threshold || 0}
                              </td>
                              <td>
                                <span
                                  className="badge bg-warning"
                                  style={{
                                    fontFamily: "Poppins",
                                    fontSize: "11px",
                                  }}
                                >
                                  {p.status || "Low"}
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan={4}
                              style={{
                                textAlign: "center",
                                padding: "20px",
                                color: "#6b7280",
                                fontFamily: "Poppins",
                              }}
                            >
                              No low stock products
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Quick Insights Card — KEEP YOUR EXISTING CODE HERE */}
                {/* ⚠️ DO NOT REMOVE THIS CARD OR ITS CLOSING DIV */}
              </div>

              {/* Quick Insights Card */}
              <div className={styles.orderStatusCard}>
                <h4
                  style={{
                    marginBottom: "20px",
                    paddingBottom: "12px",
                    borderBottom: "2px solid var(--primary-color)",
                    fontFamily: "Poppins",
                    fontWeight: 600,
                    fontSize: "20px",
                    color: "var(--primary-color)",
                  }}
                >
                  Quick Insights
                </h4>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 12,
                  }}
                >
                  {loading ? (
                    // 🔹 Skeletons (4 cards)
                    Array.from({ length: 4 }).map((_, i) => (
                      <div
                        key={i}
                        style={{
                          borderRadius: 12,
                          padding: 16,
                          border: "1px solid #e5e7eb",
                        }}
                      >
                        <Skeleton width="100px" height={12} />
                        <div style={{ marginTop: "10px" }}>
                          <Skeleton width="60px" height={24} />
                        </div>
                      </div>
                    ))
                  ) : (
                    <>
                      {/* Pending Returns */}
                      <div
                        style={{
                          background: "rgba(8,145,178,0.08)",
                          borderRadius: 12,
                          padding: 16,
                          border: "1px solid rgba(8,145,178,0.1)",
                        }}
                      >
                        <div
                          style={{
                            fontSize: 12,
                            color: "#0e7490",
                            fontFamily: "Poppins",
                            fontWeight: 500,
                            marginBottom: "8px",
                          }}
                        >
                          Pending Returns
                        </div>
                        <div
                          style={{
                            fontSize: 24,
                            fontWeight: 700,
                            color: "#0e7490",
                            fontFamily: "Poppins",
                          }}
                        >
                          {dashboardData.quickInsights?.pendingReturns || 0}
                        </div>
                      </div>

                      {/* Active Customers */}
                      <div
                        style={{
                          background: "rgba(124,58,237,0.08)",
                          borderRadius: 12,
                          padding: 16,
                          border: "1px solid rgba(124,58,237,0.1)",
                        }}
                      >
                        <div
                          style={{
                            fontSize: 12,
                            color: "#6d28d9",
                            fontFamily: "Poppins",
                            fontWeight: 500,
                            marginBottom: "8px",
                          }}
                        >
                          Active Customers
                        </div>
                        <div
                          style={{
                            fontSize: 24,
                            fontWeight: 700,
                            color: "#6d28d9",
                            fontFamily: "Poppins",
                          }}
                        >
                          {dashboardData.quickInsights?.activeCustomers || 0}
                        </div>
                      </div>

                      {/* Avg Order Value */}
                      <div
                        style={{
                          background: "rgba(217,119,6,0.08)",
                          borderRadius: 12,
                          padding: 16,
                          border: "1px solid rgba(217,119,6,0.1)",
                        }}
                      >
                        <div
                          style={{
                            fontSize: 12,
                            color: "#b45309",
                            fontFamily: "Poppins",
                            fontWeight: 500,
                            marginBottom: "8px",
                          }}
                        >
                          Avg. Order Value
                        </div>
                        <div
                          style={{
                            fontSize: 20,
                            fontWeight: 700,
                            color: "#b45309",
                            fontFamily: "Poppins",
                          }}
                        >
                          ₹
                          {Math.round(
                            dashboardData.quickInsights?.avgOrderValue || 0
                          ).toLocaleString()}
                        </div>
                      </div>

                      {/* Delivered Today */}
                      <div
                        style={{
                          background: "rgba(5,150,105,0.08)",
                          borderRadius: 12,
                          padding: 16,
                          border: "1px solid rgba(5,150,105,0.1)",
                        }}
                      >
                        <div
                          style={{
                            fontSize: 12,
                            color: "#047857",
                            fontFamily: "Poppins",
                            fontWeight: 500,
                            marginBottom: "8px",
                          }}
                        >
                          Delivered Today
                        </div>
                        <div
                          style={{
                            fontSize: 24,
                            fontWeight: 700,
                            color: "#047857",
                            fontFamily: "Poppins",
                          }}
                        >
                          {dashboardData.quickInsights?.deliveredToday || 0}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Row 3: Day-wise Sales Reports + Payment Reports */}
            <div className={styles.firstRow}>
              {/* Day-wise Sales Reports Card */}
              <div className={styles.orderStatusCard}>
                <h4
                  style={{
                    margin: 0,
                    marginBottom: "20px",
                    fontFamily: "Poppins",
                    fontWeight: 600,
                    fontSize: "20px",
                    color: "var(--primary-color)",
                  }}
                >
                  Day-wise Sales Reports
                </h4>

                <div style={{ maxHeight: "350px", overflowY: "auto" }}>
                  {loading ? (
                    // 🔹 Skeleton table
                    <table className="table" style={{ marginBottom: 0 }}>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Orders</th>
                          <th>Sales</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <tr key={i}>
                            <td>
                              <Skeleton height={14} />
                            </td>
                            <td>
                              <Skeleton height={14} width="40px" />
                            </td>
                            <td>
                              <Skeleton height={14} width="80px" />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : dashboardData.dayWiseSales &&
                    dashboardData.dayWiseSales.length > 0 ? (
                    <table
                      className="table"
                      style={{ marginBottom: 0, fontFamily: "Poppins" }}
                    >
                      <thead>
                        <tr>
                          <th style={{ fontWeight: 600, fontSize: "13px" }}>
                            Date
                          </th>
                          <th style={{ fontWeight: 600, fontSize: "13px" }}>
                            Orders
                          </th>
                          <th style={{ fontWeight: 600, fontSize: "13px" }}>
                            Sales
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {dashboardData.dayWiseSales.map((day, i) => (
                          <tr
                            key={i}
                            style={{
                              background:
                                i % 2 === 0
                                  ? "rgba(59, 130, 246, 0.03)"
                                  : "transparent",
                            }}
                          >
                            <td style={{ fontSize: "13px" }}>
                              {day.date || "-"}
                            </td>
                            <td style={{ fontSize: "13px" }}>
                              {day.orders || 0}
                            </td>
                            <td
                              style={{
                                fontSize: "13px",
                                fontWeight: 600,
                                color: "#059669",
                              }}
                            >
                              ₹{(day.sales || 0).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div
                      style={{
                        padding: "20px",
                        textAlign: "center",
                        color: "#6b7280",
                        fontFamily: "Poppins",
                      }}
                    >
                      No sales data available
                    </div>
                  )}
                </div>

                {/* Total */}
                <div
                  style={{
                    marginTop: "16px",
                    paddingTop: "16px",
                    borderTop: "1px solid #e5e7eb",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "#6b7280",
                    }}
                  >
                    Total (7 days)
                  </span>
                  <span
                    style={{
                      fontSize: "16px",
                      fontWeight: 700,
                      color: "var(--primary-color)",
                    }}
                  >
                    {loading ? (
                      <Skeleton width="80px" height={16} />
                    ) : (
                      `₹${(dashboardData.totalSales7Days || 0).toLocaleString()}`
                    )}
                  </span>
                </div>
              </div>

              {/* Payment Reports Card */}
              <div className={styles.orderStatusCard}>
                <h4
                  style={{
                    margin: 0,
                    marginBottom: "20px",
                    fontFamily: "Poppins",
                    fontWeight: 600,
                    fontSize: "20px",
                    color: "var(--primary-color)",
                  }}
                >
                  Payment Reports
                </h4>

                {/* Payment Summary */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 12,
                    marginBottom: "20px",
                  }}
                >
                  {/* Cash */}
                  <div
                    style={{
                      background: "rgba(5,150,105,0.08)",
                      borderRadius: "12px",
                      padding: "16px",
                      border: "1px solid rgba(5,150,105,0.1)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginBottom: "8px",
                      }}
                    >
                      <FaWallet
                        style={{ color: "#047857", fontSize: "16px" }}
                      />
                      <span
                        style={{
                          fontSize: "12px",
                          color: "#047857",
                          fontWeight: 500,
                        }}
                      >
                        Cash
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: "22px",
                        fontWeight: 700,
                        color: "#047857",
                      }}
                    >
                      {loading ? (
                        <Skeleton width="90px" height={22} />
                      ) : (
                        `₹${(dashboardData.paymentReports?.cashBalance || 0).toLocaleString()}`
                      )}
                    </div>
                  </div>

                  {/* Bank */}
                  <div
                    style={{
                      background: "rgba(59, 130, 246,0.08)",
                      borderRadius: "12px",
                      padding: "16px",
                      border: "1px solid rgba(59, 130, 246,0.1)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginBottom: "8px",
                      }}
                    >
                      <FaUniversity
                        style={{ color: "#3b82f6", fontSize: "16px" }}
                      />
                      <span
                        style={{
                          fontSize: "12px",
                          color: "#3b82f6",
                          fontWeight: 500,
                        }}
                      >
                        Bank
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: "22px",
                        fontWeight: 700,
                        color: "#3b82f6",
                      }}
                    >
                      {loading ? (
                        <Skeleton width="90px" height={22} />
                      ) : (
                        `₹${(dashboardData.paymentReports?.bankBalance || 0).toLocaleString()}`
                      )}
                    </div>
                  </div>
                </div>

                {/* Recent Payments */}
                <div
                  style={{ borderTop: "1px solid #e5e7eb", paddingTop: "16px" }}
                >
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "#6b7280",
                      fontFamily: "Poppins",
                      marginBottom: "12px",
                    }}
                  >
                    Recent Payments
                  </div>

                  {loading ? (
                    // 🔹 Skeleton rows
                    Array.from({ length: 4 }).map((_, i) => (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "10px",
                          borderRadius: "8px",
                          marginBottom: "6px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <Skeleton width="50px" height={14} />
                          <Skeleton width="70px" height={12} />
                        </div>
                        <Skeleton width="60px" height={14} />
                      </div>
                    ))
                  ) : dashboardData.paymentReports?.recentPayments &&
                    dashboardData.paymentReports.recentPayments.length > 0 ? (
                    <div>
                      {dashboardData.paymentReports.recentPayments
                        .slice(0, 5)
                        .map((payment, i) => (
                          <div
                            key={i}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "10px",
                              background:
                                i % 2 === 0
                                  ? "rgba(59, 130, 246, 0.03)"
                                  : "transparent",
                              borderRadius: "8px",
                              marginBottom: "6px",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                              }}
                            >
                              <span
                                style={{
                                  padding: "4px 8px",
                                  borderRadius: "4px",
                                  fontSize: "11px",
                                  fontFamily: "Poppins",
                                  fontWeight: 600,
                                  background:
                                    payment.method === "Cash"
                                      ? "rgba(5,150,105,0.1)"
                                      : "rgba(59, 130, 246,0.1)",
                                  color:
                                    payment.method === "Cash"
                                      ? "#047857"
                                      : "#3b82f6",
                                }}
                              >
                                {payment.method}
                              </span>
                              <span
                                style={{
                                  fontSize: "12px",
                                  color: "#6b7280",
                                  fontFamily: "Poppins",
                                }}
                              >
                                {payment.date || "-"}
                              </span>
                            </div>
                            <span
                              style={{
                                fontWeight: 600,
                                color: "#111827",
                                fontFamily: "Poppins",
                                fontSize: "14px",
                              }}
                            >
                              ₹{(payment.amount || 0).toLocaleString()}
                            </span>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div
                      style={{
                        padding: "10px",
                        textAlign: "center",
                        color: "#6b7280",
                        fontFamily: "Poppins",
                        fontSize: "13px",
                      }}
                    >
                      No recent payments
                    </div>
                  )}
                </div>

                {/* Total Payment */}
                <div
                  style={{
                    marginTop: "16px",
                    paddingTop: "16px",
                    borderTop: "1px solid #e5e7eb",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "Poppins",
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "#6b7280",
                    }}
                  >
                    Total Payments
                  </span>

                  <span
                    style={{
                      fontFamily: "Poppins",
                      fontSize: "16px",
                      fontWeight: 700,
                      color: "var(--primary-color)",
                    }}
                  >
                    {loading ? (
                      <Skeleton width="90px" height={16} />
                    ) : (
                      `₹${(dashboardData.paymentReports?.totalPayments || 0).toLocaleString()}`
                    )}
                  </span>
                </div>
              </div>
            </div>
            {isAdminUser && (
              <>
                {/* Row 4: Store-wise Performance */}
                <div className={styles.firstRow}>
                  <div
                    className={styles.orderStatusCard}
                    style={{ gridColumn: "1 / -1" }}
                  >
                    <h4
                      style={{
                        margin: 0,
                        marginBottom: "20px",
                        fontFamily: "Poppins",
                        fontWeight: 600,
                        fontSize: "20px",
                        color: "var(--primary-color)",
                      }}
                    >
                      Store-wise Performance
                    </h4>

                    <div style={{ overflowX: "auto" }}>
                      {loading ? (
                        // 🔹 Skeleton Table
                        <table
                          className="table"
                          style={{ marginBottom: 0, fontFamily: "Poppins" }}
                        >
                          <thead>
                            <tr>
                              <th>Store</th>
                              <th>Sales</th>
                              <th>Orders</th>
                              <th>Performance</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Array.from({ length: 5 }).map((_, i) => (
                              <tr key={i}>
                                <td>
                                  <Skeleton height={14} width="120px" />
                                </td>
                                <td>
                                  <Skeleton height={14} width="80px" />
                                </td>
                                <td>
                                  <Skeleton height={14} width="40px" />
                                </td>
                                <td>
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "8px",
                                    }}
                                  >
                                    <Skeleton height={8} width="100%" />
                                    <Skeleton height={12} width="40px" />
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : storePerformance.length > 0 ? (
                        // 🔹 Original Content (UNCHANGED)
                        <table
                          className="table"
                          style={{ marginBottom: 0, fontFamily: "Poppins" }}
                        >
                          <thead>
                            <tr>
                              <th style={{ fontWeight: 600, fontSize: "13px" }}>
                                Store
                              </th>
                              <th style={{ fontWeight: 600, fontSize: "13px" }}>
                                Sales
                              </th>
                              <th style={{ fontWeight: 600, fontSize: "13px" }}>
                                Orders
                              </th>
                              <th style={{ fontWeight: 600, fontSize: "13px" }}>
                                Performance
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {storePerformance.map((store, i) => (
                              <tr
                                key={i}
                                style={{
                                  background:
                                    i % 2 === 0
                                      ? "rgba(59, 130, 246, 0.03)"
                                      : "transparent",
                                }}
                              >
                                <td
                                  style={{
                                    fontFamily: "Poppins",
                                    fontSize: "13px",
                                    fontWeight: 600,
                                  }}
                                >
                                  {store.storeName || store.store || "-"}
                                </td>
                                <td
                                  style={{
                                    fontFamily: "Poppins",
                                    fontSize: "13px",
                                    fontWeight: 600,
                                    color: "#059669",
                                  }}
                                >
                                  ₹{(store.sales || 0).toLocaleString()}
                                </td>
                                <td
                                  style={{
                                    fontFamily: "Poppins",
                                    fontSize: "13px",
                                  }}
                                >
                                  {store.orders || 0}
                                </td>
                                <td>
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "8px",
                                    }}
                                  >
                                    <div
                                      style={{
                                        flex: 1,
                                        height: "8px",
                                        background: "#e5e7eb",
                                        borderRadius: "4px",
                                        overflow: "hidden",
                                      }}
                                    >
                                      <div
                                        style={{
                                          width: `${store.performance || 0}%`,
                                          height: "100%",
                                          background:
                                            store.performance >= 90
                                              ? "#10b981"
                                              : store.performance >= 70
                                                ? "#f59e0b"
                                                : "#ef4444",
                                          borderRadius: "4px",
                                          transition: "width 0.3s ease",
                                        }}
                                      />
                                    </div>
                                    <span
                                      style={{
                                        fontFamily: "Poppins",
                                        fontSize: "12px",
                                        fontWeight: 600,
                                        color: "#6b7280",
                                        minWidth: "40px",
                                      }}
                                    >
                                      {store.performance || 0}%
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        // 🔹 Empty State (UNCHANGED)
                        <div
                          style={{
                            padding: "20px",
                            textAlign: "center",
                            color: "#6b7280",
                            fontFamily: "Poppins",
                          }}
                        >
                          No store performance data available
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
