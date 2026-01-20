import React, { useState, useMemo } from 'react';
import styles from './Returns.module.css';
import xls from '../../../images/xls-png.png';
import pdf from '../../../images/pdf-png.png';
import { handleExportExcel, handleExportPDF } from '../../../utils/PDFndXLSGenerator';

const ReturnReports = ({ returns, returnTypes }) => {
  const [reportType, setReportType] = useState('summary');
  const [dateRange, setDateRange] = useState('30');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Calculate date range
  const getDateRange = (days) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    return { startDate, endDate };
  };

  // Filter returns based on selected criteria
  const filteredReturns = useMemo(() => {
    const { startDate, endDate } = getDateRange(parseInt(dateRange));
    
    return returns.filter(returnItem => {
      const returnDate = new Date(returnItem.createdAt);
      const dateMatch = returnDate >= startDate && returnDate <= endDate;
      const typeMatch = selectedType === 'all' || 
        (selectedType === 'damaged' && returnItem.returnReason?.includes('DAMAGE')) ||
        (selectedType === 'expired' && returnItem.returnReason?.includes('EXPIR')) ||
        (selectedType === 'quality' && returnItem.returnReason?.includes('QUALITY')) ||
        (selectedType === 'cancellation' && returnItem.returnReason?.includes('CANCELLATION'));
      const statusMatch = selectedStatus === 'all' || returnItem.status === selectedStatus;
      
      return dateMatch && typeMatch && statusMatch;
    });
  }, [returns, dateRange, selectedType, selectedStatus]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const stats = {
      totalReturns: filteredReturns.length,
      totalAmount: filteredReturns.reduce((sum, r) => {
        const itemAmount = r.returnItems?.reduce((itemSum, item) => 
          itemSum + (item.returnQuantity * (item.product?.unitPrice || 0)), 0) || 0;
        return sum + itemAmount;
      }, 0),
      pendingReturns: filteredReturns.filter(r => r.status === 'pending').length,
      approvedReturns: filteredReturns.filter(r => r.status === 'approved').length,
      rejectedReturns: filteredReturns.filter(r => r.status === 'rejected').length,
      processingReturns: filteredReturns.filter(r => r.status === 'processing').length,
      completedReturns: filteredReturns.filter(r => r.status === 'completed').length,
      byType: {},
      byStatus: {},
      byMonth: {},
      averageAmount: 0
    };

    // Calculate by type (based on return reason)
    filteredReturns.forEach(returnItem => {
      let type = 'other';
      if (returnItem.returnReason?.includes('DAMAGE')) type = 'damaged';
      else if (returnItem.returnReason?.includes('EXPIR')) type = 'expired';
      else if (returnItem.returnReason?.includes('QUALITY')) type = 'quality';
      else if (returnItem.returnReason?.includes('CANCELLATION')) type = 'cancellation';
      
      stats.byType[type] = (stats.byType[type] || 0) + 1;
    });

    // Calculate by status
    filteredReturns.forEach(returnItem => {
      stats.byStatus[returnItem.status] = (stats.byStatus[returnItem.status] || 0) + 1;
    });

    // Calculate by month
    filteredReturns.forEach(returnItem => {
      const month = new Date(returnItem.createdAt).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short' 
      });
      stats.byMonth[month] = (stats.byMonth[month] || 0) + 1;
    });

    // Calculate average amount
    if (stats.totalReturns > 0) {
      stats.averageAmount = stats.totalAmount / stats.totalReturns;
    }

    return stats;
  }, [filteredReturns]);

  // Get top return reasons
  const topReturnReasons = useMemo(() => {
    const reasons = {};
    filteredReturns.forEach(returnItem => {
      const reason = returnItem.returnReason || 'Not specified';
      reasons[reason] = (reasons[reason] || 0) + 1;
    });

    return Object.entries(reasons)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);
  }, [filteredReturns]);

  // Get returns by warehouse
  const returnsByWarehouse = useMemo(() => {
    const warehouses = {};
    filteredReturns.forEach(returnItem => {
      const warehouse = returnItem.salesOrder?.warehouse?.name || 'Unknown';
      if (!warehouses[warehouse]) {
        warehouses[warehouse] = { count: 0, amount: 0 };
      }
      warehouses[warehouse].count += 1;
      
      const itemAmount = returnItem.returnItems?.reduce((itemSum, item) => 
        itemSum + (item.returnQuantity * (item.product?.unitPrice || 0)), 0) || 0;
      warehouses[warehouse].amount += itemAmount;
    });

    return Object.entries(warehouses)
      .sort(([,a], [,b]) => b.count - a.count);
  }, [filteredReturns]);

  const onExport = (type) => {
    const arr = [];
    let x = 1;
    const columns = [
      "S.No",
      "Return Number",
      "Order Number",
      "Customer Name",
      "Return Case",
      "Return Reason",
      "Status",
      "Amount",
      "Items Count",
      "Warehouse",
      "Created Date",
      "Approved Date",
      "Completed Date"
    ];
    
    const dataToExport = filteredReturns && filteredReturns.length > 0 ? filteredReturns : returns;
    
    if (dataToExport && dataToExport.length > 0) {
      dataToExport.map((returnItem) => {
        const itemAmount = returnItem.returnItems?.reduce((itemSum, item) => 
          itemSum + (item.returnQuantity * (item.product?.unitPrice || 0)), 0) || 0;
        
        arr.push({
          "S.No": x++,
          "Return Number": returnItem.returnNumber,
          "Order Number": returnItem.salesOrder?.orderNumber || returnItem.salesOrderId,
          "Customer Name": returnItem.salesOrder?.customer?.customerName || 'N/A',
          "Return Case": returnItem.returnCase,
          "Return Reason": returnItem.returnReason,
          "Status": returnItem.status,
          "Amount": itemAmount,
          "Items Count": returnItem.returnItems?.length || 0,
          "Warehouse": returnItem.salesOrder?.warehouse?.name || 'Unknown',
          "Created Date": new Date(returnItem.createdAt).toLocaleDateString(),
          "Approved Date": returnItem.approvedAt ? new Date(returnItem.approvedAt).toLocaleDateString() : '',
          "Completed Date": returnItem.completedAt ? new Date(returnItem.completedAt).toLocaleDateString() : ''
        });
      });

      if (type === "PDF") {
        handleExportPDF(columns, arr, "Returns-Report");
      } else if (type === "XLS") {
        handleExportExcel(columns, arr, "Returns-Report");
      }
    } else {
      alert("No data available to export");
    }
  };

  const renderSummaryReport = () => (
    <div>
      <div className={styles.returnsStats}>
        <div className={styles.statCard}>
          <h3 className={styles.statNumber}>{summaryStats.totalReturns}</h3>
          <p className={styles.statLabel}>Total Returns</p>
        </div>
        <div className={styles.statCard}>
          <h3 className={styles.statNumber}>₹{summaryStats.totalAmount.toLocaleString()}</h3>
          <p className={styles.statLabel}>Total Amount</p>
        </div>
        <div className={styles.statCard}>
          <h3 className={styles.statNumber}>₹{summaryStats.averageAmount.toLocaleString()}</h3>
          <p className={styles.statLabel}>Average Amount</p>
        </div>
        <div className={`${styles.statCard} ${styles.pending}`}>
          <h3 className={styles.statNumber}>{summaryStats.pendingReturns}</h3>
          <p className={styles.statLabel}>Pending</p>
        </div>
        <div className={`${styles.statCard} ${styles.approved}`}>
          <h3 className={styles.statNumber}>{summaryStats.approvedReturns}</h3>
          <p className={styles.statLabel}>Approved</p>
        </div>
        <div className={`${styles.statCard} ${styles.rejected}`}>
          <h3 className={styles.statNumber}>{summaryStats.rejectedReturns}</h3>
          <p className={styles.statLabel}>Rejected</p>
        </div>
        <div className={`${styles.statCard} ${styles.processing}`}>
          <h3 className={styles.statNumber}>{summaryStats.processingReturns}</h3>
          <p className={styles.statLabel}>Processing</p>
        </div>
        <div className={`${styles.statCard} ${styles.approved}`}>
          <h3 className={styles.statNumber}>{summaryStats.completedReturns}</h3>
          <p className={styles.statLabel}>Completed</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
          <h4>Returns by Type</h4>
          <div style={{ marginTop: '15px' }}>
            {Object.entries(summaryStats.byType).map(([type, count]) => (
              <div key={type} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                padding: '8px 0',
                borderBottom: '1px solid #ecf0f1'
              }}>
                <span style={{ textTransform: 'capitalize' }}>{type.replace('_', ' ')}</span>
                <span style={{ fontWeight: 'bold' }}>{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
          <h4>Returns by Status</h4>
          <div style={{ marginTop: '15px' }}>
            {Object.entries(summaryStats.byStatus).map(([status, count]) => (
              <div key={status} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                padding: '8px 0',
                borderBottom: '1px solid #ecf0f1'
              }}>
                <span style={{ textTransform: 'capitalize' }}>{status}</span>
                <span style={{ fontWeight: 'bold' }}>{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
          <h4>Top Return Reasons</h4>
          <div style={{ marginTop: '15px' }}>
            {topReturnReasons.map(([reason, count], index) => (
              <div key={reason} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                padding: '8px 0',
                borderBottom: '1px solid #ecf0f1'
              }}>
                <span>{index + 1}. {reason}</span>
                <span style={{ fontWeight: 'bold' }}>{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
          <h4>Returns by Warehouse</h4>
          <div style={{ marginTop: '15px' }}>
            {returnsByWarehouse.map(([warehouse, data]) => (
              <div key={warehouse} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                padding: '8px 0',
                borderBottom: '1px solid #ecf0f1'
              }}>
                <span>{warehouse}</span>
                <span style={{ fontWeight: 'bold' }}>
                  {data.count} (₹{data.amount.toLocaleString()})
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderDetailedReport = () => (
    <div>
      <table className={styles.returnsTable}>
        <thead>
          <tr>
            <th>Return #</th>
            <th>Order #</th>
            <th>Customer</th>
            <th>Case</th>
            <th>Reason</th>
            <th>Status</th>
            <th>Amount</th>
            <th>Items</th>
            <th>Warehouse</th>
            <th>Created</th>
            <th>Approved</th>
            <th>Completed</th>
          </tr>
        </thead>
        <tbody>
          {filteredReturns.map((returnItem) => {
            const itemAmount = returnItem.returnItems?.reduce((itemSum, item) => 
              itemSum + (item.returnQuantity * (item.product?.unitPrice || 0)), 0) || 0;
            
            return (
              <tr key={returnItem.id}>
                <td>{returnItem.returnNumber}</td>
                <td>{returnItem.salesOrder?.orderNumber || returnItem.salesOrderId}</td>
                <td>{returnItem.salesOrder?.customer?.customerName || 'N/A'}</td>
                <td>
                  <span className={`${styles.typeBadge} ${styles[returnItem.returnCase] || styles.cancellation}`}>
                    {returnItem.returnCase}
                  </span>
                </td>
                <td>{returnItem.returnReason}</td>
                <td>
                  <span className={`${styles.statusBadge} ${styles[returnItem.status] || styles.pending}`}>
                    {returnItem.status}
                  </span>
                </td>
                <td>₹{itemAmount.toLocaleString()}</td>
                <td>{returnItem.returnItems?.length || 0}</td>
                <td>{returnItem.salesOrder?.warehouse?.name || 'Unknown'}</td>
                <td>{new Date(returnItem.createdAt).toLocaleDateString()}</td>
                <td>{returnItem.approvedAt ? new Date(returnItem.approvedAt).toLocaleDateString() : '-'}</td>
                <td>{returnItem.completedAt ? new Date(returnItem.completedAt).toLocaleDateString() : '-'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Returns Reports & Analytics</h2>
        <div style={{ display: 'flex', gap: '15px' }}>
          <button className={styles.xls} onClick={() => onExport("XLS")}>
            <p>Export to </p>
            <img src={xls} alt="" />
          </button>
          <button className={styles.xls} onClick={() => onExport("PDF")}>
            <p>Export to </p>
            <img src={pdf} alt="" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ 
        backgroundColor: 'white', 
        padding: '20px', 
        borderRadius: '10px', 
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          <div>
            <label className={styles.formLabel}>Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className={styles.formSelect}
            >
              <option value="summary">Summary Report</option>
              <option value="detailed">Detailed Report</option>
            </select>
          </div>
          
          <div>
            <label className={styles.formLabel}>Date Range</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className={styles.formSelect}
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
            </select>
          </div>
          
          <div>
            <label className={styles.formLabel}>Return Type</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className={styles.formSelect}
            >
              <option value="all">All Types</option>
              <option value="damaged">Damaged</option>
              <option value="expired">Expired</option>
              <option value="quality">Quality</option>
              <option value="cancellation">Cancellation</option>
            </select>
          </div>
          
          <div>
            <label className={styles.formLabel}>Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className={styles.formSelect}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Report Content */}
      {reportType === 'summary' ? renderSummaryReport() : renderDetailedReport()}
    </div>
  );
};

export default ReturnReports;
