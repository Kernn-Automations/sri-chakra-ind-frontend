import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ErrorModal from "@/components/ErrorModal";
import LoadingAnimation from "@/components/LoadingAnimation";
import { FaArrowLeftLong, FaArrowRightLong } from "react-icons/fa6";
import styles from "./Sales.module.css";
import xls from "./../../../images/xls-png.png";
import pdf from "./../../../images/pdf-png.png";
import { useAuth } from "@/Auth";
import CustomSearchDropdown from "@/utils/CustomSearchDropDown";

function CancelledOrders() {
  const navigate = useNavigate();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [warehouse, setWarehouse] = useState("");
  const [customer, setCustomer] = useState(null);
  const [limit, setLimit] = useState(10);
  const [pageNo, setPageNo] = useState(1);

  const [orders, setOrders] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [customers, setCustomers] = useState([]);

  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState("");

  const [reasonPopup, setReasonPopup] = useState({ open: false, text: "" });

  const { axiosAPI } = useAuth();

  useEffect(() => {
    // Fetch warehouses, customers etc.
    async function fetchFilters() {
      try {
        const res1 = await axiosAPI.get("/warehouses");
        const res2 = await axiosAPI.get("/customers?limit=all");

        setWarehouses(res1.data.warehouses);
        setCustomers(res2.data.customers);
      } catch (err) {
        setError("Failed to fetch filters.");
        setIsModalOpen(true);
      }
    }

    fetchFilters();
  }, []);

  const onSubmit = async () => {
    // API call logic for cancelled orders
    setLoading(true);
    try {
      // ✅ Get division ID from localStorage for division filtering
      const currentDivisionId = localStorage.getItem("currentDivisionId");
      const currentDivisionName = localStorage.getItem("currentDivisionName");

      // ✅ Handle "All Warehouses" option - don't send warehouseId parameter
      let warehouseParam = {};
      if (warehouse && warehouse !== "all") {
        warehouseParam = { warehouse };
      }

      // ✅ Add division parameters to prevent wrong division data
      let divisionParam = {};
      if (currentDivisionId && currentDivisionId !== "1") {
        divisionParam = { divisionId: currentDivisionId };
      } else if (currentDivisionId === "1") {
        divisionParam = { showAllDivisions: true };
      }

      console.log(
        "CancelledOrders - Fetching orders with warehouse filter:",
        warehouse
      );
      console.log("CancelledOrders - Warehouse parameter:", warehouseParam);
      console.log("CancelledOrders - Division ID:", currentDivisionId);
      console.log("CancelledOrders - Division Name:", currentDivisionName);
      console.log(
        "CancelledOrders - Division parameters added:",
        divisionParam
      );

      const queryParams = new URLSearchParams({
        ...(from && { from }),
        ...(to && { to }),
        ...warehouseParam,
        ...divisionParam,
        ...(customer && { customer }),
        limit,
        page: pageNo,
      }).toString();

      const response = await axiosAPI.get(
        `/sales-orders/cancelled?${queryParams}`
      );
      console.log("Cancelled orders API response:", response.data);
      const ordersData =
        response.data.cancelledOrders || response.data.orders || response.data;
      console.log("Processed orders data:", ordersData);
      setOrders(Array.isArray(ordersData) ? ordersData : []); // Always set as array
    } catch (err) {
      setError("Failed to fetch cancelled orders.");
      setIsModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const GrandTotal = () => {
    return orders.reduce(
      (sum, order) => sum + Number(order.totalAmount || 0),
      0
    );
  };

  const onExport = (type) => {
    const arr = [];
    let x = 1;
    const columns = [
      "S.No",
      "Date",
      "Order ID",
      "Warehouse Name",
      "Customer ID",
      "Customer Name",
      "Amount",
      "Cancelled Date",
      "Cancelled Reason",
    ];

    if (orders && orders.length > 0) {
      orders.forEach((order) =>
        arr.push({
          "S.No": x++,
          Date: order.createdAt?.slice(0, 10),
          "Order ID": order.orderNumber,
          "Warehouse Name": order.warehouse?.name || "-",
          "Customer ID": order.customer?.customer_id || "-",
          "Customer Name": order.customer?.name || "-",
          Amount: order.totalAmount,
          "Cancelled Date": order.cancelledAt?.slice(0, 10) || "-",
          "Cancelled Reason": order.cancelReason || "-",
        })
      );

      setTableData(arr);
      const total = GrandTotal();

      if (type === "PDF") {
        handleExportPDF(columns, arr, "Cancelled_Orders", total);
      } else if (type === "XLS") {
        handleExportExcel(columns, arr, "Cancelled_Orders");
      }
    } else {
      setError("Table is Empty");
      setIsModalOpen(true);
    }
  };

  const closeModal = () => setIsModalOpen(false);

  return (
    <>
      <p className="path">
        <span onClick={() => navigate("/sales")}>Sales</span>{" "}
        <i className="bi bi-chevron-right"></i> Cancelled Orders
      </p>

      <div className="row m-0 p-3">
        <div className="col-3 formcontent">
          <label>From :</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>
        <div className="col-3 formcontent">
          <label>To :</label>
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
          label="Customers"
          onSelect={setCustomer}
          options={customers?.map((c) => ({ value: c.id, label: c.name }))}
        />
      </div>

      <div className="row m-0 p-3 justify-content-center">
        <div className="col-3 formcontent">
          <button className="submitbtn" onClick={onSubmit}>
            Submit
          </button>
          <button className="cancelbtn" onClick={() => navigate("/sales")}>
            Cancel
          </button>
        </div>
      </div>

      {orders && (
        <div className="row m-0 p-3 justify-content-around">
          <div className="col-lg-5">
            <button className={styles.xls} onClick={() => onExport("XLS")}>
              <p>Export to</p>
              <img src={xls} alt="xls" />
            </button>
            <button className={styles.xls} onClick={() => onExport("PDF")}>
              <p>Export to</p>
              <img src={pdf} alt="pdf" />
            </button>
          </div>
          <div className={`col-lg-3 ${styles.entity}`}>
            <label>Entity :</label>
            <select value={limit} onChange={(e) => setLimit(e.target.value)}>
              {[10, 20, 30, 40, 50].map((num) => (
                <option key={num} value={num}>
                  {num}
                </option>
              ))}
            </select>
          </div>
          <div className="col-lg-10">
            <table className="table table-hover table-bordered borderedtable">
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Date</th>
                  <th>Order ID</th>
                  <th>Warehouse Name</th>
                  <th>Customer ID</th>
                  <th>Customer Name</th>
                  <th>Amount</th>
                  <th>Cancelled Date</th>
                  <th>Cancelled Reason</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={9}>NO DATA FOUND</td>
                  </tr>
                )}
                {orders.map((order, index) => {
                  // Try to get warehouse name directly from the order data first
                  let warehouseName =
                    order.salesOrder?.warehouse?.name ||
                    order.warehouse?.name ||
                    "-";

                  // If warehouse name is not available directly, try to find it from warehouses list
                  if (warehouseName === "-") {
                    const warehouseId =
                      order.salesOrder?.warehouseId ||
                      order.salesOrder?.warehouse?.id ||
                      order.warehouseId ||
                      order.warehouse?.id;

                    // Debug logging
                    console.log("Order warehouse data:", {
                      orderId: order.id,
                      orderData: order,
                      salesOrderData: order.salesOrder,
                      warehouseId: warehouseId,
                      warehouseIdType: typeof warehouseId,
                      warehousesCount: warehouses?.length,
                      warehouses: warehouses,
                    });

                    if (warehouseId && Array.isArray(warehouses)) {
                      const wh = warehouses.find(
                        (w) => String(w.id) === String(warehouseId)
                      );
                      console.log("Found warehouse:", wh);
                      if (wh) warehouseName = wh.name;
                    } else {
                      console.log(
                        "No warehouse found for warehouseId:",
                        warehouseId
                      );
                    }
                  }
                  return (
                    <tr key={order.id} className="animated-row">
                      <td>{index + 1}</td>
                      <td>{order.createdAt?.slice(0, 10)}</td>
                      <td>{order.salesOrder?.orderNumber}</td>
                      <td>{warehouseName}</td>
                      <td>
                        {order.salesOrder?.customer?.customer_id ||
                          order.salesOrder?.customerId ||
                          "-"}
                      </td>
                      <td>{order.salesOrder?.customer?.name || "-"}</td>
                      <td>{order.salesOrder?.totalAmount}</td>
                      <td>{order.cancelledAt?.slice(0, 10)}</td>
                      <td>{order.cancellationReason}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {orders.length > 0 && (
              <p className="text-end fs-5 pe-3 py-2">
                Grand Total : {GrandTotal()}
              </p>
            )}

            <div className="row m-0 p-0 pt-3 justify-content-between">
              <div className={`col-2 m-0 p-0 ${styles.buttonbox}`}>
                {pageNo > 1 && (
                  <button onClick={() => setPageNo(pageNo - 1)}>
                    <FaArrowLeftLong /> Previous
                  </button>
                )}
              </div>
              <div className={`col-2 m-0 p-0 ${styles.buttonbox}`}>
                {orders.length === limit && (
                  <button onClick={() => setPageNo(pageNo + 1)}>
                    Next <FaArrowRightLong />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {reasonPopup.open && (
        <div
          className="modal d-block"
          tabIndex="-1"
          style={{ background: "#00000066" }}
        >
          <div className="modal-dialog">
            <div className="modal-content p-3">
              <div className="modal-header">
                <h5 className="modal-title">Cancelled Reason</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setReasonPopup({ open: false, text: "" })}
                ></button>
              </div>
              <div className="modal-body">
                <p>{reasonPopup.text}</p>
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setReasonPopup({ open: false, text: "" })}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <ErrorModal isOpen={isModalOpen} message={error} onClose={closeModal} />
      )}

      {loading && <LoadingAnimation />}
    </>
  );
}

export default CancelledOrders;
