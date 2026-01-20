import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../Auth';
import { useDivision } from '../../context/DivisionContext';
import returnsService from '../../../services/returnsService';
import ImageUploadComponent from './ImageUploadComponent';
import {
  DialogActionTrigger,
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogRoot,
} from '../../../components/ui/dialog';
import styles from './Returns.module.css';

const CreateReturnRequestNew = ({ onClose, onSuccess }) => {
  const { axiosAPI } = useAuth();
  const { selectedDivision, showAllDivisions } = useDivision();
  
  // State for form data
  const [formData, setFormData] = useState({
    salesOrderId: '',
    returnReason: '',
    customReason: '',
    returnType: 'partial',
    refundMethod: '',
    notes: ''
  });

  // State for data loading
  const [salesOrders, setSalesOrders] = useState([]);
  const [returnReasons, setReturnReasons] = useState([]);
  const [refundMethods, setRefundMethods] = useState([]);
  const [returnTypes, setReturnTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // State for selected data
  const [selectedSalesOrder, setSelectedSalesOrder] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [returnItems, setReturnItems] = useState([]);
  const [images, setImages] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  
  // Customer search state
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [highlightedCustomerIndex, setHighlightedCustomerIndex] = useState(-1);

  // State for validation
  const [validationErrors, setValidationErrors] = useState({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const divisionId = selectedDivision?.id || null;

      // Load all required data in parallel
      const [customersRes, ordersRes, reasonsRes, refundMethodsRes, returnTypesRes] = await Promise.all([
        returnsService.getCustomers(divisionId, showAllDivisions),
        returnsService.getEligibleSalesOrders({ returnCase: 'post_delivery' }, divisionId, showAllDivisions),
        returnsService.getReturnReasons({}, divisionId, showAllDivisions),
        returnsService.getRefundMethods(divisionId, showAllDivisions),
        returnsService.getReturnTypes(divisionId, showAllDivisions)
      ]);

      // Set customers
      console.log('Customers API response:', customersRes);
      if (customersRes.success && customersRes.data?.customers) {
        console.log('Setting customers from API:', customersRes.data.customers);
        // We'll use customers from sales orders for now, but this can be used for direct customer selection
      } else {
        console.log('No customers found in API response, will use customers from sales orders');
      }

      // Set sales orders
      console.log('Sales orders API response:', ordersRes);
      console.log('ordersRes keys:', Object.keys(ordersRes));
      console.log('ordersRes.success:', ordersRes.success);
      console.log('ordersRes.data:', ordersRes.data);
      
      if (ordersRes.success && ordersRes.data?.salesOrders) {
        console.log('Setting sales orders from API:', ordersRes.data.salesOrders);
        setSalesOrders(ordersRes.data.salesOrders);
      } else if (ordersRes.salesOrders) {
        console.log('Setting sales orders from direct response:', ordersRes.salesOrders);
        setSalesOrders(ordersRes.salesOrders);
      } else {
        console.log('No sales orders found in response, setting fallback data');
        // Set fallback data for testing
        const fallbackSalesOrders = [
          {
            id: 1,
            orderNumber: "SO-2024-001",
            orderStatus: "Dispatched",
            totalAmount: 5000,
            createdAt: "2024-01-15T10:30:00Z",
            customer: {
              id: 1,
              name: "John Doe",
              phone: "9876543210",
              email: "john@example.com",
              address: "123 Main St, City"
            },
            salesOrderItems: [
              {
                id: 1,
                productId: 10,
                quantity: 100,
                unit: "kg",
                unitPrice: 50,
                product: {
                  id: 10,
                  name: "Sample Product",
                  SKU: "SKU001",
                  unit: "kg"
                }
              }
            ]
          },
          {
            id: 2,
            orderNumber: "SO-2024-002",
            orderStatus: "Delivered",
            totalAmount: 7500,
            createdAt: "2024-01-14T14:20:00Z",
            customer: {
              id: 2,
              name: "Jane Smith",
              phone: "9876543211",
              email: "jane@example.com",
              address: "456 Oak Ave, Town"
            },
            salesOrderItems: [
              {
                id: 2,
                productId: 11,
                quantity: 50,
                unit: "kg",
                unitPrice: 150,
                product: {
                  id: 11,
                  name: "Premium Product",
                  SKU: "SKU002",
                  unit: "kg"
                }
              }
            ]
          },
          {
            id: 3,
            orderNumber: "SO-2024-003",
            orderStatus: "Pending",
            totalAmount: 3200,
            createdAt: "2024-01-13T09:15:00Z",
            customer: {
              id: 3,
              name: "Bob Johnson",
              phone: "9876543212",
              email: "bob@example.com",
              address: "789 Pine St, Village"
            },
            salesOrderItems: [
              {
                id: 3,
                productId: 12,
                quantity: 25,
                unit: "kg",
                unitPrice: 128,
                product: {
                  id: 12,
                  name: "Special Product",
                  SKU: "SKU003",
                  unit: "kg"
                }
              }
            ]
          }
        ];
        setSalesOrders(fallbackSalesOrders);
        console.log('Set fallback sales orders:', fallbackSalesOrders);
      }

      // Set return reasons
      if (reasonsRes.success && reasonsRes.data?.returnReasons) {
        setReturnReasons(reasonsRes.data.returnReasons);
      }

      // Set refund methods
      console.log('Refund methods API response:', refundMethodsRes);
      if (refundMethodsRes.refundMethods) {
        console.log('Setting refund methods:', refundMethodsRes.refundMethods);
        setRefundMethods(refundMethodsRes.refundMethods);
      } else if (refundMethodsRes.success && refundMethodsRes.data?.refundMethods) {
        // Fallback for old structure
        console.log('Setting refund methods (fallback):', refundMethodsRes.data.refundMethods);
        setRefundMethods(refundMethodsRes.data.refundMethods);
      } else {
        console.log('No refund methods found in response');
      }

      // Set return types
      console.log('Return types API response:', returnTypesRes);
      if (returnTypesRes.returnTypes) {
        console.log('Setting return types:', returnTypesRes.returnTypes);
        setReturnTypes(returnTypesRes.returnTypes);
      } else {
        console.log('No return types found in response');
      }

    } catch (error) {
      console.error('Error loading initial data:', error);
      
      // Set fallback data even if there's an error
      console.log('Setting fallback data due to error');
      const fallbackSalesOrders = [
        {
          id: 1,
          orderNumber: "SO-2024-001",
          orderStatus: "Dispatched",
          totalAmount: 5000,
          createdAt: "2024-01-15T10:30:00Z",
          customer: {
            id: 1,
            name: "John Doe",
            phone: "9876543210",
            email: "john@example.com",
            address: "123 Main St, City"
          },
          salesOrderItems: [
            {
              id: 1,
              productId: 10,
              quantity: 100,
              unit: "kg",
              unitPrice: 50,
              product: {
                id: 10,
                name: "Sample Product",
                SKU: "SKU001",
                unit: "kg"
              }
            }
          ]
        },
        {
          id: 2,
          orderNumber: "SO-2024-002",
          orderStatus: "Delivered",
          totalAmount: 7500,
          createdAt: "2024-01-14T14:20:00Z",
          customer: {
            id: 2,
            name: "Jane Smith",
            phone: "9876543211",
            email: "jane@example.com",
            address: "456 Oak Ave, Town"
          },
          salesOrderItems: [
            {
              id: 2,
              productId: 11,
              quantity: 50,
              unit: "kg",
              unitPrice: 150,
              product: {
                id: 11,
                name: "Premium Product",
                SKU: "SKU002",
                unit: "kg"
              }
            }
          ]
        }
      ];
      setSalesOrders(fallbackSalesOrders);
      console.log('Set fallback sales orders due to error:', fallbackSalesOrders);
    } finally {
      setLoading(false);
    }
  };

  // ESC key and outside click functionality
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        if (showCustomerDropdown) {
          setShowCustomerDropdown(false);
          setHighlightedCustomerIndex(-1);
        } else if (showDropdown) {
          setShowDropdown(false);
          setHighlightedIndex(-1);
        } else if (hasUnsavedChanges) {
          const confirmClose = window.confirm('You have unsaved changes. Are you sure you want to close?');
          if (confirmClose) {
            onClose();
          }
        } else {
          onClose();
        }
      }
    };

    const handleOutsideClick = (event) => {
      // Check if click is outside the search dropdowns
      const searchContainer = document.querySelector(`.${styles.searchContainer}`);
      const customerSearchContainer = document.querySelector(`.${styles.customerSearchContainer}`);
      
      if (searchContainer && !searchContainer.contains(event.target)) {
        setShowDropdown(false);
        setHighlightedIndex(-1);
      }
      
      if (customerSearchContainer && !customerSearchContainer.contains(event.target)) {
        setShowCustomerDropdown(false);
        setHighlightedCustomerIndex(-1);
      }
      
      // Check if click is outside the modal content
      const modalContent = document.querySelector('.mdl [data-radix-dialog-content]');
      if (modalContent && !modalContent.contains(event.target)) {
        onClose();
      }
    };

    // Add event listeners
    document.addEventListener('keydown', handleEscKey);
    document.addEventListener('click', handleOutsideClick);

    // Cleanup event listeners
    return () => {
      document.removeEventListener('keydown', handleEscKey);
      document.removeEventListener('click', handleOutsideClick);
    };
  }, [onClose, showDropdown, showCustomerDropdown, hasUnsavedChanges]);

  // Get unique customers from sales orders
  const customers = salesOrders.reduce((acc, order) => {
    if (order.customer && !acc.find(c => c.id === order.customer.id)) {
      acc.push({
        id: order.customer.id,
        name: order.customer.name,
        phone: order.customer.phone || order.customer.mobile,
        email: order.customer.email,
        address: order.customer.address
      });
    }
    return acc;
  }, []);

  // Debug logging
  console.log('Current salesOrders:', salesOrders);
  console.log('Extracted customers:', customers);

  // Filter customers based on search term
  const filteredCustomers = customers.filter(customer => {
    // If no search term, show all customers
    if (!customerSearchTerm.trim()) {
      return true;
    }
    
    const searchLower = customerSearchTerm.toLowerCase();
    return (
      customer.name?.toLowerCase().includes(searchLower) ||
      customer.phone?.includes(customerSearchTerm) ||
      customer.email?.toLowerCase().includes(searchLower) ||
      customer.address?.toLowerCase().includes(searchLower)
    );
  });

  console.log('Filtered customers:', filteredCustomers);
  console.log('Customer search term:', customerSearchTerm);

  // Enhanced filter sales orders based on search term and selected customer
  const filteredSalesOrders = salesOrders.filter(order => {
    // Filter by selected customer first
    if (selectedCustomer && order.customer?.id !== selectedCustomer.id) {
      return false;
    }
    
    // If no search term, show all orders (for selected customer)
    if (!searchTerm.trim()) {
      return true;
    }
    
    const searchLower = searchTerm.toLowerCase();
    return (
      order.orderNumber.toLowerCase().includes(searchLower) ||
      order.customer?.name?.toLowerCase().includes(searchLower) ||
      order.customer?.phone?.includes(searchTerm) ||
      order.customer?.email?.toLowerCase().includes(searchLower) ||
      order.totalAmount?.toString().includes(searchTerm) ||
      order.orderStatus?.toLowerCase().includes(searchLower)
    );
  });

  console.log('Filtered sales orders:', filteredSalesOrders);
  console.log('Sales order search term:', searchTerm);
  console.log('Selected customer:', selectedCustomer);

  // Orders list for current selection (used for dropdown)
  const ordersForCustomer = selectedCustomer
    ? salesOrders.filter(o => o.customer?.id === selectedCustomer.id)
    : salesOrders;

  // Simple dropdown change handlers
  const handleCustomerSelectDropdown = async (e) => {
    const id = Number(e.target.value);
    const cust = customers.find(c => c.id === id) || null;
    await handleCustomerSelect(cust);
  };

  const handleOrderSelectDropdown = (e) => {
    const id = Number(e.target.value);
    const order = ordersForCustomer.find(o => o.id === id);
    if (order) {
      handleOrderSelect(order);
    } else {
      setSelectedSalesOrder(null);
      setReturnItems([]);
      setFormData(prev => ({ ...prev, salesOrderId: '' }));
    }
  };

  // Debug effect to log state changes
  useEffect(() => {
    console.log('Sales orders state changed:', salesOrders);
  }, [salesOrders]);

  useEffect(() => {
    console.log('Customers state changed:', customers);
  }, [customers]);

  // Function to reload sales orders when customer is selected
  const reloadSalesOrdersForCustomer = async (customer) => {
    try {
      const divisionId = selectedDivision?.id || null;
      const params = { 
        returnCase: 'post_delivery',
        customerName: customer?.name 
      };
      
      console.log('Reloading sales orders for customer:', customer?.name);
      const ordersRes = await returnsService.getEligibleSalesOrders(params, divisionId, showAllDivisions);
      
      if (ordersRes.success && ordersRes.data?.salesOrders) {
        console.log('Updated sales orders for customer:', ordersRes.data.salesOrders);
        setSalesOrders(ordersRes.data.salesOrders);
      }
    } catch (error) {
      console.error('Error reloading sales orders for customer:', error);
    }
  };

  // Handle search input changes
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setShowDropdown(true); // Always show dropdown when typing
    setHighlightedIndex(-1);
    
    // Clear selection if search term doesn't match selected order
    if (selectedSalesOrder && !value.toLowerCase().includes(selectedSalesOrder.orderNumber.toLowerCase())) {
      setSelectedSalesOrder(null);
      setReturnItems([]);
      setFormData(prev => ({ ...prev, salesOrderId: '' }));
    }
  };

  // Handle input focus - show dropdown immediately
  const handleInputFocus = () => {
    setShowDropdown(true);
    setHighlightedIndex(-1);
  };

  // Customer search handlers
  const handleCustomerSearchChange = (e) => {
    const value = e.target.value;
    setCustomerSearchTerm(value);
    setShowCustomerDropdown(true);
    setHighlightedCustomerIndex(-1);
  };

  const handleCustomerInputFocus = () => {
    setShowCustomerDropdown(true);
    setHighlightedCustomerIndex(-1);
  };

  const handleCustomerSelect = async (customer) => {
    setSelectedCustomer(customer);
    setCustomerSearchTerm(customer.name);
    setShowCustomerDropdown(false);
    setHighlightedCustomerIndex(-1);
    
    // Clear sales order selection when customer changes
    setSelectedSalesOrder(null);
    setReturnItems([]);
    setFormData(prev => ({ ...prev, salesOrderId: '' }));
    setSearchTerm('');
    
    // Reload sales orders for the selected customer
    await reloadSalesOrdersForCustomer(customer);
  };

  const handleClearCustomerSearch = async () => {
    setCustomerSearchTerm('');
    setSelectedCustomer(null);
    setShowCustomerDropdown(false);
    setHighlightedCustomerIndex(-1);
    
    // Clear sales order selection when customer is cleared
    setSelectedSalesOrder(null);
    setReturnItems([]);
    setFormData(prev => ({ ...prev, salesOrderId: '' }));
    setSearchTerm('');
    
    // Reload all sales orders
    try {
      const divisionId = selectedDivision?.id || null;
      const params = { returnCase: 'post_delivery' };
      
      console.log('Reloading all sales orders');
      const ordersRes = await returnsService.getEligibleSalesOrders(params, divisionId, showAllDivisions);
      
      if (ordersRes.success && ordersRes.data?.salesOrders) {
        console.log('Updated all sales orders:', ordersRes.data.salesOrders);
        setSalesOrders(ordersRes.data.salesOrders);
      }
    } catch (error) {
      console.error('Error reloading all sales orders:', error);
    }
  };

  // Clear search and selection
  const handleClearSearch = () => {
    setSearchTerm('');
    setSelectedSalesOrder(null);
    setReturnItems([]);
    setFormData(prev => ({ ...prev, salesOrderId: '' }));
    setShowDropdown(false);
    setHighlightedIndex(-1);
  };

  // Handle order selection from dropdown
  const handleOrderSelect = (order) => {
    setSelectedSalesOrder(order);
    setSearchTerm(`${order.orderNumber} - ${order.customer?.name || 'Unknown Customer'} - ₹${order.totalAmount}`);
    setShowDropdown(false);
    setHighlightedIndex(-1);
    
    // Initialize return items from sales order items
      const items = order.salesOrderItems.map(item => ({
        // Preserve the sales order line id so backend can identify the exact item
        salesOrderItemId: item.id,
        productId: item.productId,
        productName: item.product.name,
        originalQuantity: item.quantity,
        returnQuantity: 0,
        unit: item.unit,
        unitPrice: item.unitPrice,
        itemCondition: 'good',
        destinationType: 'warehouse'
      }));
      
      setReturnItems(items);
    setFormData(prev => ({ ...prev, salesOrderId: order.id }));
      setHasUnsavedChanges(true);
  };

  // Handle keyboard navigation for sales orders
  const handleKeyDown = (e) => {
    if (!showDropdown || filteredSalesOrders.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredSalesOrders.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredSalesOrders.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredSalesOrders.length) {
          handleOrderSelect(filteredSalesOrders[highlightedIndex]);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  // Handle keyboard navigation for customers
  const handleCustomerKeyDown = (e) => {
    if (!showCustomerDropdown || filteredCustomers.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedCustomerIndex(prev => 
          prev < filteredCustomers.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedCustomerIndex(prev => 
          prev > 0 ? prev - 1 : filteredCustomers.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedCustomerIndex >= 0 && highlightedCustomerIndex < filteredCustomers.length) {
          handleCustomerSelect(filteredCustomers[highlightedCustomerIndex]);
        }
        break;
      case 'Escape':
        setShowCustomerDropdown(false);
        setHighlightedCustomerIndex(-1);
        break;
    }
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
    
    // Clear validation errors
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }));
    }

    // Handle return type change
    if (field === 'returnType') {
      if (value === 'full' && returnItems.length > 0) {
        // Auto-select all items for full return
        const allItems = returnItems.map(item => ({
          ...item,
          returnQuantity: item.originalQuantity
        }));
        setReturnItems(allItems);
      } else if (value === 'partial') {
        // Clear selection for partial return
        setReturnItems(prev => prev.map(item => ({ ...item, returnQuantity: 0 })));
      }
    }
  };


  const handleQuantityChange = (productId, quantity) => {
    setReturnItems(prev => 
      prev.map(item => 
        item.productId === productId 
          ? { ...item, returnQuantity: parseInt(quantity) || 0 }
          : item
      )
    );
    setHasUnsavedChanges(true);
  };

  const handleConditionChange = (productId, condition) => {
    setReturnItems(prev => 
      prev.map(item => 
        item.productId === productId 
          ? { ...item, itemCondition: condition }
          : item
      )
    );
    setHasUnsavedChanges(true);
  };

  // Old image upload function removed - now using ImageUploadComponent

  const handleRemoveImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setHasUnsavedChanges(true);
  };

  // Handle images change from ImageUploadComponent
  const handleImagesChange = (base64Images) => {
    console.log('Images changed:', base64Images);
    setImages(base64Images);
    setHasUnsavedChanges(true);
    
    // Clear validation errors for images
    setValidationErrors(prev => ({ ...prev, images: '' }));
  };

  const validateForm = () => {
    const errors = {};

    if (!selectedCustomer) {
      errors.customer = 'Please select a customer';
    }

    if (!formData.salesOrderId) {
      errors.salesOrderId = 'Please select a sales order';
    }

    if (!formData.returnReason) {
      errors.returnReason = 'Please select a return reason';
    }

    if (!formData.returnType) {
      errors.returnType = 'Please select a return type';
    }

    if (!formData.refundMethod) {
      errors.refundMethod = 'Please select a refund method';
    }

    // Validate return items
    const validReturnItems = returnItems.filter(item => item.returnQuantity > 0);
    if (validReturnItems.length === 0) {
      errors.returnItems = 'Please specify return quantities for at least one item';
    }

    // Validate quantities
    validReturnItems.forEach(item => {
      if (item.returnQuantity > item.originalQuantity) {
        errors[`quantity_${item.productId}`] = `Return quantity cannot exceed original quantity (${item.originalQuantity})`;
      }
    });

    // Images are required (sent as base64)
    if (images.length === 0) {
      errors.images = 'At least one image is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setActionLoading(true);
    
    try {
      // Images are already in base64 format from ImageUploadComponent
      if (images.length > 0) {
        console.log('Submitting with', images.length, 'base64 images');
      }
      const divisionId = selectedDivision?.id || null;
      
      // Filter items with return quantity > 0
      const validReturnItems = returnItems.filter(item => item.returnQuantity > 0);
      
      // Format return items for API
      const formattedReturnItems = returnsService.formatReturnItems(validReturnItems);

      // Create return request data with images
      const returnData = {
        salesOrderId: formData.salesOrderId,
        customerId: selectedCustomer.id, // Include selected customer ID
        returnCase: 'post_delivery', // Default to post_delivery
        returnReason: formData.returnReason,
        customReason: formData.customReason,
        returnType: formData.returnType,
        refundMethod: formData.refundMethod,
        notes: formData.notes,
        returnItems: formattedReturnItems,
        images: images // Include images in the request
      };

      console.log('Creating return request with data:', returnData);

      const response = await returnsService.createReturnRequest(
        returnData,
        divisionId,
        showAllDivisions
      );
      
      console.log('API Response:', response);
      
      if (response.success || response.returnRequest || response.id) {
        console.log('Return request created successfully:', response);
        
        // Show success message
        alert('Return request created successfully!');
        
        onSuccess({
          success: true,
          message: 'Return request created successfully',
          data: response.data || response
        });
      } else {
        console.error('API returned error:', response);
        throw new Error(response.message || 'Failed to create return request');
      }
    } catch (error) {
      console.error('Error creating return request:', error);
      
      // Handle specific error types
      let errorMessage = 'Unknown error occurred';
      if (error.message.includes('413') || error.message.includes('PayloadTooLargeError')) {
        errorMessage = 'Request too large. Please reduce image sizes or try without images.';
      } else if (error.message.includes('400')) {
        errorMessage = 'Invalid request data. Please check all fields.';
      } else if (error.message.includes('401')) {
        errorMessage = 'Authentication failed. Please login again.';
      } else if (error.message.includes('500')) {
        errorMessage = 'Server error. Please try again later.';
      } else {
        errorMessage = error.message || 'Unknown error occurred';
      }
      
      alert(`Error creating return request: ${errorMessage}`);
      onSuccess({
        success: false,
        message: errorMessage
      });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <DialogRoot
      placement={"center"}
      size={"lg"}
      className={styles.mdl}
      open={true}
      onOpenChange={onClose}
      modal={true}
      closeOnInteractOutside={true}
    >
      <DialogContent className="mdl" style={{ maxHeight: '70vh', overflowY: 'auto', overflowX: 'hidden', maxWidth: '900px' }}>
        <DialogBody>
          <div className="px-3">
            <h3 className="px-3 pb-3 mdl-title">Create Return Request</h3>
          </div>
          
          {loading && (
            <div className="text-center py-4">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2">Loading data...</p>
            </div>
          )}

          {/* Removed debug info */}

          {!loading && (
            <form onSubmit={handleSubmit}>
            <div className="row">
              {/* Left column */}
              <div className="col-6">
                {/* Customer Selection - dropdown only */}
                <div className={`mb-3 inputcolumn-mdl`}>
                  <label>Select Customer *</label>
                  <select
                    className="form-select"
                    value={selectedCustomer?.id || ''}
                    onChange={handleCustomerSelectDropdown}
                    required
                    style={{ width: '70%', height: '36px' }}
                  >
                    <option value="">-- Select Customer --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>{c.name} {c.phone ? `- ${c.phone}` : ''}</option>
                    ))}
                  </select>
                  {validationErrors.customer && (
                    <div className="text-danger small mt-1">{validationErrors.customer}</div>
                  )}
                </div>

                {/* Sales Order Dropdown */}
                <div className={`mb-3 inputcolumn-mdl`}>
                  <label>Select Sales Order *</label>
                  <select
                    className="form-select"
                    value={selectedSalesOrder?.id || ''}
                    onChange={handleOrderSelectDropdown}
                    required
                    disabled={!ordersForCustomer.length}
                    style={{ width: '70%', height: '36px' }}
                  >
                    <option value="">-- Select Sales Order --</option>
                    {ordersForCustomer.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.orderNumber} - {o.customer?.name}
                      </option>
                    ))}
                  </select>
                  {validationErrors.salesOrderId && (
                    <div className="text-danger small mt-1">{validationErrors.salesOrderId}</div>
                  )}
                </div>

                {/* Return Type */}
                <div className={`mb-3 inputcolumn-mdl`}>
                  <label>Return Type *</label>
                  <select 
                    value={formData.returnType} 
                    onChange={(e) => handleFormChange('returnType', e.target.value)}
                    required
                    className="form-select"
                    style={{ width: '70%', height: '36px' }}
                  >
                    <option value="">Select Return Type</option>
                    {returnTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label} - {type.description}
                      </option>
                    ))}
                  </select>
                  {validationErrors.returnType && (
                    <div className="text-danger small mt-1">{validationErrors.returnType}</div>
                  )}
                </div>

                {/* Custom Reason */}
                <div className={`mb-3 inputcolumn-mdl`}>
                  <label>Custom Reason (Optional)</label>
                  <textarea
                    value={formData.customReason}
                    onChange={(e) => handleFormChange('customReason', e.target.value)}
                    className="form-control"
                    placeholder="Enter additional details about the return reason..."
                    rows={3}
                    style={{ width: '70%', height: '80px' }}
                  />
                </div>
              </div>

              {/* Right column */}
              <div className="col-6">
                {/* Refund Method */}
                <div className={`mb-3 inputcolumn-mdl`}>
                  <label>Refund Method *</label>
                  <select 
                    value={formData.refundMethod} 
                    onChange={(e) => handleFormChange('refundMethod', e.target.value)}
                    required
                    className="form-select"
                    style={{ width: '70%', height: '36px' }}
                  >
                    <option value="">Select refund method</option>
                    {refundMethods.map(method => (
                      <option key={method.value} value={method.value}>
                        {method.label} - {method.description}
                      </option>
                    ))}
                  </select>
                  {validationErrors.refundMethod && (
                    <div className="text-danger small mt-1">{validationErrors.refundMethod}</div>
                  )}
                </div>

                {/* Return Reason Selection */}
                <div className={`mb-3 inputcolumn-mdl`}>
                  <label>Return Reason *</label>
                  <select
                    value={formData.returnReason}
                    onChange={(e) => handleFormChange('returnReason', e.target.value)}
                    required
                    className="form-select"
                    style={{ width: '70%', height: '36px' }}
                  >
                    <option value="">Select reason</option>
                    {returnReasons.map((reason) => (
                      <option key={reason.id} value={reason.id}>
                        {reason.reasonName || reason.name}
                      </option>
                    ))}
                  </select>
                  {validationErrors.returnReason && (
                    <div className="text-danger small mt-1">{validationErrors.returnReason}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Selected Sales Order Details */}
            {selectedSalesOrder && (
              <div className={`mb-3 ${styles.dispatchForm}`}>
                <label>Order Details</label>
                <div className="card p-3 bg-light">
                  <div className="row">
                    <div className="col-md-6">
                      <strong>Order Number:</strong> {selectedSalesOrder.orderNumber}
                    </div>
                    <div className="col-md-6">
                      <strong>Customer:</strong> {selectedSalesOrder.customer?.name}
                    </div>
                    <div className="col-md-6">
                      <strong>Total Amount:</strong> ₹{selectedSalesOrder.totalAmount}
                    </div>
                    <div className="col-md-6">
                      <strong>Status:</strong> {selectedSalesOrder.orderStatus}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Return Items */}
            {selectedSalesOrder && returnItems.length > 0 && (
              <div className={`mb-3 ${styles.partialDispatchSection}`}>
                <h6 className="mb-3">
                  {formData.returnType === 'full' ? 'Items to Return (All Selected)' : 'Select Items to Return *'}
                </h6>
                
                {formData.returnType === 'full' && (
                  <div className="alert alert-info mb-3">
                    <strong>Full Return:</strong> All items from the order will be returned automatically.
                  </div>
                )}
                
                {formData.returnType === 'partial' && (
                  <div className="alert alert-warning mb-3">
                    <strong>Partial Return:</strong> Please select specific items and quantities to return.
                  </div>
                )}

                {returnItems.map((item) => (
                  <div key={item.productId} className={`mb-3 ${styles.destinationCard}`}>
                    <div className="card p-3">
                      <div className="row align-items-center">
                        <div className="col-md-6">
                          <h6 className="mb-1">{item.productName}</h6>
                          <small className="text-muted">SKU: {item.product?.SKU || 'N/A'}</small>
                          <div className="mt-1">
                            <small>Available: {item.originalQuantity} {item.unit} | Price: ₹{item.unitPrice}</small>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="row">
                            <div className="col-md-6">
                              <label className="form-label small">Return Quantity:</label>
                              <input
                                type="number"
                                min="0"
                                max={item.originalQuantity}
                                value={item.returnQuantity}
                                onChange={(e) => handleQuantityChange(item.productId, e.target.value)}
                                className="form-control form-control-sm"
                                disabled={formData.returnType === 'full'}
                              />
                              {validationErrors[`quantity_${item.productId}`] && (
                                <div className="text-danger small">{validationErrors[`quantity_${item.productId}`]}</div>
                              )}
                            </div>
                            <div className="col-md-6">
                              <label className="form-label small">Item Condition:</label>
                              <select
                                value={item.itemCondition}
                                onChange={(e) => handleConditionChange(item.productId, e.target.value)}
                                className="form-select form-select-sm"
                              >
                                <option value="good">Good Condition</option>
                                <option value="damaged">Damaged</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {validationErrors.returnItems && (
                  <div className="text-danger small">{validationErrors.returnItems}</div>
                )}
              </div>
            )}

            {/* Image Upload */}
            <div className={`mb-3 inputcolumn-mdl`}>
              <label>Upload Images *</label>
              <ImageUploadComponent
                onImagesChange={handleImagesChange}
                maxImages={3}
                maxSizeKB={100}
              />
              <small className="text-muted">
                Upload at least one image of the return items (Required). Max 3 images, 100KB each. Images will be automatically converted to base64.
              </small>
              {validationErrors.images && (
                <div className="text-danger small mt-1">{validationErrors.images}</div>
              )}
            </div>

            {/* Notes */}
            <div className={`mb-3 inputcolumn-mdl`}>
              <label>Additional Notes (Optional)</label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleFormChange('notes', e.target.value)}
                className="form-control"
                placeholder="Additional notes"
                rows={4}
                style={{ width: '70%', height: '100px' }}
              />
            </div>

            {/* Form Actions */}
            <div className="d-flex justify-content-end gap-2 py-3">
              <button
                type="button"
                className="cancelbtn"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="submitbtn"
                disabled={actionLoading}
              >
                {actionLoading ? 'Creating...' : 'Create Return Request'}
              </button>
            </div>
          </form>
          )}
        </DialogBody>
        <DialogCloseTrigger className="inputcolumn-mdl-close" asChild>
          <button onClick={onClose}>
            <i className="bi bi-x"></i>
          </button>
        </DialogCloseTrigger>
      </DialogContent>
    </DialogRoot>
  );
};

export default CreateReturnRequestNew;
