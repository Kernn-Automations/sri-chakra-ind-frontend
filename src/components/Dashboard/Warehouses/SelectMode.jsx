import React, { useState } from "react";
import styles from "./Warehouse.module.css";

function SelectMode({val}) {
    const [ed, seted] = useState(val);
  return (
    <select
      className={ed == "enable" ? styles.enable : styles.disable}
      onChange={(e) => seted(e.target.value)}
      name=""
      id=""
      defaultValue={ed}
    >
      <option value="enable">Enable</option>
      <option value={"disable"}>Disable</option>
    </select>
  );
}

export default SelectMode;
