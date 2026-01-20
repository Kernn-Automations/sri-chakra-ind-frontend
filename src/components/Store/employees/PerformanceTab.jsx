import React from "react";
import { FaChartLine, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import styles from "../../Dashboard/Purchases/Purchases.module.css";

function PerformanceTab({ employee }) {
  if (!employee || !employee.performance) {
    return (
      <div style={{ 
        background: 'white', 
        borderRadius: '8px', 
        padding: '20px',
        marginTop: '20px',
        fontFamily: 'Poppins',
        textAlign: 'center',
        color: '#666'
      }}>
        <p>No performance data available</p>
      </div>
    );
  }

  const { performance } = employee;

  const calculatePercentage = (actual, target) => {
    if (!target || target === 0) return 0;
    return Math.round((actual / target) * 100);
  };

  const getPerformanceColor = (percentage) => {
    if (percentage >= 100) return '#059669'; // green
    if (percentage >= 80) return '#d97706'; // orange
    return '#dc2626'; // red
  };

  const PerformanceCard = ({ title, actual, target, unit = '', type = 'sales' }) => {
    const percentage = calculatePercentage(actual, target);
    const color = getPerformanceColor(percentage);
    const isTargetMet = percentage >= 100;

    return (
      <div style={{ 
        background: 'white', 
        borderRadius: '8px', 
        padding: '20px',
        marginBottom: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        fontFamily: 'Poppins'
      }}>
        <h6 style={{ 
          fontFamily: 'Poppins', 
          fontWeight: 600, 
          marginBottom: '16px', 
          color: 'var(--primary-color)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <FaChartLine /> {title}
        </h6>
        
        <div className="row">
          <div className="col-md-6" style={{ marginBottom: '12px' }}>
            <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>Actual</p>
            <h5 style={{ margin: '4px 0 0 0', fontFamily: 'Poppins', fontWeight: 600 }}>
              {type === 'revenue' ? `₹${actual.toLocaleString()}` : actual} {unit}
            </h5>
          </div>
          <div className="col-md-6" style={{ marginBottom: '12px' }}>
            <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>Target</p>
            <h5 style={{ margin: '4px 0 0 0', fontFamily: 'Poppins', fontWeight: 600 }}>
              {type === 'revenue' ? `₹${target.toLocaleString()}` : target} {unit}
            </h5>
          </div>
        </div>

        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '14px', color: '#666' }}>Achievement</span>
            <span style={{ 
              fontSize: '16px', 
              fontWeight: 600, 
              color: color,
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              {isTargetMet ? <FaCheckCircle /> : <FaTimesCircle />}
              {percentage}%
            </span>
          </div>
          <div style={{ 
            width: '100%', 
            height: '8px', 
            background: '#e5e7eb', 
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{ 
              width: `${Math.min(percentage, 100)}%`, 
              height: '100%', 
              background: color,
              transition: 'width 0.3s ease'
            }}></div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ marginTop: '20px' }}>
      {/* This Month Performance */}
      <div className="row">
        <div className="col-md-6">
          <PerformanceCard 
            title="This Month Sales"
            actual={performance.thisMonth.sales}
            target={performance.thisMonth.salesTarget || Math.round(performance.thisMonth.target / (performance.thisMonth.revenue / performance.thisMonth.sales))}
            unit="sales"
            type="sales"
          />
        </div>
        <div className="col-md-6">
          <PerformanceCard 
            title="This Month Revenue"
            actual={performance.thisMonth.revenue}
            target={performance.thisMonth.target}
            type="revenue"
          />
        </div>
      </div>

      {/* Last Month Performance */}
      <div className="row">
        <div className="col-md-6">
          <PerformanceCard 
            title="Last Month Sales"
            actual={performance.lastMonth.sales}
            target={performance.lastMonth.salesTarget || Math.round(performance.lastMonth.target / (performance.lastMonth.revenue / performance.lastMonth.sales))}
            unit="sales"
            type="sales"
          />
        </div>
        <div className="col-md-6">
          <PerformanceCard 
            title="Last Month Revenue"
            actual={performance.lastMonth.revenue}
            target={performance.lastMonth.target}
            type="revenue"
          />
        </div>
      </div>

      {/* This Year Performance */}
      <div className="row">
        <div className="col-md-6">
          <PerformanceCard 
            title="This Year Sales"
            actual={performance.thisYear.sales}
            target={performance.thisYear.salesTarget || Math.round(performance.thisYear.target / (performance.thisYear.revenue / performance.thisYear.sales))}
            unit="sales"
            type="sales"
          />
        </div>
        <div className="col-md-6">
          <PerformanceCard 
            title="This Year Revenue"
            actual={performance.thisYear.revenue}
            target={performance.thisYear.target}
            type="revenue"
          />
        </div>
      </div>

      {/* Sales History Table */}
      {employee.sales && employee.sales.length > 0 && (
        <div style={{ 
          background: 'white', 
          borderRadius: '8px', 
          padding: '20px',
          marginTop: '20px',
          fontFamily: 'Poppins'
        }}>
          <h5 style={{ fontFamily: 'Poppins', fontWeight: 600, marginBottom: '20px', color: 'var(--primary-color)' }}>
            Recent Sales ({employee.sales.length})
          </h5>
          
          <div style={{ overflowX: 'auto' }}>
            <table className={`table table-bordered borderedtable`}>
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Sale ID</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {employee.sales.map((sale, index) => (
                  <tr
                    key={index}
                    className="animated-row"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <td>{index + 1}</td>
                    <td>{sale.id}</td>
                    <td>{sale.date}</td>
                    <td>{sale.customer}</td>
                    <td>₹{sale.amount.toLocaleString()}</td>
                    <td>
                      <span className={`badge ${sale.status === 'Completed' ? 'bg-success' : sale.status === 'Pending' ? 'bg-warning' : 'bg-info'}`}>
                        {sale.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default PerformanceTab;

