import { useAuth } from "@/Auth";
import ErrorModal from "@/components/ErrorModal";
import Loading from "@/components/Loading";
import React, { useEffect, useState } from "react";
import { FaArrowLeftLong, FaArrowRightLong } from "react-icons/fa6";
import styles from "./../Reports.module.css";
import xls from "@/images/xls-png.png";
import pdf from "@/images/pdf-png.png";
import {
  handleExportMultipleExcel,
  handleExportMultiplePDF,
} from "@/utils/PDFndXLSMultiTableGenerator";

function EmployeeMonthReport({ navigate }) {
  const date = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const today = new Date(Date.now()).toISOString().slice(0, 10);

  const [error, setError] = useState();
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const closeModal = () => setIsModalOpen(false);

  const { axiosAPI } = useAuth();

  const [from, setFrom] = useState(date);
  const [to, setTo] = useState(today);
  const [filter, setFilter] = useState("division");

  const [reports, setReports] = useState();
  const [pageNo, setPageNo] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(0);

  const [subfilters, setSubfilters] = useState();
  const [subfilter, setSubfilter] = useState();

  useEffect(() => {
    async function fetch() {
      try {
        setLoading(true);
        setReports(null);
        setSubfilters(null);
        setSubfilter(null);
        const query = `/reports/employees/sales-monthly?fromDate=${from}&toDate=${to}&groupBy=${filter}`;
        const res = await axiosAPI.get(query);
        setReports(res.data.data);
      } catch (e) {
        setError(e.response?.data?.message);
        setIsModalOpen(true);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [from, to, filter]);

  useEffect(() => {
    if (!reports) return;
    let subs = [];
    Object.entries(reports).map(([groupName, array]) => subs.push(groupName));
    setSubfilters(subs);
    console.log(subs);
  }, [reports]);

  // ⬇️ Export function for multiple tables
  const onExport = async (type) => {
    if (!reports || Object.keys(reports).length === 0) {
      setError("No data available to export");
      setIsModalOpen(true);
      return;
    }

    // define your columns exactly as in table header
    const columns = [
      "S.No",
      "Previous Date",
      "Previous Quantity",
      "Current Date",
      "Current Quantity",
      "Decrease",
      "Increase",
      "Accumulated",
    ];

    // build tables array
    const tables = Object.entries(reports).map(([groupName, rows]) => {
      let index = 1;
      const data = rows.map((r) => ({
        "S.No": index++,
        "Previous Date": r.prevDate,
        "Previous Quantity": r.prevQty,
        "Current Date": r.currDate,
        "Current Quantity": r.currQty,
        Decrease: r.decrease,
        Increase: r.increase,
        Accumulated: r.accumulated,
      }));
      return {
        title: `${groupName} Report`,
        columns,
        data,
      };
    });

    if (type === "PDF")
      await handleExportMultiplePDF(tables, "Employee Monthly Report");
    else if (type === "XLS")
      handleExportMultipleExcel(tables, "Employee Monthly Report");
  };

  let count = 1;

  return (
    <>
      <p className="path">
        <span onClick={() => navigate("/reports")}>Reports</span>{" "}
        <i className="bi bi-chevron-right"></i>
        <span onClick={() => navigate("/reports/Employee-Reports")}>
          Employee-Reports
        </span>{" "}
        <i className="bi bi-chevron-right"></i> Employee Monthly Reports
      </p>

      <div className="row m-0 p-3">
        <div className={`col-4 formcontent`}>
          <label>From :</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>
        <div className={`col-4 formcontent`}>
          <label>To :</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>

        <div className={`col-4 formcontent`}>
          <label>Filters :</label>
          <select onChange={(e) => setFilter(e.target.value)}>
            <option value="division">Divisions</option>
            <option value="zone">Zones</option>
            <option value="subzone">Sub Zones</option>
            <option value="team">Teams</option>
            <option value="employee">Employees</option>
          </select>
        </div>

        {subfilters && subfilters.length !== 0 && (
          <div className={`col-4 formcontent`}>
            <label>Sub Filters :</label>
            <select
              onChange={(e) =>
                setSubfilter(e.target.value === "null" ? null : e.target.value)
              }
            >
              <option value="null">--select--</option>
              {subfilters.map((name) => (
                <option value={name}>{name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Export Buttons */}

      {reports && (
        <div className="row m-0 p-3 justify-content-around">
          <div className="col-lg-4">
            <button className={styles.xls} onClick={() => onExport("XLS")}>
              <p>Export to </p>
              <img src={xls} alt="" />
            </button>
            <button className={styles.xls} onClick={() => onExport("PDF")}>
              <p>Export to </p>
              <img src={pdf} alt="" />
            </button>
          </div>
          {Object.entries(reports).length === 0 && <h5>NO DATA FOUND</h5>}
          {Object.entries(reports)
            .filter(([groupName]) => {
              console.log(subfilter, groupName);
              return !subfilter || subfilter === groupName;
            })
            .map(([groupName, array]) => (
              <div className="col-lg-10" key={groupName}>
                <h6>{groupName} :</h6>
                <table className={`table table-bordered borderedtable`}>
                  <thead>
                    <tr className="animated-row">
                      <th>S.No</th>
                      <th>Previous Date</th>
                      <th>Previous Quantity</th>
                      <th>Current Date</th>
                      <th>Current Quantity</th>
                      <th>Decrease</th>
                      <th>Increase</th>
                      <th>Accumulated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {array.length === 0 && (
                      <tr>
                        <td colSpan={8}>NO DATA FOUND</td>
                      </tr>
                    )}
                    {array.map((report, index) => (
                      <tr key={index}>
                        <td>{index + 1}</td>
                        <td>{report.prevDate}</td>
                        <td>{report.prevQty}</td>
                        <td>{report.currDate}</td>
                        <td>{report.currQty}</td>
                        <td>{report.decrease}</td>
                        <td>{report.increase}</td>
                        <td>{report.accumulated}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
        </div>
      )}

      {isModalOpen && (
        <ErrorModal isOpen={isModalOpen} message={error} onClose={closeModal} />
      )}
      {loading && <Loading />}
    </>
  );
}

export default EmployeeMonthReport;
