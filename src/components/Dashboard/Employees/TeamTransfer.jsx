import React, { useEffect, useMemo, useState } from "react";
import styles from "./Employees.module.css";
import { useAuth } from "@/Auth";
// Using axiosAPI from Auth context for consistency with rest of app

function TeamTransfer({ navigate, isAdmin }) {
  const { axiosAPI } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [employees, setEmployees] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, itemsPerPage: 50, totalPages: 1 });
  const [search, setSearch] = useState("");

  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [availableTeams, setAvailableTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [transferReason, setTransferReason] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const loadEmployees = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const params = { page, limit: pagination.itemsPerPage };
      if (search) params.search = search;
      const res = await axiosAPI.get(`/team-transfers/employees/for-transfer`, params);
      const data = res?.data ?? {};
      const list = data?.data?.employees || data?.employees || [];
      const pager = data?.data?.pagination || data?.pagination || { currentPage: page, totalPages: 1, itemsPerPage: 50 };
      setEmployees(list);
      setPagination(pager);
    } catch (e) {
      setError(e?.message || "Failed to load employees");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSelectEmployee = async (emp) => {
    setSelectedEmployee(emp);
    setAvailableTeams([]);
    setSelectedTeamId("");
    setTransferReason("");
    setSuccessMsg("");
    if (!emp?.id) return;
    try {
      setLoading(true);
      const res = await axiosAPI.get(`/team-transfers/available-teams/${emp.id}`);
      const data = res?.data ?? {};
      const teams = data?.data?.availableTeams || data?.availableTeams || [];
      setAvailableTeams(teams);
    } catch (e) {
      setError(e?.message || "Failed to load available teams");
    } finally {
      setLoading(false);
    }
  };

  const onSubmitTransfer = async () => {
    setError(null);
    setSuccessMsg("");
    if (!selectedEmployee?.id || !selectedTeamId) {
      setError("Select employee and target team");
      return;
    }
    try {
      setLoading(true);
      const payload = { employeeId: selectedEmployee.id, toTeamId: Number(selectedTeamId), transferReason: transferReason || "" };
      const res = await axiosAPI.post(`/team-transfers/transfer`, payload);
      const data = res?.data ?? {};
      const ok = data?.success !== false;
      if (!ok) throw new Error(data?.message || "Transfer failed");
      setSuccessMsg(data?.message || "Employee transferred successfully");
      // Refresh lists/history for the employee
      onSelectEmployee(selectedEmployee);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Transfer failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid">
      <div className="row m-0 p-3">
        <div className="col">
          <p className="path">
            <span onClick={() => navigate("/employees")}>Employees</span>{" "}
            <i className="bi bi-chevron-right"></i> Team Transfer
          </p>
        </div>
      </div>

      {error && (
        <div className="row m-0 px-3">
          <div className="col">
            <div className="alert alert-danger">{error}</div>
          </div>
        </div>
      )}
      {successMsg && (
        <div className="row m-0 px-3">
          <div className="col">
            <div className="alert alert-success">{successMsg}</div>
          </div>
        </div>
      )}

      {/* Employees list + search */}
      <div className="row m-0 p-3">
        <div className="col-12 col-lg-6">
          <div className={styles.longform}>
            <div className="mb-2">
              <label className="me-2">Search</label>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="name/id/mobile" />
              <button className="ms-2" onClick={() => loadEmployees(1)} disabled={loading}>Search</button>
            </div>
            <div style={{ maxHeight: 360, overflow: 'auto', border: '1px solid #eee', borderRadius: 4, padding: 8 }}>
              {loading && <div>Loading...</div>}
              {!loading && employees?.length === 0 && <div>No employees</div>}
              {!loading && employees?.map((e) => (
                <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', borderBottom: '1px dashed #ddd' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{e.name} {e.employeeId ? `(${e.employeeId})` : ''}</div>
                    <div style={{ fontSize: 12, color: '#666' }}>{e?.role} · {e?.mobile}</div>
                    {e?.team?.name && <div style={{ fontSize: 12 }}>Team: {e.team.name}</div>}
                  </div>
                  <div>
                    <button className="homebtn" onClick={() => onSelectEmployee(e)}>Select</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Available teams and submit */}
        <div className="col-12 col-lg-6">
          <div className={styles.longform}>
            <div className="mb-2">
              <span>Selected Employee:</span>
              <div style={{ fontWeight: 600, marginTop: 6 }}>{selectedEmployee ? `${selectedEmployee.name} (${selectedEmployee?.employeeId || selectedEmployee?.id})` : 'None'}</div>
            </div>
            <div className="mb-2">
              <label className="me-2">Available Teams</label>
              <select value={selectedTeamId} onChange={(e) => setSelectedTeamId(e.target.value)} disabled={!selectedEmployee}>
                <option value="">{availableTeams.length === 0 ? 'No teams available' : 'Select team'}</option>
                {availableTeams.map((t) => (
                  <option key={t.id} value={t.id}>{t.name} {t?.subZone ? `- ${t.subZone}` : ''}</option>
                ))}
              </select>
            </div>
            <div className="mb-2">
              <label className="me-2">Reason</label>
              <input value={transferReason} onChange={(e) => setTransferReason(e.target.value)} placeholder="Transfer reason" />
            </div>
            <div className="mt-3">
              <button className="homebtn" disabled={!selectedEmployee || !selectedTeamId || loading} onClick={onSubmitTransfer}>Transfer</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TeamTransfer;


