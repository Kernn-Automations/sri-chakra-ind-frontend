import { useAuth } from "@/Auth";
import ErrorModal from "@/components/ErrorModal";
import Loading from "@/components/Loading";
import React, { useEffect, useState } from "react";
import styles from "./../Reports.module.css";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";

function EmployeeSaleReport({ navigate }) {
  const date = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const today = new Date(Date.now()).toISOString().slice(0, 10);

  const { axiosAPI } = useAuth();

  const [error, setError] = useState();
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const closeModal = () => setIsModalOpen(false);

  const [from, setFrom] = useState(date);
  const [to, setTo] = useState(today);
  const [filter, setFilter] = useState("division");
  const [reports, setReports] = useState();

  useEffect(() => {
    async function fetch() {
      try {
        setLoading(true);
        setReports(null);
        const query = `/reports/employees/sales?fromDate=${from}&toDate=${to}&groupBy=${filter}`;
        const res = await axiosAPI.get(query);
        console.log(res)
        setReports(res.data.hierarchy || []);
      } catch (e) {
        console.log(e);
        setError(e.response?.data?.message || "Failed to fetch data");
        setIsModalOpen(true);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [from, to, filter]);

  // Recursive dropdown renderer
  const HierarchyDropdown = ({ nodes }) => {
    const [openNodes, setOpenNodes] = useState({});
    const toggle = (id) => setOpenNodes((prev) => ({ ...prev, [id]: !prev[id] }));

    return (
      <div className={styles.dropdownContainer}>
        {nodes?.map((node) => (
          <div key={node.id} className={styles.dropdownItem}>
            <div
              className={styles.dropdownHeader}
              onClick={() => toggle(node.id)}
            >
              <span className={styles.dropdownTitle}>
                {node.name}{" "}
                <span className={styles.dropdownTotals}>
                  (Qty: {node.totals?.qty}, AltQty:{" "}
                  {Number(node.totals?.altQty || 0).toFixed(2)}, Value: ₹
                  {node.totals?.value})
                </span>
              </span>
              {node.children?.length > 0 && (
                <span className={styles.dropdownIcon}>
                  {openNodes[node.id] ? <FaChevronUp /> : <FaChevronDown />}
                </span>
              )}
            </div>

            {openNodes[node.id] && node.children?.length > 0 && (
              <div className={styles.dropdownChildren}>
                <HierarchyDropdown nodes={node.children} />
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <p className="path">
        <span onClick={() => navigate("/reports")}>Reports</span>{" "}
        <i className="bi bi-chevron-right"></i>{" "}
        <span onClick={() => navigate("/reports/Employee-Reports")}>
          Employee-Reports
        </span>{" "}
        <i className="bi bi-chevron-right"></i> Employee Sales Reports
      </p>

      <div className="row m-0 p-3">
        <div className="col-4 formcontent">
          <label htmlFor="">From :</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>
        <div className="col-4 formcontent">
          <label htmlFor="">To :</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>
        <div className="col-4 formcontent">
          <label htmlFor="">Filters :</label>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="division">Divisions</option>
            <option value="zone">Zones</option>
            <option value="subzone">Sub Zones</option>
            <option value="team">Teams</option>
            <option value="employee">Employees</option>
          </select>
        </div>
      </div>

      <div className="row m-0 p-3">
        <div className="col-12">
          {loading && <Loading />}
          {!loading && reports?.length > 0 && (
            <HierarchyDropdown nodes={reports} />
          )}
          {!loading && reports?.length === 0 && (
            <p className={styles.nodata}>No data found</p>
          )}
        </div>
      </div>

      {isModalOpen && (
        <ErrorModal isOpen={isModalOpen} message={error} onClose={closeModal} />
      )}
    </>
  );
}

export default EmployeeSaleReport;
