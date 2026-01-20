import React, { useState, useEffect, lazy, Suspense } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Flex } from "@chakra-ui/react";
import ReusableCard from "../../ReusableCard";
import { isStoreEmployee, isStoreManager, isAdmin } from "../../../utils/roleUtils";
import { useAuth } from "../../../Auth";
import StoreSalesOrders from "./StoreSalesOrders";
const StoreCreateSale = lazy(() => import("./StoreCreateSale"));

export default function StoreSales() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { axiosAPI } = useAuth();
  const mode = searchParams.get("mode");
  const [isMobile, setIsMobile] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(false);
  const userData = JSON.parse(localStorage.getItem("user")) || {};
  // Handle nested user structure (user.user or direct user)
  const actualUser = userData?.user || userData || {};
  const isEmployee = isStoreEmployee(actualUser);
  const isManager = isStoreManager(actualUser);
  const isAdminUser = isAdmin(actualUser);
  const canUseCreateFlow = isEmployee || isManager || isAdminUser;

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

      const response = await axiosAPI.get(`/stores/${storeId}/dashboard/sales/cards`);
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

  // Debug logging
  useEffect(() => {
    console.log("StoreSales - Role detection:", {
      actualUser,
      roles: actualUser?.roles,
      isEmployee,
      isManager,
      isAdminUser,
      canUseCreateFlow,
      mode
    });
  }, [actualUser, isEmployee, isManager, isAdminUser, canUseCreateFlow, mode]);

  const handleOpenCreate = () => {
    // Always navigate to create sale page
    // The actual sale creation happens in StoreCreateSale component
    console.log("StoreSales - handleOpenCreate called, setting mode to create");
    setSearchParams({ mode: "create" });
  };

  const handleOpenOrders = () => {
    setSearchParams({ mode: "orders" });
  };

  const handleBackToOverview = () => {
    setSearchParams({});
  };

  const handleOpenSalesReports = () => {
    navigate("/store/sales-reports");
  };

  const handleOpenCashDeposit = () => {
    navigate("/store/cashdeposit");
  };

  if (mode === "orders") {
    return <StoreSalesOrders onBack={handleBackToOverview} />;
  }

  // Always show create sale page if mode is "create"
  // This ensures it works even if role detection has issues
  if (mode === "create") {
    return (
      <Suspense fallback={<div>Loading Create Sale...</div>}>
        <StoreCreateSale />
      </Suspense>
    );
  }

  return (
    <div style={{ padding: isMobile ? '12px 8px' : undefined }}>
      {/* Buttons: show Create Sale button - works for employees, managers, and admins */}
      {(canUseCreateFlow || isManager || isEmployee || isAdminUser) ? (
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
              onClick={handleOpenOrders}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: '1',
                ...(isMobile ? {
                  padding: '6px 8px',
                  fontSize: '11px',
                  borderRadius: '6px',
                  flex: '0 0 calc(25% - 4px)',
                  maxWidth: 'calc(25% - 4px)',
                  width: 'calc(25% - 4px)',
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
              Sales
            </button>
            <button 
              className="homebtn" 
              onClick={handleOpenSalesReports}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: '1',
                ...(isMobile ? {
                  padding: '6px 8px',
                  fontSize: '11px',
                  borderRadius: '6px',
                  flex: '0 0 calc(25% - 4px)',
                  maxWidth: 'calc(25% - 4px)',
                  width: 'calc(25% - 4px)',
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
              Sales Reports
            </button>
            <button 
              className="homebtn" 
              onClick={handleOpenCreate}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: '1',
                ...(isMobile ? {
                  padding: '6px 8px',
                  fontSize: '11px',
                  borderRadius: '6px',
                  flex: '0 0 calc(25% - 4px)',
                  maxWidth: 'calc(25% - 4px)',
                  width: 'calc(25% - 4px)',
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
              Create Sale
            </button>
            <button 
              className="homebtn" 
              onClick={handleOpenCashDeposit}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: '1',
                ...(isMobile ? {
                  padding: '6px 8px',
                  fontSize: '11px',
                  borderRadius: '6px',
                  flex: '0 0 calc(25% - 4px)',
                  maxWidth: 'calc(25% - 4px)',
                  width: 'calc(25% - 4px)',
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
              Cash Deposit
            </button>
            <button 
              className="homebtn" 
              onClick={() => navigate("/store/bank-receipts")}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: '1',
                ...(isMobile ? {
                  padding: '6px 8px',
                  fontSize: '11px',
                  borderRadius: '6px',
                  flex: '0 0 calc(25% - 4px)',
                  maxWidth: 'calc(25% - 4px)',
                  width: 'calc(25% - 4px)',
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
              Bank Receipts
            </button>
          </div>
        </div>
      ) : (
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
              onClick={handleOpenOrders}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: '1',
                ...(isMobile ? {
                  padding: '6px 8px',
                  fontSize: '11px',
                  borderRadius: '6px',
                  flex: '0 0 calc(25% - 4px)',
                  maxWidth: 'calc(25% - 4px)',
                  width: 'calc(25% - 4px)',
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
              Sales Orders
            </button>
            <button 
              className="homebtn" 
              onClick={handleOpenSalesReports}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: '1',
                ...(isMobile ? {
                  padding: '6px 8px',
                  fontSize: '11px',
                  borderRadius: '6px',
                  flex: '0 0 calc(25% - 4px)',
                  maxWidth: 'calc(25% - 4px)',
                  width: 'calc(25% - 4px)',
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
              Sales Reports
            </button>
            <button 
              className="homebtn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: '1',
                ...(isMobile ? {
                  padding: '6px 8px',
                  fontSize: '11px',
                  borderRadius: '6px',
                  flex: '0 0 calc(25% - 4px)',
                  maxWidth: 'calc(25% - 4px)',
                  width: 'calc(25% - 4px)',
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
              Returned Orders
            </button>
            <button 
              className="homebtn" 
              onClick={handleOpenCreate}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: '1',
                ...(isMobile ? {
                  padding: '6px 8px',
                  fontSize: '11px',
                  borderRadius: '6px',
                  flex: '0 0 calc(25% - 4px)',
                  maxWidth: 'calc(25% - 4px)',
                  width: 'calc(25% - 4px)',
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
              Create Sale
            </button>
            <button 
              className="homebtn" 
              onClick={handleOpenCashDeposit}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: '1',
                ...(isMobile ? {
                  padding: '6px 8px',
                  fontSize: '11px',
                  borderRadius: '6px',
                  flex: '0 0 calc(25% - 4px)',
                  maxWidth: 'calc(25% - 4px)',
                  width: 'calc(25% - 4px)',
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
              Cash Deposit
            </button>
            <button 
              className="homebtn" 
              onClick={() => navigate("/store/bank-receipts")}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: '1',
                ...(isMobile ? {
                  padding: '6px 8px',
                  fontSize: '11px',
                  borderRadius: '6px',
                  flex: '0 0 calc(25% - 4px)',
                  maxWidth: 'calc(25% - 4px)',
                  width: 'calc(25% - 4px)',
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
              Bank Receipts
            </button>
          </div>
        </div>
      )}

      {/* Mini Dashboards */}
      <Flex wrap="wrap" justify="space-between" px={2}>
        <ReusableCard 
          title="Today Orders" 
          value={loading ? "..." : (dashboardData?.cards?.todayOrders?.toString() || "0")} 
        />
        <ReusableCard 
          title="Today Sales" 
          value={loading ? "..." : `₹${(dashboardData?.cards?.todaySales || 0).toLocaleString()}`} 
          color="green.500" 
        />
        <ReusableCard 
          title="Returns Today" 
          value={loading ? "..." : (dashboardData?.cards?.returnsToday?.toString() || "0")} 
          color="red.500" 
        />
        <ReusableCard 
          title="This Month" 
          value={loading ? "..." : `₹${(dashboardData?.cards?.monthSales || 0).toLocaleString()}`} 
          color="blue.500" 
        />
      </Flex>

    </div>
  );
}


