import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/Auth";
import CustomSearchDropdown from "@/utils/CustomSearchDropDown";
import styles from "./../Reports.module.css";
import xls from "@/images/xls-png.png";
import pdf from "@/images/pdf-png.png";
import { handleExportExcel, handleExportPDF } from "@/utils/PDFndXLSGenerator";
import ErrorModal from "@/components/ErrorModal";
import Loading from "@/components/Loading";

function ProductStockSummary({ navigate }) {
  const defaultFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const defaultTo = new Date(Date.now()).toISOString().slice(0, 10);

  const { axiosAPI } = useAuth();

  const [filterType, setFilterType] = useState("monthly");
  const [from, setFrom] = useState(defaultFrom); // daily
  const [week, setWeek] = useState(""); // YYYY-WW
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [year, setYear] = useState(String(new Date().getFullYear())); // YYYY
  const [productId, setProductId] = useState();

  const [products, setProducts] = useState();
  const [productOptions, setProductOptions] = useState();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const closeModal = () => setIsModalOpen(false);

  useEffect(() => {
    async function fetchInitial() {
      try {
        const res = await axiosAPI.get("/products/list");
        setProducts(res.data.products || []);
      } catch (e) {
        setError(e.response?.data?.message || "Failed to load products");
        setIsModalOpen(true);
      }
    }
    fetchInitial();
  }, []);

  useEffect(() => {
    const opts = [
      { value: "null", label: "--select--" },
      ...(products?.map((p) => ({ value: p.id, label: p.name })) || []),
    ];
    setProductOptions(opts);
  }, [products]);

  // Fetch report data when filters change
  useEffect(() => {
    async function fetchReport() {
      try {
        setLoading(true);
        // Build query per API spec
        let query = "/product-stock-summary?groupBy=product";
        query += `&filterType=${filterType}`;
        if (filterType === "daily" && from) {
          query += `&fromDate=${from}`;
        } else if (filterType === "weekly" && week) {
          query += `&week=${week}`;
        } else if (filterType === "monthly" && month) {
          query += `&month=${month}`;
        } else if (filterType === "yearly" && year) {
          query += `&year=${year}`;
        }
        if (productId) {
          query += `&productId=${productId}`;
        }
        // Division context is automatic; no explicit toggle

        const res = await axiosAPI.get(query);
        const list = res.data?.data || [];
        setReports(list);
      } catch (e) {
        setReports([]);
        setError(e.response?.data?.message || "Failed to load product stock summary");
        setIsModalOpen(true);
      } finally {
        setLoading(false);
      }
    }

    // Require the relevant date value to be present before fetching
    if (
      (filterType === "daily" && from) ||
      (filterType === "weekly" && week) ||
      (filterType === "monthly" && month) ||
      (filterType === "yearly" && year)
    ) {
      fetchReport();
    }
  }, [filterType, from, week, month, year, productId]);

  // Table data placeholder; keep empty until API is integrated
  const [reports, setReports] = useState([]);

  const onExport = (type) => {
    const columns = [
      "S.No",
      "Particulars",
      "Inward Qty",
      "Inward Alt Qty",
      "Stock In",
      "Alt Stock In",
      "Outward",
      "Alt Outward",
      "Stock Out",
      "Alt Stock Out",
      "Closing",
      "Alt Closing",
    ];
    const rows = [];
    let s = 1;
    (reports || []).forEach((r) =>
      rows.push({
        "S.No": s++,
        Particulars: r.particulars,
        "Inward Qty": r.inward,
        "Inward Alt Qty": r.inwardAlt,
        "Stock In": r.stockIn,
        "Alt Stock In": r.stockInAlt,
        Outward: r.outward,
        "Alt Outward": r.outwardAlt,
        "Stock Out": r.stockOut,
        "Alt Stock Out": r.stockOutAlt,
        Closing: r.closing,
        "Alt Closing": r.closingAlt,
      })
    );
    if (rows.length === 0) {
      setError("Table is Empty");
      setIsModalOpen(true);
      return;
    }
    if (type === "PDF") handleExportPDF(columns, rows, "Product-Stock-Summary");
    else if (type === "XLS") handleExportExcel(columns, rows, "Product-Stock-Summary");
  };

  return (
    <>
      <p className="path">
        <span onClick={() => navigate("/reports")}>Reports</span>{" "}
        <i className="bi bi-chevron-right"></i>{" "}
        <span onClick={() => navigate("/reports/stock-reports")}>
          Stock-Reports
        </span>{" "}
        <i className="bi bi-chevron-right"></i> Product-Stock-Summary
      </p>

      <div className="row m-0 p-3">
        <div className={`col-4 formcontent`}>
          <label htmlFor="">Filter Type :</label>
          <select
            name=""
            id=""
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>

        {filterType === "daily" && (
          <div className={`col-4 formcontent`}>
            <label htmlFor="">Date :</label>
            <input
              type="date"
              name=""
              id=""
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
        )}
        {filterType === "weekly" && (
          <div className={`col-4 formcontent`}>
            <label htmlFor="">Week :</label>
            <input
              type="week"
              name=""
              id=""
              value={week}
              onChange={(e) => setWeek(e.target.value)}
            />
          </div>
        )}
        {filterType === "monthly" && (
          <div className={`col-4 formcontent`}>
            <label htmlFor="">Month :</label>
            <input
              type="month"
              name=""
              id=""
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />
          </div>
        )}
        {filterType === "yearly" && (
          <div className={`col-4 formcontent`}>
            <label htmlFor="">Year :</label>
            <input
              type="number"
              min="1900"
              max="2100"
              name=""
              id=""
              value={year}
              onChange={(e) => setYear(e.target.value)}
            />
          </div>
        )}

        <CustomSearchDropdown
          label={"Product"}
          onSelect={(val) => setProductId(val === "null" ? null : val)}
          options={productOptions}
        />
      </div>

      {/* Actions placeholder - enable once data is wired */}
      <div className="row m-0 p-3 pb-0 justify-content-around">
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
      </div>

      <div className="row m-0 p-3 justify-content-around">
        <div className="col-lg-10">
          <table className={`table table-bordered borderedtable`}>
            <thead>
              <tr>
                <th>S.No</th>
                <th>Particulars</th>
                <th>Inward Qty</th>
                <th>Inward Alt Qty</th>
                <th>Stock In</th>
                <th>Alt Stock In</th>
                <th>Outward</th>
                <th>Alt Outward</th>
                <th>Stock Out</th>
                <th>Alt Stock Out</th>
                <th>Closing</th>
                <th>Alt Closing</th>
              </tr>
            </thead>
            <tbody>
              {(!reports || reports.length === 0) && (
                <tr>
                  <td colSpan={12}>NO DATA FOUND</td>
                </tr>
              )}
              {reports &&
                reports.map((r, idx) => (
                  <tr key={idx}>
                    <td>{idx + 1}</td>
                    <td>{r.particulars || ""}</td>
                    <td>{(r.inward ?? 0) + " Bags"}</td>
                    <td>{(r.inwardAlt ?? 0) + " Tonnes"}</td>
                    <td>{(r.stockIn ?? 0) + " Bags"}</td>
                    <td>{(r.stockInAlt ?? 0) + " Tonnes"}</td>
                    <td>{(r.outward ?? 0) + " Bags"}</td>
                    <td>{(r.outwardAlt ?? 0) + " Tonnes"}</td>
                    <td>{(r.stockOut ?? 0) + " Bags"}</td>
                    <td>{(r.stockOutAlt ?? 0) + " Tonnes"}</td>
                    <td>{(r.closing ?? 0) + " Bags"}</td>
                    <td>{(r.closingAlt ?? 0) + " Tonnes"}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <ErrorModal isOpen={isModalOpen} message={error} onClose={closeModal} />
      )}
      {loading && <Loading />}
    </>
  );
}

export default ProductStockSummary;


