import React from "react";
import styles from "./Settings.module.css";

function SettingsHome({ navigate }) {
  return (
    <>
      <div className="row m-0 p-3">
        <div className="col">
          <button
            className="homebtn"
            onClick={() => navigate("/settings/warehouse-rules")}
          >
            Warehouse Rules
          </button>
          <button
            className="homebtn"
            onClick={() => navigate("/settings/drop-off-rules")}
          >
            Drop-off Rules
          </button>
          {/* <button
            className="homebtn"
            onClick={() => navigate("/settings/minimum-order-rules")}
          >
            Minimum Order Qty Rules
          </button> */}
        </div>
      </div>
    </>
  );
}

export default SettingsHome;
