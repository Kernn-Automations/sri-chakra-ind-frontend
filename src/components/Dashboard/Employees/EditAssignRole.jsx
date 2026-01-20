import React from "react";
import styles from "./Employees.module.css";
function EditAssignRole({ onEditClick }) {
  return (
    <>
      <div className="row m-0 p-3 pb-0 justify-content-center">
        <div className={`col-3 ${styles.longform}`}>
          <label htmlFor="">Employee ID :</label>
          <input type="text" />
        </div>
      </div>
      <div className="row m-0 p-3 py-0 justify-content-center">
        <div className={`col-3 ${styles.longform}`}>
          <label htmlFor="">Employee Name :</label>
          <input type="text" />
        </div>
      </div>
      <div className="row m-0 p-3 py-0 justify-content-center">
        <div className={`col-3 ${styles.longform}`}>
          <label htmlFor="">Mobile Number :</label>
          <input type="text" />
        </div>
      </div>
      <div className="row m-0 p-3 py-0 justify-content-center">
        <div className={`col-3 ${styles.longform}`}>
          <label htmlFor="">Email :</label>
          <input type="text" />
        </div>
      </div>
      <div className="row m-0 p-3 py-0 justify-content-center">
        <div className={`col-3 ${styles.longform}`}>
          <label htmlFor="">Roles :</label>
          <input type="text" />
        </div>
      </div>

      <div className="row m-0 p-3 justify-content-center">
        <div className={`col-3 ${styles.btnscol}`}>
          <button className="submitbtn">Submit</button>
          <button onClick={onEditClick} className="cancelbtn">
            Cancel
          </button>
        </div>
      </div>
    </>
  );
}

export default EditAssignRole;
