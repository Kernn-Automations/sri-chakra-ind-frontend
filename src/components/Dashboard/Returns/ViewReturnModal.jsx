import React from 'react';
import styles from './Returns.module.css';
import ReturnImageManagement from './ReturnImageManagement';

const ViewReturnModal = ({ returnItem, onClose, onApprove, onReject, canApprove }) => {
  // Debug logging
  console.log('ViewReturnModal - returnItem.status:', returnItem.status);
  console.log('ViewReturnModal - canApprove:', canApprove);
  console.log('ViewReturnModal - should show buttons:', returnItem.status === 'pending' && canApprove);
  console.log('ViewReturnModal - returnItem:', returnItem);
  console.log('ViewReturnModal - onApprove function:', typeof onApprove);
  console.log('ViewReturnModal - onReject function:', typeof onReject);

  const handleApproveClick = () => {
    if (window.confirm('Are you sure you want to approve this return request?')) {
      onApprove && onApprove(returnItem);
    }
  };

  const handleRejectClick = () => {
    if (window.confirm('Are you sure you want to reject this return request?')) {
      onReject && onReject(returnItem);
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

  const getPriorityBadge = (priority) => {
    const priorityClasses = {
      low: styles.alertInfo,
      medium: styles.alertWarning,
      high: styles.alertError,
      urgent: styles.alertError
    };
    
    return `${styles.statusBadge} ${priorityClasses[priority] || styles.alertInfo}`;
  };

  return (
    <div className={styles.modal}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <div className="d-flex align-items-center">
            <h3 className={styles.modalTitle}>Return Request Details</h3>
            <span className={`${getStatusBadge(returnItem.status)} ms-3`}>
              {returnItem.status?.charAt(0).toUpperCase() + returnItem.status?.slice(1)}
            </span>
            {returnItem.status === 'pending' && canApprove && (
              <span className="badge bg-warning ms-2">
                <i className="bi bi-exclamation-triangle me-1"></i>
                Requires Approval
              </span>
            )}
          </div>
          <button 
            className={styles.closeButton}
            onClick={onClose}
          >
            ×
          </button>
        </div>
        
        <div style={{ display: 'grid', gap: '20px' }}>
          {/* Basic Information */}
          <div>
            <h4 style={{ marginBottom: '15px', color: '#2c3e50', borderBottom: '2px solid #ecf0f1', paddingBottom: '8px' }}>
              Basic Information
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <strong>Return Number:</strong>
                <p>{returnItem.returnNumber}</p>
              </div>
              <div>
                <strong>Order Number:</strong>
                <p>{returnItem.salesOrderId}</p>
              </div>
              <div>
                <strong>Customer:</strong>
                <p>{returnItem.customer?.name || 'N/A'}</p>
              </div>
              <div>
                <strong>Customer Mobile:</strong>
                <p>{returnItem.customer?.mobile || 'N/A'}</p>
              </div>
              <div>
                <strong>Status:</strong>
                <p>
                  <span className={getStatusBadge(returnItem.status)}>
                    {returnItem.status}
                  </span>
                </p>
              </div>
              <div>
                <strong>Priority:</strong>
                <p>
                  <span className={getPriorityBadge(returnItem.priority)}>
                    {returnItem.priority}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Return Details */}
          <div>
            <h4 style={{ marginBottom: '15px', color: '#2c3e50', borderBottom: '2px solid #ecf0f1', paddingBottom: '8px' }}>
              Return Details
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <strong>Return Reason:</strong>
                <p>
                  <span className={getTypeBadge(returnItem.returnReason)}>
                    {returnItem.returnReason}
                  </span>
                </p>
              </div>
              <div>
                <strong>Custom Reason:</strong>
                <p>{returnItem.customReason || 'N/A'}</p>
              </div>
              <div>
                <strong>Total Return Amount:</strong>
                <p>₹{returnItem.totalReturnAmount?.toLocaleString()}</p>
              </div>
              <div>
                <strong>Refund Amount:</strong>
                <p>₹{returnItem.refundAmount?.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Return Type Settings */}
          <div>
            <h4 style={{ marginBottom: '15px', color: '#2c3e50', borderBottom: '2px solid #ecf0f1', paddingBottom: '8px' }}>
              Return Type Settings
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
              <div>
                <strong>Requires Inspection:</strong>
                <p>
                  <span className={returnItem.requiresInspection ? styles.alertSuccess : styles.alertError}>
                    {returnItem.requiresInspection ? 'Yes' : 'No'}
                  </span>
                </p>
              </div>
              <div>
                <strong>Allows Replacement:</strong>
                <p>
                  <span className={returnItem.requiresReplacement ? styles.alertSuccess : styles.alertError}>
                    {returnItem.requiresReplacement ? 'Yes' : 'No'}
                  </span>
                </p>
              </div>
              <div>
                <strong>Allows Credit Note:</strong>
                <p>
                  <span className={returnItem.allowsCreditNote ? styles.alertSuccess : styles.alertError}>
                    {returnItem.allowsCreditNote ? 'Yes' : 'No'}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Notes */}
          {returnItem.notes && (
            <div>
              <h4 style={{ marginBottom: '15px', color: '#2c3e50', borderBottom: '2px solid #ecf0f1', paddingBottom: '8px' }}>
                Notes
              </h4>
              <p style={{ 
                padding: '15px', 
                backgroundColor: '#f8f9fa', 
                borderRadius: '5px',
                border: '1px solid #ecf0f1',
                lineHeight: '1.6'
              }}>
                {returnItem.notes}
              </p>
            </div>
          )}

          {/* Timeline */}
          <div>
            <h4 style={{ marginBottom: '15px', color: '#2c3e50', borderBottom: '2px solid #ecf0f1', paddingBottom: '8px' }}>
              Timeline
            </h4>
            <div style={{ display: 'grid', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #ecf0f1' }}>
                <span><strong>Created:</strong></span>
                <span>{new Date(returnItem.createdAt).toLocaleString()}</span>
              </div>
              {returnItem.approvedAt && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #ecf0f1' }}>
                  <span><strong>Approved:</strong></span>
                  <span>{new Date(returnItem.approvedAt).toLocaleString()}</span>
                </div>
              )}
              {returnItem.processedAt && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #ecf0f1' }}>
                  <span><strong>Processed:</strong></span>
                  <span>{new Date(returnItem.processedAt).toLocaleString()}</span>
                </div>
              )}
              {returnItem.completedAt && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #ecf0f1' }}>
                  <span><strong>Completed:</strong></span>
                  <span>{new Date(returnItem.completedAt).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Approval Information */}
          {(returnItem.status === 'approved' || returnItem.status === 'rejected') && (
            <div>
              <h4 style={{ marginBottom: '15px', color: '#2c3e50', borderBottom: '2px solid #ecf0f1', paddingBottom: '8px' }}>
                Approval Information
              </h4>
              <div style={{ display: 'grid', gap: '10px' }}>
                {returnItem.approvedBy && (
                  <div>
                    <strong>Approved By:</strong>
                    <p>{returnItem.approvedBy}</p>
                  </div>
                )}
                {returnItem.approvalNotes && (
                  <div>
                    <strong>Approval Notes:</strong>
                    <p style={{ 
                      padding: '10px', 
                      backgroundColor: '#f8f9fa', 
                      borderRadius: '5px',
                      border: '1px solid #ecf0f1'
                    }}>
                      {returnItem.approvalNotes}
                    </p>
                  </div>
                )}
                {returnItem.rejectionReason && (
                  <div>
                    <strong>Rejection Reason:</strong>
                    <p style={{ 
                      padding: '10px', 
                      backgroundColor: '#f8d7da', 
                      borderRadius: '5px',
                      border: '1px solid #f5c6cb',
                      color: '#721c24'
                    }}>
                      {returnItem.rejectionReason}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Image Management */}
          {returnItem.id && (
            <div>
              <h4 style={{ marginBottom: '15px', color: '#2c3e50', borderBottom: '2px solid #ecf0f1', paddingBottom: '8px' }}>
                Images
              </h4>
              <ReturnImageManagement 
                returnItemId={returnItem.id}
                onImagesUpdated={() => {
                  // Optionally refresh return item data
                }}
              />
            </div>
          )}
        </div>
        
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '30px',
          paddingTop: '20px',
          borderTop: '1px solid #ecf0f1'
        }}>
          <div>
            {returnItem.status === 'pending' && canApprove ? (
              <>
                <button
                  type="button"
                  className="btn btn-success me-2"
                  onClick={handleApproveClick}
                  title="Approve Return Request"
                >
                  <i className="bi bi-check-circle me-1"></i>
                  Approve
                </button>
                <button
                  type="button"
                  className="btn btn-danger me-2"
                  onClick={handleRejectClick}
                  title="Reject Return Request"
                >
                  <i className="bi bi-x-circle me-1"></i>
                  Decline
                </button>
              </>
            ) : (
              <div className="text-muted">
                <small>
                  {returnItem.status !== 'pending' 
                    ? `Status: ${returnItem.status} - No action required`
                    : !canApprove 
                      ? 'No approval permissions'
                      : 'No actions available'
                  }
                </small>
              </div>
            )}
          </div>
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={onClose}
          >
            <i className="bi bi-x-lg me-1"></i>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewReturnModal;
