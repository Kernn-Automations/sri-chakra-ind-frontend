// Error handling utility for the Returns System

export const handleApiError = (error) => {
  console.error('API Error:', error);
  
  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;
    
    switch (status) {
      case 400:
        return {
          type: 'validation',
          message: data.message || 'Invalid data provided',
          details: data.errors || null
        };
      case 401:
        return {
          type: 'authentication',
          message: 'Unauthorized: Please log in again',
          action: 'redirect_login'
        };
      case 403:
        return {
          type: 'authorization',
          message: 'Forbidden: You do not have permission to perform this action',
          action: 'show_permission_error'
        };
      case 404:
        return {
          type: 'not_found',
          message: 'Resource not found',
          action: 'show_not_found'
        };
      case 422:
        return {
          type: 'validation',
          message: data.message || 'Validation failed',
          details: data.errors || null
        };
      case 500:
        return {
          type: 'server',
          message: 'Server Error: Please try again later',
          action: 'retry_later'
        };
      default:
        return {
          type: 'unknown',
          message: `Error ${status}: ${data.message || 'Unknown error occurred'}`,
          action: 'show_generic_error'
        };
    }
  } else if (error.request) {
    // Network error
    return {
      type: 'network',
      message: 'Network Error: Please check your internet connection',
      action: 'check_connection'
    };
  } else {
    // Other error
    return {
      type: 'client',
      message: error.message || 'An unexpected error occurred',
      action: 'show_generic_error'
    };
  }
};

export const showErrorNotification = (error, options = {}) => {
  const {
    title = 'Error',
    showDetails = false,
    onRetry = null,
    onDismiss = null
  } = options;

  const errorInfo = handleApiError(error);
  
  // Create error notification element
  const notification = document.createElement('div');
  notification.className = 'alert alert-danger alert-dismissible fade show position-fixed';
  notification.style.cssText = `
    top: 20px;
    right: 20px;
    z-index: 9999;
    max-width: 400px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  `;
  
  notification.innerHTML = `
    <div class="d-flex align-items-start">
      <i class="bi bi-exclamation-triangle-fill me-2 mt-1"></i>
      <div class="flex-grow-1">
        <strong>${title}</strong>
        <div class="mt-1">${errorInfo.message}</div>
        ${showDetails && errorInfo.details ? `
          <details class="mt-2">
            <summary class="small">Show Details</summary>
            <pre class="small mt-1">${JSON.stringify(errorInfo.details, null, 2)}</pre>
          </details>
        ` : ''}
        ${onRetry ? `
          <div class="mt-2">
            <button class="btn btn-sm btn-outline-danger" onclick="this.closest('.alert').remove(); ${onRetry}()">
              Retry
            </button>
          </div>
        ` : ''}
      </div>
      <button type="button" class="btn-close" onclick="this.closest('.alert').remove()"></button>
    </div>
  `;
  
  document.body.appendChild(notification);
  
  // Auto-remove after 10 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove();
    }
  }, 10000);
  
  return notification;
};

export const showSuccessNotification = (message, options = {}) => {
  const {
    title = 'Success',
    duration = 5000
  } = options;
  
  const notification = document.createElement('div');
  notification.className = 'alert alert-success alert-dismissible fade show position-fixed';
  notification.style.cssText = `
    top: 20px;
    right: 20px;
    z-index: 9999;
    max-width: 400px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  `;
  
  notification.innerHTML = `
    <div class="d-flex align-items-start">
      <i class="bi bi-check-circle-fill me-2 mt-1"></i>
      <div class="flex-grow-1">
        <strong>${title}</strong>
        <div class="mt-1">${message}</div>
      </div>
      <button type="button" class="btn-close" onclick="this.closest('.alert').remove()"></button>
    </div>
  `;
  
  document.body.appendChild(notification);
  
  // Auto-remove after specified duration
  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove();
    }
  }, duration);
  
  return notification;
};

export const validateReturnRequest = (formData, returnItems, images) => {
  const errors = {};
  
  // Required fields validation
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
  
  // Return items validation
  const validReturnItems = returnItems.filter(item => item.returnQuantity > 0);
  if (validReturnItems.length === 0) {
    errors.returnItems = 'Please specify return quantities for at least one item';
  }
  
  // Quantity validation
  validReturnItems.forEach(item => {
    if (item.returnQuantity > item.originalQuantity) {
      errors[`quantity_${item.productId}`] = 
        `Return quantity cannot exceed original quantity (${item.originalQuantity})`;
    }
    
    if (item.returnQuantity <= 0) {
      errors[`quantity_${item.productId}`] = 'Return quantity must be greater than 0';
    }
  });
  
  // Image validation
  if (images.length > 10) {
    errors.images = 'Maximum 10 images allowed';
  }
  
  images.forEach((image, index) => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    
    if (!allowedTypes.includes(image.type)) {
      errors[`image_${index}`] = 'Only JPEG, JPG, PNG, GIF, and WEBP images are allowed';
    }
    
    if (image.size > maxSize) {
      errors[`image_${index}`] = 'Each image must be less than 5MB';
    }
  });
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const formatCurrency = (amount, currency = 'INR') => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency
  }).format(amount);
};

export const formatDate = (dateString, options = {}) => {
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  
  return new Date(dateString).toLocaleDateString('en-IN', { ...defaultOptions, ...options });
};

export const getStatusColor = (status) => {
  const statusColors = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger',
    processing: 'info',
    completed: 'success',
    failed: 'danger'
  };
  
  return statusColors[status] || 'secondary';
};

export const getStatusIcon = (status) => {
  const statusIcons = {
    pending: 'bi-clock',
    approved: 'bi-check-circle',
    rejected: 'bi-x-circle',
    processing: 'bi-arrow-clockwise',
    completed: 'bi-check-circle-fill',
    failed: 'bi-exclamation-triangle'
  };
  
  return statusIcons[status] || 'bi-question-circle';
};

// Retry mechanism for failed API calls
export const retryApiCall = async (apiCall, maxRetries = 3, delay = 1000) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
  
  throw lastError;
};

// Debounce function for search inputs
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Throttle function for scroll events
export const throttle = (func, limit) => {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

export default {
  handleApiError,
  showErrorNotification,
  showSuccessNotification,
  validateReturnRequest,
  formatCurrency,
  formatDate,
  getStatusColor,
  getStatusIcon,
  retryApiCall,
  debounce,
  throttle
};
