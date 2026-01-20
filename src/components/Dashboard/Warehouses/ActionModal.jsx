import React, { useEffect, useState } from "react";
import styles from "./Warehouse.module.css";
import { DialogActionTrigger } from "@/components/ui/dialog";
import MapViewModal from "./MapViewModal";
import axios from "axios";
import Loading from "@/components/Loading";
import ErrorModal from "@/components/ErrorModal";
import { useAuth } from "@/Auth";

function ActionModal({ warehouse, managers, changeTrigger }) {
  const [formData, setFormData] = useState({ ...warehouse });
  const [isEditable, setIsEditable] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const [location, setLocation] = useState({
    lat: Number(formData.latitude),
    lng: Number(formData.longitude),
  });

  const [error, setError] = useState();
  const [loading, setLoading] = useState(false);
  const [successful, setSuccessful] = useState();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const closeModal = () => {
    setIsModalOpen(false);
  };

  const { axiosAPI } = useAuth();

  useEffect(
    () =>
      setFormData((prev) => ({
        ...prev,
        ["latitude"]: location.lat,
        ["longitude"]: location.lng,
      })),
    [location]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    // console.log(location);

    // console.log(FormData)

    try {
      setLoading(true);
      const res = await axiosAPI.put(
        `/warehouse/update/${formData.id}`,
        formData
      );
      // setIsEditable(false);
      // console.log(res);
      setSuccessful(res.data.message);
      changeTrigger();
    } catch (error) {
      // console.log(error);
      setError(error.response?.data?.message);
      setIsModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h3 className={`px-3 pb-3 mdl-title`}>Warehouse</h3>
      <form onSubmit={handleSubmit}>
        {[
          { label: "Warehouse ID", name: "id", type: "text" },
          { label: "Warehouse Name", name: "name", type: "text" },
          { label: "Plot / H.No", name: "plot", type: "text" },
          { label: "Street", name: "street", type: "text" },
          { label: "Area", name: "area", type: "text" },
          { label: "City/Village", name: "city", type: "text" },
          { label: "District", name: "district", type: "text" },
          { label: "State", name: "state", type: "text" },
          { label: "Country", name: "country", type: "text" },
          { label: "Pincode", name: "pincode", type: "text" },
        ].map((input, idx) => (
          <div className="row justify-content-center" key={idx}>
            <div className={`col-4 inputcolumn-mdl`}>
              <label>{input.label}:</label>
              <input
                type={input.type}
                name={input.name}
                value={formData[input.name]}
                onChange={handleChange}
                disabled={!isEditable}
                required
              />
            </div>
          </div>
        ))}

        <div className="row justify-content-center">
          <div className={`col-4 inputcolumn-mdl`}>
            <label>Manager:</label>
            <select
              name="managerId"
              value={formData.managerId}
              onChange={handleChange}
              disabled={!isEditable}
              required
            >
              <option value="">--select--</option>
              {managers.map((manager) => (
                <option key={manager.id} value={manager.id}>
                  {manager.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="row justify-content-center">
          <div className={`col-4 inputcolumn-mdl`}>
            <label>Locate on Map:</label>
            <MapViewModal
              defaultLocation={location}
              setDefaultLocation={isEditable ? setLocation : () => {}}
              setLocation={setLocation}
            />
          </div>
        </div>

        {isEditable ? (
          <>
            {!loading && !successful && (
              <div className="row pt-3 mt-3 justify-content-center">
                <div className={`col-5`}>
                  <button type="submit" className="submitbtn">
                    Save
                  </button>
                  <button
                    type="button"
                    className="cancelbtn ms-2"
                    onClick={() => setIsEditable(false)}
                  >
                    Cancel
                  </button>{" "}
                </div>
              </div>
            )}
            {successful && (
              <div className="row pt-3 mt-3 justify-content-center">
                <div className={`col-6`}>
                  <DialogActionTrigger asChild>
                    <button className="submitbtn">{successful}</button>
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
          </>
        ) : (
          <>
            <div className="row pt-3 mt-3 justify-content-center">
              <div className={`col-5`}>
                <button
                  type="button"
                  className="submitbtn"
                  onClick={(e) => {
                    e.preventDefault()
                    setIsEditable(true)}}
                >
                  Edit
                </button>
                <DialogActionTrigger asChild>
                  <button type="button" className="cancelbtn ms-2">
                    Close
                  </button>
                </DialogActionTrigger>
              </div>
            </div>
          </>
        )}
      </form>
    </>
  );
}

export default ActionModal;
