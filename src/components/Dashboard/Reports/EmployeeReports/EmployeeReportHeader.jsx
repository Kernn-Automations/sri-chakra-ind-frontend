import React from "react";

function EmployeeReportHeader({ navigate }) {
  return (
    <>
      <p className="path">
        <span onClick={() => navigate("/reports")}>Reports</span>{" "}
        <i class="bi bi-chevron-right"></i> Employee-Reports
      </p>
      <div className="row m-0 p-3 pt-1">
        <div className="col">
          <button
            className="homebtn"
            onClick={() => navigate("/reports/employee-reports/month-reports")}
          >
            Employee Month Reports
          </button>
          <button
            className="homebtn"
            onClick={() => navigate("/reports/employee-reports/sales-reports")}
          >
            Employee Sales Reports
          </button>
          <button
            className="homebtn"
            onClick={() =>
              navigate("/reports/employee-reports/comparison-reports")
            }
          >
            Employee Comparsion Report
          </button>
        </div>
      </div>
    </>
  );
}

export default EmployeeReportHeader;
