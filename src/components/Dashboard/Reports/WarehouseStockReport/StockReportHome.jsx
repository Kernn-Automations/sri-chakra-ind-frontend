import React from "react";

function StockReportHome({ navigate }) {
  return (
    <>
      <p className="path">
        <span onClick={() => navigate("/reports")}>Reports</span>{" "}
        <i class="bi bi-chevron-right"></i> Stock-Reports
      </p>

      <div className="row m-0 p-3 pt-1">
        <div className="col">
          <button
            className="homebtn"
            onClick={() =>
              navigate("/reports/stock-reports/stock-summary-reports")
            }
          >
            Stock Summary Reports
          </button>
          <button
            className="homebtn"
            onClick={() =>
              navigate("/reports/stock-reports/product-stock-summary")
            }
          >
            Product Stock Summary
          </button>
          <button
            className="homebtn"
            onClick={() =>
              navigate("/reports/stock-reports/closing-balance-reports")
            }
          >
            Closing Balance Reports
          </button>
          <button
            className="homebtn"
            onClick={() =>
              navigate("/reports/stock-reports/warehouse-wise-reports")
            }
          >
            Warehouse Wise Reports
          </button>
        </div>
      </div>
    </>
  );
}

export default StockReportHome;
