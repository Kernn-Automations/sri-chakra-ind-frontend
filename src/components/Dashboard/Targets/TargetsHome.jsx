import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Targets.module.css";
import Loading from "@/components/Loading";
import ErrorModal from "@/components/ErrorModal";
import { useAuth } from "@/Auth";
import { 
  FaUsers, 
  FaChartLine, 
  FaBullseye, 
  FaListAlt, 
  FaBullseye as FaTarget,
  FaRocket,
  FaTrophy,
  FaCheckCircle,
  FaCalendarAlt,
  FaClock,
  FaExclamationTriangle,
  FaInbox,
  FaSearch,
  FaFilter
} from "react-icons/fa";

function TargetsHome() {
  const navigate = useNavigate();
  const { axiosAPI } = useAuth();
  const API_BASE = import.meta.env.VITE_API_URL || "";

  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isErrorOpen, setIsErrorOpen] = useState(false);
  const [trigger, setTrigger] = useState(false);

  const closeError = () => setIsErrorOpen(false);
  const refresh = () => setTrigger((t) => !t);

  useEffect(() => {
    fetchActiveTargetsWithAssignments();
  }, [trigger]);

  const fetchActiveTargetsWithAssignments = async () => {
    try {
      setLoading(true);
      console.log("Fetching active targets...");
      
      // 1) Fetch active targets (via axiosAPI, proxied in dev)
      let res;
      try {
        res = await axiosAPI.get("/targets/targets?status=active");
      } catch (statusError) {
        console.log("Failed with status parameter, trying without:", statusError);
        // Fallback: try without status parameter
        res = await axiosAPI.get("/targets/targets");
      }
      console.log("Targets API response:", res.data);
      
      const rows = Array.isArray(res.data?.targets)
        ? res.data.targets
        : Array.isArray(res.data)
        ? res.data
        : [];

      console.log("Parsed targets rows:", rows);

      if (rows.length === 0) {
        console.log("No targets found");
        setTargets([]);
        return;
      }

      // 2) For each target, fetch assignments via NEW endpoint using absolute backend URL
      const enriched = await Promise.all(
        rows.map(async (t) => {
          try {
            const url = `${API_BASE}/targets/${t.id}/assignments`;
            console.log("Fetching assignments for target:", t.id, "URL:", url);
            const ar = await axiosAPI.get(url);
            const assignments = Array.isArray(ar.data?.assignments)
              ? ar.data.assignments
              : Array.isArray(ar.data)
              ? ar.data
              : [];
            return { ...t, __assignments: assignments };
          } catch (_e) {
            console.log("Failed to fetch assignments for target:", t.id, _e);
            return { ...t, __assignments: [] };
          }
        })
      );

      console.log("Final enriched targets:", enriched);
      setTargets(enriched);
    } catch (e) {
      console.error("Error fetching targets:", e);
      setError(e?.response?.data?.message || "Failed to fetch targets");
      setIsErrorOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const renderParticulars = (row) => {
    const assignments = Array.isArray(row?.__assignments) ? row.__assignments : [];

    if (assignments.length) {
      const names = assignments
        .map((a) => {
          if (a.assignmentType === "team" && a.team) return a.team.name;
          if (a.assignmentType === "employee" && a.employee) return a.employee.name;
          if (a.team) return a.team.name;
          if (a.employee) return a.employee.name;
          return null;
        })
        .filter(Boolean);
      if (names.length) return names.join(", ");
    }

    const teamNames = Array.isArray(row?.assignedTeams)
      ? row.assignedTeams.map((t) => t.name).filter(Boolean)
      : [];
    const employeeNames = Array.isArray(row?.assignedEmployees)
      ? row.assignedEmployees.map((e) => e.name).filter(Boolean)
      : [];
    const names = [...teamNames, ...employeeNames];
    return names.length ? names.join(", ") : "-";
  };

  const renderTargetNumber = (row) => {
    if (row?.budgetNumber != null) return row.budgetNumber.toLocaleString();
    return "-";
  };

  const renderTargetUnit = (row) => {
    return row?.budgetUnit || "-";
  };

  const renderAssignedOn = (row) => {
    if (row?.startDate) {
      return new Date(row.startDate).toLocaleDateString('en-IN');
    }
    if (row?.createdAt) {
      return new Date(row.createdAt).toLocaleDateString('en-IN');
    }
    return "-";
  };

  const renderDeadline = (row) => {
    if (row?.endDate) {
      return new Date(row.endDate).toLocaleDateString('en-IN');
    }
    return "-";
  };

  const renderCurrentlyMet = (row) => {
    const assignments = Array.isArray(row?.__assignments) ? row.__assignments : [];
    if (assignments.length) {
      const sumProgress = assignments
        .map((a) => (a.currentProgress != null ? Number(a.currentProgress) : 0))
        .reduce((acc, v) => acc + (Number.isFinite(v) ? v : 0), 0);
      if (sumProgress > 0) return sumProgress.toLocaleString();
    }
    return "0";
  };

  return (
    <div className={styles.targetsContainer}>
      {/* Simple Header with Create Button */}
      <div className={styles.simpleHeader}>
        <button className="homebtn" onClick={() => navigate('/targets/create-target')}>
          + Create Target
        </button>
      </div>


      {/* Targets Table - always render structure, fill rows as data loads */}
        <div className="row m-0 p-3 justify-content-center">
          <div className="col-md-12">
            <div className="table-responsive">
              <table className="table table-hover table-bordered borderedtable">
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>Particulars</th>
                    <th>Target Number</th>
                    <th>Target Unit</th>
                    <th>Assigned On</th>
                    <th>Deadline</th>
                    <th>Currently Met</th>
                  </tr>
                </thead>
                <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-4">
                      <div className="d-flex flex-column align-items-center">
                        <Loading />
                        <p className="mt-2 mb-0 text-muted">Loading active targets...</p>
                      </div>
                    </td>
                  </tr>
                ) : targets.length === 0 ? (
                  <tr className="animated-row">
                    <td colSpan={7} className="text-center py-4">
                      <div className="text-muted">
                        <i className="bi bi-inbox display-4 d-block mb-2"></i>
                        <h6>No Active Targets Found</h6>
                        <p className="mb-0">Click "Create Target" to add your first target.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  targets.map((row, idx) => (
                    <tr
                      key={row.id || row.targetCode || idx}
                      className="animated-row"
                      style={{ animationDelay: `${idx * 0.1}s`, cursor: 'pointer' }}
                      onClick={() => navigate(`/targets/${row.id}`)}
                    >
                      <td className="text-center">{idx + 1}</td>
                      <td>
                        <div>
                          <div className="fw-medium text-primary">
                            {row.name || 'Unnamed Target'}
                          </div>
                          <div className="text-muted small">
                            {renderParticulars(row)}
                          </div>
                          {row.targetType && (
                            <span className={`badge ${
                              row.targetType === 'sales' ? 'bg-success' : 
                              row.targetType === 'customer' ? 'bg-info' : 'bg-secondary'
                            } mt-1`}>
                              {row.targetType}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="text-center fw-medium">
                        {renderTargetNumber(row)}
                      </td>
                      <td>
                        <span className="badge bg-light text-dark">
                          {renderTargetUnit(row)}
                        </span>
                      </td>
                      <td>{renderAssignedOn(row)}</td>
                      <td>
                        <span className={`badge ${
                          new Date(row.endDate) < new Date() ? 'bg-danger' : 'bg-warning'
                        }`}>
                          {renderDeadline(row)}
                        </span>
                      </td>
                      <td className="text-center">
                        <div className="d-flex flex-column align-items-center">
                          {row.budgetNumber && (
                            <div className="progress" style={{ width: '70px', height: '6px' }}>
                              <div
                                className={`progress-bar ${
                                  (Number(renderCurrentlyMet(row).toString().replace(/,/g, '')) / row.budgetNumber) * 100 >= 100 ? 'bg-success' :
                                  (Number(renderCurrentlyMet(row).toString().replace(/,/g, '')) / row.budgetNumber) * 100 >= 75 ? 'bg-info' :
                                  (Number(renderCurrentlyMet(row).toString().replace(/,/g, '')) / row.budgetNumber) * 100 >= 50 ? 'bg-warning' : 'bg-danger'
                                }`}
                                role="progressbar"
                                style={{ 
                                  width: `${Math.min((Number(renderCurrentlyMet(row).toString().replace(/,/g, '')) / row.budgetNumber) * 100, 100)}%` 
                                }}
                              ></div>
                            </div>
                          )}
                          <span className="fw-medium mt-1">
                            {renderCurrentlyMet(row)}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      

      {/* Error Modal */}
      {isErrorOpen && (
        <ErrorModal isOpen={isErrorOpen} message={error} onClose={closeError} />
      )}
    </div>
  );
}

export default TargetsHome;
