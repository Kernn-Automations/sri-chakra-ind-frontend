import React, { useState } from "react";
import styles from "./Products.module.css";
import { DialogActionTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/Auth";
import ErrorModal from "@/components/ErrorModal";
import Loading from "@/components/Loading";

function TaxModal({ tax, trigger, setTrigger }) {
  const [editclick, setEditclick] = useState(false);

  const [name, setName] = useState(tax.name);
  const [percentage, setPercentage] = useState(tax.percentage || "");
  const [description, setDescription] = useState(tax.description || "");
  const [hsnCode, setHsnCode] = useState(tax.hsnCode || "");
  const [taxNature, setTaxNature] = useState(tax.taxNature || "Taxable");
  const [applicableOn, setApplicableOn] = useState(tax.applicableOn || "Both");

  const [successfull, setSuccessfull] = useState(null);
  const [error, setError] = useState();
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { axiosAPI } = useAuth();
  const closeModal = () => setIsModalOpen(false);

  const onEditClick = () => setEditclick(true);

  const validateFields = () => {
    if (!name || !hsnCode) return false;
    if (taxNature !== "Exempt" && percentage === "") return false;
    return true;
  };

  const onSubmitClick = async () => {
    if (!validateFields()) {
      setError("Please fill all required fields");
      setIsModalOpen(true);
      return;
    }

    try {
      setLoading(true);

      const payload = {
        name,
        description,
        hsnCode,
        taxNature,
        applicableOn,
      };

      // Percentage handling based on tax nature
      if (taxNature === "Exempt") {
        payload.percentage = null;
      } else if (taxNature === "Nil Rated") {
        payload.percentage = 0;
      } else {
        payload.percentage = Number(percentage);
      }

      const res = await axiosAPI.put(`/tax/${tax.id}`, payload);

      setTrigger(!trigger);
      setSuccessfull(res.data.message);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to update tax");
      setIsModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h3 className="px-3 pb-3 mdl-title">Taxes</h3>

      {/* DATE */}
      <div className="row justify-content-center">
        <div className="col-4 inputcolumn-mdl">
          <label>Date :</label>
          <input type="date" value={tax.createdAt.slice(0, 10)} disabled />
        </div>
      </div>

      {/* TAX NAME */}
      <div className="row justify-content-center">
        <div className="col-4 inputcolumn-mdl">
          <label>Tax Name :</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={!editclick}
          />
        </div>
      </div>

      {/* TAX NATURE */}
      <div className="row justify-content-center">
        <div className="col-4 inputcolumn-mdl">
          <label>Tax Nature :</label>
          <select
            value={taxNature}
            onChange={(e) => setTaxNature(e.target.value)}
            disabled={!editclick}
          >
            {[
              "Taxable",
              "Exempt",
              "Nil Rated",
              "Non-GST",
              "Reverse Charge",
            ].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      {/* HSN CODE */}
      <div className="row justify-content-center">
        <div className="col-4 inputcolumn-mdl">
          <label>HSN Code :</label>
          <input
            type="text"
            value={hsnCode}
            onChange={(e) => setHsnCode(e.target.value)}
            disabled={!editclick}
          />
        </div>
      </div>

      {/* CONDITIONAL FIELDS */}
      {taxNature !== "Exempt" && (
        <>
          {/* PERCENTAGE */}
          <div className="row justify-content-center">
            <div className="col-4 inputcolumn-mdl">
              <label>Percentage :</label>
              <input
                type="number"
                value={percentage}
                onChange={(e) => setPercentage(e.target.value)}
                disabled={!editclick}
              />
            </div>
          </div>

          {/* APPLICABLE ON */}
          <div className="row justify-content-center">
            <div className="col-4 inputcolumn-mdl">
              <label>Applicable On :</label>
              <select
                value={applicableOn}
                onChange={(e) => setApplicableOn(e.target.value)}
                disabled={!editclick}
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
              <label>Description :</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={!editclick}
              />
            </div>
          </div>
        </>
      )}

      {/* ACTION BUTTONS */}
      {!editclick && (
        <div className="row p-3 justify-content-center">
          <div className="col-5">
            <button className="submitbtn" onClick={onEditClick}>
              Edit
            </button>
            <DialogActionTrigger asChild>
              <button className="cancelbtn">Close</button>
            </DialogActionTrigger>
          </div>
        </div>
      )}

      {editclick && !loading && !successfull && (
        <div className="row pt-3 justify-content-center">
          <div className="col-5">
            <button className="submitbtn" onClick={onSubmitClick}>
              Update
            </button>
            <DialogActionTrigger asChild>
              <button className="cancelbtn">Close</button>
            </DialogActionTrigger>
          </div>
        </div>
      )}

      {successfull && (
        <div className="row pt-3 justify-content-center">
          <div className="col-6">
            <DialogActionTrigger asChild>
              <button className="submitbtn">{successfull}</button>
            </DialogActionTrigger>
          </div>
        </div>
      )}

      {loading && (
        <div className="row pt-3 justify-content-center">
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

export default TaxModal;
