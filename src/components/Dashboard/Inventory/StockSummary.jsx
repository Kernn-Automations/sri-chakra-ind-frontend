import React, { useEffect, useState } from "react";
import styles from "./Inventory.module.css";
import { useAuth } from "@/Auth";
import ErrorModal from "@/components/ErrorModal";
import Loading from "@/components/Loading";

function StockSummary({ navigate }) {
  const { axiosAPI } = useAuth();

  const today = new Date().toISOString().slice(0, 10);

  const [warehouses, setWarehouses] = useState([]);
  const [warehouseId, setWarehouseId] = useState("");
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [stockData, setStockData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const closeModal = () => setIsModalOpen(false);

  /* ---------------- LOAD WAREHOUSES ---------------- */
  useEffect(() => {
    async function fetchWarehouses() {
      try {
        const currentDivisionId = localStorage.getItem("currentDivisionId");
        let endpoint = "/warehouses";

        if (currentDivisionId && currentDivisionId !== "1") {
          endpoint += `?divisionId=${currentDivisionId}`;
        } else if (currentDivisionId === "1") {
          endpoint += `?showAllDivisions=true`;
        }

        const res = await axiosAPI.get(endpoint);
        setWarehouses(res.data.warehouses || []);
      } catch {
        setError("Failed to load warehouse list");
        setIsModalOpen(true);
      }
    }

    fetchWarehouses();
  }, []);

  /* ---------------- FETCH STOCK SUMMARY ---------------- */
  const fetchStock = async () => {
    if (!fromDate || !toDate) {
      setError("Please select both From and To dates.");
      setIsModalOpen(true);
      return;
    }

    setLoading(true);
    try {
      const currentDivisionId = localStorage.getItem("currentDivisionId");

      let divisionParam = "";
      if (currentDivisionId && currentDivisionId !== "1") {
        divisionParam = `&divisionId=${currentDivisionId}`;
      } else if (currentDivisionId === "1") {
        divisionParam = `&showAllDivisions=true`;
      }

      const query = `/warehouse/stock-summary?fromDate=${fromDate}&toDate=${toDate}${
        warehouseId ? `&warehouseId=${warehouseId}` : ""
      }${divisionParam}`;

      const res = await axiosAPI.get(query);
      setStockData(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch stock summary.");
      setIsModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setFromDate(today);
    setToDate(today);
    setWarehouseId("");
    setStockData([]);
  };

  return (
    <>
      <p className="path">
        <span onClick={() => navigate("/inventory")}>Inventory</span>{" "}
        <i className="bi bi-chevron-right"></i> Stock Summary
      </p>

      <div className="container py-3">
        <h4>Stock Summary</h4>

        {/* FILTERS */}
        <div className="row g-3 mb-4">
          <div className={`col-md-3 ${styles.dateForms}`}>
            <label className="form-label">From Date</label>
            <input
              type="date"
              className="form-control"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>

          <div className={`col-md-3 ${styles.dateForms}`}>
            <label className="form-label">To Date</label>
            <input
              type="date"
              className="form-control"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>

          <div className={`col-md-3 ${styles.dateForms}`}>
            <label className="form-label">Warehouse</label>
            <select
              className="form-select"
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
            >
              <option value="">-- All Warehouses --</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>

          <div className="col-md-3 d-flex align-items-end">
            <button onClick={fetchStock} className="submitbtn me-2">
              Submit
            </button>
            <button onClick={resetFilters} className="cancelbtn">
              Cancel
            </button>
          </div>
        </div>

        {/* TABLE */}
        {stockData.length > 0 ? (
          <div className="table-responsive">
            <table className="table table-bordered borderedtable">
              <thead className="table-light">
                <tr>
                  <th>Product Name</th>
                  <th>Opening</th>
                  <th>Inward (PO)</th>
                  <th>Outward (SO)</th>
                  <th>Stock In (Transfer)</th>
                  <th>Stock Out (Transfer)</th>
                  <th>Closing Balance</th>
                  <th>Type</th>
                  <th>Package Info</th>
                </tr>
              </thead>
              <tbody>
                {stockData.map((item) => (
                  <tr key={item.productId}>
                    <td>{item.productName}</td>
                    <td>{item.opening?.toFixed(2)}</td>
                    <td className="text-success">{item.inward?.toFixed(2)}</td>
                    <td className="text-danger">{item.outward?.toFixed(2)}</td>
                    <td className="text-primary">{item.stockIn?.toFixed(2)}</td>
                    <td className="text-warning">
                      {item.stockOut?.toFixed(2)}
                    </td>
                    <td className="fw-bold">{item.closing?.toFixed(2)}</td>
                    <td>{item.productType}</td>
                    <td>
                      {item.productType === "packed"
                        ? `${item.packageWeight} ${item.packageWeightUnit}`
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          !loading && (
            <p className="text-muted">
              No stock data found for selected filters.
            </p>
          )
        )}

        {loading && <Loading />}
        {isModalOpen && (
          <ErrorModal
            isOpen={isModalOpen}
            message={error}
            onClose={closeModal}
          />
        )}
      </div>
    </>
  );
}

export default StockSummary;
