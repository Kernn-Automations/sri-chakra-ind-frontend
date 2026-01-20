import React from "react";

function ReportsHome({ navigate }) {
  return (
    <>
      <div className="row m-0 p-3">
        <div className="col">
          <button
            className="homebtn"
            onClick={() => navigate("/reports/sales-reports")}
          >
            Sales Reports
          </button>
          <button
            className="homebtn"
            onClick={() => navigate("/reports/customer-reports")}
          >
            Customer Reports
          </button>
          <button
            className="homebtn"
            onClick={() => navigate("/reports/employee-reports")}
          >
            Employee Reports
          </button>
          <button
            className="homebtn"
            onClick={() => navigate("/reports/stock-reports")}
          >
            Stock Reports
          </button>
          <button
            className="homebtn"
            onClick={() => navigate("/reports/target-reports")}
          >
            Target Reports
          </button>
          <button
            className="homebtn"
            onClick={() => navigate("/reports/ledger-reports")}
          >
            Customer Ledger Reports
          </button>
        </div>
      </div>
    </>
  );
}

export default ReportsHome;
