import { useAuth } from "@/Auth";
import React, { useEffect, useState } from "react";
import xls from "@/images/xls-png.png";
import pdf from "@/images/pdf-png.png";
import styles from "../Reports.module.css";
import ErrorModal from "@/components/ErrorModal";
import Loading from "@/components/Loading";
import { FaArrowLeftLong, FaArrowRightLong } from "react-icons/fa6";
import CustomSearchDropdown from "../../../../utils/CustomSearchDropDown";
import { handleExportExcel, handleExportPDF } from "@/utils/PDFndXLSGenerator";

function CustomerReports({ navigate }) {
  const date = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const today = new Date(Date.now()).toISOString().slice(0, 10);

  const [customer, setCustomer] = useState();
  const [warehouse, setWarehouse] = useState();

  const [customers, setCustomers] = useState();
  const [warehouses, setWarehouses] = useState();

  const [from, setFrom] = useState(date);
  const [to, setTo] = useState(today);

  const { axiosAPI } = useAuth();

  const [error, setError] = useState();
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const closeModal = () => {
    setIsModalOpen(false);
  };

  let index = 1;

  useEffect(() => {
    async function fetch() {
      try {
        const res1 = await axiosAPI.get("/customers");
        const res2 = await axiosAPI.get("/warehouses");

        console.log(res1);
        console.log(res2);

        setCustomers(res1.data.customers);
        setWarehouses(res2.data.warehouses);
      } catch (e) {
        console.log(e);
      }
    }

    fetch();
  }, []);
  // Add a separate export loading state
  const [exportLoading, setExportLoading] = useState(false);

  const onExport = async (type) => {
    console.log("Export started");

    try {
      setExportLoading(true); // separate state for export

      // 1️⃣ Fetch all data (only for export)
      const res = await axiosAPI.get("/reports/customers/all");
      console.log(res);
      const reports = res.data?.reports || [];

      if (!reports.length) {
        setError("Table is Empty");
        setIsModalOpen(true);
        return;
      }

      // 2️⃣ Prepare columns
      const xlcolumns = [
        "S.No",
        "Customer Name",
        "Customer ID",
        "Mobile",
        "Firm Name",
        "Warehouse Name",
        "Dues",
        "payment Total",
        "Refund Total",
        "sales Total",
        "Total Packets",
        "Total Tonnes",
      ];

      // 3️⃣ Transform reports to export-friendly array
      const xlarr = reports.map((report, index) => ({
        "S.No": index + 1,
        "Customer Name": report.customerName,
        "Customer ID": report.customerCode,
        Mobile: report.mobile,
        "Firm Name": report.firmName,
        "Warehouse Name": report.warehouse?.name,
        Dues: report.dues,
        "payment Total": report.paymentsTotal,
        "Refund Total": report.refundTotal,
        "sales Total": report.salesTotal,
        "Total Packets": report.totalPackets,
        "Total Tonnes": report.totalTonnes,
      }));

      // PDF columns

      const columns = [
        "S.No",
        "Customer Name",
        "Mobile",
        "Dues",
        "payment Total",
        "Refund Total",
        "sales Total",
        "Total Packets",
        "Total Tonnes",
      ];

      // 3️⃣ PDF Data
      const arr = reports.map((report, index) => ({
        "S.No": index + 1,
        "Customer Name": report.customerName,
        Mobile: report.mobile,
        Dues: report.dues,
        "payment Total": report.paymentsTotal,
        "Refund Total": report.refundTotal,
        "sales Total": report.salesTotal,
        "Total Packets": report.totalPackets,
        "Total Tonnes": report.totalTonnes,
      }));

      // 4️⃣ Export based on type
      if (type === "PDF") {
        console.log("started pdf generation");
        await handleExportPDF(columns, arr, "Customer-Reports");
        console.log("completed generation");
      } else if (type === "XLS") {
        await handleExportExcel(xlcolumns, xlarr, "Customer-Reports");
      }
    } catch (e) {
      console.error(e);
      setError("Failed to export data");
      setIsModalOpen(true);
    } finally {
      setExportLoading(false);
    }
  };

  const [pageNo, setPageNo] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(0);

  const [reports, setReports] = useState();

  useEffect(() => {
    async function fetch() {
      try {
        setReports(null);
        setLoading(true);
        console.log(customer);
        const query = `/reports/customers?fromDate=${from}&toDate=${to}&limit=${limit}&page=${pageNo}${customer ? `&customerId=${customer}` : ""}${warehouse ? `&warehouseId=${warehouse}` : ""}`;
        console.log(query);
        const res = await axiosAPI.get(query);

        console.log(res);

        setTotalPages(res.data.totalPages);

        setReports(res.data.reports);
      } catch (e) {
        console.log(e);
        setError(e.response?.data?.message);
        setIsModalOpen(true);
      } finally {
        setLoading(false);
      }
    }

    fetch();
  }, [from, to, customer, warehouse, pageNo, limit]);

  return (
    <>
      <p className="path">
        <span onClick={() => navigate("/reports")}>Reports</span>{" "}
        <i class="bi bi-chevron-right"></i>{" "}
        <span onClick={() => navigate("/reports/customer-reports")}>
          Customer-Reports
        </span>{" "}
        <i class="bi bi-chevron-right"></i> Customer-Overall-Reports
      </p>

      {/* content From Here */}

      <div className="row m-0 p-3">
        <div className={`col-4 formcontent`}>
          <label htmlFor="">From :</label>
          <input
            type="date"
            name=""
            id=""
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>
        <div className={`col-4 formcontent`}>
          <label htmlFor="">To :</label>
          <input
            type="date"
            name=""
            id=""
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>
        <CustomSearchDropdown
          label="Customer"
          onSelect={setCustomer}
          options={customers?.map((c) => ({ value: c.id, label: c.name }))}
        />

        <CustomSearchDropdown
          label="Warehouse"
          onSelect={setWarehouse}
          options={warehouses?.map((w) => ({ value: w.id, label: w.name }))}
        />
      </div>

      {reports && (
        <div className="row m-0 p-3 justify-content-around">
          <div className="col-lg-7">
            <button className={styles.xls} onClick={() => onExport("XLS")}>
              {exportLoading ? (
                "Downloading..."
              ) : (
                <>
                  <p>Export to </p>
                  <img src={xls} alt="" />
                </>
              )}
            </button>
            <button className={styles.xls} onClick={() => onExport("PDF")}>
              {exportLoading ? (
                "Downloading..."
              ) : (
                <>
                  <p>Export to </p>
                  <img src={pdf} alt="" />
                </>
              )}
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
            {/* {stock && stock.length > limit && (
            <div className="alert alert-warning mb-2" role="alert">
              <strong>⚠️ Backend Pagination Issue:</strong> You requested{" "}
              {limit} items per page, but the backend returned {stock.length}{" "}
              items. The frontend is limiting the display to {limit} items as a
              workaround. Please contact your backend team to fix the
              pagination.
            </div>
          )} */}

            <table className={`table table-bordered borderedtable`}>
              <thead>
                <tr
                  className="animated-row"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <th>S.No</th>
                  <th>Customer Name</th>
                  <th>Customer ID</th>
                  <th>Mobile</th>
                  <th>Firm Name</th>
                  <th>Warehouse Name</th>
                  <th>Dues</th>
                  <th>payment Total</th>
                  <th>Refund Total</th>
                  <th>sales Total</th>
                  <th>Total Packets</th>
                  <th>Total Tonnes</th>
                </tr>
              </thead>
              <tbody>
                {reports.length === 0 && (
                  <tr
                    className="animated-row"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <td colSpan={12}>NO DATA FOUND</td>
                  </tr>
                )}

                {reports.map((report) => (
                  <tr
                    className="animated-row"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <td>{index++}</td>
                    <td>{report.customerName}</td>
                    <td>{report.customerCode}</td>
                    <td>{report.mobile}</td>
                    <td>{report.firmName}</td>
                    <td>{report.warehouse?.name}</td>
                    <td>{report.dues}</td>
                    <td>{report.paymentsTotal}</td>
                    <td>{report.refundTotal}</td>
                    <td>{report.salesTotal}</td>
                    <td>{report.totalPackets}</td>
                    <td>{report.totalTonnes}</td>
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

export default CustomerReports;
