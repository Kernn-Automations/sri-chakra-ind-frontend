import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/Auth";
import ErrorModal from "@/components/ErrorModal";
import Loading from "@/components/Loading";
import { FaUpload, FaDownload, FaSearch, FaCheck, FaTimes } from "react-icons/fa";
import styles from "../../Dashboard/HomePage/HomePage.module.css";
import storeService from "../../../services/storeService";

export default function StoreBulkPriceUpdate({ navigate }) {
  const { axiosAPI } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState(new Set());
  const [updateType, setUpdateType] = useState("percentage"); // "percentage" or "fixed"
  const [updateValue, setUpdateValue] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [priceChanges, setPriceChanges] = useState({});

  // Header Search States
  const [showHeadersSearch, setShowHeadersSearch] = useState({
    name: false,
    SKU: false
  });

  const [headerSearchTerms, setHeaderSearchTerms] = useState({
    name: "",
    SKU: ""
  });

  const toggleHeaderSearch = (key) => {
    setShowHeadersSearch(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(k => {
        next[k] = k === key ? !prev[k] : false;
      });
      return next;
    });
  };

  const handleHeaderSearchChange = (key, value) => {
    setHeaderSearchTerms(prev => ({ ...prev, [key]: value }));
  };

  const clearHeaderSearch = (key) => {
    setHeaderSearchTerms(prev => ({ ...prev, [key]: "" }));
  };

  const renderSearchHeader = (label, searchKey, dataAttr) => {
    const isSearching = showHeadersSearch[searchKey];
    const searchTerm = headerSearchTerms[searchKey];

    return (
      <th
        onClick={() => toggleHeaderSearch(searchKey)}
        style={{ cursor: "pointer", position: "relative", fontFamily: 'Poppins', fontWeight: 600, fontSize: '13px' }}
        data-search-header="true"
        {...{ [dataAttr]: true }}
      >
        {isSearching ? (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }} onClick={(e) => e.stopPropagation()}>
            <input
              type="text"
              placeholder={`Search ${label}...`}
              value={searchTerm}
              onChange={(e) => handleHeaderSearchChange(searchKey, e.target.value)}
              style={{
                flex: 1, padding: "2px 6px", border: "1px solid #ddd", borderRadius: "4px",
                fontSize: "12px", minWidth: "120px", height: "28px", color: "#000", backgroundColor: "#fff",
              }}
              autoFocus
            />
            {searchTerm && (
              <button
                onClick={(e) => { e.stopPropagation(); clearHeaderSearch(searchKey); }}
                style={{
                  padding: "4px 8px", border: "1px solid #dc3545", borderRadius: "4px",
                  background: "#dc3545", color: "#fff", cursor: "pointer", fontSize: "12px",
                  fontWeight: "bold", minWidth: "24px", height: "28px", display: "flex",
                  alignItems: "center", justifyContent: "center",
                }}
              >✕</button>
            )}
          </div>
        ) : (
          <>{label}</>
        )}
      </th>
    );
  };

  // Click outside functionality
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('[data-search-header]')) {
        setShowHeadersSearch({
          name: false,
          SKU: false
        });
      }
    };

    document.addEventListener("mousedown", handleClickOutside, true);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside, true);
    };
  }, []);

  // ESC key functionality
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === "Escape") {
        setShowHeadersSearch({
          name: false,
          SKU: false
        });
        setHeaderSearchTerms({
          name: "",
          SKU: ""
        });
      }
    };
    document.addEventListener("keydown", handleEscKey);
    return () => document.removeEventListener("keydown", handleEscKey);
  }, []);

  const closeModal = () => {
    setIsModalOpen(false);
  };

  // Debounce search to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 500); // Wait 500ms after user stops typing
    
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    calculatePriceChanges();
  }, [updateType, updateValue, selectedProducts, products]);

  // Get current store ID from localStorage
  const getStoreId = () => {
    try {
      const selectedStore = localStorage.getItem("selectedStore");
      if (selectedStore) {
        const store = JSON.parse(selectedStore);
        return store.id;
      }
      const currentStoreId = localStorage.getItem("currentStoreId");
      return currentStoreId ? parseInt(currentStoreId) : null;
    } catch (e) {
      console.error("Error parsing store data:", e);
      return null;
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const storeId = getStoreId();
      
      if (!storeId) {
        setError("Store not selected. Please select a store first.");
        setIsModalOpen(true);
        setLoading(false);
        return;
      }
      
      // Use the new bulk-update endpoint
      const response = await storeService.getStoreProductsForBulkUpdate(storeId, searchTerm);
      
      if (response.success) {
        // Map API response - API returns { id, productId, productName, sku, currentPrice, basePrice, customPrice, unit, productType, isEnabled, isActive }
        const mappedProducts = (response.data || []).map((item) => ({
          id: item.id, // Store product ID (used for bulk update)
          productId: item.productId, // Original product ID
          name: item.productName || '-',
          SKU: item.sku || '-',
          currentPrice: parseFloat(item.currentPrice || 0),
          basePrice: parseFloat(item.basePrice || 0),
          customPrice: item.customPrice ? parseFloat(item.customPrice) : null,
          unit: item.unit || 'kg',
          productType: item.productType || 'packed',
          isEnabled: item.isEnabled !== false,
          isActive: item.isActive !== false
        }));
        setProducts(mappedProducts);
      } else {
        setError(response.message || "Failed to load products");
        setIsModalOpen(true);
        setProducts([]);
      }
    } catch (err) {
      console.error("Error fetching products:", err);
      const errorMessage = err.response?.status === 403 
        ? "You don't have permission to access products for this store. Please contact your administrator."
        : err.response?.data?.message || err.message || "Failed to load products";
      setError(errorMessage);
      setIsModalOpen(true);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const calculatePriceChanges = () => {
    if (!updateValue || updateValue === "") {
      setPriceChanges({});
      return;
    }

    const changes = {};
    selectedProducts.forEach(productId => {
      const product = products.find(p => p.id === productId);
      if (product) {
        const currentPrice = product.currentPrice || 0;
        let newPrice;
        
        if (updateType === "percentage") {
          const percentage = parseFloat(updateValue);
          newPrice = currentPrice * (1 + percentage / 100);
        } else {
          const fixedAmount = parseFloat(updateValue);
          newPrice = currentPrice + fixedAmount;
        }
        
        changes[productId] = {
          current: currentPrice,
          new: Math.max(0, parseFloat(newPrice.toFixed(2)))
        };
      }
    });
    
    setPriceChanges(changes);
  };

  const handleSelectAll = () => {
    if (selectedProducts.size === filteredProducts.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(filteredProducts.map(p => p.id)));
    }
  };

  const handleSelectProduct = (productId) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  const handleApplyUpdates = async () => {
    if (selectedProducts.size === 0) {
      setError("Please select at least one product");
      setIsModalOpen(true);
      return;
    }

    if (!updateValue || updateValue === "") {
      setError("Please enter an update value");
      setIsModalOpen(true);
      return;
    }

    try {
      setLoading(true);
      const storeId = getStoreId();
      
      if (!storeId) {
        setError("Store not selected. Please select a store first.");
        setIsModalOpen(true);
        setLoading(false);
        return;
      }
      
      // Get product IDs for bulk update (using the store product ID from API)
      const productIds = Array.from(selectedProducts);
      
      // Prepare request body based on update type
      const requestBody = {
        productIds: productIds,
        ...(updateType === "percentage" 
          ? { updateType: "percentage", percentage: parseFloat(updateValue) }
          : { updateType: "fixed", fixedAmount: parseFloat(updateValue) }
        )
      };

      console.log("Bulk update request:", requestBody);

      // Use the new bulk update endpoint
      const response = await storeService.bulkUpdateStoreProductPricing(storeId, requestBody);

      console.log("Bulk update response:", response);
      
      if (response.success) {
        const summary = response.data?.summary || {};
        const updatedCount = summary.totalUpdated || 0;
        const errorCount = summary.totalErrors || 0;
        
        if (errorCount === 0) {
          setError(`✅ Successfully updated ${updatedCount} product(s)!`);
        } else {
          setError(`⚠️ Updated ${updatedCount} product(s), but ${errorCount} failed.`);
        }
        setIsModalOpen(true);
        setSelectedProducts(new Set());
        setUpdateValue("");
        setPriceChanges({});
        
        // Refresh products list
        await fetchProducts();
      } else {
        setError(response.message || "Failed to update prices");
        setIsModalOpen(true);
      }
    } catch (err) {
      console.error("Error updating prices:", err);
      setError(err.message || err.response?.data?.message || "Failed to update prices. Please try again.");
      setIsModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  // Apply client-side header search filters to API results
  const filteredProducts = products.filter((product) => {
    // Header search terms check
    if (headerSearchTerms.name && !product.name?.toLowerCase().includes(headerSearchTerms.name.toLowerCase())) {
      return false;
    }
    if (headerSearchTerms.SKU && !(product.SKU || product.sku)?.toLowerCase().includes(headerSearchTerms.SKU.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div style={{ padding: '20px' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '24px' }}>
        <p className="path">
          <span onClick={() => navigate("/store/products")}>Products</span>{" "}
          <i className="bi bi-chevron-right"></i> Bulk Update
        </p>
        <h2 style={{ 
          fontFamily: 'Poppins', 
          fontWeight: 700, 
          fontSize: '28px', 
          color: 'var(--primary-color)',
          margin: 0,
          marginBottom: '8px'
        }}>Bulk Price Update</h2>
        <p style={{ 
          fontFamily: 'Poppins', 
          fontSize: '14px', 
          color: '#666',
          margin: 0
        }}>Update prices for multiple products at once</p>
      </div>

      {/* Update Controls */}
      <div className={styles.orderStatusCard} style={{ marginBottom: '24px' }}>
        <h4 style={{ margin: 0, marginBottom: '20px', fontFamily: 'Poppins', fontWeight: 600, fontSize: '18px', color: 'var(--primary-color)' }}>
          Update Settings
        </h4>
        <div className="row mb-3">
          <div className="col-md-4">
            <label style={{ fontFamily: 'Poppins', fontWeight: 600, marginBottom: '8px', display: 'block' }}>
              Update Type
            </label>
            <select
              className="form-select"
              value={updateType}
              onChange={(e) => setUpdateType(e.target.value)}
              style={{ 
                fontFamily: 'Poppins',
                border: '1px solid #000',
                backgroundColor: '#fff',
                color: '#000'
              }}
            >
              <option value="percentage">Percentage Change</option>
              <option value="fixed">Fixed Amount Change</option>
            </select>
          </div>
          <div className="col-md-4">
            <label style={{ fontFamily: 'Poppins', fontWeight: 600, marginBottom: '8px', display: 'block' }}>
              {updateType === "percentage" ? "Percentage (%)" : "Amount (₹)"}
            </label>
            <input
              type="number"
              step={updateType === "percentage" ? "0.1" : "0.01"}
              className="form-control"
              value={updateValue}
              onChange={(e) => setUpdateValue(e.target.value)}
              placeholder={updateType === "percentage" ? "e.g., 10 for +10%" : "e.g., 50 for +₹50"}
              style={{ 
                fontFamily: 'Poppins',
                border: '1px solid #000',
                backgroundColor: '#fff',
                color: '#000'
              }}
            />
          </div>
          <div className="col-md-4" style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button
              className="btn btn-primary"
              onClick={handleApplyUpdates}
              disabled={selectedProducts.size === 0 || !updateValue}
              style={{ fontFamily: 'Poppins', width: '100%' }}
            >
              Apply to {selectedProducts.size} Selected
            </button>
          </div>
        </div>
        {selectedProducts.size > 0 && Object.keys(priceChanges).length > 0 && (
          <div style={{ padding: '12px', background: '#f8f9fa', borderRadius: '8px', marginTop: '12px' }}>
            <div style={{ fontFamily: 'Poppins', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
              Preview: {selectedProducts.size} product(s) will be updated
            </div>
          </div>
        )}
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ 
          position: 'relative',
          maxWidth: '500px'
        }}>
          <FaSearch style={{ 
            position: 'absolute', 
            left: '16px', 
            top: '50%', 
            transform: 'translateY(-50%)',
            color: '#6b7280',
            fontSize: '18px'
          }} />
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px 12px 48px',
              borderRadius: '12px',
              border: '1px solid #000',
              fontFamily: 'Poppins',
              fontSize: '14px',
              outline: 'none',
              backgroundColor: '#fff',
              color: '#000',
              transition: 'all 0.2s ease'
            }}
          />
        </div>
      </div>

      {/* Products Table */}
      <div className={styles.orderStatusCard}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h4 style={{ margin: 0, fontFamily: 'Poppins', fontWeight: 600, fontSize: '20px', color: 'var(--primary-color)' }}>
            Products ({filteredProducts.length})
          </h4>
          <button
            className="btn btn-sm btn-outline-primary"
            onClick={handleSelectAll}
            style={{ fontFamily: 'Poppins' }}
          >
            {selectedProducts.size === filteredProducts.length ? 'Deselect All' : 'Select All'}
          </button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="table table-bordered borderedtable table-sm" style={{ fontFamily: 'Poppins' }}>
            <thead className="table-light">
              <tr>
                <th style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: '13px', width: '40px' }}>
                  <input
                    type="checkbox"
                    checked={selectedProducts.size === filteredProducts.length && filteredProducts.length > 0}
                    onChange={handleSelectAll}
                  />
                </th>
                {renderSearchHeader("Product Name", "name", "data-name-header")}
                {renderSearchHeader("SKU", "SKU", "data-sku-header")}
                <th style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: '13px' }}>Current Price</th>
                <th style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: '13px' }}>New Price</th>
              </tr>
              {(headerSearchTerms.name || headerSearchTerms.SKU) && (
                <tr>
                  <td colSpan="5" style={{ padding: '4px 12px', fontSize: '12px', borderRadius: '0', backgroundColor: '#f8f9fa', color: '#666' }}>
                    {filteredProducts.length} products found
                  </td>
                </tr>
              )}
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center" style={{ padding: '20px', fontFamily: 'Poppins' }}>
                    {loading ? 'Loading products...' : 'No products found'}
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product, i) => {
                  const isSelected = selectedProducts.has(product.id);
                  const priceChange = priceChanges[product.id];
                  return (
                    <tr 
                      key={product.id} 
                      style={{ 
                        background: isSelected ? 'rgba(59, 130, 246, 0.1)' : (i % 2 === 0 ? 'rgba(59, 130, 246, 0.03)' : 'transparent'),
                        cursor: 'pointer'
                      }}
                      onClick={() => handleSelectProduct(product.id)}
                    >
                      <td>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectProduct(product.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>
                      <td style={{ fontFamily: 'Poppins', fontSize: '13px', fontWeight: 600 }}>
                        {product.name}
                      </td>
                      <td style={{ fontFamily: 'Poppins', fontSize: '12px', color: '#666' }}>
                        {product.SKU || product.sku || '-'}
                      </td>
                      <td style={{ fontFamily: 'Poppins', fontSize: '13px', fontWeight: 600, color: 'var(--primary-color)' }}>
                        ₹{Number(product.currentPrice || 0).toFixed(2)}
                      </td>
                      <td style={{ fontFamily: 'Poppins', fontSize: '13px', fontWeight: 600 }}>
                        {priceChange ? (
                          <span style={{ color: priceChange.new > priceChange.current ? 'green' : priceChange.new < priceChange.current ? 'red' : 'inherit' }}>
                            ₹{Number(priceChange.new || 0).toFixed(2)}
                          </span>
                        ) : (
                          <span style={{ color: '#999' }}>-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <ErrorModal isOpen={isModalOpen} message={error} onClose={closeModal} />
      )}

      {loading && <Loading />}
    </div>
  );
}

