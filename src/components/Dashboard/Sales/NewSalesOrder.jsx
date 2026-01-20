import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
//import axios from "axios";
import { useNavigate } from "react-router-dom";
import ApiService from "../../../services/apiService";
import { useAuth } from "@/Auth";
import { useDivision } from "../../context/DivisionContext";
import MapPicker from "./MapPicker";
import customerStyles from "../Customers/Customer.module.css";
import CustomSearchDropdown from "@/utils/CustomSearchDropDown";



// API URLs
const ApiUrls = {
  createCart: "/cart",
  updateCart: "/cart/update",
  removeFromCart: "/cart/remove",
  getCart: "/cart",
  validate_drops: "/drops/validate",
  getProducts: "/warehouse/:id/inventory",
  finalizeOrder: "/sales-orders/",
  get_review_details: "/cart/review",
  submitPayment: "/sales-orders/:id/payment",
  get_customers_sales_executive: "/customers",
  get_customer_details: "/customers",
};


// Utils
const debounce = (func, wait) => {
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

const fillUrl = (url, replacements) =>
  Object.entries(replacements || {}).reduce(
    (acc, [key, val]) => acc.replace(`:${key}`, val),
    url
  );

// Application-consistent Styles
const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
    backgroundColor: '#fff',
    overflowY: 'auto',
    maxHeight: 'calc(100vh - 100px)'
  },
  title: {
    fontSize: '18px',
    fontWeight: '600',
    marginBottom: '20px',
    color: '#555',
    textAlign: 'left',
    textDecoration: 'underline',
    textDecorationStyle: 'solid'
  },
  stepIndicator: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: '20px',
    padding: '15px',
    backgroundColor: 'white',
    borderRadius: '5px',
    border: '1px solid #d9d9d9',
    boxShadow: '1px 1px 3px #333',
    gap: '12px',
    flexWrap: 'wrap'
  },
  stepItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '600',
    transition: 'all 0.2s ease'
  },
  stepItemActive: {
    backgroundColor: 'var(--primary-color)',
    color: 'white'
  },
  stepItemCompleted: {
    backgroundColor: '#28a745',
    color: 'white'
  },
  stepItemPending: {
    backgroundColor: '#f8f9fa',
    color: '#6c757d',
    border: '1px solid #dee2e6'
  },
  stepNumber: {
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '10px',
    fontWeight: 'bold'
  },
  stepConnector: {
    width: '30px',
    height: '1px',
    backgroundColor: '#dee2e6',
    display: 'none'
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    alignItems: 'flex-start',
    width: '100%'
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#555',
    marginBottom: '8px',
    textDecoration: 'underline',
    textDecorationStyle: 'solid'
  },
  sectionSubtitle: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '15px'
  },
  card: {
    border: '1px solid #d9d9d9',
    borderRadius: '5px',
    padding: '15px',
    width: '100%',
    backgroundColor: '#ffffff',
    boxShadow: '1px 1px 3px #333',
    transition: 'all 0.2s ease'
  },
  validCard: {
    backgroundColor: 'rgba(40, 167, 69, 0.1)',
    borderColor: '#28a745'
  },
  invalidCard: {
    backgroundColor: 'rgba(220, 53, 69, 0.1)',
    borderColor: '#dc3545'
  },
  input: {
    width: '100%',
    padding: '8px',
    border: '1px solid #d9d9d9',
    borderRadius: '4px',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s',
    backgroundColor: '#ffffff',
    fontFamily: 'inherit',
    boxShadow: '1px 1px 3px #333'
  },
  inputFocus: {
    borderColor: 'var(--primary-color)'
  },
  select: {
    width: '100%',
    padding: '8px',
    border: '1px solid #d9d9d9',
    borderRadius: '4px',
    fontSize: '14px',
    outline: 'none',
    backgroundColor: '#ffffff',
    cursor: 'pointer',
    transition: 'border-color 0.2s',
    fontFamily: 'inherit',
    boxShadow: '1px 1px 3px #333'
  },
  button: {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    outline: 'none',
    fontFamily: 'inherit',
    minWidth: '80px'
  },
  buttonPrimary: {
    backgroundColor: 'var(--primary-color)',
    color: 'white'
  },
  buttonPrimaryHover: {
    backgroundColor: '#002654'
  },
  buttonSecondary: {
    backgroundColor: '#6c757d',
    color: 'white'
  },
  buttonSuccess: {
    backgroundColor: '#28a745',
    color: 'white'
  },
  buttonDanger: {
    backgroundColor: '#dc3545',
    color: 'white'
  },
  buttonDisabled: {
    backgroundColor: '#e9ecef',
    color: '#6c757d',
    cursor: 'not-allowed'
  },
  flexRow: {
    display: 'flex',
    flexDirection: 'row',
    gap: '12px',
    alignItems: 'center',
    flexWrap: 'wrap'
  },
  flexColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  divider: {
    height: '1px',
    backgroundColor: '#dee2e6',
    margin: '15px 0',
    border: 'none'
  },
  loader: {
    width: '40px',
    height: '40px',
    border: '4px solid #f3f4f6',
    borderTop: '4px solid var(--primary-color)',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '20px auto'
  },
  toast: {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    padding: '12px 20px',
    borderRadius: '4px',
    color: 'white',
    fontWeight: '500',
    zIndex: 1000,
    minWidth: '250px',
    fontSize: '14px'
  },
  toastSuccess: {
    backgroundColor: '#28a745'
  },
  toastError: {
    backgroundColor: '#dc3545'
  },
  toastWarning: {
    backgroundColor: '#ffc107',
    color: '#212529'
  },
  toastInfo: {
    backgroundColor: '#17a2b8'
  },
  radioGroup: {
    display: 'flex',
    gap: '15px',
    flexWrap: 'wrap'
  },
  radioItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    borderRadius: '4px',
    border: '1px solid #d9d9d9',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    backgroundColor: 'white',
    boxShadow: '1px 1px 3px #333'
  },
  radioItemSelected: {
    borderColor: 'var(--primary-color)',
    backgroundColor: 'rgba(0, 49, 118, 0.1)'
  },
  radio: {
    width: '16px',
    height: '16px'
  },
  productCard: {
    border: '1px solid #d9d9d9',
    borderRadius: '5px',
    padding: '15px',
    width: '100%',
    backgroundColor: '#ffffff',
    transition: 'all 0.2s ease',
    boxShadow: '1px 1px 3px #333'
  },
  productTitle: {
    fontWeight: '600',
    fontSize: '16px',
    marginBottom: '10px',
    color: '#555'
  },
  productInfo: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '6px',
    display: 'flex',
    justifyContent: 'space-between'
  },
  productActions: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    marginTop: '15px',
    flexWrap: 'wrap'
  },
  productQuantityBadge: {
    backgroundColor: 'var(--primary-color)',
    color: 'white',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '600'
  },
  tabs: {
    display: 'flex',
    borderBottom: '2px solid #dee2e6',
    marginBottom: '15px'
  },
  tab: {
    padding: '10px 20px',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    borderBottom: '2px solid transparent',
    transition: 'all 0.2s ease'
  },
  tabActive: {
    borderBottom: '2px solid var(--primary-color)',
    color: 'var(--primary-color)'
  },
  fileInput: {
    display: 'none'
  },
  fileButton: {
    display: 'inline-block',
    padding: '8px 16px',
    backgroundColor: '#f8f9fa',
    border: '1px solid #d9d9d9',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    color: '#495057'
  },
  fileButtonHover: {
    borderColor: 'var(--primary-color)',
    backgroundColor: 'rgba(0, 49, 118, 0.05)'
  },
  previewImage: {
    width: '90px',
    height: '90px',
    objectFit: 'contain',
    border: '1px solid #d9d9d9',
    borderRadius: '4px',
    backgroundColor: '#f8f9fa'
  },
  errorText: {
    color: '#dc3545',
    fontSize: '14px',
    marginTop: '8px',
    fontWeight: '500'
  },
  successText: {
    color: '#28a745',
    fontSize: '14px',
    fontWeight: '500'
  },
  iconButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '8px',
    borderRadius: '4px',
    color: '#6c757d',
    transition: 'all 0.2s ease'
  },
  iconButtonHover: {
    backgroundColor: '#f8f9fa',
    color: '#dc3545'
  },
  totalsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    fontSize: '14px'
  },
  totalsFinal: {
    fontWeight: '600',
    fontSize: '16px',
    color: '#555',
    borderTop: '1px solid #dee2e6',
    paddingTop: '12px'
  },
  navigationButtons: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'space-between',
    marginTop: '20px',
    padding: '15px',
    backgroundColor: 'white',
    borderRadius: '5px',
    border: '1px solid #d9d9d9',
    boxShadow: '1px 1px 3px #333'
  },
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '24px',
    minWidth: '400px',
    maxWidth: '500px',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
    animation: 'modalSlideIn 0.3s ease-out'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    paddingBottom: '12px',
    borderBottom: '1px solid #e2e8f0'
  },
  modalTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#2d3748',
    margin: 0
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#718096',
    padding: '4px',
    borderRadius: '4px',
    transition: 'all 0.2s ease'
  },
  modalBody: {
    marginBottom: '24px'
  },
  quantityInput: {
    width: '100%',
    padding: '12px',
    border: '2px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '16px',
    textAlign: 'center',
    fontWeight: '600',
    outline: 'none',
    transition: 'border-color 0.2s'
  },
  modalFooter: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end'
  },
  productLoadingSpinner: {
    width: '20px',
    height: '20px',
    border: '2px solid #f3f4f6',
    borderTop: '2px solid #fff',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginRight: '8px'
  }
};

// CSS keyframes and responsive styles
const keyframes = `
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes modalSlideIn {
  0% { 
    opacity: 0; 
    transform: translateY(-20px) scale(0.95); 
  }
  100% { 
    opacity: 1; 
    transform: translateY(0) scale(1); 
  }
}

/* Responsive Design */
@media (max-width: 768px) {
  .step-indicator {
    flex-direction: column !important;
    gap: 8px !important;
  }
  
  .product-grid {
    grid-template-columns: 1fr !important;
  }
  
  .product-card-with-cart {
    flex-direction: column !important;
  }
  
  .cart-details-section {
    flex: 1 !important;
    margin-top: 16px !important;
  }
}
  
  .review-grid {
    grid-template-columns: 1fr !important;
  }
  
  .payment-grid {
    grid-template-columns: 1fr !important;
  }
  
  .navigation-buttons {
    flex-direction: column !important;
    gap: 12px !important;
  }
  
  .cart-summary {
    flex-direction: column !important;
    text-align: center !important;
  }
  
  .tabs {
    flex-direction: column !important;
  }
}

@media (max-width: 480px) {
  .container {
    padding: 16px !important;
  }
  
  .title {
    font-size: 2rem !important;
  }
  
  .section-title {
    font-size: 1.5rem !important;
  }
  
  .card {
    padding: 16px !important;
  }
}
`;

// === Global Components (outside to prevent focus loss on re-render) ===

const Loader = () => (
    <div style={styles.loader}></div>
);

const StepIndicator = ({ step, setStep, selectedCustomer, customerDetails, cartItems, cartId, selectedWarehouseType, dropOffs, reviewData }) => {
    const steps = [
        { title: 'Customer', description: 'Select customer' },
        { title: 'Products', description: 'Add products to cart' },
        { title: 'Logistics', description: 'Delivery details' },
        { title: 'Overview', description: 'Review order details' },
        { title: 'Payment', description: 'Payment information' }
    ];

    return (
        <div style={styles.stepIndicator} className="step-indicator">
            {steps.map((stepItem, index) => {
                let stepStyle = { ...styles.stepItem };

                if (index < step) {
                    stepStyle = { ...stepStyle, ...styles.stepItemCompleted };
                } else if (index === step) {
                    stepStyle = { ...stepStyle, ...styles.stepItemActive };
                } else {
                    stepStyle = { ...stepStyle, ...styles.stepItemPending };
                }

                return (
                    <div
                        key={index}
                        style={{
                            ...stepStyle,
                            cursor: index < step ? 'pointer' : 'default',
                            transition: 'all 0.2s ease'
                        }}
                        onClick={() => {
                            // Only allow navigation to completed steps (green ones)
                            if (index < step) {
                                console.log(`Navigating from step ${step} to step ${index}`);
                                setStep(index);
                            }
                        }}
                        onMouseEnter={(e) => {
                            if (index < step) {
                                e.target.style.transform = 'scale(1.05)';
                                e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (index < step) {
                                e.target.style.transform = 'scale(1)';
                                e.target.style.boxShadow = '';
                            }
                        }}
                        title={index < step ? `Click to go back to ${stepItem.title}` : ''}
                    >
                        <div style={styles.stepNumber}>
                            {index < step ? '✓' : index + 1}
                        </div>
                        <div>
                            <div style={{ fontWeight: '600', fontSize: '12px' }}>{stepItem.title}</div>
                            <div style={{ fontSize: '10px', opacity: 0.8 }}>{stepItem.description}</div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

const Button = ({ children, onClick, disabled, variant = 'primary', type = 'button', style = {}, ...props }) => {
    let buttonStyle = { ...styles.button };

    if (disabled) {
        buttonStyle = { ...buttonStyle, ...styles.buttonDisabled };
    } else {
        switch (variant) {
            case 'primary':
                buttonStyle = { ...buttonStyle, ...styles.buttonPrimary };
                break;
            case 'secondary':
                buttonStyle = { ...buttonStyle, ...styles.buttonSecondary };
                break;
            case 'success':
                buttonStyle = { ...buttonStyle, ...styles.buttonSuccess };
                break;
            case 'danger':
                buttonStyle = { ...buttonStyle, ...styles.buttonDanger };
                break;
            default:
                buttonStyle = { ...buttonStyle, ...styles.buttonPrimary };
        }
    }

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            style={{ ...buttonStyle, ...style }}
            onMouseEnter={(e) => {
                if (!disabled && variant === 'primary') {
                    e.target.style.backgroundColor = styles.buttonPrimaryHover.backgroundColor;
                }
            }}
            onMouseLeave={(e) => {
                if (!disabled && variant === 'primary') {
                    e.target.style.backgroundColor = styles.buttonPrimary.backgroundColor;
                }
            }}
            {...props}
        >
            {children}
        </button>
    );
};

const Input = ({ type = 'text', value, onChange, placeholder, disabled, style = {}, ...props }) => {
    return (
        <input
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            style={{ ...styles.input, ...style }}
            autoComplete="off"
            spellCheck="false"
            {...props}
        />
    );
};

const Select = ({ value, onChange, children, disabled, style = {}, ...props }) => (
    <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        style={{ ...styles.select, ...style }}
        {...props}
    >
        {children}
    </select>
);

const Card = ({ children, variant, style = {} }) => {
    let cardStyle = { ...styles.card };
    if (variant === 'valid') {
        cardStyle = { ...cardStyle, ...styles.validCard };
    } else if (variant === 'invalid') {
        cardStyle = { ...cardStyle, ...styles.invalidCard };
    }
    return <div style={{ ...cardStyle, ...style }}>{children}</div>;
};

const QuantityModal = ({ 
    showQuantityModal, 
    selectedProductForQty, 
    setShowQuantityModal, 
    setSelectedProductForQty, 
    setInputQuantity, 
    inputQuantity, 
    handleQuantityConfirm 
}) => {
    if (!showQuantityModal || !selectedProductForQty) return null;

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000
            }}
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    setShowQuantityModal(false);
                    setSelectedProductForQty(null);
                    setInputQuantity('');
                }
            }}
        >
            <div
                style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    padding: '24px',
                    width: '400px',
                    maxWidth: '90vw',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: '#2d3748' }}>
                        Add to Cart
                    </h3>

                    <div style={{ marginBottom: '12px' }}>
                        <strong style={{ color: '#2d3748' }}>Product Name:</strong>
                        <div style={{ color: '#4a5568', marginTop: '4px' }}>
                            {selectedProductForQty.name}
                        </div>
                    </div>

                    <div style={{ marginBottom: '12px' }}>
                        <strong style={{ color: '#2d3748' }}>Available:</strong>
                        <div style={{ color: '#4a5568', marginTop: '4px' }}>
                            {selectedProductForQty.quantity || selectedProductForQty.stockQuantity || selectedProductForQty.stock || 0} {selectedProductForQty.productType === "packed" ? "packs" : selectedProductForQty.unit}
                        </div>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <strong style={{ color: '#2d3748' }}>Price:</strong>
                        <div style={{ color: '#4a5568', marginTop: '4px' }}>
                            ₹{(selectedProductForQty.basePrice || 0).toLocaleString('en-IN')} per {selectedProductForQty.productType === "packed" ? "pack" : selectedProductForQty.unit}
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#2d3748' }}>
                            Quantity to Add
                        </label>
                        <input
                            type="number"
                            min="1"
                            value={inputQuantity}
                            placeholder="Enter quantity"
                            onChange={(e) => setInputQuantity(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px',
                                border: '2px solid #e2e8f0',
                                borderRadius: '8px',
                                fontSize: '16px',
                                outline: 'none'
                            }}
                            autoFocus
                        />
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button
                        onClick={() => {
                            setShowQuantityModal(false);
                            setSelectedProductForQty(null);
                            setInputQuantity('');
                        }}
                        style={{
                            padding: '6px 12px',
                            border: '1px solid #e2e8f0',
                            borderRadius: '4px',
                            backgroundColor: 'white',
                            color: '#4a5568',
                            cursor: 'pointer',
                            fontSize: '14px'
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleQuantityConfirm}
                        disabled={!inputQuantity || parseInt(inputQuantity) <= 0}
                        style={{
                            padding: '6px 12px',
                            border: 'none',
                            borderRadius: '4px',
                            backgroundColor: !inputQuantity || parseInt(inputQuantity) <= 0 ? '#e2e8f0' : '#003176',
                            color: !inputQuantity || parseInt(inputQuantity) <= 0 ? '#a0aec0' : 'white',
                            cursor: !inputQuantity || parseInt(inputQuantity) <= 0 ? 'not-allowed' : 'pointer',
                            fontSize: '14px'
                        }}
                    >
                        Add to Cart
                    </button>
                </div>
            </div>
        </div>
    );
};

export default function SalesOrderWizard() {
  const navigate = useNavigate();
  const { axiosAPI } = useAuth();
  const { selectedDivision } = useDivision();
  
  // Sync division context to localStorage for API calls
  useEffect(() => {
    if (selectedDivision) {
      // Handle "All Divisions" case properly
      let divisionId;
      let isAllDivisions = false;
      
      if (selectedDivision.id === "all" || selectedDivision.isAllDivisions) {
        divisionId = "1"; // Backend expects "1" for all divisions
        isAllDivisions = true;
      } else {
        divisionId = String(selectedDivision.id);
      }
      
      localStorage.setItem('currentDivisionId', divisionId);
      localStorage.setItem('currentDivisionName', selectedDivision.name);
      localStorage.setItem('isAllDivisions', isAllDivisions ? 'true' : 'false');
      
      console.log('Sales Order - Division context synced:', { 
        divisionId, 
        name: selectedDivision.name,
        originalId: selectedDivision.id,
        isAllDivisions,
        selectedDivisionIsAllDivisions: selectedDivision.isAllDivisions
      });
    } else {
      console.log('Sales Order - No division selected yet');
    }
  }, [selectedDivision]);

  // Mock API service - replace with your actual implementation


  // Toast state
  const [toast, setToast] = useState(null);

  function showToast({ title, status = "info", duration = 4000 }) {
    setToast({ message: title, severity: status });
    setTimeout(() => setToast(null), duration);
  }

  // Mobile state
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Step state
  // Step 0: Customer, Step 1: Products, Step 2: Logistics, Step 3: Overview, Step 4: Payment
  const [step, setStep] = useState(0);

  // Step 1: Customer select
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerDetails, setCustomerDetails] = useState(null);
  const [customerLoading, setCustomerLoading] = useState(false);

  // Step 2: Products + Cart
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [cartId, setCartId] = useState(null);
  const [cartItems, setCartItems] = useState({});
  const [warehouseOptions, setWarehouseOptions] = useState([]);
  const [dropOffLimit, setDropOffLimit] = useState(1);
  const [cartTotal, setCartTotal] = useState(0);
  const [cartLoading, setCartLoading] = useState(false);
  const [selectedProductForQty, setSelectedProductForQty] = useState(null);
  const [inputQuantity, setInputQuantity] = useState('');
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [loadingProductIds, setLoadingProductIds] = useState(new Set());

  // Step 2: Delivery Details and Drop-off Locations
  const [selectedDeliveryWarehouse, setSelectedDeliveryWarehouse] = useState("local");
  const [deliveryDropOffs, setDeliveryDropOffs] = useState([
    {
      order: 1,
      receiverName: "",
      receiverMobile: "",
      plot: "",
      street: "",
      area: "",
      city: "",
      pincode: "",
    }
  ]);

  // Step 3: Logistics
  const [selectedWarehouseType, setSelectedWarehouseType] = useState("");
  const [dropCount, setDropCount] = useState(1);
  const [dropOffs, setDropOffs] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);

  // Price calculation useEffect removed to prevent glitching
  const [isDropValid, setIsDropValid] = useState([]);
  const [dropValidationErrors, setDropValidationErrors] = useState([]);
  const [dropDistances, setDropDistances] = useState([]);
  const [distanceSummary, setDistanceSummary] = useState(null);
  const [logisticsLoading, setLogisticsLoading] = useState(false);

  // Step 4: Review
  const [reviewData, setReviewData] = useState(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  // Track edited grandTotal values for each item (item index or productId -> editedGrandTotal)
  const [editedGrandTotals, setEditedGrandTotals] = useState({});
  // Store original values for each item
  const [originalItemValues, setOriginalItemValues] = useState({});

  // Function to calculate order totals via backend
  const calculateOrderTotals = useCallback(debounce(async (updatedItems) => {
    try {
      const payload = {
        customerId: selectedCustomer,
        cartItems: updatedItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unit: item.unit,
          grandTotal: editedGrandTotals[item.productId || item.id] !== undefined 
            ? parseFloat(editedGrandTotals[item.productId || item.id]) 
            : undefined
        }))
      };

      const res = await axiosAPI.post('/sales-orders/calculate', payload);
      
      if (res.data.success) {
        setReviewData(prev => ({
          ...prev,
          totals: res.data.data.orderSummary,
          items: res.data.data.items // Update items if backend returns them with calculated taxes etc.
        }));
      }
    } catch (error) {
      console.error("Error calculating totals:", error);
      showToast({
        title: "Error calculating totals",
        status: "error",
        duration: 3000
      });
    }
  }, 500), [selectedCustomer, editedGrandTotals]); // Dependencies for debounce

  // Effect to trigger calculation when edits change
  useEffect(() => {
    if (reviewData?.items) {
      calculateOrderTotals(reviewData.items);
    }
  }, [editedGrandTotals, calculateOrderTotals]);


  // Step 2: Payment
  const [mobileNumber, setMobileNumber] = useState("");
  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const [payments, setPayments] = useState([
    {
      transactionDate: getTodayDate(),
      paymentMethod: "cash", // "cash" or "bank"
      paymentMode: "", // "UPI", "Card", or "Bank Transfer" (only when paymentMethod is "bank")
      amount: "",
      reference: "",
      remark: "",
      utrNumber: "", // UTR number for bank payments
      proofFile: null,
      proofPreviewUrl: null,
    },
  ]);
  const [paymentUploading, setPaymentUploading] = useState(false);
  const [activePaymentTab, setActivePaymentTab] = useState(0);

  // Debug step changes and data preservation
  useEffect(() => {
    console.log(`🔴 [STEP] Step changed to: ${step}`);
    console.log('🔴 [STEP] Data preservation check:', {
      selectedCustomer,
      customerDetails: !!customerDetails,
      cartItems: Object.keys(cartItems).length,
      cartId,
      selectedWarehouseType,
      dropOffs: dropOffs.length,
      reviewData: !!reviewData,
      payments: payments.length,
      deliveryDropOffs: deliveryDropOffs.length,
      selectedDeliveryWarehouse
    });
  }, [step, selectedCustomer, customerDetails, cartItems, cartId, selectedWarehouseType, dropOffs, reviewData, payments, deliveryDropOffs, selectedDeliveryWarehouse]);
  
  // Auto-initialize drop-offs when entering logistics step
  useEffect(() => {
    if (step === 2 && dropOffs.length === 0 && Object.keys(cartItems).length > 0 && dropOffLimit > 0) {
      const cartItemsArray = Object.values(cartItems);
      const initialDropOff = {
        order: 1,
        receiverName: "",
        receiverMobile: "",
        plot: "",
        street: "",
        area: "",
        city: "",
        pincode: "",
        latitude: 17.3850, // Hyderabad default
        longitude: 78.4867,
        items: cartItemsArray.map(item => ({
          productId: item.productId,
          productName: item.name || item.productName,
          quantity: item.quantity,
          unit: item.unit,
          productType: item.productType,
          packageWeight: item.packageWeight,
          packageWeightUnit: item.packageWeightUnit,
        })),
      };
      
      setDropOffs([initialDropOff]);
      setDropCount(1);
      setIsDropValid([false]);
      setDropValidationErrors([null]);
      console.log('🟢 [LOGISTICS] Auto-initialized drop-off with products:', initialDropOff);
    }
  }, [step, cartItems, dropOffLimit]);

  // Debug deliveryDropOffs changes
  useEffect(() => {
    console.log('🟠 [STATE] deliveryDropOffs state changed:', JSON.parse(JSON.stringify(deliveryDropOffs)));
    console.log('🟠 [STATE] deliveryDropOffs length:', deliveryDropOffs.length);
  }, [deliveryDropOffs]);
  
  // Debug selectedDeliveryWarehouse changes
  useEffect(() => {
    console.log('🟠 [STATE] selectedDeliveryWarehouse changed:', selectedDeliveryWarehouse);
  }, [selectedDeliveryWarehouse]);

  // === Step 1: Customer Load & Select ===
  useEffect(() => {
    // Wait for division context to be available
    if (!selectedDivision) {
      console.log('Sales Order - Waiting for division context...');
      return;
    }
    
    async function loadCustomers() {
      try {
        setCustomerLoading(true);
        
        // Add division context parameters
        let customersUrl = ApiUrls.get_customers_sales_executive;
        const currentDivisionId = localStorage.getItem('currentDivisionId');
        const isAllDivisions = localStorage.getItem('isAllDivisions') === 'true';
        
        console.log('Sales Order - Loading customers with division context:', {
          selectedDivision,
          currentDivisionId,
          isAllDivisions,
          userRoles: JSON.parse(localStorage.getItem('user') || '{}')?.roles,
          accessToken: localStorage.getItem('accessToken') ? 'present' : 'missing',
          refreshToken: localStorage.getItem('refreshToken') ? 'present' : 'missing'
        });
        
        if (isAllDivisions) {
          customersUrl += `?showAllDivisions=true`;
        } else if (currentDivisionId) {
          customersUrl += `?divisionId=${currentDivisionId}`;
        }
        
        console.log('Customers URL with division params:', customersUrl);
        const res = await axiosAPI.get(customersUrl);
        console.log("Customers:", res);
        setCustomers(res.data.customers || []);
      } catch (e) {
        console.error('Sales Order - Failed to load customers:', e);
        console.error('Sales Order - Error details:', {
          status: e.response?.status,
          statusText: e.response?.statusText,
          data: e.response?.data,
          message: e.message
        });
        
        let errorMessage = "Failed to load customers";
        if (e.response?.status === 403) {
          errorMessage = "Access denied. You don't have permission to view customers in this division.";
        } else if (e.response?.status === 401) {
          errorMessage = "Authentication failed. Please login again.";
        } else if (e.response?.data?.message) {
          errorMessage = e.response.data.message;
        }
        
        showToast({
          title: errorMessage,
          status: "error",
          duration: 4000,
        });
      } finally {
        setCustomerLoading(false);
      }
    }
    loadCustomers();
  }, [selectedDivision]);

  // When selectedCustomer changes, fetch full details and products
  useEffect(() => {
    if (!selectedCustomer) return;
    console.log("Selected customer:", selectedCustomer);
    async function fetchCustomerDetails() {
      try {
        setCustomerLoading(true);
        
        // Add division context parameters
        let customerUrl = `${ApiUrls.get_customer_details}/${selectedCustomer}`;
        const currentDivisionId = localStorage.getItem('currentDivisionId');
        if (currentDivisionId && currentDivisionId !== '1') {
          customerUrl += `?divisionId=${currentDivisionId}`;
        } else if (currentDivisionId === '1') {
          customerUrl += `?showAllDivisions=true`;
        }
        
        console.log('Customer details URL with division params:', customerUrl);
        const res = await axiosAPI.get(customerUrl);
        console.log("Customer details:", res);
        // Data is nested under res.data.data.customer and products under res.data.data.productsAndDiscounting.products
        const customerData = res.data?.customer || null;
        const productList = res.data?.productsAndDiscounting?.products || [];
        console.log(customerData, productList);
        setCustomerDetails(customerData);
        setProducts(productList); // Set products here from customer details API response
        setSelectedWarehouseType("");
      } catch (e) {
        showToast({
          title: "Failed to load customer details",
          status: "error",
          duration: 4000,
        });
      } finally {
        setCustomerLoading(false);
      }
    }
    fetchCustomerDetails();
  }, [selectedCustomer]);

  // === Step 2: Load Products based on customer's warehouse, initialize cart ===
  // Note: Products are now loaded from customer details API response in the customer step
  // This useEffect is removed to prevent unnecessary API calls in customer step

  // Show quantity modal for product
  function showQuantityModalForProduct(product) {
    setSelectedProductForQty(product);
    setInputQuantity('');
    setShowQuantityModal(true);
  }

  // Tax calculation removed - using cart API response data instead

  // Add or Update cart item (step 2)
  async function addOrUpdateCart(product, quantity) {
    if (!customerDetails) return;
    const isNewCart = !cartId;
    let apiUrl = isNewCart ? ApiUrls.createCart : ApiUrls.updateCart;
    
    // Add division context parameters
    const currentDivisionId = localStorage.getItem('currentDivisionId');
    if (currentDivisionId && currentDivisionId !== '1') {
      apiUrl += `?divisionId=${currentDivisionId}`;
    } else if (currentDivisionId === '1') {
      apiUrl += `?showAllDivisions=true`;
    }
    
    // Add product to loading set
    setLoadingProductIds(prev => new Set(prev).add(product.id));
    
    try {
      console.log('Cart API URL with division params:', apiUrl);
      console.log(customerDetails)
      setCartLoading(true);
      const payload = {
        cartId: cartId || null,
        customerId: customerDetails.customer_id,
        // Allow adding even when product is out of stock; backend may ignore if unsupported
        allowOutOfStock: true,
        allowBackorder: true,
        cartItems: [{ 
          productId: product.id, 
          quantity, 
          unit: product.unit,
          allowOutOfStock: true,
          allowBackorder: true
        }],
      };
      const res = await axiosAPI.post(apiUrl, payload);
      console.log('Full API response:', res)
      if (isNewCart) setCartId(res.data.cart.id);
      
      const itemsMap = {};
      const priceBreakupByProduct = {};
      // Map priceBreakup array by productId for quick attachment to items
      if (Array.isArray(res?.data?.priceBreakup)) {
        res.data.priceBreakup.forEach((pb) => {
          const pid = Number(pb.productId);
          if (!priceBreakupByProduct[pid]) priceBreakupByProduct[pid] = [];
          priceBreakupByProduct[pid].push(pb);
        });
      }

      res.data.cart.items.forEach((it) => {
        console.log('Individual cart item:', it);
        const pid = Number(it.productId);
        const priceBreakup = priceBreakupByProduct[pid]?.[0];
        
        // Extract base amount - check multiple sources (priceBreakup.amount is base, totalCost might include tax)
        const baseAmount = it.baseAmount || it.basePrice || priceBreakup?.amount || (it.price * it.quantity) || 0;
        
        // Extract total amount - check multiple sources
        const totalAmount = it.totalAmount || it.total || priceBreakup?.totalAmount || (priceBreakup?.totalCost && priceBreakup?.taxAmount ? priceBreakup.totalCost + priceBreakup.taxAmount : null) || (it.price * it.quantity) || 0;
        
        // Extract tax amount - try multiple sources and calculate if needed
        let taxAmount = 0;
        if (it.taxAmount !== undefined && it.taxAmount !== null) {
          taxAmount = it.taxAmount;
        } else if (it.tax !== undefined && it.tax !== null) {
          taxAmount = it.tax;
        } else if (priceBreakup?.taxAmount !== undefined && priceBreakup?.taxAmount !== null) {
          taxAmount = priceBreakup.taxAmount;
        } else if (priceBreakup?.tax !== undefined && priceBreakup?.tax !== null) {
          taxAmount = priceBreakup.tax;
        } else if (totalAmount > 0 && baseAmount > 0 && totalAmount > baseAmount) {
          // Calculate tax as difference between total and base (only if total > base)
          taxAmount = totalAmount - baseAmount;
        }
        
        itemsMap[pid] = {
          ...it,
          productId: pid,
          totalPrice: it.price * it.quantity,
          // Include tax information if available in cart response
          cartTaxAmount: taxAmount,
          cartBaseAmount: baseAmount,
          cartTotalAmount: totalAmount,
          // Attach priceBreakup from header response for UI
          priceBreakup: priceBreakupByProduct[pid] || undefined,
        };
      });
      console.log('Final cart items map:', itemsMap);
      setCartItems(itemsMap);
      setDropOffLimit(res.data.logistics?.maxDropOffs || 1);
      setWarehouseOptions(res.data.logistics?.warehouseOptions || []);
      setCartTotal(res.data.totals?.cartTotalAmount || 0);
      
      // Tax amounts should be included in cart API response
      
      showToast({
        title: `Added ${quantity} ${product.productType === "packed" ? "packs" : product.unit} of ${product.name} to cart`,
        status: "success",
        duration: 2000,
      });
    } catch (e) {
      showToast({
        title: "Failed to update cart",
        status: "error",
        duration: 4000,
      });
    } finally {
      setCartLoading(false);
      // Remove product from loading set
      setLoadingProductIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(product.id);
        return newSet;
      });
    }
  }

  // Handle quantity modal confirmation
  function handleQuantityConfirm() {
    const qty = parseInt(inputQuantity) || 0;
    if (selectedProductForQty && qty > 0) {
      const currentInCart = cartItems[selectedProductForQty.id]?.quantity || 0;
      addOrUpdateCart(selectedProductForQty, currentInCart + qty);
      setShowQuantityModal(false);
      setSelectedProductForQty(null);
      setInputQuantity('');
    }
  }

  // Remove item from cart
  async function removeFromCart(productId) {
    if (!cartId) return;
    try {
      setCartLoading(true);
      
      // Add division context parameters
      let removeUrl = ApiUrls.removeFromCart;
      const currentDivisionId = localStorage.getItem('currentDivisionId');
      if (currentDivisionId && currentDivisionId !== '1') {
        removeUrl += `?divisionId=${currentDivisionId}`;
      } else if (currentDivisionId === '1') {
        removeUrl += `?showAllDivisions=true`;
      }
      
      console.log('Remove from cart URL with division params:', removeUrl);
      // Prefer removing by cart item id if backend expects it
      const existingItem = cartItems?.[productId];
      const cartItemId = existingItem?.id;
      const payload = cartItemId 
        ? { cartId, customerId: customerDetails?.customer_id, cartItemId } 
        : { cartId, customerId: customerDetails?.customer_id, productId: Number(productId) };
      console.log('Remove from cart payload:', payload);
      const res = await axiosAPI.post(removeUrl, payload);
      
      const itemsMap = {};
      const priceBreakupByProduct = {};
      if (Array.isArray(res?.data?.priceBreakup)) {
        res.data.priceBreakup.forEach((pb) => {
          const pid = Number(pb.productId);
          if (!priceBreakupByProduct[pid]) priceBreakupByProduct[pid] = [];
          priceBreakupByProduct[pid].push(pb);
        });
      }
      res.data.cart.items.forEach((it) => {
        const pid = Number(it.productId);
        const priceBreakup = priceBreakupByProduct[pid]?.[0];
        
        // Extract base amount - check multiple sources (priceBreakup.amount is base, totalCost might include tax)
        const baseAmount = it.baseAmount || it.basePrice || priceBreakup?.amount || (it.price * it.quantity) || 0;
        
        // Extract total amount - check multiple sources
        const totalAmount = it.totalAmount || it.total || priceBreakup?.totalAmount || (priceBreakup?.totalCost && priceBreakup?.taxAmount ? priceBreakup.totalCost + priceBreakup.taxAmount : null) || (it.price * it.quantity) || 0;
        
        // Extract tax amount - try multiple sources and calculate if needed
        let taxAmount = 0;
        if (it.taxAmount !== undefined && it.taxAmount !== null) {
          taxAmount = it.taxAmount;
        } else if (it.tax !== undefined && it.tax !== null) {
          taxAmount = it.tax;
        } else if (priceBreakup?.taxAmount !== undefined && priceBreakup?.taxAmount !== null) {
          taxAmount = priceBreakup.taxAmount;
        } else if (priceBreakup?.tax !== undefined && priceBreakup?.tax !== null) {
          taxAmount = priceBreakup.tax;
        } else if (totalAmount > 0 && baseAmount > 0 && totalAmount > baseAmount) {
          // Calculate tax as difference between total and base (only if total > base)
          taxAmount = totalAmount - baseAmount;
        }
        
        itemsMap[pid] = {
          ...it,
          productId: pid,
          totalPrice: it.price * it.quantity,
          // Include tax information if available in cart response
          cartTaxAmount: taxAmount,
          cartBaseAmount: baseAmount,
          cartTotalAmount: totalAmount,
          priceBreakup: priceBreakupByProduct[pid] || undefined,
        };
      });
      setCartItems(itemsMap);
      setCartTotal(res.data.totals?.cartTotalAmount || 0);
      
      // Tax amounts should be included in cart API response
    } catch (e) {
      console.error('Remove from cart failed:', e?.response?.data || e.message);
      // Fallback: try updateCart with quantity = 0 to remove the product
      try {
        let updateUrl = ApiUrls.updateCart;
        const currentDivisionId = localStorage.getItem('currentDivisionId');
        if (currentDivisionId && currentDivisionId !== '1') {
          updateUrl += `?divisionId=${currentDivisionId}`;
        } else if (currentDivisionId === '1') {
          updateUrl += `?showAllDivisions=true`;
        }
        const existingItem = cartItems?.[productId];
        const unit = existingItem?.unit || 'kg';
        const fallbackPayload = {
          cartId,
          customerId: customerDetails?.customer_id,
          cartItems: [
            {
              productId: Number(productId),
              quantity: 0,
              unit,
            },
          ],
        };
        console.log('Fallback remove via updateCart payload:', fallbackPayload);
        const res = await axiosAPI.post(updateUrl, fallbackPayload);

        const itemsMap = {};
        const priceBreakupByProduct = {};
        if (Array.isArray(res?.data?.priceBreakup)) {
          res.data.priceBreakup.forEach((pb) => {
            const pid = Number(pb.productId);
            if (!priceBreakupByProduct[pid]) priceBreakupByProduct[pid] = [];
            priceBreakupByProduct[pid].push(pb);
          });
        }
        res.data.cart.items.forEach((it) => {
          const pid = Number(it.productId);
          const priceBreakup = priceBreakupByProduct[pid]?.[0];
          
          // Extract base amount
          const baseAmount = it.baseAmount || it.basePrice || (it.price * it.quantity) || 0;
          
          // Extract total amount
          const totalAmount = it.totalAmount || it.total || priceBreakup?.totalAmount || priceBreakup?.totalCost || (it.price * it.quantity) || 0;
          
          // Extract tax amount - try multiple sources and calculate if needed
          let taxAmount = 0;
          if (it.taxAmount !== undefined && it.taxAmount !== null) {
            taxAmount = it.taxAmount;
          } else if (it.tax !== undefined && it.tax !== null) {
            taxAmount = it.tax;
          } else if (priceBreakup?.taxAmount !== undefined && priceBreakup?.taxAmount !== null) {
            taxAmount = priceBreakup.taxAmount;
          } else if (priceBreakup?.tax !== undefined && priceBreakup?.tax !== null) {
            taxAmount = priceBreakup.tax;
          } else if (totalAmount > 0 && baseAmount > 0) {
            // Calculate tax as difference between total and base
            taxAmount = totalAmount - baseAmount;
          }
          
          itemsMap[pid] = {
            ...it,
            productId: pid,
            totalPrice: it.price * it.quantity,
            cartTaxAmount: taxAmount,
            cartBaseAmount: baseAmount,
            cartTotalAmount: totalAmount,
            priceBreakup: priceBreakupByProduct[pid] || undefined,
          };
        });
        setCartItems(itemsMap);
        setCartTotal(res.data.totals?.cartTotalAmount || 0);
        return;
      } catch (fallbackErr) {
        console.error('Fallback remove via updateCart failed:', fallbackErr?.response?.data || fallbackErr.message);
      }
      showToast({
        title: "Failed to remove item",
        status: "error",
        duration: 4000,
      });
    } finally {
      setCartLoading(false);
    }
  }

  // Confirm step 0 (Products) to go to step 1 (Overview)
  function confirmProductsStep() {
    if (Object.keys(cartItems).length === 0) {
      showToast({
        title: "Add at least one product",
        status: "warning",
        duration: 3000,
      });
      return;
    }
    
    // Initialize drop-offs with products from cart
    const cartItemsArray = Object.values(cartItems);
    const initialDropOff = {
      order: 1,
      receiverName: "",
      receiverMobile: "",
      plot: "",
      street: "",
      area: "",
      city: "",
      pincode: "",
      latitude: 17.3850, // Hyderabad default
      longitude: 78.4867,
      items: cartItemsArray.map(item => ({
        productId: item.productId,
        productName: item.name || item.productName,
        quantity: item.quantity,
        unit: item.unit,
        productType: item.productType,
        packageWeight: item.packageWeight,
        packageWeightUnit: item.packageWeightUnit,
      })),
    };
    
    setDropOffs([initialDropOff]);
    setDropCount(1);
    setIsDropValid([false]);
    setDropValidationErrors([null]);
    
    // Initialize delivery details
    setSelectedDeliveryWarehouse("local");
    setDeliveryDropOffs([
      {
        order: 1,
        receiverName: "",
        receiverMobile: "",
        plot: "",
        street: "",
        area: "",
        city: "",
        pincode: "",
      }
    ]);
    
    setStep(2);
  }

  // Handle delivery drop-off field changes
  const handleDeliveryDropOffChange = useCallback((index, field, value) => {
    console.log('🔵 [DELIVERY] handleDeliveryDropOffChange called:', { index, field, value, timestamp: new Date().toISOString() });
    
    setDeliveryDropOffs((prev) => {
      console.log('🔵 [DELIVERY] setDeliveryDropOffs callback - prev state:', JSON.parse(JSON.stringify(prev)));
      const updated = [...prev];
      if (updated[index]) {
        const oldValue = updated[index][field];
        updated[index] = { ...updated[index], [field]: value };
        console.log('🔵 [DELIVERY] Updated existing drop-off:', { index, field, oldValue, newValue: value });
      } else {
        // If index doesn't exist, create it
        updated[index] = {
          order: index + 1,
          receiverName: "",
          receiverMobile: "",
          plot: "",
          street: "",
          area: "",
          city: "",
          pincode: "",
          [field]: value
        };
        console.log('🔵 [DELIVERY] Created new drop-off:', { index, field, value });
      }
      console.log('🔵 [DELIVERY] Returning updated state:', JSON.parse(JSON.stringify(updated)));
      return updated;
    });
  }, []); // Empty deps - callback should be stable

  // Confirm step 2 (Delivery Details) to go to step 3 (Logistics)
  function confirmDeliveryDetailsStep() {
    // Validate required fields
    if (!selectedDeliveryWarehouse) {
      showToast({
        title: "Please select a warehouse",
        status: "warning",
        duration: 3000,
      });
      return;
    }

    const dropOff = deliveryDropOffs[0];
    if (!dropOff.receiverName || !dropOff.receiverMobile || !dropOff.pincode) {
      showToast({
        title: "Please fill in all required drop-off fields",
        status: "warning",
        duration: 3000,
      });
      return;
    }

    // Pass delivery details to logistics step
    setSelectedWarehouseType(selectedDeliveryWarehouse);
    setDropCount(1);
    setDropOffs([
      {
        ...dropOff,
        items: Object.entries(cartItems).map(([pid, item]) => ({
          productId: pid,
          productName: item.name,
          quantity: item.quantity,
          unit: item.unit,
          productType: item.productType,
          packageWeight: item.packageWeight,
          packageWeightUnit: item.packageWeightUnit,
        })),
      },
    ]);
    setIsDropValid([false]);
    setDropValidationErrors([null]);
    setDistanceSummary(null);
    setStep(3);
  }

  // === Step 3: Logistics Step ===
  function updateDropOff(index, newData) {
    console.log('updateDropOff called:', { index, newData });
    setDropOffs((old) => {
      const updated = old.map((d, i) => (i === index ? { ...d, ...newData } : d));
      console.log('Updated dropOffs:', updated);
      return updated;
    });
  }

  // Handle drop-off field changes - exactly like CreateCustomer handleChange
  const handleDropOffChange = useCallback((index, field, value) => {
    setDropOffs((prev) => {
      const updated = [...prev];
      if (updated[index]) {
        updated[index] = { ...updated[index], [field]: value };
      }
      return updated;
    });
  }, []);

  function updateDropItemQuantity(dropIndex, productId, quantity) {
    setDropOffs((old) => {
      const newDrops = [...old];
      const items = newDrops[dropIndex].items || [];
      const foundIndex = items.findIndex((i) => i.productId === productId);
      if (foundIndex !== -1) {
        items[foundIndex].quantity = quantity;
        newDrops[dropIndex].items = items;
      }
      return newDrops;
    });
  }

  async function validateDropOff(index) {
    const drop = dropOffs[index];
    const filteredCoords = dropOffs
      .filter(
        (d) =>
          d.latitude !== undefined &&
          d.longitude !== undefined &&
          d.latitude !== null &&
          d.longitude !== null
      )
      .map(({ order, latitude, longitude }) => ({ order, latitude, longitude }));
    try {
      console.log(customerDetails);
      setLogisticsLoading(true);
      const res = await axiosAPI.post(ApiUrls.validate_drops, {
        customerId: customerDetails.customer_id,
        dropOffs: filteredCoords,
        warehouseType: selectedWarehouseType,
      });
      if (res.data.valid) {
        setIsDropValid((old) => {
          const newArr = [...old];
          newArr[index] = true;
          return newArr;
        });
        setDropValidationErrors((old) => {
          const newArr = [...old];
          newArr[index] = null;
          return newArr;
        });
        console.log(res);
        setDropDistances(res.data.distances || []);
        setDistanceSummary(res.data.distanceSummary);
      } else {
        setIsDropValid((old) => {
          const newArr = [...old];
          newArr[index] = false;
          return newArr;
        });
        setDropValidationErrors((old) => {
          const newArr = [...old];
          newArr[index] = res.data.message ?? "Invalid drop-off";
          return newArr;
        });
        setDropDistances([]);
        setDistanceSummary(null);
      }
    } catch (e) {
      console.error("Drop-off validation error:", e);
      let errorMessage = "Failed to validate drop-off";
      
      if (e.response?.status === 403) {
        errorMessage = "You don't have permission to validate drop-offs. Please contact your administrator.";
      } else if (e.response?.status === 401) {
        errorMessage = "Authentication failed. Please login again.";
      } else if (e.response?.status === 404) {
        errorMessage = "Drop-off validation service not found.";
      } else if (e.response?.status >= 500) {
        errorMessage = "Server error occurred. Please try again later.";
      } else if (e.response?.data?.message) {
        errorMessage = e.response.data.message;
      } else if (e.message) {
        errorMessage = `Validation failed: ${e.message}`;
      }
      
      showToast({
        title: errorMessage,
        status: "error",
        duration: 4000,
      });
      
      // Set as invalid so user can't proceed without proper validation
      setIsDropValid((old) => {
        const newArr = [...old];
        newArr[index] = false;
        return newArr;
      });
      setDropValidationErrors((old) => {
        const newArr = [...old];
        newArr[index] = e.response?.status === 403 ? "Validation failed due to permission error" : errorMessage;
        return newArr;
      });
    } finally {
      setLogisticsLoading(false);
    }
  }

  function confirmLogisticsStep() {
    if (!selectedWarehouseType) {
      showToast({
        title: "Select warehouse type",
        status: "warning",
        duration: 3000,
      });
      return;
    }
    if (!isDropValid.every(Boolean)) {
      showToast({
        title: "Validate all dropoffs",
        status: "warning",
        duration: 3000,
      });
      return;
    }
    if (
      dropOffs.some(
        (d) =>
          !d.items ||
          d.items.length === 0 ||
          d.items.some((item) => Number(item.quantity) <= 0)
      )
    ) {
      showToast({
        title: "Assign products to dropoffs with quantities",
        status: "warning",
        duration: 3000,
      });
      return;
    }
    setStep(3);
    fetchReviewData();
  }

  async function fetchReviewData() {
    if (!cartId) return;
    try {
      setReviewLoading(true);
      const res = await axiosAPI.get(
        `${ApiUrls.get_review_details}/${cartId}?warehouseType=${selectedWarehouseType}`
      );
      // Use backend response data directly - it includes orderSummary with correct totals
      const responseData = res.data;
      
      // Ensure totals come from backend's orderSummary
      if (responseData.orderSummary || responseData.summary) {
        const backendSummary = responseData.orderSummary || responseData.summary;
        responseData.totals = {
          subtotal: backendSummary.subtotal || backendSummary.baseAmount || 0,
          tax: backendSummary.tax || backendSummary.taxAmount || 0,
          grandTotal: backendSummary.grandTotal || backendSummary.total || backendSummary.totalAmount || 0,
          discountAmount: backendSummary.discountAmount || 0,
          freightCharges: backendSummary.freightCharges || 0,
          ...backendSummary
        };
      }
      
      setReviewData(responseData);
      
      // Store original values for each item
      if (responseData && responseData.items) {
        const originalValues = {};
        responseData.items.forEach((item, index) => {
          const itemKey = item.productId || index;
          originalValues[itemKey] = {
            basePrice: item.basePrice || item.baseAmount || 0,
            taxAmount: item.taxAmount || 0,
            totalAmount: item.totalAmount || 0,
            originalTotal: item.totalAmount || 0, // Original total (base + tax)
          };
        });
        setOriginalItemValues(originalValues);
        // Clear any edited values when fetching new review data
        setEditedGrandTotals({});
      }
    } catch (e) {
      showToast({
        title: "Failed to fetch review data",
        status: "error",
        duration: 4000,
      });
    } finally {
      setReviewLoading(false);
    }
  }

  // === Step 4: Review ===
  async function finalizeOrder() {
    if (!reviewData) return;
    try {
      setReviewLoading(true);
      
      // Add division context parameters
      let finalizeUrl = ApiUrls.finalizeOrder;
      const currentDivisionId = localStorage.getItem('currentDivisionId');
      if (currentDivisionId && currentDivisionId !== '1') {
        finalizeUrl += `?divisionId=${currentDivisionId}`;
      } else if (currentDivisionId === '1') {
        finalizeUrl += `?showAllDivisions=true`;
      }
      
      // Map items from reviewData and include grandTotal if edited
      const cartItemsPayload = (reviewData.items || []).map((item, index) => {
        const itemKey = item.productId || index;
        const editedGrandTotal = editedGrandTotals[itemKey];
        
        const itemPayload = {
          productId: item.productId,
          quantity: item.quantity,
          unit: item.unit,
        };
        
        // Include grandTotal only if user edited it
        if (editedGrandTotal !== undefined && editedGrandTotal !== null) {
          itemPayload.grandTotal = editedGrandTotal;
          console.log(`Including grandTotal for product ${item.productId}:`, editedGrandTotal);
        } else {
          console.log(`No grandTotal for product ${item.productId} (not edited)`);
        }
        
        return itemPayload;
      });
      
      console.log("Cart items payload with grandTotals:", cartItemsPayload);

      // Final validation before submission
      for (const item of reviewData.items || []) {
        const itemKey = item.productId || reviewData.items.indexOf(item);
        const editedTotal = editedGrandTotals[itemKey];
        const original = (originalItemValues[itemKey]?.originalTotal || 0);
        
        if (editedTotal !== undefined && editedTotal !== null && editedTotal < original) {
          showToast({
            title: `Price for ${item.productName} (₹${editedTotal}) is less than original (₹${original}). Updates must be greater than or equal to original price.`,
            status: "error",
            duration: 5000
          });
          setReviewLoading(false);
          return;
        }
      }
      
      const payload = {
        customerId: customerDetails.customer_id,
        cartItems: cartItemsPayload,
        selectedWarehouseType,
        dropOffs,
        paymentMethod: payments.length > 0 ? (payments[0].paymentMethod === "bank" ? payments[0].paymentMode : payments[0].paymentMethod) : "cash",
      };
      
      console.log("Finalize order payload:", payload);
      console.log("Finalize order URL:", finalizeUrl);
      
      const res = await axiosAPI.post(finalizeUrl, payload);
      console.log("Finalize order response:", res);
      console.log("Finalize order response data:", res.data);
      
      if (res.status === 201) {
        // Update reviewData with the order information from the response
        // The API might return the order in different formats, so check all possibilities
        const orderData = res.data.order || res.data;
        // Order ID can be alphanumeric (e.g., "SO-20251206-000446")
        const orderId = orderData?.id || res.data.orderId || res.data.id || res.data.orderNumber;
        const orderNumber = orderData?.orderNumber || res.data.orderNumber || orderId;
        
        console.log("Extracted orderId (alphanumeric):", orderId);
        console.log("Extracted orderNumber:", orderNumber);
        console.log("Full orderData:", orderData);
        
        // Validate that orderId exists (can be numeric or alphanumeric)
        if (!orderId) {
          console.error("Failed to extract order ID from response. Response data:", res.data);
          showToast({
            title: "Failed to get order ID from response. Please try again.",
            status: "error",
            duration: 4000,
          });
          return;
        }
        
        // Use backend response data directly - backend has processed edited amounts
        const backendOrderSummary = res.data.orderSummary || res.data.summary || res.data.totals || {};
        const responseItems = res.data.items || res.data.order?.items || [];
        
        console.log("Backend orderSummary:", backendOrderSummary);
        console.log("Backend items:", responseItems);
        
        // Update reviewData with backend response - backend has already processed edited amounts
        setReviewData(prevData => ({
          ...prevData,
          // Use backend items - they have updated basePrice and totalAmount reflecting edited grandTotal
          items: responseItems.length > 0 ? responseItems : prevData?.items || [],
          orderId: String(orderId), // Alphanumeric ID for API calls (e.g., "SO-20251206-000446")
          orderNumber: orderNumber, // Order number for display
          paymentId: res.data.paymentId,
          totalAmount: backendOrderSummary.grandTotal || res.data.totalAmount || backendOrderSummary.total,
          upiId: res.data.upiId,
          bankDetails: res.data.bankDetails,
          // Use backend's orderSummary/totals - this includes edited amounts processed by backend
          totals: {
            subtotal: backendOrderSummary.subtotal || backendOrderSummary.baseAmount || 0,
            tax: backendOrderSummary.tax || backendOrderSummary.taxAmount || 0,
            grandTotal: backendOrderSummary.grandTotal || backendOrderSummary.total || backendOrderSummary.totalAmount || 0,
            discountAmount: backendOrderSummary.discountAmount || 0,
            freightCharges: backendOrderSummary.freightCharges || 0,
            ...backendOrderSummary
          }
        }));
        
        // Update originalItemValues with backend response items (they have updated values)
        if (responseItems.length > 0) {
          const updatedOriginalValues = {};
          responseItems.forEach((item, index) => {
            const itemKey = item.productId || index;
            updatedOriginalValues[itemKey] = {
              basePrice: item.basePrice || item.baseAmount || 0,
              taxAmount: item.taxAmount || 0,
              totalAmount: item.totalAmount || 0,
              originalTotal: item.totalAmount || 0, // This is now the updated total from backend
            };
          });
          setOriginalItemValues(updatedOriginalValues);
        }
        
        // Don't clear editedGrandTotals - keep them for display
        // They will be cleared when new review data is fetched
        
        showToast({
          title: "Order finalized. Proceed to payment.",
          status: "success",
          duration: 3000,
        });
        setStep(4);
      } else {
        showToast({
          title: "Failed to finalize order",
          status: "error",
          duration: 4000,
        });
      }
    } catch (e) {
      console.error("Finalize order error:", e);
      console.error("Error response:", e.response?.data);
      
      let errorMessage = "Error finalizing order";
      if (e.response?.data?.message) {
        errorMessage = e.response.data.message;
      } else if (e.response?.data?.error) {
        errorMessage = e.response.data.error;
      } else if (e.response?.status === 400) {
        errorMessage = "Invalid data sent to server. Please check all fields.";
      }
      
      showToast({
        title: errorMessage,
        status: "error",
        duration: 4000,
      });
    } finally {
      setReviewLoading(false);
    }
  }

  // === Step 5: Payment ===
  function addPayment() {
    setPayments((old) => [
      ...old,
      {
        transactionDate: getTodayDate(),
        paymentMethod: "cash",
        paymentMode: "",
        amount: "",
        reference: "",
        remark: "",
        utrNumber: "",
        proofFile: null,
        proofPreviewUrl: null,
      },
    ]);
  }

  function removePayment(index) {
    if (payments.length === 1) return;
    setPayments((old) => old.filter((_, i) => i !== index));
  }

  function updatePaymentField(index, field, value) {
    setPayments((old) => {
      const arr = [...old];
      arr[index] = { ...arr[index], [field]: value };
      return arr;
    });
  }

  function handleFileChange(index, file) {
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    updatePaymentField(index, "proofFile", file);
    updatePaymentField(index, "proofPreviewUrl", previewUrl);
  }

  function validatePayments() {
    for (let i = 0; i < payments.length; i++) {
      const p = payments[i];
      if (!p.amount || parseFloat(p.amount) <= 0) {
        showToast({ title: `Enter valid amount for payment #${i + 1}`, status: "error", duration: 3000 });
        return false;
      }
      if (!p.transactionDate) {
        showToast({ title: `Select date for payment #${i + 1}`, status: "error", duration: 3000 });
        return false;
      }
    }
    return true;
  }

  async function submitPayments() {
    // Prevent multiple simultaneous submissions
    if (paymentUploading) {
      console.log("Payment submission already in progress, ignoring duplicate click");
      return;
    }
    
    if (!validatePayments()) {
      return;
    }
    
    setPaymentUploading(true);

    const payload = new FormData();
    
    // Build payments payload - only include fields that have values
    const paymentsPayload = payments.map((p) => {
      const paymentObj = {
        transactionDate: p.transactionDate || getTodayDate(),
        paymentMethod: p.paymentMethod || "cash",
        amount: parseFloat(p.amount) || 0,
        status: 1, // Payment status: 1 = completed (0 is invalid, so we use 1 for submitted payments)
      };
      
      // Only add optional fields if they have values
      if (p.paymentMethod === "bank" && p.paymentMode) {
        paymentObj.paymentMode = p.paymentMode;
      }
      if (p.reference && p.reference.trim()) {
        paymentObj.reference = p.reference.trim();
      }
      if (p.remark && p.remark.trim()) {
        paymentObj.remark = p.remark.trim();
      }
      if (p.utrNumber && p.utrNumber.trim()) {
        paymentObj.utrNumber = p.utrNumber.trim();
      }
      
      return paymentObj;
    });
    
    payload.append("payments", JSON.stringify(paymentsPayload));
    
    // Use orderNumber for payload (backend may need it)
    const orderNumberForPayload = reviewData?.orderNumber || reviewData?.orderId;
    if (orderNumberForPayload) {
      payload.append("orderId", String(orderNumberForPayload));
    }
    
    if (reviewData?.paymentId) {
      payload.append("paymentId", String(reviewData.paymentId));
    }
    
    if (mobileNumber && mobileNumber.trim()) {
      payload.append("mobileNumber", mobileNumber.trim());
    }

    payments.forEach((p, idx) => {
      if (p.proofFile) {
        payload.append(`paymentProofs[${idx}]`, p.proofFile);
      }
    });
    
    // Log payload contents for debugging
    console.log("Payment payload details:", {
      paymentsPayload,
      orderId: reviewData?.orderId,
      orderNumber: reviewData?.orderNumber,
      orderNumberForPayload,
      paymentId: reviewData?.paymentId,
      mobileNumber,
      proofFilesCount: payments.filter(p => p.proofFile).length
    });

    try {
      // Backend expects orderNumber (string format like "SO-20251206-000447") in the URL
      const orderNumber = reviewData?.orderNumber || reviewData?.orderId;
      
      if (!orderNumber) {
        showToast({
          title: "Order number not found. Please go back and complete the review step.",
          status: "error",
          duration: 4000,
        });
        setPaymentUploading(false);
        return;
      }
      
      // Use orderNumber (alphanumeric string) in the URL
      const orderNumberString = String(orderNumber);
      
      const url = fillUrl(ApiUrls.submitPayment, { id: orderNumberString });
      console.log("Payment submission details:", {
        url,
        orderNumber: orderNumberString,
        orderId: reviewData?.orderId,
        paymentsPayload,
        payloadKeys: Array.from(payload.keys())
      });
      
      const res = await axiosAPI.post(url, payload, {
        headers: { "Content-Type": "multipart/form-Type" },
      });
      
      console.log("Payment submission response:", res);
      
      if (res.status === 200 || res.status === 201) {
        showToast({
          title: "Payment submitted successfully",
          status: "success",
          duration: 3000,
        });
        setStep(0);
      } else {
        showToast({
          title: "Failed to submit payment",
          status: "error",
          duration: 4000,
        });
      }
    } catch (e) {
      console.error("Payment submission error:", e);
      console.error("Error response:", e.response?.data);
      console.error("Error status:", e.response?.status);
      
      let errorMessage = "Error submitting payment";
      
      if (e.response?.status === 400) {
        errorMessage = e.response?.data?.message || "Bad request. Please check payment details and try again.";
        console.error("400 Bad Request details:", {
          message: e.response?.data?.message,
          errors: e.response?.data?.errors,
          data: e.response?.data
        });
      } else if (e.response?.status === 401) {
        errorMessage = "Authentication failed. Please login again.";
      } else if (e.response?.status === 403) {
        errorMessage = "You don't have permission to submit payments.";
      } else if (e.response?.status === 404) {
        errorMessage = "Order not found. Please go back and complete the review step again.";
      } else if (e.response?.data?.message) {
        errorMessage = e.response.data.message;
      } else if (e.message) {
        errorMessage = `Payment submission failed: ${e.message}`;
      }
      
      showToast({
        title: errorMessage,
        status: "error",
        duration: 5000,
      });
    } finally {
      setPaymentUploading(false);
    }
  }




  // Step 1: Customer Selection
  function renderCustomerStep() {
    if (customerLoading) return <Loader />;
    
    return (
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Select Customer</h2>
        
        <div style={{ marginBottom: '20px' }}>
          <div className="row m-0 p-3">
            <div className="customer-filter-wrapper" style={{ width: '100%', maxWidth: '600px' }}>
              <CustomSearchDropdown
                label="Customers"
                onSelect={(customerId) => {
                  setSelectedCustomer(customerId);
                }}
                options={customers?.map((c) => ({ value: c.id, label: c.name }))}
                showSelectAll={false}
              />
            </div>
          </div>
          <style>{`
            .customer-filter-wrapper .formcontent {
              max-width: 600px !important;
              width: 100% !important;
              display: flex !important;
              align-items: center !important;
              gap: 15px !important;
            }
            .customer-filter-wrapper .formcontent label {
              width: auto !important;
              min-width: 120px !important;
              margin-bottom: 0 !important;
              flex-shrink: 0 !important;
            }
            .customer-filter-wrapper .formcontent input {
              width: 100% !important;
              max-width: 500px !important;
              min-width: 400px !important;
              flex: 1 !important;
            }
            .customer-filter-wrapper .formcontent ul {
              width: 500px !important;
              max-width: 500px !important;
              left: 135px !important;
              top: 40px !important;
            }
          `}</style>
        </div>

        {customerDetails && (
          <Card>
            <div style={{ marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: '0', fontWeight: '600', fontSize: '16px', color: '#555' }}>
                  Customer Details
                </h3>
                <p style={{ margin: '4px 0 0 0', color: '#666', fontSize: '12px' }}>Review customer information</p>
              </div>
            </div>
            
            <div style={styles.flexColumn}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #dee2e6' }}>
                <span style={{ fontWeight: '600', color: 'var(--primary-color)', fontSize: '14px' }}>Name:</span>
                <span style={{ color: '#555', fontSize: '14px' }}>{customerDetails.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #dee2e6' }}>
                <span style={{ fontWeight: '600', color: 'var(--primary-color)', fontSize: '14px' }}>Phone:</span>
                <span style={{ color: '#555', fontSize: '14px' }}>{customerDetails.mobile}</span>
              </div>
              
              {customerDetails.salesExecutive && (
                <div style={{ marginTop: '15px', padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
                  <h4 style={{ margin: '0 0 10px 0', fontWeight: '600', color: '#555', fontSize: '14px' }}>
                    Sales Executive
                  </h4>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                    <span style={{ fontWeight: '600', color: 'var(--primary-color)', fontSize: '12px' }}>Name:</span>
                    <span style={{ color: '#555', fontSize: '12px' }}>{customerDetails.salesExecutive.name}</span>
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

        <Button
          variant="primary"
          disabled={!selectedCustomer}
          onClick={() => setStep(1)}
          style={{ marginTop: '15px' }}
        >
          Continue to Products →
        </Button>
      </div>
    );
  }

  // Step 0: Products + Cart (with customer selection)
  function renderProductStep() {
    const cartItemsCount = Object.keys(cartItems).length;
    const totalCartValue = Object.values(cartItems).reduce((sum, item) => sum + (item.totalPrice || 0), 0);

    return (
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Add Products</h2>
        <p style={styles.sectionSubtitle}>Select products for this order</p>
        
        {/* Cart Summary */}
        {cartItemsCount > 0 && (
          <Card style={{ backgroundColor: 'rgba(0, 49, 118, 0.1)', borderColor: 'var(--primary-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: '0', fontWeight: '600', color: 'var(--primary-color)', fontSize: '16px' }}>Cart Summary</h3>
                <p style={{ margin: '4px 0 0 0', color: '#666', fontSize: '12px' }}>
                  {cartItemsCount} item{cartItemsCount !== 1 ? 's' : ''} selected
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '18px', fontWeight: '600', color: 'var(--primary-color)' }}>
                  ₹{totalCartValue.toLocaleString('en-IN')}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>Total Value</div>
              </div>
            </div>
          </Card>
        )}

        {productsLoading ? (
          <Loader />
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }} className="product-grid">
              {products.map((product) => {
                const inCart = cartItems[product.id]?.quantity || 0;
                const isInCart = inCart > 0;
                
                return (
                  <Card 
                    key={product.id}
                    style={{ 
                      ...styles.productCard,
                      ...(isInCart ? { borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.02)' } : {}),
                      position: 'relative',
                      display: 'flex',
                      gap: '16px'
                    }}
                    className={isInCart ? "product-card-with-cart" : ""}
                  >
                    {/* Left side - Product Info */}
                    <div style={{ flex: isInCart ? '1' : '1', minWidth: '300px' }}>
                      <div style={styles.productTitle}>{product.name}</div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                        <div style={styles.productInfo}>
                          <span style={{ fontWeight: '600' }}>SKU:</span>
                          <span>{product.sku || product.SKU || "N/A"}</span>
                        </div>
                        <div style={styles.productInfo}>
                          <span style={{ fontWeight: '600' }}>Stock:</span>
                          <span style={{ color: (product.quantity || product.stockQuantity || product.stock || 0) > 10 ? '#28a745' : (product.quantity || product.stockQuantity || product.stock || 0) > 0 ? '#ffc107' : '#dc3545' }}>
                            {(product.quantity || product.stockQuantity || product.stock || 0) <= 0 ? 'Out of Stock' : (product.quantity || product.stockQuantity || product.stock || 0)}
                          </span>
                        </div>
                        <div style={styles.productInfo}>
                          <span style={{ fontWeight: '600' }}>Unit:</span>
                          <span>{product.productType === "packed" ? "packs" : (product.unit === "packet" ? "packs" : product.unit) || "unit"}</span>
                        </div>
                        <div style={styles.productInfo}>
                          <span style={{ fontWeight: '600' }}>Price:</span>
                          <span style={{ color: 'var(--primary-color)', fontWeight: '600' }}>
                            ₹{(product.basePrice || 0).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>

                      <div style={styles.productActions}>
                        <Button
                          variant={isInCart ? "success" : "primary"}
                          disabled={loadingProductIds.has(product.id)}
                          onClick={() => showQuantityModalForProduct(product)}
                          style={{ minWidth: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          {loadingProductIds.has(product.id) && (
                            <div style={styles.productLoadingSpinner}></div>
                          )}
                          {loadingProductIds.has(product.id) ? 'Adding...' :
                           isInCart ? 'Add More' : 'Add to Cart'}
                        </Button>
                        
                        {inCart > 0 && (
                          <Button
                            variant="danger"
                            disabled={cartLoading}
                            onClick={() => removeFromCart(product.id)}
                            style={{ minWidth: '100px' }}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {/* Right side - Cart Details */}
                    {inCart > 0 && (
                      <div 
                        className="cart-details-section"
                        style={{
                          flex: '0 0 280px',
                          padding: '16px',
                          backgroundColor: '#f0f9ff',
                          borderRadius: '8px',
                          border: '1px solid #bae6fd',
                          borderLeft: '3px solid #0369a1'
                        }}>
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          marginBottom: '12px'
                        }}>
                          <h4 style={{ 
                            margin: '0', 
                            fontWeight: '600', 
                            color: '#0369a1', 
                            fontSize: '14px' 
                          }}>
                            🛒 Cart Details
                          </h4>
                          <span style={{
                            backgroundColor: '#0369a1',
                            color: 'white',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}>
                            In Cart
                          </span>
                        </div>
                        
                        <div style={{ display: 'grid', gap: '8px', fontSize: '13px' }}>
                           {(() => {
                             const cartItem = cartItems[product.id];
                             console.log('Cart item for product', product.id, ':', cartItem);
                             
                             const priceBreakup = cartItem?.priceBreakup?.[0];
                             console.log('Price breakup for product', product.id, ':', priceBreakup);
                             
                             if (!cartItem) {
                               return <div style={{ color: '#dc2626' }}>Cart item not found</div>;
                             }
                             
                            if (!priceBreakup) {
                              const amountBase = (cartItem?.cartBaseAmount ?? cartItem?.total ?? cartItem?.totalPrice ?? ((cartItem?.price || 0) * (cartItem?.quantity || 1)));
                              const taxAmt = (cartItem?.cartTaxAmount ?? 0);
                              const totalAmt = (cartItem?.cartTotalAmount ?? (amountBase + taxAmt));
                              return (
                                <>
                                  {/* Quantity */}
                                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#64748b', fontWeight: '500' }}>Quantity:</span>
                                    <span style={{ fontWeight: '600', color: '#1e293b' }}>
                                      {(cartItem?.quantity || 0)} {product.productType === "packed" ? 'packs' : (cartItem?.unit === 'packet' ? 'packs' : (cartItem?.unit || 'units'))}
                                    </span>
                                  </div>
                                  {/* Amount */}
                                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#64748b', fontWeight: '500' }}>Amount:</span>
                                    <span style={{ fontWeight: '600', color: '#1e293b' }}>
                                      ₹{(amountBase || 0).toLocaleString('en-IN')}
                                    </span>
                                  </div>
                                  {/* Tax Amount */}
                                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#64748b', fontWeight: '500' }}>Tax Amount:</span>
                                    <span style={{ fontWeight: '600', color: '#1e293b' }}>
                                      ₹{(taxAmt || 0).toLocaleString('en-IN')}
                                    </span>
                                  </div>
                                  {/* Total Amount */}
                                  <div style={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between',
                                    paddingTop: '8px',
                                    borderTop: '2px solid #0369a1',
                                    marginTop: '8px'
                                  }}>
                                    <span style={{ color: '#0369a1', fontWeight: '700', fontSize: '14px' }}>Total Amount:</span>
                                    <span style={{ fontWeight: '700', color: '#0369a1', fontSize: '16px' }}>
                                      ₹{(totalAmt || 0).toLocaleString('en-IN')}
                                    </span>
                                  </div>
                                </>
                              );
                            }
                             
                             return (
                               <>
                                {/* Quantity */}
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <span style={{ color: '#64748b', fontWeight: '500' }}>Quantity:</span>
                                  <span style={{ fontWeight: '600', color: '#1e293b' }}>
                                    {priceBreakup.quantity || 0} {product.productType === "packed" ? 'packs' : ((priceBreakup.unit === 'packet' ? 'packs' : (priceBreakup.unit || 'units')))}
                                  </span>
                                </div>
                                 
                                 {/* Quantity in KG (only for non-packed products) */}
                                 {product.productType !== 'packed' && (
                                   <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                     <span style={{ color: '#64748b', fontWeight: '500' }}>Quantity in KG:</span>
                                     <span style={{ fontWeight: '600', color: '#1e293b' }}>
                                       {priceBreakup.quantityInkg || 'N/A'} {priceBreakup.quantityInkg ? 'kg' : ''}
                                     </span>
                                   </div>
                                 )}
                                 
                                {/* Amount */}
                                 <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <span style={{ color: '#64748b', fontWeight: '500' }}>Amount:</span>
                                   <span style={{ fontWeight: '600', color: '#1e293b' }}>
                                    ₹{(((priceBreakup.amount ?? priceBreakup.totalCost) || 0)).toLocaleString('en-IN')}
                                   </span>
                                 </div>
                                 
                                {/* Tax Amount */}
                                 <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <span style={{ color: '#64748b', fontWeight: '500' }}>Tax Amount:</span>
                                   <span style={{ fontWeight: '600', color: '#1e293b' }}>
                                    ₹{((priceBreakup.taxAmount ?? cartItem?.cartTaxAmount ?? 0)).toLocaleString('en-IN')}
                                   </span>
                                 </div>
                                 
                                 {/* Tax Breakdown removed as per requirement */}
                                 
                                {/* Total Amount */}
                                 <div style={{ 
                                   display: 'flex', 
                                   justifyContent: 'space-between',
                                   paddingTop: '8px',
                                   borderTop: '2px solid #0369a1',
                                   marginTop: '8px'
                                 }}>
                                   <span style={{ color: '#0369a1', fontWeight: '700', fontSize: '14px' }}>Total Amount:</span>
                                   <span style={{ fontWeight: '700', color: '#0369a1', fontSize: '16px' }}>
                                    ₹{(((priceBreakup.totalAmount ?? cartItem?.cartTotalAmount ?? ((priceBreakup.totalCost || cartItem?.cartBaseAmount || 0) + (priceBreakup.taxAmount ?? cartItem?.cartTaxAmount ?? 0))) || 0)).toLocaleString('en-IN')}
                                   </span>
                                 </div>
                               </>
                             );
                           })()}
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '15px' }}>
              <Button
                variant="secondary"
                onClick={() => setStep(0)}
              >
                ← Back to Customer
              </Button>
              <Button
                variant="primary"
                onClick={() => setStep(2)}
                disabled={cartItemsCount === 0 || !selectedCustomer}
              >
                Continue to Logistics →
              </Button>
            </div>
          </>
        )}
      </div>
    );
  }

  // Step 2: Logistics
  function renderDropOffCard(index, drop) {
    return (
      <Card
        variant={
          isDropValid[index]
            ? "valid"
            : dropValidationErrors[index]
            ? "invalid"
            : undefined
        }
        style={{ marginBottom: '16px', width: '100%', boxSizing: 'border-box', overflow: 'hidden' }}
      >
        <div style={{ fontWeight: '600', marginBottom: '15px', fontSize: '16px', color: '#2d3748' }}>
          Drop-off #{index + 1}
        </div>
        
        <div className="row m-0 p-3">
          <div className={`col-3 ${customerStyles.longform}`}>
            <label>Receiver Name :</label>
            <input
              type="text"
              value={drop.receiverName || ''}
              onChange={(e) => handleDropOffChange(index, "receiverName", e.target.value)}
            />
          </div>
          <div className={`col-3 ${customerStyles.longform}`}>
            <label>Receiver Mobile :</label>
            <input
              type="text"
              value={drop.receiverMobile || ''}
              onChange={(e) => handleDropOffChange(index, "receiverMobile", e.target.value)}
            />
          </div>
          <div className={`col-3 ${customerStyles.longform}`}>
            <label>Plot :</label>
            <input
              type="text"
              value={drop.plot || ''}
              onChange={(e) => handleDropOffChange(index, "plot", e.target.value)}
            />
          </div>
          <div className={`col-3 ${customerStyles.longform}`}>
            <label>Street :</label>
            <input
              type="text"
              value={drop.street || ''}
              onChange={(e) => handleDropOffChange(index, "street", e.target.value)}
            />
          </div>
          <div className={`col-3 ${customerStyles.longform}`}>
            <label>Area :</label>
            <input
              type="text"
              value={drop.area || ''}
              onChange={(e) => handleDropOffChange(index, "area", e.target.value)}
            />
          </div>
          <div className={`col-3 ${customerStyles.longform}`}>
            <label>City :</label>
            <input
              type="text"
              value={drop.city || ''}
              onChange={(e) => handleDropOffChange(index, "city", e.target.value)}
            />
          </div>
          <div className={`col-3 ${customerStyles.longform}`}>
            <label>Pincode :</label>
            <input
              type="text"
              value={drop.pincode || ''}
              onChange={(e) => handleDropOffChange(index, "pincode", e.target.value)}
            />
          </div>
        </div>
        <div style={{ marginTop: '15px' }}>
          <MapPicker
            lat={drop.latitude}
            lng={drop.longitude}
            onChange={({ lat, lng }) => updateDropOff(index, { latitude: lat, longitude: lng })}
          />
        </div>
        <hr style={styles.divider} />
        <div style={{ fontWeight: '600', marginBottom: '8px' }}>
          Product Assignment
        </div>
        {(drop.items || []).map(item => (
          <div style={styles.flexRow} key={item.productId}>
            <div style={{ flex: 1 }}>
              {item.productName} ({item.quantity} {item.unit})
            </div>
            <Input
              type="number"
              min={0}
              max={cartItems[item.productId]?.quantity}
              value={item.quantity}
              style={{ width: '100px' }}
              onChange={e => {
                let val = Number(e.target.value);
                if (val > cartItems[item.productId]?.quantity) val = cartItems[item.productId]?.quantity;
                if (val < 0) val = 0;
                updateDropItemQuantity(index, item.productId, val);
              }}
            />
          </div>
        ))}
        <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
          <Button
            variant="primary"
            disabled={logisticsLoading}
            onClick={() => validateDropOff(index)}
          >
            Validate Dropoff
          </Button>
          {dropValidationErrors[index] && dropValidationErrors[index].includes("permission") && (
            <Button
              variant="secondary"
              disabled={logisticsLoading}
              onClick={() => {
                // Allow manual validation bypass for permission issues
                setIsDropValid((old) => {
                  const newArr = [...old];
                  newArr[index] = true;
                  return newArr;
                });
                setDropValidationErrors((old) => {
                  const newArr = [...old];
                  newArr[index] = null;
                  return newArr;
                });
                showToast({
                  title: "Drop-off marked as valid (validation bypassed)",
                  status: "warning",
                  duration: 3000,
                });
              }}
              style={{ fontSize: '12px' }}
            >
              Skip Validation
            </Button>
          )}
        </div>
        {dropValidationErrors[index] && (
          <div style={styles.errorText}>
            {dropValidationErrors[index]}
            {dropValidationErrors[index].includes("permission") && (
              <div style={{ fontSize: '12px', marginTop: '4px', color: '#ffc107' }}>
                You can use "Skip Validation" to proceed without validation.
              </div>
            )}
          </div>
        )}
      </Card>
    );
  }

  function renderLogisticsStep() {
    if (!warehouseOptions.length)
      return (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Logistics</h2>
          <Card>
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📦</div>
              <h3 style={{ color: '#718096', margin: '0' }}>No warehouse options available</h3>
              <p style={{ color: '#a0aec0', margin: '8px 0 0 0' }}>Please contact support for assistance</p>
            </div>
          </Card>
        </div>
      );
      
    return (
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Logistics</h2>
        <p style={styles.sectionSubtitle}>Configure delivery details and drop-off locations</p>
        
        <div style={{ marginBottom: '15px' }}>
          <h3 style={{ margin: '0 0 10px 0', fontWeight: '600', color: '#555', fontSize: '14px' }}>Select Warehouse</h3>
          <div style={styles.radioGroup}>
            {warehouseOptions.map(opt => {
              const isSelected = selectedWarehouseType === opt;
              return (
                <label 
                  key={opt} 
                  style={{
                    ...styles.radioItem,
                    ...(isSelected ? styles.radioItemSelected : {})
                  }}
                >
                  <input
                    type="radio"
                    name="warehouseType"
                    style={styles.radio}
                    value={opt}
                    checked={isSelected}
                    onChange={e => setSelectedWarehouseType(e.target.value)}
                  />
                  <span style={{ fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '12px' }}>
                    {opt}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <h3 style={{ margin: '0 0 8px 0', fontWeight: '600', color: '#555', fontSize: '14px' }}>
            Number of Drop-offs
          </h3>
          <p style={{ margin: '0 0 10px 0', color: '#666', fontSize: '12px' }}>
            Maximum allowed: {dropOffLimit}
          </p>
          <Select
            value={dropCount}
            onChange={e => {
              const val = Number(e.target.value);
              setDropCount(val);
              setDropOffs(oldDrops => {
                if (val > oldDrops.length) {
                  // Get products from cart if this is the first drop-off being created
                  const cartItemsArray = Object.keys(cartItems).length > 0 ? Object.values(cartItems) : [];
                  const isFirstDropOff = oldDrops.length === 0;
                  const defaultItems = isFirstDropOff && cartItemsArray.length > 0
                    ? cartItemsArray.map(item => ({
                        productId: item.productId,
                        productName: item.name || item.productName,
                        quantity: item.quantity,
                        unit: item.unit,
                        productType: item.productType,
                        packageWeight: item.packageWeight,
                        packageWeightUnit: item.packageWeightUnit,
                      }))
                    : [];
                  
                  // add new drop-offs
                  const newDrops = Array(val - oldDrops.length).fill(0).map((_, i) => ({
                    order: oldDrops.length + i + 1,
                    receiverName: "",
                    receiverMobile: "",
                    plot: "",
                    street: "",
                    area: "",
                    city: "",
                    pincode: "",
                    latitude: 17.3850, // Hyderabad default
                    longitude: 78.4867,
                    items: isFirstDropOff && i === 0 ? defaultItems : [],
                  }));
                  
                  return [...oldDrops, ...newDrops];
                } else {
                  return oldDrops.slice(0, val);
                }
              });
              setIsDropValid(Array(val).fill(false));
              setDropValidationErrors(Array(val).fill(null));
            }}
            style={{ maxWidth: '200px' }}
          >
            {Array.from({ length: dropOffLimit }).map((_, i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1} Drop-off{i > 0 ? 's' : ''}
              </option>
            ))}
          </Select>
        </div>

        <hr style={styles.divider} />
        
        {dropOffs.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(320px, 1fr))', gap: '15px', alignItems: 'stretch' }}>
            {dropOffs.map((drop, idx) => (
                <Card
                  key={`dropoff-${idx}`}
                  variant={
                    isDropValid[idx]
                      ? "valid"
                      : dropValidationErrors[idx]
                      ? "invalid"
                      : undefined
                  }
                  style={{ marginBottom: '16px', width: '100%', boxSizing: 'border-box', overflow: 'hidden' }}
                >
                  <div style={{ fontWeight: '600', marginBottom: '15px', fontSize: '16px', color: '#2d3748' }}>
                    Drop-off #{idx + 1}
                  </div>
                  
                  <div className="row m-0 p-3">
                    <div className={`col-3 ${customerStyles.longform}`}>
                      <label>Receiver Name :</label>
                      <input
                        type="text"
                        value={dropOffs[idx]?.receiverName || ''}
                        onChange={(e) => handleDropOffChange(idx, "receiverName", e.target.value)}
                      />
                    </div>
                    <div className={`col-3 ${customerStyles.longform}`}>
                      <label>Receiver Mobile :</label>
                      <input
                        type="text"
                        value={dropOffs[idx]?.receiverMobile || ''}
                        onChange={(e) => handleDropOffChange(idx, "receiverMobile", e.target.value)}
                      />
                    </div>
                    <div className={`col-3 ${customerStyles.longform}`}>
                      <label>Plot :</label>
                      <input
                        type="text"
                        value={dropOffs[idx]?.plot || ''}
                        onChange={(e) => handleDropOffChange(idx, "plot", e.target.value)}
                      />
                    </div>
                    <div className={`col-3 ${customerStyles.longform}`}>
                      <label>Street :</label>
                      <input
                        type="text"
                        value={dropOffs[idx]?.street || ''}
                        onChange={(e) => handleDropOffChange(idx, "street", e.target.value)}
                      />
                    </div>
                    <div className={`col-3 ${customerStyles.longform}`}>
                      <label>Area :</label>
                      <input
                        type="text"
                        value={dropOffs[idx]?.area || ''}
                        onChange={(e) => handleDropOffChange(idx, "area", e.target.value)}
                      />
                    </div>
                    <div className={`col-3 ${customerStyles.longform}`}>
                      <label>City :</label>
                      <input
                        type="text"
                        value={dropOffs[idx]?.city || ''}
                        onChange={(e) => handleDropOffChange(idx, "city", e.target.value)}
                      />
                    </div>
                    <div className={`col-3 ${customerStyles.longform}`}>
                      <label>Pincode :</label>
                      <input
                        type="text"
                        value={dropOffs[idx]?.pincode || ''}
                        onChange={(e) => handleDropOffChange(idx, "pincode", e.target.value)}
                      />
                    </div>
                  </div>
                  <div style={{ marginTop: '15px' }}>
                    <MapPicker
                      lat={dropOffs[idx]?.latitude}
                      lng={dropOffs[idx]?.longitude}
                      onChange={({ lat, lng }) => updateDropOff(idx, { latitude: lat, longitude: lng })}
                    />
                  </div>
                  <hr style={styles.divider} />
                  <div style={{ fontWeight: '600', marginBottom: '8px' }}>
                    Product Assignment
                  </div>
                  {(dropOffs[idx]?.items || []).map(item => (
                    <div style={styles.flexRow} key={item.productId}>
                      <div style={{ flex: 1 }}>
                        {item.productName} ({item.quantity} {item.unit})
                      </div>
                      <Input
                        type="number"
                        min={0}
                        max={cartItems[item.productId]?.quantity}
                        value={item.quantity}
                        style={{ width: '100px' }}
                        onChange={e => {
                          let val = Number(e.target.value);
                          if (val > cartItems[item.productId]?.quantity) val = cartItems[item.productId]?.quantity;
                          if (val < 0) val = 0;
                          updateDropItemQuantity(idx, item.productId, val);
                        }}
                      />
                    </div>
                  ))}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                    <Button
                      variant="primary"
                      disabled={logisticsLoading}
                      onClick={() => validateDropOff(idx)}
                    >
                      Validate Dropoff
                    </Button>
                    {dropValidationErrors[idx] && dropValidationErrors[idx].includes("permission") && (
                      <Button
                        variant="secondary"
                        disabled={logisticsLoading}
                        onClick={() => {
                          setIsDropValid((old) => {
                            const newArr = [...old];
                            newArr[idx] = true;
                            return newArr;
                          });
                          setDropValidationErrors((old) => {
                            const newArr = [...old];
                            newArr[idx] = null;
                            return newArr;
                          });
                          showToast({
                            title: "Drop-off marked as valid (validation bypassed)",
                            status: "warning",
                            duration: 3000,
                          });
                        }}
                        style={{ fontSize: '12px' }}
                      >
                        Skip Validation
                      </Button>
                    )}
                  </div>
                  {dropValidationErrors[idx] && (
                    <div style={styles.errorText}>
                      {dropValidationErrors[idx]}
                      {dropValidationErrors[idx].includes("permission") && (
                        <div style={{ fontSize: '12px', marginTop: '4px', color: '#ffc107' }}>
                          You can use "Skip Validation" to proceed without validation.
                        </div>
                      )}
                    </div>
                  )}
                </Card>
            ))}
          </div>
        ) : (
          <Card>
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📍</div>
              <h3 style={{ color: '#718096', margin: '0' }}>No drop-offs configured</h3>
              <p style={{ color: '#a0aec0', margin: '8px 0 0 0' }}>Select number of drop-offs above</p>
            </div>
          </Card>
        )}
        
        <div style={{ display: 'flex', gap: '12px', marginTop: '15px' }}>
          <Button
            variant="secondary"
            onClick={() => setStep(1)}
          >
            ← Back to Products
          </Button>
          <Button
            variant="primary"
            onClick={confirmLogisticsStep}
            disabled={!selectedWarehouseType || !isDropValid.every(Boolean)}
          >
            Continue to Overview →
          </Button>
        </div>
      </div>
    );
  }

  // Step 4: Review
  function renderReviewStep() {
    if (reviewLoading) return <Loader />;
    if (!reviewData)
      return (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Review Order</h2>
          <Card>
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <h3 style={{ color: '#718096', margin: '0' }}>No review data available</h3>
              <p style={{ color: '#a0aec0', margin: '8px 0 0 0' }}>Please go back and complete the previous steps</p>
            </div>
          </Card>
        </div>
      );

    const c = reviewData.customer || {};
    const s = reviewData.salesExecutive || {};
    const w = reviewData.warehouse || {};
    const drops = dropOffs || [];
    const items = reviewData.items || [];
    // Calculate totals accounting for edited grandTotals
    const baseTotals = reviewData.totals || {};
    
    // Use backend's totals from reviewData - don't recalculate on frontend
    // Backend has already processed edited amounts and returns correct totals
    const totals = baseTotals || {};

    return (
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Review Order</h2>
        <p style={styles.sectionSubtitle}>Please review all order details before proceeding to payment</p>
        
        {/* Customer / Sales / Warehouse Information */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
            {/* Customer Information */}
            <div style={{ 
              padding: '16px', 
              backgroundColor: '#f7fafc', 
              borderRadius: '12px',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ fontWeight: '700', color: '#2d3748', marginBottom: '8px' }}>
                Customer
              </div>
              <p style={{ margin: '0 0 12px 0', color: '#718096', fontSize: '12px' }}>Order recipient</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontWeight: '600', color: '#4a5568' }}>Name:</span>
                <span style={{ color: '#2d3748' }}>{c.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontWeight: '600', color: '#4a5568' }}>Phone:</span>
                <span style={{ color: '#2d3748' }}>{c.mobile}</span>
              </div>
              {c.address && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: '600', color: '#4a5568' }}>Address:</span>
                  <span style={{ color: '#2d3748', textAlign: 'right', maxWidth: '60%' }}>{c.address}</span>
                </div>
              )}
            </div>

            {/* Sales Executive */}
            <div style={{ 
              padding: '16px', 
              backgroundColor: '#f7fafc', 
              borderRadius: '12px',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ fontWeight: '700', color: '#2d3748', marginBottom: '8px' }}>
                Sales Executive
              </div>
              <p style={{ margin: '0 0 12px 0', color: '#718096', fontSize: '12px' }}>Account manager</p>
              {s.name ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontWeight: '600', color: '#4a5568' }}>Name:</span>
                    <span style={{ color: '#2d3748' }}>{s.name}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontWeight: '600', color: '#4a5568' }}>Phone:</span>
                    <span style={{ color: '#2d3748' }}>{s.mobile}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: '600', color: '#4a5568' }}>Email:</span>
                    <span style={{ color: '#2d3748' }}>{s.email}</span>
                  </div>
                </>
              ) : (
                <div style={{ color: '#718096', fontSize: '14px' }}>
                  Not assigned
                </div>
              )}
            </div>

            {/* Warehouse */}
            <div style={{ 
              padding: '16px', 
              backgroundColor: '#f7fafc', 
              borderRadius: '12px',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ fontWeight: '700', color: '#2d3748', marginBottom: '8px' }}>
                Warehouse
              </div>
              <p style={{ margin: '0 0 12px 0', color: '#718096', fontSize: '12px' }}>Fulfillment center</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontWeight: '600', color: '#4a5568' }}>Name:</span>
                <span style={{ color: '#2d3748' }}>{w.name || "Warehouse"}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: '600', color: '#4a5568' }}>Address:</span>
                <span style={{ color: '#2d3748', textAlign: 'right', maxWidth: '60%' }}>
                  {[w.street, w.area, w.city, w.pincode].filter(Boolean).join(", ") || "Address not available"}
                </span>
              </div>
            </div>
          </div>

        {/* Drop-off Points */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div>
              <h3 style={{ margin: '0', fontWeight: '700', color: '#2d3748' }}>Drop-off Points</h3>
              <p style={{ margin: '4px 0 0 0', color: '#718096', fontSize: '14px' }}>Delivery locations</p>
            </div>
          </div>
          {drops.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#718096' }}>
              No drop-offs configured
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '16px' }}>
              {drops.map((d, idx) => (
                <div key={idx} style={{ 
                  padding: '16px', 
                  backgroundColor: '#f7fafc', 
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{ fontWeight: '700', color: '#2d3748', marginBottom: '8px' }}>
                    Drop-off #{idx + 1}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontWeight: '600', color: '#4a5568' }}>Receiver:</span>
                    <span style={{ color: '#2d3748' }}>{d.receiverName || "Not specified"}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontWeight: '600', color: '#4a5568' }}>Phone:</span>
                    <span style={{ color: '#2d3748' }}>{d.receiverMobile || "Not specified"}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: '600', color: '#4a5568' }}>Address:</span>
                    <span style={{ color: '#2d3748', textAlign: 'right', maxWidth: '60%' }}>
                      {[d.plot, d.street, d.area, d.city, d.pincode].filter(Boolean).join(", ") || "Address not complete"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Products */}
        <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, marginBottom: 16, overflow: 'hidden' }}>
          <div style={{ backgroundColor: '#f1f5f9', padding: 12, fontWeight: 600, color: '#1e293b' }}>Products</div>
          {items.map((item, i) => {
            const itemKey = item.productId || i;
            const editedGrandTotal = editedGrandTotals[itemKey];
            const isEdited = editedGrandTotal !== undefined;
            const originalTotal = parseFloat(item.totalAmount) || 0;
            // Use edited value if exists, otherwise use original
            const displayAmount = isEdited 
              ? editedGrandTotal 
              : originalTotal;

             if (!originalItemValues[itemKey]) {
                setOriginalItemValues(prev => ({ ...prev, [itemKey]: item }));
            }
            
            return (
              <div key={itemKey} style={{ 
                display: 'grid', 
                gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr 1fr auto', 
                padding: '12px 16px', 
                borderTop: '1px solid #e2e8f0', 
                fontSize: 13, 
                color: '#475569', 
                gap: '12px', 
                alignItems: 'center' 
              }}>
                <div>
                  <div style={{ fontWeight: 600, color: '#0f172a' }}>{item.productName}</div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>{item.sku || 'SKU NA'}</div>
                </div>
                <div>Qty: {item.quantity} {item.unit}</div>
                <div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: '2px' }}>
                    Unit: ₹{(item.unitPrice || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>Tax: ₹{item.taxAmount}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={displayAmount !== undefined && displayAmount !== null ? displayAmount : ''}
                    onChange={(e) => {
                      const inputValue = e.target.value;
                      if (inputValue === '') {
                         setEditedGrandTotals((prev) => ({ ...prev, [itemKey]: 0 }));
                         return;
                      }
                      
                      const newValue = parseFloat(inputValue);
                      if (!isNaN(newValue) && newValue >= 0) {
                        setEditedGrandTotals((prev) => ({ ...prev, [itemKey]: newValue }));
                      }
                    }}
                    onBlur={(e) => {
                      const newValue = parseFloat(e.target.value);
                      const original = (originalItemValues[itemKey]?.originalTotal || 0);
                      if (!isNaN(newValue) && newValue > 0 && newValue < original) {
                        showToast({
                          title: `Price cannot be less than the original amount (₹${original.toLocaleString('en-IN')})`,
                          status: "warning",
                          duration: 4000
                        });
                        setEditedGrandTotals((prev) => ({ ...prev, [itemKey]: original }));
                      }
                    }}
                    style={{
                      width: '100px',
                      padding: '4px 8px',
                      border: `1px solid ${
                        isEdited 
                          ? (displayAmount < (originalItemValues[itemKey]?.originalTotal || 0) ? '#dc3545' : '#3b82f6') 
                          : '#e2e8f0'
                      }`,
                      borderRadius: '4px',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: isEdited && displayAmount < (originalItemValues[itemKey]?.originalTotal || 0) ? '#dc3545' : '#0f172a',
                      backgroundColor: isEdited ? (displayAmount < (originalItemValues[itemKey]?.originalTotal || 0) ? '#fff5f5' : '#eff6ff') : '#fff',
                      textAlign: 'right',
                      outline: 'none',
                      transition: 'all 0.2s ease'
                    }}
                    placeholder="0.00"
                  />
                  {isEdited && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setEditedGrandTotals((prev) => {
                          const updated = { ...prev };
                          delete updated[itemKey];
                          return updated;
                        });
                        
                        showToast({
                          title: "Resetting to original total",
                          status: "info",
                          duration: 2000,
                        });
                      }}
                      style={{
                        padding: '2px 8px',
                        fontSize: '11px',
                        backgroundColor: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                       title="Reset to original"
                      type="button"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          
          {/* Total Quantity and Subtotal */}
          {items.length > 0 && (() => {
            const totalQuantity = items.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0);
            const displaySubtotal = totals.subtotal || 0;

            return (
              <div style={{ 
                marginTop: '12px', 
                padding: '16px', 
                borderTop: '1px solid #e2e8f0',
                backgroundColor: '#f8fafc'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontWeight: '600', color: '#4a5568', fontSize: '14px' }}>Total Quantity:</span>
                  <span style={{ color: '#2d3748', fontWeight: '600', fontSize: '14px' }}>
                    {totalQuantity.toLocaleString('en-IN')} {items[0]?.unit || 'units'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: '700', color: '#2d3748', fontSize: '15px' }}>Subtotal:</span>
                  <span style={{ color: '#2d3748', fontWeight: '700', fontSize: '16px' }}>
                    ₹{displaySubtotal.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Order Totals */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div>
              <h3 style={{ margin: '0', fontWeight: '700', color: '#2d3748' }}>Order Summary</h3>
              <p style={{ margin: '4px 0 0 0', color: '#718096', fontSize: '14px' }}>Price breakdown</p>
            </div>
          </div>
          <div style={styles.flexColumn}>
            <div style={styles.totalsRow}>
              <span style={{ fontWeight: '600', color: '#4a5568' }}>Subtotal</span>
              <span style={{ color: '#2d3748', fontWeight: '600' }}>
               ₹{(totals.subtotal || 0).toLocaleString('en-IN')}
              </span>
            </div>
            <div style={styles.totalsRow}>
              <span style={{ fontWeight: '600', color: '#4a5568' }}>Tax</span>
              <span style={{ color: '#2d3748', fontWeight: '600' }}>
                ₹{(totals.tax || 0).toLocaleString('en-IN')}
              </span>
            </div>
            <div style={styles.totalsRow}>
              <span style={{ fontWeight: '600', color: '#4a5568' }}>Round Off</span>
               <span style={{ color: '#2d3748', fontWeight: '600' }}>
                ₹{(totals.roundOff || 0).toLocaleString('en-IN')}
              </span>
            </div>
            <hr style={styles.divider} />
            <div style={{ ...styles.totalsRow, ...styles.totalsFinal }}>
              <span>Grand Total</span>
              <span>
                ₹{(totals.grandTotal || 0).toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </Card>

        <div style={{ display: 'flex', gap: '12px', marginTop: '15px' }}>
          <Button
            variant="secondary"
            onClick={() => setStep(2)}
          >
            ← Back to Logistics
          </Button>
          <Button
            onClick={finalizeOrder}
            disabled={reviewLoading}
            variant="primary"
          >
            Confirm & Continue to Payment →
          </Button>
        </div>
      </div>
    );
  }

  // Step 2: Payment Step
  function renderPaymentStep() {
    function handleFileUpload(e, idx) {
      const file = e.target.files[0];
      if (!file) return;
      const previewUrl = URL.createObjectURL(file);
      const newPayments = [...payments];
      newPayments[idx].proofFile = file;
      newPayments[idx].proofPreviewUrl = previewUrl;
      setPayments(newPayments);
    }

    function updatePaymentFieldLocal(idx, field, value) {
      console.log(`Updating payment ${idx}, field: ${field}, value:`, value);
      const newPayments = [...payments];
      newPayments[idx][field] = value;
      setPayments(newPayments);
      console.log('Updated payments:', newPayments);
    }

    return (
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Payment Details</h2>
        <p style={styles.sectionSubtitle}>Complete payment information to finalize the order</p>
        
        {/* Mobile Number (Optional) */}
        <Card style={{ marginBottom: '20px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontWeight: '700', color: '#2d3748' }}>Mobile Number</h3>
          <p style={{ margin: '0 0 12px 0', color: '#718096', fontSize: '14px' }}>Optional - Enter mobile number for payment notifications</p>
          <input
            type="tel"
            placeholder="Enter mobile number (optional)"
            value={mobileNumber}
            onChange={e => setMobileNumber(e.target.value)}
            style={{ 
              width: '100%', 
              maxWidth: '400px',
              height: '40px', 
              paddingLeft: '12px', 
              borderRadius: '8px', 
              border: '1px solid #d9d9d9', 
              boxShadow: '1px 1px 3px #333', 
              fontWeight: '500', 
              fontSize: '14px' 
            }}
          />
        </Card>
        
        {/* Order Summary */}
        <Card style={{ backgroundColor: 'rgba(102, 126, 234, 0.05)', borderColor: '#667eea' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ margin: '0', fontWeight: '700', color: '#667eea' }}>Order Summary</h3>
              <p style={{ margin: '4px 0 0 0', color: '#4a5568' }}>
                Order ID: {reviewData?.orderId || "Pending"}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '28px', fontWeight: '700', color: '#667eea' }}>
                ₹{(reviewData?.totalAmount || 0).toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '14px', color: '#718096' }}>Total Amount</div>
            </div>
          </div>
        </Card>

        {/* Payment Info */}
        <Card style={{ marginBottom: '20px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontWeight: '700', color: '#2d3748' }}>Payment Info</h3>
          
          {/* Payment Records */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h4 style={{ margin: '0', fontWeight: '600', color: '#4a5568', fontSize: '16px' }}>Payment Records</h4>
          <Button
            onClick={addPayment}
            variant="success"
            style={{ minWidth: 'auto' }}
          >
            Add Payment
          </Button>
        </div>

        <div style={{ display: 'grid', gap: '20px' }}>
          {payments.map((payment, i) => (
            <Card key={i}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <div>
                    <h4 style={{ margin: '0', fontWeight: '700', color: '#2d3748' }}>Payment #{i + 1}</h4>
                    <p style={{ margin: '4px 0 0 0', color: '#718096', fontSize: '14px' }}>Payment details and proof</p>
                  </div>
                </div>
                {payments.length > 1 && (
                  <button
                    style={{
                      ...styles.iconButton,
                      backgroundColor: '#fee2e2',
                      color: '#ef4444',
                      borderRadius: '8px'
                    }}
                    onClick={() => removePayment(i)}
                    title="Remove payment"
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#fecaca';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = '#fee2e2';
                    }}
                  >
                    Delete
                  </button>
                )}
              </div>
              
              {/* Payment Method Buttons - First */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '12px', color: '#4a5568' }}>
                  Payment Method
                </label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => updatePaymentFieldLocal(i, "paymentMethod", "cash")}
                    style={{
                      padding: '10px 24px',
                      borderRadius: '8px',
                      border: '2px solid',
                      borderColor: (payment.paymentMethod || "cash") === "cash" ? 'var(--primary-color)' : '#e2e8f0',
                      backgroundColor: (payment.paymentMethod || "cash") === "cash" ? 'var(--primary-color)' : '#fff',
                      color: (payment.paymentMethod || "cash") === "cash" ? '#fff' : '#4a5568',
                      fontWeight: '600',
                      fontSize: '14px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if ((payment.paymentMethod || "cash") !== "cash") {
                        e.target.style.borderColor = 'var(--primary-color)';
                        e.target.style.backgroundColor = '#f0f4ff';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if ((payment.paymentMethod || "cash") !== "cash") {
                        e.target.style.borderColor = '#e2e8f0';
                        e.target.style.backgroundColor = '#fff';
                      }
                    }}
                  >
                    Cash
                  </button>
                  <button
                    type="button"
                    onClick={() => updatePaymentFieldLocal(i, "paymentMethod", "bank")}
                    style={{
                      padding: '10px 24px',
                      borderRadius: '8px',
                      border: '2px solid',
                      borderColor: payment.paymentMethod === "bank" ? 'var(--primary-color)' : '#e2e8f0',
                      backgroundColor: payment.paymentMethod === "bank" ? 'var(--primary-color)' : '#fff',
                      color: payment.paymentMethod === "bank" ? '#fff' : '#4a5568',
                      fontWeight: '600',
                      fontSize: '14px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (payment.paymentMethod !== "bank") {
                        e.target.style.borderColor = 'var(--primary-color)';
                        e.target.style.backgroundColor = '#f0f4ff';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (payment.paymentMethod !== "bank") {
                        e.target.style.borderColor = '#e2e8f0';
                        e.target.style.backgroundColor = '#fff';
                      }
                    }}
                  >
                    Bank
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#4a5568' }}>
                    Transaction Date
                  </label>
                  <input
                    type="date"
                    value={payment.transactionDate || getTodayDate()}
                    onChange={e => updatePaymentFieldLocal(i, "transactionDate", e.target.value)}
                    style={{ width: '150px', height: '27px', paddingLeft: '4px', borderRadius: '4px', border: '1px solid #d9d9d9', boxShadow: '1px 1px 3px #333', fontWeight: '500', fontSize: '14px' }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#4a5568' }}>
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="Enter amount"
                    defaultValue={payment.amount || ''}
                    onBlur={e => updatePaymentFieldLocal(i, "amount", e.target.value)}
                    step="0.01"
                    min="0"
                    style={{ width: '150px', height: '27px', paddingLeft: '4px', borderRadius: '4px', border: '1px solid #d9d9d9', boxShadow: '1px 1px 3px #333', fontWeight: '500', fontSize: '14px' }}
                  />
                </div>
                
                {payment.paymentMethod === "bank" && (
                  <div>
                    <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#4a5568' }}>
                      UTR Number (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="Enter UTR number"
                      defaultValue={payment.utrNumber || ''}
                      onBlur={e => updatePaymentFieldLocal(i, "utrNumber", e.target.value)}
                      style={{ width: '150px', height: '27px', paddingLeft: '4px', borderRadius: '4px', border: '1px solid #d9d9d9', boxShadow: '1px 1px 3px #333', fontWeight: '500', fontSize: '14px' }}
                    />
                  </div>
                )}
                
              </div>
              
              <div style={{ marginTop: '16px' }}>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#4a5568' }}>
                  Remarks
                </label>
              <textarea
                rows={3}
                placeholder="Add any additional notes or remarks..."
                defaultValue={payment.remark || ''}
                onBlur={e => updatePaymentFieldLocal(i, "remark", e.target.value)}
                style={{ 
                  width: '100%',
                  height: '27px',
                  paddingLeft: '4px',
                  borderRadius: '4px',
                  border: '1px solid #d9d9d9',
                  boxShadow: '1px 1px 3px #333',
                  fontWeight: '500',
                  fontSize: '14px',
                  minHeight: "80px", 
                  resize: "vertical",
                  fontFamily: 'inherit'
                }}
              />
              </div>
              
              {payment.paymentMethod === "cash" && (
                <div style={{ marginTop: '16px' }}>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#4a5568' }}>
                    Payment Proof (Optional)
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                    <label 
                      style={{
                        ...styles.fileButton,
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => {
                        Object.assign(e.target.style, styles.fileButtonHover);
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.borderColor = '#e2e8f0';
                        e.target.style.backgroundColor = '#f7fafc';
                      }}
                    >
                      📎 Upload Proof
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        style={styles.fileInput}
                        onChange={e => handleFileUpload(e, i)}
                      />
                    </label>
                    {payment.proofPreviewUrl && (
                      <div style={{ position: 'relative' }}>
                        <img
                          src={payment.proofPreviewUrl}
                          alt={`Payment proof #${i + 1}`}
                          style={styles.previewImage}
                        />
                        <div style={{
                          position: 'absolute',
                          top: '-8px',
                          right: '-8px',
                          width: '20px',
                          height: '20px',
                          backgroundColor: '#10b981',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '12px'
                        }}>
                          ✓
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {payment.paymentMethod === "bank" && (
                <div style={{ marginTop: '16px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      // Generate QR code functionality
                      showToast({
                        title: "QR code generation feature coming soon",
                        status: "info",
                        duration: 3000,
                      });
                    }}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '8px',
                      border: '2px solid var(--primary-color)',
                      backgroundColor: '#fff',
                      color: 'var(--primary-color)',
                      fontWeight: '600',
                      fontSize: '14px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = 'var(--primary-color)';
                      e.target.style.color = '#fff';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = '#fff';
                      e.target.style.color = 'var(--primary-color)';
                    }}
                  >
                    📱 Generate QR
                  </button>
                </div>
              )}
            </Card>
          ))}
          </div>
        </Card>

        <div style={{ display: 'flex', gap: '12px', marginTop: '15px' }}>
          <Button
            variant="secondary"
            onClick={() => setStep(3)}
          >
            ← Back to Overview
          </Button>
          <Button
            variant="primary"
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              submitPayments();
            }}
            disabled={paymentUploading}
            style={{ minWidth: '200px', cursor: paymentUploading ? 'not-allowed' : 'pointer' }}
          >
            {paymentUploading ? 'Submitting...' : 'Submit Order'}
          </Button>
        </div>
      </div>
    );
  }

  // Main render function
  return (
    <>
      {/* Loader Keyframes */}
      <style>{keyframes}</style>
      <div style={styles.container} className="container">
        <p className="path">
          <span onClick={() => navigate("/sales")}>Sales</span>{" "}
          <i className="bi bi-chevron-right"></i> New Sales Order
        </p>
        <div style={styles.title} className="title">Create New Sales Order</div>
        <StepIndicator 
          step={step} 
          setStep={setStep} 
          selectedCustomer={selectedCustomer} 
          customerDetails={customerDetails} 
          cartItems={cartItems} 
          cartId={cartId} 
          selectedWarehouseType={selectedWarehouseType} 
          dropOffs={dropOffs} 
          reviewData={reviewData} 
        />
        {step === 0 && renderCustomerStep()}
        {step === 1 && renderProductStep()}
        {step === 2 && renderLogisticsStep()}
        {step === 3 && renderReviewStep()}
        {step === 4 && renderPaymentStep()}
        
        {/* Quantity Modal */}
        <QuantityModal 
          showQuantityModal={showQuantityModal}
          selectedProductForQty={selectedProductForQty}
          setShowQuantityModal={setShowQuantityModal}
          setSelectedProductForQty={setSelectedProductForQty}
          setInputQuantity={setInputQuantity}
          inputQuantity={inputQuantity}
          handleQuantityConfirm={handleQuantityConfirm}
        />
        
        {/* Toast */}
        {toast && (
          <div
            style={{
              ...styles.toast,
              ...(toast.severity === "success"
                ? styles.toastSuccess
                : toast.severity === "error"
                ? styles.toastError
                : toast.severity === "warning"
                ? styles.toastWarning
                : styles.toastInfo)
            }}
          >
            {toast.message}
          </div>
        )}
      </div>
    </>
  );
}
