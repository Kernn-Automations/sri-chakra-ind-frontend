import React, { useState } from "react";
import { Flex } from "@chakra-ui/react";
import ReusableCard from "../../ReusableCard";
import styles from "../../Dashboard/HomePage/HomePage.module.css";
import storeService from "../../../services/storeService";
import { FaUserCheck, FaUserClock, FaSearch } from "react-icons/fa";

export default function StoreCustomers() {
  const [payload, setPayload] = useState({ storeId: "", name: "", mobile: "", area: "", pincode: "", address: "" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);

  const onCreateOrFind = async () => {
    setLoading(true);
    try {
      const resp = await storeService.createOrFindCustomer(payload);
      setResult(resp);
      setShowForm(false);
      // Reset form
      setPayload({ storeId: "", name: "", mobile: "", area: "", pincode: "", address: "" });
    } catch (e) {
      alert(e?.message || "Failed to create/find customer");
    } finally {
      setLoading(false);
    }
  };

  const mockCustomersData = {
    total: 156,
    active: 120,
    kycPending: 18,
    rejected: 5,
    recentCustomers: [
      { id: "CUST001", name: "Rajesh Kumar", mobile: "9876543210", area: "Downtown", status: "Active", orders: 12, lastOrder: "2d ago" },
      { id: "CUST002", name: "Priya Sharma", mobile: "9876543211", area: "Uptown", status: "Active", orders: 8, lastOrder: "5d ago" },
      { id: "CUST003", name: "Amit Singh", mobile: "9876543212", area: "Midtown", status: "KYC Pending", orders: 3, lastOrder: "1w ago" },
      { id: "CUST004", name: "Sneha Patel", mobile: "9876543213", area: "Downtown", status: "Active", orders: 15, lastOrder: "1d ago" },
      { id: "CUST005", name: "Vikram Mehta", mobile: "9876543214", area: "Uptown", status: "KYC Pending", orders: 2, lastOrder: "2w ago" }
    ]
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      "Active": { class: "bg-success", icon: <FaUserCheck /> },
      "KYC Pending": { class: "bg-warning", icon: <FaUserClock /> },
      "Rejected": { class: "bg-danger", icon: <FaUserCheck /> }
    };
    return statusMap[status] || { class: "bg-secondary", icon: <FaUserCheck /> };
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
        }}>Customer Management</h2>
        <p style={{ 
          fontFamily: 'Poppins', 
          fontSize: '14px', 
          color: '#666',
          margin: 0
        }}>Manage your customer database and KYC status</p>
      </div>

      {/* Action Buttons */}
      <div className="row m-0 p-2" style={{ marginBottom: '24px' }}>
        <div className="col" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
          <button 
            className="homebtn" 
            disabled={loading}
            onClick={() => setShowForm(!showForm)}
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', height: '36px', lineHeight: '1' }}
          >
            {showForm ? 'Cancel' : 'Create Customer'}
          </button>
          <button className="homebtn" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', height: '36px', lineHeight: '1' }}>
            Customers List
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <Flex wrap="wrap" justify="space-between" px={2} style={{ marginBottom: '24px' }}>
        <ReusableCard title="Total Customers" value={mockCustomersData.total.toString()} />
        <ReusableCard title="KYC Pending" value={mockCustomersData.kycPending.toString()} color="yellow.500" />
        <ReusableCard title="Active" value={mockCustomersData.active.toString()} color="green.500" />
        <ReusableCard title="Rejected" value={mockCustomersData.rejected.toString()} color="red.500" />
      </Flex>

      {/* Search Bar */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ 
          position: 'relative',
          maxWidth: '500px'
        }}>
          <FaSearch style={{ 
            position: 'absolute', 
            left: '16px', 
            top: '50%', 
            transform: 'translateY(-50%)',
            color: '#6b7280',
            fontSize: '18px'
          }} />
          <input
            type="text"
            placeholder="Search customers by name or mobile..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px 12px 48px',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              fontFamily: 'Poppins',
              fontSize: '14px',
              outline: 'none',
              transition: 'all 0.2s ease'
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
          />
        </div>
      </div>

      {/* Create Customer Form */}
      {showForm && (
        <div className={styles.orderStatusCard} style={{ marginBottom: '24px' }}>
          <h4 style={{ margin: 0, marginBottom: '20px', fontFamily: 'Poppins', fontWeight: 600, fontSize: '20px', color: 'var(--primary-color)' }}>
            Create New Customer
          </h4>
          <div style={{ display: 'grid', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ fontFamily: 'Poppins', fontSize: '14px', fontWeight: 600, marginBottom: '8px', display: 'block' }}>
                  Name *
                </label>
                <input
                  type="text"
                  value={payload.name}
                  onChange={(e) => setPayload({ ...payload, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    fontFamily: 'Poppins',
                    fontSize: '14px'
                  }}
                  placeholder="Customer name"
                />
              </div>
              <div>
                <label style={{ fontFamily: 'Poppins', fontSize: '14px', fontWeight: 600, marginBottom: '8px', display: 'block' }}>
                  Mobile *
                </label>
                <input
                  type="tel"
                  value={payload.mobile}
                  onChange={(e) => setPayload({ ...payload, mobile: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    fontFamily: 'Poppins',
                    fontSize: '14px'
                  }}
                  placeholder="10-digit mobile number"
                />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ fontFamily: 'Poppins', fontSize: '14px', fontWeight: 600, marginBottom: '8px', display: 'block' }}>
                  Area
                </label>
                <input
                  type="text"
                  value={payload.area}
                  onChange={(e) => setPayload({ ...payload, area: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    fontFamily: 'Poppins',
                    fontSize: '14px'
                  }}
                  placeholder="Area/Location"
                />
              </div>
              <div>
                <label style={{ fontFamily: 'Poppins', fontSize: '14px', fontWeight: 600, marginBottom: '8px', display: 'block' }}>
                  Pincode
                </label>
                <input
                  type="text"
                  value={payload.pincode}
                  onChange={(e) => setPayload({ ...payload, pincode: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    fontFamily: 'Poppins',
                    fontSize: '14px'
                  }}
                  placeholder="Pincode"
                />
              </div>
            </div>
            <div>
              <label style={{ fontFamily: 'Poppins', fontSize: '14px', fontWeight: 600, marginBottom: '8px', display: 'block' }}>
                Address
              </label>
              <textarea
                value={payload.address}
                onChange={(e) => setPayload({ ...payload, address: e.target.value })}
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
                placeholder="Full address"
              />
            </div>
            <button
              className="btn btn-primary"
              disabled={loading}
              onClick={onCreateOrFind}
              style={{ 
                fontFamily: 'Poppins',
                padding: '12px 24px',
                borderRadius: '8px',
                marginTop: '8px'
              }}
            >
              {loading ? 'Processing...' : 'Create Customer'}
            </button>
          </div>
        </div>
      )}

      {/* Customers Table */}
      <div className={styles.orderStatusCard}>
        <h4 style={{ margin: 0, marginBottom: '20px', fontFamily: 'Poppins', fontWeight: 600, fontSize: '20px', color: 'var(--primary-color)' }}>
          Recent Customers
        </h4>
        <div style={{ overflowX: 'auto' }}>
          <table className="table" style={{ marginBottom: 0, fontFamily: 'Poppins' }}>
            <thead>
              <tr>
                <th style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: '13px' }}>Customer ID</th>
                <th style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: '13px' }}>Name</th>
                <th style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: '13px' }}>Mobile</th>
                <th style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: '13px' }}>Area</th>
                <th style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: '13px' }}>Orders</th>
                <th style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: '13px' }}>Status</th>
                <th style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: '13px' }}>Last Order</th>
              </tr>
            </thead>
            <tbody>
              {mockCustomersData.recentCustomers.map((customer, i) => {
                const statusInfo = getStatusBadge(customer.status);
                return (
                  <tr key={i} style={{ background: i % 2 === 0 ? 'rgba(59, 130, 246, 0.03)' : 'transparent' }}>
                    <td style={{ fontFamily: 'Poppins', fontSize: '13px', fontWeight: 600 }}>{customer.id}</td>
                    <td style={{ fontFamily: 'Poppins', fontSize: '13px', fontWeight: 600 }}>{customer.name}</td>
                    <td style={{ fontFamily: 'Poppins', fontSize: '13px' }}>
                      {customer.mobile}
                    </td>
                    <td style={{ fontFamily: 'Poppins', fontSize: '13px' }}>
                      {customer.area}
                    </td>
                    <td style={{ fontFamily: 'Poppins', fontSize: '13px', fontWeight: 600 }}>{customer.orders}</td>
                    <td>
                      <span className={`badge ${statusInfo.class}`} style={{ fontFamily: 'Poppins', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        {statusInfo.icon}
                        {customer.status}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'Poppins', fontSize: '13px', color: '#6b7280' }}>{customer.lastOrder}</td>
                  </tr>
                );
              })}
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


