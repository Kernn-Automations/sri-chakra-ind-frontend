import React, { useEffect, useState } from "react";
import { useAuth } from "@/Auth";
import ErrorModal from "@/components/ErrorModal";

function TaxSelector({ selectedTaxes = [], setSelectedTaxes }) {
  const { axiosAPI } = useAuth();
  const [allTaxes, setAllTaxes] = useState([]);
  const [newTaxId, setNewTaxId] = useState("");

  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const closeModal = () => setIsModalOpen(false);

  // 🔄 Normalize selected taxes
  const selectedTaxIds = Array.isArray(selectedTaxes) ? selectedTaxes : [];

  useEffect(() => {
    async function fetchTaxes() {
      try {
        const res = await axiosAPI.get("/tax");
        setAllTaxes(res.data?.taxes || []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch taxes.");
        setIsModalOpen(true);
      }
    }
    fetchTaxes();
  }, []);

  const handleSelect = (e) => {
    const selectedId = parseInt(e.target.value);
    if (!selectedTaxIds.includes(selectedId)) {
      setSelectedTaxes([...selectedTaxIds, selectedId]);
    }
    setNewTaxId("");
  };

  const removeTax = (index) => {
    const updated = selectedTaxIds.filter((_, i) => i !== index);
    setSelectedTaxes(updated);
  };

  const availableTaxes = allTaxes.filter((t) => !selectedTaxIds.includes(t.id));

  const hasExemptTax = selectedTaxIds
  .map((id) => allTaxes.find((t) => t.id === id))
  .some((tax) => tax?.taxNature === "Exempt");


  return (
    <>
      <label className="fw-bold">Taxes:</label>

      {selectedTaxIds.map((taxId, index) => {
        const tax = allTaxes.find((t) => t.id === taxId);
        if (!tax) return null;

        return (
          <div
            key={taxId}
            className="border rounded p-2 mb-2"
            style={{ background: "#f9f9f9" }}
          >
            <div className="d-flex justify-content-between align-items-center">
              <strong>{tax.name}</strong>
              <button
                className="btn btn-sm btn-outline-danger"
                onClick={() => removeTax(index)}
              >
                Remove
              </button>
            </div>

            <small className="text-muted">
              <div><b>Percentage:</b> {tax.percentage}%</div>
              <div><b>Nature:</b> {tax.taxNature}</div>
              <div><b>Applicable On:</b> {tax.applicableOn}</div>
              {tax.hsnCode && <div><b>HSN Code:</b> {tax.hsnCode}</div>}
              {tax.description && <div><b>Description:</b> {tax.description}</div>}
              {tax.isCess && (
                <div>
                  <b>Cess:</b> Yes ({tax.cessPercentage || 0}%)
                </div>
              )}
              {tax.isAdditionalDuty && <div><b>Additional Duty:</b> Yes</div>}
            </small>
          </div>
        );
      })}

      {hasExemptTax ? (
        <div className="alert alert-warning mt-2 p-2">
          <strong>Note:</strong> An <b>Exempt</b> tax is selected. No other taxes can be added.
        </div>
      ) : availableTaxes.length > 0 ? (
        <select
          className="form-select mt-2"
          style={{ minWidth: "300px", height: "45px", fontSize: "1rem" }}
          value={newTaxId}
          onChange={handleSelect}
        >
          <option value="" disabled>
            -- Select Tax --
          </option>
          {availableTaxes.map((tax) => (
            <option key={tax.id} value={tax.id}>
              {tax.name} ({tax.percentage}%)
            </option>
          ))}
        </select>
      ) : (
        <p className="fw-bold text-muted mt-2">All taxes are selected.</p>
      )}


      {availableTaxes.length === 0 && (
        <p className="fw-bold text-muted mt-2">All taxes are selected.</p>
      )}

      {isModalOpen && (
        <ErrorModal isOpen={isModalOpen} message={error} onClose={closeModal} />
      )}
    </>
  );
}

export default TaxSelector;
