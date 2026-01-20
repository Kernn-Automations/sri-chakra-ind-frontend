import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../Auth';
import { useDivision } from '../../context/DivisionContext';
import returnsService from '../../../services/returnsService';
import styles from './Returns.module.css';
import ReturnRequests from './ReturnRequests';
import ReturnTypes from './ReturnTypes';
import ReturnReports from './ReturnReports';
import RefundManagement from './RefundManagement';
import CreateReturnRequestNew from './CreateReturnRequestNew';
import ReturnsDashboardComprehensive from './ReturnsDashboardComprehensive';
// import ReturnsSystemTest from './ReturnsSystemTest';
import Loading from '../../Loading';

const ReturnsHome = ({ initialTab }) => {
  const navigate = useNavigate();
  const { axiosAPI } = useAuth();
  const { selectedDivision, showAllDivisions } = useDivision();
  
  const [activeTab, setActiveTab] = useState(initialTab || 'reports');
  const [returns, setReturns] = useState([]);
  const [returnTypes, setReturnTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    damaged: 0,
    expired: 0,
    quality: 0
  });

  // Load returns data
  useEffect(() => {
    loadReturnsData();
  }, [selectedDivision, showAllDivisions]);

  const loadReturnsData = async () => {
    try {
      console.log('ReturnsHome - Loading returns data...');
      setLoading(true);
      const divisionId = selectedDivision?.id || null;
      
      // Fetch returns data using new API endpoint
      const returnsResponse = await returnsService.getReturnRequests({}, divisionId, showAllDivisions);
      
      console.log('ReturnsHome - Returns response:', returnsResponse);
      
      // Fetch return reasons using new API endpoint
      const reasonsResponse = await returnsService.getReturnReasons({}, divisionId, showAllDivisions);
      
      if (returnsResponse.success) {
        const returnRequests = returnsResponse.data.returnRequests || [];
        console.log('ReturnsHome - Setting returns data:', returnRequests);
        setReturns(returnRequests);
        calculateStats(returnRequests);
      } else {
        console.error('Failed to fetch returns:', returnsResponse.message);
        // Set empty data to prevent crashes
        setReturns([]);
        calculateStats([]);
      }
      
      if (reasonsResponse.success) {
        // Extract returnReasons array from response.data
        const data = reasonsResponse.data || {};
        const returnReasons = data.returnReasons || [];
        setReturnTypes(Array.isArray(returnReasons) ? returnReasons : []);
      } else {
        console.error('Failed to fetch return reasons:', reasonsResponse.message);
        // Set empty data to prevent crashes
        setReturnTypes([]);
      }
      
    } catch (error) {
      console.error('Error loading returns data:', error);
      // Set empty data to prevent crashes
      setReturns([]);
      setReturnTypes([]);
      calculateStats([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (returnsData) => {
    const newStats = {
      total: returnsData.length,
      pending: returnsData.filter(r => r.status === 'pending').length,
      approved: returnsData.filter(r => r.status === 'approved').length,
      rejected: returnsData.filter(r => r.status === 'rejected').length,
      processing: returnsData.filter(r => r.status === 'processing').length,
      completed: returnsData.filter(r => r.status === 'completed').length,
      damaged: returnsData.filter(r => r.returnReason?.includes('DAMAGE')).length,
      expired: returnsData.filter(r => r.returnReason?.includes('EXPIR')).length,
      quality: returnsData.filter(r => r.returnReason?.includes('QUALITY')).length
    };
    setStats(newStats);
  };

  const handleCreateReturn = async (returnData) => {
    try {
      const divisionId = selectedDivision?.id || null;
      
      console.log('ReturnsHome - Creating return request with data:', returnData);
      
      const response = await returnsService.createReturnRequest(
        returnData,
        divisionId,
        showAllDivisions
      );
      
      console.log('ReturnsHome - Create return response:', response);
      
      if (response.success) {
        console.log('ReturnsHome - Return created successfully, refreshing data...');
        
        // Immediately add the new return to local state for instant UI update
        if (response.data && response.data.returnRequest) {
          const newReturn = response.data.returnRequest;
          console.log('ReturnsHome - Adding new return to local state:', newReturn);
          setReturns(prevReturns => {
            const updatedReturns = [newReturn, ...prevReturns];
            console.log('ReturnsHome - Updated returns array:', updatedReturns);
            return updatedReturns;
          });
          calculateStats([newReturn, ...returns]);
        }
        
        // Force refresh with a small delay to ensure backend has processed the request
        setTimeout(async () => {
          await loadReturnsData();
          console.log('ReturnsHome - Data refreshed after delay');
        }, 1000);
        
        setShowCreateModal(false);
        return { success: true, message: 'Return request created successfully' };
      } else {
        console.error('ReturnsHome - Failed to create return:', response.message);
        return { success: false, message: response.message || 'Failed to create return request' };
      }
    } catch (error) {
      console.error('Error creating return:', error);
      return { success: false, message: 'Error creating return request' };
    }
  };

  const handleUpdateReturn = async (returnId, updateData) => {
    try {
      const divisionId = selectedDivision?.id || null;
      
      const response = await fetchWithDivision(
        `/returns/requests/${returnId}`,
        localStorage.getItem("accessToken"),
        divisionId,
        showAllDivisions || divisionId === "all",
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData)
        }
      );
      
      if (response.success) {
        await loadReturnsData(); // Reload data
        return { success: true, message: 'Return updated successfully' };
      } else {
        return { success: false, message: response.message || 'Failed to update return' };
      }
    } catch (error) {
      console.error('Error updating return:', error);
      return { success: false, message: 'Error updating return' };
    }
  };

  const handleApproveReturn = async (returnId, approvalData) => {
    try {
      const divisionId = selectedDivision?.id || null;
      
      const response = await returnsService.approveRejectReturn(
        returnId,
        approvalData,
        divisionId,
        showAllDivisions
      );
      
      if (response.success) {
        console.log('Return request approved, now creating refund...');
        
        // After approving the return request, create a refund
        try {
          // Find the return request to get its details
          const returnRequest = returns.find(r => r.id === returnId);
          
          if (returnRequest) {
            const refundData = {
              refundMethod: approvalData.refundMethod || 'bank_transfer',
              refundNotes: approvalData.refundNotes || 'Refund created automatically after return approval',
              paymentReference: approvalData.paymentReference || `REF-${returnRequest.returnNumber}`,
              refundAmount: returnRequest.totalReturnAmount || 0
            };
            
            const refundResponse = await returnsService.createRefund(
              returnId,
              refundData,
              divisionId,
              showAllDivisions
            );
            
            if (refundResponse.success) {
              console.log('Refund created successfully:', refundResponse);
            } else {
              console.warn('Return approved but refund creation failed:', refundResponse.message);
            }
          }
        } catch (refundError) {
          console.error('Error creating refund after approval:', refundError);
          // Don't fail the entire approval if refund creation fails
        }
        
        await loadReturnsData(); // Reload data
        return { success: true, message: 'Return approved and refund created successfully' };
      } else {
        return { success: false, message: response.message || 'Failed to approve return' };
      }
    } catch (error) {
      console.error('Error approving return:', error);
      return { success: false, message: 'Error approving return' };
    }
  };

  const handleRejectReturn = async (returnId, rejectionData) => {
    try {
      const divisionId = selectedDivision?.id || null;
      
      const response = await returnsService.approveRejectReturn(
        returnId,
        rejectionData,
        divisionId,
        showAllDivisions
      );
      
      if (response.success) {
        await loadReturnsData(); // Reload data
        return { success: true, message: 'Return rejected successfully' };
      } else {
        return { success: false, message: response.message || 'Failed to reject return' };
      }
    } catch (error) {
      console.error('Error rejecting return:', error);
      return { success: false, message: 'Error rejecting return' };
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className={styles.returnsContainer}>
      {/* Header */}
      <div className={styles.returnsHeader}>
        <h1 className={styles.returnsTitle}>Returns Management</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="homebtn"
            onClick={() => setShowCreateModal(true)}
          >
            Create Return Request
          </button>
          <button 
            className="homebtn"
            onClick={() => navigate('/returns/returns-settings')}
          >
            Settings
          </button>
        </div>
      </div>


      {/* Tabs */}
      <div className={styles.returnsTabs}>
        <ul className={styles.tabList}>
          <li className={styles.tabItem}>
            <button
              className={`${styles.tabButton} ${activeTab === 'reports' ? styles.active : ''}`}
              onClick={() => setActiveTab('reports')}
            >
              Reports
            </button>
          </li>
          <li className={styles.tabItem}>
            <button
              className={`${styles.tabButton} ${activeTab === 'types' ? styles.active : ''}`}
              onClick={() => setActiveTab('types')}
            >
              Return Types
            </button>
          </li>
          <li className={styles.tabItem}>
            <button
              className={`${styles.tabButton} ${activeTab === 'requests' ? styles.active : ''}`}
              onClick={() => setActiveTab('requests')}
            >
              Return Requests
            </button>
          </li>
          <li className={styles.tabItem}>
            <button
              className={`${styles.tabButton} ${activeTab === 'refunds' ? styles.active : ''}`}
              onClick={() => setActiveTab('refunds')}
            >
              Refund Management
            </button>
          </li>
          {false && (
            <li className={styles.tabItem}>
              <button
                className={`${styles.tabButton} ${activeTab === 'test' ? styles.active : ''}`}
                onClick={() => setActiveTab('test')}
              >
                System Test
              </button>
            </li>
          )}
        </ul>

        <div className={styles.tabContent}>
          {activeTab === 'requests' && (
            <ReturnRequests
              returns={returns}
              returnTypes={returnTypes}
              onUpdateReturn={loadReturnsData}
              onApproveReturn={handleApproveReturn}
              onRejectReturn={handleRejectReturn}
              onRefresh={loadReturnsData}
            />
          )}
          {activeTab === 'refunds' && (
            <RefundManagement />
          )}
          {activeTab === 'reports' && (
            <ReturnReports
              returns={returns}
              returnTypes={returnTypes}
            />
          )}
          {activeTab === 'types' && (
            <ReturnTypes
              returnTypes={returnTypes}
              onRefresh={loadReturnsData}
            />
          )}
          {false && activeTab === 'test' && (
            <ReturnsSystemTest />
          )}
        </div>
      </div>

      {/* Create Return Modal */}
      {showCreateModal && (
        <CreateReturnRequestNew
          onClose={() => setShowCreateModal(false)}
          onSuccess={(result) => {
            console.log('Return created successfully:', result);
            if (result.success) {
              loadReturnsData();
            }
            setShowCreateModal(false);
          }}
        />
      )}
    </div>
  );
};

export default ReturnsHome;
