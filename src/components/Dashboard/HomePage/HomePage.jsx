import React, { useEffect, useState } from "react";
import styles from "./HomePage.module.css";
import Productbox from "./Productbox";
import Customers from "./Customers";
import ProductBarchart from "./ProductBarchart";
import PaymentApprovals from "./PaymentApprovals";
import Loading from "@/components/Loading";
import ErrorModal from "@/components/ErrorModal";
import { useAuth } from "@/Auth";
import { useDivision } from "@/components/context/DivisionContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import HomePageSkeleton from "@/components/SkeletonLoaders/HomePageSkeleton";
import LowStockAlerts from "./LowStockAlerts";
import { 
  FaChartLine, 
  FaUsers, 
  FaShoppingCart, 
  FaTruck, 
  FaExclamationTriangle,
  FaCheckCircle,
  FaClock,
  FaBoxes,
  FaWarehouse,
  FaUserCheck,
  FaUserClock,
  FaUserTimes,
  FaRupeeSign
} from "react-icons/fa";

function HomePage() {
  const hour = new Date().getHours();
  let wish;
  const user = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();

  if (hour < 12) {
    wish = "Good Morning";
  } else if (hour < 18) {
    wish = "Good Afternoon";
  } else {
    wish = "Good Evening";
  }

  // Backend
  const { axiosAPI } = useAuth();
  const { selectedDivision, showAllDivisions } = useDivision();
  
  // Add logging for division context
  useEffect(() => {
    console.log('HomePage - Division context updated:', {
      selectedDivision,
      showAllDivisions,
      selectedDivisionId: selectedDivision?.id,
      timestamp: new Date().toISOString()
    });
  }, [selectedDivision, showAllDivisions]);
  
  // Listen for division change events to refresh data
  useEffect(() => {
    const handleRefreshData = (event) => {
      console.log('HomePage - Received refreshData event:', event.detail);
      // The existing useEffect will automatically refetch data when selectedDivision changes
    };

    window.addEventListener('refreshData', handleRefreshData);
    return () => {
      window.removeEventListener('refreshData', handleRefreshData);
    };
  }, []);

  const [error, setError] = useState();
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const closeModal = () => {
    setIsModalOpen(false);
  };
  const [successful, setSuccessful] = useState();

  const formData = new FormData();

  // Updated state to match backend response structure
  const [dashboardData, setDashboardData] = useState({
    totalOrders: 0,
    totalSales: 0,
    totalProducts: 0,
    lowStockProducts: 0,
    customers: {
      total: 0,
      active: 0,
      kycPending: 0,
      inactive: 0,
      rejected: 0
    },
    orderStatuses: {
      pendingPaymentApprovals: 0,
      waitingForDelivery: 0,
      waitingForDispatch: 0,
      confirmed: 0,
      dispatched: 0,
      delivered: 0
    },
    topSellingProducts: [],
    topPerformingBOs: [],
    lowStockAlerts: []
  });

  const VITE_API = import.meta.env.VITE_API_URL;

  // Function to handle order status click navigation
  const handleOrderStatusClick = (status) => {
    // Map homepage status values to backend status values
    const statusMapping = {
      'confirmed': 'Confirmed',
      'dispatched': 'Dispatched', 
      'delivered': 'Delivered',
      'pendingPaymentApprovals': 'pendingPaymentApprovals'
    };
    
    const mappedStatus = statusMapping[status] || status;
    navigate(`/sales/orders?status=${mappedStatus}`);
  };

  useEffect(() => {
    async function fetchInitial() {
      try {
        setLoading(true);
        
        // ✅ Get division ID for filtering
        const divisionId = selectedDivision?.id;
        
        // ✅ Wait for division to be available
        if (!divisionId) {
          setLoading(false);
          return;
        }
        
        // ✅ Build URL with division parameters
        let url = "/dashboard/home";
        console.log('HomePage - Building URL with:', {
          divisionId,
          divisionIdType: typeof divisionId,
          showAllDivisions,
          isDivisionIdAll: divisionId === "all",
          isDivisionIdAllStrict: divisionId === "all",
          isDivisionIdAllLoose: divisionId == "all"
        });
        
        if (showAllDivisions || divisionId === "all") {
          url += "?showAllDivisions=true";
          console.log('HomePage - Using showAllDivisions=true for URL');
        } else if (divisionId) {
          url += `?divisionId=${divisionId}`;
          console.log('HomePage - Using divisionId for URL:', divisionId);
        }
        
        console.log('HomePage - Final URL built:', url);
        
        const res = await axiosAPI.get(url);
        console.log('HomePage - Backend response:', res.data);
        console.log('HomePage - Division context:', {
          selectedDivisionId: selectedDivision?.id,
          showAllDivisions,
          isAllDivisions: showAllDivisions || selectedDivision?.id === "all"
        });

        // Map the new backend response structure
        setDashboardData(res.data);
        
        // Log the mapped data for verification
        console.log('HomePage - Mapped dashboard data:', {
          totalOrders: res.data.totalOrders,
          totalSales: res.data.totalSales,
          totalProducts: res.data.totalProducts,
          lowStockProducts: res.data.lowStockProducts,
          customers: res.data.customers,
          orderStatuses: res.data.orderStatuses,
          topSellingProductsCount: res.data.topSellingProducts?.length,
          topPerformingBOsCount: res.data.topPerformingBOs?.length,
          lowStockAlertsCount: res.data.lowStockAlerts?.length
        });
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        setError(err?.response?.data?.message || "Failed to load Dashboard.");
        setIsModalOpen(true);
      } finally {
        setLoading(false);
      }
    }
    
    // ✅ Only fetch if division is selected
    if (selectedDivision?.id) {
      fetchInitial();
    }
    // ✅ Don't set loading to true when waiting for division - just wait
  }, [selectedDivision, showAllDivisions]); // ✅ Add dependencies

  // ✅ Monitor division changes and fetch data when division is selected
  useEffect(() => {
    const divisionId = selectedDivision?.id;
    if (divisionId && !loading) {
      // Trigger data fetch when division changes
      const fetchData = async () => {
        try {
          setLoading(true);
          
          let url = "/dashboard/home";
          if (showAllDivisions || divisionId === "all") {
            url += "?showAllDivisions=true";
            console.log('HomePage - Refetch using showAllDivisions=true for URL');
          } else if (divisionId) {
            url += `?divisionId=${divisionId}`;
            console.log('HomePage - Refetch using divisionId for URL:', divisionId);
          }
          
          console.log('HomePage - Refetch final URL built:', url);
          
          const res = await axiosAPI.get(url);
          console.log('HomePage - Refetch backend response:', res.data);
          console.log('HomePage - Refetch division context:', {
            selectedDivisionId: selectedDivision?.id,
            showAllDivisions,
            isAllDivisions: showAllDivisions || selectedDivision?.id === "all"
          });

          // Map the new backend response structure
          setDashboardData(res.data);
          
          // Log the mapped data for verification
          console.log('HomePage - Refetch mapped dashboard data:', {
            totalOrders: res.data.totalOrders,
            totalSales: res.data.totalSales,
            totalProducts: res.data.totalProducts,
            lowStockProducts: res.data.lowStockProducts,
            customers: res.data.customers,
            orderStatuses: res.data.orderStatuses,
            topSellingProductsCount: res.data.topSellingProducts?.length,
            topPerformingBOsCount: res.data.topPerformingBOs?.length,
            lowStockAlertsCount: res.data.lowStockAlerts?.length
          });
        } catch (err) {
          console.error("Dashboard refetch error:", err);
          setError(err?.response?.data?.message || "Failed to reload Dashboard.");
          setIsModalOpen(true);
        } finally {
          setLoading(false);
        }
      };
      
      fetchData();
    }
  }, [selectedDivision?.id]); // ✅ Monitor division ID changes

  // Mock data for demonstration - replace with actual API calls
  const mockChartData = {
    salesTrend: [12, 19, 3, 5, 2, 3, 15, 8, 12, 15, 18, 22],
    productPerformance: [
      { name: 'Curd', value: 120, color: '#3B82F6' },
      { name: 'Butter', value: 280, color: '#F59E0B' },
      { name: 'Milk Powder', value: 150, color: '#10B981' },
      { name: 'Ghee', value: 80, color: '#8B5CF6' },
      { name: 'Butter Milk', value: 200, color: '#06B6D4' }
    ],
    procurementQuality: {
      fat: 3.8,
      snf: 8.5,
      protein: 3.2,
      lactose: 4.8
    }
  };

  return (
    <>
      <div className={styles.dashboardHeader}>
        <div className={styles.welcomeSection}>
          {/* <div className={styles.welcomeIcon}>
            <FaChartLine />
          </div> */}
          <div className={styles.welcomeText}>
            <h2 className={styles.wish}>
              Hello, {wish} {user?.name} !! 👋
            </h2>
            <p className={styles.subtitle}>
              Welcome back! Here's what's happening with your business today.
            </p>
          </div>
        </div>
        <div className={styles.dateTime}>
          <div className={styles.dateIcon}>
            <FaClock />
          </div>
          <div className={styles.currentDate}>
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>

        </div>
      </div>
      
      {/* ✅ Show loading when waiting for division */}
      {!selectedDivision?.id && (
        <div className={styles.divisionAlert}>
          <div className="alert alert-info">
            <strong>Please select a division to view dashboard data</strong>
            <br />
            <small>Waiting for division selection...</small>
          </div>
        </div>
      )}
      
      {/* Show message for divisions with no activity - only after data is loaded */}
      {selectedDivision?.id && !loading && dashboardData.totalOrders === 0 && dashboardData.totalSales === 0 && (
        <div className={styles.divisionAlert}>
          <div className="alert alert-warning">
            <strong>No Activity Data Available</strong>
            <br />
            <small>
              This division currently has no orders or sales data. 
              {dashboardData.totalProducts > 0 && ` However, ${dashboardData.totalProducts} products are available for sale.`}
            </small>
          </div>
        </div>
      )}
      
      {/* Show actual content only when we have data and not loading */}
      {!loading && (dashboardData.totalOrders > 0 || dashboardData.totalSales > 0 || dashboardData.totalProducts > 0 || dashboardData.customers?.total > 0) && (
        <>
          {/* Statistics Cards Row */}
          <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <FaShoppingCart />
          </div>
          <div className={styles.statContent}>
            <h3>{dashboardData.totalOrders?.toLocaleString() || 0}</h3>
            <p>Total Orders</p>
            <span className={styles.statusIndicator}>
              {dashboardData.orderStatuses?.confirmed || 0} confirmed
            </span>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <FaRupeeSign />
          </div>
          <div className={styles.statContent}>
            <h3>₹{dashboardData.totalSales?.toLocaleString() || 0}</h3>
            <p>Total Sales</p>
            <span className={styles.statusIndicator}>
              {dashboardData.orderStatuses?.delivered || 0} delivered
            </span>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <FaBoxes />
          </div>
          <div className={styles.statContent}>
            <h3>{dashboardData.totalProducts?.toLocaleString() || 0}</h3>
            <p>Total Products</p>
            <span className={styles.alertIndicator}>
              {dashboardData.lowStockProducts || 0} low stock
            </span>
            {dashboardData.totalProducts > 0 && dashboardData.totalOrders === 0 && (
              <span className={styles.infoIndicator} style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px', display: 'block' }}>
                Products available for sale
              </span>
            )}
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <FaUsers />
          </div>
          <div className={styles.statContent}>
            <h3>{dashboardData.customers?.total?.toLocaleString() || 0}</h3>
            <p>Total Customers</p>
            <span className={styles.statusIndicator}>
              {dashboardData.customers?.active || 0} active
            </span>
          </div>
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div className={styles.dashboardContainer}>
        <div className={styles.dashboardGrid}>
          {/* Row 1: Product Card + Order Status Overview with Customers */}
          <div className={styles.firstRow}>
            <Productbox products={dashboardData.topSellingProducts} />
            <div className={styles.orderStatusCard}>
              <h4>Order Status Overview</h4>
              {dashboardData.totalOrders === 0 ? (
                <div className={styles.noDataMessage}>
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '20px', 
                    color: '#6b7280',
                    fontSize: '14px'
                  }}>
                    <FaShoppingCart style={{ fontSize: '24px', marginBottom: '8px', opacity: 0.5 }} />
                    <p>No orders found for this division</p>
                    <small>Start creating orders to see activity here</small>
                  </div>
                </div>
              ) : (
                <div className={styles.orderStatusGrid}>
                  <div 
                    className={styles.statusItem} 
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleOrderStatusClick('confirmed')}
                    title="Click to view confirmed orders"
                  >
                    <div className={styles.statusIcon} style={{ backgroundColor: "rgba(59, 130, 246, 0.1)", color: "#3b82f6" }}>
                      <FaClock />
                    </div>
                    <div className={styles.statusInfo}>
                      <h5>{dashboardData.orderStatuses?.confirmed || 0}</h5>
                      <p>Confirmed</p>
                    </div>
                  </div>
                  <div 
                    className={styles.statusItem} 
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleOrderStatusClick('dispatched')}
                    title="Click to view dispatched orders"
                  >
                    <div className={styles.statusIcon} style={{ backgroundColor: "rgba(245, 158, 11, 0.1)", color: "#f59e0b" }}>
                      <FaTruck />
                    </div>
                    <div className={styles.statusInfo}>
                      <h5>{dashboardData.orderStatuses?.dispatched || 0}</h5>
                      <p>Dispatched</p>
                    </div>
                  </div>
                  <div 
                    className={styles.statusItem} 
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleOrderStatusClick('delivered')}
                    title="Click to view delivered orders"
                  >
                    <div className={styles.statusIcon} style={{ backgroundColor: "rgba(34, 197, 94, 0.1)", color: "#22c55e" }}>
                      <FaCheckCircle />
                    </div>
                    <div className={styles.statusInfo}>
                      <h5>{dashboardData.orderStatuses?.delivered || 0}</h5>
                      <p>Delivered</p>
                    </div>
                  </div>
                  <div 
                    className={styles.statusItem} 
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleOrderStatusClick('pendingPaymentApprovals')}
                    title="Click to view payment pending orders"
                  >
                    <div className={styles.statusIcon} style={{ backgroundColor: "rgba(239, 68, 68, 0.1)", color: "#ef4444" }}>
                      <FaExclamationTriangle />
                    </div>
                    <div className={styles.statusInfo}>
                      <h5>{dashboardData.orderStatuses?.pendingPaymentApprovals || 0}</h5>
                      <p>Payment Pending</p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className={styles.customersSection}>
                <h4>Customers</h4>
                {dashboardData.customers?.total === 0 ? (
                  <div className={styles.noDataMessage}>
                    <div style={{ 
                      textAlign: 'center', 
                      padding: '15px', 
                      color: '#6b7280',
                      fontSize: '13px'
                    }}>
                      <FaUsers style={{ fontSize: '20px', marginBottom: '6px', opacity: 0.5 }} />
                      <p>No customers registered</p>
                      <small>Start adding customers to see data here</small>
                    </div>
                  </div>
                ) : (
                  <div className={styles.customersGrid}>
                    <div className={styles.customerMetric}>
                      <div className={styles.metricIcon} style={{ backgroundColor: "rgba(59, 130, 246, 0.1)" }}>
                        <FaUsers style={{ color: "#3b82f6" }} />
                      </div>
                      <div className={styles.metricContent}>
                        <h6>{dashboardData.customers?.total || 0}</h6>
                        <p>Total Customers</p>
                      </div>
                    </div>
                    <div className={styles.customerMetric}>
                      <div className={styles.metricIcon} style={{ backgroundColor: "rgba(34, 197, 94, 0.1)" }}>
                        <FaUserCheck style={{ color: "#22c55e" }} />
                      </div>
                      <div className={styles.metricContent}>
                        <h6>{dashboardData.customers?.active || 0}</h6>
                        <p>Active Customers</p>
                      </div>
                    </div>
                    <div className={styles.customerMetric}>
                      <div className={styles.metricIcon} style={{ backgroundColor: "rgba(245, 158, 11, 0.1)" }}>
                        <FaUserClock style={{ color: "#f59e0b" }} />
                      </div>
                      <div className={styles.metricContent}>
                        <h6>{dashboardData.customers?.kycPending || 0}</h6>
                        <p>KYC Pending</p>
                      </div>
                    </div>
                    <div className={styles.customerMetric}>
                      <div className={styles.metricIcon} style={{ backgroundColor: "rgba(239, 68, 68, 0.1)" }}>
                        <FaUserTimes style={{ color: "#ef4444" }} />
                      </div>
                      <div className={styles.metricContent}>
                        <h6>{dashboardData.customers?.rejected || 0}</h6>
                        <p>KYC Rejected</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Row 2: Low Stock Alerts + Top Performers */}
          <div className={styles.secondRow}>
            <LowStockAlerts lowStockNotifications={dashboardData.lowStockAlerts} />
            <div className={styles.orderStatusCard}>
              <h4 style={{ margin: 0, marginBottom: '20px', fontFamily: 'Poppins', fontWeight: 600, fontSize: '20px', color: 'var(--primary-color)' }}>Top Performers</h4>
              {dashboardData.topPerformingBOs?.length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '20px', 
                  color: '#6b7280',
                  fontSize: '14px',
                  fontFamily: 'Poppins'
                }}>
                  <FaUsers style={{ fontSize: '24px', marginBottom: '8px', opacity: 0.5 }} />
                  <p>No sales activity yet</p>
                  <small>Start generating sales to see top performers here</small>
                </div>
              ) : (
                <div>
                  {dashboardData.topPerformingBOs?.slice(0, 5).map((bo, index) => (
                    <div key={index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: index % 2 === 0 ? 'rgba(59, 130, 246, 0.03)' : 'transparent', borderRadius: '8px', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--primary-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 600, fontFamily: 'Poppins', flexShrink: 0 }}>{index + 1}</div>
                        <div>
                          <div style={{ fontWeight: 600, color: '#111827', fontFamily: 'Poppins', fontSize: '14px' }}>{bo.name}</div>
                          <div style={{ fontSize: 12, color: '#6b7280', fontFamily: 'Poppins' }}>₹{bo.sales?.toLocaleString()}</div>
                        </div>
                      </div>
                      <div style={{ width: '60px', height: '6px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '4px', overflow: 'hidden', flexShrink: 0 }}>
                        <div style={{ height: '100%', background: 'var(--primary-color)', borderRadius: '4px', width: `${(bo.sales / (dashboardData.topPerformingBOs[0]?.sales || 1)) * 100}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Row 3: Empty (removed Performance Overview) */}
          <div className={styles.thirdRow}>
            {/* Performance Overview card removed */}
          </div>
        </div>
      </div>
        </>
      )}

      {/* Bottom Row */}
      
        
        {/* <div className={styles.systemAlerts}>
          <h4>System Alerts</h4>
          <div className={styles.alertsList}>
            <div className={styles.alertItem}>
              <FaExclamationTriangle className={styles.alertIcon} />
              <span>Low stock alert for Butter</span>
            </div>
            <div className={styles.alertItem}>
              <FaExclamationTriangle className={styles.alertIcon} />
              <span>Payment overdue for Supplier A</span>
            </div>
            <div className={styles.alertItem}>
              <FaExclamationTriangle className={styles.alertIcon} />
              <span>Quality check required for new batch</span>
            </div>
          </div>
        </div> */}
      

      {isModalOpen && (
        <ErrorModal isOpen={isModalOpen} message={error} onClose={closeModal} />
      )}

      {/* Show skeleton when loading OR when no data is available yet */}
      {(loading || (!dashboardData.totalOrders && !dashboardData.totalSales && !dashboardData.totalProducts && !dashboardData.customers?.total)) && (
        <HomePageSkeleton />
      )}
    </>
  );
}

export default HomePage;

