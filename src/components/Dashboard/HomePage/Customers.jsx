import React from "react";
import styles from "./HomePage.module.css";
import { useNavigate } from "react-router-dom";
import { 
  FaUsers, 
  FaUserCheck, 
  FaUserClock, 
  FaUserTimes, 
  FaUserSlash 
} from "react-icons/fa";

function Customers({ kycApprovals, dashboardStats }) {
  const navigate = useNavigate();
  
  // Get customer metrics from division data
  const customerMetrics = {
    totalCustomers: dashboardStats?.totalCustomers || 0,
    activeCustomers: dashboardStats?.activeCustomers || 0,
    kycPending: kycApprovals?.length || 0,
    kycRejected: dashboardStats?.kycRejected || 0,
    inactiveCustomers: dashboardStats?.inactiveCustomers || 0
  };

  const handleCardClick = () => {
    navigate("/customers");
  };

  return (
    <div className={`col-6 ${styles.bigbox}`} onClick={handleCardClick}>
      <h4>Customers</h4>
      <div className={styles.customersGrid}>
        <div className={styles.customerMetric}>
          <div className={styles.metricIcon} style={{ backgroundColor: "rgba(59, 130, 246, 0.1)" }}>
            <FaUsers style={{ color: "#3b82f6" }} />
          </div>
          <div className={styles.metricContent}>
            <h6>{customerMetrics.totalCustomers}</h6>
            <p>Total Customers</p>
          </div>
        </div>

        <div className={styles.customerMetric}>
          <div className={styles.metricIcon} style={{ backgroundColor: "rgba(34, 197, 94, 0.1)" }}>
            <FaUserCheck style={{ color: "#22c55e" }} />
          </div>
          <div className={styles.metricContent}>
            <h6>{customerMetrics.activeCustomers}</h6>
            <p>Active Customers</p>
          </div>
        </div>

        <div className={styles.customerMetric}>
          <div className={styles.metricIcon} style={{ backgroundColor: "rgba(245, 158, 11, 0.1)" }}>
            <FaUserClock style={{ color: "#f59e0b" }} />
          </div>
          <div className={styles.metricContent}>
            <h6>{customerMetrics.kycPending}</h6>
            <p>KYC Pending</p>
          </div>
        </div>

        <div className={styles.customerMetric}>
          <div className={styles.metricIcon} style={{ backgroundColor: "rgba(239, 68, 68, 0.1)" }}>
            <FaUserTimes style={{ color: "#ef4444" }} />
          </div>
          <div className={styles.metricContent}>
            <h6>{customerMetrics.kycRejected}</h6>
            <p>KYC Rejected</p>
          </div>
        </div>

        <div className={styles.customerMetric}>
          <div className={styles.metricIcon} style={{ backgroundColor: "rgba(107, 114, 128, 0.1)" }}>
            <FaUserSlash style={{ color: "#6b7280" }} />
          </div>
          <div className={styles.metricContent}>
            <h6>{customerMetrics.inactiveCustomers}</h6>
            <p>Inactive Customers</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Customers;
