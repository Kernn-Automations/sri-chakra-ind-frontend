import { useAuth } from "@/Auth";
import ErrorModal from "@/components/ErrorModal";
import Loading from "@/components/Loading";
import React, { useEffect, useState } from "react";
import styles from "./../Reports.module.css"; // import our new utils
import { exportToExcel, exportToPDF } from "./PDFndXLSCode";
import xls from "@/images/xls-png.png";
import pdf from "@/images/pdf-png.png";

function EmployeeComparisonReport({ navigate }) {
  const date = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const today = new Date(Date.now()).toISOString().slice(0, 10);

  const [error, setError] = useState();
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const closeModal = () => setIsModalOpen(false);

  const [listLoading, setListLoading] = useState(false);

  const { axiosAPI } = useAuth();

  const [from, setFrom] = useState(date);
  const [to, setTo] = useState(today);
  const [filter, setFilter] = useState("division");
  const [list, setList] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);

  const [reportData, setReportData] = useState(null);
  const [selectedNames, setSelectedNames] = useState([]);

  // fetch list for filter
  useEffect(() => {
    async function fetchList() {
      setList(null);
      setListLoading(true);
      let api =
        filter === "division"
          ? "/divisions"
          : filter === "zone"
            ? "/zones"
            : filter === "subzone"
              ? "/subzones"
              : filter === "team"
                ? "/teams?showAllDivisions=true"
                : "/employees";

      try {
        const res = await axiosAPI.get(api);
        let items =
          filter === "division"
            ? res.data.data
            : filter === "zone"
              ? res.data?.data?.zones
              : filter === "team"
                ? res.data?.data?.teams
                : res.data.data;
        setList(items || []);
        setSelectedIds([]);
      } catch (e) {
        console.log(e);
      } finally {
        setListLoading(false);
      }
    }
    fetchList();
  }, [filter]);

  // fetch comparison
  async function fetchComparison() {
    if (selectedIds.length === 0) {
      setError(`Please select at least one ${filter}`);
      setIsModalOpen(true);
      return;
    }

    try {
      setLoading(true);
      setReportData(null);
      const ids = selectedIds.join(",");
      const query = `/reports/comparison?ids=${ids}&level=${filter}&fromDate=${from}&toDate=${to}`;
      const res = await axiosAPI.get(query);
      const data = res.data;
      setReportData(data);
      setSelectedNames(data.ids?.map((x) => x.name) || []);
    } catch (e) {
      setError(e.response?.data?.message || "Error fetching report");
      setIsModalOpen(true);
    } finally {
      setLoading(false);
    }
  }

  // checkbox select
  const toggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((i) => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  return (
    <>
      <p className="path">
        <span onClick={() => navigate("/reports")}>Reports</span>{" "}
        <i className="bi bi-chevron-right"></i>
        <span onClick={() => navigate("/reports/Employee-Reports")}>
          {" "}
          Employee-Reports
        </span>{" "}
        <i className="bi bi-chevron-right"></i> Employee Comparison Reports
      </p>

      {/* Filters */}
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
          <select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
            }}
          >
            <option value="division">Divisions</option>
            <option value="zone">Zones</option>
            <option value="subzone">Sub Zones</option>
            <option value="team">Teams</option>
            <option value="employee">Employees</option>
          </select>
        </div>
      </div>

      <h5 className={styles.head}>
        Select <span>{filter}s</span> to Compare
      </h5>
      <div className="row m-0 p-3">
        {list && list.length > 0 ? (
          list.map((item) => (
            <div key={item.id} className="col-3">
              <label>
                <input
                  type="checkbox"
                  value={item.id}
                  checked={selectedIds.includes(item.id)}
                  onChange={() => toggleSelect(item.id)}
                />{" "}
                {item.name || item.title || item.label}
              </label>
            </div>
          ))
        ) : listLoading ? (
          <p>Loading...</p>
        ) : (
          <p>No {filter}s found</p>
        )}
      </div>

      <div className="row m-0 p-3 justify-content-center">
        <div className="col-lg-2">
          <button className={styles.comparebtn} onClick={fetchComparison}>
            Compare
          </button>
        </div>
      </div>

      {/* Table */}
      {reportData && reportData.dateWise && reportData.dateWise.length > 0 && (
        <div className="row m-0 p-3">
          <div className="col-lg-4">
            <button
              className={styles.xls}
              onClick={() => exportToExcel(selectedNames, reportData)}
            >
              <p>Export to </p>
              <img src={xls} alt="" />
            </button>
            <button
              className={styles.xls}
              onClick={() => exportToPDF(selectedNames, reportData)}
            >
              <p>Export to </p>
              <img src={pdf} alt="" />
            </button>
          </div>

          <div className="col-lg-12">
            <table className={`table table-bordered borderedtable`}>
              <thead>
                <tr>
                  <th rowSpan={2}>S.No</th>
                  <th rowSpan={2}>Date</th>
                  {selectedNames.map((name) => (
                    <th key={name} colSpan={4} className="text-center">
                      {name}
                    </th>
                  ))}
                </tr>
                <tr>
                  {selectedNames.map((name) => (
                    <React.Fragment key={name + "-headers"}>
                      <th>Qty</th>
                      <th>Increase</th>
                      <th>Decrease</th>
                      <th>Accumulated</th>
                    </React.Fragment>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reportData.dateWise.map((day, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>{day.date}</td>
                    {selectedNames.map((name) => (
                      <React.Fragment key={name + index}>
                        <td>{day[name] ?? 0}</td>
                        <td>{reportData.increase?.[name]?.[day.date] ?? 0}</td>
                        <td>{reportData.decrease?.[name]?.[day.date] ?? 0}</td>
                        <td>
                          {reportData.accumulation?.[name]?.[day.date] ?? 0}
                        </td>
                      </React.Fragment>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isModalOpen && (
        <ErrorModal isOpen={isModalOpen} message={error} onClose={closeModal} />
      )}
      {loading && <Loading />}
    </>
  );
}

export default EmployeeComparisonReport;
