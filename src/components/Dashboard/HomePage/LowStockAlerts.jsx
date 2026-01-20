import React, { useState } from "react";
import styles from "./HomePage.module.css";
import { FaExclamationTriangle, FaWarehouse, FaBoxes, FaChevronLeft, FaChevronRight } from "react-icons/fa";

function LowStockAlerts({ lowStockNotifications }) {
  const [currentPage, setCurrentPage] = useState(0);
  const stocksPerPage = 6;

  // Calculate severity based on stock vs threshold ratio
  const calculateSeverity = (stock, threshold) => {
    if (stock <= 0) return "severe"; // Out of stock
    const ratio = stock / threshold;
    if (ratio <= 0.2) return "severe"; // Less than 20% of threshold
    if (ratio <= 0.5) return "warning"; // Less than 50% of threshold
    return "info"; // Above 50% but still below threshold
  };

  const getSeverityIcon = (severity) => {
    return severity === "severe" ? (
      <FaExclamationTriangle className={styles.severeIcon} />
    ) : (
      <FaExclamationTriangle className={styles.mildIcon} />
    );
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "severe":
        return "#ef4444";
      case "warning":
        return "#f59e0b";
      case "info":
        return "#3b82f6";
      default:
        return "#6b7280";
    }
  };

  const getSeverityLabel = (severity) => {
    switch (severity) {
      case "severe":
        return "Critical";
      case "warning":
        return "Warning";
      case "info":
        return "Low Stock";
      default:
        return "Info";
    }
  };

  if (!lowStockNotifications || lowStockNotifications.length === 0) {
    return null;
  }

  const totalPages = Math.ceil(lowStockNotifications.length / stocksPerPage);
  const startIndex = currentPage * stocksPerPage;
  const endIndex = startIndex + stocksPerPage;
  const currentStocks = lowStockNotifications.slice(startIndex, endIndex);

  const goToNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages - 1));
  };

  const goToPrevPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 0));
  };

  return (
    <div className={`col-6 ${styles.bigbox}`}>
      <div className={styles.alertHeader}>
        <h4>Low Stock Alerts</h4>
      </div>
      
      <div className={styles.alertContainer}>
        <div className={styles.stocksGrid}>
          {currentStocks.map((item, index) => {
            const severity = calculateSeverity(item.stock, item.threshold);
            const severityColor = getSeverityColor(severity);
            
            return (
              <div 
                key={startIndex + index} 
                className={styles.stockAlertItem}
                style={{ borderLeft: `3px solid ${severityColor}` }}
              >
                <div 
                  className={styles.stockIndicator}
                  style={{ 
                    backgroundColor: severity === "severe" 
                      ? "rgba(239, 68, 68, 0.1)" 
                      : severity === "warning"
                      ? "rgba(245, 158, 11, 0.1)"
                      : "rgba(59, 130, 246, 0.1)"
                  }}
                >
                  {getSeverityIcon(severity)}
                </div>
                
                <div className={styles.stockContent}>
                  <div className={styles.stockTitle}>
                    <strong>{item.product}</strong>
                    <span 
                      className={styles.stockSeverityTag}
                      style={{ backgroundColor: severityColor }}
                    >
                      {getSeverityLabel(severity)}
                    </span>
                  </div>
                  
                  <div className={styles.stockDetails}>
                    <div className={styles.stockDetail}>
                      <FaWarehouse className={styles.stockDetailIcon} />
                      <span>{item.warehouse}</span>
                    </div>
                    <div className={styles.stockDetail}>
                      <FaBoxes className={styles.stockDetailIcon} />
                      <span>{item.stock} / {item.threshold}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className={styles.paginationControls}>
            <button 
              className={styles.paginationArrow}
              onClick={goToPrevPage}
              disabled={currentPage === 0}
            >
              <FaChevronLeft />
            </button>
            <span className={styles.pageInfo}>
              {currentPage + 1} of {totalPages}
            </span>
            <button 
              className={styles.paginationArrow}
              onClick={goToNextPage}
              disabled={currentPage === totalPages - 1}
            >
              <FaChevronRight />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default LowStockAlerts;
