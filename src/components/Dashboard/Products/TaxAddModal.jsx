import React, { useState } from "react";
import styles from "./Products.module.css";
import Loading from "@/components/Loading";
import ErrorModal from "@/components/ErrorModal";
import { useAuth } from "@/Auth";
import { DialogActionTrigger } from "@/components/ui/dialog";

function TaxAddModal({ trigger, setTrigger }) {
  const [name, setName] = useState("");
  const [percentage, setPercentage] = useState("");
  const [description, setDescription] = useState("");
  const [hsnCode, setHsnCode] = useState("");
  const [taxNature, setTaxNature] = useState("Taxable");
  const [applicableOn, setApplicableOn] = useState("Both");

  const [successfull, setSuccessfull] = useState(null);
  const [error, setError] = useState();
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errors, setErrors] = useState({});

  const today = new Date(Date.now()).toISOString().slice(0, 10);
  const closeModal = () => setIsModalOpen(false);

  const { axiosAPI } = useAuth();

  const validateFields = () => {
    const newErrors = {};
    if (!name) newErrors.name = true;
    if (!hsnCode) newErrors.hsnCode = true;
    if (taxNature !== "Exempt" && percentage === "") newErrors.percentage = true;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmitClick = () => {
    if (!validateFields()) {
      setError("Please fill all required fields.");
      setIsModalOpen(true);
      return;
    }

    async function create() {
      try {
        setLoading(true);
        const res = await axiosAPI.post("/tax", {
          name,
          percentage,
          description,
          hsnCode,
          taxNature,
          applicableOn,
        });

        setTrigger(!trigger);
        setSuccessfull(res.data.message);
      } catch (e) {
        setError(e.response?.data?.message || "Failed to create tax");
        setIsModalOpen(true);
      } finally {
        setLoading(false);
      }
    }

    create();
  };

  return (
  <>
    <h3 className="px-3 pb-3 mdl-title">Create Tax</h3>

    {/* DATE */}
    <div className="row justify-content-center">
      <div className="col-4 inputcolumn-mdl">
        <label>Date:</label>
        <input type="date" value={today} disabled />
      </div>
    </div>

    {/* TAX NAME */}
    <div className="row justify-content-center">
      <div className="col-4 inputcolumn-mdl">
        <label>Tax Name:</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={errors.name ? styles.errorField : ""}
          required
        />
      </div>
    </div>

    {/* TAX NATURE */}
    <div className="row justify-content-center">
      <div className="col-4 inputcolumn-mdl">
        <label>Tax Nature:</label>
        <select
          value={taxNature}
          onChange={(e) => setTaxNature(e.target.value)}
        >
          {["Taxable", "Exempt", "Nil Rated", "Non-GST", "Reverse Charge"].map(
            (t) => (
              <option key={t}>{t}</option>
            )
          )}
        </select>
      </div>
    </div>
    {/* HSN CODE */}
    <div className="row justify-content-center">
      <div className="col-4 inputcolumn-mdl">
        <label>HSN Code:</label>
        <input
          type="text"
          value={hsnCode}
          onChange={(e) => setHsnCode(e.target.value)}
        />
      </div>
    </div>

    {/* Render all other fields ONLY if taxNature is not Exempt */}
    {taxNature !== "Exempt" && (
      <>
        {/* PERCENTAGE */}
        <div className="row justify-content-center">
          <div className="col-4 inputcolumn-mdl">
            <label>Percentage:</label>
            <input
              type="number"
              value={percentage}
              onChange={(e) => setPercentage(e.target.value)}
              className={errors.percentage ? styles.errorField : ""}
              required
            />
          </div>
        </div>

        {/* APPLICABLE ON */}
        <div className="row justify-content-center">
          <div className="col-4 inputcolumn-mdl">
            <label>Applicable On:</label>
            <select
              value={applicableOn}
              onChange={(e) => setApplicableOn(e.target.value)}
            >
              {["Sale", "Purchase", "Both"].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </div>
        </div>


        
        {/* DESCRIPTION */}
        <div className="row justify-content-center">
          <div className="col-4 inputcolumn-mdl">
            <label>Description:</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            ></textarea>
          </div>
        </div>
      </>
    )}

    {/* ACTIONS */}
    {!loading && !successfull && (
      <div className="row pt-3 mt-3 justify-content-center">
        <div className="col-5">
          <button
            type="submit"
            className="submitbtn"
            data-bs-dismiss="modal"
            onClick={onSubmitClick}
          >
            Create
          </button>
          <DialogActionTrigger asChild>
            <button type="button" className="cancelbtn" data-bs-dismiss="modal">
              Close
            </button>
          </DialogActionTrigger>
        </div>
      </div>
    )}

    {successfull && (
      <div className="row pt-3 mt-3 justify-content-center">
        <div className="col-6">
          <DialogActionTrigger asChild>
            <button type="submit" className="submitbtn" data-bs-dismiss="modal">
              {successfull}
            </button>
          </DialogActionTrigger>
        </div>
      </div>
    )}

    {loading && (
      <div className="row pt-3 mt-3 justify-content-center">
        <div className="col-5">
          <Loading />
        </div>
      </div>
    )}

    {isModalOpen && (
      <ErrorModal isOpen={isModalOpen} message={error} onClose={closeModal} />
    )}
  </>
);
}

export default TaxAddModal;
