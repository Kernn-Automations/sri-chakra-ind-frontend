import { useAuth } from "@/Auth";
import ErrorModal from "@/components/ErrorModal";
import Loading from "@/components/Loading";
import React, { useState, useEffect } from "react";
import styles from "./Targets.module.css";
import {
  DialogActionTrigger,
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogRoot,
  DialogTrigger,
} from "@/components/ui/dialog";

function AddCustomerTargetModal({ changeTrigger }) {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [targetCustomers, setTargetCustomers] = useState("");
  const [period, setPeriod] = useState("monthly");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { axiosAPI } = useAuth();
  
  // validation
  const [errors, setErrors] = useState({});

  const [error, setError] = useState();
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successful, setSuccessful] = useState();
  
  const closeModal = () => {
    setIsModalOpen(false);
  };

  // Fetch employees on component mount
  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const currentDivisionId = localStorage.getItem('currentDivisionId');
      let query = "/employees";
      
      if (currentDivisionId && currentDivisionId !== '1') {
        query += `?divisionId=${currentDivisionId}`;
      } else if (currentDivisionId === '1') {
        query += `?showAllDivisions=true`;
      }

      const response = await axiosAPI.get(query);
      setEmployees(response.data.employees || []);
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const validateFields = () => {
    const newErrors = {};

    if (!selectedEmployee) newErrors.selectedEmployee = true;
    if (!targetCustomers) newErrors.targetCustomers = true;
    if (!startDate) newErrors.startDate = true;
    if (!endDate) newErrors.endDate = true;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  function onError(e, vari, setter) {
    const value = e.target.value === "null" ? null : e.target.value;
    setter(value);
    if (value) {
      setErrors((prev) => ({ ...prev, vari: false }));
    }
  }

  // form submission
  const onSubmitClick = () => {
    if (!validateFields()) {
      setError("Please Fill all fields");
      setIsModalOpen(true);
      return;
    }

    async function create() {
      try {
        setLoading(true);
        const targetData = {
          employeeId: parseInt(selectedEmployee),
          type: "customers",
          targetCustomers: parseInt(targetCustomers),
          period: period,
          startDate: startDate,
          endDate: endDate
        };

        const res = await axiosAPI.post("/targets", targetData);
        console.log(res);

        setSuccessful(res.data.message || "Customer target created successfully");
        changeTrigger();
        
        // Reset form
        setSelectedEmployee("");
        setTargetCustomers("");
        setPeriod("monthly");
        setStartDate("");
        setEndDate("");
        
        setTimeout(() => {
          setSuccessful(null);
        }, 2000);
      } catch (e) {
        console.log(e);
        setError(e.response?.data?.message || "Failed to create customer target");
        setIsModalOpen(true);
      } finally {
        setLoading(false);
      }
    }

    create();
  };

  return (
    <>
      <DialogRoot placement={"center"} size={"lg"} className={styles.mdl}>
        <DialogTrigger asChild>
          <button className="homebtn">+ Add Customer Target</button>
        </DialogTrigger>
        <DialogContent className="mdl">
          <DialogBody>
            <h3 className={`px-3 pb-3 mdl-title`}>Create Customer Target</h3>
            
            <div className="row justify-content-center">
              <div className={`col-4 inputcolumn-mdl`}>
                <label htmlFor="">Employee :</label>
                <select
                  value={selectedEmployee}
                  onChange={(e) => onError(e, selectedEmployee, setSelectedEmployee)}
                  required
                  className={errors.selectedEmployee ? styles.errorField : ""}
                >
                  <option value="">--select employee--</option>
                  {employees.map(employee => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name} - {employee.role}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="row justify-content-center">
              <div className={`col-4 inputcolumn-mdl`}>
                <label htmlFor="">Target Customers :</label>
                <input
                  type="number"
                  value={targetCustomers}
                  onChange={(e) => onError(e, targetCustomers, setTargetCustomers)}
                  required
                  className={errors.targetCustomers ? styles.errorField : ""}
                  placeholder="Enter target number of customers"
                />
              </div>
            </div>
            
            <div className="row justify-content-center">
              <div className={`col-4 inputcolumn-mdl`}>
                <label htmlFor="">Period :</label>
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  required
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
            </div>
            
            <div className="row justify-content-center">
              <div className={`col-4 inputcolumn-mdl`}>
                <label htmlFor="">Start Date :</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => onError(e, startDate, setStartDate)}
                  required
                  className={errors.startDate ? styles.errorField : ""}
                />
              </div>
            </div>
            
            <div className="row justify-content-center">
              <div className={`col-4 inputcolumn-mdl`}>
                <label htmlFor="">End Date :</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => onError(e, endDate, setEndDate)}
                  required
                  className={errors.endDate ? styles.errorField : ""}
                />
              </div>
            </div>
            
            {!loading && !successful && (
              <div className="row pt-3 mt-3 justify-content-center">
                <div className={`col-5`}>
                  <button
                    type="submit"
                    className={`submitbtn`}
                    data-bs-dismiss="modal"
                    onClick={onSubmitClick}
                  >
                    Create
                  </button>
                  <DialogActionTrigger asChild>
                    <button
                      type="button"
                      className={`cancelbtn`}
                      data-bs-dismiss="modal"
                    >
                      Close
                    </button>
                  </DialogActionTrigger>
                </div>
              </div>
            )}
            
            {successful && (
              <div className="row pt-3 mt-3 justify-content-center">
                <div className={`col-5`}>
                  <DialogActionTrigger asChild>
                    <button
                      type="button"
                      className={`submitbtn`}
                      data-bs-dismiss="modal"
                    >
                      {successful}
                    </button>
                  </DialogActionTrigger>
                </div>
              </div>
            )}
            
            {loading && (
              <div className="row pt-3 mt-3 justify-content-center">
                <div className={`col-5`}>
                  <Loading />
                </div>
              </div>
            )}
            
            {isModalOpen && (
              <ErrorModal
                isOpen={isModalOpen}
                message={error}
                onClose={closeModal}
              />
            )}
          </DialogBody>
          <DialogCloseTrigger className="inputcolumn-mdl-close" />
        </DialogContent>
      </DialogRoot>
    </>
  );
}

export default AddCustomerTargetModal;
