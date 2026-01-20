import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../../Auth';
import { useDivision } from '../../context/DivisionContext';
import partialDispatchService from '../../../services/partialDispatchService';
import { showSuccessNotification, showErrorNotification } from '../../../utils/errorHandler';
import { isAdmin, isSuperAdmin } from '../../../utils/roleUtils';
import Loading from '@/components/Loading';
import ErrorModal from '@/components/ErrorModal';

const PartialDispatchRequestDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { axiosAPI } = useAuth();
  const { selectedDivision, showAllDivisions } = useDivision();

  const [request, setRequest] = useState(null);
  const [salesOrder, setSalesOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Approval/Rejection state
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [approvalData, setApprovalData] = useState({
    truckNumber: '',
    driverName: '',
    driverMobile: '',
    dispatchDate: new Date().toISOString().split('T')[0]
  });
  const [rejectionData, setRejectionData] = useState({
    remarks: ''
  });
  const [approvalErrors, setApprovalErrors] = useState({});
  const [rejectionErrors, setRejectionErrors] = useState({});

  // User permissions
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const isAdminUser = isAdmin(user);
  const isSuperAdminUser = isSuperAdmin(user);
  const canApprove = isAdminUser || isSuperAdminUser;

  // Fetch request details
  useEffect(() => {
    fetchRequestDetails();
  }, [id]);

  const fetchRequestDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to get request by ID first
      let response = await partialDispatchService.getRequestById(
        id,
        selectedDivision?.id,
        showAllDivisions
      );

      // If that doesn't work, get all requests for the sales order
      if (!response.success && !response.data) {
        // We might need to get requests from the sales order
        // For now, let's assume we can get it directly
        response = { success: false, message: 'Request not found' };
      }

      if (response.success || response.data) {
        const requestData = response.data || response;
        setRequest(requestData);

        // If we have salesOrderId, fetch sales order details
        if (requestData.salesOrderId) {
          const orderResponse = await partialDispatchService.getSalesOrderDetails(
            requestData.salesOrderId,
            selectedDivision?.id,
            showAllDivisions
          );
          if (orderResponse.success || orderResponse.data) {
            setSalesOrder(orderResponse.data || orderResponse);
          }
        }
      } else {
        throw new Error(response.message || 'Failed to fetch request');
      }
    } catch (err) {
      console.error('Error fetching request details:', err);
      setError(err.message || 'Failed to fetch request details');
      setIsErrorModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const validateApproval = () => {
    const newErrors = {};

    if (!approvalData.truckNumber.trim()) {
      newErrors.truckNumber = 'Truck number is required';
    }

    if (!approvalData.driverName.trim()) {
      newErrors.driverName = 'Driver name is required';
    }

    if (!approvalData.driverMobile.trim()) {
      newErrors.driverMobile = 'Driver mobile is required';
    } else if (!/^\d{10}$/.test(approvalData.driverMobile.replace(/\D/g, ''))) {
      newErrors.driverMobile = 'Driver mobile must be 10 digits';
    }

    setApprovalErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleApprove = async () => {
    if (!canApprove) {
      showErrorNotification('Only Admin/Super Admin can approve requests');
      return;
    }

    if (!validateApproval()) {
      showErrorNotification('Please fix validation errors');
      return;
    }

    const confirmMessage = 'Are you sure you want to approve this request? This will dispatch stock and create invoice.';
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setSubmitting(true);

      const approvalPayload = {
        truckNumber: approvalData.truckNumber.trim(),
        driverName: approvalData.driverName.trim(),
        driverMobile: approvalData.driverMobile.replace(/\D/g, ''),
        dispatchDate: approvalData.dispatchDate || new Date().toISOString().split('T')[0]
      };

      const response = await partialDispatchService.approveRequest(
        id,
        approvalPayload,
        selectedDivision?.id,
        showAllDivisions
      );

      if (response.success) {
        showSuccessNotification(
          `Request approved successfully! DC Number: ${response.data?.dcNumber || 'N/A'}, Invoice: ${response.data?.invoiceNumber || 'N/A'}`
        );
        setShowApproveModal(false);
        fetchRequestDetails(); // Refresh request data
      } else {
        throw new Error(response.message || 'Failed to approve request');
      }
    } catch (err) {
      console.error('Error approving request:', err);
      showErrorNotification(err.message || 'Failed to approve request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!canApprove) {
      showErrorNotification('Only Admin/Super Admin can reject requests');
      return;
    }

    const confirmMessage = 'Are you sure you want to reject this request?';
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setSubmitting(true);

      const rejectionPayload = {
        remarks: rejectionData.remarks.trim() || undefined
      };

      const response = await partialDispatchService.rejectRequest(
        id,
        rejectionPayload,
        selectedDivision?.id,
        showAllDivisions
      );

      if (response.success) {
        showSuccessNotification('Request rejected successfully');
        setShowRejectModal(false);
        fetchRequestDetails(); // Refresh request data
      } else {
        throw new Error(response.message || 'Failed to reject request');
      }
    } catch (err) {
      console.error('Error rejecting request:', err);
      showErrorNotification(err.message || 'Failed to reject request');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      pending: 'badge bg-warning text-dark',
      approved: 'badge bg-success',
      rejected: 'badge bg-danger'
    };
    
    return statusClasses[status] || 'badge bg-secondary';
  };

  const closeErrorModal = () => {
    setIsErrorModalOpen(false);
    setError(null);
  };

  if (loading) {
    return <Loading />;
  }

  if (!request) {
    return (
      <div style={{ padding: '20px' }}>
        <div className="alert alert-danger">
          <h4>Request Not Found</h4>
          <p>{error || 'The partial dispatch request could not be loaded.'}</p>
          <button className="btn btn-secondary" onClick={() => navigate('/sales/partial-dispatch-requests')}>
            Go Back
          </button>
        </div>
        {isErrorModalOpen && (
          <ErrorModal
            isOpen={isErrorModalOpen}
            message={error}
            onClose={closeErrorModal}
          />
        )}
      </div>
    );
  }

  const order = salesOrder || request.salesOrder || {};

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Partial Dispatch Request Details</h2>
        <button className="btn btn-secondary" onClick={() => navigate('/sales/partial-dispatch-requests')}>
          <i className="bi bi-arrow-left me-2"></i>
          Back to Requests
        </button>
      </div>

      <div className="row">
        {/* Left Section - Request Details */}
        <div className="col-md-8">
          {/* Request Info */}
          <div className="card mb-3">
            <div className="card-header">
              <h5 className="mb-0">Request Information</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-3">
                  <label className="form-label"><strong>Request ID</strong></label>
                  <p>#{request.id}</p>
                </div>
                <div className="col-md-3">
                  <label className="form-label"><strong>Status</strong></label>
                  <p>
                    <span className={getStatusBadge(request.status)}>
                      {request.status?.charAt(0).toUpperCase() + request.status?.slice(1) || 'Pending'}
                    </span>
                  </p>
                </div>
                <div className="col-md-3">
                  <label className="form-label"><strong>Request Date</strong></label>
                  <p>
                    {request.createdAt 
                      ? new Date(request.createdAt).toLocaleDateString('en-GB')
                      : 'N/A'}
                  </p>
                </div>
                <div className="col-md-3">
                  <label className="form-label"><strong>Requested By</strong></label>
                  <p>{request.requestedByUser?.name || request.requestedBy || 'N/A'}</p>
                </div>
              </div>
              {request.remarks && (
                <div className="row mt-2">
                  <div className="col-12">
                    <label className="form-label"><strong>Remarks</strong></label>
                    <p>{request.remarks}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sales Order Info */}
          <div className="card mb-3">
            <div className="card-header">
              <h5 className="mb-0">Sales Order Information</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-3">
                  <label className="form-label"><strong>Order Number</strong></label>
                  <p>
                    {order.orderNumber || `SO-${request.salesOrderId}`}
                  </p>
                </div>
                <div className="col-md-3">
                  <label className="form-label"><strong>Customer</strong></label>
                  <p>{order.customer?.name || order.customer?.customerName || 'N/A'}</p>
                </div>
                <div className="col-md-3">
                  <label className="form-label"><strong>Warehouse</strong></label>
                  <p>{order.warehouse?.name || 'N/A'}</p>
                </div>
                <div className="col-md-3">
                  <label className="form-label"><strong>Order Date</strong></label>
                  <p>
                    {order.orderDate 
                      ? new Date(order.orderDate).toLocaleDateString('en-GB')
                      : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Request Items */}
          <div className="card mb-3">
            <div className="card-header">
              <h5 className="mb-0">Request Items</h5>
            </div>
            <div className="card-body">
              {request.items && request.items.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-bordered">
                    <thead>
                      <tr>
                        <th>Product Name</th>
                        <th>Ordered Qty</th>
                        <th>Already Dispatched</th>
                        <th>Remaining Qty</th>
                        <th>Requested Qty</th>
                        <th>Unit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {request.items.map((item, index) => {
                        const orderItem = (order.items || []).find(oi => oi.id === item.salesOrderItemId);
                        const orderedQty = orderItem?.quantity || 0;
                        const dispatchedQty = orderItem?.quantityDispatched || 0;
                        const remainingQty = orderItem?.quantityRemaining || (orderedQty - dispatchedQty);

                        return (
                          <tr key={item.id || index}>
                            <td>{item.product?.name || item.productName || 'Unknown'}</td>
                            <td>{orderedQty}</td>
                            <td>{dispatchedQty}</td>
                            <td>{remainingQty}</td>
                            <td><strong>{item.requestedQuantity}</strong></td>
                            <td>{item.unit}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted">No items in this request.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Section - Approval Actions */}
        {request.status === 'pending' && canApprove && (
          <div className="col-md-4">
            {/* Approve Form */}
            <div className="card mb-3">
              <div className="card-header bg-success text-white">
                <h5 className="mb-0">Approve Request</h5>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <label className="form-label">Truck Number *</label>
                  <input
                    type="text"
                    className={`form-control ${approvalErrors.truckNumber ? 'is-invalid' : ''}`}
                    value={approvalData.truckNumber}
                    onChange={(e) => {
                      setApprovalData({ ...approvalData, truckNumber: e.target.value });
                      setApprovalErrors({ ...approvalErrors, truckNumber: '' });
                    }}
                    placeholder="Enter truck number"
                  />
                  {approvalErrors.truckNumber && (
                    <div className="invalid-feedback d-block">
                      {approvalErrors.truckNumber}
                    </div>
                  )}
                </div>

                <div className="mb-3">
                  <label className="form-label">Driver Name *</label>
                  <input
                    type="text"
                    className={`form-control ${approvalErrors.driverName ? 'is-invalid' : ''}`}
                    value={approvalData.driverName}
                    onChange={(e) => {
                      setApprovalData({ ...approvalData, driverName: e.target.value });
                      setApprovalErrors({ ...approvalErrors, driverName: '' });
                    }}
                    placeholder="Enter driver name"
                  />
                  {approvalErrors.driverName && (
                    <div className="invalid-feedback d-block">
                      {approvalErrors.driverName}
                    </div>
                  )}
                </div>

                <div className="mb-3">
                  <label className="form-label">Driver Mobile *</label>
                  <input
                    type="tel"
                    className={`form-control ${approvalErrors.driverMobile ? 'is-invalid' : ''}`}
                    value={approvalData.driverMobile}
                    onChange={(e) => {
                      setApprovalData({ ...approvalData, driverMobile: e.target.value });
                      setApprovalErrors({ ...approvalErrors, driverMobile: '' });
                    }}
                    placeholder="10-digit mobile number"
                    maxLength="10"
                  />
                  {approvalErrors.driverMobile && (
                    <div className="invalid-feedback d-block">
                      {approvalErrors.driverMobile}
                    </div>
                  )}
                </div>

                <div className="mb-3">
                  <label className="form-label">Dispatch Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={approvalData.dispatchDate}
                    onChange={(e) => setApprovalData({ ...approvalData, dispatchDate: e.target.value })}
                  />
                </div>

                <button
                  className="btn btn-success w-100"
                  onClick={handleApprove}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Approving...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-circle me-2"></i>
                      Approve Request
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Reject Form */}
            <div className="card">
              <div className="card-header bg-danger text-white">
                <h5 className="mb-0">Reject Request</h5>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <label className="form-label">Rejection Remarks (Optional)</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={rejectionData.remarks}
                    onChange={(e) => setRejectionData({ ...rejectionData, remarks: e.target.value })}
                    placeholder="Enter reason for rejection..."
                  />
                </div>

                <button
                  className="btn btn-danger w-100"
                  onClick={handleReject}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Rejecting...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-x-circle me-2"></i>
                      Reject Request
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Show status info if not pending */}
        {request.status !== 'pending' && (
          <div className="col-md-4">
            <div className={`card ${request.status === 'approved' ? 'border-success' : 'border-danger'}`}>
              <div className={`card-header ${request.status === 'approved' ? 'bg-success' : 'bg-danger'} text-white`}>
                <h5 className="mb-0">
                  Request {request.status === 'approved' ? 'Approved' : 'Rejected'}
                </h5>
              </div>
              <div className="card-body">
                <p>
                  <strong>Status:</strong> {request.status?.charAt(0).toUpperCase() + request.status?.slice(1)}
                </p>
                {request.updatedAt && (
                  <p>
                    <strong>Updated:</strong>{' '}
                    {new Date(request.updatedAt).toLocaleString('en-GB')}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {isErrorModalOpen && (
        <ErrorModal
          isOpen={isErrorModalOpen}
          message={error}
          onClose={closeErrorModal}
        />
      )}
    </div>
  );
};

export default PartialDispatchRequestDetail;

