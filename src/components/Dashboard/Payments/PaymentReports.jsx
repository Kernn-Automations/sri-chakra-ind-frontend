import React, { useEffect, useState } from "react";
import styles from "./Payments.module.css";
import ReportsViewModal from "./ReportsViewModal";
import xls from "./../../../images/xls-png.png";
import pdf from "./../../../images/pdf-png.png";
import ErrorModal from "@/components/ErrorModal";
import Loading from "@/components/Loading";
import { useAuth } from "@/Auth";
import { handleExportExcel, handleExportPDF } from "@/utils/PDFndXLSGenerator";
import { FaArrowLeftLong, FaArrowRightLong } from "react-icons/fa6";
import CustomSearchDropdown from "@/utils/CustomSearchDropDown";

function PaymentReports({ navigate }) {
  const { axiosAPI } = useAuth();

  const [salesOrders, setSalesOrders] = useState([]);
  const [filteredSalesOrders, setFilteredSalesOrders] = useState([]);

  const [warehouses, setWarehouses] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [ses, setSes] = useState([]);

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isErrorOpen, setIsErrorOpen] = useState(false);

  const [isReportsModalOpen, setIsReportsModalOpen] = useState(false);
  const [selectedSalesOrder, setSelectedSalesOrder] = useState(null);

  const [trigger, setTrigger] = useState(false);

  /* --------------------------------------------------
   * DATE FILTERS (DEFAULT: LAST 7 DAYS)
   * -------------------------------------------------- */
  const fromDefault = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const toDefault = new Date().toISOString().slice(0, 10);

  const [from, setFrom] = useState(fromDefault);
  const [to, setTo] = useState(toDefault);
  const [warehouse, setWarehouse] = useState("");
  const [customer, setCustomer] = useState("");
  const [se, setSe] = useState("");

  const [pageNo, setPageNo] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(0);

  /* --------------------------------------------------
   * FETCH MASTER DATA
   * -------------------------------------------------- */
  useEffect(() => {
    async function fetchInitialData() {
      try {
        setLoading(true);

        const [w, c, e] = await Promise.all([
          axiosAPI.get("/warehouse"),
          axiosAPI.get("/customers"),
          axiosAPI.get("/employees/role/Business Officer"),
        ]);

        setWarehouses(w.data.warehouses || []);
        setCustomers(c.data.customers || []);
        setSes(e.data.employees || []);
      } catch (err) {
        setError("Failed to load filter data");
        setIsErrorOpen(true);
      } finally {
        setLoading(false);
      }
    }
    fetchInitialData();
  }, []);

  /* --------------------------------------------------
   * FETCH REPORT DATA (ERP API)
   * -------------------------------------------------- */
  useEffect(() => {
    async function fetchReports() {
      try {
        setLoading(true);

        let query = `/payment-requests?approvalStatus=Approved&from=${from}&to=${to}&page=${pageNo}&limit=${limit}`;

        if (warehouse) query += `&warehouseId=${warehouse}`;
        if (customer) query += `&customerId=${customer}`;
        if (se) query += `&salesExecutiveId=${se}`;

        const res = await axiosAPI.get(query);

        setSalesOrders(res.data.data || []);
        setTotalPages(res.data.totalPages || 0);
      } catch (err) {
        setError(
          err.response?.data?.message || "Failed to fetch payment reports",
        );
        setIsErrorOpen(true);
      } finally {
        setLoading(false);
      }
    }

    fetchReports();
  }, [trigger, from, to, warehouse, customer, se, pageNo, limit]);

  /* --------------------------------------------------
   * MIRROR DATA
   * -------------------------------------------------- */
  useEffect(() => {
    setFilteredSalesOrders(salesOrders);
  }, [salesOrders]);

  /* --------------------------------------------------
   * EXPORT
   * -------------------------------------------------- */
  const onExport = (type) => {
    if (!filteredSalesOrders.length) {
      setError("No data to export");
      setIsErrorOpen(true);
      return;
    }

    const columns = [
      "S.No",
      "Order Number",
      "Customer",
      "Sales Executive",
      "Warehouse",
      "Total Paid Amount",
    ];

    const data = filteredSalesOrders.map((o, i) => [
      i + 1,
      o.orderNumber,
      o.customer?.name,
      o.salesExecutive?.name,
      o.warehouse?.name,
      Number(o.totalPaidAmount || 0).toFixed(2),
    ]);

    if (type === "PDF") handleExportPDF(columns, data, "Payment-Reports");
    else handleExportExcel(columns, data, "Payment-Reports");
  };

  /* --------------------------------------------------
   * MODALS
   * -------------------------------------------------- */
  const openReportsModal = (order) => {
    setSelectedSalesOrder(order);
    setIsReportsModalOpen(true);
  };

  const closeReportsModal = () => {
    setSelectedSalesOrder(null);
    setIsReportsModalOpen(false);
  };

  return (
    <>
      <p className="path">
        <span onClick={() => navigate("/payments")}>Payments</span>{" "}
        <i className="bi bi-chevron-right"></i> Payment Reports
      </p>

      {/* FILTERS */}
      <div className="row m-0 p-3">
        <div className="col-3 formcontent">
          <label>From</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>

        <div className="col-3 formcontent">
          <label>To</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>

        <CustomSearchDropdown
          label="Warehouse"
          onSelect={setWarehouse}
          options={warehouses.map((w) => ({
            value: w.id,
            label: w.name,
          }))}
        />

        <CustomSearchDropdown
          label="Sales Executive"
          onSelect={setSe}
          options={ses.map((s) => ({
            value: s.id,
            label: s.name,
          }))}
        />

        <CustomSearchDropdown
          label="Customer"
          onSelect={setCustomer}
          options={customers.map((c) => ({
            value: c.id,
            label: c.name,
          }))}
        />
      </div>

      <div className="row m-0 p-2 justify-content-center">
        <button
          className="submitbtn"
          styles="width:10%"
          onClick={() => setTrigger(!trigger)}
        >
          Submit
        </button>
        <button className="cancelbtn" onClick={() => navigate(-1)}>
          Cancel
        </button>
      </div>

      {loading && <Loading />}

      {!loading && (
        <div className="row m-0 p-3 justify-content-center">
          <div className="col-lg-8">
            <button className={styles.xls} onClick={() => onExport("XLS")}>
              <p>Export</p>
              <img src={xls} alt="Excel" />
            </button>

            <button className={styles.xls} onClick={() => onExport("PDF")}>
              <p>Export</p>
              <img src={pdf} alt="PDF" />
            </button>
          </div>

          <div className={`col-lg-2 ${styles.entity}`}>
            <label>Entity</label>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
            >
              {[10, 20, 30, 40, 50].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          {/* TABLE */}
          <div className="col-lg-10">
            <table className="table table-bordered borderedtable">
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Sales Order</th>
                  <th>Customer</th>
                  <th>Sales Executive</th>
                  <th>Warehouse</th>
                  <th>Total Paid</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredSalesOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center">
                      NO DATA FOUND
                    </td>
                  </tr>
                ) : (
                  filteredSalesOrders.map((o, i) => (
                    <tr key={o.salesOrderId}>
                      <td>{i + 1}</td>
                      <td>{o.orderNumber}</td>
                      <td>{o.customer?.name}</td>
                      <td>{o.salesExecutive?.name}</td>
                      <td>{o.warehouse?.name}</td>
                      <td>
                        ₹
                        {Number(o.totalPaidAmount || 0).toLocaleString("en-IN")}
                      </td>
                      <td>
                        <button
                          className={`btn ${styles.viewBtn}`}
                          onClick={() => openReportsModal(o)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* PAGINATION */}
            <div className="row m-0 p-0 pt-3 justify-content-between">
              <div className="col-2">
                {pageNo > 1 && (
                  <button onClick={() => setPageNo(pageNo - 1)}>
                    <FaArrowLeftLong /> Previous
                  </button>
                )}
              </div>
              <div className="col-2 text-end">
                {pageNo < totalPages && (
                  <button onClick={() => setPageNo(pageNo + 1)}>
                    Next <FaArrowRightLong />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {isReportsModalOpen && selectedSalesOrder && (
        <ReportsViewModal
          report={selectedSalesOrder}
          isOpen={isReportsModalOpen}
          onClose={closeReportsModal}
        />
      )}

      {isErrorOpen && error && (
        <ErrorModal
          isOpen={isErrorOpen}
          message={error}
          onClose={() => setIsErrorOpen(false)}
        />
      )}
    </>
  );
}

export default PaymentReports;
