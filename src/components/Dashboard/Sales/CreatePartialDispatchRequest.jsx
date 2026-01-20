import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../Auth';
import { useDivision } from '../../context/DivisionContext';
import partialDispatchService from '../../../services/partialDispatchService';
import { showSuccessNotification, showErrorNotification } from '../../../utils/errorHandler';
import { isAdmin, isSuperAdmin } from '../../../utils/roleUtils';
import Loading from '@/components/Loading';
import ErrorModal from '@/components/ErrorModal';

const CreatePartialDispatchRequest = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { axiosAPI } = useAuth();
  const { selectedDivision, showAllDivisions } = useDivision();

  const salesOrderId = searchParams.get('orderId');
  const [salesOrder, setSalesOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [selectedItems, setSelectedItems] = useState([]);
  const [remarks, setRemarks] = useState('');
  const [errors, setErrors] = useState({});

  // User permissions
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const isAdminUser = isAdmin(user);
  const isSuperAdminUser = isSuperAdmin(user);
  const canCreate = isAdminUser || isSuperAdminUser;

  // Check permissions
  useEffect(() => {
    if (!canCreate) {
      showErrorNotification('Only Admin/Super Admin can create partial dispatch requests');
      navigate('/sales/partial-dispatch-requests');
    }
  }, [canCreate, navigate]);

  // Fetch sales order details
  useEffect(() => {
    if (salesOrderId) {
      fetchSalesOrder();
    } else {
      setError('Sales Order ID is required');
      setIsErrorModalOpen(true);
    }
  }, [salesOrderId]);

  const fetchSalesOrder = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await partialDispatchService.getSalesOrderDetails(
        salesOrderId,
        selectedDivision?.id,
        showAllDivisions
      );

      if (response.success) {
        const order = response.data || response;
        setSalesOrder(order);

        // Initialize selected items with all items that have remaining quantity > 0
        const itemsWithRemaining = (order.items || []).filter(
          item => (item.quantityRemaining || item.quantity - item.quantityDispatched) > 0
        );
        setSelectedItems(
          itemsWithRemaining.map(item => ({
            salesOrderItemId: item.id,
            productId: item.productId,
            productName: item.product?.name || item.product?.productName || 'Unknown',
            orderedQuantity: item.quantity,
            dispatchedQuantity: item.quantityDispatched || 0,
            remainingQuantity: item.quantityRemaining || (item.quantity - (item.quantityDispatched || 0)),
            requestedQuantity: 0,
            unit: item.product?.unit || item.unit || 'kg',
            selected: false
          }))
        );
      } else {
        throw new Error(response.message || 'Failed to fetch sales order');
      }
    } catch (err) {
      console.error('Error fetching sales order:', err);
      setError(err.message || 'Failed to fetch sales order details');
      setIsErrorModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleItemSelect = (index) => {
    const updatedItems = [...selectedItems];
    updatedItems[index].selected = !updatedItems[index].selected;
    if (!updatedItems[index].selected) {
      updatedItems[index].requestedQuantity = 0;
    }
    setSelectedItems(updatedItems);
  };

  const handleQuantityChange = (index, value) => {
    const updatedItems = [...selectedItems];
    const numValue = parseFloat(value) || 0;
    const maxQuantity = updatedItems[index].remainingQuantity;

    if (numValue > maxQuantity) {
      setErrors(prev => ({
        ...prev,
        [index]: `Cannot exceed remaining quantity (${maxQuantity})`
      }));
      return;
    }

    if (numValue < 0) {
      setErrors(prev => ({
        ...prev,
        [index]: 'Quantity must be greater than 0'
      }));
      return;
    }

    updatedItems[index].requestedQuantity = numValue;
    setSelectedItems(updatedItems);
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[index];
      return newErrors;
    });
  };

  const validateForm = () => {
    const newErrors = {};
    const hasSelectedItems = selectedItems.some(item => item.selected && item.requestedQuantity > 0);

    if (!hasSelectedItems) {
      newErrors.items = 'Please select at least one item and enter requested quantity';
    }

    selectedItems.forEach((item, index) => {
      if (item.selected) {
        if (!item.requestedQuantity || item.requestedQuantity <= 0) {
          newErrors[index] = 'Requested quantity must be greater than 0';
        } else if (item.requestedQuantity > item.remainingQuantity) {
          newErrors[index] = `Cannot exceed remaining quantity (${item.remainingQuantity})`;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      showErrorNotification('Please fix the validation errors before submitting');
      return;
    }

    try {
      setSubmitting(true);

      const itemsToSubmit = selectedItems
        .filter(item => item.selected && item.requestedQuantity > 0)
        .map(item => ({
          salesOrderItemId: item.salesOrderItemId,
          productId: item.productId,
          requestedQuantity: item.requestedQuantity,
          unit: item.unit
        }));

      const requestData = {
        requestType: 'partial',
        remarks: remarks.trim() || undefined,
        items: itemsToSubmit
      };

      const response = await partialDispatchService.createRequest(
        salesOrderId,
        requestData,
        selectedDivision?.id,
        showAllDivisions
      );

      if (response.success) {
        showSuccessNotification('Partial dispatch request created successfully');
        navigate(`/sales/partial-dispatch-requests/${response.data?.requestId || response.data?.id}`);
      } else {
        throw new Error(response.message || 'Failed to create request');
      }
    } catch (err) {
      console.error('Error creating request:', err);
      showErrorNotification(err.message || 'Failed to create partial dispatch request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/sales/partial-dispatch-requests');
  };

  const closeErrorModal = () => {
    setIsErrorModalOpen(false);
    setError(null);
  };

  if (loading) {
    return <Loading />;
  }

  if (!salesOrder) {
    return (
      <div style={{ padding: '20px' }}>
        <div className="alert alert-danger">
          <h4>Sales Order Not Found</h4>
          <p>{error || 'The sales order could not be loaded.'}</p>
          <button className="btn btn-secondary" onClick={handleCancel}>
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

  const hasRemainingItems = selectedItems.some(item => item.remainingQuantity > 0);

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Create Partial Dispatch Request</h2>
        <button className="btn btn-secondary" onClick={handleCancel}>
          <i className="bi bi-arrow-left me-2"></i>
          Cancel
        </button>
      </div>

      {!hasRemainingItems && (
        <div className="alert alert-warning">
          <i className="bi bi-exclamation-triangle me-2"></i>
          This sales order has no remaining items to dispatch. All items have been fully dispatched.
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Sales Order Info */}
        <div className="card mb-3">
          <div className="card-header">
            <h5 className="mb-0">Sales Order Information</h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-3">
                <label className="form-label"><strong>Order Number</strong></label>
                <p>{salesOrder.orderNumber || `SO-${salesOrder.id}`}</p>
              </div>
              <div className="col-md-3">
                <label className="form-label"><strong>Customer</strong></label>
                <p>{salesOrder.customer?.name || salesOrder.customer?.customerName || 'N/A'}</p>
              </div>
              <div className="col-md-3">
                <label className="form-label"><strong>Order Date</strong></label>
                <p>{salesOrder.orderDate 
                  ? new Date(salesOrder.orderDate).toLocaleDateString('en-GB')
                  : 'N/A'}</p>
              </div>
              <div className="col-md-3">
                <label className="form-label"><strong>Warehouse</strong></label>
                <p>{salesOrder.warehouse?.name || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Items Selection */}
        <div className="card mb-3">
          <div className="card-header">
            <h5 className="mb-0">Items Selection</h5>
          </div>
          <div className="card-body">
            {errors.items && (
              <div className="alert alert-danger">
                {errors.items}
              </div>
            )}

            {selectedItems.length === 0 ? (
              <div className="alert alert-info">
                No items available for partial dispatch.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-bordered">
                  <thead>
                    <tr>
                      <th style={{ width: '50px' }}>Select</th>
                      <th>Product Name</th>
                      <th>Ordered Qty</th>
                      <th>Dispatched Qty</th>
                      <th>Remaining Qty</th>
                      <th>Requested Qty</th>
                      <th>Unit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedItems.map((item, index) => (
                      <tr key={item.salesOrderItemId}>
                        <td>
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={item.selected}
                            onChange={() => handleItemSelect(index)}
                            disabled={item.remainingQuantity <= 0}
                          />
                        </td>
                        <td>{item.productName}</td>
                        <td>{item.orderedQuantity}</td>
                        <td>{item.dispatchedQuantity}</td>
                        <td>
                          <strong className={item.remainingQuantity > 0 ? 'text-success' : 'text-danger'}>
                            {item.remainingQuantity}
                          </strong>
                        </td>
                        <td>
                          <input
                            type="number"
                            className={`form-control ${errors[index] ? 'is-invalid' : ''}`}
                            min="0"
                            max={item.remainingQuantity}
                            step="0.01"
                            value={item.requestedQuantity || ''}
                            onChange={(e) => handleQuantityChange(index, e.target.value)}
                            disabled={!item.selected || item.remainingQuantity <= 0}
                            required={item.selected}
                          />
                          {errors[index] && (
                            <div className="invalid-feedback d-block">
                              {errors[index]}
                            </div>
                          )}
                        </td>
                        <td>{item.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Remarks */}
        <div className="card mb-3">
          <div className="card-header">
            <h5 className="mb-0">Remarks (Optional)</h5>
          </div>
          <div className="card-body">
            <textarea
              className="form-control"
              rows="3"
              placeholder="Enter any additional notes or remarks about this request..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="d-flex justify-content-end gap-2">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleCancel}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting || !hasRemainingItems}
          >
            {submitting ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Creating...
              </>
            ) : (
              <>
                <i className="bi bi-check-circle me-2"></i>
                Create Request
              </>
            )}
          </button>
        </div>
      </form>

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

export default CreatePartialDispatchRequest;

