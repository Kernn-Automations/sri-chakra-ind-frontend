import React, { useState, useEffect } from "react";
import styles from "./InventoryTab.module.css"; // Custom CSS module
import DamagedGoodsModal from "./DamagedGoodsModal";
import { useAuth } from "@/Auth";

function InventoryTab({ inventory = [], warehouse, onInventoryUpdated }) {
  const { axiosAPI } = useAuth();
  const [showDamageSummary, setShowDamageSummary] = useState(false);
  const [damageReports, setDamageReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedReport, setSelectedReport] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Debug logging
  console.log('InventoryTab rendered with:', { inventory: inventory.length, warehouse });

  // Fetch damaged goods reports for this warehouse
  const fetchDamageReports = async () => {
    if (!warehouse?.id) {
      console.log('No warehouse ID available');
      return;
    }
    
    console.log('Fetching damage reports for warehouse:', warehouse.id);
    setLoading(true);
    setError("");
    
    try {
      // ✅ Use the correct endpoint for damage reporting summary
      const response = await axiosAPI.get(`/warehouses/${warehouse.id}/damage-reporting/summary`);
      console.log('Damage reports response:', response.data);
      
      if (response.data && response.data.summary && response.data.summary.reports) {
        console.log('Setting damage reports:', response.data.summary.reports);
        setDamageReports(response.data.summary.reports);
      } else if (response.data && response.data.reports) {
        console.log('Setting damage reports (alternative):', response.data.reports);
        setDamageReports(response.data.reports);
      } else {
        console.log('No damage reports found in response');
        setDamageReports([]);
      }
    } catch (err) {
      console.error('Error fetching damage reports:', err);
      console.error('Error response:', err.response?.data);
      setError(err.response?.data?.message || "Failed to fetch damage reports");
      setDamageReports([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch reports when modal opens
  useEffect(() => {
    if (showDamageSummary) {
      fetchDamageReports();
    }
  }, [showDamageSummary, warehouse?.id]);

  // Open details modal
  const openDetailsModal = (report) => {
    console.log('Opening details modal for report:', report);
    console.log('Proof file path:', report.proofFilePath);
    console.log('Proof file signed URL:', report.proofFileSignedUrl);
    setSelectedReport(report);
    setShowDetailsModal(true);
  };

  // Close details modal
  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedReport(null);
  };

  // Global refresh function for damaged goods
  const refreshDamagedGoods = () => {
    console.log('Refreshing damaged goods...');
    if (showDamageSummary) {
      fetchDamageReports();
    }
  };

  // Make it available globally
  useEffect(() => {
    window.refreshDamagedGoods = refreshDamagedGoods;
    return () => {
      delete window.refreshDamagedGoods;
    };
  }, [showDamageSummary]);
 
  return (
    <div>
    <div className={styles.gridContainer}>
      {inventory.length === 0 ? (
        <div className={styles.emptyState}>No inventory available.</div>
      ) : (
        inventory.map((item, index) => {
          const imageUrl =
            item.images && item.images.length > 0
              ? item.images[0]
              : "/placeholder.png";

          return (
            <div key={index} className={styles.card}>
              <img
                src={imageUrl}
                alt={item.name}
                className={styles.productImage}
              />
              <div className={styles.cardBody}>
                <h5 className={styles.productName}>{item.name}</h5>
                <p className={styles.productDetails}>
                  Quantity: <strong>{item.quantity}</strong>{" "}
                  {item.productType === "packed" ? "packets" : item.unit}
                </p>
                {item.productType === "packed" && (
                  <p className={styles.packInfo}>
                    Pack: {item.packageWeight} {item.packageWeightUnit}
                  </p>
                )}
                <DamagedGoodsModal item={item} warehouse={warehouse} onSuccess={onInventoryUpdated}/>
              </div>
            </div>
          );
        })
        )}
      </div>

      {/* Damage Summary Report Button */}
      <div className={styles.damageSummaryButtonContainer}>
        <button 
          className={styles.damageSummaryButton}
          onClick={() => setShowDamageSummary(true)}
        >
          Damage Summary Report
        </button>
      </div>

      {/* Damage Summary Modal */}
      {showDamageSummary && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>Damage Summary Report</h2>
              <button 
                className={styles.closeButton}
                onClick={() => setShowDamageSummary(false)}
              >
                ×
              </button>
            </div>
            
            <div className={styles.modalBody}>
              {loading ? (
                <div className={styles.loading}>
                  <div className={styles.spinner}></div>
                  <p>Loading damage reports...</p>
                </div>
              ) : error ? (
                <div className={styles.error}>
                  <p><strong>Error:</strong> {error}</p>
                  <button 
                    onClick={fetchDamageReports}
                    style={{
                      marginTop: '10px',
                      padding: '8px 16px',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    🔄 Retry
                  </button>
                </div>
              ) : damageReports.length === 0 ? (
                <div className={styles.noData}>
                  <p>No damage reports found for this warehouse.</p>
                  <button 
                    onClick={fetchDamageReports}
                    style={{
                      marginTop: '10px',
                      padding: '8px 16px',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    🔄 Retry
                  </button>
                </div>
              ) : (
                <div className={styles.reportsContainer}>
                  <div className={styles.summaryStats}>
                    <div className={styles.statCard}>
                      <h3>Total Reports</h3>
                      <span>{damageReports.length}</span>
                    </div>
                    <div className={styles.statCard}>
                      <h3>Total Damaged Quantity</h3>
                      <span>
                        {damageReports.reduce((total, report) => {
                          const quantity = parseFloat(report.damagedQuantity) || 0;
                          return total + quantity;
                        }, 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  
                  <div className={styles.reportsTable}>
                    <table>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Product</th>
                          <th>Damaged Quantity</th>
                          <th>Reason</th>
                          <th>Reported By</th>
                          <th>Proof Image</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {damageReports.map((report) => (
                          <tr key={report.id}>
                            <td>
                              {new Date(report.createdAt).toLocaleDateString()}
                            </td>
                            <td>
                              <div className={styles.productInfo}>
                                <span className={styles.reportProductName}>
                                  {report.productName || 'Unknown Product'}
                                </span>
                                <span className={styles.productSku}>
                                  ID: {report.productId || 'N/A'}
                                </span>
                              </div>
                            </td>
                            <td>
                              <span className={styles.quantity}>
                                {report.damagedQuantity} units
                              </span>
                            </td>
                            <td>{report.reason || 'Not specified'}</td>
                            <td>{report.reportedByName || 'Unknown'}</td>
                            <td>
                              {/* ✅ Display Image if Available */}
                              {report.proofFileSignedUrl ? (
                                <img 
                                  src={report.proofFileSignedUrl} 
                                  alt="Damage Proof"
                                  style={{ width: '50px', height: '50px', objectFit: 'cover', cursor: 'pointer' }}
                                  onClick={() => window.open(report.proofFileSignedUrl, '_blank')}
                                  title="Click to view full image"
                                />
                              ) : report.proofFilePath ? (
                                <img 
                                  src={report.proofFilePath} 
                                  alt="Damage Proof"
                                  style={{ width: '50px', height: '50px', objectFit: 'cover', cursor: 'pointer' }}
                                  onClick={() => window.open(report.proofFilePath, '_blank')}
                                  title="Click to view full image"
                                />
                              ) : (
                                <span style={{ color: '#6b7280', fontStyle: 'italic' }}>No image</span>
                              )}
                            </td>
                            <td>
                              <div className={styles.actions}>
                                <button
                                  className={styles.detailsButton}
                                  title="View Details"
                                  onClick={() => openDetailsModal(report)}
                                >
                                  Details
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedReport && (
        <div className={styles.modalOverlay}>
          <div className={styles.detailsModal}>
            <div className={styles.modalHeader}>
              <h2>Damage Report Details</h2>
              <button 
                className={styles.closeButton}
                onClick={closeDetailsModal}
              >
                ×
              </button>
            </div>
            
            <div className={styles.modalBody}>
              <div className={styles.detailsContainer}>
                <div className={styles.detailRow}>
                  <label>Date:</label>
                  <span>{new Date(selectedReport.createdAt).toLocaleString()}</span>
                </div>
                
                <div className={styles.detailRow}>
                  <label>Product ID:</label>
                  <span>{selectedReport.productId}</span>
                </div>
                
                <div className={styles.detailRow}>
                  <label>Product Name:</label>
                  <span>{selectedReport.productName}</span>
                </div>
                
                <div className={styles.detailRow}>
                  <label>Damaged Quantity:</label>
                  <span className={styles.quantity}>{selectedReport.damagedQuantity} units</span>
                </div>
                
                <div className={styles.detailRow}>
                  <label>Reported By:</label>
                  <span>{selectedReport.reportedByName}</span>
                </div>
                
                <div className={styles.detailRow}>
                  <label>Warehouse:</label>
                  <span>{selectedReport.warehouseName}</span>
                </div>
                
                <div className={styles.detailRow}>
                  <label>Warehouse ID:</label>
                  <span>{selectedReport.warehouseId}</span>
                </div>
                
                <div className={styles.detailRow}>
                  <label>Reason:</label>
                  <span>{selectedReport.reason || 'Not specified'}</span>
                </div>
                
                {/* ✅ Display Image using proofFileSignedUrl */}
                {(selectedReport.proofFileSignedUrl || selectedReport.proofFilePath) ? (
                  <div className={styles.detailRow}>
                    <label>Damage Proof Images:</label>
                    <div className={styles.proofImage}>
                      {selectedReport.proofFileSignedUrl && (
                        <img 
                          src={selectedReport.proofFileSignedUrl} 
                          alt="Damage Proof"
                          className={styles.detailImage}
                          onClick={() => window.open(selectedReport.proofFileSignedUrl, '_blank')}
                          style={{ cursor: 'pointer' }}
                        />
                      )}
                      {selectedReport.proofFilePath && !selectedReport.proofFileSignedUrl && (
                        <img 
                          src={selectedReport.proofFilePath} 
                          alt="Damage Proof"
                          className={styles.detailImage}
                          onClick={() => window.open(selectedReport.proofFilePath, '_blank')}
                          style={{ cursor: 'pointer' }}
                        />
                      )}
                    </div>
                  </div>
                ) : (
                  <div className={styles.detailRow}>
                    <label>Damage Proof Images:</label>
                    <span style={{ color: '#6b7280', fontStyle: 'italic' }}>
                      No damage proof images uploaded for this report
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default InventoryTab;
