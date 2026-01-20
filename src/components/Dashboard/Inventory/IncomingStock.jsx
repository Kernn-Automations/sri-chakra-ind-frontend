import React, { useEffect, useState } from "react";
import styles from "./Inventory.module.css";
import xls from "./../../../images/xls-png.png";
import pdf from "./../../../images/pdf-png.png";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useAuth } from "@/Auth";
import { useDivision } from "@/components/context/DivisionContext";
import ErrorModal from "@/components/ErrorModal";
import Loading from "@/components/Loading";
import { handleExportExcel, handleExportPDF } from "@/utils/PDFndXLSGenerator";
import { FaArrowLeftLong, FaArrowRightLong } from "react-icons/fa6";
import { FaSearch } from "react-icons/fa";
import CustomSearchDropdown from "@/utils/CustomSearchDropDown";
function IncomingStock({ navigate }) {
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
        // ✅ Get division ID from context for division filtering
        const currentDivisionId = selectedDivision?.id;

        // ✅ Add division parameters to prevent wrong division data
        let warehouseEndpoint = "/warehouse";
        let customersEndpoint = "/customers";
        let productsEndpoint = "/products/list";

        if (currentDivisionId) {
          warehouseEndpoint += `?divisionId=${currentDivisionId}`;
          customersEndpoint += `?divisionId=${currentDivisionId}`;
          productsEndpoint += `?divisionId=${currentDivisionId}`;
        }

        console.log(
          "IncomingStock - Initial data fetch with division parameters:"
        );
        console.log("IncomingStock - Division ID:", currentDivisionId);
        console.log("IncomingStock - Warehouse endpoint:", warehouseEndpoint);
        console.log("IncomingStock - Customers endpoint:", customersEndpoint);
        console.log("IncomingStock - Products endpoint:", productsEndpoint);

        const res1 = await axiosAPI.get(warehouseEndpoint);
        const res2 = await axiosAPI.get(customersEndpoint);
        const res3 = await axiosAPI.get(productsEndpoint);
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
  }, [selectedDivision?.id]);

  // Backend

  const [stock, setStock] = useState([]);
  const [filteredStock, setFilteredStock] = useState([]);
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [tableData, setTableData] = useState([]);

  // Add search state for PO ID and Warehouse Name
  const [poIdSearchTerm, setPoIdSearchTerm] = useState("");
  const [showPoIdSearch, setShowPoIdSearch] = useState(false);
  const [warehouseSearchTerm, setWarehouseSearchTerm] = useState("");
  const [showWarehouseSearch, setShowWarehouseSearch] = useState(false);

  // Add ESC key functionality to exit search mode
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === "Escape") {
        if (showProductSearch) {
          setShowProductSearch(false);
          setProductSearchTerm("");
        }
        if (showPoIdSearch) {
          setShowPoIdSearch(false);
          setPoIdSearchTerm("");
        }
        if (showWarehouseSearch) {
          setShowWarehouseSearch(false);
          setWarehouseSearchTerm("");
        }
      }
    };

    if (showProductSearch || showPoIdSearch || showWarehouseSearch) {
      document.addEventListener("keydown", handleEscKey);
    }

    return () => {
      document.removeEventListener("keydown", handleEscKey);
    };
  }, [showProductSearch, showPoIdSearch, showWarehouseSearch]);

  // Add click outside functionality to exit search mode
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if click is outside any of the search headers
      const productNameHeader = document.querySelector(
        "[data-product-name-header]"
      );
      const poIdHeader = document.querySelector("[data-poid-header]");
      const warehouseHeader = document.querySelector("[data-warehouse-header]");

      if (
        showProductSearch &&
        productNameHeader &&
        !productNameHeader.contains(event.target)
      ) {
        setShowProductSearch(false);
        setProductSearchTerm("");
      }

      if (showPoIdSearch && poIdHeader && !poIdHeader.contains(event.target)) {
        setShowPoIdSearch(false);
        setPoIdSearchTerm("");
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

    if (showProductSearch || showPoIdSearch || showWarehouseSearch) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showProductSearch, showPoIdSearch, showWarehouseSearch]);

  const date = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const today = new Date(Date.now()).toISOString().slice(0, 10);

  const [from, setFrom] = useState(date);
  const [to, setTo] = useState(today);
  const [warehouse, setWarehouse] = useState();
  const [customer, setCustomer] = useState();
  const [product, setProduct] = useState();
  const [trigger, setTrigger] = useState(false);

  const onSubmit = () => {
    setTrigger((prev) => !prev);
  };

  const [pageNo, setPageNo] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    async function fetch() {
      try {
        setStock(null);
        setLoading(true);
        setError(null);

        // ✅ Get division ID from context for division filtering
        const currentDivisionId = selectedDivision?.id;

        // ✅ Add division parameters to prevent wrong division data
        let query = `/warehouses/inventory/incoming?fromDate=${from}&toDate=${to}&page=${pageNo}&limit=${limit}`;

        // Add showAllDivisions parameter
        if (currentDivisionId === "all" || showAllDivisions) {
          query += `&showAllDivisions=true`;
        } else if (currentDivisionId) {
          query += `&divisionId=${currentDivisionId}`;
        }

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
          "IncomingStock - Fetching stock with warehouse filter:",
          warehouse
        );
        console.log("IncomingStock - Division ID:", currentDivisionId);
        console.log("IncomingStock - Show All Divisions:", showAllDivisions);
        console.log("IncomingStock - Final query:", query);

        const res = await axiosAPI.get(query);
        console.log("IncomingStock - API Response:", res);
        console.log(
          "IncomingStock - Incoming Stock Data:",
          res.data.incomingStock
        );
        const stockData = res.data.incomingStock || [];
        setStock(stockData);
        setFilteredStock(stockData); // Also set filteredStock initially
        setTotalPages(res.data.totalPages);
        setLoading(false);
      } catch (e) {
        console.log(e);
        setError(e.response?.data?.message || "An error occurred");
        setIsModalOpen(true);
        setLoading(false);
      }
    }

    // Always fetch data when component mounts or dependencies change
    fetch();
  }, [
    trigger,
    pageNo,
    limit,
    from,
    to,
    warehouse,
    customer,
    product,
    selectedDivision?.id,
    showAllDivisions,
  ]);

  // Add search filtering effect
  useEffect(() => {
    console.log("IncomingStock - Search effect triggered:", {
      stock,
      productSearchTerm,
      poIdSearchTerm,
      warehouseSearchTerm,
      filteredStock,
    });
    if (stock) {
      let filtered = stock;

      // Filter by Product Name
      if (productSearchTerm) {
        filtered = filtered.filter((item) =>
          item.productName
            .toLowerCase()
            .includes(productSearchTerm.toLowerCase())
        );
      }

      // Filter by PO ID
      if (poIdSearchTerm) {
        filtered = filtered.filter((item) =>
          item.purchaseOrderId
            .toLowerCase()
            .includes(poIdSearchTerm.toLowerCase())
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

      setFilteredStock(filtered);
    }
  }, [stock, productSearchTerm, poIdSearchTerm, warehouseSearchTerm]);

  // Function to export as Excel

  const onExport = (type) => {
    const arr = [];
    let x = 1;
    const columns = [
      "S.No",
      "Date",
      "PO ID",
      "Warehouse Name",
      "Product Name",
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
          "PO ID": st.purchaseOrderId,
          "Warehouse Name": st.warehouseName,
          "Product Name": st.productName,
          Quantity: st.quantity,
          Amount: st.totalAmount,
        })
      );
      setTableData(arr);

      if (type === "PDF") handleExportPDF(columns, tableData, "Incoming_Stock");
      else if (type === "XLS")
        handleExportExcel(columns, tableData, "IncomingStock");
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
        <i class="bi bi-chevron-right"></i> Incoming Stock
      </p>

      <div className="row m-0 p-3">
        <div className={`col-3 formcontent`}>
          <label htmlFor="">From :</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>
        <div className={`col-3 formcontent`}>
          <label htmlFor="">To :</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>

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

        {/* <div className={`col-3 formcontent`}>
          <label htmlFor="">Customers :</label>
          <select name="" id="" onChange={(e) => setCustomer(e.target.value === "null" ? null : e.target.value)}>
            <option value="null">--select--</option>
            {customers &&
              customers.map((customer) => (
                <option value={customer.id}>{customer.name}</option>
              ))}
          </select>
        </div> */}
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

      {stock && (
        <div className="row m-0 p-3 justify-content-around">
          <div className="col-lg-5">
            <button className={styles.xls} onClick={() => onExport("XLS")}>
              <p>Export to </p>
              <img src={xls} alt="" />
            </button>
            <button className={styles.xls} onClick={() => onExport("PDF")}>
              <p>Export to </p>
              <img src={pdf} alt="" />
            </button>
          </div>
          <div className={`col-lg-3 ${styles.entity}`}>
            <label htmlFor="">Entity :</label>
            <select
              name=""
              id=""
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={30}>30</option>
              <option value={40}>40</option>
              <option value={50}>50</option>
            </select>
          </div>
          <div className="col-lg-9">
            <table className={`table table-bordered borderedtable`}>
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Date</th>
                  <th
                    onClick={() => setShowPoIdSearch(!showPoIdSearch)}
                    style={{ cursor: "pointer", position: "relative" }}
                    data-poid-header
                  >
                    {showPoIdSearch ? (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <input
                          type="text"
                          placeholder="Search by PO ID..."
                          value={poIdSearchTerm}
                          onChange={(e) => setPoIdSearchTerm(e.target.value)}
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
                        {poIdSearchTerm && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setPoIdSearchTerm("");
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
                      <>PO ID</>
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
                    data-product-name-header
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
                  <th>Quantity</th>
                  <th>Amount</th>
                </tr>
                {(showProductSearch && productSearchTerm) ||
                (showPoIdSearch && poIdSearchTerm) ||
                (showWarehouseSearch && warehouseSearchTerm) ? (
                  <tr>
                    <td
                      colSpan={7}
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
                {console.log("IncomingStock - Rendering table body:", {
                  filteredStock,
                  stock,
                  productSearchTerm,
                })}
                {(!filteredStock || filteredStock.length === 0) && (
                  <tr>
                    <td colSpan={7}>NO DATA FOUND</td>
                  </tr>
                )}
                {filteredStock &&
                  filteredStock.length > 0 &&
                  filteredStock.map((st, stIndex) => (
                    <tr
                      key={st.id}
                      className="animated-row"
                      style={{ animationDelay: `${stIndex * 0.1}s` }}
                    >
                      <td>{index + stIndex}</td>
                      <td>{st.date.slice(0, 10)}</td>
                      <td>{st.purchaseOrderId}</td>
                      <td>{st.warehouseName}</td>
                      <td>{st.productName}</td>
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

export default IncomingStock;
