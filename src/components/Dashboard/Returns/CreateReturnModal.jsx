import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../Auth';
import { useDivision } from '../../context/DivisionContext';
import { useReturnRequest } from '../../../hooks/useReturnRequest';
import returnsService from '../../../services/returnsService';
import styles from './Returns.module.css';

const CreateReturnModal = ({ returnTypes, onSubmit, onClose }) => {
  const { axiosAPI } = useAuth();
  const { selectedDivision, showAllDivisions } = useDivision();
  
  const {
    salesOrders,
    returnReasons,
    loading,
    error,
    loadSalesOrders,
    loadReturnReasons,
    getSalesOrderDetails,
    createReturnRequest
  } = useReturnRequest();
  
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedOrderItems, setSelectedOrderItems] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    salesOrderId: '',
    returnCase: 'post_delivery',
    returnReason: '',
    customReason: '',
    returnItems: [],
    notes: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadReturnReasons();
  }, []);

  // Load sales orders when return case or search term changes
  useEffect(() => {
    if (formData.returnCase) {
      loadSalesOrders(formData.returnCase, 1, 100, searchTerm);
    }
  }, [formData.returnCase, searchTerm]);

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

  const handleSalesOrderChange = async (e) => {
    const salesOrderId = e.target.value;
    setFormData(prev => ({ ...prev, salesOrderId }));
    setSelectedOrderItems([]);
    setErrors({});
    
    if (salesOrderId) {
      try {
        const salesOrderData = await getSalesOrderDetails(salesOrderId);
        setSelectedOrder(salesOrderData);
        setSelectedOrderItems(salesOrderData.items || []);
      } catch (error) {
        console.error('Error fetching sales order details:', error);
        setErrors({ salesOrderId: 'Failed to load sales order details' });
      }
    } else {
      setSelectedOrder(null);
      setSelectedOrderItems([]);
    }
  };

  const handleReturnReasonChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      returnReason: value
    }));
    
    // Clear error when user makes a selection
    if (errors.returnReason) {
      setErrors(prev => ({
        ...prev,
        returnReason: ''
      }));
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const validation = returnsService.validateImages(files);
    
    if (!validation.valid) {
      alert(validation.message);
      return;
    }
    
    setSelectedImages(files);
  };

  const handleReturnItemChange = (itemId, field, value) => {
    setFormData(prev => ({
      ...prev,
      returnItems: prev.returnItems.map(item => 
        item.salesOrderItemId === itemId 
          ? { ...item, [field]: value }
          : item
      )
    }));
  };

  const addReturnItem = (orderItem) => {
    const existingItem = formData.returnItems.find(item => item.salesOrderItemId === orderItem.id);
    if (existingItem) return;
    
    setFormData(prev => ({
      ...prev,
      returnItems: [...prev.returnItems, {
        salesOrderItemId: orderItem.id,
        productId: orderItem.productId,
        returnQuantity: orderItem.quantity,
        unit: orderItem.unit || 'kg',
        itemCondition: 'good'
      }]
    }));
  };

  const removeReturnItem = (itemId) => {
    setFormData(prev => ({
      ...prev,
      returnItems: prev.returnItems.filter(item => item.salesOrderItemId !== itemId)
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.salesOrderId) newErrors.salesOrderId = 'Sales Order is required';
    if (!formData.returnReason) newErrors.returnReason = 'Return reason is required';
    if (formData.returnItems.length === 0) newErrors.returnItems = 'At least one return item is required';
    
    // Check if selected reason requires images
    const selectedReason = returnReasons.find(reason => reason.id === formData.returnReason);
    if (selectedReason?.requiresImages && selectedImages.length === 0) {
      newErrors.images = 'Images are required for this return reason';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

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
        returnItems: formData.returnItems.map(item => ({
          salesOrderItemId: item.salesOrderItemId,
          productId: item.productId,
          returnQuantity: item.returnQuantity,
          unit: item.unit,
          itemReturnReason: formData.returnReason,
          itemCustomReason: formData.customReason || null,
          itemCondition: item.itemCondition,
          damageDescription: null
        })),
        notes: formData.notes || null,
        images: selectedImages
      };
      
      // Use the onSubmit prop from parent component
      const result = await onSubmit(returnData);
      
      if (result.success) {
        alert('Return request created successfully');
        onClose();
      } else {
        alert(result.message || 'Failed to create return request');
      }
    } catch (error) {
      console.error('Error creating return:', error);
      alert('Error creating return request');
    }
  };

  return (
    <div className={styles.modal}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Create Return Request</h3>
          <button 
            className={styles.closeButton}
            onClick={onClose}
          >
            ×
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Return Case *</label>
              <select
                name="returnCase"
                value={formData.returnCase}
                onChange={handleInputChange}
                className={styles.formSelect}
                required
              >
                <option value="pre_dispatch">Pre-Dispatch</option>
                <option value="post_delivery">Post-Delivery</option>
              </select>
            </div>
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Sales Order *</label>
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
              name="salesOrderId"
              value={formData.salesOrderId}
              onChange={handleSalesOrderChange}
              className={styles.formSelect}
              required
              disabled={loading}
            >
              <option value="">Select Sales Order</option>
              {salesOrders.map(order => (
                <option key={order.id} value={order.id}>
                  {order.orderNumber} - {order.customer?.name || order.customer?.customerName} - ₹{order.totalAmount}
                </option>
              ))}
            </select>
            {errors.salesOrderId && <span className={styles.alertError}>{errors.salesOrderId}</span>}
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Return Reason *</label>
            <select
              name="returnReason"
              value={formData.returnReason}
              onChange={handleReturnReasonChange}
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
            {errors.returnReason && <span className={styles.alertError}>{errors.returnReason}</span>}
          </div>
          
          {/* Custom Reason */}
          {formData.returnReason && (
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Custom Reason</label>
              <input
                type="text"
                name="customReason"
                value={formData.customReason}
                onChange={handleInputChange}
                className={styles.formInput}
                placeholder="Enter custom reason if applicable"
              />
            </div>
          )}
          
          {/* Return Items Section */}
          {selectedOrder && (
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Select Items to Return *</label>
              {errors.returnItems && <span className={styles.alertError}>{errors.returnItems}</span>}
              
              <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '5px', padding: '10px' }}>
                {console.log('CreateReturnModal - rendering selectedOrderItems:', selectedOrderItems)}
                {selectedOrderItems.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#7f8c8d' }}>
                    No items found in this sales order. Please check if the order has items.
                  </div>
                ) : (
                  selectedOrderItems.map(item => {
                    console.log('CreateReturnModal - rendering item:', item);
                    const product = products.find(p => p.id === item.productId);
                    const isSelected = formData.returnItems.some(ri => ri.salesOrderItemId === item.id);
                  
                  return (
                    <div key={item.id} style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      padding: '8px',
                      border: isSelected ? '2px solid #3498db' : '1px solid #ecf0f1',
                      borderRadius: '5px',
                      marginBottom: '8px',
                      backgroundColor: isSelected ? '#f8f9fa' : 'white'
                    }}>
                      <div>
                        <strong>{product?.productName || 'Unknown Product'}</strong>
                        <br />
                        <small>Quantity: {item.quantity} {item.unit}</small>
                        <br />
                        <small>Price: ₹{item.unitPrice}</small>
                      </div>
                      <button
                        type="button"
                        className={`${styles.btn} ${isSelected ? styles.btnSecondary : styles.btnPrimary}`}
                        onClick={() => isSelected ? removeReturnItem(item.id) : addReturnItem(item)}
                      >
                        {isSelected ? 'Remove' : 'Add'}
                      </button>
                    </div>
                  );
                  })
                )}
              </div>
            </div>
          )}

          {/* Return Items Configuration */}
          {formData.returnItems.length > 0 && (
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Configure Return Items</label>
              {formData.returnItems.map((item, index) => {
                const orderItem = selectedOrderItems.find(oi => oi.id === item.salesOrderItemId);
                const product = products.find(p => p.id === item.productId);
                
                return (
                  <div key={item.salesOrderItemId} style={{ 
                    border: '1px solid #ddd', 
                    borderRadius: '5px', 
                    padding: '15px', 
                    marginBottom: '10px',
                    backgroundColor: '#f8f9fa'
                  }}>
                    <h5>{product?.productName}</h5>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                      <div>
                        <label>Return Quantity</label>
                        <input
                          type="number"
                          value={item.returnQuantity}
                          onChange={(e) => handleReturnItemChange(item.salesOrderItemId, 'returnQuantity', parseFloat(e.target.value))}
                          min="0"
                          max={orderItem?.quantity}
                          className={styles.formInput}
                        />
                      </div>
                      <div>
                        <label>Unit</label>
                        <input
                          type="text"
                          value={item.unit}
                          onChange={(e) => handleReturnItemChange(item.salesOrderItemId, 'unit', e.target.value)}
                          className={styles.formInput}
                        />
                      </div>
                      <div>
                        <label>Item Condition</label>
                        <select
                          value={item.itemCondition}
                          onChange={(e) => handleReturnItemChange(item.salesOrderItemId, 'itemCondition', e.target.value)}
                          className={styles.formSelect}
                        >
                          <option value="good">Good</option>
                          <option value="damaged">Damaged</option>
                          <option value="expired">Expired</option>
                        </select>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Images Section */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Images</label>
            {errors.images && <span className={styles.alertError}>{errors.images}</span>}
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageChange}
              className={styles.formInput}
            />
            <small style={{ color: '#7f8c8d' }}>
              Maximum 10 images, 5MB each. Supported formats: JPEG, JPG, PNG, GIF, WEBP
            </small>
            {selectedImages.length > 0 && (
              <div style={{ marginTop: '10px' }}>
                <strong>Selected Images:</strong>
                <ul>
                  {selectedImages.map((file, index) => (
                    <li key={index}>{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              className={styles.formTextarea}
              placeholder="Additional notes about the return request"
              rows="4"
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
              {loading ? 'Creating...' : 'Create Return Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateReturnModal;
