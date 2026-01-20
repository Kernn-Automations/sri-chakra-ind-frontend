import React, { useState } from "react";
import styles from "./Products.module.css";
const conditionOptions = ["Exact", "Greater than", "Less than", "Range"];

const PricingSlabs = ({ pricingSlabs = [], setPricingSlabs }) => {
  const handleSlabChange = (index, field, value) => {
    const updatedSlabs = [...pricingSlabs];
    updatedSlabs[index][field] = value;

    if (field === "quantityCondition" && value !== "Range") {
      updatedSlabs[index].quantityValueEnd = "";
    }

    setPricingSlabs(updatedSlabs);
  };

  const addSlab = () => {
    setPricingSlabs([
      ...pricingSlabs,
      {
        quantityCondition: "Exact",
        quantityValueStart: "",
        quantityValueEnd: "",
        price: "",
      },
    ]);
  };

  const removeSlab = (index) => {
    const updatedSlabs = pricingSlabs.filter((_, i) => i !== index);
    setPricingSlabs(updatedSlabs);
  };

  return (
    <div>
      {(pricingSlabs || []).map((slab, index) => (
        <div key={index} className="row m-0 p-2">
          <div className={`col-2 ${styles.taxform}`}>
            <select
              value={slab.quantityCondition}
              onChange={(e) =>
                handleSlabChange(index, "quantityCondition", e.target.value)
              }
            >
              {conditionOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
          <div className={`col-2 ${styles.taxform}`}>
            <input
              type="number"
              placeholder="Start Quantity"
              value={slab.quantityValueStart}
              onChange={(e) =>
                handleSlabChange(index, "quantityValueStart", e.target.value)
              }
            />
          </div>

          {slab.quantityCondition === "Range" && (
            <div className={`col-2 ${styles.taxform}`}>
              <input
                type="number"
                placeholder="End Quantity"
                value={slab.quantityValueEnd}
                onChange={(e) =>
                  handleSlabChange(index, "quantityValueEnd", e.target.value)
                }
              />
            </div>
          )}

          <div className={`col-2 ${styles.taxform}`}>
            <input
              type="number"
              placeholder="Price"
              value={slab.price}
              onChange={(e) => handleSlabChange(index, "price", e.target.value)}
            />
          </div>
            <div className={`col-2 ${styles.taxform}`}>
              <button
                className="btn btn-sm btn-outline-danger"
                onClick={() => removeSlab(index)}
              >
                Remove
              </button>
            </div>
        </div>
      ))}

      <button className="submitbtn" onClick={addSlab}>
        Add Slab
      </button>
    </div>
  );
};

export default PricingSlabs;
