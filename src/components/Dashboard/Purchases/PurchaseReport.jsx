import React, { useEffect, useState } from "react";
import styles from "./Purchases.module.css";
import ReportViewModal from "./ReportViewModal";
import xls from "./../../../images/xls-png.png";
import pdf from "./../../../images/pdf-png.png";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useAuth } from "@/Auth";
import ErrorModal from "@/components/ErrorModal";
import Loading from "@/components/Loading";
import { handleExportExcel, handleExportPDF } from "@/utils/PDFndXLSGenerator";
import { FaArrowLeftLong, FaArrowRightLong } from "react-icons/fa6";
import CustomSearchDropdown from "@/utils/CustomSearchDropDown";

function PurchaseReport({ navigate }) {
  const [onsubmit, setonsubmit] = useState(false);

  const [warehouses, setWarehouses] = useState();

  const { axiosAPI } = useAuth();

  const [error, setError] = useState();
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const closeModal = () => {
    setIsModalOpen(false);
  };

  // Add search state variables for searchable fields
  const [dateSearchTerm, setDateSearchTerm] = useState("");
  const [showDateSearch, setShowDateSearch] = useState(false);
  const [purchaseIdSearchTerm, setPurchaseIdSearchTerm] = useState("");
  const [showPurchaseIdSearch, setShowPurchaseIdSearch] = useState(false);
  const [warehouseSearchTerm, setWarehouseSearchTerm] = useState("");
  const [showWarehouseSearch, setShowWarehouseSearch] = useState(false);

  useEffect(() => {
    async function fetch() {
      try {
        const res1 = await axiosAPI.get("/warehouses");
        // console.log(res1);
        setWarehouses(res1.data.warehouses);
      } catch (e) {
        // console.log(e);
        setError(e.response.data.message);
        setIsModalOpen(true);
      }
    }
    fetch();
  }, []);

  // Add ESC key functionality to exit search mode
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === "Escape") {
        if (showDateSearch) {
          setShowDateSearch(false);
          setDateSearchTerm("");
        }
        if (showPurchaseIdSearch) {
          setShowPurchaseIdSearch(false);
          setPurchaseIdSearchTerm("");
        }
        if (showWarehouseSearch) {
          setShowWarehouseSearch(false);
          setWarehouseSearchTerm("");
        }
      }
    };

    if (showDateSearch || showPurchaseIdSearch || showWarehouseSearch) {
      document.addEventListener("keydown", handleEscKey);
    }

    return () => {
      document.removeEventListener("keydown", handleEscKey);
    };
  }, [showDateSearch, showPurchaseIdSearch, showWarehouseSearch]);

  // Add click outside functionality to exit search mode
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if click is outside any of the search headers
      const dateHeader = document.querySelector("[data-date-header]");
      const purchaseIdHeader = document.querySelector(
        "[data-purchaseid-header]"
      );
      const warehouseHeader = document.querySelector("[data-warehouse-header]");

      if (showDateSearch && dateHeader && !dateHeader.contains(event.target)) {
        setShowDateSearch(false);
        setDateSearchTerm("");
      }

      if (
        showPurchaseIdSearch &&
        purchaseIdHeader &&
        !purchaseIdHeader.contains(event.target)
      ) {
        setShowPurchaseIdSearch(false);
        setPurchaseIdSearchTerm("");
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

    if (showDateSearch || showPurchaseIdSearch || showWarehouseSearch) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDateSearch, showPurchaseIdSearch, showWarehouseSearch]);

  // Backend

  const [purchases, setPurchases] = useState();

  // Set default date range to last 6 months to get more records
  const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const today = new Date(Date.now()).toISOString().slice(0, 10);

  const [from, setFrom] = useState(sixMonthsAgo);
  const [to, setTo] = useState(today);
  const [trigger, setTrigger] = useState(false);
  const [warehouse, setWarehouse] = useState();

  const onSubmit = () => {
    console.log(from, to, warehouse, customer);
    setTrigger(trigger ? false : true);
  };

  const [pageNo, setPageNo] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(0);

  // Reset page number when limit changes
  useEffect(() => {
    setPageNo(1);
  }, [limit]);

  // Global refresh function for purchase orders
  const refreshPurchaseOrders = React.useCallback(async () => {
    try {
      setPurchases(null);
      setLoading(true);

      // ✅ Get division ID from localStorage for division filtering
      const currentDivisionId = localStorage.getItem("currentDivisionId");

      // Build query with optional date filters and division parameters
      let query = `/purchases`;
      const params = [];

      if (from && to) {
        params.push(`fromDate=${from}&toDate=${to}`);
      }

      if (warehouse && warehouse !== "null") {
        params.push(`warehouseId=${warehouse}`);
      }

      // ✅ Add division parameters
      if (currentDivisionId && currentDivisionId !== "1") {
        params.push(`divisionId=${currentDivisionId}`);
      } else if (currentDivisionId === "1") {
        params.push(`showAllDivisions=true`);
      }

      if (params.length > 0) {
        query += `?${params.join("&")}`;
      }

      console.log("Refreshing purchase orders...");
      console.log("API Query:", query);

      const res = await axiosAPI.get(query);
      console.log("Refresh - Full API Response:", res);
      console.log("Refresh - API purchaseOrders:", res.data.purchaseOrders);

      // Client-side pagination since backend is not respecting limit
      const allPurchases = res.data.purchaseOrders || [];
      const startIndex = (pageNo - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedPurchases = allPurchases.slice(startIndex, endIndex);

      setPurchases(paginatedPurchases);
      console.log("✅ Purchase orders refreshed successfully");
    } catch (error) {
      console.error("❌ Error refreshing purchase orders:", error);
    } finally {
      setLoading(false);
    }
  }, [from, to, warehouse, pageNo, limit, axiosAPI]);

  // Set global function for other components to use
  React.useEffect(() => {
    window.refreshPurchaseOrders = refreshPurchaseOrders;
    return () => {
      delete window.refreshPurchaseOrders;
    };
  }, [refreshPurchaseOrders]);

  useEffect(() => {
    async function fetch() {
      try {
        setPurchases(null);
        setLoading(true);

        // ✅ Get division ID from localStorage for division filtering
        const currentDivisionId = localStorage.getItem("currentDivisionId");
        const currentDivisionName = localStorage.getItem("currentDivisionName");

        // Build query with optional date filters and division parameters
        let query = `/purchases`;
        const params = [];

        if (from && to) {
          params.push(`fromDate=${from}&toDate=${to}`);
        }

        if (warehouse && warehouse !== "null") {
          params.push(`warehouseId=${warehouse}`);
        }

        // ✅ Add division parameters
        if (currentDivisionId && currentDivisionId !== "1") {
          params.push(`divisionId=${currentDivisionId}`);
        } else if (currentDivisionId === "1") {
          params.push(`showAllDivisions=true`);
        }

        if (params.length > 0) {
          query += `?${params.join("&")}`;
        }

        console.log("PurchaseReport - API Query:", query);
        console.log("PurchaseReport - Division ID:", currentDivisionId);
        console.log("PurchaseReport - Division Name:", currentDivisionName);
        console.log(
          "PurchaseReport - Limit value:",
          limit,
          "Type:",
          typeof limit
        );
        console.log("PurchaseReport - Page number:", pageNo);

        const res = await axiosAPI.get(query);
        console.log("Full API Response:", res);
        console.log("API purchaseOrders:", res.data.purchaseOrders);
        console.log("Total Pages:", res.data.totalPages);
        console.log("Records returned:", res.data.purchaseOrders?.length || 0);

        // Client-side pagination since backend is not respecting limit
        const allPurchases = res.data.purchaseOrders || [];
        const startIndex = (pageNo - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedPurchases = allPurchases.slice(startIndex, endIndex);

        setPurchases(paginatedPurchases);
        setTotalPages(Math.ceil(allPurchases.length / limit));
      } catch (e) {
        console.log("API Error:", e);
        setError(e.response?.data?.message || "An error occurred");
        setIsModalOpen(true);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [trigger, pageNo, limit, from, to, warehouse]);

  const [tableData, setTableData] = useState([]);

  const onExport = (type) => {
    const arr = [];
    let x = 1;
    const columns = ["S.No", "Date", "PO ID", "Warehouse Name", "Net Amount"];
    if (purchases && purchases.length > 0) {
      purchases.map((st) =>
        arr.push({
          "S.No": x++,
          Date: st.createdAt ? st.createdAt.slice(0, 10) : "",
          "PO ID": st.orderNumber || st.ordernumber || "N/A",
          "Warehouse Name":
            st.warehouse ||
            warehouses?.find((w) => w.id === st.warehouseId)?.name ||
            st.warehouseId ||
            "N/A",
          "Net Amount": st.totalAmount || "",
        })
      );
      setTableData(arr);

      if (type === "PDF") handleExportPDF(columns, tableData, "Purchase-Order");
      else if (type === "XLS")
        handleExportExcel(columns, tableData, "Purchase-Order");
    } else {
      setError("Table is Empty");
      setIsModalOpen(true);
    }
  };

  let index = 1;
  return (
    <>
      <p className="path">
        <span onClick={() => navigate("/purchases")}>Purchase</span>{" "}
        <i class="bi bi-chevron-right"></i> Purchase order Report
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

        <div className={`col-3`}>
          <button className="submitbtn" onClick={onSubmit}>
            Submit
          </button>
          <button className="cancelbtn" onClick={() => navigate("/purchases")}>
            Cancel
          </button>
        </div>
      </div>

      {purchases && (
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
          <div className={`col-lg-2 ${styles.entity}`}>
            <label htmlFor="">Entity :</label>
            <select
              name=""
              id=""
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={30}>30</option>
              <option value={40}>40</option>
              <option value={50}>50</option>
            </select>
          </div>
          <div className="col-lg-10">
            <table className={`table table-bordered borderedtable`}>
              <thead>
                <tr>
                  <th>S.No</th>
                  <th
                    onClick={() => setShowDateSearch(!showDateSearch)}
                    style={{ cursor: "pointer", position: "relative" }}
                    data-date-header
                  >
                    {showDateSearch ? (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <input
                          type="text"
                          placeholder="Search by date..."
                          value={dateSearchTerm}
                          onChange={(e) => setDateSearchTerm(e.target.value)}
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
                        {dateSearchTerm && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDateSearchTerm("");
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
                      <>Date</>
                    )}
                  </th>
                  <th
                    onClick={() =>
                      setShowPurchaseIdSearch(!showPurchaseIdSearch)
                    }
                    style={{ cursor: "pointer", position: "relative" }}
                    data-purchaseid-header
                  >
                    {showPurchaseIdSearch ? (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <input
                          type="text"
                          placeholder="Search by purchase ID..."
                          value={purchaseIdSearchTerm}
                          onChange={(e) =>
                            setPurchaseIdSearchTerm(e.target.value)
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
                        {purchaseIdSearchTerm && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setPurchaseIdSearchTerm("");
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
                      <>Purchase ID</>
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
                          placeholder="Search by warehouse..."
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
                      <>Warehouse</>
                    )}
                  </th>
                  <th>Status</th>
                  {/* <th>Net Amount</th> */}
                  <th>Action</th>
                </tr>
                {(showDateSearch && dateSearchTerm) ||
                (showPurchaseIdSearch && purchaseIdSearchTerm) ||
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
                        const filteredItems = purchases.filter((order) => {
                          let pass = true;
                          if (dateSearchTerm) {
                            const orderDate = order.createdAt
                              ? order.createdAt.slice(0, 10)
                              : "";
                            if (!orderDate.includes(dateSearchTerm)) {
                              pass = false;
                            }
                          }
                          if (purchaseIdSearchTerm) {
                            const orderId =
                              order.orderNumber || order.ordernumber || "";
                            if (
                              !orderId
                                .toLowerCase()
                                .includes(purchaseIdSearchTerm.toLowerCase())
                            ) {
                              pass = false;
                            }
                          }
                          if (warehouseSearchTerm) {
                            const warehouseName =
                              order.warehouse ||
                              warehouses?.find(
                                (w) => w.id === order.warehouseId
                              )?.name ||
                              order.warehouseId ||
                              "";
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
                {(() => {
                  // Apply search filters to the purchases data
                  let filteredPurchases = purchases || [];

                  if (
                    dateSearchTerm ||
                    purchaseIdSearchTerm ||
                    warehouseSearchTerm
                  ) {
                    filteredPurchases = filteredPurchases.filter((order) => {
                      let pass = true;

                      // Apply date search filter
                      if (dateSearchTerm) {
                        const orderDate = order.createdAt
                          ? order.createdAt.slice(0, 10)
                          : "";
                        if (!orderDate.includes(dateSearchTerm)) {
                          pass = false;
                        }
                      }

                      // Apply purchase ID search filter
                      if (purchaseIdSearchTerm) {
                        const orderId =
                          order.orderNumber || order.ordernumber || "";
                        if (
                          !orderId
                            .toLowerCase()
                            .includes(purchaseIdSearchTerm.toLowerCase())
                        ) {
                          pass = false;
                        }
                      }

                      // Apply warehouse search filter
                      if (warehouseSearchTerm) {
                        const warehouseName =
                          order.warehouse ||
                          warehouses?.find((w) => w.id === order.warehouseId)
                            ?.name ||
                          order.warehouseId ||
                          "";
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

                  if (filteredPurchases.length === 0) {
                    return (
                      <tr>
                        <td colSpan={6}>NO DATA FOUND</td>
                      </tr>
                    );
                  }

                  return filteredPurchases.map((order, index) => (
                    <tr
                      key={order.id}
                      className="animated-row"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <td>{index + 1}</td>
                      <td>
                        {order.createdAt ? order.createdAt.slice(0, 10) : ""}
                      </td>
                      <td>{order.orderNumber || order.ordernumber || "N/A"}</td>
                      <td>
                        {order.warehouse ||
                          warehouses?.find((w) => w.id === order.warehouseId)
                            ?.name ||
                          order.warehouseId ||
                          "N/A"}
                      </td>
                      <td>
                        <span
                          className={`badge ${order.status === "Received" ? "bg-success" : "bg-warning"}`}
                        >
                          {order.status === "Received"
                            ? "Stocked In"
                            : "Pending"}
                        </span>
                      </td>
                      <td>
                        <ReportViewModal
                          order={order}
                          warehouses={warehouses}
                          setWarehouses={setWarehouses}
                          onStockInSuccess={refreshPurchaseOrders}
                        />
                      </td>
                    </tr>
                  ));
                })()}
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

export default PurchaseReport;
