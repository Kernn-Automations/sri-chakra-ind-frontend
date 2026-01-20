import React, { useEffect, useState } from "react";
import styles from "./Farmer.module.css";
import { useAuth } from "@/Auth";
import { FaMapMarkerAlt, FaPen } from "react-icons/fa";
import Loading from "@/components/Loading";
import ErrorModal from "@/components/ErrorModal";
import axios from "axios";

function CreateFarmer({ navigate }) {
  const [form, setForm] = useState({
    // Personal Information
    mobile: "",
    name: "",
    dateOfBirth: "",
    gender: "",
    address: "",
    village: "",
    mandal: "",
    district: "",
    state: "",
    pincode: "",
    
    // Dairy Farming Details
    totalCowsBuffaloes: "",
    totalCows: "",
    cowBreed: "",
    totalBuffaloes: "",
    buffaloBreed: "",
    dailyMilkProduction: "",
    milkSoldTo: "",
    feedType: "",
    vetName: "",
    vetMobile: "",
    
    // Agricultural Details
    totalLandHolding: "",
    landUnit: "acres",
    landType: "",
    irrigationSource: "",
    majorCrops: "",
    seasonalCrops: "",
    farmingMethod: "",
    farmMachinery: "",
  });

  const [photo, setPhoto] = useState();
  const [aadhaarFront, setAadhaarFront] = useState();
  const [aadhaarBack, setAadhaarBack] = useState();
  const [panFront, setPanFront] = useState();
  const [panBack, setPanBack] = useState();
  const [landDocuments, setLandDocuments] = useState();

  const [businessOfficers, setBusinessOfficers] = useState([]);
  const [showMap, setShowMap] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const { axiosAPI } = useAuth();
  const token = localStorage.getItem("accessToken");
  const VITE_API = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const fetchBusinessOfficers = async () => {
      try {
        setLoading(true);
        const res = await axiosAPI.get("/employees/role/Business Officer");
        setBusinessOfficers(res.data.employees);
      } catch (err) {
        setError(err.response?.data?.message || "Error fetching executives");
        setIsModalOpen(true);
      } finally {
        setLoading(false);
      }
    };

    fetchBusinessOfficers();
  }, []);

  const handleCreate = async () => {
    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      formData.append(key, value);
    });

    // Append files
    if (photo) formData.append("photo", photo);
    if (aadhaarFront) formData.append("aadhaarFront", aadhaarFront);
    if (aadhaarBack) formData.append("aadhaarBack", aadhaarBack);
    if (panFront) formData.append("panFront", panFront);
    if (panBack) formData.append("panBack", panBack);
    if (landDocuments) formData.append("landDocuments", landDocuments);

    try {
      setLoading(true);
      const res = await axiosAPI.post("/farmers", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      console.log("Farmer created:", res.data);
      navigate("/farmers/farmer-list");
    } catch (err) {
      setError(err.response?.data?.message || "Error creating farmer");
      setIsModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (field, file) => {
    switch (field) {
      case "photo":
        setPhoto(file);
        break;
      case "aadhaarFront":
        setAadhaarFront(file);
        break;
      case "aadhaarBack":
        setAadhaarBack(file);
        break;
      case "panFront":
        setPanFront(file);
        break;
      case "panBack":
        setPanBack(file);
        break;
      case "landDocuments":
        setLandDocuments(file);
        break;
      default:
        break;
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <>
      <p className="path">
        <span onClick={() => navigate("/farmers")}>Farmers</span>{" "}
        <i className="bi bi-chevron-right"></i> Add Farmer
      </p>

      {/* Personal Information */}
      <div className="row m-0 p-3">
        <h5 className={styles.head}>Personal Information</h5>
        {[
          { label: "Mobile Number", field: "mobile" },
          { label: "Full Name", field: "name" },
          { label: "Date of Birth", field: "dateOfBirth", type: "date" },
          { label: "Gender", field: "gender", type: "select", options: [
            { value: "", label: "--select--" },
            { value: "male", label: "Male" },
            { value: "female", label: "Female" },
            { value: "other", label: "Other" }
          ]},
        ].map(({ label, field, type, options }) => (
          <div key={field} className={`col-3 ${styles.longform}`}>
            <label>{label} :</label>
            {type === "date" ? (
              <input
                type="date"
                value={form[field]}
                onChange={(e) => handleChange(field, e.target.value)}
              />
            ) : type === "select" ? (
              <select
                value={form[field]}
                onChange={(e) => handleChange(field, e.target.value)}
              >
                {options.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={form[field]}
                onChange={(e) => handleChange(field, e.target.value)}
                required={field === "mobile" || field === "name"}
              />
            )}
          </div>
        ))}
      </div>

      {/* Address Information */}
      <div className="row m-0 p-3">
        <h5 className={styles.head}>Address Information</h5>
        <div className={`col-12 ${styles.longform}`}>
          <label>Address :</label>
          <textarea
            value={form.address}
            onChange={(e) => handleChange("address", e.target.value)}
            placeholder="Enter complete address"
            rows="3"
          />
        </div>
        {[
          { label: "Village", field: "village" },
          { label: "Mandal/Tehsil", field: "mandal" },
          { label: "District", field: "district" },
          { label: "State", field: "state" },
          { label: "Pin Code", field: "pincode" },
        ].map(({ label, field }) => (
          <div key={field} className={`col-3 ${styles.longform}`}>
            <label>{label} :</label>
            <input
              type="text"
              value={form[field]}
              onChange={(e) => handleChange(field, e.target.value)}
            />
          </div>
        ))}
      </div>

      {/* Dairy Farming Details */}
      <div className="row m-0 p-3">
        <h5 className={styles.head}>Dairy Farming Details</h5>
        {[
          { label: "Total Cows & Buffaloes", field: "totalCowsBuffaloes", type: "number" },
          { label: "Total Cows", field: "totalCows", type: "number" },
          { label: "Cow Breed", field: "cowBreed" },
          { label: "Total Buffaloes", field: "totalBuffaloes", type: "number" },
          { label: "Buffalo Breed", field: "buffaloBreed" },
          { label: "Daily Milk Production (liters)", field: "dailyMilkProduction", type: "number" },
        ].map(({ label, field, type }) => (
          <div key={field} className={`col-3 ${styles.longform}`}>
            <label>{label} :</label>
            <input
              type={type || "text"}
              value={form[field]}
              onChange={(e) => handleChange(field, e.target.value)}
            />
          </div>
        ))}
        
        <div className={`col-3 ${styles.longform}`}>
          <label>Milk Sold To :</label>
          <select
            value={form.milkSoldTo}
            onChange={(e) => handleChange("milkSoldTo", e.target.value)}
          >
            <option value="">--select--</option>
            <option value="local_market">Local Market</option>
            <option value="dairy_cooperatives">Dairy Cooperatives</option>
            <option value="milk_processing_units">Milk Processing Units</option>
          </select>
        </div>

        <div className={`col-3 ${styles.longform}`}>
          <label>Type of Feed Used :</label>
          <select
            value={form.feedType}
            onChange={(e) => handleChange("feedType", e.target.value)}
          >
            <option value="">--select--</option>
            <option value="pellets">Pellets</option>
            <option value="mash">Mash</option>
          </select>
        </div>

        {[
          { label: "Vet Name", field: "vetName" },
          { label: "Vet Mobile", field: "vetMobile" },
        ].map(({ label, field }) => (
          <div key={field} className={`col-3 ${styles.longform}`}>
            <label>{label} :</label>
            <input
              type="text"
              value={form[field]}
              onChange={(e) => handleChange(field, e.target.value)}
            />
          </div>
        ))}
      </div>

      {/* Agricultural Details */}
      <div className="row m-0 p-3">
        <h5 className={styles.head}>Agricultural Details</h5>
        <div className={`col-3 ${styles.longform}`}>
          <label>Total Land Holding :</label>
          <div style={{ display: "flex", gap: "10px" }}>
            <input
              type="number"
              value={form.totalLandHolding}
              onChange={(e) => handleChange("totalLandHolding", e.target.value)}
              placeholder="Enter land area"
              style={{ flex: 1 }}
            />
            <select
              value={form.landUnit}
              onChange={(e) => handleChange("landUnit", e.target.value)}
              style={{ width: "120px" }}
            >
              <option value="acres">Acres</option>
              <option value="hectares">Hectares</option>
            </select>
          </div>
        </div>

        <div className={`col-3 ${styles.longform}`}>
          <label>Type of Land :</label>
          <select
            value={form.landType}
            onChange={(e) => handleChange("landType", e.target.value)}
          >
            <option value="">--select--</option>
            <option value="irrigated">Irrigated</option>
            <option value="non_irrigated">Non-Irrigated</option>
          </select>
        </div>

        <div className={`col-3 ${styles.longform}`}>
          <label>Source of Irrigation :</label>
          <select
            value={form.irrigationSource}
            onChange={(e) => handleChange("irrigationSource", e.target.value)}
          >
            <option value="">--select--</option>
            <option value="well">Well</option>
            <option value="borewell">Borewell</option>
            <option value="canal">Canal</option>
            <option value="rain_fed">Rain-fed</option>
          </select>
        </div>

        <div className={`col-3 ${styles.longform}`}>
          <label>Farming Method :</label>
          <select
            value={form.farmingMethod}
            onChange={(e) => handleChange("farmingMethod", e.target.value)}
          >
            <option value="">--select--</option>
            <option value="organic">Organic</option>
            <option value="inorganic">Inorganic</option>
            <option value="mixed">Mixed</option>
          </select>
        </div>

        <div className={`col-6 ${styles.longform}`}>
          <label>Major Crops Grown :</label>
          <textarea
            value={form.majorCrops}
            onChange={(e) => handleChange("majorCrops", e.target.value)}
            placeholder="Enter major crops grown"
            rows="3"
          />
        </div>

        <div className={`col-6 ${styles.longform}`}>
          <label>Seasonal Crops :</label>
          <textarea
            value={form.seasonalCrops}
            onChange={(e) => handleChange("seasonalCrops", e.target.value)}
            placeholder="Enter seasonal crops"
            rows="3"
          />
        </div>

        <div className={`col-12 ${styles.longform}`}>
          <label>Farm Machinery Available :</label>
          <textarea
            value={form.farmMachinery}
            onChange={(e) => handleChange("farmMachinery", e.target.value)}
            placeholder="Enter farm machinery (Tractor, Tiller, Sprayers, etc.)"
            rows="3"
          />
        </div>
      </div>

      {/* Documents */}
      <div className="row m-0 p-0">
        <h5 className={styles.head}>Farmer Photo</h5>
        <div className={`col-3 ${styles.longform}`}>
          <label>Photo :</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleFileChange("photo", e.target.files[0])}
          />
        </div>
      </div>

      <div className="row m-0 p-0">
        <h5 className={styles.head}>Aadhaar Proof</h5>
        <div className={`col-3 ${styles.longform}`}>
          <label>Aadhaar Front :</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleFileChange("aadhaarFront", e.target.files[0])}
          />
        </div>
        <div className={`col-3 ${styles.longform}`}>
          <label>Aadhaar Back :</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleFileChange("aadhaarBack", e.target.files[0])}
          />
        </div>
      </div>

      <div className="row m-0 p-0">
        <h5 className={styles.head}>PAN Proof</h5>
        <div className={`col-3 ${styles.longform}`}>
          <label>PAN Front :</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleFileChange("panFront", e.target.files[0])}
          />
        </div>
        <div className={`col-3 ${styles.longform}`}>
          <label>PAN Back :</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleFileChange("panBack", e.target.files[0])}
          />
        </div>
      </div>

      <div className="row m-0 p-0">
        <h5 className={styles.head}>Land Documents</h5>
        <div className={`col-3 ${styles.longform}`}>
          <label>Land Documents :</label>
          <input
            type="file"
            accept=".pdf,.doc,.docx,image/*"
            onChange={(e) => handleFileChange("landDocuments", e.target.files[0])}
          />
        </div>
      </div>

      {/* Actions */}
      {!loading && (
        <div className="row m-0 p-3 justify-content-center">
          <div className="col-3">
            <button className="submitbtn" onClick={handleCreate}>
              Create
            </button>
            <button
              className="cancelbtn"
              onClick={() => navigate("/farmers")}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading && <Loading />}
      {isModalOpen && (
        <ErrorModal
          isOpen={isModalOpen}
          message={error}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
}

export default CreateFarmer;
