import React, { useEffect, useState } from "react";
import styles from "./Inventory.module.css";
import xls from "./../../../images/xls-png.png";
import pdf from "./../../../images/pdf-png.png";

import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ErrorModal from "@/components/ErrorModal";
import { useAuth } from "@/Auth";
import { useDivision } from "@/components/context/DivisionContext";
import Loading from "@/components/Loading";
import { handleExportExcel, handleExportPDF } from "@/utils/PDFndXLSGenerator";
import { FaArrowLeftLong, FaArrowRightLong } from "react-icons/fa6";
import CustomSearchDropdown from "@/utils/CustomSearchDropDown";

function OutgoingStock({ navigate }) {
  const [onsubmit, setonsubmit] = useState(false);
  const [warehouses, setWarehouses] = useState();
  const [products, setProducts] = useState();
  const [customers, setCustomers] = useState();

  const { axiosAPI } = useAuth();
  const { selectedDivision, showAllDivisions } = useDivision();

  const [error, setError] = useState();
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const closeModal = () => {
    setIsModalOpen(false);
  };

  useEffect(() => {
    async function fetch() {
      try {
        console.log("OutgoingStock - Component mounted, fetching initial data");
        const res1 = await axiosAPI.get("/warehouses");
        const res2 = await axiosAPI.get("/customers");
        const res3 = await axiosAPI.get("/products/list");
        // console.log(res1);
        // console.log(res2);
        // console.log(res3);
        setWarehouses(res1.data.warehouses);
        setCustomers(res2.data.customers);
        setProducts(res3.data.products);
      } catch (e) {
        // console.log(e);
        setError(e.response.data.message);
        setIsModalOpen(true);
      }
    }
    fetch();
  }, []);

  // Backend

  const [stock, setStock] = useState();
  const [filteredStock, setFilteredStock] = useState();

  // Add search state variables for all searchable fields
  const [orderIdSearchTerm, setOrderIdSearchTerm] = useState("");
  const [showOrderIdSearch, setShowOrderIdSearch] = useState(false);
  const [warehouseSearchTerm, setWarehouseSearchTerm] = useState("");
  const [showWarehouseSearch, setShowWarehouseSearch] = useState(false);
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [skuSearchTerm, setSkuSearchTerm] = useState("");
  const [showSkuSearch, setShowSkuSearch] = useState(false);
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);

  const [warehouse, setWarehouse] = useState();
  const [customer, setCustomer] = useState();
  const [product, setProduct] = useState();
  const [trigger, setTrigger] = useState(false);

  const onSubmit = () => {
    setTrigger(trigger ? false : true);
  };

  const [pageNo, setPageNo] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(0);

  // Reset page number when limit changes
  useEffect(() => {
    setPageNo(1);
    setTrigger((prev) => !prev); // Trigger a refresh
  }, [limit]);

  useEffect(() => {
    async function fetch() {
      try {
        console.log("OutgoingStock - Starting fetch with params:", {
          pageNo,
          limit,
          warehouse,
          customer,
          product,
          selectedDivision: selectedDivision?.id,
          showAllDivisions,
        });
        setStock(null);
        setLoading(true);

        // ✅ Handle "All Warehouses" option - don't send warehouseId parameter
        let warehouseParam = "";
        if (warehouse && warehouse !== "all") {
          warehouseParam = `&warehouseId=${warehouse}`;
        }

        // ✅ Use correct endpoint and add division parameters
        let query = `/warehouses/inventory/outgoing?page=${pageNo}&limit=${limit}`;

        // Add showAllDivisions parameter
        if (selectedDivision?.id === "all" || showAllDivisions) {
          query += `&showAllDivisions=true`;
        } else if (selectedDivision?.id) {
          query += `&divisionId=${selectedDivision.id}`;
        }

        // Add optional filters
        if (warehouse && warehouse !== "all") {
          query += `&warehouseId=${warehouse}`;
        }
        if (customer) {
          query += `&customerId=${customer}`;
        }
        if (product) {
          query += `&productId=${product}`;
        }

        console.log(
          "OutgoingStock - Fetching stock with warehouse filter:",
          warehouse
        );
        console.log("OutgoingStock - Division ID:", selectedDivision?.id);
        console.log("OutgoingStock - Show All Divisions:", showAllDivisions);
        console.log("OutgoingStock - Final query:", query);

        const res = await axiosAPI.get(query);
        console.log("OutgoingStock - API Response:", res);
        console.log(
          "OutgoingStock - Outgoing Stock Data:",
          res.data.outgoingStock
        );
        console.log("OutgoingStock - Total Pages:", res.data.totalPages);
        console.log(
          "OutgoingStock - Expected Items:",
          limit,
          "Actual Items:",
          res.data.outgoingStock ? res.data.outgoingStock.length : 0
        );
        console.log("OutgoingStock - Full API Response Data:", res.data);

        // Validate that the API is respecting the limit parameter
        const actualItems = res.data.outgoingStock
          ? res.data.outgoingStock.length
          : 0;
        if (actualItems > limit) {
          console.warn(
            `OutgoingStock - Warning: API returned ${actualItems} items but limit was set to ${limit}`
          );
          console.warn(
            `OutgoingStock - This suggests the backend pagination might not be working correctly`
          );
          console.warn(
            `OutgoingStock - Backend response shows limit: ${res.data.limit}, total: ${res.data.total}, totalPages: ${res.data.totalPages}`
          );
        }

        // Frontend workaround: Limit the data to the requested limit
        let limitedStock = res.data.outgoingStock;
        if (actualItems > limit) {
          limitedStock = res.data.outgoingStock.slice(0, limit);
          console.log(
            `OutgoingStock - Frontend limiting data from ${actualItems} to ${limitedStock.length} items`
          );
        }

        setStock(limitedStock);
        setTotalPages(res.data.totalPages);
        console.log("OutgoingStock - Stock state set:", limitedStock);
        console.log("OutgoingStock - Total pages set:", res.data.totalPages);
      } catch (e) {
        // console.log(e);
        setError(e.response.data.message);
        setIsModalOpen(true);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [
    trigger,
    pageNo,
    limit,
    warehouse,
    customer,
    product,
    selectedDivision?.id,
    showAllDivisions,
  ]);

  // Add search filtering effect
  useEffect(() => {
    console.log("OutgoingStock - Search effect triggered:", {
      stock,
      orderIdSearchTerm,
      warehouseSearchTerm,
      productSearchTerm,
      skuSearchTerm,
      customerSearchTerm,
      filteredStock,
    });

    if (stock) {
      let filtered = stock;

      // Filter by Order ID
      if (orderIdSearchTerm) {
        filtered = filtered.filter((item) =>
          item.orderNumber
            .toLowerCase()
            .includes(orderIdSearchTerm.toLowerCase())
        );
      }

      // Filter by Warehouse Name
      if (warehouseSearchTerm) {
        filtered = filtered.filter((item) =>
          item.warehouseName
            .toLowerCase()
            .includes(warehouseSearchTerm.toLowerCase())
        );
      }

      // Filter by Product Name
      if (productSearchTerm) {
        filtered = filtered.filter((item) =>
          item.productName
            .toLowerCase()
            .includes(productSearchTerm.toLowerCase())
        );
      }

      // Filter by SKU
      if (skuSearchTerm) {
        filtered = filtered.filter((item) =>
          item.sku.toLowerCase().includes(skuSearchTerm.toLowerCase())
        );
      }

      // Filter by Customer Name
      if (customerSearchTerm) {
        filtered = filtered.filter((item) =>
          item.customerName
            .toLowerCase()
            .includes(customerSearchTerm.toLowerCase())
        );
      }

      setFilteredStock(filtered);
    }
  }, [
    stock,
    orderIdSearchTerm,
    warehouseSearchTerm,
    productSearchTerm,
    skuSearchTerm,
    customerSearchTerm,
  ]);

  // Add ESC key functionality to exit search mode
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === "Escape") {
        if (showOrderIdSearch) {
          setShowOrderIdSearch(false);
          setOrderIdSearchTerm("");
        }
        if (showWarehouseSearch) {
          setShowWarehouseSearch(false);
          setWarehouseSearchTerm("");
        }
        if (showProductSearch) {
          setShowProductSearch(false);
          setProductSearchTerm("");
        }
        if (showSkuSearch) {
          setShowSkuSearch(false);
          setSkuSearchTerm("");
        }
        if (showCustomerSearch) {
          setShowCustomerSearch(false);
          setCustomerSearchTerm("");
        }
      }
    };

    if (
      showOrderIdSearch ||
      showWarehouseSearch ||
      showProductSearch ||
      showSkuSearch ||
      showCustomerSearch
    ) {
      document.addEventListener("keydown", handleEscKey);
    }

    return () => {
      document.removeEventListener("keydown", handleEscKey);
    };
  }, [
    showOrderIdSearch,
    showWarehouseSearch,
    showProductSearch,
    showSkuSearch,
    showCustomerSearch,
  ]);

  // Add click outside functionality to exit search mode
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if click is outside any of the search headers
      const orderIdHeader = document.querySelector("[data-orderid-header]");
      const warehouseHeader = document.querySelector("[data-warehouse-header]");
      const productHeader = document.querySelector("[data-product-header]");
      const skuHeader = document.querySelector("[data-sku-header]");
      const customerHeader = document.querySelector("[data-customer-header]");

      if (
        showOrderIdSearch &&
        orderIdHeader &&
        !orderIdHeader.contains(event.target)
      ) {
        setShowOrderIdSearch(false);
        setOrderIdSearchTerm("");
      }

      if (
        showWarehouseSearch &&
        warehouseHeader &&
        !warehouseHeader.contains(event.target)
      ) {
        setShowWarehouseSearch(false);
        setWarehouseSearchTerm("");
      }

      if (
        showProductSearch &&
        productHeader &&
        !productHeader.contains(event.target)
      ) {
        setShowProductSearch(false);
        setProductSearchTerm("");
      }

      if (showSkuSearch && skuHeader && !skuHeader.contains(event.target)) {
        setShowSkuSearch(false);
        setSkuSearchTerm("");
      }

      if (
        showCustomerSearch &&
        customerHeader &&
        !customerHeader.contains(event.target)
      ) {
        setShowCustomerSearch(false);
        setCustomerSearchTerm("");
      }
    };

    if (
      showOrderIdSearch ||
      showWarehouseSearch ||
      showProductSearch ||
      showSkuSearch ||
      showCustomerSearch
    ) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [
    showOrderIdSearch,
    showWarehouseSearch,
    showProductSearch,
    showSkuSearch,
    showCustomerSearch,
  ]);

  // Function to export as Excel

  const [tableData, setTableData] = useState();

  const onExport = (type) => {
    const arr = [];
    let x = 1;
    const columns = [
      "S.No",
      "Date",
      "Order ID",
      "Warehouse Name",
      "Product Name",
      "SKU",
      "Customer Name",
      "Quantity",
      "Amount",
    ];
    const dataToExport =
      filteredStock && filteredStock.length > 0 ? filteredStock : stock;
    if (dataToExport && dataToExport.length > 0) {
      dataToExport.map((st) =>
        arr.push({
          "S.No": x++,
          Date: st.date.slice(0, 10),
          "Order ID": st.orderNumber,
          "Warehouse Name": st.warehouseName,
          "Product Name": st.productName,
          SKU: st.sku,
          "Customer Name": st.customerName,
          Quantity: st.quantity,
          Amount: st.totalAmount,
        })
      );
      setTableData(arr);

      if (type === "PDF") handleExportPDF(columns, tableData, "Outgoing-Stock");
      else if (type === "XLS")
        handleExportExcel(columns, tableData, "Outgoing-Stock");
    } else {
      setError("Table is Empty");
      setIsModalOpen(true);
    }
  };

  let index = 1;

  return (
    <>
      <p className="path">
        <span onClick={() => navigate("/inventory")}>Inventory</span>{" "}
        <i class="bi bi-chevron-right"></i> Outgoing Stock
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

        <CustomSearchDropdown
          label="Customers"
          onSelect={setCustomer}
          options={customers?.map((c) => ({ value: c.id, label: c.name }))}
        />
      </div>
      <div className="row m-0 p-3 pb-5 justify-content-center">
        <div className="col-4">
          <button className="submitbtn" onClick={onSubmit}>
            Submit
          </button>
          <button className="cancelbtn" onClick={() => navigate("/inventory")}>
            Cancel
          </button>
        </div>
      </div>

      {console.log(
        "OutgoingStock - Rendering stock section, stock value:",
        stock
      )}
      {stock && (
        <div className="row m-0 p-3 justify-content-around">
          <div className="col-lg-7">
            <button className={styles.xls} onClick={() => onExport("XLS")}>
              <p>Export to </p>
              <img src={xls} alt="" />
            </button>
            <button className={styles.xls} onClick={() => onExport("PDF")}>
              <p>Export to </p>
              <img src={pdf} alt="" />
            </button>
          </div>
          <div className={`col-lg-2 ${styles.entity}`}>
            <label htmlFor="">Entity :</label>
            <select
              name=""
              id=""
              value={limit}
              onChange={(e) => setLimit(parseInt(e.target.value))}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={30}>30</option>
              <option value={40}>40</option>
              <option value={50}>50</option>
            </select>
          </div>
          <div className="col-lg-10">
            {/* Warning when backend doesn't respect limit */}
            {stock && stock.length > limit && (
              <div className="alert alert-warning mb-2" role="alert">
                <strong>⚠️ Backend Pagination Issue:</strong> You requested{" "}
                {limit} items per page, but the backend returned {stock.length}{" "}
                items. The frontend is limiting the display to {limit} items as
                a workaround. Please contact your backend team to fix the
                pagination.
              </div>
            )}

            <table className={`table table-bordered borderedtable`}>
              <thead>
                <tr
                  className="animated-row"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <th>S.No</th>
                  <th>Date</th>
                  <th
                    onClick={() => setShowOrderIdSearch(!showOrderIdSearch)}
                    style={{ cursor: "pointer", position: "relative" }}
                    data-orderid-header
                  >
                    {showOrderIdSearch ? (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <input
                          type="text"
                          placeholder="Search by Order ID..."
                          value={orderIdSearchTerm}
                          onChange={(e) => setOrderIdSearchTerm(e.target.value)}
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
                        {orderIdSearchTerm && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOrderIdSearchTerm("");
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
                      <>Order ID</>
                    )}
                  </th>
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
                          placeholder="Search by warehouse name..."
                          value={warehouseSearchTerm}
                          onChange={(e) =>
                            setWarehouseSearchTerm(e.target.value)
                          }
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
                      <>Warehouse Name</>
                    )}
                  </th>
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
                          placeholder="Search by product name..."
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
                      <>Product Name</>
                    )}
                  </th>
                  <th
                    onClick={() => setShowSkuSearch(!showSkuSearch)}
                    style={{ cursor: "pointer", position: "relative" }}
                    data-sku-header
                  >
                    {showSkuSearch ? (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <input
                          type="text"
                          placeholder="Search by SKU..."
                          value={skuSearchTerm}
                          onChange={(e) => setSkuSearchTerm(e.target.value)}
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
                        {skuSearchTerm && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSkuSearchTerm("");
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
                      <>SKU</>
                    )}
                  </th>
                  <th
                    onClick={() => setShowCustomerSearch(!showCustomerSearch)}
                    style={{ cursor: "pointer", position: "relative" }}
                    data-customer-header
                  >
                    {showCustomerSearch ? (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <input
                          type="text"
                          placeholder="Search by customer name..."
                          value={customerSearchTerm}
                          onChange={(e) =>
                            setCustomerSearchTerm(e.target.value)
                          }
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
                        {customerSearchTerm && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setCustomerSearchTerm("");
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
                      <>Customer Name</>
                    )}
                  </th>
                  <th>Quantity</th>
                  <th>Amount</th>
                </tr>
                {(showOrderIdSearch && orderIdSearchTerm) ||
                (showWarehouseSearch && warehouseSearchTerm) ||
                (showProductSearch && productSearchTerm) ||
                (showSkuSearch && skuSearchTerm) ||
                (showCustomerSearch && customerSearchTerm) ? (
                  <tr>
                    <td
                      colSpan={9}
                      style={{
                        padding: "8px",
                        fontSize: "12px",
                        color: "#666",
                        backgroundColor: "#f8f9fa",
                      }}
                    >
                      {filteredStock
                        ? `${filteredStock.length} item(s) found`
                        : "Searching..."}
                    </td>
                  </tr>
                ) : null}
              </thead>
              <tbody>
                {console.log(
                  "OutgoingStock - Rendering table body, stock:",
                  stock,
                  "stock.length:",
                  stock?.length
                )}
                {(!stock || stock.length === 0) && (
                  <tr>
                    <td colSpan={9}>NO DATA FOUND</td>
                  </tr>
                )}
                {filteredStock &&
                  filteredStock.length > 0 &&
                  filteredStock.map((st) => (
                    <tr
                      key={st.id}
                      className="animated-row"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <td>{index++}</td>
                      <td>
                        {st.date.slice(0, 10).split("-").reverse().join("-")}
                      </td>
                      <td>{st.orderNumber}</td>
                      <td>{st.warehouseName}</td>
                      <td>{st.productName}</td>
                      <td>{st.sku}</td>
                      <td>{st.customerName}</td>
                      <td>{st.quantity}</td>
                      <td>{st.totalAmount}</td>
                    </tr>
                  ))}
              </tbody>
            </table>

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
      )}
      {isModalOpen && (
        <ErrorModal isOpen={isModalOpen} message={error} onClose={closeModal} />
      )}

      {loading && <Loading />}
    </>
  );
}

export default OutgoingStock;
