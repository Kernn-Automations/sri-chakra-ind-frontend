import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Flex } from "@chakra-ui/react";
import ReusableCard from "../../ReusableCard";
import { useAuth } from "../../../Auth";
import styles from "../../Dashboard/HomePage/HomePage.module.css";
import { FaFileAlt, FaClock, FaCheckCircle, FaTimesCircle } from "react-icons/fa";

export default function StoreIndentsHome() {
  const navigate = useNavigate();
  const { axiosAPI } = useAuth();
  const [isMobile, setIsMobile] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Fetch dashboard data
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const storeId = localStorage.getItem("storeId");
      if (!storeId) {
        console.error("No store ID found");
        return;
      }

      const response = await axiosAPI.get(`/stores/${storeId}/dashboard/indents`);
      const data = response.data || response;
      
      if (data.success) {
        setDashboardData(data.data);
      } else {
        console.error("Failed to fetch dashboard data:", data.message);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      "Awaiting Approval": { class: "bg-warning", icon: <FaClock /> },
      "Waiting for Stock": { class: "bg-info", icon: <FaClock /> },
      "Approved": { class: "bg-success", icon: <FaCheckCircle /> },
      "Rejected": { class: "bg-danger", icon: <FaTimesCircle /> }
    };
    return statusMap[status] || { class: "bg-secondary", icon: <FaFileAlt /> };
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
        }}>Store Indents</h2>
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
            onClick={() => navigate('/store/indents/create')}
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
            Create New Indent
          </button>
          <button 
            className="homebtn" 
            onClick={() => navigate('/store/indents/all')}
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
            View All Indents
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <Flex wrap="wrap" justify="space-between" px={2} style={{ marginBottom: '24px' }}>
        <ReusableCard 
          title="Pending Indents" 
          value={loading ? "..." : (dashboardData?.summary?.pending?.toString() || "0")} 
          color="yellow.500" 
        />
        <ReusableCard 
          title="Approved" 
          value={loading ? "..." : (dashboardData?.summary?.approved?.toString() || "0")} 
          color="green.500" 
        />
        <ReusableCard 
          title="Rejected" 
          value={loading ? "..." : (dashboardData?.summary?.rejected?.toString() || "0")} 
          color="red.500" 
        />
        <ReusableCard 
          title="Total Value" 
          value={loading ? "..." : `₹${(dashboardData?.summary?.totalValue || 0).toLocaleString()}`} 
          color="blue.500" 
        />
      </Flex>

      {/* Recent Indents Table */}
      <div className={styles.orderStatusCard}>
        <h4 style={{ margin: 0, marginBottom: '20px', fontFamily: 'Poppins', fontWeight: 600, fontSize: '20px', color: 'var(--primary-color)' }}>
          Recent Indents
        </h4>
        <div style={{ overflowX: 'auto' }}>
          <table className="table" style={{ marginBottom: 0, fontFamily: 'Poppins' }}>
            <thead>
              <tr>
                <th style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: '13px' }}>S.No</th>
                <th style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: '13px' }}>Date</th>
                <th style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: '13px' }}>Indent Code</th>
                <th style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: '13px' }}>Items</th>
                <th style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: '13px' }}>Value</th>
                <th style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: '13px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '20px', fontFamily: 'Poppins' }}>
                    Loading...
                  </td>
                </tr>
              ) : !dashboardData?.recentIndents || dashboardData.recentIndents.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '20px', fontFamily: 'Poppins', color: '#6b7280' }}>
                    No recent indents found
                  </td>
                </tr>
              ) : (
                dashboardData.recentIndents.map((indent, i) => {
                  const statusInfo = getStatusBadge(indent.statusLabel || indent.status);
                  return (
                    <tr key={i} style={{ background: i % 2 === 0 ? 'rgba(59, 130, 246, 0.03)' : 'transparent' }}>
                      <td style={{ fontFamily: 'Poppins', fontSize: '13px' }}>{indent.sNo || i + 1}</td>
                      <td style={{ fontFamily: 'Poppins', fontSize: '13px', color: '#6b7280' }}>{indent.date}</td>
                      <td style={{ fontFamily: 'Poppins', fontSize: '13px', fontWeight: 600 }}>
                        {indent.indentCode || indent.code}
                      </td>
                      <td style={{ fontFamily: 'Poppins', fontSize: '13px' }}>{indent.itemsCount || indent.items} items</td>
                      <td style={{ fontFamily: 'Poppins', fontSize: '13px', fontWeight: 600, color: 'var(--primary-color)' }}>
                        ₹{(indent.value || 0).toLocaleString()}
                      </td>
                      <td>
                        <span className={`badge ${statusInfo.class}`} style={{ fontFamily: 'Poppins', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          {statusInfo.icon}
                          {indent.statusLabel || indent.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

