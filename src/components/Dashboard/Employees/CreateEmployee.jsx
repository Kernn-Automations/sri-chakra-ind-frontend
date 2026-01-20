import React, { useEffect, useState } from "react";
import styles from "./Employees.module.css";
import { useAuth } from "@/Auth";
import { useDivision } from "@/components/context/DivisionContext";
import ErrorModal from "@/components/ErrorModal";
import Loading from "@/components/Loading";

function CreateEmployee({ navigate }) {
  const { axiosAPI } = useAuth();
  const { selectedDivision } = useDivision();

  const [form, setForm] = useState({
    name: "",
    employeeId: "",
    email: "",
    mobile: "",
  });

  const [roles, setRoles] = useState([]);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [selectedSupervisor, setSelectedSupervisor] = useState();

  const [error, setError] = useState();
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successful, setSuccessful] = useState();
  const [tempPassword, setTempPassword] = useState(null);

  const closeModal = () => setIsModalOpen(false);

  const adminRole = roles.find((r) => r.name.toLowerCase() === "admin");
  const isAdminSelected = selectedRoles.includes(adminRole?.id);

  useEffect(() => {
    return () => {
      setTempPassword(null);
    };
  }, []);

  // Load roles
  useEffect(() => {
    async function fetchInitial() {
      try {
        setLoading(true);
        const rolesRes = await axiosAPI.get("/employees/roles");
        setRoles(rolesRes.data.roles || []);
      } catch (err) {
        setError(
          err?.response?.data?.message || "Failed to load initial data.",
        );
        setIsModalOpen(true);
      } finally {
        setLoading(false);
      }
    }
    fetchInitial();
  }, []);

  // Fetch supervisors unless Admin is selected
  useEffect(() => {
    async function fetchSupervisors() {
      const lastRoleId = selectedRoles[selectedRoles.length - 1];
      const lastRole = roles.find((r) => r.id === lastRoleId);

      if (!lastRole || lastRole.name.toLowerCase() === "admin") {
        setSupervisors([]);
        return;
      }

      try {
        const res = await axiosAPI.get(`/employees/supervisors/${lastRoleId}`);
        setSupervisors(res.data.supervisors || []);
        console.log(res);
      } catch (err) {
        // Handle supervisor fetch errors gracefully - supervisors are optional
        // Only log the error, don't show modal as it doesn't prevent employee creation
        console.warn(
          "Failed to load supervisors:",
          err?.response?.data?.message || err.message,
        );
        setSupervisors([]); // Set empty supervisors list on error
      }
    }

    if (selectedRoles.length > 0) {
      fetchSupervisors();
    }
  }, [selectedRoles, roles]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const addRole = (roleId) => {
    if (roleId) {
      const parsedId = parseInt(roleId);
      if (!selectedRoles.includes(parsedId)) {
        setSelectedRoles((prev) => [...prev, parsedId]);
      }
    }
  };

  const removeRole = (index) => {
    const updatedRoles = selectedRoles.filter((_, i) => i !== index);
    setSelectedRoles(updatedRoles);

    if (
      updatedRoles.every((roleId) => {
        const role = roles.find((r) => r.id === roleId);
        return role?.name.toLowerCase() === "admin";
      })
    ) {
      setSelectedSupervisor(undefined);
    }
  };

  const availableRoles = roles.filter((r) => !selectedRoles.includes(r.id));

  const handleSubmit = async () => {
    if (
      !form.name ||
      !form.employeeId ||
      !form.mobile ||
      selectedRoles.length === 0 ||
      (!isAdminSelected && supervisors.length > 0 && !selectedSupervisor)
    ) {
      setError("Please fill all the required fields.");
      setIsModalOpen(true);
      return;
    }

    // Get divisionId from context - required for non-admin roles
    let divisionId = null;
    if (selectedDivision?.id && selectedDivision.id !== "all") {
      divisionId = parseInt(selectedDivision.id);
    } else {
      // Try to get divisionId from user data as fallback
      try {
        const userData = JSON.parse(localStorage.getItem("user") || "{}");
        const user = userData.user || userData;
        if (user?.divisionId) {
          divisionId = parseInt(user.divisionId);
        } else if (user?.division?.id) {
          divisionId = parseInt(user.division.id);
        }
      } catch (e) {
        console.error("Error parsing user data:", e);
      }
    }

    // For non-admin roles, divisionId is required by backend
    // If still not available, show error
    if (!isAdminSelected && !divisionId) {
      setError(
        "Division is required for non-admin roles. Please select a division first.",
      );
      setIsModalOpen(true);
      return;
    }

    const payload = {
      ...form,
      roleIds: selectedRoles,
      supervisorId: isAdminSelected
        ? null
        : supervisors.length > 0 && selectedSupervisor
          ? parseInt(selectedSupervisor)
          : null,
    };

    // Include divisionId - required for non-admin roles, optional for admin
    if (divisionId) {
      payload.divisionId = divisionId;
    } else if (!isAdminSelected) {
      // This shouldn't happen due to validation above, but just in case
      setError("Division is required for non-admin roles.");
      setIsModalOpen(true);
      return;
    }

    // Log payload for debugging
    console.log("Create Employee Payload:", payload);
    console.log("Selected Division:", selectedDivision);
    console.log("Division ID:", divisionId);
    console.log("Is Admin Selected:", isAdminSelected);

    try {
      setLoading(true);
      const res = await axiosAPI.post("/employees/add", payload);
      setSuccessful(res.data.message || "Employee created successfully");
      setTempPassword(res.data.tempPassword || null);
    } catch (err) {
      console.error("Create Employee Error:", err);
      console.error("Error Response:", err?.response?.data);
      const errorMessage =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to create employee.";
      setError(errorMessage);
      setIsModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <p className="path">
        <span onClick={() => navigate("/employees")}>Employees</span>{" "}
        <i className="bi bi-chevron-right"></i> Create Employee
      </p>

      <div className="row m-0 p-3 justify-content-center">
        <div className={`col-8 ${styles.longform}`}>
          <label>Full Name:</label>
          <input name="name" value={form.name} onChange={handleFormChange} />

          <label className="mt-3">Employee ID:</label>
          <input
            name="employeeId"
            value={form.employeeId}
            onChange={handleFormChange}
          />

          <label className="mt-3">Email:</label>
          <input name="email" value={form.email} onChange={handleFormChange} />

          <label className="mt-3">Mobile:</label>
          <input
            name="mobile"
            value={form.mobile}
            onChange={handleFormChange}
          />

          {selectedRoles.map((roleId, index) => {
            const role = roles.find((r) => r.id === roleId);
            return (
              <div
                key={roleId}
                className={`d-flex justify-content-between align-items-center pt-2 mb-2 ${styles.longform}`}
              >
                <span>{role?.name}</span>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => removeRole(index)}
                >
                  Remove
                </button>
              </div>
            );
          })}
          {availableRoles.length > 0 && (
            <>
              <label className="mt-3">Roles:</label>
              <select onChange={(e) => addRole(e.target.value)} defaultValue="">
                <option value="null">-- Add Role --</option>
                {availableRoles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </>
          )}

          {/* Warehouse selection removed as it's no longer needed */}

          {!isAdminSelected && supervisors.length > 0 && (
            <>
              <label className="mt-3">Supervisor:</label>
              <select
                value={selectedSupervisor}
                onChange={(e) => setSelectedSupervisor(e.target.value)}
              >
                <option value="">-- Select Supervisor --</option>
                {supervisors.map((sup) => (
                  <option key={sup.id} value={sup.id}>
                    {sup.name}
                  </option>
                ))}
              </select>
            </>
          )}

          {!loading && !successful && (
            <div className="row m-0 p-3 justify-content-center">
              <div className="col-9">
                <button className="submitbtn" onClick={handleSubmit}>
                  Create
                </button>
                <button
                  className="cancelbtn"
                  onClick={() => navigate("/employees")}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {successful && (
            <div className="row m-0 p-3 justify-content-center">
              <div className="col-6 text-center">
                <p className="text-success fw-bold">{successful}</p>

                {tempPassword && (
                  <div
                    style={{
                      border: "1px dashed #dc3545",
                      padding: "12px",
                      marginBottom: "12px",
                      borderRadius: "6px",
                      background: "#fff5f5",
                    }}
                  >
                    <p className="mb-1 fw-bold">Temporary Password</p>
                    <p
                      style={{
                        fontSize: "18px",
                        letterSpacing: "2px",
                        fontWeight: "bold",
                      }}
                    >
                      {tempPassword}
                    </p>
                    <p
                      className="text-danger mb-0"
                      style={{ fontSize: "12px" }}
                    >
                      ⚠ Copy this password now. It will not be shown again.
                    </p>
                  </div>
                )}

                <button
                  className="submitbtn"
                  onClick={() => navigate("/employees")}
                >
                  Go Back
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <ErrorModal isOpen={isModalOpen} message={error} onClose={closeModal} />
      )}

      {loading && <Loading />}
    </>
  );
}

export default CreateEmployee;
