import React, { useEffect, useState } from "react";
import { useAuth } from "@/Auth";
import { useDivision } from "@/components/context/DivisionContext";
import ErrorModal from "@/components/ErrorModal";
import Loading from "@/components/Loading";
import TeamViewModal from "./TeamViewModal";
import teamsService from "@/services/teamsService";
import styles from "./Teams.module.css";

function TeamsHome({ navigate, isAdmin }) {
  const [teams, setTeams] = useState([]);
  const { axiosAPI } = useAuth();
  const { selectedDivision, showAllDivisions } = useDivision();
  const [employees, setEmployees] = useState([]);
  const [error, setError] = useState();
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  
  const closeModal = () => {
    setIsModalOpen(false);
  };
  
  const [trigger, setTrigger] = useState(false);
  const onTrigger = () => setTrigger(!trigger);

  useEffect(() => {
    async function fetchTeams() {
      try {
        setLoading(true);
        const storedSubZoneId = localStorage.getItem('currentSubZoneId');
        if (storedSubZoneId) {
          const data = await teamsService.listTeams(storedSubZoneId);
          const list = data?.data?.teams || data?.teams || data?.data || data || [];
          setTeams(Array.isArray(list) ? list : []);
        } else {
          // Use DivisionContext for division-based endpoint
          const divisionId = selectedDivision?.id;
          let endpoint = "/teams";
          
          // Use showAllDivisions from context if available, otherwise check division ID
          if (showAllDivisions || divisionId === "all" || selectedDivision?.isAllDivisions === true) {
            endpoint += `?showAllDivisions=true`;
          } else if (divisionId && divisionId !== "all" && divisionId !== "1") {
            endpoint += `?divisionId=${divisionId}`;
          }
          // If no division is selected, don't add query params (let backend handle default)
          
          const res = await axiosAPI.get(endpoint);
          const list =
            res?.data?.data?.teams ||
            res?.data?.teams ||
            (Array.isArray(res?.data?.data) ? res.data.data : null) ||
            (Array.isArray(res?.data) ? res.data : null) ||
            [];
          setTeams(Array.isArray(list) ? list : []);
        }
        
        // Clear the update flag after successful fetch
        localStorage.removeItem('teamsDataUpdated');
      } catch (err) {
        console.error("Failed to load teams:", err);
        // If 403 error, try without showAllDivisions
        if (err.response?.status === 403) {
          try {
            const divisionId = selectedDivision?.id;
            let endpoint = "/teams";
            if (divisionId && divisionId !== "all" && divisionId !== "1") {
              endpoint += `?divisionId=${divisionId}`;
            }
            const res = await axiosAPI.get(endpoint);
            const list =
              res?.data?.data?.teams ||
              res?.data?.teams ||
              (Array.isArray(res?.data?.data) ? res.data.data : null) ||
              (Array.isArray(res?.data) ? res.data : null) ||
              [];
            setTeams(Array.isArray(list) ? list : []);
          } catch (retryErr) {
            setError("Failed to load teams data. You may not have permission to view teams.");
            setIsModalOpen(true);
          }
        } else {
          setError("Failed to load teams data.");
          setIsModalOpen(true);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchTeams();
  }, [trigger, axiosAPI, selectedDivision, showAllDivisions]);

  // Check for data updates when component mounts or becomes visible
  useEffect(() => {
    const checkForUpdates = () => {
      const lastUpdate = localStorage.getItem('teamsDataUpdated');
      if (lastUpdate) {
        // Trigger a refresh if data was updated
        setTrigger(prev => !prev);
      }
    };

    // Check immediately when component mounts
    checkForUpdates();

    // Also check when the page becomes visible (user navigates back)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkForUpdates();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const [statusFilter, setStatusFilter] = useState('all');
  const [teamFilter, setTeamFilter] = useState('');
  const [employeeFilter, setEmployeeFilter] = useState('');

  // Fetch employees for Employee filter
  useEffect(() => {
    async function fetchEmployees() {
      try {
        const divisionId = selectedDivision?.id;
        let endpoint = '/employees';
        
        // Use showAllDivisions from context if available, otherwise check division ID
        if (showAllDivisions || divisionId === "all" || selectedDivision?.isAllDivisions === true) {
          endpoint += `?showAllDivisions=true`;
        } else if (divisionId && divisionId !== "all" && divisionId !== "1") {
          endpoint += `?divisionId=${divisionId}`;
        }
        // If no division is selected, don't add query params (let backend handle default)
        
        const res = await axiosAPI.get(endpoint);
        let employeeData = [];
        if (res.data && res.data.success && Array.isArray(res.data.data)) {
          employeeData = res.data.data;
        } else if (res.data && Array.isArray(res.data.employees)) {
          employeeData = res.data.employees;
        } else if (Array.isArray(res.data)) {
          employeeData = res.data;
        }
        setEmployees(employeeData);
      } catch (e) {
        // If 403 error, try without showAllDivisions
        if (e.response?.status === 403) {
          try {
            const divisionId = selectedDivision?.id;
            let endpoint = '/employees';
            if (divisionId && divisionId !== "all" && divisionId !== "1") {
              endpoint += `?divisionId=${divisionId}`;
            }
            const res = await axiosAPI.get(endpoint);
            let employeeData = [];
            if (res.data && res.data.success && Array.isArray(res.data.data)) {
              employeeData = res.data.data;
            } else if (res.data && Array.isArray(res.data.employees)) {
              employeeData = res.data.employees;
            } else if (Array.isArray(res.data)) {
              employeeData = res.data;
            }
            setEmployees(employeeData);
          } catch (retryErr) {
            console.error("Failed to load employees:", retryErr);
            setEmployees([]);
          }
        } else {
          console.error("Failed to load employees:", e);
          setEmployees([]);
        }
      }
    }
    fetchEmployees();
  }, [axiosAPI, selectedDivision, showAllDivisions]);

  let index = 1;
  
  // Helper: get team id and membership checks
  const getTeamId = (team) => team.id || team.teamId;
  const teamIncludesEmployee = (team, empId) => {
    if (!empId) return true;
    const matchId = Number(empId);
    const headId = team.teamHead?.id || team.teamLead?.id || team.lead?.id || null;
    if (Number(headId) === matchId) return true;
    const members = Array.isArray(team.teamMembers) ? team.teamMembers : (Array.isArray(team.members) ? team.members : []);
    return members.some((m) => {
      const mid = m?.id || m?.employee?.id || m?.user?.id || (typeof m === 'number' ? m : null);
      return Number(mid) === matchId;
    });
  };

  // Apply filters: status, team, employee
  const filteredTeams = teams
    .filter(team => {
      if (statusFilter === 'all') return true;
      const status = team?.status || (team?.isActive ? 'Active' : 'Inactive');
      return status === statusFilter;
    })
    .filter(team => {
      if (!teamFilter) return true;
      return String(getTeamId(team)) === String(teamFilter);
    })
    .filter(team => teamIncludesEmployee(team, employeeFilter));
  
  // Show loading state
  if (loading) {
    return (
      <div className="p-4">
        <Loading />
        <p className="text-center mt-3">Loading teams...</p>
      </div>
    );
  }

  return (
    <>
      <p className="path">
        <span onClick={() => navigate("/employees")}>Employees</span>{" "}
        <i className="bi bi-chevron-right"></i> Teams
      </p>

      {/* Create Team Button */}
      <div className="row m-0 p-3">
        <div className="col">
          {isAdmin && (
            <button
              className="homebtn"
              onClick={() => navigate("/teams/create-team")}
            >
              Create Team
            </button>
          )}
        </div>
      </div>

      {/* Show sample data if no teams loaded */}
      {(!teams || teams.length === 0) && !loading && (
        <div className="alert alert-warning m-3">
          <strong>No Teams Data Available</strong>
          <br />
          This could be due to:
          <ul>
            <li>API connection issues</li>
            <li>Authentication problems</li>
            <li>No teams in the current division</li>
            <li>Backend service not running</li>
          </ul>
          <button 
            className="btn btn-primary me-2" 
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
          <button 
            className="btn btn-secondary me-2" 
            onClick={() => navigate("/employees")}
          >
            Back to Employees
          </button>
        </div>
      )}

      <div className="row m-0 p-3 justify-content-center">
        <div className="col-lg-12">
          {/* Filter Controls */}
          <div className="row m-0 p-3">
            <div className="col-3 formcontent">
              <label htmlFor="">Status:</label>
              <select
                name=""
                id=""
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Teams</option>
                <option value="Active">Active Only</option>
                <option value="Inactive">Inactive Only</option>
              </select>
            </div>
            <div className="col-3 formcontent">
              <label htmlFor="">Team:</label>
              <select
                name=""
                id=""
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value)}
              >
                <option value="">All Teams</option>
                {teams.map((t) => (
                  <option key={getTeamId(t)} value={getTeamId(t)}>
                    {t.teamName || t.name || getTeamId(t)}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-3 formcontent">
              <label htmlFor="">Employee:</label>
              <select
                name=""
                id=""
                value={employeeFilter}
                onChange={(e) => setEmployeeFilter(e.target.value)}
              >
                <option value="">All Employees</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name || emp.fullName || emp.employeeId || emp.id}
                  </option>
                ))}
              </select>
            </div>
            
          </div>
          
          <table className={`table table-bordered borderedtable`}>
            <thead>
              <tr>
                <th>S.No</th>
                <th>Team ID</th>
                <th>Team Name</th>
                <th>Team Lead</th>
                <th>Lead Mobile</th>
                <th>Member Count</th>
                <th>Status</th>
                <th>Division</th>
                <th>Created By</th>
                {isAdmin && <th>Action</th>}
              </tr>
            </thead>
            <tbody>
              {(!filteredTeams || filteredTeams.length === 0) && (
                <tr>
                  <td colSpan={10}>
                    {loading ? 'Loading...' : 'NO DATA FOUND'}
                  </td>
                </tr>
              )}
              {filteredTeams && filteredTeams.length > 0 &&
                filteredTeams.map((team) => (
                  <tr
                    key={team.id}
                    className="animated-row"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <td>{index++}</td>
                    <td>{team.teamId || team.id || "-"}</td>
                    <td>{team.teamName || team.name || "-"}</td>
                    <td>{team.teamHead?.name || team.teamLead?.name || team.lead?.name || (typeof team.teamLead === 'string' ? team.teamLead : (typeof team.lead === 'string' ? team.lead : '-'))}</td>
                    <td>{team.teamHead?.mobile || team.teamLeadMobile || team.leadMobile || "-"}</td>
                    <td>{Array.isArray(team.teamMembers) ? team.teamMembers.length : (Array.isArray(team.members) ? team.members.length : (team.memberCount || team.members || "-"))}</td>
                    <td>
                      <span className={`badge ${(team.status || (team.isActive ? 'Active' : 'Inactive')) === 'Active' ? 'bg-success' : 'bg-danger'}`}>
                        {team.status || (team.isActive ? 'Active' : 'Inactive')}
                      </span>
                    </td>
                    <td>{team.divisionName || team.division?.name || team.subZone?.zone?.division?.name || (typeof team.division === 'string' ? team.division : '-')}</td>
                    <td>{team.createdBy || team.created_by || team.createdByUser || '-'}</td>
                    <td className={styles.delcol}>
                      <button
                        className="btn btn-sm btn-info me-2"
                        onClick={() => navigate(`/teams/${team.id || team.teamId}`)}
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <ErrorModal isOpen={isModalOpen} message={error} onClose={closeModal} />
      )}

      {isViewModalOpen && selectedTeam && (
        <TeamViewModal 
          isOpen={isViewModalOpen} 
          onClose={() => setIsViewModalOpen(false)}
          team={selectedTeam}
          isAdmin={isAdmin}
        />
      )}
    </>
  );
}

export default TeamsHome;
