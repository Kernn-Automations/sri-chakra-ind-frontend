import React, { useState, useEffect } from 'react';
import { useReturnRequest } from '../../../hooks/useReturnRequest';
import {
  DialogActionTrigger,
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogRoot,
} from '../../../components/ui/dialog';
import styles from './Returns.module.css';

const CreateReturnRequest = ({ onClose, onSuccess }) => {
  const {
    salesOrders,
    returnReasons,
    damagedReasons,
    loading,
    error,
    loadSalesOrders,
    loadReturnReasons,
    loadDamagedReasons,
    getSalesOrderDetails,
    createReturnRequest,
    uploadReturnImages
  } = useReturnRequest();

  const [formData, setFormData] = useState({
    salesOrderId: '',
    returnCase: 'post_delivery',
    returnReason: '',
    customReason: '',
    notes: ''
  });

  const [selectedSalesOrder, setSelectedSalesOrder] = useState(null);
  const [salesOrderItems, setSalesOrderItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [images, setImages] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  // Debug logging
  useEffect(() => {
    console.log('CreateReturnRequest - Component mounted with division context');
    console.log('CreateReturnRequest - Initial hook state:', {
      salesOrdersCount: salesOrders.length,
      loading,
      error
    });
  }, []);

  // Load initial data
  useEffect(() => {
    loadReturnReasons();
    loadDamagedReasons();
  }, []);

  // Load sales orders when return case changes
  useEffect(() => {
    if (formData.returnCase) {
      console.log('CreateReturnRequest - Loading sales orders for return case:', formData.returnCase);
      console.log('CreateReturnRequest - About to call loadSalesOrders with:', {
        returnCase: formData.returnCase,
        page: 1,
        limit: 100,
        search: searchTerm
      });
      loadSalesOrders(formData.returnCase, 1, 100, searchTerm);
    }
  }, [formData.returnCase, searchTerm]);

  // Debug logging for sales orders and error state
  useEffect(() => {
    console.log('CreateReturnRequest - Sales orders updated:', {
      count: salesOrders.length,
      orders: salesOrders.map(order => ({ id: order.id, orderNumber: order.orderNumber })),
      error: error,
      loading: loading
    });
  }, [salesOrders, error, loading]);

  // Load sales order details when sales order is selected
  const handleSalesOrderChange = async (salesOrderId) => {
    setFormData(prev => ({ ...prev, salesOrderId }));
    setSelectedItems([]);
    setValidationErrors({});
    
    if (salesOrderId) {
      try {
        const salesOrderData = await getSalesOrderDetails(salesOrderId);
        setSelectedSalesOrder(salesOrderData);
        setSalesOrderItems(salesOrderData.items || []);
      } catch (error) {
        console.error('Error fetching sales order details:', error);
        setValidationErrors({ salesOrderId: 'Failed to load sales order details' });
      }
    } else {
      setSelectedSalesOrder(null);
      setSalesOrderItems([]);
    }
  };

  // Handle item selection
  const handleItemToggle = (item, isSelected) => {
    if (isSelected) {
      setSelectedItems([...selectedItems, { 
        ...item, 
        returnQuantity: item.quantity,
        itemReturnReason: formData.returnReason,
        itemCustomReason: formData.customReason,
        itemCondition: 'Good',
        damageDescription: null
      }]);
    } else {
      setSelectedItems(selectedItems.filter(selected => selected.id !== item.id));
    }
  };

  // Handle quantity change
  const handleQuantityChange = (itemId, quantity) => {
    const updatedItems = selectedItems.map(item => 
      item.id === itemId ? { ...item, returnQuantity: parseFloat(quantity) || 0 } : item
    );
    setSelectedItems(updatedItems);
  };

  // Handle item condition change
  const handleItemConditionChange = (itemId, condition) => {
    const updatedItems = selectedItems.map(item => 
      item.id === itemId ? { ...item, itemCondition: condition } : item
    );
    setSelectedItems(updatedItems);
  };

  // Handle damage description change
  const handleDamageDescriptionChange = (itemId, description) => {
    const updatedItems = selectedItems.map(item => 
      item.id === itemId ? { ...item, damageDescription: description } : item
    );
    setSelectedItems(updatedItems);
  };

  // Validate form
  const validateForm = () => {
    const errors = {};
    
    if (!formData.salesOrderId) {
      errors.salesOrderId = 'Sales Order is required';
    }
    
    if (!formData.returnReason) {
      errors.returnReason = 'Return reason is required';
    }
    
    if (selectedItems.length === 0) {
      errors.items = 'Please select at least one item to return';
    }
    
    // Validate quantities
    const invalidItems = selectedItems.filter(item => 
      !item.returnQuantity || item.returnQuantity <= 0 || item.returnQuantity > item.quantity
    );
    
    if (invalidItems.length > 0) {
      errors.quantities = 'Please enter valid quantities for all selected items';
    }
    
    // Check if selected reason requires images
    const selectedReason = returnReasons.find(reason => reason.reasonName === formData.returnReason);
    if (selectedReason?.requiresImages && images.length === 0) {
      errors.images = 'Images are required for this return reason';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      // Prepare return data
      const returnData = {
        salesOrderId: parseInt(formData.salesOrderId),
        returnCase: formData.returnCase,
        returnReason: formData.returnReason,
        customReason: formData.customReason || null,
        returnItems: selectedItems.map(item => ({
          salesOrderItemId: item.id,
          productId: item.productId,
          returnQuantity: item.returnQuantity,
          unit: item.unit,
          itemReturnReason: formData.returnReason,
          itemCustomReason: formData.customReason || null,
          itemCondition: item.itemCondition,
          damageDescription: item.damageDescription || null
        })),
        notes: formData.notes || null,
        images: images
      };

      const result = await createReturnRequest(returnData);
      
      // Upload images if any
      if (images.length > 0 && result.returnRequest) {
        await uploadReturnImages(result.returnRequest.id, images);
      }

      alert('Return request created successfully!');
      onSuccess && onSuccess(result);
      onClose();
    } catch (error) {
      console.error('Error creating return request:', error);
    }
  };

  // Handle image selection
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const maxFiles = 10;
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    
    if (files.length > maxFiles) {
      alert(`Maximum ${maxFiles} images allowed`);
      return;
    }
    
    for (let file of files) {
      if (!allowedTypes.includes(file.type)) {
        alert('Only JPEG, JPG, PNG, GIF, and WEBP images are allowed');
        return;
      }
      
      if (file.size > maxSize) {
        alert('Each image must be less than 5MB');
        return;
      }
    }
    
    setImages(files);
  };

  return (
    <div className={styles.modal}>
      <div className={styles.modalContent} style={{ maxWidth: '1000px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Create Return Request</h3>
          <button
            onClick={onClose}
            className={styles.closeButton}
          >
            ✕
          </button>
        </div>

        {error && (
          <div className={styles.alertError} style={{ marginBottom: '20px', padding: '10px' }}>
            {error}
          </div>
        )}

        {/* Show fallback data notice */}
        {salesOrders.length > 0 && salesOrders[0]?.orderNumber === "SO-2024-001" && (
          <div style={{ 
            backgroundColor: '#fff3cd', 
            border: '1px solid #ffeaa7', 
            borderRadius: '5px', 
            padding: '10px', 
            marginBottom: '20px',
            color: '#856404'
          }}>
            <strong>⚠️ Using Sample Data:</strong> The backend API is currently unavailable. 
            You can test the return request creation flow with the sample data provided. 
            Once the backend is fixed, real data will be loaded automatically.
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Component Render Test */}
          <div style={{ 
            padding: '10px', 
            backgroundColor: '#e3f2fd', 
            border: '1px solid #2196f3', 
            borderRadius: '4px', 
            marginBottom: '20px',
            fontSize: '14px'
          }}>
            ✅ CreateReturnRequest Component is rendering correctly
          </div>
          {/* Return Case Selection */}
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                Return Case *
              </label>
              <select
                value={formData.returnCase}
                onChange={(e) => setFormData(prev => ({ ...prev, returnCase: e.target.value }))}
                className={styles.formSelect}
                required
              >
                <option value="pre_dispatch">Pre-Dispatch</option>
                <option value="post_delivery">Post-Delivery</option>
              </select>
            </div>
          </div>

          {/* Sales Order Selection */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              Sales Order *
            </label>
            
            {/* Debug Info */}
            <div style={{ 
              fontSize: '12px', 
              color: '#666', 
              marginBottom: '5px',
              padding: '5px',
              backgroundColor: '#f8f9fa',
              borderRadius: '3px'
            }}>
              Debug: Sales Orders Count: {salesOrders.length} | Loading: {loading ? 'Yes' : 'No'} | Error: {error || 'None'}
            </div>
            <div style={{ marginBottom: '10px' }}>
              <input
                type="text"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.formInput}
                style={{ marginBottom: '10px' }}
              />
            </div>
            <select
              value={formData.salesOrderId}
              onChange={(e) => handleSalesOrderChange(e.target.value)}
              className={styles.formSelect}
              required
              disabled={loading}
              style={{ 
                width: '100%', 
                padding: '10px', 
                border: '1px solid #ddd', 
                borderRadius: '4px',
                backgroundColor: loading ? '#f5f5f5' : 'white'
              }}
            >
              <option value="">Select Sales Order</option>
              {salesOrders.length === 0 ? (
                <option value="" disabled>
                  {loading ? 'Loading sales orders...' : 'No sales orders available'}
                </option>
              ) : (
                salesOrders.map(order => (
                  <option key={order.id} value={order.id}>
                    {order.orderNumber} - {order.customer?.name || order.customer?.customerName} - ₹{order.totalAmount}
                  </option>
                ))
              )}
            </select>
            {validationErrors.salesOrderId && (
              <span className={styles.alertError}>{validationErrors.salesOrderId}</span>
            )}
          </div>

          {/* Return Reason */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              Return Reason *
            </label>
            <select
              value={formData.returnReason}
              onChange={(e) => setFormData(prev => ({ ...prev, returnReason: e.target.value }))}
              className={styles.formSelect}
              required
            >
              <option value="">Select Return Reason</option>
              {returnReasons.map(reason => (
                <option key={reason.id} value={reason.reasonName}>
                  {reason.reasonName}
                </option>
              ))}
            </select>
            {validationErrors.returnReason && (
              <span className={styles.alertError}>{validationErrors.returnReason}</span>
            )}
          </div>

          {/* Custom Reason */}
          {formData.returnReason && (
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                Custom Reason
              </label>
              <input
                type="text"
                value={formData.customReason}
                onChange={(e) => setFormData(prev => ({ ...prev, customReason: e.target.value }))}
                className={styles.formInput}
                placeholder="Enter custom reason if applicable"
              />
            </div>
          )}

          {/* Items Selection */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              Select Items to Return *
            </label>
            {validationErrors.items && (
              <span className={styles.alertError}>{validationErrors.items}</span>
            )}
            {salesOrderItems.length > 0 ? (
              <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '5px', padding: '10px' }}>
                {salesOrderItems.map(item => {
                  const isSelected = selectedItems.some(selected => selected.id === item.id);
                  const selectedItem = selectedItems.find(selected => selected.id === item.id);
                  
                  return (
                    <div key={item.id} style={{
                      border: isSelected ? '2px solid #3498db' : '1px solid #ecf0f1',
                      borderRadius: '8px',
                      padding: '15px',
                      marginBottom: '10px',
                      backgroundColor: isSelected ? '#f8f9fa' : 'white'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => handleItemToggle(item, e.target.checked)}
                              style={{ marginRight: '10px' }}
                            />
                            <div>
                              <h4 style={{ margin: 0, fontSize: '16px' }}>{item.product?.name || 'Unknown Product'}</h4>
                              <p style={{ margin: '5px 0', color: '#666', fontSize: '14px' }}>
                                SKU: {item.product?.SKU || 'N/A'} | 
                                Unit: {item.unit} | 
                                Price: ₹{item.unitPrice}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {isSelected && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginTop: '10px' }}>
                          <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Return Quantity:</label>
                            <input
                              type="number"
                              min="0"
                              max={item.quantity}
                              value={selectedItem?.returnQuantity || 0}
                              onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                              className={styles.formInput}
                              style={{ width: '100%' }}
                            />
                            <small style={{ color: '#666' }}>
                              Max: {item.quantity} {item.unit}
                            </small>
                          </div>
                          
                          <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Item Condition:</label>
                            <select
                              value={selectedItem?.itemCondition || 'Good'}
                              onChange={(e) => handleItemConditionChange(item.id, e.target.value)}
                              className={styles.formSelect}
                              style={{ width: '100%' }}
                            >
                              <option value="Good">Good</option>
                              <option value="Damaged">Damaged</option>
                              <option value="Expired">Expired</option>
                            </select>
                          </div>
                          
                          <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Damage Description:</label>
                            <input
                              type="text"
                              value={selectedItem?.damageDescription || ''}
                              onChange={(e) => handleDamageDescriptionChange(item.id, e.target.value)}
                              className={styles.formInput}
                              style={{ width: '100%' }}
                              placeholder="Describe damage if applicable"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                {formData.salesOrderId ? 'No items found for this order' : 'Please select a sales order first'}
              </div>
            )}
            {validationErrors.quantities && (
              <span className={styles.alertError}>{validationErrors.quantities}</span>
            )}
          </div>

          {/* Images */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              Images
            </label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageChange}
              className={styles.formInput}
            />
            <small style={{ color: '#666', display: 'block', marginTop: '5px' }}>
              Maximum 10 images, 5MB each. Supported formats: JPEG, JPG, PNG, GIF, WEBP
            </small>
            {validationErrors.images && (
              <span className={styles.alertError}>{validationErrors.images}</span>
            )}
            {images.length > 0 && (
              <div style={{ marginTop: '10px' }}>
                <strong>Selected Images:</strong>
                <ul style={{ marginTop: '5px' }}>
                  {images.map((file, index) => (
                    <li key={index} style={{ fontSize: '14px', color: '#666' }}>
                      {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className={styles.formTextarea}
              rows={3}
              placeholder="Additional notes about the return request"
            />
          </div>

          {/* Action Buttons */}
          <div className={styles.modalFooter}>
            <button
              type="button"
              onClick={onClose}
              className={`${styles.btn} ${styles.btnSecondary}`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`${styles.btn} ${styles.btnPrimary}`}
            >
              {loading ? 'Creating...' : 'Create Return Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateReturnRequest;
