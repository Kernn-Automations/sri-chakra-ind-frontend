import React, { useState } from 'react';
import styles from './Returns.module.css';

const RejectReturnModal = ({ returnItem, onReject, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    approvalStatus: 'rejected',
    rejectionReason: ''
  });

  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.rejectionReason.trim()) {
      newErrors.rejectionReason = 'Rejection reason is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      const result = await onReject(returnItem.id, formData);
      
      if (result.success) {
        onClose();
      } else {
        alert(result.message || 'Failed to reject return');
      }
    } catch (error) {
      console.error('Error rejecting return:', error);
      alert('Error rejecting return');
    } finally {
      setLoading(false);
    }
  };

  const rejectionReasons = [
    'Return period expired',
    'Product not in original condition',
    'Missing required documentation',
    'Customer error in order',
    'Product used or consumed',
    'Return not covered by warranty',
    'Insufficient evidence of defect',
    'Other (specify in notes)'
  ];

  return (
    <div className={styles.modal}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Reject Return Request</h3>
          <button 
            className={styles.closeButton}
            onClick={onClose}
          >
            ×
          </button>
        </div>
        
        {/* Return Summary */}
        <div style={{ 
          backgroundColor: '#f8d7da', 
          padding: '15px', 
          borderRadius: '5px', 
          marginBottom: '20px',
          border: '1px solid #f5c6cb'
        }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#721c24' }}>Return to be Rejected</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '14px' }}>
            <div><strong>Return #:</strong> {returnItem.returnNumber}</div>
            <div><strong>Order #:</strong> {returnItem.salesOrder?.orderNumber}</div>
            <div><strong>Customer:</strong> {returnItem.salesOrder?.customer?.customerName}</div>
            <div><strong>Return Case:</strong> {returnItem.returnCase}</div>
            <div><strong>Return Reason:</strong> {returnItem.returnReason}</div>
            <div><strong>Status:</strong> {returnItem.status}</div>
          </div>
          
          {returnItem.returnItems && returnItem.returnItems.length > 0 && (
            <div style={{ marginTop: '10px' }}>
              <strong>Return Items:</strong>
              <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                {returnItem.returnItems.map((item, index) => (
                  <li key={index}>
                    {item.product?.productName} - Qty: {item.returnQuantity} {item.unit} 
                    ({item.itemCondition})
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Rejection Reason *</label>
            <select
              name="rejectionReason"
              value={formData.rejectionReason}
              onChange={handleInputChange}
              className={styles.formSelect}
              required
            >
              <option value="">Select rejection reason</option>
              {rejectionReasons.map((reason, index) => (
                <option key={index} value={reason}>
                  {reason}
                </option>
              ))}
            </select>
            {errors.rejectionReason && (
              <div className={styles.alertError} style={{ marginTop: '5px', padding: '8px' }}>
                {errors.rejectionReason}
              </div>
            )}
          </div>
          
          <div className={styles.alert + ' ' + styles.alertWarning}>
            <strong>Warning:</strong> Once rejected, this return request cannot be undone. Please ensure all information is accurate before proceeding.
          </div>
          
          <div className={styles.modalFooter}>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnSecondary}`}
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`${styles.btn} ${styles.btnDanger}`}
              disabled={loading}
            >
              {loading ? 'Rejecting...' : 'Reject Return'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RejectReturnModal;
