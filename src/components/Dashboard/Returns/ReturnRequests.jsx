import React, { useState } from 'react';
import { useAuth } from '../../../Auth';
import { useDivision } from '../../context/DivisionContext';
import returnsService from '../../../services/returnsService';
import styles from './Returns.module.css';
import ViewReturnModal from './ViewReturnModal';

const ReturnRequests = ({ 
  returns, 
  returnTypes, 
  onUpdateReturn, 
  onApproveReturn, 
  onRejectReturn, 
  onRefresh 
}) => {
  const { axiosAPI } = useAuth();
  const { selectedDivision, showAllDivisions } = useDivision();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);

  const user = JSON.parse(localStorage.getItem("user")) || { roles: [] };
  const userRoles = user.roles || [];
  
  // Debug logging
  console.log('ReturnRequests - User:', user);
  console.log('ReturnRequests - User roles:', userRoles);
  console.log('ReturnRequests - User roles types:', userRoles.map(role => ({ role, type: typeof role })));
  
  // More flexible role checking (case-insensitive and with variations)
  const isAdmin = userRoles.some(role => {
    const roleStr = typeof role === 'string' ? role : (role?.name || role?.role || String(role));
    return roleStr.toLowerCase().includes('admin') || 
           roleStr === 'Admin' || 
           roleStr === 'ADMIN';
  });
  const isManager = userRoles.some(role => {
    const roleStr = typeof role === 'string' ? role : (role?.name || role?.role || String(role));
    return roleStr.toLowerCase().includes('manager') || 
           roleStr === 'Manager' || 
           roleStr === 'MANAGER';
  });
  const isWarehouseManager = userRoles.some(role => {
    const roleStr = typeof role === 'string' ? role : (role?.name || role?.role || String(role));
    return roleStr.toLowerCase().includes('warehouse') || 
           roleStr === 'Warehouse Manager' || 
           roleStr === 'WAREHOUSE_MANAGER';
  });
  const isBO = userRoles.some(role => {
    const roleStr = typeof role === 'string' ? role : (role?.name || role?.role || String(role));
    return roleStr.toLowerCase().includes('bo') || 
           roleStr === 'BO' || 
           roleStr === 'Business Owner';
  });
  
  console.log('ReturnRequests - Permission check:', {
    isAdmin,
    isManager,
    isWarehouseManager,
    isBO
  });

  // Filter returns based on search and filters
  const filteredReturns = returns.filter(returnItem => {
    const matchesSearch = 
      returnItem.returnNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      returnItem.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      returnItem.salesOrderId?.toString().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || returnItem.status === statusFilter;
    const matchesType = typeFilter === 'all' || returnItem.returnReason === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleViewReturn = (returnItem) => {
    setSelectedReturn(returnItem);
    setShowViewModal(true);
  };

  const handleApproveReturn = async (returnItem) => {
    try {
      const divisionId = selectedDivision?.id || null;
      
      const approvalData = {
        approvalStatus: 'approved',
        approvalRemarks: 'Approved from view modal',
        approvedBy: JSON.parse(localStorage.getItem("user"))?.id,
        approvedAt: new Date().toISOString()
      };
      
      // Use the correct API endpoint: PUT /returns/requests/:id/approve
      const response = await returnsService.approveRejectReturn(
        returnItem.id,
        approvalData,
        divisionId,
        showAllDivisions
      );
      
      if (response.success) {
        console.log('Return request approved, now creating refund...');
        
        // After approving the return request, create a refund
        try {
          const refundData = {
            refundMethod: 'bank_transfer', // Default refund method
            refundNotes: 'Refund created automatically after return approval',
            paymentReference: `REF-${returnItem.returnNumber}`,
            refundAmount: returnItem.totalReturnAmount || 0
          };
          
          const refundResponse = await returnsService.createRefund(
            returnItem.id,
            refundData,
            divisionId,
            showAllDivisions
          );
          
          if (refundResponse.success) {
            console.log('Refund created successfully:', refundResponse);
            alert('Return request approved and refund created successfully!');
          } else {
            console.warn('Return approved but refund creation failed:', refundResponse.message);
            alert('Return request approved, but failed to create refund: ' + (refundResponse.message || 'Unknown error'));
          }
        } catch (refundError) {
          console.error('Error creating refund after approval:', refundError);
          alert('Return request approved, but failed to create refund: ' + refundError.message);
        }
        
        onRefresh(); // Reload data
        setShowViewModal(false);
        setSelectedReturn(null);
      } else {
        alert(response.message || 'Failed to approve return request');
      }
    } catch (error) {
      console.error('Error approving return:', error);
      alert('Error approving return request');
    }
  };

  const handleRejectReturn = async (returnItem) => {
    try {
      const divisionId = selectedDivision?.id || null;
      
      const rejectionData = {
        approvalStatus: 'rejected',
        approvalRemarks: 'Rejected from view modal',
        rejectedBy: JSON.parse(localStorage.getItem("user"))?.id,
        rejectedAt: new Date().toISOString()
      };
      
      // Use the correct API endpoint: PUT /returns/requests/:id/approve
      const response = await returnsService.approveRejectReturn(
        returnItem.id,
        rejectionData,
        divisionId,
        showAllDivisions
      );
      
      if (response.success) {
        alert('Return request rejected successfully');
        onRefresh(); // Reload data
        setShowViewModal(false);
        setSelectedReturn(null);
      } else {
        alert(response.message || 'Failed to reject return request');
      }
    } catch (error) {
      console.error('Error rejecting return:', error);
      alert('Error rejecting return request');
    }
  };


  const handleGenerateCreditNote = async (returnItem) => {
    try {
      const divisionId = selectedDivision?.id || null;
      
      const refundData = {
        refundMethod: 'credit_note',
        refundNotes: 'Credit note for return request',
        paymentReference: `CN-${returnItem.returnNumber}`
      };
      
      const response = await returnsService.createRefund(
        returnItem.id,
        refundData,
        divisionId,
        showAllDivisions
      );
      
      if (response.success) {
        alert('Credit note generated successfully');
        onRefresh();
      } else {
        alert(response.message || 'Failed to generate credit note');
      }
    } catch (error) {
      console.error('Error generating credit note:', error);
      alert('Error generating credit note');
    }
  };

  const handleProcessReturn = async (returnItem) => {
    try {
      const divisionId = selectedDivision?.id || null;
      
      const updateData = {
        status: 'processing',
        processedBy: user.id,
        processedAt: new Date().toISOString()
      };
      
      const response = await returnsService.approveRejectReturn(
        returnItem.id,
        updateData,
        divisionId,
        showAllDivisions
      );
      
      if (response.success) {
        alert('Return marked as processing');
        onRefresh();
      } else {
        alert(response.message || 'Failed to process return');
      }
    } catch (error) {
      console.error('Error processing return:', error);
      alert('Error processing return');
    }
  };

  const handleCompleteReturn = async (returnItem) => {
    try {
      const divisionId = selectedDivision?.id || null;
      
      const updateData = {
        status: 'completed',
        completedBy: user.id,
        completedAt: new Date().toISOString()
      };
      
      const response = await returnsService.approveRejectReturn(
        returnItem.id,
        updateData,
        divisionId,
        showAllDivisions
      );
      
      if (response.success) {
        alert('Return completed successfully');
        onRefresh();
      } else {
        alert(response.message || 'Failed to complete return');
      }
    } catch (error) {
      console.error('Error completing return:', error);
      alert('Error completing return');
    }
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      pending: styles.pending,
      approved: styles.approved,
      rejected: styles.rejected,
      processing: styles.processing,
      completed: styles.approved
    };
    
    return `${styles.statusBadge} ${statusClasses[status] || styles.pending}`;
  };

  const getTypeBadge = (type) => {
    const typeClasses = {
      damaged: styles.damaged,
      expired: styles.expired,
      quality: styles.quality,
      cancellation: styles.cancellation
    };
    
    return `${styles.typeBadge} ${typeClasses[type] || styles.cancellation}`;
  };

  // For testing purposes, allow approval if user has any role or if we can't determine roles
  const canApprove = isAdmin || isManager || userRoles.length > 0 || true; // Always allow for testing
  const canProcess = isAdmin || isManager || isWarehouseManager || userRoles.length > 0 || true;
  const canCreate = isAdmin || isManager || isWarehouseManager || isBO || userRoles.length > 0 || true;
  
  console.log('ReturnRequests - Final permissions:', {
    canApprove,
    canProcess,
    canCreate,
    userRolesLength: userRoles.length
  });

  if (filteredReturns.length === 0) {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>Return Requests Management</h2>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div className={styles.searchContainer}>
              <input
                type="text"
                placeholder="Search returns..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-control"
                style={{ width: '200px' }}
              />
            </div>
            <div className={styles.filterContainer}>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="form-select"
                style={{ width: '150px' }}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div className={styles.filterContainer}>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="form-select"
                style={{ width: '150px' }}
              >
                <option value="all">All Types</option>
                <option value="damaged">Damaged</option>
                <option value="expired">Expired</option>
                <option value="quality">Quality</option>
                <option value="cancellation">Cancellation</option>
              </select>
            </div>
            <button
              className={`${styles.btn} ${styles.btnPrimary}`}
              onClick={onRefresh}
              title="Refresh Data"
            >
              <i className="bi bi-arrow-clockwise"></i> Refresh
            </button>
          </div>
        </div>

        {/* Informational alert removed as per request */}
        
        <div className={styles.emptyState}>
          <div className={styles.emptyStateIcon}>
            <i className="bi bi-inbox" style={{ fontSize: '48px', color: '#6c757d' }}></i>
          </div>
          <h4 className={styles.emptyStateTitle}>No Return Requests Found</h4>
          <p className={styles.emptyStateText}>
            {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' 
              ? 'No return requests match your current filters. Try adjusting your search criteria.'
              : 'There are no return requests in the system yet. Create your first return request to get started.'
            }
          </p>
          <div className={styles.emptyStateActions}>
            <button
              className={`${styles.btn} ${styles.btnPrimary}`}
              onClick={onRefresh}
            >
              <i className="bi bi-arrow-clockwise"></i> Refresh Data
            </button>
            {(searchTerm || statusFilter !== 'all' || typeFilter !== 'all') && (
              <button
                className={`${styles.btn} ${styles.btnSecondary}`}
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setTypeFilter('all');
                }}
              >
                <i className="bi bi-x-circle"></i> Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Return Requests Management</h2>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div className={styles.searchContainer}>
            <input
              type="text"
              placeholder="Search returns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-control"
              style={{ width: '200px' }}
            />
          </div>
          <div className={styles.filterContainer}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-select"
              style={{ width: '150px' }}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div className={styles.filterContainer}>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="form-select"
              style={{ width: '150px' }}
            >
              <option value="all">All Types</option>
              <option value="damaged">Damaged</option>
              <option value="expired">Expired</option>
              <option value="quality">Quality</option>
              <option value="cancellation">Cancellation</option>
            </select>
          </div>
          <button
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={onRefresh}
            title="Refresh Data"
          >
            <i className="bi bi-arrow-clockwise"></i> Refresh
          </button>
        </div>
      </div>

      {/* Informational alert removed as per request */}

      <table className="table table-bordered borderedtable">
        <thead>
          <tr>
            <th>Return Number</th>
            <th>Order Details</th>
            <th>Customer</th>
            <th>Return Type</th>
            <th>Status</th>
            <th>Amount</th>
            <th>Items</th>
            <th>Created Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredReturns.map((returnItem) => (
            <tr key={returnItem.id}>
              <td>
                <div>
                  <strong>{returnItem.returnNumber || `RET-${returnItem.id}`}</strong>
                  <br />
                  <small className="text-muted">ID: {returnItem.id}</small>
                </div>
              </td>
              <td>
                <div>
                  <strong>{returnItem.salesOrder?.orderNumber || returnItem.salesOrderId}</strong>
                  <br />
                  <small className="text-muted">Order ID: {returnItem.salesOrderId}</small>
                </div>
              </td>
              <td>
                <div>
                  <strong>{returnItem.salesOrder?.customer?.customerName || 
                           returnItem.salesOrder?.customer?.name || 
                           returnItem.customer?.name || 'N/A'}</strong>
                  {returnItem.salesOrder?.customer?.mobile && (
                    <>
                      <br />
                      <small className="text-muted">{returnItem.salesOrder.customer.mobile}</small>
                    </>
                  )}
                </div>
              </td>
              <td>
                <div>
                  <span className={getTypeBadge(returnItem.returnReason)}>
                    {returnItem.returnReason || 'N/A'}
                  </span>
                  {returnItem.returnType && (
                    <>
                      <br />
                      <small className="text-muted">
                        {returnItem.returnType === 'full' ? 'Full Return' : 'Partial Return'}
                      </small>
                    </>
                  )}
                </div>
              </td>
              <td>
                <div>
                  <span className={getStatusBadge(returnItem.status)}>
                    {returnItem.status?.charAt(0).toUpperCase() + returnItem.status?.slice(1) || 'Pending'}
                  </span>
                  {returnItem.processedAt && (
                    <>
                      <br />
                      <small className="text-muted">
                        {new Date(returnItem.processedAt).toLocaleDateString()}
                      </small>
                    </>
                  )}
                </div>
              </td>
              <td>
                <div>
                  <strong className="text-success">
                    ₹{returnItem.returnItems?.reduce((total, item) => total + (item.returnQuantity * (item.product?.unitPrice || 0)), 0).toLocaleString() || '0'}
                  </strong>
                  {returnItem.returnItems && returnItem.returnItems.length > 0 && (
                    <>
                      <br />
                      <small className="text-muted">
                        {returnItem.returnItems.length} item{returnItem.returnItems.length !== 1 ? 's' : ''}
                      </small>
                    </>
                  )}
                </div>
              </td>
              <td>
                <div>
                  {returnItem.returnItems && returnItem.returnItems.length > 0 ? (
                    <div>
                      {returnItem.returnItems.slice(0, 2).map((item, index) => (
                        <div key={index} className="d-flex justify-content-between align-items-center mb-1">
                          <span className="text-truncate me-2" style={{maxWidth: '120px'}}>
                            {item.product?.productName || 'Unknown Product'}
                          </span>
                          <span className="badge bg-secondary">
                            Qty: {item.returnQuantity}
                          </span>
                        </div>
                      ))}
                      {returnItem.returnItems.length > 2 && (
                        <small className="text-info">
                          +{returnItem.returnItems.length - 2} more items
                        </small>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted">No items</span>
                  )}
                </div>
              </td>
              <td>
                <div>
                  <strong>{new Date(returnItem.createdAt).toLocaleDateString()}</strong>
                  <br />
                  <small className="text-muted">
                    {new Date(returnItem.createdAt).toLocaleTimeString()}
                  </small>
                </div>
              </td>
              <td>
                <div className="d-flex gap-1 flex-wrap">
                  <button
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => handleViewReturn(returnItem)}
                    title="View Details"
                  >
                    <i className="bi bi-eye"></i>
                  </button>
                  
                  {returnItem.status === 'approved' && canProcess && (
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => handleProcessReturn(returnItem)}
                      title="Process Return"
                    >
                      <i className="bi bi-gear"></i>
                    </button>
                  )}
                  
                  {returnItem.status === 'processing' && canProcess && (
                    <button
                      className="btn btn-sm btn-success"
                      onClick={() => handleCompleteReturn(returnItem)}
                      title="Complete Return"
                    >
                      <i className="bi bi-check2-all"></i>
                    </button>
                  )}
                  
                  {returnItem.status === 'approved' && returnItem.allowsCreditNote && (
                    <button
                      className="btn btn-sm btn-warning"
                      onClick={() => handleGenerateCreditNote(returnItem)}
                      title="Generate Credit Note"
                    >
                      <i className="bi bi-receipt"></i>
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* View Return Modal */}
      {showViewModal && selectedReturn && (
        <ViewReturnModal
          returnItem={selectedReturn}
          onClose={() => {
            setShowViewModal(false);
            setSelectedReturn(null);
          }}
          onApprove={handleApproveReturn}
          onReject={handleRejectReturn}
          canApprove={canApprove}
        />
      )}

    </div>
  );
};

export default ReturnRequests;
