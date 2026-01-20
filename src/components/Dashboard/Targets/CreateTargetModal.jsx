import React, { useState, useEffect } from "react";
import { useAuth } from "@/Auth";
import styles from "./Targets.module.css";
import purchaseStyles from "../Purchases/Purchases.module.css";
import Loading from "@/components/Loading";
import ErrorModal from "@/components/ErrorModal";
import targetService from "@/services/targetService";
import {
  DialogActionTrigger,
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogRoot,
  DialogTrigger,
} from "@/components/ui/dialog";

function CreateTargetModal({ isOpen, onClose, onSuccess }) {
  const { axiosAPI } = useAuth();
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    targetType: 'sales',
    assignmentType: 'team',
    budgetNumber: '',
    budgetUnit: 'rupees',
    timeFrame: 'months',
    timeFrameValue: '',
    startDate: '',
    endDate: '',
    description: '',
    priority: 'medium',
    notes: '',
    divisionId: null,
    teamIds: [],
    employeeIds: [],
    teamMemberAssignments: [] // Array of {employeeId, individualBudgetNumber, teamId}
  });

  // Dropdown options
  const [teams, setTeams] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [teamMembersByTeam, setTeamMembersByTeam] = useState({});
  const [selectedTeamMembers, setSelectedTeamMembers] = useState({}); // {employeeId: {budget, teamId}}

  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [errors, setErrors] = useState({});

  // Load data when modal opens or assignment type changes
  useEffect(() => {
    if (isOpen) {
      console.log('Modal opened or assignment type changed. Loading data for:', formData.assignmentType);
      if (formData.assignmentType === 'team') {
        loadTeams();
      } else if (formData.assignmentType === 'employee') {
        loadEmployees();
      }
    }
  }, [isOpen, formData.assignmentType]);

  // Debug: Log teams state changes
  useEffect(() => {
    console.log('Teams state changed. Current teams:', teams);
    console.log('Teams length:', teams.length);
    if (teams.length > 0) {
      console.log('First team:', teams[0]);
    }
  }, [teams]);

  // Load team members when teams are selected
  useEffect(() => {
    if (isOpen && formData.assignmentType === 'team') {
      if (formData.teamIds.length > 0) {
        console.log('Teams selected, loading team members for:', formData.teamIds);
        loadTeamMembers(formData.teamIds);
      } else {
        // Clear team members when no teams are selected
        setTeamMembers([]);
        setTeamMembersByTeam({});
        setSelectedTeamMembers({});
      }
    }
  }, [formData.teamIds, formData.assignmentType, isOpen]);


  /**
   * Load teams for current division - Step 1
   */
  const loadTeams = async () => {
    try {
      setLoading(true);
      console.log('Step 1: Loading teams from /targets/dropdowns/teams...');
      
      // Get current division ID if available
      const currentDivisionId = localStorage.getItem('currentDivisionId');
      let endpoint = '/targets/dropdowns/teams';
      
      // Add divisionId as query parameter if available and not "1" (all divisions)
      if (currentDivisionId && currentDivisionId !== '1') {
        endpoint += `?divisionId=${currentDivisionId}`;
      }
      
      console.log('Calling endpoint:', endpoint);
      const response = await axiosAPI.get(endpoint);
      console.log('Full response object:', response);
      console.log('Response status:', response.status);
      console.log('Response data:', response.data);
      
      const data = response.data;
      
      // Check if API returned an error
      if (data?.success === false) {
        console.error('API returned success: false', data);
        setError(data?.message || "Failed to load teams from API");
        setIsErrorModalOpen(true);
        setTeams([]);
        return;
      }
      
      // Parse response according to API documentation:
      // { "success": true, "teams": [...] }
      let teamsList = [];
      
      // Check for the exact API format first
      if (data?.success === true && data?.teams && Array.isArray(data.teams)) {
        teamsList = data.teams;
      } 
      // Fallback to other possible formats
      else if (data?.teams && Array.isArray(data.teams)) {
        teamsList = data.teams;
      } else if (Array.isArray(data)) {
        teamsList = data;
      } else if (data?.data?.teams && Array.isArray(data.data.teams)) {
        teamsList = data.data.teams;
      } else if (data?.data && Array.isArray(data.data)) {
        teamsList = data.data;
      }
      
      console.log('Extracted teams list:', teamsList);
      console.log('Teams count:', teamsList.length);
      console.log('About to set teams state with:', teamsList);
      
      if (teamsList.length === 0) {
        console.warn('No teams found in response. Full response:', JSON.stringify(data, null, 2));
        console.warn('Response structure:', {
          isArray: Array.isArray(data),
          hasTeams: !!data?.teams,
          hasDataTeams: !!data?.data?.teams,
          hasData: !!data?.data,
          hasSuccess: data?.success,
          successValue: data?.success,
          keys: data ? Object.keys(data) : 'data is null/undefined'
        });
      }
      
      // Set teams state
      setTeams(teamsList);
      console.log('Teams state set. Current teams state will be:', teamsList);
    } catch (error) {
      console.error("Error loading teams:", error);
      console.error("Error response:", error.response);
      console.error("Error data:", error.response?.data);
      console.error("Error status:", error.response?.status);
      
      // Try to provide more helpful error message
      let errorMessage = "Failed to load teams";
      if (error.response?.status === 404) {
        errorMessage = "Teams endpoint not found. Please check the API configuration.";
      } else if (error.response?.status === 403) {
        errorMessage = "You don't have permission to view teams.";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      setIsErrorModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load team members for selected teams - Step 2
   */
  const loadTeamMembers = async (teamIds) => {
    if (!teamIds || teamIds.length === 0) {
      setTeamMembers([]);
      setTeamMembersByTeam({});
      setSelectedTeamMembers({});
      return;
    }

    try {
      setLoading(true);
      console.log('Step 2: Loading team members for teams:', teamIds);
      
      // Format teamIds as [5,6,7] for the API
      const teamIdsParam = teamIds.join(',');
      const response = await axiosAPI.get(`/targets/dropdowns/team-members?teamIds=[${teamIdsParam}]`);
      const data = response.data;
      console.log('Team members API response:', data);
      
      // Parse response according to API documentation:
      // { "success": true, "teams": [...], "teamMembers": [...], "teamMembersByTeam": {...} }
      const members = data?.teamMembers || [];
      const byTeam = data?.teamMembersByTeam || {};
      const teamsData = data?.teams || [];
      
      setTeamMembers(members);
      setTeamMembersByTeam(byTeam);
      
      // Initialize selected team members with empty budgets
      const initialSelections = {};
      members.forEach(member => {
        initialSelections[member.employeeId] = {
          budget: '',
          teamId: member.team?.id || member.teamId
        };
      });
      setSelectedTeamMembers(initialSelections);
    } catch (error) {
      console.error("Error loading team members:", error);
      setError("Failed to load team members");
      setIsErrorModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load employees for current division
   */
  const loadEmployees = async () => {
    try {
      setLoading(true);
      const currentDivisionId = localStorage.getItem('currentDivisionId') || '1';
      console.log('Loading employees for division:', currentDivisionId);
      const employeesResponse = await targetService.getEmployees(currentDivisionId);
      console.log('Employees response:', employeesResponse);
      const employeesList = employeesResponse.employees || [];
      console.log('Employees list:', employeesList);
      setEmployees(employeesList);
    } catch (error) {
      console.error("Error loading employees:", error);
      setError("Failed to load employees");
      setIsErrorModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle form field changes
   */
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: false
      }));
    }

    // Reset selections when assignment type changes
    if (field === 'assignmentType') {
      setFormData(prev => ({
        ...prev,
        teamIds: [],
        employeeIds: []
      }));
    }
  };

  /**
   * Handle multi-select changes
   */
  const handleMultiSelectChange = (field, selectedOptions) => {
    const values = Array.from(selectedOptions, option => parseInt(option.value));
    setFormData(prev => ({
      ...prev,
      [field]: values
    }));

    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: false
      }));
    }

    // Note: Team members are automatically loaded via useEffect when teamIds changes
  };

  /**
   * Handle team member budget change
   */
  const handleTeamMemberBudgetChange = (employeeId, budget, teamId) => {
    setSelectedTeamMembers(prev => ({
      ...prev,
      [employeeId]: {
        budget: budget,
        teamId: teamId
      }
    }));
  };

  /**
   * Validate form
   */
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = true;
    if (!formData.budgetNumber || formData.budgetNumber <= 0) newErrors.budgetNumber = true;
    if (!formData.timeFrameValue || formData.timeFrameValue <= 0) newErrors.timeFrameValue = true;
    if (!formData.startDate) newErrors.startDate = true;
    if (!formData.endDate) newErrors.endDate = true;
    
    // Validate assignment selection
    if (formData.assignmentType === 'team') {
      if (formData.teamIds.length === 0) {
        newErrors.teamIds = true;
      }
      // Validate team member assignments
      const validAssignments = Object.keys(selectedTeamMembers).filter(empId => {
        const assignment = selectedTeamMembers[empId];
        return assignment.budget && parseFloat(assignment.budget) > 0;
      });
      if (validAssignments.length === 0) {
        newErrors.teamMemberAssignments = true;
      }
    }
    if (formData.assignmentType === 'employee' && formData.employeeIds.length === 0) {
      newErrors.employeeIds = true;
    }

    // Validate date range
    if (formData.startDate && formData.endDate && formData.startDate >= formData.endDate) {
      newErrors.endDate = true;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission - Step 3
   */
  const handleSubmit = async () => {
    if (!validateForm()) {
      setError("Please fill in all required fields correctly");
      setIsErrorModalOpen(true);
      return;
    }

    try {
      setLoading(true);
      
      const currentDivisionId = localStorage.getItem('currentDivisionId');
      
      // Prepare data for API
      const targetData = {
        name: formData.name.trim(),
        targetType: formData.targetType,
        assignmentType: formData.assignmentType,
        budgetNumber: parseFloat(formData.budgetNumber),
        budgetUnit: formData.budgetUnit,
        timeFrame: formData.timeFrame,
        timeFrameValue: parseInt(formData.timeFrameValue),
        startDate: formData.startDate,
        endDate: formData.endDate,
        description: formData.description.trim(),
        priority: formData.priority,
        notes: formData.notes.trim()
      };

      // Add division ID if available
      if (currentDivisionId) {
        targetData.divisionId = parseInt(currentDivisionId);
      }

      // Add assignment data based on type
      if (formData.assignmentType === 'team') {
        targetData.teamIds = formData.teamIds;
        
        // Build teamMemberAssignments array
        const teamMemberAssignments = [];
        Object.keys(selectedTeamMembers).forEach(employeeId => {
          const assignment = selectedTeamMembers[employeeId];
          if (assignment.budget && parseFloat(assignment.budget) > 0) {
            teamMemberAssignments.push({
              employeeId: parseInt(employeeId),
              individualBudgetNumber: parseFloat(assignment.budget),
              teamId: parseInt(assignment.teamId)
            });
          }
        });
        
        targetData.teamMemberAssignments = teamMemberAssignments;
      } else {
        targetData.employeeIds = formData.employeeIds;
      }

      console.log('Step 3: Submitting target data:', targetData);
      await targetService.createTarget(targetData);
      
      // Reset form
      setFormData({
        name: '',
        targetType: 'sales',
        assignmentType: 'team',
        budgetNumber: '',
        budgetUnit: 'rupees',
        timeFrame: 'months',
        timeFrameValue: '',
        startDate: '',
        endDate: '',
        description: '',
        priority: 'medium',
        notes: '',
        divisionId: null,
        teamIds: [],
        employeeIds: [],
        teamMemberAssignments: []
      });
      setSelectedTeamMembers({});
      setTeamMembers([]);
      setTeamMembersByTeam({});
      
      onSuccess();
    } catch (error) {
      console.error("Error creating target:", error);
      setError(error.message || "Failed to create target");
      setIsErrorModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Budget unit options
   */
  const budgetUnits = [
    { value: 'rupees', label: 'Rupees (₹)' },
    { value: 'tons', label: 'Tons' },
    { value: 'bags', label: 'Bags' },
    { value: 'count', label: 'Count' }
  ];

  return (
    <>
      <DialogRoot open={isOpen} onOpenChange={onClose} placement="center" size="lg">
        <DialogContent className="mdl">
          <DialogBody>
            <h3 className={`px-3 mdl-title`}>Create New Target</h3>
            
            {/* Basic Information */}
            <div className="row m-0 p-0">
              <h5 className={purchaseStyles.headmdl}>Target Basic Information</h5>
              <div className={`col-3 ${purchaseStyles.longformmdl}`}>
                <label>Target Name :</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter target name"
                  className={errors.name ? styles.errorField : ''}
                />
              </div>
              <div className={`col-3 ${purchaseStyles.longformmdl}`}>
                <label>Target Type :</label>
                <select
                  value={formData.targetType}
                  onChange={(e) => handleInputChange('targetType', e.target.value)}
                >
                  <option value="sales">Sales Target</option>
                  <option value="customer">Customer Target</option>
                </select>
              </div>
              <div className={`col-3 ${purchaseStyles.longformmdl}`}>
                <label>Assignment Type :</label>
                <select
                  value={formData.assignmentType}
                  onChange={(e) => handleInputChange('assignmentType', e.target.value)}
                >
                  <option value="team">Team</option>
                  <option value="employee">Employee</option>
                </select>
              </div>
            </div>

            {/* Assignment Selection */}
            <div className="row m-0 p-0">
              <h5 className={purchaseStyles.headmdl}>Assignment Selection</h5>
              {formData.assignmentType === 'team' ? (
                <div className={`col-12 ${purchaseStyles.longformmdl}`}>
                  <label>Select Teams :</label>
                  <select
                    multiple
                    value={formData.teamIds.map(id => id.toString())}
                    onChange={(e) => handleMultiSelectChange('teamIds', e.target.selectedOptions)}
                    className={errors.teamIds ? styles.errorField : ''}
                    style={{ minHeight: '120px', width: '100%' }}
                  >
                        {(() => {
                          console.log('Rendering teams dropdown. Teams state:', teams);
                          console.log('Teams length in render:', teams.length);
                          console.log('Loading state:', loading);
                          
                          if (loading && teams.length === 0) {
                            return <option disabled>Loading teams...</option>;
                          } else if (teams.length === 0) {
                            return <option disabled>No teams available</option>;
                          } else {
                            return teams.map(team => {
                              const teamInfo = team.name || team.teamId || `Team ${team.id}`;
                              const zoneInfo = team.zone ? ` - ${team.zone}` : '';
                              const subZoneInfo = team.subZone ? ` (${team.subZone})` : '';
                              return (
                                <option key={team.id} value={team.id}>
                                  {teamInfo}{zoneInfo}{subZoneInfo}
                                </option>
                              );
                            });
                          }
                        })()}
                      </select>
                  <small className="text-muted">Hold Ctrl/Cmd to select multiple teams</small>
                  {errors.teamIds && <small className="text-danger d-block mt-1">Please select at least one team</small>}
                </div>
              ) : (
                <div className={`col-12 ${purchaseStyles.longformmdl}`}>
                  <label>Select Employees :</label>
                  <select
                    multiple
                    value={formData.employeeIds.map(id => id.toString())}
                    onChange={(e) => handleMultiSelectChange('employeeIds', e.target.selectedOptions)}
                    className={errors.employeeIds ? styles.errorField : ''}
                    style={{ minHeight: '120px', width: '100%' }}
                  >
                        {console.log('Employees state:', employees, 'Length:', employees.length)}
                        {employees.length === 0 && <option disabled>No employees available</option>}
                        {employees
                          .filter(employee => employee.status === 'Active')
                          .map(employee => {
                            console.log('Rendering employee:', employee);
                            const primaryRole = employee.primaryRole || employee.roles?.[0]?.name || 'No Role';
                            const teamStatus = employee.teamStatus === 'IN' ? 'In Team' : 'Not in Team';
                            const currentTeam = employee.currentTeam?.name;
                            const teamContext = currentTeam ? ` (${teamStatus}: ${currentTeam})` : ` (${teamStatus})`;
                            return (
                              <option key={employee.id} value={employee.id}>
                                {employee.name} - {primaryRole}{teamContext}
                              </option>
                            );
                          })}
                      </select>
                  <small className="text-muted">Hold Ctrl/Cmd to select multiple employees</small>
                  {errors.employeeIds && <small className="text-danger d-block mt-1">Please select at least one employee</small>}
                </div>
              )}
            </div>

            {/* Team Members Assignment (Step 2) - Only show when teams are selected */}
            {formData.assignmentType === 'team' && formData.teamIds.length > 0 && (
              <div className="row m-0 p-0">
                <h5 className={purchaseStyles.headmdl}>Team Members Budget Assignment</h5>
                <div className={`col-12 ${purchaseStyles.longformmdl}`}>
                  <label>Assign Budget to Team Members :</label>
                      {loading && teamMembers.length === 0 ? (
                        <div className="text-center py-3">
                          <Loading />
                          <small className="d-block mt-2">Loading team members...</small>
                        </div>
                      ) : teamMembers.length === 0 ? (
                        <div className="alert alert-info">
                          No team members found for selected teams.
                        </div>
                      ) : (
                        <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #ddd', padding: '15px', borderRadius: '4px' }}>
                          {Object.keys(teamMembersByTeam).length > 0 ? (
                            Object.keys(teamMembersByTeam).map(teamId => {
                              const teamData = teamMembersByTeam[teamId];
                              const team = teams.find(t => t.id === parseInt(teamId));
                              return (
                                <div key={teamId} className="mb-4 pb-3 border-bottom">
                                  <h6 className="mb-3 text-primary">
                                    <strong>{team?.name || teamData?.name || `Team ${teamId}`}</strong>
                                  </h6>
                                  {teamData?.members && teamData.members.length > 0 ? (
                                    <div className="table-responsive">
                                      <table className="table table-sm table-bordered">
                                        <thead>
                                          <tr>
                                            <th>Employee Name</th>
                                            <th>Employee ID</th>
                                            <th>Individual Budget ({formData.budgetUnit}) *</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {teamData.members.map(member => {
                                            const employee = member.employee || member;
                                            const employeeId = employee.id || member.employeeId;
                                            const assignment = selectedTeamMembers[employeeId] || { budget: '', teamId: parseInt(teamId) };
                                            return (
                                              <tr key={employeeId}>
                                                <td>{employee.name || 'N/A'}</td>
                                                <td>{employee.employeeId || 'N/A'}</td>
                                                <td>
                                                  <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={assignment.budget}
                                                    onChange={(e) => handleTeamMemberBudgetChange(employeeId, e.target.value, parseInt(teamId))}
                                                    placeholder="Enter budget"
                                                    className="form-control form-control-sm"
                                                    style={{ minWidth: '150px' }}
                                                  />
                                                </td>
                                              </tr>
                                            );
                                          })}
                                        </tbody>
                                      </table>
                                    </div>
                                  ) : (
                                    <p className="text-muted">No members in this team</p>
                                  )}
                                </div>
                              );
                            })
                          ) : (
                            <div className="table-responsive">
                              <table className="table table-sm table-bordered">
                                <thead>
                                  <tr>
                                    <th>Employee Name</th>
                                    <th>Employee ID</th>
                                    <th>Team</th>
                                    <th>Individual Budget ({formData.budgetUnit}) *</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {teamMembers.map(member => {
                                    const employee = member.employee || member;
                                    const employeeId = employee.id || member.employeeId;
                                    const team = member.team || {};
                                    const assignment = selectedTeamMembers[employeeId] || { budget: '', teamId: team.id || member.teamId };
                                    return (
                                      <tr key={employeeId}>
                                        <td>{employee.name || 'N/A'}</td>
                                        <td>{employee.employeeId || 'N/A'}</td>
                                        <td>{team.name || 'N/A'}</td>
                                        <td>
                                          <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={assignment.budget}
                                            onChange={(e) => handleTeamMemberBudgetChange(employeeId, e.target.value, assignment.teamId)}
                                            placeholder="Enter budget"
                                            className="form-control form-control-sm"
                                            style={{ minWidth: '150px' }}
                                          />
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}
                          {errors.teamMemberAssignments && (
                            <small className="text-danger d-block mt-2">Please assign budget to at least one team member</small>
                          )}
                        </div>
                      )}
                </div>
              </div>
            )}

            {/* Budget Information */}
            <div className="row m-0 p-0">
              <h5 className={purchaseStyles.headmdl}>Budget Information</h5>
              <div className={`col-3 ${purchaseStyles.longformmdl}`}>
                <label>Budget Amount :</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.budgetNumber}
                  onChange={(e) => handleInputChange('budgetNumber', e.target.value)}
                  placeholder="Enter budget"
                  className={errors.budgetNumber ? styles.errorField : ''}
                />
              </div>
              <div className={`col-3 ${purchaseStyles.longformmdl}`}>
                <label>Budget Unit :</label>
                <select
                  value={formData.budgetUnit}
                  onChange={(e) => handleInputChange('budgetUnit', e.target.value)}
                >
                  {budgetUnits.map(unit => (
                    <option key={unit.value} value={unit.value}>
                      {unit.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className={`col-3 ${purchaseStyles.longformmdl}`}>
                <label>Time Frame Value :</label>
                <input
                  type="number"
                  min="1"
                  value={formData.timeFrameValue}
                  onChange={(e) => handleInputChange('timeFrameValue', e.target.value)}
                  placeholder="Enter duration"
                  className={errors.timeFrameValue ? styles.errorField : ''}
                />
              </div>
              <div className={`col-3 ${purchaseStyles.longformmdl}`}>
                <label>Time Frame Unit :</label>
                <select
                  value={formData.timeFrame}
                  onChange={(e) => handleInputChange('timeFrame', e.target.value)}
                >
                  <option value="months">Months</option>
                </select>
              </div>
            </div>

            {/* Date Range */}
            <div className="row m-0 p-0">
              <div className={`col-3 ${purchaseStyles.longformmdl}`}>
                <label>Start Date :</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                  className={errors.startDate ? styles.errorField : ''}
                />
              </div>
              <div className={`col-3 ${purchaseStyles.longformmdl}`}>
                <label>End Date :</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleInputChange('endDate', e.target.value)}
                  className={errors.endDate ? styles.errorField : ''}
                />
              </div>
            </div>

            {/* Priority and Notes */}
            <div className="row m-0 p-0">
              <div className={`col-3 ${purchaseStyles.longformmdl}`}>
                <label>Priority :</label>
                <select
                  value={formData.priority}
                  onChange={(e) => handleInputChange('priority', e.target.value)}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className={`col-3 ${purchaseStyles.longformmdl}`}>
                <label>Notes :</label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Enter notes (optional)"
                />
              </div>
            </div>

            {/* Description */}
            <div className="row m-0 p-0">
              <div className={`col-12 ${purchaseStyles.longformmdl}`}>
                <label>Description :</label>
                <textarea
                  rows="3"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Enter target description (optional)"
                  style={{ resize: 'vertical', width: '100%' }}
                />
              </div>
            </div>

            {/* Action Buttons */}
            {!loading && (
              <div className="row m-0 p-3 pt-4 justify-content-center">
                <div className="col-6 d-flex justify-content-between gap-3">
                  <button
                    type="button"
                    className="submitbtn"
                    onClick={handleSubmit}
                    disabled={loading}
                  >
                    Create
                  </button>
                  <DialogCloseTrigger asChild>
                    <button
                      type="button"
                      className="cancelbtn"
                      onClick={onClose}
                      disabled={loading}
                    >
                      Cancel
                    </button>
                  </DialogCloseTrigger>
                </div>
              </div>
            )}

            {loading && (
              <div className="row m-0 p-3 pt-4 justify-content-center">
                <div className="col-12 text-center">
                  <Loading />
                </div>
              </div>
            )}
          </DialogBody>
          <DialogCloseTrigger className="inputcolumn-mdl-close" />
        </DialogContent>
      </DialogRoot>

      {/* Error Modal */}
      {isErrorModalOpen && (
        <ErrorModal
          isOpen={isErrorModalOpen}
          message={error}
          onClose={() => {
            setIsErrorModalOpen(false);
            setError(null);
          }}
        />
      )}
    </>
  );
}

export default CreateTargetModal;



