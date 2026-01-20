import React, { useState, useEffect } from "react";
import { useAuth } from "@/Auth";
import { useDivision } from "@/components/context/DivisionContext";
import ErrorModal from "@/components/ErrorModal";
import Loading from "@/components/Loading";
import SuccessModal from "@/components/SuccessModal";
import styles from "./Teams.module.css";
import teamsService from "@/services/teamsService";
import { fetchWithDivision } from "@/utils/fetchWithDivision";

function CreateTeam({ navigate, isAdmin }) {
  const { axiosAPI } = useAuth();
  const { selectedDivision } = useDivision();
  
  const [formData, setFormData] = useState({
    name: "",
    divisionId: "",
    zoneId: "",
    subZoneId: "",
    teamHeadId: ""
  });
  
  const [employees, setEmployees] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [zones, setZones] = useState([]);
  const [subZones, setSubZones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  
  // Utility: check if employee has Business Officer role
  const hasBusinessOfficerRole = (employee) => {
    if (!employee || !Array.isArray(employee.roles)) return false;
    const normalizedRoleNames = employee.roles
      .map((r) => String(r?.name || '').toLowerCase().trim());
    return normalizedRoleNames.some((n) => (
      n === 'business officer' ||
      n === 'bo' ||
      (n.includes('business') && n.includes('officer'))
    ));
  };

  // Ensure divisionId is set when a specific division is selected globally
  useEffect(() => {
    if (selectedDivision?.id && selectedDivision.id !== 'all' && selectedDivision.id !== '1') {
      setFormData(prev => (
        prev.divisionId === selectedDivision.id ? prev : { ...prev, divisionId: selectedDivision.id }
      ));
    }
  }, [selectedDivision]);

  // Fetch divisions for dropdown
  useEffect(() => {
    async function fetchDivisions() {
      try {
        const res = await axiosAPI.get("/divisions/user-divisions");
        const divisionData = res.data?.divisions || res.data?.data || [];
        setDivisions(Array.isArray(divisionData) ? divisionData : []);
        
        // Set default division if user is in specific division (not all divisions)
        const currentDivisionId = localStorage.getItem('currentDivisionId');
        if (currentDivisionId && currentDivisionId !== '1' && currentDivisionId !== 'all') {
          const currentDivision = divisionData.find(div => div.id == currentDivisionId);
          if (currentDivision) {
            setFormData(prev => ({
              ...prev,
              divisionId: currentDivision.id
            }));
          }
        }
      } catch (err) {
        console.error("Failed to fetch divisions:", err);
        setDivisions([]);
      }
    }
    
    fetchDivisions();
  }, [axiosAPI]);

  // Fetch zones based on selected division
  useEffect(() => {
    async function fetchZones() {
      if (!formData.divisionId) {
        setZones([]);
        return;
      }
      
      try {
        const isAllDivisions = formData.divisionId === 'all' || formData.divisionId === '1';
        const response = await fetchWithDivision(
          '/zones',
          localStorage.getItem('accessToken'),
          isAllDivisions ? null : formData.divisionId,
          isAllDivisions
        );
        // Normalize zones array from various possible response shapes
        const zoneData =
          (Array.isArray(response?.data) ? response?.data :
          Array.isArray(response?.zones) ? response?.zones :
          Array.isArray(response) ? response :
          Array.isArray(response?.data?.zones) ? response?.data?.zones :
          []);
        setZones(zoneData);
      } catch (err) {
        console.error("Failed to fetch zones:", err);
        setZones([]);
      }
    }
    
    fetchZones();
  }, [formData.divisionId]);

  // Fetch sub-zones based on selected zone
  useEffect(() => {
    async function fetchSubZones() {
      if (!formData.zoneId) {
        setSubZones([]);
        return;
      }
      
      try {
        const response = await fetchWithDivision(
          `/zones/${formData.zoneId}/sub-zones`,
          localStorage.getItem('accessToken'),
          formData.divisionId === 'all' ? null : formData.divisionId,
          formData.divisionId === 'all'
        );
        // Normalize sub-zones array from various possible response shapes
        const subZoneData =
          (Array.isArray(response?.data) ? response?.data :
          Array.isArray(response?.subZones) ? response?.subZones :
          Array.isArray(response) ? response :
          Array.isArray(response?.data?.subZones) ? response?.data?.subZones :
          []);
        setSubZones(subZoneData);
      } catch (err) {
        console.error("Failed to fetch sub-zones:", err);
        setSubZones([]);
      }
    }
    
    fetchSubZones();
  }, [formData.zoneId, formData.divisionId]);

  // Fetch employees for team head and members selection
  useEffect(() => {
    async function fetchEmployees() {
      try {
        setLoading(true);
        
        const currentDivisionId = localStorage.getItem('currentDivisionId');
        let endpoint = "/employees";
        if (currentDivisionId && currentDivisionId !== '1') {
          endpoint += `?divisionId=${currentDivisionId}`;
        } else if (currentDivisionId === '1') {
          endpoint += `?showAllDivisions=true`;
        }
        
        const res = await axiosAPI.get(endpoint);
        
        // Handle different response structures
        let employeeData = [];
        if (res.data && res.data.success && res.data.data && Array.isArray(res.data.data)) {
          employeeData = res.data.data;
        } else if (res.data && res.data.employees && Array.isArray(res.data.employees)) {
          employeeData = res.data.employees;
        } else if (res.data && Array.isArray(res.data)) {
          employeeData = res.data;
        } else {
          // Fallback sample data
          employeeData = [
            { id: 1, name: "John Doe", roles: [{ name: "Manager" }] },
            { id: 2, name: "Jane Smith", roles: [{ name: "Sales" }] },
            { id: 3, name: "Mike Johnson", roles: [{ name: "Support" }] },
            { id: 4, name: "Sarah Wilson", roles: [{ name: "Marketing" }] },
            { id: 5, name: "David Brown", roles: [{ name: "Warehouse" }] }
          ];
        }
        
        setEmployees(employeeData);
      } catch (err) {
        console.error("Failed to fetch employees:", err);
        // Set fallback data
        setEmployees([
          { id: 1, name: "John Doe", roles: [{ name: "Manager" }] },
          { id: 2, name: "Jane Smith", roles: [{ name: "Sales" }] },
          { id: 3, name: "Mike Johnson", roles: [{ name: "Support" }] },
          { id: 4, name: "Sarah Wilson", roles: [{ name: "Marketing" }] },
          { id: 5, name: "David Brown", roles: [{ name: "Warehouse" }] }
        ]);
      } finally {
        setLoading(false);
      }
    }
    
    fetchEmployees();
  }, [axiosAPI]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: value
      };
      
      // Reset dependent fields when division or zone changes
      if (name === 'divisionId') {
        newData.zoneId = '';
        newData.subZoneId = '';
      } else if (name === 'zoneId') {
        newData.subZoneId = '';
      }
      
      return newData;
    });
  };

  const addMember = (memberId) => {
    if (memberId && memberId !== "null") {
      const parsedId = parseInt(memberId);
      if (!selectedMembers.includes(parsedId)) {
        setSelectedMembers((prev) => [...prev, parsedId]);
      }
    }
  };

  const removeMember = (index) => {
    const updatedMembers = selectedMembers.filter((_, i) => i !== index);
    setSelectedMembers(updatedMembers);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
      setError("Team name is required");
      setIsModalOpen(true);
      return;
    }
    
    if (!formData.divisionId) {
      setError("Division is required");
      setIsModalOpen(true);
      return;
    }
    
    if (!formData.zoneId) {
      setError("Zone is required");
      setIsModalOpen(true);
      return;
    }
    
    if (!formData.subZoneId) {
      setError("Sub-zone is required");
      setIsModalOpen(true);
      return;
    }
    
    if (!formData.teamHeadId) {
      setError("Team head is required");
      setIsModalOpen(true);
      return;
    }

    try {
      setLoading(true);

      const numericHeadId = Number(formData.teamHeadId);
      const numericSubZoneId = Number(formData.subZoneId);

      // Validate roles: Team Head must be BO and all members must be BO
      const headEmployee = employees.find((emp) => emp.id === numericHeadId);
      if (!hasBusinessOfficerRole(headEmployee)) {
        setError("Team head must have Business Officer role");
        setIsModalOpen(true);
        return;
      }
      const invalidMembers = selectedMembers
        .map((id) => employees.find((e) => e.id === id))
        .filter((emp) => !hasBusinessOfficerRole(emp));
      if (invalidMembers.length > 0) {
        const names = invalidMembers.map((m) => m?.name || 'Unknown').join(', ');
        setError(`Team member validation failed: Only Business Officer allowed. Invalid: ${names}`);
        setIsModalOpen(true);
        return;
      }
      
      // Prepare member data with role information
      const memberData = selectedMembers.map(memberId => {
        const employee = employees.find(emp => emp.id === memberId);
        return {
          id: memberId,
          roleId: employee?.roles?.[0]?.id,
          roleName: employee?.roles?.[0]?.name
        };
      });
      
      const payload = {
        name: formData.name,
        subZoneId: numericSubZoneId,
        // Provide multiple aliases to satisfy varying backend expectations
        teamHeadId: numericHeadId,
        teamLeadId: numericHeadId,
        headId: numericHeadId,
        memberIds: selectedMembers,
        members: selectedMembers,
        memberData: memberData
      };

      // Debug logging to see what's being sent
      console.log('Create Team Payload:', payload);
      console.log('Selected Members:', selectedMembers);
      console.log('Member Data with Roles:', memberData);
      console.log('Employees data:', employees);
      console.log('Selected members details:', selectedMembers.map(id => employees.find(emp => emp.id === id)));

      const res = await teamsService.createTeam(formData.subZoneId, payload);
      
      // Handle the response - backend returns the request payload
      const responseData = res?.data || res;
      
      setSuccessMessage(`Team "${formData.name}" created successfully`);
      setIsSuccessModalOpen(true);

      // Reset form
      setFormData({
        name: "",
        divisionId: "",
        zoneId: "",
        subZoneId: "",
        teamHeadId: ""
      });
      setSelectedMembers([]);

      // Navigate back to teams list since we don't have team ID in response
      navigate('/teams');
    } catch (err) {
      console.error("Error creating team:", err);
      setError(err?.message || err?.toString() || "Failed to create team. Please try again.");
      setIsModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setError("");
  };

  const closeSuccessModal = () => {
    setIsSuccessModalOpen(false);
    navigate("/teams");
  };

  if (success) {
    return (
      <div className="container mt-4">
        <div className="row justify-content-center">
          <div className="col-md-8">
            <div className="alert alert-success text-center">
              <h4>Team Created Successfully!</h4>
              <p>Team "{formData.teamName}" has been created with ID: {formData.teamId}</p>
              <p>Redirecting to teams list...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <p className="path">
        <span onClick={() => navigate("/employees")}>Employees</span>{" "}
        <i className="bi bi-chevron-right"></i>{" "}
        <span onClick={() => navigate("/teams")}>Teams</span>{" "}
        <i className="bi bi-chevron-right"></i> Create Team
      </p>

      <div className="container mt-4">
        <div className="row justify-content-center">
          <div className="col-md-8">
            <div className="card">
              <div className="card-header">
                <h4>Create New Team</h4>
              </div>
              <div className="card-body">
                <form onSubmit={handleSubmit}>
                  <div className="row">
                    {/* Team Name */}
                    <div className="col-md-6 mb-3">
                      <label htmlFor="name" className="form-label">
                        Team Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Enter team name"
                        required
                      />
                    </div>

                    {/* Division - Only show if all divisions is selected */}
                    {selectedDivision?.id === 'all' || selectedDivision?.id === '1' ? (
                      <div className="col-md-6 mb-3">
                        <label htmlFor="divisionId" className="form-label">
                          Division <span className="text-danger">*</span>
                        </label>
                        <select
                          className="form-select"
                          id="divisionId"
                          name="divisionId"
                          value={formData.divisionId}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="">Select Division</option>
                          {divisions.map(division => (
                            <option key={division.id} value={division.id}>
                              {division.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="col-md-6 mb-3">
                        <label htmlFor="divisionId" className="form-label">
                          Division
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          value={selectedDivision?.name || '-'}
                          readOnly
                          disabled
                        />
                        <input
                          type="hidden"
                          name="divisionId"
                          value={selectedDivision?.id || ''}
                        />
                      </div>
                    )}

                    {/* Zone */}
                    <div className="col-md-6 mb-3">
                      <label htmlFor="zoneId" className="form-label">
                        Zone <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select"
                        id="zoneId"
                        name="zoneId"
                        value={formData.zoneId}
                        onChange={handleInputChange}
                        required
                        disabled={!formData.divisionId}
                      >
                        <option value="">Select Zone</option>
                        {zones.map(zone => (
                          <option key={zone.id} value={zone.id}>
                            {zone.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Sub-Zone */}
                    <div className="col-md-6 mb-3">
                      <label htmlFor="subZoneId" className="form-label">
                        Sub-Zone <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select"
                        id="subZoneId"
                        name="subZoneId"
                        value={formData.subZoneId}
                        onChange={handleInputChange}
                        required
                        disabled={!formData.zoneId}
                      >
                        <option value="">Select Sub-Zone</option>
                        {subZones.map(subZone => (
                          <option key={subZone.id} value={subZone.id}>
                            {subZone.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Team Head */}
                    <div className="col-md-6 mb-3">
                      <label htmlFor="teamHeadId" className="form-label">
                        Team Head <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select"
                        id="teamHeadId"
                        name="teamHeadId"
                        value={formData.teamHeadId}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Select Team Head</option>
                        {employees
                          .filter((emp) => hasBusinessOfficerRole(emp))
                          .map(emp => (
                          <option key={emp.id} value={emp.id}>
                            {emp.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Team Members */}
                    <div className="col-md-6 mb-3">
                      <label className="form-label">
                        Team Members
                      </label>
                      
                      {/* Display selected members */}
                      {selectedMembers.map((memberId, index) => {
                        const member = employees.find((emp) => emp.id === memberId);
                        return (
                          <div
                            key={memberId}
                            className="d-flex justify-content-between align-items-center pt-2 mb-2 p-2 border rounded"
                          >
                            <span>{member?.name || 'Unknown Member'} - {member?.roles?.[0]?.name || 'No Role'}</span>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => removeMember(index)}
                            >
                              Remove
                            </button>
                          </div>
                        );
                      })}
                      
                      {/* Add member dropdown */}
                      {employees.filter(emp => !selectedMembers.includes(emp.id)).length > 0 && (
                        <>
                          <label className="mt-3">Add Team Member:</label>
                          <select 
                            className="form-select" 
                            onChange={(e) => addMember(e.target.value)} 
                            defaultValue=""
                          >
                            <option value="null">-- Add Member --</option>
                            {employees
                              .filter(emp => hasBusinessOfficerRole(emp) && !selectedMembers.includes(emp.id))
                              .map((emp) => (
                                <option key={emp.id} value={emp.id}>
                                  {emp.name} - {emp.roles?.[0]?.name || 'No Role'}
                                </option>
                              ))}
                          </select>
                        </>
                      )}
                      
                      <small className="form-text text-muted">
                        Selected: {selectedMembers.length} member(s)
                      </small>
                    </div>
                  </div>

                  {/* Submit Buttons */}
                  <div className="d-flex justify-content-between">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => navigate("/teams")}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Creating...
                        </>
                      ) : (
                        "Create Team"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <ErrorModal isOpen={isModalOpen} message={error} onClose={closeModal} />
      )}

      {isSuccessModalOpen && (
        <SuccessModal 
          isOpen={isSuccessModalOpen} 
          message={successMessage} 
          onClose={closeSuccessModal} 
        />
      )}
    </>
  );
}

export default CreateTeam;
