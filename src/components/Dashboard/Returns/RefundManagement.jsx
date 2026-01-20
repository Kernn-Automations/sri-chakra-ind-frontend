import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../Auth';
import { useDivision } from '../../context/DivisionContext';
import returnsService from '../../../services/returnsService';
import { fetchWithDivision } from '../../../utils/fetchWithDivision';
import styles from './Returns.module.css';

const RefundManagement = () => {
  const { axiosAPI } = useAuth();
  const { selectedDivision, showAllDivisions } = useDivision();
  
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [showCreateRefundModal, setShowCreateRefundModal] = useState(false);
  const [showCompleteRefundModal, setShowCompleteRefundModal] = useState(false);
  const [selectedRefund, setSelectedRefund] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeRefundTab, setActiveRefundTab] = useState('all');
  const [showViewRefundModal, setShowViewRefundModal] = useState(false);

  useEffect(() => {
    loadRefunds();
  }, [selectedDivision, showAllDivisions]);

  // Listen for refund completion events to refresh the list
  useEffect(() => {
    const handleRefundCompleted = () => {
      console.log('Refund completed event received, refreshing refunds list');
      loadRefunds();
    };

    window.addEventListener('refundCompleted', handleRefundCompleted);
    
    return () => {
      window.removeEventListener('refundCompleted', handleRefundCompleted);
    };
  }, []);

  const loadRefunds = async (filters = {}) => {
    try {
      setLoading(true);
      const divisionId = selectedDivision?.id || null;
      
      console.log('RefundManagement - Loading refunds from correct API endpoint');
      console.log('RefundManagement - Using fetchWithDivision to handle CORS');
      console.log('RefundManagement - Filters:', filters);
      
      // Build query parameters
      const queryParams = new URLSearchParams();
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.page) queryParams.append('page', filters.page);
      if (filters.limit) queryParams.append('limit', filters.limit);
      
      const endpoint = queryParams.toString() 
        ? `/returns/refunds?${queryParams.toString()}`
        : '/returns/refunds';
      
      console.log('RefundManagement - API endpoint:', endpoint);
      
      // Use fetchWithDivision to handle CORS and authentication
      const response = await fetchWithDivision(
        endpoint,
        localStorage.getItem('accessToken'),
        divisionId,
        showAllDivisions,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('RefundManagement - fetchWithDivision response:', response);
      
      // fetchWithDivision returns {success, data, message} structure
      if (response.success) {
        const data = response.data;
        console.log('RefundManagement - API data:', data);
        
        // Handle the API response structure - could be direct array or wrapped object
        let refundsList = [];
        
        if (Array.isArray(data)) {
          // Direct array response
          refundsList = data;
        } else if (data && data.refunds && Array.isArray(data.refunds)) {
          // Wrapped in {refunds: [...]} object
          refundsList = data.refunds;
        } else if (data && data.data && Array.isArray(data.data)) {
          // Wrapped in {data: [...]} object
          refundsList = data.data;
        } else if (data && data.results && Array.isArray(data.results)) {
          // Wrapped in {results: [...]} object
          refundsList = data.results;
        }
        
        console.log('RefundManagement - Loaded refunds:', refundsList);
        console.log('RefundManagement - Refund IDs:', refundsList.map(r => r.id));
        console.log('RefundManagement - Refund details:', refundsList.map(r => ({ id: r.id, refundNumber: r.refundNumber, refundAmount: r.refundAmount })));
        
        setRefunds(refundsList);
      } else {
        console.error('Error loading refunds:', response.message || 'Unknown error');
        console.log('RefundManagement - Setting empty refunds array');
        setRefunds([]);
      }
    } catch (error) {
      console.error('Error loading refunds:', error);
      setRefunds([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRefund = async (refundData) => {
    try {
      const divisionId = selectedDivision?.id || null;
      
      const response = await returnsService.createRefund(
        selectedReturn.id,
        refundData,
        divisionId,
        showAllDivisions
      );
      
      if (response.success) {
        alert('Refund created successfully');
        setShowCreateRefundModal(false);
        setSelectedReturn(null);
        loadRefunds();
      } else {
        alert(response.message || 'Failed to create refund');
      }
    } catch (error) {
      console.error('Error creating refund:', error);
      alert('Error creating refund');
    }
  };

  const handleCompleteRefund = async (refundData) => {
    try {
      const divisionId = selectedDivision?.id || null;
      
      // Use the correct API endpoint: PUT /returns/refunds/:refundId/complete
      const response = await returnsService.completeRefund(
        selectedRefund.id,
        refundData,
        divisionId,
        showAllDivisions
      );
      
      if (response.success) {
        alert('Refund completed successfully');
        setShowCompleteRefundModal(false);
        setSelectedRefund(null);
        loadRefunds();
      } else {
        alert(response.message || 'Failed to complete refund');
      }
    } catch (error) {
      console.error('Error completing refund:', error);
      alert('Error completing refund');
    }
  };

  const openCreateRefundModal = (returnRequest) => {
    setSelectedReturn(returnRequest);
    setShowCreateRefundModal(true);
  };

  const openCompleteRefundModal = (refund) => {
    setSelectedRefund(refund);
    setShowCompleteRefundModal(true);
  };

  const handleViewRefund = (refund) => {
    setSelectedRefund(refund);
    setShowViewRefundModal(true);
  };


  const getStatusBadge = (status) => {
    const statusClasses = {
      pending: styles.pending,
      processing: styles.processing,
      completed: styles.approved,
      failed: styles.rejected
    };
    
    return `${styles.statusBadge} ${statusClasses[status] || styles.pending}`;
  };

  const getRefundMethodBadge = (method) => {
    const methodClasses = {
      cash: styles.approved,
      bank_transfer: styles.quality,
      credit_note: styles.damaged,
      cheque: styles.expired
    };
    
    return `${styles.typeBadge} ${methodClasses[method] || styles.pending}`;
  };

  // Filter refunds based on search and filters
  const filteredRefunds = refunds.filter(refund => {
    const matchesSearch = 
      refund.refundNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      refund.returnRequest?.returnNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      refund.returnRequest?.salesOrder?.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || refund.refundStatus === statusFilter;
    
    // Filter by refund tab (pending vs completed)
    let matchesTab = true;
    if (activeRefundTab === 'pending') {
      matchesTab = refund.refundStatus === 'pending' || refund.refundStatus === 'processing';
    } else if (activeRefundTab === 'completed') {
      matchesTab = refund.refundStatus === 'completed';
    }
    
    return matchesSearch && matchesStatus && matchesTab;
  });

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading refunds...</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Refund Management</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={loadRefunds}
          >
            Refresh
          </button>
        </div>
      </div>


      {/* Refund Management Tabs */}
      <div className="card mb-3">
        <div className="card-header">
          <ul className="nav nav-tabs card-header-tabs" role="tablist">
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link ${activeRefundTab === 'all' ? 'active' : ''}`}
                onClick={() => setActiveRefundTab('all')}
                type="button"
                role="tab"
              >
                <i className="bi bi-list-ul me-2"></i>
                All Refunds
                <span className="badge bg-secondary ms-2">
                  {refunds.length}
                </span>
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link ${activeRefundTab === 'pending' ? 'active' : ''}`}
                onClick={() => setActiveRefundTab('pending')}
                type="button"
                role="tab"
              >
                <i className="bi bi-clock me-2"></i>
                Pending Requests
                <span className="badge bg-warning ms-2">
                  {refunds.filter(r => r.refundStatus === 'pending' || r.refundStatus === 'processing').length}
                </span>
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link ${activeRefundTab === 'completed' ? 'active' : ''}`}
                onClick={() => setActiveRefundTab('completed')}
                type="button"
                role="tab"
              >
                <i className="bi bi-check-circle me-2"></i>
                Completed Requests
                <span className="badge bg-success ms-2">
                  {refunds.filter(r => r.refundStatus === 'completed').length}
                </span>
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* Search and Filters */}
      <div style={{ 
        backgroundColor: 'white', 
        padding: '20px', 
        borderRadius: '10px', 
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '15px', alignItems: 'end' }}>
          <div>
            <label className={styles.formLabel}>Search</label>
            <input
              type="text"
              placeholder="Search by refund number, return number, or order number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.formInput}
            />
          </div>
          
          <div>
            <label className={styles.formLabel}>Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={styles.formSelect}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>
      </div>

      {filteredRefunds.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyStateIcon}>💰</div>
          <p className={styles.emptyStateText}>
            {activeRefundTab === 'pending' 
              ? 'No pending refund requests found' 
              : activeRefundTab === 'completed' 
                ? 'No completed refund requests found'
                : 'No refunds found'
            }
          </p>
          {activeRefundTab !== 'all' && (
            <button
              className="btn btn-outline-primary"
              onClick={() => setActiveRefundTab('all')}
            >
              View All Refunds
            </button>
          )}
        </div>
      ) : (
        <table className="table table-bordered borderedtable">
          <thead>
            <tr>
              <th>Refund Number</th>
              <th>Return Details</th>
              <th>Order Information</th>
              <th>Customer</th>
              <th>Refund Amount</th>
              <th>Refund Method</th>
              <th>Status</th>
              <th>Payment Reference</th>
              <th>Created Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRefunds.map((refund) => (
              <tr key={refund.id}>
                <td>
                  <div>
                    <strong>{refund.refundNumber}</strong>
                    <br />
                    <small className="text-muted">ID: {refund.id}</small>
                  </div>
                </td>
                <td>
                  <div>
                    <strong>{refund.returnRequest?.returnNumber}</strong>
                    <br />
                    <small className="text-muted">Return ID: {refund.returnRequest?.id}</small>
                  </div>
                </td>
                <td>
                  <div>
                    <strong>{refund.returnRequest?.salesOrder?.orderNumber}</strong>
                    <br />
                    <small className="text-muted">Order ID: {refund.returnRequest?.salesOrder?.id}</small>
                  </div>
                </td>
                <td>
                  <div>
                    <strong>{refund.returnRequest?.customer?.name || 'N/A'}</strong>
                    {refund.returnRequest?.customer?.mobile && (
                      <>
                        <br />
                        <small className="text-muted">{refund.returnRequest.customer.mobile}</small>
                      </>
                    )}
                  </div>
                </td>
                <td>
                  <div>
                    <strong className="text-success">
                      ₹{refund.refundAmount?.toLocaleString()}
                    </strong>
                  </div>
                </td>
                <td>
                  <div>
                    <span className={getRefundMethodBadge(refund.refundMethod)}>
                      {refund.refundMethod?.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </td>
                <td>
                  <div>
                    <span className={getStatusBadge(refund.refundStatus)}>
                      {refund.refundStatus?.charAt(0).toUpperCase() + refund.refundStatus?.slice(1)}
                    </span>
                  </div>
                </td>
                <td>
                  <div>
                    <strong>{refund.paymentReference || 'N/A'}</strong>
                  </div>
                </td>
                <td>
                  <div>
                    <strong>{new Date(refund.createdAt).toLocaleDateString()}</strong>
                    <br />
                    <small className="text-muted">
                      {new Date(refund.createdAt).toLocaleTimeString()}
                    </small>
                  </div>
                </td>
                <td>
                  <div className="d-flex gap-1 flex-wrap">
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => handleViewRefund(refund)}
                      title="View Refund Details"
                    >
                      <i className="bi bi-eye me-1"></i>
                      View
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Create Refund Modal */}
      {showCreateRefundModal && selectedReturn && (
        <CreateRefundModal
          returnRequest={selectedReturn}
          onSubmit={handleCreateRefund}
          onClose={() => {
            setShowCreateRefundModal(false);
            setSelectedReturn(null);
          }}
        />
      )}

      {/* Complete Refund Modal */}
      {showCompleteRefundModal && selectedRefund && (
        <CompleteRefundModal
          refund={selectedRefund}
          onSubmit={handleCompleteRefund}
          onClose={() => {
            setShowCompleteRefundModal(false);
            setSelectedRefund(null);
          }}
        />
      )}

      {/* View Refund Modal */}
      {showViewRefundModal && selectedRefund && (
        <ViewRefundModal
          refund={selectedRefund}
          onClose={() => {
            setShowViewRefundModal(false);
            setSelectedRefund(null);
          }}
          onCompleteRefund={openCompleteRefundModal}
        />
      )}
    </div>
  );
};

// Create Refund Modal Component
const CreateRefundModal = ({ returnRequest, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    refundMethod: 'cash',
    refundNotes: '',
    paymentReference: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.refundMethod) newErrors.refundMethod = 'Refund method is required';
    if (formData.refundMethod === 'bank_transfer' && !formData.paymentReference) {
      newErrors.paymentReference = 'Payment reference is required for bank transfer';
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
      await onSubmit(formData);
    } catch (error) {
      console.error('Error creating refund:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modal}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Create Refund</h3>
          <button 
            className={styles.closeButton}
            onClick={onClose}
          >
            ×
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Return Request</label>
            <p style={{ margin: '5px 0', color: '#7f8c8d' }}>
              {returnRequest.returnNumber} - {returnRequest.customer?.name}
            </p>
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Refund Method *</label>
            <select
              name="refundMethod"
              value={formData.refundMethod}
              onChange={handleInputChange}
              className={styles.formSelect}
              required
            >
              <option value="cash">Cash</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="credit_note">Credit Note</option>
              <option value="cheque">Cheque</option>
            </select>
            {errors.refundMethod && <span className={styles.alertError}>{errors.refundMethod}</span>}
          </div>
          
          {formData.refundMethod === 'bank_transfer' && (
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Payment Reference *</label>
              <input
                type="text"
                name="paymentReference"
                value={formData.paymentReference}
                onChange={handleInputChange}
                className={styles.formInput}
                placeholder="Transaction ID or reference number"
                required
              />
              {errors.paymentReference && <span className={styles.alertError}>{errors.paymentReference}</span>}
            </div>
          )}
          
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Refund Notes</label>
            <textarea
              name="refundNotes"
              value={formData.refundNotes}
              onChange={handleInputChange}
              className={styles.formTextarea}
              placeholder="Additional notes about the refund"
              rows="3"
            />
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
              className={`${styles.btn} ${styles.btnPrimary}`}
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Refund'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Complete Refund Modal Component
const CompleteRefundModal = ({ refund, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    refundStatus: 'completed'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setLoading(true);
    
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error completing refund:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modal}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Complete Refund</h3>
          <button 
            className={styles.closeButton}
            onClick={onClose}
          >
            ×
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Refund Details</label>
            <p style={{ margin: '5px 0', color: '#7f8c8d' }}>
              {refund.refundNumber} - ₹{refund.refundAmount?.toLocaleString()}
            </p>
            <p style={{ margin: '5px 0', color: '#7f8c8d' }}>
              Method: {refund.refundMethod?.replace('_', ' ')}
            </p>
          </div>
          
          <div className={styles.alert + ' ' + styles.alertInfo}>
            <strong>Confirm Refund Completion</strong>
            <p>Are you sure you want to mark this refund as completed? This action cannot be undone.</p>
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
              {loading ? 'Completing...' : 'Complete Refund'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// View Refund Modal Component
const ViewRefundModal = ({ refund, onClose, onCompleteRefund }) => {
  const [paymentDetails, setPaymentDetails] = useState({
    transactionDate: '',
    paymentMethod: refund.refundMethod || 'upi', // Default to refund method or upi
    upiId: '',
    utrNumber: '',
    impcNumber: '',
    checkDTPF: '',
    paymentProofs: [],
    paidAmount: 0,
    notes: ''
  });
  const [isEditingPayment, setIsEditingPayment] = useState(false);
  const [savedPayments, setSavedPayments] = useState([]);
  const [remainingAmount, setRemainingAmount] = useState(parseFloat(refund.refundAmount) || 0);
  const [totalPaidAmount, setTotalPaidAmount] = useState(0);
  const [showPaymentRequiredModal, setShowPaymentRequiredModal] = useState(false);
  const [paymentRequiredData, setPaymentRequiredData] = useState(null);
  const [paymentFormData, setPaymentFormData] = useState({
    utrNumber: '',
    upiId: '',
    paymentProofs: [],
    notes: ''
  });

  // Debug logging
  console.log('ViewRefundModal - refund:', refund);
  console.log('ViewRefundModal - refund.refundStatus:', refund.refundStatus);
  console.log('ViewRefundModal - should show complete button:', refund.refundStatus !== 'completed');
  console.log('ViewRefundModal - onCompleteRefund function:', typeof onCompleteRefund);
  
  const getStatusBadge = (status) => {
    const statusClasses = {
      pending: styles.pending,
      processing: styles.processing,
      completed: styles.approved,
      failed: styles.rejected
    };
    
    return `${styles.statusBadge} ${statusClasses[status] || styles.pending}`;
  };

  const getRefundMethodBadge = (method) => {
    const methodClasses = {
      cash: styles.approved,
      bank_transfer: styles.quality,
      credit_note: styles.damaged,
      cheque: styles.expired
    };
    
    return `${styles.typeBadge} ${methodClasses[method] || styles.pending}`;
  };

  // Load payment details from backend API
  const loadRefundPayments = async () => {
    try {
      console.log('loadRefundPayments - Loading payments for refund ID:', refund.id);
      
      const response = await fetchWithDivision(
        `/returns/refunds/${refund.id}/payments`,
        localStorage.getItem('accessToken'),
        null, // divisionId
        false, // showAllDivisions
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('loadRefundPayments - API response:', response);
      
      if (response.success && response.data) {
        const data = response.data;
        console.log('loadRefundPayments - Payment data:', data);
        
        // Update refund details with backend data
        if (data.refund) {
          console.log('loadRefundPayments - Updated refund data:', data.refund);
          // Update the refund object with backend data
          Object.assign(refund, data.refund);
        }
        
        // Set payment data from backend
        const backendPayments = data.payments || [];
        const backendTotalPaid = parseFloat(data.refund?.totalPaidAmount) || 0;
        const backendRefundAmount = parseFloat(refund.refundAmount) || 0;
        const backendRemaining = parseFloat(data.refund?.remainingAmount);
        
        // Calculate remaining amount if backend doesn't provide it or if it seems incorrect
        let calculatedRemaining = backendRefundAmount - backendTotalPaid;
        
        console.log('loadRefundPayments - Amount calculations:');
        console.log('- backendRefundAmount:', backendRefundAmount);
        console.log('- backendTotalPaid:', backendTotalPaid);
        console.log('- backendRemaining from API:', backendRemaining);
        console.log('- calculatedRemaining (refund - paid):', calculatedRemaining);
        
        // Use calculated remaining if backend remaining is not provided or seems incorrect
        const finalRemaining = (backendRemaining !== undefined && backendRemaining >= 0) ? backendRemaining : calculatedRemaining;
        
        console.log('loadRefundPayments - Backend payments:', backendPayments);
        console.log('loadRefundPayments - Backend total paid:', backendTotalPaid);
        console.log('loadRefundPayments - Backend remaining:', backendRemaining);
        console.log('loadRefundPayments - Original refund amount:', refund.refundAmount);
        console.log('loadRefundPayments - Calculated remaining (refund - paid):', (parseFloat(refund.refundAmount) || 0) - backendTotalPaid);
        
        setSavedPayments(backendPayments);
        setTotalPaidAmount(backendTotalPaid);
        setRemainingAmount(finalRemaining);
        
        console.log('loadRefundPayments - Setting state values:');
        console.log('- backendPayments:', backendPayments);
        console.log('- backendTotalPaid:', backendTotalPaid);
        console.log('- finalRemaining (used):', finalRemaining);
        console.log('- backendRemaining (from API):', backendRemaining);
        console.log('- calculatedRemaining (fallback):', calculatedRemaining);
        
        // Also update localStorage with backend data
        const dataToSave = {
          savedPayments: backendPayments,
          totalPaidAmount: backendTotalPaid,
          remainingAmount: finalRemaining
        };
        localStorage.setItem(`refund_payment_${refund.id}`, JSON.stringify(dataToSave));
        
      } else {
        console.log('loadRefundPayments - No payment data from backend, using localStorage');
        // Fallback to localStorage if no backend data
        const savedData = localStorage.getItem(`refund_payment_${refund.id}`);
        if (savedData) {
          const parsed = JSON.parse(savedData);
          setSavedPayments(parsed.savedPayments || []);
          setTotalPaidAmount(parsed.totalPaidAmount || 0);
          setRemainingAmount((parseFloat(refund.refundAmount) || 0) - (parseFloat(parsed.totalPaidAmount) || 0));
        } else {
          // No saved data, set remaining amount to full refund amount
          console.log('loadRefundPayments - No saved data, setting remaining amount to full refund amount:', refund.refundAmount);
          setSavedPayments([]);
          setTotalPaidAmount(0);
          setRemainingAmount(parseFloat(refund.refundAmount) || 0);
        }
      }
    } catch (error) {
      console.error('Error loading refund payments:', error);
      // Fallback to localStorage on error
      const savedData = localStorage.getItem(`refund_payment_${refund.id}`);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        setSavedPayments(parsed.savedPayments || []);
        setTotalPaidAmount(parsed.totalPaidAmount || 0);
        setRemainingAmount((parseFloat(refund.refundAmount) || 0) - (parseFloat(parsed.totalPaidAmount) || 0));
      } else {
        // No saved data, set remaining amount to full refund amount
        console.log('loadRefundPayments - Error fallback: No saved data, setting remaining amount to full refund amount:', refund.refundAmount);
        setSavedPayments([]);
        setTotalPaidAmount(0);
        setRemainingAmount(parseFloat(refund.refundAmount) || 0);
      }
    }
  };

  // Load payment details from backend on component mount
  useEffect(() => {
    loadRefundPayments();
  }, [refund.id]);

  // Manual refresh function for debugging
  const handleRefreshPayments = async () => {
    console.log('Manual refresh of payment data requested');
    await loadRefundPayments();
  };

  // Save draft when component unmounts or modal closes
  useEffect(() => {
    return () => {
      if (savedPayments.length > 0 || totalPaidAmount > 0) {
        const dataToSave = {
          savedPayments,
          totalPaidAmount,
          remainingAmount
        };
        localStorage.setItem(`refund_payment_${refund.id}`, JSON.stringify(dataToSave));
      }
    };
  }, [savedPayments, totalPaidAmount, remainingAmount, refund.id]);

  // Convert file to base64
  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  // Handle payment form input changes
  const handlePaymentInputChange = async (e) => {
    const { name, value, type, files } = e.target;
    
    if (type === 'file') {
      try {
        // Convert all files to base64
        const base64Files = await Promise.all(
          Array.from(files).map(async (file) => {
            const base64 = await convertToBase64(file);
            return {
              name: file.name,
              type: file.type,
              size: file.size,
              base64: base64
            };
          })
        );
        
        setPaymentDetails(prev => ({
          ...prev,
          paymentProofs: base64Files
        }));
      } catch (error) {
        console.error('Error converting files to base64:', error);
        alert('Error processing image files. Please try again.');
      }
    } else if (name !== 'paymentMethod') { // Don't allow payment method changes
      setPaymentDetails(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Add payment entry
  const handleAddPayment = async () => {
    console.log('handleAddPayment - Frontend remaining amount:', remainingAmount);
    console.log('handleAddPayment - Payment amount:', paymentDetails.paidAmount);
    console.log('handleAddPayment - Refund amount:', refund.refundAmount);
    console.log('handleAddPayment - Total paid amount:', totalPaidAmount);
    
    // Refresh payment data from backend before adding payment to ensure we have latest data
    console.log('handleAddPayment - Refreshing payment data from backend before adding payment');
    await loadRefundPayments();
    
    console.log('handleAddPayment - After refresh - Frontend remaining amount:', remainingAmount);
    console.log('handleAddPayment - After refresh - Payment amount:', paymentDetails.paidAmount);
    
    if (paymentDetails.paidAmount <= 0 || paymentDetails.paidAmount > remainingAmount) {
      alert(`Please enter a valid amount. Maximum allowed: ₹${remainingAmount.toLocaleString()}`);
      return;
    }

    try {
      console.log('Adding payment for refund ID:', refund.id);
      console.log('Payment details:', paymentDetails);
      
      // Get the latest refund data from backend for logging purposes
      console.log('handleAddPayment - Getting latest refund data from backend for logging');
      const refundResponse = await fetchWithDivision(
        `/returns/refunds/${refund.id}`,
        localStorage.getItem('accessToken'),
        null, // divisionId
        false, // showAllDivisions
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (refundResponse.success && refundResponse.data) {
        const latestRefund = refundResponse.data;
        const backendRemainingAmount = parseFloat(latestRefund.remainingAmount) || 0;
        const backendTotalPaid = parseFloat(latestRefund.totalPaidAmount) || 0;
        const backendRefundAmount = parseFloat(latestRefund.refundAmount) || 0;
        
        console.log('handleAddPayment - Backend refund amount:', backendRefundAmount);
        console.log('handleAddPayment - Backend total paid:', backendTotalPaid);
        console.log('handleAddPayment - Backend remaining amount:', backendRemainingAmount);
        console.log('handleAddPayment - Frontend remaining amount:', remainingAmount);
        console.log('handleAddPayment - Payment amount to add:', parseFloat(paymentDetails.paidAmount));
        
        // Log the discrepancy for debugging
        if (backendRemainingAmount !== remainingAmount) {
          console.warn('handleAddPayment - Mismatch between frontend and backend remaining amounts:');
          console.warn('Frontend remaining:', remainingAmount);
          console.warn('Backend remaining:', backendRemainingAmount);
        }
      } else {
        console.warn('handleAddPayment - Could not get latest refund data, proceeding with current data');
      }
      
      // Prepare payment data for API
      const paymentData = {
        transactionDate: paymentDetails.transactionDate,
        paymentMethod: paymentDetails.paymentMethod,
        paidAmount: parseFloat(paymentDetails.paidAmount),
        utrNumber: paymentDetails.utrNumber || null,
        upiId: paymentDetails.upiId || null,
        impcNumber: paymentDetails.impcNumber || null,
        checkDTPF: paymentDetails.checkDTPF || null,
        paymentProofs: paymentDetails.paymentProofs || [],
        notes: paymentDetails.notes || ''
      };
      
      console.log('Payment data to send:', paymentData);
      
      // Call backend API to add payment
      const response = await fetchWithDivision(
        `/returns/refunds/${refund.id}/payments`,
        localStorage.getItem('accessToken'),
        null, // divisionId
        false, // showAllDivisions
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(paymentData)
        }
      );
      
      console.log('Add payment API response:', response);
      
      if (response.success) {
        console.log('Payment added successfully, refreshing payment data');
        // Refresh payment data from backend
        await loadRefundPayments();
        
        // Reset form
        setPaymentDetails({
          transactionDate: '',
          paymentMethod: refund.refundMethod || 'upi', // Reset to refund method or upi
          upiId: '',
          utrNumber: '',
          impcNumber: '',
          checkDTPF: '',
          paymentProofs: [], // Reset base64 images
          paidAmount: 0,
          notes: ''
        });
        
        setIsEditingPayment(false);
        alert('Payment added successfully');
      } else {
        console.error('Failed to add payment:', response.message);
        
        // If the error is about exceeding remaining amount, refresh data and show better message
        if (response.message && response.message.includes('cannot exceed remaining amount')) {
          console.log('Payment rejected due to remaining amount mismatch, refreshing data');
          await loadRefundPayments();
          alert(`Payment rejected: ${response.message}\n\nData has been refreshed. Please check the updated remaining amount and try again.`);
        } else {
          alert(response.message || 'Failed to add payment');
        }
      }
    } catch (error) {
      console.error('Error adding payment:', error);
      alert('Error adding payment: ' + error.message);
    }
  };

  // Remove payment entry
  const handleRemovePayment = async (paymentId) => {
    const paymentToRemove = savedPayments.find(p => p.id === paymentId);
    if (!paymentToRemove) return;

    if (window.confirm('Are you sure you want to remove this payment?')) {
      try {
        console.log('Removing payment ID:', paymentId, 'for refund ID:', refund.id);
        
        // Call backend API to remove payment
        const response = await fetchWithDivision(
          `/returns/refunds/${refund.id}/payments/${paymentId}`,
          localStorage.getItem('accessToken'),
          null, // divisionId
          false, // showAllDivisions
          {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        
        console.log('Remove payment API response:', response);
        
        if (response.success) {
          console.log('Payment removed successfully, refreshing payment data');
          // Refresh payment data from backend
          await loadRefundPayments();
          alert('Payment removed successfully');
        } else {
          console.error('Failed to remove payment:', response.message);
          alert(response.message || 'Failed to remove payment');
        }
      } catch (error) {
        console.error('Error removing payment:', error);
        alert('Error removing payment: ' + error.message);
      }
    }
  };

  const handleCompleteRefundClick = async () => {
    if (window.confirm('Are you sure you want to complete this refund?')) {
      try {
        console.log('Completing refund:', refund.id, 'Type:', typeof refund.id);
        console.log('Refund details:', refund);
        
        // Prepare the request body
        const requestBody = {
          refundStatus: 'completed',
          completedBy: JSON.parse(localStorage.getItem("user"))?.id,
          completedAt: new Date().toISOString(),
          notes: 'Refund completed from view modal'
        };
        
        console.log('Complete refund request body:', requestBody);
        
        // Call the complete refund API directly using fetchWithDivision
        console.log('Making API call to:', `/returns/refunds/${refund.id}/complete`);
        console.log('Request method: PUT');
        console.log('Request body:', JSON.stringify(requestBody));
        
        const response = await fetchWithDivision(
          `/returns/refunds/${refund.id}/complete`,
          localStorage.getItem('accessToken'),
          null, // divisionId
          false, // showAllDivisions
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
          }
        );
        
        console.log('Complete refund response:', response);
        console.log('Response success:', response.success);
        console.log('Response data:', response.data);
        console.log('Response message:', response.message);
        
        if (response.success) {
          alert('Refund completed successfully');
          onClose();
          // Trigger a refresh by calling the parent's loadRefunds function
          window.dispatchEvent(new CustomEvent('refundCompleted'));
        } else {
          // Check if this is a payment requirement error
          if (response.data && response.data.requiresPayment === true) {
            console.log('Payment required error detected:', response.data);
            console.log('Refund method:', response.data.refundMethod);
            console.log('Payment details required:', response.data.paymentDetailsRequired);
            
            // Show payment form modal
            setShowPaymentRequiredModal(true);
            setPaymentRequiredData(response.data);
          } else {
            console.error('Complete refund failed:', response.message);
            alert(response.message || 'Failed to complete refund');
          }
        }
      } catch (error) {
        console.error('Error completing refund:', error);
        alert('Error completing refund: ' + error.message);
      }
    }
  };

  // Handle payment form submission for required payment
  const handlePaymentRequiredSubmit = async () => {
    try {
      console.log('Submitting payment details for refund completion:', paymentFormData);
      console.log('Payment required data:', paymentRequiredData);
      
      // Prepare the request body with payment details
      const requestBody = {
        refundStatus: 'completed',
        completedBy: JSON.parse(localStorage.getItem("user"))?.id,
        completedAt: new Date().toISOString(),
        notes: 'Refund completed with payment details',
        paymentDetails: {
          utrNumber: paymentFormData.utrNumber || null,
          upiId: paymentFormData.upiId || null,
          paymentProofs: paymentFormData.paymentProofs || [],
          notes: paymentFormData.notes || ''
        }
      };
      
      console.log('Complete refund with payment request body:', requestBody);
      
      // Call the complete refund API with payment details
      const response = await fetchWithDivision(
        `/returns/refunds/${refund.id}/complete`,
        localStorage.getItem('accessToken'),
        null, // divisionId
        false, // showAllDivisions
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        }
      );
      
      console.log('Complete refund with payment response:', response);
      
      if (response.success) {
        alert('Refund completed successfully with payment details');
        setShowPaymentRequiredModal(false);
        onClose();
        // Trigger refresh
        window.dispatchEvent(new CustomEvent('refundCompleted'));
      } else {
        console.error('Complete refund with payment failed:', response.message);
        alert(response.message || 'Failed to complete refund with payment details');
      }
    } catch (error) {
      console.error('Error completing refund with payment:', error);
      alert('Error completing refund with payment: ' + error.message);
    }
  };

  // Handle payment form input changes
  const handlePaymentFormChange = async (e) => {
    const { name, value, type, files } = e.target;
    
    if (type === 'file') {
      try {
        // Convert all files to base64
        const base64Files = await Promise.all(
          Array.from(files).map(async (file) => {
            const base64 = await convertToBase64(file);
            return {
              name: file.name,
              type: file.type,
              size: file.size,
              base64: base64
            };
          })
        );
        
        setPaymentFormData(prev => ({
          ...prev,
          paymentProofs: base64Files
        }));
      } catch (error) {
        console.error('Error converting files to base64:', error);
        alert('Error processing image files. Please try again.');
      }
    } else {
      setPaymentFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  return (
    <div className={styles.modal}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <div className="d-flex align-items-center">
            <h3 className={styles.modalTitle}>Refund Details</h3>
            <span className={`${getStatusBadge(refund.refundStatus)} ms-3`}>
              {refund.refundStatus?.charAt(0).toUpperCase() + refund.refundStatus?.slice(1)}
            </span>
            {refund.refundStatus !== 'completed' && (
              <span className="badge bg-warning ms-2">
                <i className="bi bi-clock me-1"></i>
                Ready to Complete
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
              Refund Information
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <strong>Refund Number:</strong>
                <p>{refund.refundNumber}</p>
              </div>
              <div>
                <strong>Refund Amount:</strong>
                <p className="text-success fw-bold">₹{refund.refundAmount?.toLocaleString()}</p>
              </div>
              <div>
                <strong>Refund Method:</strong>
                <p>
                  <span className={getRefundMethodBadge(refund.refundMethod)}>
                    {refund.refundMethod?.replace('_', ' ').toUpperCase()}
                  </span>
                </p>
              </div>
              <div>
                <strong>Payment Reference:</strong>
                <p>{refund.paymentReference || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Return Request Information */}
          <div>
            <h4 style={{ marginBottom: '15px', color: '#2c3e50', borderBottom: '2px solid #ecf0f1', paddingBottom: '8px' }}>
              Related Return Request
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <strong>Return Number:</strong>
                <p>{refund.returnRequest?.returnNumber}</p>
              </div>
              <div>
                <strong>Order Number:</strong>
                <p>{refund.returnRequest?.salesOrder?.orderNumber}</p>
              </div>
              <div>
                <strong>Customer:</strong>
                <p>{refund.returnRequest?.customer?.name || 'N/A'}</p>
              </div>
              <div>
                <strong>Customer Phone:</strong>
                <p>{refund.returnRequest?.customer?.mobile || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div>
            <h4 style={{ marginBottom: '15px', color: '#2c3e50', borderBottom: '2px solid #ecf0f1', paddingBottom: '8px' }}>
              Payment Details
            </h4>
            
            {/* Payment Summary */}
            <div style={{ 
              backgroundColor: '#f8f9fa', 
              padding: '15px', 
              borderRadius: '8px', 
              marginBottom: '20px',
              border: '1px solid #e9ecef'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h5 style={{ margin: 0, color: '#2c3e50' }}>Payment Summary</h5>
                <button
                  onClick={handleRefreshPayments}
                  style={{
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '5px 10px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                  title="Refresh payment data from backend"
                >
                  <i className="bi bi-arrow-clockwise me-1"></i>
                  Refresh
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', textAlign: 'center' }}>
                <div>
                  <strong style={{ color: '#2c3e50' }}>Total Refund Amount</strong>
                  <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#e74c3c', margin: '5px 0' }}>
                    ₹{refund.refundAmount?.toLocaleString()}
                  </p>
                </div>
                <div>
                  <strong style={{ color: '#2c3e50' }}>Total Paid</strong>
                  <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#27ae60', margin: '5px 0' }}>
                    ₹{totalPaidAmount.toLocaleString()}
                  </p>
                </div>
                <div>
                  <strong style={{ color: '#2c3e50' }}>Remaining Amount</strong>
                  <p style={{ 
                    fontSize: '18px', 
                    fontWeight: 'bold', 
                    color: remainingAmount > 0 ? '#f39c12' : '#27ae60', 
                    margin: '5px 0' 
                  }}>
                    ₹{remainingAmount.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Saved Payments List */}
            {savedPayments.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h5 style={{ marginBottom: '10px', color: '#34495e' }}>Payment History</h5>
                <div style={{ display: 'grid', gap: '10px' }}>
                  {savedPayments.map((payment) => {
                    // Debug logging for payment data structure
                    console.log('Payment data structure:', payment);
                    console.log('Payment paymentProofs type:', typeof payment.paymentProofs);
                    console.log('Payment paymentProofs value:', payment.paymentProofs);
                    
                    return (
                      <div key={payment.id} style={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #dee2e6',
                        borderRadius: '8px',
                        padding: '15px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                            <div>
                              <strong>Amount:</strong> ₹{payment.paidAmount?.toLocaleString()}
                            </div>
                            <div>
                              <strong>Method:</strong> {payment.paymentMethod?.replace('_', ' ').toUpperCase()}
                            </div>
                            <div>
                              <strong>Date:</strong> {new Date(payment.transactionDate).toLocaleDateString()}
                            </div>
                            {payment.utrNumber && payment.paymentMethod !== 'bank_transfer' && payment.paymentMethod !== 'cash' && (
                              <div>
                                <strong>UTR:</strong> {payment.utrNumber}
                              </div>
                            )}
                            {payment.upiId && (
                              <div>
                                <strong>UPI ID:</strong> {payment.upiId}
                              </div>
                            )}
                            {payment.impcNumber && (
                              <div>
                                <strong>IMPC:</strong> {payment.impcNumber}
                              </div>
                            )}
                          </div>
                          {payment.notes && (
                            <div style={{ marginTop: '8px', fontSize: '14px', color: '#6c757d' }}>
                              <strong>Notes:</strong> {payment.notes}
                            </div>
                          )}
                          {payment.paymentProofs && payment.paymentProofs.length > 0 && (
                            <div style={{ marginTop: '8px' }}>
                              <strong style={{ fontSize: '14px', color: '#495057' }}>Payment Proofs:</strong>
                              <div style={{ 
                                display: 'grid', 
                                gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', 
                                gap: '8px', 
                                marginTop: '4px' 
                              }}>
                                {payment.paymentProofs && Array.isArray(payment.paymentProofs) && payment.paymentProofs.length > 0 && payment.paymentProofs.map((proof, proofIndex) => (
                                  <div key={proofIndex} style={{ position: 'relative' }}>
                                    <img
                                      src={proof.base64 || proof} // Handle both base64 objects and string URLs
                                      alt={`Proof ${proofIndex + 1}`}
                                      style={{
                                        width: '100%',
                                        height: '60px',
                                        objectFit: 'cover',
                                        borderRadius: '4px',
                                        border: '1px solid #dee2e6',
                                        cursor: 'pointer'
                                      }}
                                      onClick={() => {
                                        // Open image in new tab for full view
                                        const newWindow = window.open();
                                        newWindow.document.write(`
                                          <html>
                                            <head><title>Payment Proof</title></head>
                                            <body style="margin:0; padding:20px; text-align:center; background:#f8f9fa;">
                                              <img src="${proof.base64 || proof}" style="max-width:100%; max-height:90vh; border-radius:8px; box-shadow:0 4px 8px rgba(0,0,0,0.1);" />
                                            </body>
                                          </html>
                                        `);
                                      }}
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => handleRemovePayment(payment.id)}
                          style={{
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '5px 10px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Add Payment Form */}
            {!isEditingPayment ? (
              <button
                onClick={() => setIsEditingPayment(true)}
                style={{
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '10px 20px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                + Add Payment
              </button>
            ) : (
              <div style={{
                backgroundColor: '#ffffff',
                border: '2px solid #007bff',
                borderRadius: '8px',
                padding: '20px',
                marginTop: '10px'
              }}>
                <h5 style={{ marginBottom: '15px', color: '#2c3e50' }}>Add New Payment</h5>
                {refund.refundMethod && (
                  <div style={{ 
                    backgroundColor: '#e3f2fd', 
                    border: '1px solid #2196f3', 
                    borderRadius: '4px', 
                    padding: '8px 12px', 
                    marginBottom: '15px',
                    fontSize: '14px',
                    color: '#1976d2'
                  }}>
                    <i className="bi bi-info-circle me-2"></i>
                    <strong>Default Payment Method:</strong> {refund.refundMethod.replace('_', ' ').toUpperCase()} 
                    (based on refund method)
                  </div>
                )}
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                      Transaction Date *
                    </label>
                    <input
                      type="date"
                      name="transactionDate"
                      value={paymentDetails.transactionDate}
                      onChange={handlePaymentInputChange}
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #ced4da',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                      required
                    />
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                      Payment Method *
                    </label>
                    <div style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      fontSize: '14px',
                      backgroundColor: '#f8f9fa',
                      color: '#495057',
                      fontWeight: '500'
                    }}>
                      {paymentDetails.paymentMethod?.replace('_', ' ').toUpperCase()}
                    </div>
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                      Paid Amount *
                    </label>
                    <input
                      type="number"
                      name="paidAmount"
                      value={paymentDetails.paidAmount || ''}
                      onChange={handlePaymentInputChange}
                      max={remainingAmount}
                      min="1"
                      step="0.01"
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #ced4da',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                      placeholder={`Max: ₹${remainingAmount.toLocaleString()}`}
                      required
                    />
                  </div>
                  
                  {paymentDetails.paymentMethod !== 'bank_transfer' && paymentDetails.paymentMethod !== 'cash' && (
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                        UTR Number *
                      </label>
                      <input
                        type="text"
                        name="utrNumber"
                        value={paymentDetails.utrNumber}
                        onChange={handlePaymentInputChange}
                        style={{
                          width: '100%',
                          padding: '8px',
                          border: '1px solid #ced4da',
                          borderRadius: '4px',
                          fontSize: '14px'
                        }}
                        placeholder="Enter UTR/Transaction ID"
                        required
                      />
                    </div>
                  )}
                </div>

                {/* UPI Specific Fields */}
                {paymentDetails.paymentMethod === 'upi' && (
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                      UPI ID *
                    </label>
                    <input
                      type="text"
                      name="upiId"
                      value={paymentDetails.upiId}
                      onChange={handlePaymentInputChange}
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #ced4da',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                      placeholder="e.g., user@paytm, 9876543210@upi"
                      required
                    />
                  </div>
                )}

                {/* Bank Transfer Specific Fields */}
                {paymentDetails.paymentMethod === 'bank_transfer' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                        IMPC Number *
                      </label>
                      <input
                        type="text"
                        name="impcNumber"
                        value={paymentDetails.impcNumber}
                        onChange={handlePaymentInputChange}
                        style={{
                          width: '100%',
                          padding: '8px',
                          border: '1px solid #ced4da',
                          borderRadius: '4px',
                          fontSize: '14px'
                        }}
                        placeholder="Enter IMPC number"
                        required
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                        Check DTPF *
                      </label>
                      <input
                        type="text"
                        name="checkDTPF"
                        value={paymentDetails.checkDTPF}
                        onChange={handlePaymentInputChange}
                        style={{
                          width: '100%',
                          padding: '8px',
                          border: '1px solid #ced4da',
                          borderRadius: '4px',
                          fontSize: '14px'
                        }}
                        placeholder="Enter DTPF details"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Cash Specific Fields */}
                {paymentDetails.paymentMethod === 'cash' && (
                  <div style={{ marginBottom: '15px' }}>
                    <div style={{ 
                      backgroundColor: '#fff3cd', 
                      border: '1px solid #ffeaa7', 
                      borderRadius: '4px', 
                      padding: '10px',
                      fontSize: '14px',
                      color: '#856404'
                    }}>
                      <i className="bi bi-info-circle me-2"></i>
                      <strong>Cash Payment:</strong> No additional details required for cash payments.
                    </div>
                  </div>
                )}

                {/* Cheque Specific Fields */}
                {paymentDetails.paymentMethod === 'cheque' && (
                  <div style={{ marginBottom: '15px' }}>
                    <div style={{ 
                      backgroundColor: '#d1ecf1', 
                      border: '1px solid #bee5eb', 
                      borderRadius: '4px', 
                      padding: '10px',
                      fontSize: '14px',
                      color: '#0c5460'
                    }}>
                      <i className="bi bi-info-circle me-2"></i>
                      <strong>Cheque Payment:</strong> Please ensure cheque details are mentioned in the notes section.
                    </div>
                  </div>
                )}

                {/* Payment Proofs Upload */}
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                    Payment Proofs (Screenshots) *
                  </label>
                  <input
                    type="file"
                    name="paymentProofs"
                    onChange={handlePaymentInputChange}
                    multiple
                    accept="image/*"
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                    required
                  />
                  <small style={{ color: '#6c757d' }}>
                    Upload screenshots of payment confirmation, UPI receipts, or bank transfer proofs
                  </small>
                  
                  {/* Image Preview */}
                  {paymentDetails.paymentProofs && paymentDetails.paymentProofs.length > 0 && (
                    <div style={{ marginTop: '10px' }}>
                      <strong style={{ fontSize: '14px', color: '#495057' }}>Uploaded Images:</strong>
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', 
                        gap: '10px', 
                        marginTop: '8px' 
                      }}>
                        {paymentDetails.paymentProofs.map((file, index) => (
                          <div key={index} style={{ position: 'relative' }}>
                            <img
                              src={file.base64}
                              alt={file.name}
                              style={{
                                width: '100%',
                                height: '80px',
                                objectFit: 'cover',
                                borderRadius: '4px',
                                border: '1px solid #dee2e6'
                              }}
                            />
                            <div style={{
                              position: 'absolute',
                              bottom: '2px',
                              left: '2px',
                              right: '2px',
                              backgroundColor: 'rgba(0,0,0,0.7)',
                              color: 'white',
                              fontSize: '10px',
                              padding: '2px 4px',
                              borderRadius: '2px',
                              textAlign: 'center',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {file.name}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    value={paymentDetails.notes}
                    onChange={handlePaymentInputChange}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      fontSize: '14px',
                      minHeight: '60px',
                      resize: 'vertical'
                    }}
                    placeholder="Additional notes about this payment..."
                  />
                </div>

                {/* Form Actions */}
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => setIsEditingPayment(false)}
                    style={{
                      backgroundColor: '#6c757d',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '8px 16px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddPayment}
                    style={{
                      backgroundColor: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '8px 16px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    Add Payment
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Refund Notes */}
          {refund.refundNotes && (
            <div>
              <h4 style={{ marginBottom: '15px', color: '#2c3e50', borderBottom: '2px solid #ecf0f1', paddingBottom: '8px' }}>
                Refund Notes
              </h4>
              <p style={{ 
                padding: '15px', 
                backgroundColor: '#f8f9fa', 
                borderRadius: '5px',
                border: '1px solid #ecf0f1',
                lineHeight: '1.6'
              }}>
                {refund.refundNotes}
              </p>
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
            {/* Debug logging for Complete Refund button logic */}
            {console.log('Complete Refund Button Debug:')}
            {console.log('- refund.refundStatus:', refund.refundStatus)}
            {console.log('- remainingAmount:', remainingAmount)}
            {console.log('- totalPaidAmount:', totalPaidAmount)}
            {console.log('- refund.refundAmount:', refund.refundAmount)}
            {console.log('- Should show complete button:', refund.refundStatus !== 'completed' && remainingAmount <= 0)}
            {console.log('- Should show warning:', refund.refundStatus !== 'completed' && remainingAmount > 0)}
            
            {refund.refundStatus !== 'completed' && remainingAmount <= 0 && (
              <button
                type="button"
                className="btn btn-success me-2"
                onClick={handleCompleteRefundClick}
                title="Complete Refund - Full payment received"
              >
                <i className="bi bi-check-circle me-1"></i>
                Complete Refund
              </button>
            )}
            {refund.refundStatus !== 'completed' && remainingAmount > 0 && (
              <div className="text-warning">
                <small>
                  <i className="bi bi-exclamation-triangle me-1"></i>
                  Complete payment (₹{remainingAmount.toLocaleString()} remaining) to enable refund completion
                </small>
              </div>
            )}
            {refund.refundStatus === 'completed' && (
              <div className="text-muted">
                <small>
                  Status: {refund.refundStatus} - No action required
                </small>
              </div>
            )}
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
          >
            <i className="bi bi-x-lg me-1"></i>
            Cancel
          </button>
        </div>
      </div>
      
      {/* Payment Required Modal */}
      {showPaymentRequiredModal && paymentRequiredData && (
        <div className={styles.modal}>
          <div className={styles.modalContent} style={{ maxWidth: '500px' }}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Payment Details Required</h3>
              <button 
                className={styles.closeButton}
                onClick={() => setShowPaymentRequiredModal(false)}
              >
                ×
              </button>
            </div>
            
            <div style={{ padding: '20px' }}>
              <div className="alert alert-warning" style={{ marginBottom: '20px' }}>
                <strong>Payment Required!</strong>
                <p style={{ margin: '5px 0' }}>{paymentRequiredData.message}</p>
                <p style={{ margin: '5px 0' }}>
                  <strong>Refund Method:</strong> {paymentRequiredData.refundMethod?.replace('_', ' ').toUpperCase()}
                </p>
              </div>
              
              <form onSubmit={(e) => { e.preventDefault(); handlePaymentRequiredSubmit(); }}>
                {/* UTR Number for Bank Transfer */}
                {paymentRequiredData.refundMethod === 'bank_transfer' && (
                  <div className="mb-3">
                    <label className="form-label">
                      <strong>UTR Number *</strong>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      name="utrNumber"
                      value={paymentFormData.utrNumber}
                      onChange={handlePaymentFormChange}
                      placeholder="Enter UTR/Transaction number"
                      required
                    />
                    <small className="text-muted">
                      {paymentRequiredData.paymentDetailsRequired?.utrNumber}
                    </small>
                  </div>
                )}
                
                {/* UPI ID for UPI */}
                {paymentRequiredData.refundMethod === 'upi' && (
                  <div className="mb-3">
                    <label className="form-label">
                      <strong>UPI ID *</strong>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      name="upiId"
                      value={paymentFormData.upiId}
                      onChange={handlePaymentFormChange}
                      placeholder="Enter UPI ID (e.g., user@paytm)"
                      required
                    />
                  </div>
                )}
                
                {/* Payment Proofs for Cash */}
                {paymentRequiredData.refundMethod === 'cash' && (
                  <div className="mb-3">
                    <label className="form-label">
                      <strong>Payment Receipt/Proof *</strong>
                    </label>
                    <input
                      type="file"
                      className="form-control"
                      name="paymentProofs"
                      onChange={handlePaymentFormChange}
                      accept="image/*"
                      multiple
                      required
                    />
                    <small className="text-muted">
                      {paymentRequiredData.paymentDetailsRequired?.paymentProofs}
                    </small>
                    
                    {/* Image Preview */}
                    {paymentFormData.paymentProofs && paymentFormData.paymentProofs.length > 0 && (
                      <div style={{ marginTop: '10px' }}>
                        <strong style={{ fontSize: '14px', color: '#495057' }}>Uploaded Images:</strong>
                        <div style={{ 
                          display: 'grid', 
                          gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', 
                          gap: '10px', 
                          marginTop: '8px' 
                        }}>
                          {paymentFormData.paymentProofs.map((file, index) => (
                            <div key={index} style={{ position: 'relative' }}>
                              <img
                                src={file.base64}
                                alt={file.name}
                                style={{
                                  width: '100%',
                                  height: '80px',
                                  objectFit: 'cover',
                                  borderRadius: '4px',
                                  border: '1px solid #dee2e6'
                                }}
                              />
                              <div style={{
                                position: 'absolute',
                                bottom: '2px',
                                left: '2px',
                                right: '2px',
                                backgroundColor: 'rgba(0,0,0,0.7)',
                                color: 'white',
                                fontSize: '10px',
                                padding: '2px 4px',
                                borderRadius: '2px',
                                textAlign: 'center',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}>
                                {file.name}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Notes */}
                <div className="mb-3">
                  <label className="form-label">
                    <strong>Notes (Optional)</strong>
                  </label>
                  <textarea
                    className="form-control"
                    name="notes"
                    value={paymentFormData.notes}
                    onChange={handlePaymentFormChange}
                    rows="3"
                    placeholder="Additional notes about the payment"
                  />
                </div>
                
                <div className="d-flex justify-content-end gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowPaymentRequiredModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-success"
                  >
                    <i className="bi bi-check-circle me-1"></i>
                    Complete Refund with Payment
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RefundManagement;
