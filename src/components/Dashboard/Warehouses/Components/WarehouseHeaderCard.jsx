import React, { useState } from "react";
import {
  FaWarehouse,
  FaUser,
  FaPhone,
  FaMapMarkerAlt,
  FaEdit,
} from "react-icons/fa";
import { useAuth } from "@/Auth";
import styles from "./WarehouseActivityTab.module.css";

function WarehouseHeaderCard({ warehouse, managers, refreshData }) {
  const { axiosAPI } = useAuth();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: warehouse?.warehouse?.name,
    type: warehouse?.warehouse?.type,
    plot: warehouse?.warehouse?.plot || "",
    street: warehouse?.warehouse?.street || "",
    area: warehouse?.warehouse?.area || "",
    city: warehouse?.warehouse?.city || "",
    district: warehouse?.warehouse?.district || "",
    state: warehouse?.warehouse?.state || "",
    country: warehouse?.warehouse?.country || "",
    pincode: warehouse?.warehouse?.pincode || "",
    managerId: warehouse?.manager?.id || "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: false }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.name) newErrors.name = true;
    if (!form.type) newErrors.type = true;
    if (!form.plot) newErrors.plot = true;
    if (!form.city) newErrors.city = true;
    if (!form.state) newErrors.state = true;
    if (!form.pincode) newErrors.pincode = true;
    if (!form.managerId) newErrors.managerId = true;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdate = async () => {
    if (!validate()) return;

    try {
      setLoading(true);
      await axiosAPI.put(`/warehouse/update/${warehouse.warehouse.id}`, form);
      setEditing(false);
      refreshData?.();
    } catch (err) {
      console.error("Update failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* <div className="card shadow-sm border-0 rounded-4 p-4 mb-4"> */}
      <div className="d-flex justify-content-between align-items-center mb-4 p-3">
        <div className="d-flex align-items-center gap-3">
          <FaWarehouse size={50} className={styles.warehouseIcon} />
          <div>
            <h5 className="mb-1 mx-2 mt-3 ">{form.name}</h5>
            <small className={`text-muted ${styles.graytext}`}>
              {form.type} • {form.city}, {form.state}
            </small>
          </div>
        </div>
        <button
          className={styles.updateDetailsBtn}
          onClick={() => setEditing(true)}
        >
          <FaEdit className="me-2" /> Update Details
        </button>
      </div>

      {!editing ? (
        <div className="row text-secondary">
          <div className={`col-md-4 mb-2 ${styles.managerRow} `}>
            <FaUser className="me-2" />
            <strong>{warehouse?.manager?.name}</strong>
          </div>
          <div className={`col-md-4 mb-2 ${styles.managerRow} `}>
            <FaPhone className="me-2" />
            {warehouse?.manager?.mobile}
          </div>
          <div className={`col-md-4 mb-2 ${styles.managerRow} `}>
            <FaMapMarkerAlt className="me-2" size={25}/>
            {warehouse?.warehouse?.plot}, {warehouse?.warehouse?.street},{" "}
            {warehouse?.warehouse?.area}, {warehouse?.warehouse?.city},{" "}
            {warehouse?.warehouse?.district}, {warehouse?.warehouse?.state},{" "}
            {warehouse?.warehouse?.country}, {warehouse?.warehouse?.pincode}
          </div>
        </div>
      ) : (
        <div className="border-top pt-3">
          <div className="row g-3">
            {[
              { label: "Warehouse Name", field: "name" },
              {
                label: "Warehouse Type",
                field: "type",
                type: "select",
                options: ["local", "central"],
              },
              { label: "Plot / H.No", field: "plot" },
              { label: "Street", field: "street" },
              { label: "Area", field: "area" },
              { label: "City/Village", field: "city" },
              { label: "District", field: "district" },
              { label: "State", field: "state" },
              { label: "Country", field: "country" },
              { label: "Pincode", field: "pincode" },
            ].map(({ label, field, type = "text", options }) => (
              <div className={`col-md-4 ${styles.updateFelids}`} key={field} >
                <label className="form-label">{label}</label>
                {type === "select" ? (
                  <select
                    className={`form-select ${errors[field] ? "border-danger" : ""}`}
                    value={form[field]}
                    onChange={(e) => handleChange(field, e.target.value)}
                  >
                    <option value="">--select--</option>
                    {options.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    className={`form-control ${errors[field] ? "border-danger" : ""}`}
                    type="text"
                    value={form[field]}
                    onChange={(e) => handleChange(field, e.target.value)}
                  />
                )}
              </div>
            ))}

            {/* Manager Dropdown */}
            <div className={`col-md-4 ${styles.updateFelids}`}>
              <label className="form-label">Manager</label>
              <select
                className={`form-select ${errors.managerId ? "border-danger" : ""}`}
                value={form.managerId}
                onChange={(e) => handleChange("managerId", e.target.value)}
              >
                <option value="">--Select--</option>
                {managers?.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="d-flex justify-content-end gap-2 mt-4">
            <button
              className="cancelbtn"
              onClick={() => setEditing(false)}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              className="submitbtn"
              onClick={handleUpdate}
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      )}
      {/* </div> */}
    </>
  );
}

export default WarehouseHeaderCard;
