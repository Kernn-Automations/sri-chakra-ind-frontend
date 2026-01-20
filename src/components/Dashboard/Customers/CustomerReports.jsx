import React, { useEffect, useState } from "react";
import { useAuth } from "@/Auth";
import ErrorModal from "@/components/ErrorModal";
import Loading from "@/components/Loading";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Modal, Button } from "react-bootstrap";
import { FaRegCalendarAlt } from "react-icons/fa";
import { handleExportPDF, handleExportExcel } from "@/utils/PDFndXLSGenerator";
import CustomSearchDropdown from "@/utils/CustomSearchDropDown";
import styles from "./Customers.module.css";
import xls from "./../../../images/xls-png.png";
import pdf from "./../../../images/pdf-png.png";

function CustomerReportsPage({ navigate }) {
  const { axiosAPI } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [customerId, setCustomerId] = useState();
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [reportData, setReportData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [error, setError] = useState();
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const closeModal = () => setIsModalOpen(false);

  useEffect(() => {
    async function fetchCustomers() {
      try {
        setLoading(true);
        const res = await axiosAPI.get(`/customers?limit=all`);
        setCustomers(res.data.customers);
      } catch (e) {
        setError(e.response?.data?.message || "Error fetching customers");
      } finally {
        setLoading(false);
      }
    }
    fetchCustomers();
  }, []);

  async function fetchReport() {
    try {
      setLoading(true);
      const res = await axiosAPI.get(
        `/customers/reports/customer?customerId=${customerId || ""}&from=${fromDate?.toISOString() || ""}&to=${toDate?.toISOString() || ""}`
      );
      setReportData(res.data?.report || []);
      setSummary(res.data?.summary || null);
    } catch (e) {
      setError(e.response?.data?.message || "Error fetching report");
    } finally {
      setLoading(false);
    }
  }

  const formatDate = (date) => new Date(date).toLocaleDateString("en-GB");

  const CustomDateInput = React.forwardRef(({ value, onClick }, ref) => (
    <div className="input-group">
      <input
        type="text"
        className="form-control"
        value={value}
        onClick={onClick}
        ref={ref}
        readOnly
      />
      <span
        className="input-group-text"
        onClick={onClick}
        style={{ cursor: "pointer" }}
      >
        <FaRegCalendarAlt />
      </span>
    </div>
  ));

  const handleExport = (type) => {
    if (!reportData || reportData.length === 0) {
      setError("No data to export");
      setIsModalOpen(true);
      return;
    }

    const customerObj = customers.find((c) => c.id === parseInt(customerId));
    console.log(customerObj);
    const customerCode = customerObj?.customer_id || "-";

    const columnsPDF = [
      "S.No.",
      "Order Id",
      "Order Date",
      "Grand Total",
      "Order Status",
      "Payment Mode",
      "Transaction Reference",
    ];

    const columnsXLS = [
      ...columnsPDF,
      "Customer Name",
      "Customer ID",
      "Dispatch Date",
      "Delivery Date",
      "Driver Name",
      "Driver Mobile",
    ];

    const rows = reportData.map((order, index) => {
      const totalBaseAmount = order.items.reduce(
        (sum, i) => sum + i.pricePerUnit * i.quantity,
        0
      );
      const totalTaxAmount = order.items.reduce(
        (sum, i) => sum + parseFloat(i.taxAmount || 0),
        0
      );

      return {
        "S.No.": index + 1,
        "Order Id": order.orderId,
        "Order Date": formatDate(order.orderDate),
        "Grand Total": order.totalAmount,
        "Order Status": order.status || "-",
        "Payment Mode": order.payment?.mode || "-",
        "Transaction Reference": order.payment?.transactionReference || "-",
        "Customer Name": customerObj?.name,
        "Customer ID": customerCode,
        "Dispatch Date": order.dispatch?.dispatchDate
          ? formatDate(order.dispatch.dispatchDate)
          : "-",
        "Delivery Date": order.delivery?.deliveryDate
          ? formatDate(order.delivery.deliveryDate)
          : "-",
        "Driver Name": order.dispatch?.driverName || "-",
        "Driver Mobile": order.dispatch?.driverMobile || "-",
      };
    });

    const summaryObject = summary && {
      Customer: summary.customerName,
      "Customer ID": customerId,
      "Total Revenue": summary.totalRevenue?.toFixed(2),
      "Total Orders": summary.totalOrders,
      Confirmed: summary.confirmedOrders,
      Dispatched: summary.dispatchedOrders,
      Delivered: summary.deliveredOrders,
    };

    if (type === "PDF")
      handleExportPDF(columnsPDF, rows, "Customer Report", summaryObject);
    else handleExportExcel(columnsXLS, rows, "Customer Report");
  };

  return (
    <>
      <p className="path">
        <span onClick={() => navigate("/customers")}>Customers</span>{" "}
        <i className="bi bi-chevron-right"></i> Customer Reports
      </p>

      {/* 🔍 Filters */}
      <div className="row m-0 p-3">
        <CustomSearchDropdown
          label="Customers"
          onSelect={setCustomerId}
          options={customers?.map((c) => ({ value: c.id, label: c.name }))}
        />

        <div className="col-3 formcontent">
          <label>From Date</label>
          <DatePicker
            selected={fromDate}
            onChange={setFromDate}
            dateFormat="dd/MM/yyyy"
            customInput={<CustomDateInput />}
          />
        </div>
        <div className="col-3 formcontent">
          <label>To Date</label>
          <DatePicker
            selected={toDate}
            onChange={setToDate}
            dateFormat="dd/MM/yyyy"
            customInput={<CustomDateInput />}
          />
        </div>
        <div className="col-3 d-flex align-items-end">
          <button className="generatebtn" onClick={fetchReport}>
            Generate Report
          </button>
        </div>
      </div>

      {/* 🧾 Customer Summary */}
      {summary && (
        <div className="row m-0 px-4">
          <div className="col-12 mb-3">
            <h5>
              <strong>Customer:</strong> {summary.customerName}
            </h5>
            <p>
              <strong>Customer ID:</strong> {summary.customerCode}
            </p>
            <p>
              <strong>Total Revenue:</strong> ₹
              {summary.totalRevenue?.toFixed(2)}
            </p>
            <p>
              <strong>Total Orders:</strong> {summary.totalOrders}
            </p>
            <p>
              <strong>Confirmed:</strong> {summary.confirmedOrders}
            </p>
            <p>
              <strong>Dispatched:</strong> {summary.dispatchedOrders}
            </p>
            <p>
              <strong>Delivered:</strong> {summary.deliveredOrders}
            </p>
          </div>
        </div>
      )}

      {/* 📋 Report Table */}
      {reportData.length > 0 && (
        <div className="row m-0 px-4">
          <div className="col-12 mb-2 d-flex">
            <button className={styles.xls} onClick={() => handleExport("XLS")}>
              <p>Export to </p>
              <img src={xls} alt="Export to Excel" />
            </button>
            <button className={styles.xls} onClick={() => handleExport("PDF")}>
              <p>Export to </p>
              <img src={pdf} alt="Export to PDF" />
            </button>
          </div>
          <div className="col-12">
            <table className="table table-bordered borderedtable">
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Date</th>
                  <th>Order ID</th>
                  <th>Base Amount</th>
                  <th>Tax</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {reportData.map((order, i) => {
                  const base = order.items.reduce(
                    (sum, i) => sum + i.pricePerUnit * i.quantity,
                    0
                  );
                  const tax = order.items.reduce(
                    (sum, i) => sum + parseFloat(i.taxAmount || 0),
                    0
                  );
                  return (
                    <tr key={order.orderId}>
                      <td>{i + 1}</td>
                      <td>{formatDate(order.orderDate)}</td>
                      <td>{order.orderId}</td>
                      <td>₹{base.toFixed(2)}</td>
                      <td>₹{order.taxAmount}</td>
                      <td>₹{order.totalAmount}</td>
                      <td>{order.status}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => setSelectedOrder(order)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 🔎 View Modal */}
      {selectedOrder && (
        <Modal show onHide={() => setSelectedOrder(null)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>Order: {selectedOrder.orderId}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <ul>
              {selectedOrder.items.map((item, idx) => {
                const isPacked =
                  item.unit?.toLowerCase() === "unit" ||
                  item.unit?.toLowerCase() === "units";
                const displayUnit = item.quantity > 1 ? "units" : "unit";
                const totalTax =
                  item.taxes?.reduce(
                    (sum, tax) => sum + (tax.amount || 0),
                    0
                  ) || 0;
                const totalPriceWithTax =
                  item.pricePerUnit * item.quantity + totalTax;

                return (
                  <li key={idx} className="mb-2">
                    <strong>{item.productName}</strong> — {item.quantity}{" "}
                    {isPacked ? displayUnit : item.unit} @ ₹{item.pricePerUnit}
                    {item.taxes?.length > 0 && (
                      <ul className="ms-3 mt-1">
                        {item.taxes.map((tax, i) => (
                          <li key={i}>
                            {tax.name} ({tax.percentage}%): ₹
                            {tax.amount.toFixed(2)}
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="mt-1">
                      {" "}
                      <strong>
                        Total (incl. tax): ₹{totalPriceWithTax.toFixed(2)}
                      </strong>
                    </div>
                  </li>
                );
              })}
            </ul>
            {selectedOrder.payment && (
              <>
                <h6>Payment Info</h6>
                <p>
                  <strong>Mode:</strong> {selectedOrder.payment.mode}
                  <br />
                  <strong>Status:</strong> {selectedOrder.payment.status}
                  <br />
                  <strong>Date:</strong>{" "}
                  {formatDate(selectedOrder.payment.transactionDate)}
                  <br />
                  <strong>Amount:</strong> ₹{selectedOrder.totalAmount}
                  <br />
                  <strong>Reference:</strong>{" "}
                  {selectedOrder.payment.transactionReference}
                </p>
              </>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setSelectedOrder(null)}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      )}

      {isModalOpen && (
        <ErrorModal isOpen={isModalOpen} message={error} onClose={closeModal} />
      )}
      {loading && <Loading />}
    </>
  );
}

export default CustomerReportsPage;
