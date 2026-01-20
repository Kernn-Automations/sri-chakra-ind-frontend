import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/Auth";
import styles from "./Targets.module.css";
import { FaPlus, FaEdit, FaTrash } from "react-icons/fa";
import Loading from "@/components/Loading";
import ErrorModal from "@/components/ErrorModal";
import AddSalesTargetModal from "./AddSalesTargetModal";

function SalesTargets({ navigate, isAdmin }) {
  const { axiosAPI } = useAuth();
  
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [trigger, setTrigger] = useState(false);

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const changeTrigger = () => setTrigger(!trigger);

  useEffect(() => {
    fetchTargets();
  }, [trigger]);

  const fetchTargets = async () => {
    try {
      setLoading(true);
      const currentDivisionId = localStorage.getItem('currentDivisionId');
      let query = "/targets/sales";
      
      if (currentDivisionId && currentDivisionId !== '1') {
        query += `?divisionId=${currentDivisionId}`;
      } else if (currentDivisionId === '1') {
        query += `?showAllDivisions=true`;
      }

      const response = await axiosAPI.get(query);
      setTargets(response.data.targets || []);
          } catch (error) {
      console.error("Error fetching targets:", error);
      setError("Failed to fetch sales targets");
      setIsModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  let index = 1;

  return (
    <>
      <p className="path">
        <span onClick={() => navigate("/targets")}>Targets</span>{" "}
        <i className="bi bi-chevron-right"></i> Sales Targets
      </p>

      {isAdmin && (
        <div className="row m-0 p-3 pt-0">
          <div className="col-3">
            <AddSalesTargetModal changeTrigger={changeTrigger} />
          </div>
        </div>
      )}

      {targets && (
        <div className="row m-0 p-3 justify-content-center">
          <div className="col-lg-10">
            <table className="table table-bordered borderedtable">
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Employee Name</th>
                  <th>Target Quantity</th>
                  <th>Unit</th>
                  <th>Period</th>
                  <th>Progress</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {targets.length === 0 && (
                  <tr
                    className="animated-row"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <td colSpan={8}>NO DATA FOUND</td>
                  </tr>
                )}
                {targets.length > 0 &&
                  targets.map((target) => {
                    const progress = target.achievedQuantity ? 
                      Math.min((target.achievedQuantity / target.targetQuantity) * 100, 100) : 0;
                    const status = progress >= 100 ? "Achieved" : 
                                  progress >= 70 ? "On Track" : "Behind";
                    
                    return (
                      <tr
                        key={target.id}
                        className="animated-row"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <td>{index++}</td>
                        <td>{target.employeeName}</td>
                        <td>{target.targetQuantity}</td>
                        <td>{target.unit}</td>
                        <td>{target.period}</td>
                        <td>{progress.toFixed(1)}%</td>
                        <td>
                          <span className={`badge ${status === "Achieved" ? "bg-success" : 
                                           status === "On Track" ? "bg-warning" : "bg-danger"}`}>
                            {status}
                          </span>
                        </td>
                        <td className={styles.delcol}>
                          <button className="btn btn-sm btn-outline-primary me-2">
                            <FaEdit /> Edit
              </button>
                          {isAdmin && (
                            <button className="btn btn-sm btn-outline-danger">
                              <FaTrash /> Delete
              </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
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

export default SalesTargets;
