import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Flex } from "@chakra-ui/react";
import ReusableCard from "../../ReusableCard";
import styles from "../../Dashboard/HomePage/HomePage.module.css";
import { FaUserCheck, FaUserClock } from "react-icons/fa";

export default function StoreCustomersHome() {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const mockCustomersData = {
    total: 156,
    active: 120,
    kycPending: 18,
    rejected: 5,
    recentCustomers: [
      { id: "CUST001", name: "Rajesh Kumar", mobile: "9876543210", area: "Downtown", status: "Active", orders: 12, lastOrder: "15-01-2024" },
      { id: "CUST002", name: "Priya Sharma", mobile: "9876543211", area: "Uptown", status: "Active", orders: 8, lastOrder: "12-01-2024" },
      { id: "CUST003", name: "Amit Singh", mobile: "9876543212", area: "Midtown", status: "KYC Pending", orders: 3, lastOrder: "08-01-2024" },
      { id: "CUST004", name: "Sneha Patel", mobile: "9876543213", area: "Downtown", status: "Active", orders: 15, lastOrder: "14-01-2024" },
      { id: "CUST005", name: "Vikram Mehta", mobile: "9876543214", area: "Uptown", status: "KYC Pending", orders: 2, lastOrder: "01-01-2024" }
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
    <div style={{ padding: isMobile ? '12px 8px' : '20px' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ 
          fontFamily: 'Poppins', 
          fontWeight: 700, 
          fontSize: isMobile ? '22px' : '28px', 
          color: 'var(--primary-color)',
          margin: 0,
          marginBottom: '8px'
        }}>Customer Management</h2>
        <p style={{ 
          fontFamily: 'Poppins', 
          fontSize: isMobile ? '12px' : '14px', 
          color: '#666',
          margin: 0
        }}>Manage your customer database and KYC status</p>
      </div>

      {/* Action Buttons */}
      <div className="row m-0 p-2" style={{ marginBottom: '24px' }}>
        <div
          className="col"
          style={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            ...(isMobile && {
              flexDirection: 'row',
              gap: '6px',
              paddingLeft: '8px',
              paddingRight: '8px',
              marginLeft: '0',
              width: '100%'
            }),
            ...(!isMobile && {
              gap: '10px'
            })
          }}
        >
          <button 
            className="homebtn" 
            onClick={() => navigate('/store/customers/create')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: '1',
              ...(isMobile ? {
                padding: '6px 8px',
                fontSize: '11px',
                borderRadius: '6px',
                flex: '0 0 calc(33.333% - 4px)',
                maxWidth: 'calc(33.333% - 4px)',
                width: 'calc(33.333% - 4px)',
                minHeight: '32px',
                boxSizing: 'border-box',
                whiteSpace: 'normal',
                margin: 0
              } : {
                padding: '12px 24px',
                fontSize: '14px',
                borderRadius: '8px',
                whiteSpace: 'nowrap'
              })
            }}
          >
            Create Customer
          </button>
          <button 
            className="homebtn" 
            onClick={() => navigate('/store/customers/list')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: '1',
              ...(isMobile ? {
                padding: '6px 8px',
                fontSize: '11px',
                borderRadius: '6px',
                flex: '0 0 calc(33.333% - 4px)',
                maxWidth: 'calc(33.333% - 4px)',
                width: 'calc(33.333% - 4px)',
                minHeight: '32px',
                boxSizing: 'border-box',
                whiteSpace: 'normal',
                margin: 0
              } : {
                padding: '12px 24px',
                fontSize: '14px',
                borderRadius: '8px',
                whiteSpace: 'nowrap'
              })
            }}
          >
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

      {/* Recent Customers Table */}
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
    </div>
  );
}

