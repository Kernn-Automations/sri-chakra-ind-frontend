import React, { useState } from 'react';
import { useAuth } from '../../../Auth';
import { useDivision } from '../../context/DivisionContext';
import returnsService from '../../../services/returnsService';
import { showSuccessNotification, showErrorNotification } from '../../../utils/errorHandler';
import styles from './Returns.module.css';

const ApprovalWorkflow = ({ returnRequest, onApprovalComplete, onClose }) => {
  const { axiosAPI } = useAuth();
  const { selectedDivision, showAllDivisions } = useDivision();
  
  const [approvalData, setApprovalData] = useState({
    approvalStatus: 'approved',
    approvalRemarks: '',
    refundMethod: '',
    refundNotes: '',
    paymentReference: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [step, setStep] = useState(1); // 1: Approve/Reject, 2: Create Refund

  const user = JSON.parse(localStorage.getItem("user")) || {};

  const handleInputChange = (field, value) => {
    setApprovalData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateApproval = () => {
    const newErrors = {};
    
    if (!approvalData.approvalRemarks.trim()) {
      newErrors.approvalRemarks = 'Approval remarks are required';
    }
    
    if (approvalData.approvalStatus === 'approved' && !approvalData.refundMethod) {
      newErrors.refundMethod = 'Refund method is required for approved returns';
    }
    
    if (approvalData.refundMethod === 'bank_transfer' && !approvalData.paymentReference.trim()) {
      newErrors.paymentReference = 'Payment reference is required for bank transfer';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleApproval = async () => {
    if (!validateApproval()) {
      return;
    }
    
    setLoading(true);
    
    try {
      const divisionId = selectedDivision?.id || null;
      
      // First, approve/reject the return request
      const approvalResponse = await returnsService.approveRejectReturn(
        returnRequest.id,
        {
          approvalStatus: approvalData.approvalStatus,
          approvalRemarks: approvalData.approvalRemarks,
          approvedBy: user.id,
          approvedAt: new Date().toISOString()
        },
        divisionId,
        showAllDivisions
      );
      
      if (!approvalResponse.success) {
        throw new Error(approvalResponse.message || 'Failed to process approval');
      }
      
      // If approved, create refund
      if (approvalData.approvalStatus === 'approved') {
        const refundResponse = await returnsService.createRefund(
          returnRequest.id,
          {
            refundMethod: approvalData.refundMethod,
            refundNotes: approvalData.refundNotes,
            paymentReference: approvalData.paymentReference,
            refundAmount: returnRequest.totalReturnAmount
          },
          divisionId,
          showAllDivisions
        );
        
        if (!refundResponse.success) {
          throw new Error(refundResponse.message || 'Failed to create refund');
        }
      }
      
      showSuccessNotification(
        `Return request ${approvalData.approvalStatus} successfully`,
        { title: 'Success' }
      );
      
      onApprovalComplete();
      
    } catch (error) {
      console.error('Error processing approval:', error);
      showErrorNotification(error, { title: 'Approval Error' });
    } finally {
      setLoading(false);
    }
  };

  const handleReject = () => {
    setApprovalData(prev => ({
      ...prev,
      approvalStatus: 'rejected'
    }));
    setStep(1);
  };

  const handleApprove = () => {
    setApprovalData(prev => ({
      ...prev,
      approvalStatus: 'approved'
    }));
    setStep(2);
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      pending: styles.pending,
      approved: styles.approved,
      rejected: styles.rejected,
      processing: styles.processing,
      completed: styles.completed
    };
    
    return `${styles.statusBadge} ${statusClasses[status] || styles.pending}`;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  return (
    <div className={styles.modal}>
      <div className={styles.modalContent} style={{ maxWidth: '800px' }}>
        <div className={styles.modalHeader}>
          <h4>Process Return Request - {returnRequest.returnNumber}</h4>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>
        
        <div className={styles.modalBody}>
          {/* Return Request Summary */}
          <div className="card mb-4">
            <div className="card-header">
              <h6 className="mb-0">Return Request Summary</h6>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <p><strong>Return Number:</strong> {returnRequest.returnNumber}</p>
                  <p><strong>Order Number:</strong> {returnRequest.salesOrder?.orderNumber}</p>
                  <p><strong>Customer:</strong> {returnRequest.salesOrder?.customer?.customerName}</p>
                </div>
                <div className="col-md-6">
                  <p><strong>Total Amount:</strong> {formatCurrency(returnRequest.totalReturnAmount || 0)}</p>
                  <p><strong>Return Reason:</strong> {returnRequest.returnReason}</p>
                  <p><strong>Status:</strong> 
                    <span className={`ms-1 ${getStatusBadge(returnRequest.status)}`}>
                      {returnRequest.status}
                    </span>
                  </p>
                </div>
              </div>
              
              {/* Return Items */}
              <div className="mt-3">
                <h6>Return Items:</h6>
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Quantity</th>
                        <th>Unit Price</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {returnRequest.returnItems?.map((item, index) => (
                        <tr key={item.id || index}>
                          <td>{item.product?.name}</td>
                          <td>{item.returnQuantity} {item.unit}</td>
                          <td>{formatCurrency(item.unitPrice || 0)}</td>
                          <td>{formatCurrency((item.returnQuantity || 0) * (item.unitPrice || 0))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Approval Steps */}
          {step === 1 && (
            <div className="card">
              <div className="card-header">
                <h6 className="mb-0">Step 1: Approve or Reject Return Request</h6>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <label className="form-label">Decision *</label>
                  <div className="d-flex gap-3">
                    <button
                      type="button"
                      className={`btn ${approvalData.approvalStatus === 'approved' ? 'btn-success' : 'btn-outline-success'}`}
                      onClick={handleApprove}
                    >
                      <i className="bi bi-check-circle me-1"></i>
                      Approve
                    </button>
                    <button
                      type="button"
                      className={`btn ${approvalData.approvalStatus === 'rejected' ? 'btn-danger' : 'btn-outline-danger'}`}
                      onClick={handleReject}
                    >
                      <i className="bi bi-x-circle me-1"></i>
                      Reject
                    </button>
                  </div>
                </div>
                
                <div className="mb-3">
                  <label className="form-label">Remarks *</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={approvalData.approvalRemarks}
                    onChange={(e) => handleInputChange('approvalRemarks', e.target.value)}
                    placeholder="Enter your approval or rejection remarks..."
                  />
                  {errors.approvalRemarks && (
                    <div className="text-danger small mt-1">{errors.approvalRemarks}</div>
                  )}
                </div>
                
                {approvalData.approvalStatus && (
                  <div className="d-flex justify-content-end">
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => setStep(2)}
                    >
                      Next: {approvalData.approvalStatus === 'approved' ? 'Create Refund' : 'Complete'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 2 && approvalData.approvalStatus === 'approved' && (
            <div className="card">
              <div className="card-header">
                <h6 className="mb-0">Step 2: Create Refund</h6>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <label className="form-label">Refund Method *</label>
                  <select
                    className="form-select"
                    value={approvalData.refundMethod}
                    onChange={(e) => handleInputChange('refundMethod', e.target.value)}
                  >
                    <option value="">Select refund method</option>
                    <option value="cash">Cash</option>
                    <option value="upi">UPI</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="credit_note">Credit Note</option>
                    <option value="adjustment">Adjustment</option>
                  </select>
                  {errors.refundMethod && (
                    <div className="text-danger small mt-1">{errors.refundMethod}</div>
                  )}
                </div>
                
                {approvalData.refundMethod === 'bank_transfer' && (
                  <div className="mb-3">
                    <label className="form-label">Payment Reference *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={approvalData.paymentReference}
                      onChange={(e) => handleInputChange('paymentReference', e.target.value)}
                      placeholder="Transaction ID or reference number"
                    />
                    {errors.paymentReference && (
                      <div className="text-danger small mt-1">{errors.paymentReference}</div>
                    )}
                  </div>
                )}
                
                <div className="mb-3">
                  <label className="form-label">Refund Notes</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={approvalData.refundNotes}
                    onChange={(e) => handleInputChange('refundNotes', e.target.value)}
                    placeholder="Additional notes about the refund..."
                  />
                </div>
                
                <div className="alert alert-info">
                  <strong>Refund Amount:</strong> {formatCurrency(returnRequest.totalReturnAmount || 0)}
                </div>
              </div>
            </div>
          )}

          {step === 2 && approvalData.approvalStatus === 'rejected' && (
            <div className="card">
              <div className="card-header">
                <h6 className="mb-0">Step 2: Confirm Rejection</h6>
              </div>
              <div className="card-body">
                <div className="alert alert-warning">
                  <strong>Confirm Rejection</strong>
                  <p className="mb-0">Are you sure you want to reject this return request? This action cannot be undone.</p>
                </div>
                
                <div className="mb-3">
                  <label className="form-label">Rejection Remarks</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={approvalData.approvalRemarks}
                    onChange={(e) => handleInputChange('approvalRemarks', e.target.value)}
                    placeholder="Enter detailed rejection remarks..."
                  />
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className={styles.modalFooter}>
          <div className="d-flex justify-content-between">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setStep(1)}
              disabled={step === 1}
            >
              <i className="bi bi-arrow-left me-1"></i>
              Back
            </button>
            
            <div className="d-flex gap-2">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`btn ${approvalData.approvalStatus === 'approved' ? 'btn-success' : 'btn-danger'}`}
                onClick={handleApproval}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                    Processing...
                  </>
                ) : (
                  <>
                    <i className={`bi ${approvalData.approvalStatus === 'approved' ? 'bi-check-circle' : 'bi-x-circle'} me-1`}></i>
                    {approvalData.approvalStatus === 'approved' ? 'Approve & Create Refund' : 'Reject Return'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApprovalWorkflow;
