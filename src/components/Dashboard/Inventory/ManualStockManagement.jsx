import React, { useState, useEffect } from "react";
import { useAuth } from "@/Auth";
import { useDivision } from "@/components/context/DivisionContext";
import LoadingAnimation from "@/components/LoadingAnimation";
import ErrorModal from "@/components/ErrorModal";
import SuccessModal from "@/components/SuccessModal";
import manualStockService from "@/services/manualStockService";
import styles from "../Customers/Customer.module.css";
import inventoryStyles from "./Inventory.module.css";

function ManualStockManagement({ navigate }) {
  const { axiosAPI } = useAuth();
  const { selectedDivision, showAllDivisions } = useDivision();
  
  // State management
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    warehouseId: '',
    productId: '',
    movementType: 'inward',
    quantity: '',
    reason: ''
  });
  
  // Data arrays
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [stockHistory, setStockHistory] = useState([]);
  
  // UI state
  const [showHistory, setShowHistory] = useState(false);
  const [selectedWarehouseForHistory, setSelectedWarehouseForHistory] = useState('');

  // Load initial data
  useEffect(() => {
    loadWarehouses();
    loadProducts();
  }, [selectedDivision, showAllDivisions]);

  // Load inventory when warehouse changes
  useEffect(() => {
    if (formData.warehouseId) {
      loadWarehouseInventory(formData.warehouseId);
    }
  }, [formData.warehouseId]);

  const loadWarehouses = async () => {
    try {
      setLoading(true);
      const result = await manualStockService.getWarehouses(axiosAPI);
      
      if (result.success) {
        setWarehouses(result.data || []);
      } else {
        setError(result.message);
        setShowErrorModal(true);
      }
    } catch (err) {
      setError("Failed to load warehouses");
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      const result = await manualStockService.getActiveProducts(axiosAPI);
      
      if (result.success) {
        setProducts(result.data || []);
      } else {
        setError(result.message);
        setShowErrorModal(true);
      }
    } catch (err) {
      setError("Failed to load products");
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const loadWarehouseInventory = async (warehouseId) => {
    try {
      setLoading(true);
      const result = await manualStockService.getWarehouseInventory(axiosAPI, warehouseId);
      
      if (result.success) {
        // Handle new API response structure
        const responseData = result.data;
        if (responseData && responseData.inventory) {
          setInventory(responseData.inventory || []);
        } else {
          setInventory([]);
        }
      } else {
        setError(result.message);
        setShowErrorModal(true);
      }
    } catch (err) {
      setError("Failed to load warehouse inventory");
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const loadStockHistory = async (warehouseId) => {
    try {
      setLoading(true);
      const result = await manualStockService.getStockHistory(axiosAPI, warehouseId);
      
      if (result.success) {
        setStockHistory(result.data || []);
        setShowHistory(true);
      } else {
        setError(result.message);
        setShowErrorModal(true);
      }
    } catch (err) {
      setError("Failed to load stock history");
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.warehouseId || !formData.productId || !formData.quantity || !formData.reason) {
      setError("Please fill in all required fields");
      setShowErrorModal(true);
      return;
    }

    if (parseFloat(formData.quantity) <= 0) {
      setError("Quantity must be greater than 0");
      setShowErrorModal(true);
      return;
    }

    try {
      setLoading(true);
      const result = await manualStockService.createStockMovement(axiosAPI, {
        warehouseId: parseInt(formData.warehouseId),
        productId: parseInt(formData.productId),
        movementType: formData.movementType,
        quantity: parseFloat(formData.quantity),
        reason: formData.reason
      });

      if (result.success) {
        setSuccess("Stock movement created successfully!");
        setShowSuccessModal(true);
        
        // Reset form
        setFormData({
          warehouseId: '',
          productId: '',
          movementType: 'inward',
          quantity: '',
          reason: ''
        });
        
        // Reload inventory
        if (formData.warehouseId) {
          loadWarehouseInventory(formData.warehouseId);
        }
      } else {
        setError(result.message);
        setShowErrorModal(true);
      }
    } catch (err) {
      setError("Failed to create stock movement");
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleViewHistory = () => {
    if (selectedWarehouseForHistory) {
      loadStockHistory(selectedWarehouseForHistory);
    } else {
      setError("Please select a warehouse to view history");
      setShowErrorModal(true);
    }
  };

  const getCurrentStock = (productId) => {
    const item = inventory.find(item => item.id === parseInt(productId));
    return item ? parseFloat(item.stockQuantity) : 0;
  };

  const getProductName = (productId) => {
    const product = products.find(p => p.id === parseInt(productId));
    return product ? product.name : 'Unknown Product';
  };

  const getWarehouseName = (warehouseId) => {
    const warehouse = warehouses.find(w => w.id === parseInt(warehouseId));
    return warehouse ? warehouse.name : 'Unknown Warehouse';
  };

  return (
    <>
      <p className="path">
        <span onClick={() => navigate("/inventory")}>Inventory</span>{" "}
        <i className="bi bi-chevron-right"></i> Manage Stock
      </p>

      <div className="row m-0 p-3">
        <h5 className={styles.head}>Manage Stock</h5>
        
        {/* Warehouse Selection */}
        <div className={`col-4 ${styles.longform}`}>
          <label>Warehouse :</label>
          <select
            value={formData.warehouseId}
            onChange={(e) => {
              setFormData(prev => ({
                ...prev,
                warehouseId: e.target.value === "null" ? "" : e.target.value,
                productId: '' // Reset product when warehouse changes
              }));
            }}
            required
          >
            <option value="">--Select Warehouse--</option>
            {warehouses.map((warehouse) => (
              <option key={warehouse.id} value={warehouse.id}>
                {warehouse.name}
              </option>
            ))}
          </select>
        </div>

        {/* Product Selection */}
        <div className={`col-4 ${styles.longform}`}>
          <label>Product :</label>
          <select
            value={formData.productId}
            onChange={(e) => {
              setFormData(prev => ({
                ...prev,
                productId: e.target.value === "null" ? "" : e.target.value
              }));
            }}
            disabled={!formData.warehouseId}
            required
          >
            <option value="">--Select Product--</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
        </div>

        {/* Current Stock Display */}
        {formData.productId && (
          <div className={`col-4 ${styles.longform}`}>
            <label>Current Stock :</label>
            <span className="ms-2" style={{ 
              fontSize: '14px', 
              fontWeight: '600',
              color: getCurrentStock(formData.productId) > 0 ? '#28a745' : '#dc3545'
            }}>
              {getCurrentStock(formData.productId)}
            </span>
          </div>
        )}

        {/* Quantity */}
        <div className={`col-3 ${styles.longform}`}>
          <label>Quantity :</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={formData.quantity}
            onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
            placeholder="Enter quantity"
            required
          />
        </div>

        {/* Transaction Type */}
        <div className={`col-3 ${styles.longform}`}>
          <label>Transaction Type :</label>
          <select
            value={formData.movementType}
            onChange={(e) => setFormData(prev => ({ ...prev, movementType: e.target.value }))}
            required
          >
            <option value="inward">Inward (Add Stock)</option>
            <option value="outward">Outward (Remove Stock)</option>
          </select>
        </div>

        {/* Reason */}
        <div className={`col-6 ${styles.longform}`}>
          <label>Reason :</label>
          <input
            type="text"
            value={formData.reason}
            onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
            placeholder="Enter reason for this stock movement"
            required
          />
        </div>
      </div>

      {/* Submit and Cancel Buttons */}
      {!loading && (
        <div className="row m-0 p-3 justify-content-center">
          <div className="col-3">
            <button className="submitbtn" onClick={handleSubmit}>
              Create Movement
            </button>
            <button
              className="cancelbtn"
              onClick={() => {
                setFormData({
                  warehouseId: '',
                  productId: '',
                  movementType: 'inward',
                  quantity: '',
                  reason: ''
                });
                setInventory([]);
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Warehouse Inventory Display */}
      {formData.warehouseId && inventory.length > 0 && (
        <div className="row m-0 p-3 justify-content-center">
          <div className="col-lg-10">
            <h6 className="mb-3">Warehouse Inventory</h6>
            <div className={`table-responsive ${inventoryStyles.tableResponsive}`}>
              <table className={`table table-bordered borderedtable ${inventoryStyles.table}`}>
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>Product Name</th>
                    <th>SKU</th>
                    <th>Stock Quantity</th>
                    <th>Unit</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.map((item, index) => (
                    <tr key={index} className={inventoryStyles.animatedRow}>
                      <td>{index + 1}</td>
                      <td>{item.productName}</td>
                      <td>{item.sku}</td>
                      <td className="fw-bold" style={{ 
                        color: parseFloat(item.stockQuantity) > 0 ? '#28a745' : '#dc3545' 
                      }}>
                        {item.stockQuantity}
                      </td>
                      <td>{item.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* No Inventory Message */}
      {formData.warehouseId && inventory.length === 0 && !loading && (
        <div className="row m-0 p-3">
          <div className="col-12">
            <div className="alert alert-info">
              <i className="bi bi-info-circle me-2"></i>
              No inventory found for the selected warehouse.
            </div>
          </div>
        </div>
      )}

      {loading && <LoadingAnimation />}
      
      {showErrorModal && (
        <ErrorModal
          isOpen={showErrorModal}
          message={error}
          onClose={() => setShowErrorModal(false)}
        />
      )}
      
      {showSuccessModal && (
        <SuccessModal
          isOpen={showSuccessModal}
          message={success}
          onClose={() => {
            setShowSuccessModal(false);
            navigate("/inventory");
          }}
        />
      )}
    </>
  );
}

export default ManualStockManagement;
