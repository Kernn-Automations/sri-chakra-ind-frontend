import React, { useState } from "react";
import styles from "./WarehouseActivityTab.module.css";
import { format } from "date-fns";
import {
  FaArrowUp,
  FaArrowDown,
  FaCheckCircle,
  FaFileInvoice,
  FaTruck,
  FaShippingFast,
  FaBoxOpen,
  FaWarehouse,
  FaMinusCircle,
  FaSignInAlt,
  FaSignOutAlt
} from "react-icons/fa";

const getIconAndColor = (activityType) => {
  switch (activityType) {
    case "StockTransferSent":
      return { icon: <FaArrowUp />, color: "#e74c3c" }; // red
    case "StockTransferReceived":
      return { icon: <FaArrowDown />, color: "#27ae60" }; // green
    case "PurchaseOrderRaised":
      return { icon: <FaFileInvoice />, color: "#3498db" }; // blue
    case "PurchaseOrderStockIn":
      return { icon: <FaWarehouse />, color: "#2ecc71" };
    case "SalesOrderConfirmed":
      return { icon: <FaCheckCircle />, color: "#2980b9" };
    case "SalesOrderTransferred":
      return { icon: <FaExchangeAlt />, color: "#f39c12" }; // 🔁 new
    case "SalesOrderDispatched":
      return { icon: <FaShippingFast />, color: "#8e44ad" };
    case "SalesOrderDelivered":
      return { icon: <FaBoxOpen />, color: "#27ae60" };
    case "InventoryStockOut":
      return { icon: <FaSignOutAlt />, color: "#c0392b" }; // 📦 stock out
    case "OrderTransferIn":
      return { icon: <FaSignInAlt />, color: "#16a085" }; // 🟢 into warehouse
    case "OrderTransferOut":
      return { icon: <FaSignOutAlt />, color: "#d35400" }; // 🔴 out of warehouse
    default:
      return { icon: <FaFileInvoice />, color: "#7f8c8d" };
  }
};

const groupByDate = (activities) => {
  const grouped = {};
  activities.forEach((log) => {
    const date = format(new Date(log.createdAt), "dd MMM yyyy");
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(log);
  });
  return grouped;
};

// Filter Component
function ActivityFilters({ filters, onApplyFilters, onReset }) {
  const [localFilters, setLocalFilters] = useState({
    fromDate: filters.fromDate || '',
    toDate: filters.toDate || '',
    entity: filters.entity || ''
  });

  const handleFilterChange = (field, value) => {
    const newFilters = { ...localFilters, [field]: value };
    setLocalFilters(newFilters);
    // Do NOT refresh data immediately - only update local state
  };

  const handleSubmit = () => {
    // Only refresh data when Submit button is clicked
    onApplyFilters(localFilters);
  };

  const handleCancel = () => {
    // Reset local filters to original values without refreshing data
    setLocalFilters({
      fromDate: filters.fromDate || '',
      toDate: filters.toDate || '',
      entity: filters.entity || ''
    });
  };

  return (
    <div className={styles.filterContainer}>
      <div className={styles.filterRow}>
        <div className={styles.filterField}>
          <label>From Date:</label>
          <input
            type="date"
            value={localFilters.fromDate}
            onChange={(e) => handleFilterChange('fromDate', e.target.value)}
          />
        </div>
        <div className={styles.filterField}>
          <label>To Date:</label>
          <input
            type="date"
            value={localFilters.toDate}
            onChange={(e) => handleFilterChange('toDate', e.target.value)}
          />
        </div>
        <div className={styles.filterField}>
          <label>Entity:</label>
          <select
            value={localFilters.entity}
            onChange={(e) => handleFilterChange('entity', e.target.value)}
          >
            <option value="">-- All --</option>
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="30">30</option>
            <option value="40">40</option>
            <option value="50">50</option>
          </select>
        </div>
        <div className={styles.filterActions}>
          <button className={styles.submitButton} onClick={handleSubmit}>
            Submit
          </button>
          <button className={styles.cancelButton} onClick={handleCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function WarehouseActivityTab({ activities = [], filters = {}, onApplyFilters, loading = false }) {
  if (!activities.length && !loading)
    return (
      <div>
        <ActivityFilters 
          filters={filters} 
          onApplyFilters={onApplyFilters}
        />
        <div className={styles.empty}>No activity recorded.</div>
      </div>
    );

  const groupedActivities = groupByDate(activities);

  return (
    <div className={styles.activityContainer}>
      <ActivityFilters 
        filters={filters} 
        onApplyFilters={onApplyFilters}
      />
      {loading ? (
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading activities...</p>
        </div>
      ) : (
        Object.entries(groupedActivities).map(([date, logs]) => (
        <div key={date} className={styles.dateGroup}>
          <h6 className={styles.dateHeader}>{date}</h6>
          <ul className={styles.activityList}>
            {logs.map((log, index) => {
              const { icon, color } = getIconAndColor(log.activityType);
              const activityName = log.activityType?.replace(/([A-Z])/g, " $1");

              return (
                <li key={index} className={styles.activityItem}>
                  <div className={styles.header}>
                    <span className={styles.type} style={{ color }}>
                      {icon} {activityName}
                    </span>
                    <span className={styles.time}>
                      {format(new Date(log.createdAt), "hh:mm a")}
                    </span>
                  </div>
                  <div className={styles.body}>
                    {log.orderId && (
                      <div>
                        <strong>Order ID:</strong> {log.orderId}
                      </div>
                    )}
                    {log.productId && (
                      <div>
                        <strong>Product Name:</strong> {log.productName}
                      </div>
                    )}
                    {log.quantity && (
                      <div>
                        <strong>Quantity:</strong> {log.quantity}
                      </div>
                    )}
                    {log.description && (
                      <div>
                        <strong>Description:</strong> {log.description}
                      </div>
                    )}
                    {log.createdBy && (
                      <div>
                        <strong>Created By:</strong> {log.createdBy}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ))
      )}
    </div>
  );
}

export default WarehouseActivityTab;
