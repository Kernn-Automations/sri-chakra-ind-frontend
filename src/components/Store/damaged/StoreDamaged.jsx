import React, { useState } from "react";
import { Flex } from "@chakra-ui/react";
import ReusableCard from "../../ReusableCard";
import styles from "../../Dashboard/HomePage/HomePage.module.css";
import storeService from "../../../services/storeService";
import { FaExclamationTriangle, FaImage, FaCalendarAlt } from "react-icons/fa";

export default function StoreDamaged() {
  const [payload, setPayload] = useState({ storeId: "", productId: "", quantity: 0, unit: "kg", damageReason: "", description: "", estimatedValue: 0, imageBase64: null });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const onReport = async () => {
    setLoading(true);
    try {
      const resp = await storeService.reportDamagedGoods(payload);
      setResult(resp);
      setShowForm(false);
      // Reset form
      setPayload({ storeId: "", productId: "", quantity: 0, unit: "kg", damageReason: "", description: "", estimatedValue: 0, imageBase64: null });
    } catch (e) {
      alert(e?.message || "Failed to report damaged goods");
    } finally {
      setLoading(false);
    }
  };

  const mockDamagedData = {
    thisWeek: 2,
    thisMonth: 7,
    totalValue: 12500,
    pendingReports: 1,
    recentReports: [
      { id: "DMG001", product: "Product A", quantity: 5, unit: "kg", reason: "Expired", value: 1250, date: "2h ago", status: "Pending" },
      { id: "DMG002", product: "Product B", quantity: 3, unit: "kg", reason: "Damaged Package", value: 900, date: "1d ago", status: "Approved" },
      { id: "DMG003", product: "Product C", quantity: 2, unit: "kg", reason: "Spillage", value: 700, date: "2d ago", status: "Approved" }
    ]
  };

  return (
    <div style={{ padding: '20px' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ 
          fontFamily: 'Poppins', 
          fontWeight: 700, 
          fontSize: '28px', 
          color: 'var(--primary-color)',
          margin: 0,
          marginBottom: '8px'
        }}>Damaged Goods & Reports</h2>
        <p style={{ 
          fontFamily: 'Poppins', 
          fontSize: '14px', 
          color: '#666',
          margin: 0
        }}>Report and track damaged inventory</p>
      </div>

      {/* Action Buttons */}
      <div className="row m-0 p-2" style={{ marginBottom: '24px' }}>
        <div className="col">
          <button 
            className="homebtn" 
            disabled={loading}
            onClick={() => setShowForm(!showForm)}
            style={{ background: 'var(--primary-color)', color: 'white' }}
          >
            <FaExclamationTriangle style={{ marginRight: '8px' }} />
            {showForm ? 'Cancel Report' : 'Report Damaged Goods'}
          </button>
          <button className="homebtn">View All Reports</button>
        </div>
      </div>

      {/* Statistics Cards */}
      <Flex wrap="wrap" justify="space-between" px={2} style={{ marginBottom: '24px' }}>
        <ReusableCard title="This Week" value={mockDamagedData.thisWeek.toString()} color="red.500" />
        <ReusableCard title="This Month" value={mockDamagedData.thisMonth.toString()} color="orange.500" />
        <ReusableCard title="Total Value Lost" value={`₹${mockDamagedData.totalValue.toLocaleString()}`} color="yellow.500" />
        <ReusableCard title="Pending Reports" value={mockDamagedData.pendingReports.toString()} color="blue.500" />
      </Flex>

      {/* Report Form */}
      {showForm && (
        <div className={styles.orderStatusCard} style={{ marginBottom: '24px' }}>
          <h4 style={{ margin: 0, marginBottom: '20px', fontFamily: 'Poppins', fontWeight: 600, fontSize: '20px', color: 'var(--primary-color)' }}>
            Report Damaged Goods
          </h4>
          <div style={{ display: 'grid', gap: '16px' }}>
            <div>
              <label style={{ fontFamily: 'Poppins', fontSize: '14px', fontWeight: 600, marginBottom: '8px', display: 'block' }}>
                Product ID
              </label>
              <input
                type="text"
                value={payload.productId}
                onChange={(e) => setPayload({ ...payload, productId: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  fontFamily: 'Poppins',
                  fontSize: '14px'
                }}
                placeholder="Enter product ID"
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ fontFamily: 'Poppins', fontSize: '14px', fontWeight: 600, marginBottom: '8px', display: 'block' }}>
                  Quantity
                </label>
                <input
                  type="number"
                  value={payload.quantity}
                  onChange={(e) => setPayload({ ...payload, quantity: parseFloat(e.target.value) || 0 })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    fontFamily: 'Poppins',
                    fontSize: '14px'
                  }}
                  placeholder="0"
                />
              </div>
              <div>
                <label style={{ fontFamily: 'Poppins', fontSize: '14px', fontWeight: 600, marginBottom: '8px', display: 'block' }}>
                  Unit
                </label>
                <select
                  value={payload.unit}
                  onChange={(e) => setPayload({ ...payload, unit: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    fontFamily: 'Poppins',
                    fontSize: '14px'
                  }}
                >
                  <option value="kg">kg</option>
                  <option value="g">g</option>
                  <option value="L">L</option>
                  <option value="ml">ml</option>
                  <option value="pcs">pcs</option>
                </select>
              </div>
            </div>
            <div>
              <label style={{ fontFamily: 'Poppins', fontSize: '14px', fontWeight: 600, marginBottom: '8px', display: 'block' }}>
                Damage Reason
              </label>
              <select
                value={payload.damageReason}
                onChange={(e) => setPayload({ ...payload, damageReason: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  fontFamily: 'Poppins',
                  fontSize: '14px'
                }}
              >
                <option value="">Select reason</option>
                <option value="Expired">Expired</option>
                <option value="Damaged Package">Damaged Package</option>
                <option value="Spillage">Spillage</option>
                <option value="Contamination">Contamination</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label style={{ fontFamily: 'Poppins', fontSize: '14px', fontWeight: 600, marginBottom: '8px', display: 'block' }}>
                Description
              </label>
              <textarea
                value={payload.description}
                onChange={(e) => setPayload({ ...payload, description: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  fontFamily: 'Poppins',
                  fontSize: '14px',
                  minHeight: '80px',
                  resize: 'vertical'
                }}
                placeholder="Provide additional details..."
              />
            </div>
            <div>
              <label style={{ fontFamily: 'Poppins', fontSize: '14px', fontWeight: 600, marginBottom: '8px', display: 'block' }}>
                Estimated Value (₹)
              </label>
              <input
                type="number"
                value={payload.estimatedValue}
                onChange={(e) => setPayload({ ...payload, estimatedValue: parseFloat(e.target.value) || 0 })}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  fontFamily: 'Poppins',
                  fontSize: '14px'
                }}
                placeholder="0.00"
              />
            </div>
            <button
              className="btn btn-primary"
              disabled={loading}
              onClick={onReport}
              style={{ 
                fontFamily: 'Poppins',
                padding: '12px 24px',
                borderRadius: '8px',
                marginTop: '8px'
              }}
            >
              {loading ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </div>
      )}

      {/* Recent Reports Table */}
      <div className={styles.orderStatusCard}>
        <h4 style={{ margin: 0, marginBottom: '20px', fontFamily: 'Poppins', fontWeight: 600, fontSize: '20px', color: 'var(--primary-color)' }}>
          Recent Damage Reports
        </h4>
        <div style={{ overflowX: 'auto' }}>
          <table className="table" style={{ marginBottom: 0, fontFamily: 'Poppins' }}>
            <thead>
              <tr>
                <th style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: '13px' }}>Report ID</th>
                <th style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: '13px' }}>Product</th>
                <th style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: '13px' }}>Quantity</th>
                <th style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: '13px' }}>Reason</th>
                <th style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: '13px' }}>Value</th>
                <th style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: '13px' }}>Status</th>
                <th style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: '13px' }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {mockDamagedData.recentReports.map((report, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? 'rgba(59, 130, 246, 0.03)' : 'transparent' }}>
                  <td style={{ fontFamily: 'Poppins', fontSize: '13px', fontWeight: 600 }}>{report.id}</td>
                  <td style={{ fontFamily: 'Poppins', fontSize: '13px' }}>{report.product}</td>
                  <td style={{ fontFamily: 'Poppins', fontSize: '13px' }}>{report.quantity} {report.unit}</td>
                  <td style={{ fontFamily: 'Poppins', fontSize: '13px' }}>{report.reason}</td>
                  <td style={{ fontFamily: 'Poppins', fontSize: '13px', fontWeight: 600, color: '#ef4444' }}>
                    ₹{report.value.toLocaleString()}
                  </td>
                  <td>
                    <span className={`badge ${report.status === 'Approved' ? 'bg-success' : 'bg-warning'}`} style={{ fontFamily: 'Poppins', fontSize: '11px' }}>
                      {report.status}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'Poppins', fontSize: '13px', color: '#6b7280' }}>{report.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {result && (
        <div style={{ marginTop: '24px', padding: '16px', background: '#f9fafb', borderRadius: '12px' }}>
          <h5 style={{ fontFamily: 'Poppins', fontWeight: 600, marginBottom: '12px' }}>Response:</h5>
          <pre style={{ fontFamily: 'monospace', fontSize: '12px', margin: 0 }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}


