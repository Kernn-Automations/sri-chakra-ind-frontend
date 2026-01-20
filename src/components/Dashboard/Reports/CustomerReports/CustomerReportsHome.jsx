import React from "react";

function CustomerReportsHome({navigate}) {
  return (
    <>
      <p className="path">
        <span onClick={() => navigate("/reports")}>Reports</span>{" "}
        <i class="bi bi-chevron-right"></i> Customer-Reports
      </p>
      <div className="row m-0 p-3 pt-1">
        <div className="col">
          <button
            className="homebtn"
            onClick={() =>
              navigate("/reports/customer-reports/customer-overall-reports")
            }
          >
            Customer Overall Reports
          </button>
          <button
            className="homebtn"
            onClick={() =>
              navigate("/reports/customer-reports/customer-wise-reports")
            }
          >
            Customer Wise Reports
          </button>
        </div>
      </div>
    </>
  );
}

export default CustomerReportsHome;
