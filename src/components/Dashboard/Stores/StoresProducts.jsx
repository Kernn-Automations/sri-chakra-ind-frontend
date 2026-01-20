import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../Auth';
import { useDivision } from '../../context/DivisionContext';
import Loading from '@/components/Loading';
import ErrorModal from '@/components/ErrorModal';
import storeService from '../../../services/storeService';
import styles from './StoresProducts.module.css';

const StoresProducts = () => {
  const navigate = useNavigate();
  const { axiosAPI } = useAuth();
  const { selectedDivision, showAllDivisions } = useDivision();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [storeProductsData, setStoreProductsData] = useState([]);
  const [fbPeriods, setFbPeriods] = useState(['Fb20', 'Fb22', 'Fb24']); // Default periods, can be fetched from API
  const [skuToProductName, setSkuToProductName] = useState({}); // Mapping of SKU to Product Name
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingData, setEditingData] = useState({});
  const [saving, setSaving] = useState(false);

  // Filter states
  const [storeTypeFilter, setStoreTypeFilter] = useState("all"); // "all", "own", "franchise"
  const [selectedProducts, setSelectedProducts] = useState([]); // Multiple selected product SKUs
  const [selectedStores, setSelectedStores] = useState([]); // Multiple selected store IDs
  const [allProducts, setAllProducts] = useState([]); // All available products with {value, label}
  const [allStores, setAllStores] = useState([]); // All available stores with {value, label, zone}
  
  // Temporary filter states (before submit)
  const [tempStoreTypeFilter, setTempStoreTypeFilter] = useState("all");
  const [tempSelectedProducts, setTempSelectedProducts] = useState([]);
  const [tempSelectedStores, setTempSelectedStores] = useState([]);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [showStoreDropdown, setShowStoreDropdown] = useState(false);

  // Search states for table headers
  const [zoneSearchTerm, setZoneSearchTerm] = useState("");
  const [showZoneSearch, setShowZoneSearch] = useState(false);
  const [subZoneSearchTerm, setSubZoneSearchTerm] = useState("");
  const [showSubZoneSearch, setShowSubZoneSearch] = useState(false);
  const [storeSearchTerm, setStoreSearchTerm] = useState("");
  const [showStoreSearch, setShowStoreSearch] = useState(false);
  
  // Search states for price columns (dynamic per product)
  const [priceSearchTerms, setPriceSearchTerms] = useState({}); // { 'productSKU-selling': 'term', 'productSKU-purchase': 'term' }
  const [showPriceSearch, setShowPriceSearch] = useState({}); // { 'productSKU-selling': true/false, 'productSKU-purchase': true/false }

  useEffect(() => {
    fetchStoreProducts();
    fetchProductsForFilter();
  }, [selectedDivision, showAllDivisions]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showProductDropdown && !e.target.closest('.product-filter-dropdown')) {
        setShowProductDropdown(false);
      }
      if (showStoreDropdown && !e.target.closest('.store-filter-dropdown')) {
        setShowStoreDropdown(false);
      }
    };
    
    if (showProductDropdown || showStoreDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showProductDropdown, showStoreDropdown]);

  // ESC key handler to exit search mode
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === "Escape") {
        if (showZoneSearch) {
          setShowZoneSearch(false);
          setZoneSearchTerm("");
        }
        if (showSubZoneSearch) {
          setShowSubZoneSearch(false);
          setSubZoneSearchTerm("");
        }
        if (showStoreSearch) {
          setShowStoreSearch(false);
          setStoreSearchTerm("");
        }
        // Clear any active price searches
        const hasActivePriceSearch = Object.values(showPriceSearch).some(v => v === true);
        if (hasActivePriceSearch) {
          setShowPriceSearch({});
          setPriceSearchTerms({});
        }
      }
    };

    const hasActiveSearch = showZoneSearch || showSubZoneSearch || showStoreSearch || 
                           Object.values(showPriceSearch).some(v => v === true);
    if (hasActiveSearch) {
      document.addEventListener("keydown", handleEscKey);
      return () => document.removeEventListener("keydown", handleEscKey);
    }
  }, [showZoneSearch, showSubZoneSearch, showStoreSearch, showPriceSearch]);

  // Click outside handler to close search inputs
  useEffect(() => {
    const handleClickOutside = (event) => {
      const isClickInsideTable = event.target.closest('table');
      const isClickOnSearchInput = event.target.closest('input[type="text"]');
      const isClickOnClearButton = event.target.closest('button');
      
      if (!isClickInsideTable && !isClickOnSearchInput && !isClickOnClearButton) {
        if (showZoneSearch) {
          setShowZoneSearch(false);
          setZoneSearchTerm("");
        }
        if (showSubZoneSearch) {
          setShowSubZoneSearch(false);
          setSubZoneSearchTerm("");
        }
        if (showStoreSearch) {
          setShowStoreSearch(false);
          setStoreSearchTerm("");
        }
        // Clear any active price searches
        const hasActivePriceSearch = Object.values(showPriceSearch).some(v => v === true);
        if (hasActivePriceSearch) {
          setShowPriceSearch({});
          setPriceSearchTerms({});
        }
      }
    };

    const hasActiveSearch = showZoneSearch || showSubZoneSearch || showStoreSearch || 
                           Object.values(showPriceSearch).some(v => v === true);
    if (hasActiveSearch) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [showZoneSearch, showSubZoneSearch, showStoreSearch, showPriceSearch]);

  // Fetch products for filter from API
  const fetchProductsForFilter = async () => {
    try {
      const response = await axiosAPI.get('/products/list');
      const responseData = response.data || response;
      const products = responseData.products || (Array.isArray(responseData) ? responseData : []);
      
      // Format products for CustomSearchDropdown: {value: id/sku, label: name}
      const productOptions = products
        .filter(p => p.SKU || p.sku) // Only include products with SKU
        .map(p => ({
          value: p.SKU || p.sku,
          label: p.name || p.SKU || p.sku
        }));
      
      setAllProducts(productOptions);
      
      // Update SKU to product name mapping
      const skuMap = {};
      products.forEach(p => {
        const sku = p.SKU || p.sku;
        if (sku) {
          skuMap[sku] = p.name || sku;
        }
      });
      setSkuToProductName(prev => ({ ...prev, ...skuMap }));
    } catch (err) {
      console.error('Error fetching products for filter:', err);
      // If API call fails, fallback to extracting from existing data
    }
  };

  // Transform backend API response to component data structure
  const transformApiDataToFlatStructure = (apiData) => {
    const flattenedData = [];
    
    // API structure: zones[] -> subZones[] -> stores[] -> products[]
    apiData.forEach(zone => {
      zone.subZones?.forEach(subZone => {
        subZone.stores?.forEach(store => {
          // Build prices object from products
          const prices = {};
          
          // Extract products by SKU and map to prices structure
          store.products?.forEach(product => {
            const sku = product.SKU || product.sku; // Handle both SKU and sku
            if (sku) {
              prices[sku] = {
                sellingPrice: product.currentSellingPrice || product.customPrice || product.basePrice || null,
                purchasePrice: product.purchasePrice || null,
                // Store additional product info for reference
                productId: product.productId || product.id,
                storeProductId: product.storeProductId,
                basePrice: product.basePrice,
                stockQuantity: product.stockQuantity,
                productName: product.productName || product.name || sku // Store product name
              };
            }
          });
          
          // Add row for this store
          flattenedData.push({
            zone: zone.zone || zone.division?.name || zone.division || '',
            subZone: subZone.subZone || '',
            store: store.storeName || store.storeCode || '',
            storeId: store.storeId,
            storeCode: store.storeCode,
            prices: prices
          });
        });
      });
    });
    
    return flattenedData;
  };

  const fetchStoreProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      // Call the backend API endpoint
      const response = await storeService.getAllStoresWithProducts();
      
      // Extract data from response
      const responseData = response.data || response;
      let rawData = [];
      
      // Handle different response structures
      if (Array.isArray(responseData)) {
        rawData = responseData;
      } else if (responseData.products && Array.isArray(responseData.products)) {
        // If it's a flat list of products, we might need a dummy zone/store to display it
        // but the component expects Zones -> SubZones -> Stores structure.
        // Let's check if there's also zone/store info.
        rawData = responseData.data || responseData.zones || [];
        
        if (rawData.length === 0 && responseData.products.length > 0) {
          console.warn('Backend returned products but no zone/store structure. Creating fallback structure.');
          // Fallback: Group products into a "Default" store if no structure provided
          rawData = [{
            zone: responseData.divisionInfo?.divisionName || "Default Zone",
            subZones: [{
              subZone: "Default SubZone",
              stores: [{
                storeName: "All Products",
                storeId: "default",
                products: responseData.products.map(p => ({
                  ...p,
                  sku: p.SKU || p.sku,
                  productId: p.id
                }))
              }]
            }]
          }];
        }
      } else if (responseData.data) {
        rawData = Array.isArray(responseData.data) ? responseData.data : [responseData.data];
      }
      
      // Transform API data to flat structure (one row per store)
      const flattenedData = transformApiDataToFlatStructure(rawData);
      
      // Extract unique SKUs (Fb20, Fb22, Fb24, etc.) from all products for column headers
      // Also create mapping of SKU to Product Name
      const allSkus = new Set();
      const skuProductNameMap = {};
      const uniqueStores = new Map(); // StoreId -> Store Object
      
      flattenedData.forEach(row => {
        Object.keys(row.prices || {}).forEach(sku => {
          allSkus.add(sku);
          // Store product name for this SKU (use first occurrence or update if different)
          if (row.prices[sku]?.productName && !skuProductNameMap[sku]) {
            skuProductNameMap[sku] = row.prices[sku].productName;
          }
        });
        
        // Collect unique stores for filter
        if (row.storeId && !uniqueStores.has(row.storeId)) {
          uniqueStores.set(row.storeId, {
            value: row.storeId,
            label: row.store || row.storeCode || `Store ${row.storeId}`,
            zone: row.zone
          });
        }
      });
      const sortedSkus = Array.from(allSkus).sort();
      
      // Update periods if we found different SKUs
      if (sortedSkus.length > 0) {
        setFbPeriods(sortedSkus);
      }
      
      // Update SKU to Product Name mapping (merge with existing)
      setSkuToProductName(prev => ({ ...prev, ...skuProductNameMap }));
      
      // Only update allProducts if not already set from API
      if (allProducts.length === 0) {
        const productOptions = sortedSkus.map(sku => ({
          value: sku,
          label: skuProductNameMap[sku] || sku
        }));
        setAllProducts(productOptions);
      }
      
      // Populate all stores for filter
      setAllStores(Array.from(uniqueStores.values()).sort((a, b) => a.label.localeCompare(b.label)));
      
      setStoreProductsData(flattenedData);
    } catch (err) {
      console.error('Error fetching store products:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch store products';
      setError(errorMessage);
      setIsErrorModalOpen(true);
      setStoreProductsData([]);
    } finally {
      setLoading(false);
    }
  };

  const closeErrorModal = () => {
    setIsErrorModalOpen(false);
    setError(null);
  };

  const handleSubmitFilters = () => {
    setStoreTypeFilter(tempStoreTypeFilter);
    setSelectedProducts(tempSelectedProducts);
    setSelectedStores(tempSelectedStores);
    setShowProductDropdown(false);
    setShowStoreDropdown(false);
  };

  const handleCancelFilters = () => {
    setTempStoreTypeFilter("all");
    setTempSelectedProducts([]);
    setTempSelectedStores([]);
    setStoreTypeFilter("all");
    setSelectedProducts([]);
    setSelectedStores([]);
    setShowProductDropdown(false);
    setShowStoreDropdown(false);
  };

  const handleEditClick = () => {
    setIsEditMode(true);
    // Initialize editing data with current data
    // Use the same rowId format as the table uses
    const editData = {};
    
    // Create rowIds using storeId for stability across filters
    // IMPORTANT: Deep copy prices to avoid mutating original data
    storeProductsData.forEach((row) => {
      const rowKey = row.storeId;
      
      // Deep copy prices object to avoid reference issues
      const deepCopiedPrices = {};
      if (row.prices) {
        Object.keys(row.prices).forEach(sku => {
          deepCopiedPrices[sku] = {
            ...row.prices[sku]
          };
        });
      }
      
      editData[rowKey] = {
        ...row,
        prices: deepCopiedPrices
      };
    });
    
    console.log('Initialized editing data:', editData);
    setEditingData(editData);
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditingData({});
  };

  const handlePriceChange = (rowKey, fb, priceType, value) => {
    setEditingData(prev => {
      const newData = { ...prev };
      if (!newData[rowKey]) {
        // Find the original row data by matching properties
        // Find the original row by matching storeId (rowKey is storeId)
        const originalRow = storeProductsData.find(row => row.storeId === rowKey);
        
        // If not found by direct ID match, try property matching as fallback
        const targetRow = originalRow || storeProductsData.find(row => 
          (prev[rowKey] && row.storeId === prev[rowKey].storeId)
        );

        if (targetRow) {
           // Deep copy prices
           const deepCopiedPrices = {};
           if (targetRow.prices) {
             Object.keys(targetRow.prices).forEach(sku => {
               deepCopiedPrices[sku] = { ...targetRow.prices[sku] };
             });
           }
           newData[rowKey] = {
             ...targetRow,
             prices: deepCopiedPrices
           };
        } else {
             console.warn('Could not find original row for key:', rowKey);
             // Create a dummy entry to prevent crash, but this shouldn't happen with stable IDs
             newData[rowKey] = { prices: {} };
        }
      }
      if (!newData[rowKey].prices) {
        newData[rowKey].prices = {};
      }
      if (!newData[rowKey].prices[fb]) {
        newData[rowKey].prices[fb] = {};
      }
      const parsedValue = value === '' || value === null || value === undefined ? null : parseFloat(value);
      newData[rowKey].prices[fb][priceType] = parsedValue;
      
      console.log('Price changed:', { rowKey, fb, priceType, value, parsedValue, newData: newData[rowKey].prices[fb] });
      
      return newData;
    });
  };

  const handleSavePrices = async () => {
    try {
      setSaving(true);
      setError(null);

      // Collect all price changes grouped by storeId
      const updatesByStore = {};
      
      console.log('=== SAVE PRICES DEBUG START ===');
      console.log('editingData:', editingData);
      console.log('storeProductsData:', storeProductsData);
      
      // Iterate through all edited rows
      Object.keys(editingData).forEach(rowKey => {
        const editRow = editingData[rowKey];
        
        // Find the original row by matching storeId, zone, subZone, and store name
        const originalRow = storeProductsData.find(row => {
          return row.storeId === editRow.storeId && 
                 row.zone === editRow.zone && 
                 row.subZone === editRow.subZone &&
                 row.store === editRow.store;
        });
        
        if (!originalRow || !editRow.prices) {
          console.log('Skipping row:', { rowKey, hasOriginal: !!originalRow, hasPrices: !!editRow.prices });
          return;
        }
        
        const storeId = originalRow.storeId;
        if (!storeId) return;
        
        if (!updatesByStore[storeId]) {
          updatesByStore[storeId] = [];
        }
        
        // Compare original and edited prices to find changes
        const allSkus = new Set([
          ...Object.keys(originalRow.prices || {}),
          ...Object.keys(editRow.prices || {})
        ]);
        
        allSkus.forEach(sku => {
          const originalPrice = originalRow.prices?.[sku];
          const editedPrice = editRow.prices?.[sku];
          
          if (!originalPrice) {
            return;
          }
          
          // If editedPrice doesn't exist, it means this SKU wasn't edited, so skip it
          if (!editedPrice) {
            return;
          }
          
          // Helper to normalize price values
          const normalizePrice = (price) => {
            if (price === null || price === undefined || price === '' || price === 'null') return null;
            if (typeof price === 'number') return isNaN(price) ? null : price;
            const num = parseFloat(String(price));
            return isNaN(num) ? null : num;
          };
          
          // Get normalized prices
          const origSelling = normalizePrice(originalPrice.sellingPrice);
          const editSelling = normalizePrice(editedPrice.sellingPrice);
          const origPurchase = normalizePrice(originalPrice.purchasePrice);
          const editPurchase = normalizePrice(editedPrice.purchasePrice);
          
          // Compare prices (handle null and numbers)
          const isDifferent = (a, b) => {
            if (a === null && b === null) return false;
            if (a === null || b === null) return true;
            return Math.abs(a - b) >= 0.01; // Consider different if difference >= 0.01
          };
          
          const sellingChanged = isDifferent(origSelling, editSelling);
          const purchaseChanged = isDifferent(origPurchase, editPurchase);
          
          console.log(`SKU ${sku}:`, {
            origSelling,
            editSelling,
            sellingChanged,
            origPurchase,
            editPurchase,
            purchaseChanged,
            originalPriceObj: originalPrice,
            editedPriceObj: editedPrice
          });
          
          if (sellingChanged || purchaseChanged) {
            const productId = originalPrice.productId;
            if (!productId) {
              console.warn('Missing productId for SKU:', sku);
              return;
            }
            
            const existingUpdate = updatesByStore[storeId].find(u => u.productId === productId);
            const updatePayload = {
              productId: productId,
              customPrice: editSelling, // Always use edited value
              purchasePrice: editPurchase // Always use edited value
            };
            
            if (existingUpdate) {
              Object.assign(existingUpdate, updatePayload);
            } else {
              updatesByStore[storeId].push(updatePayload);
            }
            
            console.log('✅ Added update for productId:', productId, updatePayload);
          }
        });
      });
      
      console.log('=== FINAL UPDATES ===', updatesByStore);
      
      console.log('Final updatesByStore:', updatesByStore);
      
      // Check if there are any updates to save
      const totalUpdates = Object.values(updatesByStore).reduce((sum, updates) => sum + updates.length, 0);
      console.log('Total updates detected:', totalUpdates);
      console.log('Updates by store:', updatesByStore);
      
      if (totalUpdates === 0) {
        console.log('No updates detected. Debug info:', {
          editingDataKeys: Object.keys(editingData),
          storeProductsDataLength: storeProductsData.length,
          sampleEditingData: Object.keys(editingData).slice(0, 2).map(key => ({
            key,
            prices: editingData[key]?.prices
          })),
          sampleOriginalData: storeProductsData.slice(0, 2).map(row => ({
            store: row.store,
            prices: row.prices
          }))
        });
        setError('No price changes detected. Please edit prices before saving.');
        setIsErrorModalOpen(true);
        setSaving(false);
        return;
      }
      
      // Log updates for debugging
      console.log('Price updates to be saved:', updatesByStore);
      console.log(`Total updates: ${totalUpdates} across ${Object.keys(updatesByStore).length} stores`);
      
      // Update prices for each store
      const updatePromises = Object.keys(updatesByStore).map(async (storeId) => {
        const updates = updatesByStore[storeId];
        if (updates.length === 0) return;
        
        // Update each product individually using updateStoreProductPricing
        const productUpdates = updates.map(async (update) => {
          const payload = {
            productId: update.productId
          };
          
          // Only include fields that are defined
          if (update.customPrice !== undefined) {
            payload.customPrice = update.customPrice;
          }
          if (update.purchasePrice !== undefined) {
            payload.purchasePrice = update.purchasePrice;
          }
          
          console.log(`Updating product ${update.productId} in store ${storeId} with payload:`, payload);
          
          try {
            const response = await storeService.updateStoreProductPricing(storeId, payload);
            console.log(`Successfully updated product ${update.productId} in store ${storeId}:`, response);
            return response;
          } catch (err) {
            console.error(`Error updating product ${update.productId} in store ${storeId}:`, err);
            console.error('Error details:', {
              status: err.response?.status,
              statusText: err.response?.statusText,
              data: err.response?.data,
              message: err.message
            });
            throw err; // Re-throw to be caught by outer catch
          }
        });
        
        return Promise.all(productUpdates);
      });
      
      // Wait for all updates to complete
      await Promise.all(updatePromises);
      
      console.log('All price updates completed successfully');
      
      // Refresh data from backend to ensure consistency (DO NOT update local state first)
      await fetchStoreProducts();
      
      // Clear edit mode after successful save
      setIsEditMode(false);
      setEditingData({});
      
      // Show success message
      alert(`Successfully updated ${totalUpdates} product price(s)!`);
    } catch (err) {
      console.error('Error saving prices:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to save prices';
      setError(errorMessage);
      setIsErrorModalOpen(true);
    } finally {
      setSaving(false);
    }
  };

  // Apply filters
  const filteredStoreData = storeProductsData.filter(row => {
    // Apply store type filter
    if (storeTypeFilter !== "all") {
      const storeType = row.storeType || row.type || "own"; // Default to "own" if not specified
      if (storeTypeFilter === "own" && storeType !== "own") return false;
      if (storeTypeFilter === "franchise" && storeType !== "franchise") return false;
    }

    // Apply store (from multi-select) filter
    if (selectedStores.length > 0) {
      if (!selectedStores.some(id => id === row.storeId)) return false;
    }

    // Apply zone search filter
    if (zoneSearchTerm) {
      const zone = (row.zone || "").toString().toLowerCase();
      if (!zone.includes(zoneSearchTerm.toLowerCase())) return false;
    }

    // Apply sub zone search filter
    if (subZoneSearchTerm) {
      const subZone = (row.subZone || "").toString().toLowerCase();
      if (!subZone.includes(subZoneSearchTerm.toLowerCase())) return false;
    }

    // Apply store search filter
    if (storeSearchTerm) {
      const store = (row.store || "").toString().toLowerCase();
      if (!store.includes(storeSearchTerm.toLowerCase())) return false;
    }

    // Apply price search filters
    for (const key in priceSearchTerms) {
      const searchTerm = priceSearchTerms[key];
      if (searchTerm) {
        const [productSKU, priceType] = key.split('-');
        const prices = row.prices || {};
        const productPrice = prices[productSKU];
        
        if (productPrice) {
          const priceValue = priceType === 'selling' 
            ? (productPrice.sellingPrice || "").toString().toLowerCase()
            : (productPrice.purchasePrice || "").toString().toLowerCase();
          
          if (!priceValue.includes(searchTerm.toLowerCase())) return false;
        } else {
          // If product doesn't exist in this row and we're searching for it, filter it out
          return false;
        }
      }
    }

    return true;
  });

  // Filter products to display based on selection
  const productsToDisplay = selectedProducts.length > 0 ? selectedProducts : fbPeriods;

  if (loading && storeProductsData.length === 0) {
    return <Loading />;
  }

  return (
    <div className={styles.container}>
      <p className="path">
        <span onClick={() => navigate("/divisions?tab=stores")}>Stores</span>{" "}
        <i className="bi bi-chevron-right"></i> Stores Products
      </p>
      <div className={styles.header}>
        <h1>Stores Products</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          {!isEditMode ? (
            <button
              className="homebtn"
              onClick={handleEditClick}
            >
              <i className="bi bi-pencil"></i> Edit Prices
            </button>
          ) : (
            <>
              <button
                className="homebtn"
                onClick={handleSavePrices}
                disabled={saving}
                style={{ background: '#28a745' }}
              >
                {saving ? 'Saving...' : <><i className="bi bi-check"></i> Save</>}
              </button>
              <button
                className="homebtn"
                onClick={handleCancelEdit}
                disabled={saving}
                style={{ background: '#6c757d' }}
              >
                <i className="bi bi-x"></i> Cancel
              </button>
            </>
          )}
          <button
            className="homebtn"
            onClick={() => navigate('/divisions?tab=stores')}
          >
            Back to Stores
          </button>
        </div>
      </div>

      {error && !isErrorModalOpen && (
        <div className={styles.errorBanner}>
          <p>{error}</p>
          <button onClick={fetchStoreProducts}>Retry</button>
        </div>
      )}

      {/* Filters Section */}
      <div className="row m-0 p-3">
        <div className="col-2 formcontent">
          <label htmlFor="">Store Type:</label>
          <select
            value={tempStoreTypeFilter}
            onChange={(e) => setTempStoreTypeFilter(e.target.value)}
          >
            <option value="all">All Stores</option>
            <option value="own">Own</option>
            <option value="franchise">Franchise</option>
          </select>
        </div>

        {/* Store Filter - New */}
        <div className="col-3 formcontent" style={{ position: 'relative' }}>
          <label htmlFor="">Stores:</label>
          <select
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowStoreDropdown(!showStoreDropdown);
              setShowProductDropdown(false); // Close other dropdown
            }}
            onMouseDown={(e) => {
              e.preventDefault();
            }}
            value=""
            readOnly
            style={{
              cursor: 'pointer',
              appearance: 'auto',
              pointerEvents: 'auto'
            }}
          >
            <option value="">
              {tempSelectedStores.length > 0 
                ? `${tempSelectedStores.length} store(s) selected` 
                : "All Stores"}
            </option>
          </select>
          
          {showStoreDropdown && (
            <div 
              style={{
                position: 'absolute',
                top: '100%',
                left: '0',
                right: '0',
                zIndex: 999,
                background: 'white',
                border: '1px solid #000',
                borderRadius: '4px',
                marginTop: '4px',
                maxHeight: '200px',
                overflowY: 'auto',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {allStores.map(store => {
                const isSelected = tempSelectedStores.includes(store.value);
                return (
                  <div
                    key={store.value}
                    onClick={(e) => {
                      e.stopPropagation();
                      setTempSelectedStores(prev => {
                        if (prev.includes(store.value)) {
                          return prev.filter(s => s !== store.value);
                        } else {
                          return [...prev, store.value];
                        }
                      });
                    }}
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      fontFamily: 'Poppins',
                      fontSize: '14px',
                      backgroundColor: isSelected ? '#2563eb' : 'transparent',
                      color: isSelected ? '#fff' : '#000',
                      transition: 'all 0.2s ease',
                      borderBottom: '1px solid #e5e7eb'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = '#f3f4f6';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    {store.label}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="col-3 formcontent" style={{ position: 'relative' }}>
          <label htmlFor="">Products:</label>
          <select
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowProductDropdown(!showProductDropdown);
              setShowStoreDropdown(false); // Close other dropdown
            }}
            onMouseDown={(e) => {
              e.preventDefault();
            }}
            value=""
            readOnly
            style={{
              cursor: 'pointer',
              appearance: 'auto',
              pointerEvents: 'auto'
            }}
          >
            <option value="">
              {tempSelectedProducts.length > 0 
                ? `${tempSelectedProducts.length} product(s) selected` 
                : 'Select products'}
            </option>
          </select>

          {showProductDropdown && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: '0',
                right: '0',
                zIndex: 999,
                background: 'white',
                border: '1px solid #000',
                borderRadius: '4px',
                marginTop: '4px',
                maxHeight: '200px',
                overflowY: 'auto',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {allProducts.map((product) => {
                const isSelected = tempSelectedProducts.includes(product.value);
                return (
                  <div
                    key={product.value}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isSelected) {
                        setTempSelectedProducts(tempSelectedProducts.filter(p => p !== product.value));
                      } else {
                        setTempSelectedProducts([...tempSelectedProducts, product.value]);
                      }
                    }}
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      fontFamily: 'Poppins',
                      fontSize: '14px',
                      backgroundColor: isSelected ? '#2563eb' : 'transparent',
                      color: isSelected ? '#fff' : '#000',
                      transition: 'all 0.2s ease',
                      borderBottom: '1px solid #e5e7eb'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = '#f3f4f6';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    {product.label}
                  </div>
                );
              })}
            </div>
          )}
        </div>

      <div className="col-4 formcontent" style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
          <button 
            className="submitbtn"
            onClick={handleSubmitFilters}
            style={{ margin: 0 }}
          >
            Submit
          </button>
          <button 
            className="cancelbtn"
            onClick={handleCancelFilters}
            style={{ margin: 0 }}
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Selected Filters Display */}
      {(selectedStores.length > 0 || selectedProducts.length > 0) && (
        <div className="row mt-2 mb-2">
          <div className="col-12" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {selectedStores.map(storeId => {
              const store = allStores.find(s => s.value === storeId);
              return (
                <div 
                  key={storeId}
                  style={{
                    backgroundColor: '#e0f2fe',
                    color: '#0369a1',
                    padding: '4px 12px',
                    borderRadius: '16px',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    border: '1px solid #bae6fd'
                  }}
                >
                  <span style={{ fontWeight: '500' }}>Store:</span>
                  <span>{store?.label || storeId}</span>
                  <i 
                    className="bi bi-x" 
                    style={{ cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center' }}
                    onClick={() => {
                      setSelectedStores(prev => prev.filter(id => id !== storeId));
                      setTempSelectedStores(prev => prev.filter(id => id !== storeId));
                    }}
                  ></i>
                </div>
              );
            })}
            
            {selectedProducts.map(prodId => {
              const product = allProducts.find(p => p.value === prodId);
              return (
                <div 
                  key={prodId}
                  style={{
                    backgroundColor: '#f0fdf4',
                    color: '#15803d',
                    padding: '4px 12px',
                    borderRadius: '16px',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    border: '1px solid #bbf7d0'
                  }}
                >
                  <span style={{ fontWeight: '500' }}>Product:</span>
                  <span>{product?.label || prodId}</span>
                  <i 
                    className="bi bi-x" 
                    style={{ cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center' }}
                    onClick={() => {
                      setSelectedProducts(prev => prev.filter(id => id !== prodId));
                      setTempSelectedProducts(prev => prev.filter(id => id !== prodId));
                    }}
                  ></i>
                </div>
              );
            })}
            
             <button
              onClick={() => {
                setSelectedStores([]);
                setTempSelectedStores([]);
                setSelectedProducts([]);
                setTempSelectedProducts([]);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#dc2626',
                fontSize: '13px',
                textDecoration: 'underline',
                cursor: 'pointer',
                padding: '4px 8px'
              }}
            >
              Clear all
            </button>
          </div>
        </div>
      )}

      <div className={styles.tableContainer}>
        <div className={styles.tableWrapper}>
          <table className={`table table-bordered borderedtable ${styles.productsTable}`}>
            <thead>
              <tr>
                <th 
                  rowSpan="2" 
                  className={styles.zoneColumn}
                  onClick={() => setShowZoneSearch(!showZoneSearch)}
                  style={{ cursor: "pointer", position: "relative" }}
                >
                  {showZoneSearch ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <input
                        type="text"
                        placeholder="Search zone..."
                        value={zoneSearchTerm}
                        onChange={(e) => setZoneSearchTerm(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          flex: 1,
                          padding: "2px 6px",
                          border: "1px solid #ddd",
                          borderRadius: "4px",
                          fontSize: "12px",
                          minWidth: "80px",
                          height: "28px",
                          color: "#000",
                          backgroundColor: "#fff",
                        }}
                        autoFocus
                      />
                      {zoneSearchTerm && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setZoneSearchTerm("");
                          }}
                          style={{
                            padding: "4px 8px",
                            border: "1px solid #dc3545",
                            borderRadius: "4px",
                            background: "#dc3545",
                            color: "#fff",
                            cursor: "pointer",
                            fontSize: "12px",
                            fontWeight: "bold",
                            minWidth: "24px",
                            height: "28px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ) : (
                    <>Zone</>
                  )}
                </th>
                <th 
                  rowSpan="2" 
                  className={styles.subZoneColumn}
                  onClick={() => setShowSubZoneSearch(!showSubZoneSearch)}
                  style={{ cursor: "pointer", position: "relative" }}
                >
                  {showSubZoneSearch ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <input
                        type="text"
                        placeholder="Search sub zone..."
                        value={subZoneSearchTerm}
                        onChange={(e) => setSubZoneSearchTerm(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          flex: 1,
                          padding: "2px 6px",
                          border: "1px solid #ddd",
                          borderRadius: "4px",
                          fontSize: "12px",
                          minWidth: "100px",
                          height: "28px",
                          color: "#000",
                          backgroundColor: "#fff",
                        }}
                        autoFocus
                      />
                      {subZoneSearchTerm && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSubZoneSearchTerm("");
                          }}
                          style={{
                            padding: "4px 8px",
                            border: "1px solid #dc3545",
                            borderRadius: "4px",
                            background: "#dc3545",
                            color: "#fff",
                            cursor: "pointer",
                            fontSize: "12px",
                            fontWeight: "bold",
                            minWidth: "24px",
                            height: "28px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ) : (
                    <>Sub Zone</>
                  )}
                </th>
                <th 
                  rowSpan="2" 
                  className={styles.storeColumn}
                  onClick={() => setShowStoreSearch(!showStoreSearch)}
                  style={{ cursor: "pointer", position: "relative" }}
                >
                  {showStoreSearch ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <input
                        type="text"
                        placeholder="Search store..."
                        value={storeSearchTerm}
                        onChange={(e) => setStoreSearchTerm(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          flex: 1,
                          padding: "2px 6px",
                          border: "1px solid #ddd",
                          borderRadius: "4px",
                          fontSize: "12px",
                          minWidth: "120px",
                          height: "28px",
                          color: "#000",
                          backgroundColor: "#fff",
                        }}
                        autoFocus
                      />
                      {storeSearchTerm && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setStoreSearchTerm("");
                          }}
                          style={{
                            padding: "4px 8px",
                            border: "1px solid #dc3545",
                            borderRadius: "4px",
                            background: "#dc3545",
                            color: "#fff",
                            cursor: "pointer",
                            fontSize: "12px",
                            fontWeight: "bold",
                            minWidth: "24px",
                            height: "28px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ) : (
                    <>Store</>
                  )}
                </th>
                {productsToDisplay.map((fb) => (
                  <th key={fb} colSpan="2" className={styles.fbHeader}>
                    {skuToProductName[fb] || fb}
                  </th>
                ))}
              </tr>
              <tr>
                {productsToDisplay.map((fb) => (
                  <React.Fragment key={fb}>
                    <th 
                      className={styles.priceHeader}
                      onClick={() => {
                        const key = `${fb}-selling`;
                        setShowPriceSearch(prev => ({
                          ...prev,
                          [key]: !prev[key]
                        }));
                      }}
                      style={{ cursor: "pointer", position: "relative" }}
                    >
                      {showPriceSearch[`${fb}-selling`] ? (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <input
                            type="text"
                            placeholder="Search price..."
                            value={priceSearchTerms[`${fb}-selling`] || ""}
                            onChange={(e) => {
                              const key = `${fb}-selling`;
                              setPriceSearchTerms(prev => ({
                                ...prev,
                                [key]: e.target.value
                              }));
                            }}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              flex: 1,
                              padding: "2px 6px",
                              border: "1px solid #ddd",
                              borderRadius: "4px",
                              fontSize: "12px",
                              minWidth: "80px",
                              height: "28px",
                              color: "#000",
                              backgroundColor: "#fff",
                            }}
                            autoFocus
                          />
                          {priceSearchTerms[`${fb}-selling`] && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const key = `${fb}-selling`;
                                setPriceSearchTerms(prev => {
                                  const newTerms = { ...prev };
                                  delete newTerms[key];
                                  return newTerms;
                                });
                              }}
                              style={{
                                padding: "4px 8px",
                                border: "1px solid #dc3545",
                                borderRadius: "4px",
                                background: "#dc3545",
                                color: "#fff",
                                cursor: "pointer",
                                fontSize: "12px",
                                fontWeight: "bold",
                                minWidth: "24px",
                                height: "28px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ) : (
                        <>Selling Price</>
                      )}
                    </th>
                    <th 
                      className={styles.priceHeader}
                      onClick={() => {
                        const key = `${fb}-purchase`;
                        setShowPriceSearch(prev => ({
                          ...prev,
                          [key]: !prev[key]
                        }));
                      }}
                      style={{ cursor: "pointer", position: "relative" }}
                    >
                      {showPriceSearch[`${fb}-purchase`] ? (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <input
                            type="text"
                            placeholder="Search price..."
                            value={priceSearchTerms[`${fb}-purchase`] || ""}
                            onChange={(e) => {
                              const key = `${fb}-purchase`;
                              setPriceSearchTerms(prev => ({
                                ...prev,
                                [key]: e.target.value
                              }));
                            }}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              flex: 1,
                              padding: "2px 6px",
                              border: "1px solid #ddd",
                              borderRadius: "4px",
                              fontSize: "12px",
                              minWidth: "80px",
                              height: "28px",
                              color: "#000",
                              backgroundColor: "#fff",
                            }}
                            autoFocus
                          />
                          {priceSearchTerms[`${fb}-purchase`] && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const key = `${fb}-purchase`;
                                setPriceSearchTerms(prev => {
                                  const newTerms = { ...prev };
                                  delete newTerms[key];
                                  return newTerms;
                                });
                              }}
                              style={{
                                padding: "4px 8px",
                                border: "1px solid #dc3545",
                                borderRadius: "4px",
                                background: "#dc3545",
                                color: "#fff",
                                cursor: "pointer",
                                fontSize: "12px",
                                fontWeight: "bold",
                                minWidth: "24px",
                                height: "28px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ) : (
                        <>Purchase Price</>
                      )}
                    </th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredStoreData.length === 0 ? (
                <tr>
                  <td colSpan={3 + productsToDisplay.length * 2} className={styles.noData}>
                    {storeProductsData.length === 0 ? 'No store products data found' : 'No stores match the selected filters'}
                  </td>
                </tr>
              ) : (() => {
                // Group data by zone and sub-zone to calculate rowspans
                const groupedData = filteredStoreData.reduce((acc, row) => {
                  const key = `${row.zone}-${row.subZone}`;
                  if (!acc[key]) {
                    acc[key] = [];
                  }
                  acc[key].push(row);
                  return acc;
                }, {});

                // Flatten grouped data with rowspan information
                const rowsWithRowspan = [];
                Object.values(groupedData).forEach((group) => {
                  group.forEach((row, index) => {
                    rowsWithRowspan.push({
                      ...row,
                      isFirstInGroup: index === 0,
                      rowspan: group.length,
                      rowId: row.storeId // Use stable storeId as key
                    });
                  });
                });

                return rowsWithRowspan.map((row, index) => {
                  const rowKey = row.rowId || index;
                  const editRow = editingData[rowKey] || row;
                  return (
                    <tr key={rowKey}>
                      {row.isFirstInGroup && (
                        <>
                          <td rowSpan={row.rowspan} className={styles.zoneCell}>
                            {row.zone || '-'}
                          </td>
                          <td rowSpan={row.rowspan} className={styles.subZoneCell}>
                            {row.subZone || '-'}
                          </td>
                        </>
                      )}
                      <td>{row.store || '-'}</td>
                      {productsToDisplay.map((fb) => (
                        <React.Fragment key={fb}>
                          <td className={styles.priceCell}>
                            {isEditMode ? (
                              <input
                                type="number"
                                className={styles.priceInput}
                                value={editRow.prices?.[fb]?.sellingPrice || ''}
                                onChange={(e) => handlePriceChange(rowKey, fb, 'sellingPrice', e.target.value)}
                                placeholder="-"
                                min="0"
                                step="0.01"
                              />
                            ) : (
                              editRow.prices?.[fb]?.sellingPrice || '-'
                            )}
                          </td>
                          <td className={styles.priceCell}>
                            {isEditMode ? (
                              <input
                                type="number"
                                className={styles.priceInput}
                                value={editRow.prices?.[fb]?.purchasePrice || ''}
                                onChange={(e) => handlePriceChange(rowKey, fb, 'purchasePrice', e.target.value)}
                                placeholder="-"
                                min="0"
                                step="0.01"
                              />
                            ) : (
                              editRow.prices?.[fb]?.purchasePrice || '-'
                            )}
                          </td>
                        </React.Fragment>
                      ))}
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>
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

export default StoresProducts;

