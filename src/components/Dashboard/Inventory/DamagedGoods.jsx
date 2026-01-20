import React, { useEffect, useState } from "react";
import styles from "./Inventory.module.css";
import { useAuth } from "@/Auth";
import shadows from "@mui/material/styles/shadows";
import { FaArrowLeftLong, FaArrowRightLong } from "react-icons/fa6";
import CustomSearchDropdown from "@/utils/CustomSearchDropDown";

function DamagedGoods({ navigate }) {
  const [warehouses, setWarehouses] = useState();
  const [products, setProducts] = useState();
  const [orders, setOrders] = useState([]); // Initialize as empty array

  const { axiosAPI } = useAuth();

  const [error, setError] = useState();
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const closeModal = () => {
    setIsModalOpen(false);
  };

  const [warehouse, setWarehouse] = useState("");
  const [product, setProduct] = useState("");
  const [order, setOrder] = useState("");
  const [trigger, setTrigger] = useState();
  const [filterError, setFilterError] = useState("");

  const [goods, setGoods] = useState();
  const [allGoods, setAllGoods] = useState([]); // Store all items for frontend pagination

  // Add search state variables for searchable fields
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [warehouseSearchTerm, setWarehouseSearchTerm] = useState("");
  const [showWarehouseSearch, setShowWarehouseSearch] = useState(false);

  // Pagination state
  const [pageNo, setPageNo] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(0);

  // View modal state
  const [selectedItem, setSelectedItem] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const openViewModal = (item) => {
    console.log("Opening view modal for item:", item);
    console.log("Image fields:", {
      proofFilePath: item.proofFilePath,
      proofFileSignedUrl: item.proofFileSignedUrl,
      imageFile: item.imageFile,
      image: item.image,
    });
    console.log("Full item object:", JSON.stringify(item, null, 2));
    setSelectedItem(item);
    setIsViewModalOpen(true);
  };

  const closeViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedItem(null);
  };

  // Reset page number when limit changes
  useEffect(() => {
    setPageNo(1);
  }, [limit]);

  // Refresh data when limit changes
  useEffect(() => {
    if (pageNo === 1) {
      refreshDamagedGoods();
    }
  }, [limit]);

  // Update pagination when page number changes
  useEffect(() => {
    if (allGoods.length > 0) {
      updatePagination(allGoods, pageNo, limit);
    }
  }, [pageNo, allGoods, limit]);

  // Update pagination when limit changes
  useEffect(() => {
    if (allGoods.length > 0) {
      updatePagination(allGoods, pageNo, limit);
    }
  }, [limit, allGoods, pageNo]);

  // Add ESC key functionality to exit search mode
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === "Escape") {
        if (showProductSearch) {
          setShowProductSearch(false);
          setProductSearchTerm("");
        }
        if (showWarehouseSearch) {
          setShowWarehouseSearch(false);
          setWarehouseSearchTerm("");
        }
      }
    };

    if (showProductSearch || showWarehouseSearch) {
      document.addEventListener("keydown", handleEscKey);
    }

    return () => {
      document.removeEventListener("keydown", handleEscKey);
    };
  }, [showProductSearch, showWarehouseSearch]);

  // Add click outside functionality to exit search mode
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if click is outside any of the search headers
      const productHeader = document.querySelector("[data-product-header]");
      const warehouseHeader = document.querySelector("[data-warehouse-header]");

      if (
        showProductSearch &&
        productHeader &&
        !productHeader.contains(event.target)
      ) {
        setShowProductSearch(false);
        setProductSearchTerm("");
      }

      if (
        showWarehouseSearch &&
        warehouseHeader &&
        !warehouseHeader.contains(event.target)
      ) {
        setShowWarehouseSearch(false);
        setWarehouseSearchTerm("");
      }
    };

    if (showProductSearch || showWarehouseSearch) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showProductSearch, showWarehouseSearch]);

  // Global refresh function for damaged goods
  const refreshDamagedGoods = async () => {
    try {
      setLoading(true);

      // ✅ Get division ID from localStorage for division filtering
      const currentDivisionId = localStorage.getItem("currentDivisionId");
      const currentDivisionName = localStorage.getItem("currentDivisionName");

      // ✅ Add division parameters to prevent wrong division data
      let endpoint = `/damaged-goods?page=${pageNo}&limit=${limit}`;
      if (currentDivisionId && currentDivisionId !== "1") {
        endpoint += `&divisionId=${currentDivisionId}`;
      } else if (currentDivisionId === "1") {
        endpoint += `&showAllDivisions=true`;
      }

      console.log("🔄 Refreshing damaged goods with endpoint:", endpoint);
      console.log("DamagedGoods - Division ID:", currentDivisionId);
      console.log("DamagedGoods - Division Name:", currentDivisionName);

      const res = await axiosAPI.get(endpoint);
      console.log("🔄 Refreshing damaged goods...");
      console.log("Damaged goods API response:", res.data);

      // Get all items from response
      const allItems = Array.isArray(res.data.damagedGoods)
        ? res.data.damagedGoods
        : res.data;
      console.log("All damaged goods items:", allItems);
      console.log("Total items received:", allItems.length);

      // Store all items for frontend pagination
      setAllGoods(allItems);

      // Apply frontend pagination
      updatePagination(allItems, pageNo, limit);

      console.log("✅ Damaged goods refreshed successfully");
    } catch (e) {
      console.error("❌ Error refreshing damaged goods:", e);
      setError(e.response?.data?.message);
      setIsModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  // Set global function for other components to use
  React.useEffect(() => {
    window.refreshDamagedGoods = refreshDamagedGoods;
    return () => {
      delete window.refreshDamagedGoods;
    };
  }, [pageNo, limit, trigger]);

  // On initial mount, fetch ALL damaged goods (no filters)
  useEffect(() => {
    async function fetchAllDamagedGoods() {
      try {
        setLoading(true);

        // ✅ Get division ID from localStorage for division filtering
        const currentDivisionId = localStorage.getItem("currentDivisionId");
        const currentDivisionName = localStorage.getItem("currentDivisionName");

        // ✅ Add division parameters to prevent wrong division data
        let endpoint = `/damaged-goods?page=${pageNo}&limit=${limit}`;
        if (currentDivisionId && currentDivisionId !== "1") {
          endpoint += `&divisionId=${currentDivisionId}`;
        } else if (currentDivisionId === "1") {
          endpoint += `&showAllDivisions=true`;
        }

        console.log("🔄 Fetching damaged goods with endpoint:", endpoint);
        console.log("DamagedGoods - Division ID:", currentDivisionId);
        console.log("DamagedGoods - Division Name:", currentDivisionName);

        const res = await axiosAPI.get(endpoint);
        console.log("🔄 Fetching damaged goods...");
        console.log("Damaged goods API response:", res.data);

        // Get all items from response
        const allItems = Array.isArray(res.data.damagedGoods)
          ? res.data.damagedGoods
          : res.data;
        console.log("All damaged goods items:", allItems);
        console.log("Total items received:", allItems.length);

        // Store all items for frontend pagination
        setAllGoods(allItems);

        // Apply frontend pagination
        updatePagination(allItems, pageNo, limit);
      } catch (e) {
        console.error("❌ Error fetching damaged goods:", e);
        setError(e.response?.data?.message);
        setIsModalOpen(true);
      } finally {
        setLoading(false);
      }
    }
    fetchAllDamagedGoods();
  }, [pageNo, limit, trigger]); // Added trigger to dependencies

  // Fetch orders when warehouse or product changes
  useEffect(() => {
    if (!warehouse || !product) {
      setOrders([]);
      return;
    }
    async function fetchOrders() {
      try {
        setLoading(true);
        const res = await axiosAPI.get(
          `/purchases?warehouseId=${warehouse}&productId=${product}`
        );
        setOrders(
          Array.isArray(res.data.purchaseOrders) ? res.data.purchaseOrders : []
        );
        console.log(res);
      } catch (e) {
        setError(e.response?.data?.message);
        setIsModalOpen(true);
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, [warehouse, product]);

  // Fetch dropdown data for filters on mount
  useEffect(() => {
    async function fetchDropdowns() {
      try {
        setLoading(true);

        // ✅ Get division ID from localStorage for division filtering
        const currentDivisionId = localStorage.getItem("currentDivisionId");
        const currentDivisionName = localStorage.getItem("currentDivisionName");

        // ✅ Add division parameters to warehouses endpoint
        let warehousesEndpoint = "/warehouses";
        if (currentDivisionId && currentDivisionId !== "1") {
          warehousesEndpoint += `?divisionId=${currentDivisionId}`;
        } else if (currentDivisionId === "1") {
          warehousesEndpoint += `?showAllDivisions=true`;
        }

        console.log(
          "DamagedGoods - Fetching warehouses with endpoint:",
          warehousesEndpoint
        );
        console.log("DamagedGoods - Division ID:", currentDivisionId);
        console.log("DamagedGoods - Division Name:", currentDivisionName);

        // ✅ Add division parameters to products endpoint as well
        let productsEndpoint = "/products/list";
        if (currentDivisionId && currentDivisionId !== "1") {
          productsEndpoint += `?divisionId=${currentDivisionId}`;
        } else if (currentDivisionId === "1") {
          productsEndpoint += `?showAllDivisions=true`;
        }

        console.log(
          "DamagedGoods - Fetching products with endpoint:",
          productsEndpoint
        );

        const [w, p, o] = await Promise.all([
          axiosAPI.get(warehousesEndpoint),
          axiosAPI.get(productsEndpoint),
          axiosAPI.get("/purchases?limit=100"),
        ]);
        setWarehouses(w.data.warehouses);
        setProducts(p.data.products);
        setOrders(
          Array.isArray(o.data.purchaseOrders) ? o.data.purchaseOrders : []
        );
      } catch (e) {
        setError(e.response?.data?.message);
        setIsModalOpen(true);
      } finally {
        setLoading(false);
      }
    }
    fetchDropdowns();
  }, []);

  // Format date to DD-MM-YYYY
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "-";

      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();

      return `${day}-${month}-${year}`;
    } catch (error) {
      console.error("Error formatting date:", error);
      return "-";
    }
  };

  // Handle frontend pagination
  const updatePagination = (allItems, currentPage, itemsPerPage) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedItems = allItems.slice(startIndex, endIndex);

    console.log("🔄 Frontend pagination:", {
      totalItems: allItems.length,
      currentPage,
      itemsPerPage,
      startIndex,
      endIndex,
      paginatedItemsCount: paginatedItems.length,
      totalPages: Math.ceil(allItems.length / itemsPerPage),
    });

    setGoods(paginatedItems);
    setTotalPages(Math.ceil(allItems.length / itemsPerPage));
  };

  return (
    <>
      <p className="path">
        <span onClick={() => navigate("/inventory")}>Inventory</span>{" "}
        <i class="bi bi-chevron-right"></i> Damaged Goods
      </p>

      <div className="row m-0 p-3">
        <CustomSearchDropdown
          label="Warehouse"
          onSelect={setWarehouse}
          options={warehouses?.map((w) => ({ value: w.id, label: w.name }))}
        />

        <CustomSearchDropdown
          label="Products"
          onSelect={setProduct}
          options={products?.map((p) => ({ value: p.id, label: p.name }))}
        />

        <div className={`col-3 formcontent`}>
          <label htmlFor="">Order :</label>
          <select
            name=""
            id=""
            value={order || ""}
            onChange={(e) =>
              setOrder(e.target.value === "null" ? "" : e.target.value)
            }
          >
            <option value="null">--select--</option>
            {orders &&
              orders.map((order) => (
                <option key={order.id} value={order.id}>
                  {order.ordernumber}
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* Submit/Cancel Buttons */}
      <div className="row m-0 p-3 pt-4 justify-content-center">
        <div className="col-3">
          <button
            className="submitbtn"
            onClick={async () => {
              // At least one filter must be selected
              if (!warehouse && !product && !order) {
                setFilterError(
                  "Select at least one filter (Warehouse, Product, or Order)"
                );
                return;
              }
              setFilterError("");
              setLoading(true);
              try {
                let query = "/damaged-goods";
                if (warehouse && !product && !order) {
                  // Use the correct endpoint for warehouse filtering only
                  query = `/damaged-goods/warehouse/${warehouse}`;
                } else {
                  let params = [];
                  if (warehouse) params.push(`warehouseId=${warehouse}`);
                  if (product) params.push(`productId=${product}`);
                  if (order) params.push(`orderId=${order}`);
                  if (params.length > 0) {
                    query += `?${params.join("&")}`;
                  }
                }
                const res = await axiosAPI.get(query);

                // Get filtered items
                const filteredItems = Array.isArray(res.data.damagedGoods)
                  ? res.data.damagedGoods
                  : res.data;
                console.log("Filtered items:", filteredItems);
                console.log("Total filtered items:", filteredItems.length);

                // Store filtered items and reset to page 1
                setAllGoods(filteredItems);
                setPageNo(1);

                // Apply frontend pagination
                updatePagination(filteredItems, 1, limit);
              } catch (e) {
                setError(
                  e.response?.data?.message || "Failed to fetch damaged goods"
                );
                setIsModalOpen(true);
              } finally {
                setLoading(false);
              }
            }}
          >
            Submit
          </button>
          <button className="cancelbtn" onClick={() => navigate("/inventory")}>
            Cancel
          </button>
        </div>
      </div>
      {filterError && (
        <div className="row m-0 p-0 justify-content-center">
          <div className="col-6 text-danger text-center">{filterError}</div>
        </div>
      )}

      {/* Damaged Goods Table */}
      <div className="row m-0 p-3 justify-content-center">
        <div className="col-lg-10">
          {/* Entity Limit */}
          <div className="row m-0 p-0 mb-3 justify-content-end">
            <div className="col-lg-2">
              <label htmlFor="">Entity :</label>
              <select
                name=""
                id=""
                value={limit}
                onChange={(e) => {
                  const newLimit = Number(e.target.value);
                  console.log("🔄 Entity selection changed:", {
                    oldLimit: limit,
                    newLimit,
                  });
                  setLimit(newLimit);
                }}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={30}>30</option>
                <option value={40}>40</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          {/* Pagination Info */}
          <div className="row m-0 p-0 mb-3 justify-content-between">
            <div className="col-lg-6">
              <p className="text-muted mb-0">
                Showing{" "}
                {goods && goods.length > 0 ? (pageNo - 1) * limit + 1 : 0} to{" "}
                {goods && goods.length > 0
                  ? Math.min(
                      pageNo * limit,
                      (pageNo - 1) * limit + goods.length
                    )
                  : 0}{" "}
                of {allGoods ? allGoods.length : 0} entries
                {totalPages > 1 && ` (Page ${pageNo} of ${totalPages})`}
              </p>
            </div>
          </div>

          <table className="table table-bordered borderedtable">
            <thead>
              <tr>
                <th>S.No</th>
                <th>Date</th>
                <th
                  onClick={() => setShowProductSearch(!showProductSearch)}
                  style={{ cursor: "pointer", position: "relative" }}
                  data-product-header
                >
                  {showProductSearch ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <input
                        type="text"
                        placeholder="Search by product..."
                        value={productSearchTerm}
                        onChange={(e) => setProductSearchTerm(e.target.value)}
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
                      {productSearchTerm && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setProductSearchTerm("");
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
                    <>Product</>
                  )}
                </th>
                <th>Damage Quantity</th>
                <th
                  onClick={() => setShowWarehouseSearch(!showWarehouseSearch)}
                  style={{ cursor: "pointer", position: "relative" }}
                  data-warehouse-header
                >
                  {showWarehouseSearch ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <input
                        type="text"
                        placeholder="Search by warehouse..."
                        value={warehouseSearchTerm}
                        onChange={(e) => setWarehouseSearchTerm(e.target.value)}
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
                      {warehouseSearchTerm && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setWarehouseSearchTerm("");
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
                    <>Warehouse</>
                  )}
                </th>
                <th>Action</th>
              </tr>
              {(showProductSearch && productSearchTerm) ||
              (showWarehouseSearch && warehouseSearchTerm) ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      padding: "8px",
                      fontSize: "12px",
                      color: "#666",
                      backgroundColor: "#f8f9fa",
                    }}
                  >
                    {(() => {
                      const filteredItems = allGoods.filter((item) => {
                        let pass = true;
                        if (productSearchTerm) {
                          const productName =
                            item.productName || item.product?.name || "";
                          if (
                            !productName
                              .toLowerCase()
                              .includes(productSearchTerm.toLowerCase())
                          ) {
                            pass = false;
                          }
                        }
                        if (warehouseSearchTerm) {
                          const warehouseName =
                            item.warehouseName || item.warehouse?.name || "";
                          if (
                            !warehouseName
                              .toLowerCase()
                              .includes(warehouseSearchTerm.toLowerCase())
                          ) {
                            pass = false;
                          }
                        }
                        return pass;
                      });
                      return `${filteredItems.length} item(s) found`;
                    })()}
                  </td>
                </tr>
              ) : null}
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center">
                    Loading...
                  </td>
                </tr>
              ) : (
                (() => {
                  // Apply search filters to the current page data
                  let filteredGoods = goods || [];

                  if (productSearchTerm || warehouseSearchTerm) {
                    filteredGoods = filteredGoods.filter((item) => {
                      let pass = true;

                      // Apply existing filters: warehouse, product, order
                      if (warehouse) {
                        const itemWarehouseId =
                          item.warehouseId ||
                          (item.warehouse && item.warehouse.id);
                        if (String(itemWarehouseId) !== String(warehouse))
                          pass = false;
                      }
                      if (product) {
                        const itemProductId =
                          item.productId || (item.product && item.product.id);
                        if (String(itemProductId) !== String(product))
                          pass = false;
                      }
                      if (order) {
                        if (String(item.purchaseOrderId) !== String(order))
                          pass = false;
                      }

                      // Apply new search filters
                      if (productSearchTerm) {
                        const productName =
                          item.productName || item.product?.name || "";
                        if (
                          !productName
                            .toLowerCase()
                            .includes(productSearchTerm.toLowerCase())
                        ) {
                          pass = false;
                        }
                      }
                      if (warehouseSearchTerm) {
                        const warehouseName =
                          item.warehouseName || item.warehouse?.name || "";
                        if (
                          !warehouseName
                            .toLowerCase()
                            .includes(warehouseSearchTerm.toLowerCase())
                        ) {
                          pass = false;
                        }
                      }

                      return pass;
                    });
                  }

                  return filteredGoods.length > 0 ? (
                    filteredGoods.map((item, idx) => (
                      <tr key={idx}>
                        <td>{(pageNo - 1) * limit + idx + 1}</td>
                        <td>{formatDate(item.date || item.createdAt)}</td>
                        <td>{item.productName || item.product?.name || ""}</td>
                        <td>
                          {item.damagedQuantity ||
                            item.damageQuantity ||
                            item.quantity ||
                            ""}
                        </td>
                        <td>
                          {item.warehouseName || item.warehouse?.name || ""}
                        </td>
                        <td>
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => openViewModal(item)}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center">
                        No Damaged Goods Found
                      </td>
                    </tr>
                  );
                })()
              )}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="row m-0 p-0 pt-3 justify-content-between">
            <div className={`col-2 m-0 p-0 ${styles.buttonbox}`}>
              {pageNo > 1 && (
                <button onClick={() => setPageNo(pageNo - 1)}>
                  <span>
                    <FaArrowLeftLong />
                  </span>{" "}
                  Previous
                </button>
              )}
            </div>
            <div className="col-4 text-center">
              <span className="text-muted">
                Page {pageNo} of {totalPages || 1}
              </span>
            </div>
            <div className={`col-2 m-0 p-0 ${styles.buttonbox}`}>
              {pageNo < totalPages && (
                <button onClick={() => setPageNo(pageNo + 1)}>
                  Next{" "}
                  <span>
                    <FaArrowRightLong />
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* View Modal */}
      {isViewModalOpen && selectedItem && (
        <div
          className="modal fade show"
          style={{ display: "block" }}
          tabIndex="-1"
        >
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Damaged Goods Details</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeViewModal}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6">
                    <p>
                      <strong>Date:</strong>{" "}
                      {formatDate(selectedItem.date || selectedItem.createdAt)}
                    </p>
                    <p>
                      <strong>Product ID:</strong>{" "}
                      {selectedItem.productId ||
                        selectedItem.product?.id ||
                        "-"}
                    </p>
                    <p>
                      <strong>Product Name:</strong>{" "}
                      {selectedItem.productName ||
                        selectedItem.product?.name ||
                        "-"}
                    </p>
                    <p>
                      <strong>Damaged Quantity:</strong>{" "}
                      {selectedItem.damagedQuantity ||
                        selectedItem.damageQuantity ||
                        selectedItem.quantity ||
                        "-"}
                    </p>
                    <p>
                      <strong>Reason:</strong>{" "}
                      {selectedItem.reason || selectedItem.damageReason || "-"}
                    </p>
                  </div>
                  <div className="col-md-6">
                    <p>
                      <strong>Reported By:</strong>{" "}
                      {selectedItem.reportedByName ||
                        selectedItem.user?.name ||
                        "-"}
                    </p>
                    <p>
                      <strong>Warehouse:</strong>{" "}
                      {selectedItem.warehouseName ||
                        selectedItem.warehouse?.name ||
                        "-"}
                    </p>
                    <p>
                      <strong>Warehouse ID:</strong>{" "}
                      {selectedItem.warehouseId ||
                        selectedItem.warehouse?.id ||
                        "-"}
                    </p>
                  </div>
                </div>

                {/* Damage Proof Images Section */}
                <div className="mt-3">
                  <h6>Damage Proof Images:</h6>
                  {(() => {
                    // Check multiple possible image field names
                    const possibleImageFields = [
                      "proofFileSignedUrl",
                      "proofFilePath",
                      "signedImageUrls",
                      "imageFile",
                      "image",
                      "proofImage",
                      "imageUrl",
                      "fileUrl",
                      "photo",
                      "photoUrl",
                    ];

                    let imageUrl = null;
                    let fieldName = null;

                    // Find the first field that has a valid image URL
                    for (const field of possibleImageFields) {
                      const value = selectedItem[field];
                      if (
                        value &&
                        value !== null &&
                        value !== "null" &&
                        value !== undefined &&
                        value.trim() !== "" &&
                        (typeof value === "string" || value.url)
                      ) {
                        imageUrl =
                          typeof value === "string" ? value : value.url;
                        fieldName = field;
                        break;
                      }
                    }

                    console.log("🔍 Debug - Image field check:");
                    console.log("  - Found image URL:", imageUrl);
                    console.log("  - Field name:", fieldName);
                    console.log(
                      "  - All possible fields:",
                      possibleImageFields.map((field) => ({
                        field,
                        value: selectedItem[field],
                        type: typeof selectedItem[field],
                      }))
                    );

                    if (imageUrl) {
                      return (
                        <div className="row">
                          <div className="col-md-4 mb-2">
                            <img
                              src={imageUrl}
                              alt="Damage Proof"
                              className="img-fluid rounded"
                              style={{
                                maxHeight: "200px",
                                width: "100%",
                                objectFit: "cover",
                                cursor: "pointer",
                              }}
                              onClick={() => window.open(imageUrl, "_blank")}
                              onError={(e) => {
                                console.error(
                                  "Image failed to load:",
                                  imageUrl
                                );
                                e.target.style.display = "none";
                                e.target.nextSibling.style.display = "block";
                              }}
                            />
                            <p
                              className="text-muted small mt-1"
                              style={{ display: "none" }}
                            >
                              Image failed to load: {imageUrl}
                            </p>
                            <p className="text-muted small mt-1">
                              Damage Proof Image (from {fieldName})
                            </p>
                          </div>
                        </div>
                      );
                    } else {
                      return (
                        <p className="text-muted">
                          No damage proof images available for this report.
                        </p>
                      );
                    }
                  })()}
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeViewModal}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Backdrop for modal */}
      {isViewModalOpen && <div className="modal-backdrop fade show"></div>}
    </>
  );
}

export default DamagedGoods;
