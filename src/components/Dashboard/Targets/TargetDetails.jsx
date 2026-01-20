import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import customerStyles from "../Customers/Customer.module.css";
import { FaUsers, FaUser, FaCalendarAlt, FaMoneyBillWave, FaChartLine } from "react-icons/fa";
import Loading from "@/components/Loading";
import ErrorModal from "@/components/ErrorModal";
import targetService from "@/services/targetService";
import { useAuth } from "@/Auth";

function TargetDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { axiosAPI } = useAuth();
  const API_BASE = import.meta.env.VITE_API_URL || "";

  const [target, setTarget] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [teamsData, setTeamsData] = useState({}); // Store team details by teamId
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);

  useEffect(() => {
    if (id) {
      fetchTargetDetails();
    }
  }, [id]);

  /**
   * Fetch detailed target information
   */
  const fetchTargetDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch target details using axiosAPI directly
      const response = await axiosAPI.get(`/targets/${id}`);
      console.log("Target details API response:", response);
      
      // According to API docs, response structure is:
      // { success: true, message: "...", target: {...} }
      const responseData = response.data;
      
      // Handle different response formats
      let targetData = null;
      if (responseData?.target) {
        targetData = responseData.target;
      } else if (responseData?.data?.target) {
        targetData = responseData.data.target;
      } else if (responseData?.data && (responseData.data.id || responseData.data.name)) {
        // Response data is the target object directly
        targetData = responseData.data;
      } else if (responseData && (responseData.id || responseData.name)) {
        // Response is the target object directly
        targetData = responseData;
      } else {
        throw new Error("Invalid response format from target API");
      }
      
      if (!targetData) {
        throw new Error("Target data not found in response");
      }
      
      console.log("Parsed target data:", targetData);
      setTarget(targetData);

      // Assignments are included in the target object according to API docs
      let assignmentsData = [];
      if (targetData.assignments && Array.isArray(targetData.assignments)) {
        assignmentsData = targetData.assignments;
      } else {
        // Fallback: try to fetch assignments separately if not included
        try {
          const assignmentsUrl = `${API_BASE}/targets/${id}/assignments`;
          const assignmentsRes = await axiosAPI.get(assignmentsUrl);
          console.log("Assignments response:", assignmentsRes);
          assignmentsData = Array.isArray(assignmentsRes.data?.assignments)
            ? assignmentsRes.data.assignments
            : Array.isArray(assignmentsRes.data)
            ? assignmentsRes.data
            : [];
        } catch (assignmentsError) {
          console.log("Assignments not found in target object and failed to fetch separately:", assignmentsError);
          assignmentsData = [];
        }
      }
      
      setAssignments(assignmentsData);

      // If team assignments, fetch team details for teams that don't have full team object
      if (targetData.assignmentType === 'team' && assignmentsData.length > 0) {
        const teamIdsToFetch = assignmentsData
          .filter(a => a.teamId && !a.team?.name)
          .map(a => a.teamId)
          .filter((id, index, self) => self.indexOf(id) === index); // unique IDs
        
        if (teamIdsToFetch.length > 0) {
          // Fetch team details for missing teams
          Promise.all(
            teamIdsToFetch.map(async (teamId) => {
              try {
                const teamRes = await axiosAPI.get(`/teams/${teamId}`);
                const teamData = teamRes.data?.team || teamRes.data?.data?.team || teamRes.data?.data || teamRes.data;
                return { teamId, teamData };
              } catch (err) {
                console.log(`Failed to fetch team ${teamId}:`, err);
                return { teamId, teamData: null };
              }
            })
          ).then(results => {
            const teamsMap = {};
            results.forEach(({ teamId, teamData }) => {
              if (teamData) {
                teamsMap[teamId] = teamData;
              }
            });
            setTeamsData(teamsMap);
          });
        }
      }
    } catch (error) {
      console.error("Error fetching target details:", error);
      console.error("Error details:", error.response || error);
      setError(error?.response?.data?.message || error?.message || "Failed to fetch target details");
      setIsErrorModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Format currency
   */
  const formatCurrency = (amount, unit) => {
    if (!amount && amount !== 0) return 'N/A';
    if (unit === 'rupees') {
      return `₹${Number(amount).toLocaleString('en-IN')}`;
    }
    return `${Number(amount).toLocaleString('en-IN')} ${unit || ''}`;
  };

  /**
   * Format date
   */
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  /**
   * Get status badge class
   */
  const getStatusBadgeClass = (status) => {
    if (!status) return 'bg-secondary';
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-success';
      case 'inactive':
        return 'bg-secondary';
      case 'completed':
        return 'bg-primary';
      default:
        return 'bg-warning';
    }
  };

  /**
   * Calculate days remaining
   */
  const getDaysRemaining = (endDate) => {
    if (!endDate) return 'N/A';
    try {
      const today = new Date();
      const end = new Date(endDate);
      const diffTime = end - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) {
        return `${Math.abs(diffDays)} days overdue`;
      } else if (diffDays === 0) {
        return 'Due today';
      } else {
        return `${diffDays} days remaining`;
      }
    } catch {
      return 'N/A';
    }
  };

  /**
   * Calculate progress percentage
   */
  const calculateProgress = () => {
    if (!target?.budgetNumber || target.budgetNumber === 0) return 0;
    if (!assignments || assignments.length === 0) return 0;
    
    const totalProgress = assignments.reduce((sum, assignment) => {
      return sum + (Number(assignment.currentProgress) || 0);
    }, 0);
    
    return Math.min((totalProgress / target.budgetNumber) * 100, 100);
  };

  if (loading) {
    return (
      <div className="row m-0 p-3">
        <div className="col-12 text-center py-5">
          <Loading />
          <p className="mt-3">Loading target details...</p>
        </div>
      </div>
    );
  }

  if (!target) {
    return (
      <div className="row m-0 p-3">
        <div className="col-12 text-center py-5">
          <p className="text-danger">Target not found</p>
          <button className="btn btn-secondary" onClick={() => navigate('/targets')}>
            Back to Targets
          </button>
        </div>
      </div>
    );
  }

  const progressPercentage = calculateProgress();

  return (
    <>
      {/* Breadcrumb Navigation */}
      <p className="path">
        <span onClick={() => navigate("/targets")}>Targets</span>{" "}
        <i className="bi bi-chevron-right"></i> Target Details
      </p>

      <div className="row m-0 p-3">
        <h5 className={customerStyles.head}>Target Details</h5>

        {/* Header Section */}
        <div className="col-12 mb-4">
          <div className="d-flex justify-content-between align-items-start">
            <div>
              <h4 className="mb-2">{target.name || 'Unnamed Target'}</h4>
              <div className="d-flex gap-2 align-items-center flex-wrap">
                {target.targetCode && (
                  <span className="badge bg-light text-dark">
                    {target.targetCode}
                  </span>
                )}
                {target.status && (
                  <span className={`badge ${getStatusBadgeClass(target.status)}`}>
                    {target.status}
                  </span>
                )}
                {target.targetType && (
                  <span className="badge bg-info">
                    {target.targetType === 'sales' ? 'Sales Target' : 'Customer Target'}
                  </span>
                )}
                {target.assignmentType && (
                  <span className={`badge ${target.assignmentType === 'team' ? 'bg-primary' : 'bg-secondary'}`}>
                    {target.assignmentType === 'team' ? 'Team Assignment' : 'Employee Assignment'}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="col-md-3 mb-3">
          <div className="card border-0 bg-light h-100">
            <div className="card-body text-center">
              <h6 className="card-title mb-1">Budget</h6>
              <p className="card-text mb-0">
                {formatCurrency(target.budgetNumber, target.budgetUnit)}
              </p>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card border-0 bg-light h-100">
            <div className="card-body text-center">
              <h6 className="card-title mb-1">Duration</h6>
              <p className="card-text mb-0">
                {target.timeFrameValue || 'N/A'} {target.timeFrame || ''}
              </p>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card border-0 bg-light h-100">
            <div className="card-body text-center">
              <h6 className="card-title mb-1">Assignments</h6>
              <p className="card-text mb-0">
                {assignments.length || 0} {target.assignmentType || 'assignments'}
              </p>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card border-0 bg-light h-100">
            <div className="card-body text-center">
              <h6 className="card-title mb-1">Time Left</h6>
              <p className="card-text mb-0">
                {getDaysRemaining(target.endDate)}
              </p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        {target.budgetNumber && (
          <div className="col-12 mb-4">
            <div className="card">
              <div className="card-body">
                <h6 className="card-title">Overall Progress</h6>
                <div className="progress" style={{ height: '25px' }}>
                  <div
                    className={`progress-bar ${
                      progressPercentage >= 100 ? 'bg-success' :
                      progressPercentage >= 75 ? 'bg-info' :
                      progressPercentage >= 50 ? 'bg-warning' : 'bg-danger'
                    }`}
                    role="progressbar"
                    style={{ width: `${progressPercentage}%` }}
                  >
                    {progressPercentage.toFixed(1)}%
                  </div>
                </div>
                <div className="d-flex justify-content-between mt-2">
                  <small className="text-muted">
                    Current: {formatCurrency(
                      assignments.reduce((sum, a) => sum + (Number(a.currentProgress) || 0), 0),
                      target.budgetUnit
                    )}
                  </small>
                  <small className="text-muted">
                    Target: {formatCurrency(target.budgetNumber, target.budgetUnit)}
                  </small>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Target Information */}
        <div className="col-md-6 mb-3">
          <div className="card">
            <div className="card-header">
              <h6 className="mb-0">Target Information</h6>
            </div>
            <div className="card-body">
              <table className="table table-sm table-borderless mb-0">
                <tbody>
                  <tr>
                    <td className="fw-bold" style={{ width: '40%' }}>Start Date:</td>
                    <td>{formatDate(target.startDate)}</td>
                  </tr>
                  <tr>
                    <td className="fw-bold">End Date:</td>
                    <td>{formatDate(target.endDate)}</td>
                  </tr>
                  <tr>
                    <td className="fw-bold">Priority:</td>
                    <td>
                      <span className={`badge ${
                        target.priority === 'high' ? 'bg-danger' :
                        target.priority === 'medium' ? 'bg-warning' : 'bg-secondary'
                      }`}>
                        {target.priority || 'N/A'}
                      </span>
                    </td>
                  </tr>
                  {target.division && (
                    <tr>
                      <td className="fw-bold">Division:</td>
                      <td>{target.division.name || target.division}</td>
                    </tr>
                  )}
                  {target.createdByEmployee && (
                    <tr>
                      <td className="fw-bold">Created By:</td>
                      <td>
                        {target.createdByEmployee.name || 'N/A'}
                        {target.createdByEmployee.employeeId && (
                          <small className="text-muted d-block">
                            ({target.createdByEmployee.employeeId})
                          </small>
                        )}
                      </td>
                    </tr>
                  )}
                  {target.createdAt && (
                    <tr>
                      <td className="fw-bold">Created On:</td>
                      <td>{formatDate(target.createdAt)}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Description and Notes */}
        <div className="col-md-6 mb-3">
          <div className="card">
            <div className="card-header">
              <h6 className="mb-0">Description</h6>
            </div>
            <div className="card-body">
              <p className="card-text mb-0">
                {target.description || 'No description provided'}
              </p>
              {target.notes && (
                <div className="mt-3">
                  <strong>Notes:</strong>
                  <p className="mb-0 text-muted">{target.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Assignments Table */}
        <div className="col-12 mb-3">
          <div className="card">
            <div className="card-header">
              <h6 className="mb-0">
                {target.assignmentType === 'team' ? 'Team Assignments' : 'Employee Assignments'}
              </h6>
            </div>
            <div className="card-body">
              {assignments && assignments.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-bordered borderedtable">
                    <thead>
                      <tr>
                        <th>S.No</th>
                        {target.assignmentType === 'team' ? (
                          <>
                            <th>Team Name</th>
                            <th>Team Members</th>
                          </>
                        ) : (
                          <th>Employee Name</th>
                        )}
                        <th>Individual Budget</th>
                        <th>Current Progress</th>
                        <th>Progress %</th>
                        <th>Status</th>
                        {target.assignmentType === 'employee' && <th>Employee ID</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {assignments.map((assignment, index) => {
                        const assignmentProgress = assignment.individualBudgetNumber
                          ? ((Number(assignment.currentProgress) || 0) / assignment.individualBudgetNumber) * 100
                          : 0;
                        
                        // Extract team name from notes if assignmentType is team
                        let teamName = 'N/A';
                        if (target.assignmentType === 'team') {
                          // Check if assignment has team object
                          if (assignment.team?.name) {
                            teamName = assignment.team.name;
                          } else if (assignment.teamId && teamsData[assignment.teamId]?.name) {
                            teamName = teamsData[assignment.teamId].name;
                          } else if (assignment.notes) {
                            // Extract team name from notes: "Assigned to team member during team target creation (Team: team1)"
                            const match = assignment.notes.match(/Team:\s*([^)]+)/);
                            if (match && match[1]) {
                              teamName = match[1].trim();
                            }
                          }
                        }
                        
                        // Get employee name
                        const employeeName = assignment.employee?.name || assignment.employeeName || 'N/A';
                        
                        return (
                          <tr key={assignment.id || index}>
                            <td className="text-center">{index + 1}</td>
                            {target.assignmentType === 'team' ? (
                              <>
                                <td>{teamName}</td>
                                <td>{employeeName}</td>
                              </>
                            ) : (
                              <td>{employeeName}</td>
                            )}
                            <td>
                              {formatCurrency(
                                assignment.individualBudgetNumber,
                                target.budgetUnit
                              )}
                            </td>
                            <td>
                              {formatCurrency(
                                assignment.currentProgress || 0,
                                target.budgetUnit
                              )}
                            </td>
                            <td>
                              <div className="progress" style={{ height: '20px' }}>
                                <div
                                  className={`progress-bar ${
                                    assignmentProgress >= 100 ? 'bg-success' :
                                    assignmentProgress >= 75 ? 'bg-info' :
                                    assignmentProgress >= 50 ? 'bg-warning' : 'bg-danger'
                                  }`}
                                  role="progressbar"
                                  style={{ width: `${Math.min(assignmentProgress, 100)}%` }}
                                >
                                  {assignmentProgress.toFixed(1)}%
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className={`badge ${getStatusBadgeClass(assignment.status)}`}>
                                {assignment.status || 'Active'}
                              </span>
                            </td>
                            {target.assignmentType === 'employee' && (
                              <td>
                                {assignment.employee?.employeeId || 'N/A'}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted mb-0">No assignments found</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Error Modal */}
      {isErrorModalOpen && (
        <ErrorModal
          isOpen={isErrorModalOpen}
          message={error}
          onClose={() => {
            setIsErrorModalOpen(false);
            setError(null);
            navigate('/targets');
          }}
        />
      )}
    </>
  );
}

export default TargetDetails;

