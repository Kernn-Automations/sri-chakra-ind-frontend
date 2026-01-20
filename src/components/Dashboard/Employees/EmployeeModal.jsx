import React from "react";
import styles from "./Employees.module.css";

function EmployeeModal({ employee }) {
  return (
    <>
      <h3 className={`px-3 pb-3 mdl-title`}>Employee</h3>
      <div className="row justify-content-center">
        <div className={`col-4  inputcolumn-mdl`}>
          <label htmlFor="">Date :</label>
          <input type="date" value={employee.createdAt?.slice(0, 10)} />
        </div>
      </div>{" "}
      <div className="row justify-content-center">
        <div className={`col-4  inputcolumn-mdl`}>
          <label htmlFor="">Employee ID :</label>
          <input type="text" value={employee.employeeId} required />
        </div>
      </div>{" "}
      <div className="row justify-content-center">
        <div className={`col-4  inputcolumn-mdl`}>
          <label htmlFor="">Employee Name :</label>
          <input type="text" value={employee.name} required />
        </div>
      </div>{" "}
      <div className="row justify-content-center">
        <div className={`col-4  inputcolumn-mdl`}>
          <label htmlFor="">Mobile Number :</label>
          <input type="text" value={employee.mobile} required />
        </div>
      </div>{" "}
      <div className="row justify-content-center">
        <div className={`col-4  inputcolumn-mdl`}>
          <label htmlFor="">Email :</label>
          <input type="text" value={employee.email} required />
        </div>
      </div>{" "}
      <div className="row justify-content-center">
        <div className={`col-4  inputcolumn-mdl`}>
          <label htmlFor="">Supervisor :</label>
          <input
            type="text"
            value={employee.supervisor?.name}
            required
          />
        </div>
      </div>{" "}
      <div className="row pb-3 justify-content-center">
        <div className={`col-4  inputcolumn-mdl`}>
          <label htmlFor="">Assigned Roles :</label>
          {employee.roles?.length <= 1 && (
            <input type="text" value={employee.roles[0]?.name} required />
          )}
          {employee.roles?.length > 1 && (
            <p className={styles.roles}>
              |
              {employee.roles.map((role) => (
                <span> {role.name} |</span>
              ))}
            </p>
          )}
        </div>
      </div>{" "}
    </>
  );
}

export default EmployeeModal;
