import React, { useState } from 'react';
import styles from './Returns.module.css';

const ApproveReturnModal = ({ returnItem, onApprove, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    approvalStatus: 'approved',
    approvalRemarks: ''
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
    
    if (!formData.approvalRemarks.trim()) {
      newErrors.approvalRemarks = 'Approval remarks are required';
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
      const result = await onApprove(returnItem.id, formData);
      
      if (result.success) {
        onClose();
      } else {
        alert(result.message || 'Failed to approve return');
      }
    } catch (error) {
      console.error('Error approving return:', error);
      alert('Error approving return');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modal}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Approve Return Request</h3>
          <button 
            className={styles.closeButton}
            onClick={onClose}
          >
            ×
          </button>
        </div>
        
        {/* Return Summary */}
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '15px', 
          borderRadius: '5px', 
          marginBottom: '20px',
          border: '1px solid #ecf0f1'
        }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>Return Summary</h4>
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
            <label className={styles.formLabel}>Approval Remarks *</label>
            <textarea
              name="approvalRemarks"
              value={formData.approvalRemarks}
              onChange={handleInputChange}
              className={styles.formTextarea}
              placeholder="Enter your approval remarks and any special instructions..."
              rows="4"
              required
            />
            {errors.approvalRemarks && (
              <div className={styles.alertError} style={{ marginTop: '5px', padding: '8px' }}>
                {errors.approvalRemarks}
              </div>
            )}
          </div>
          
          <div className={styles.alert + ' ' + styles.alertInfo}>
            <strong>Note:</strong> Once approved, this return request will be moved to approved status and a refund can be created.
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
              className={`${styles.btn} ${styles.btnSuccess}`}
              disabled={loading}
            >
              {loading ? 'Approving...' : 'Approve Return'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApproveReturnModal;
