import React, { useEffect, useState } from "react";
import styles from "./Warehouse.module.css";
import { DialogActionTrigger } from "@/components/ui/dialog";
import MapViewModal from "./MapViewModal";
import { useAuth } from "@/Auth";
import ErrorModal from "@/components/ErrorModal";
import Loading from "@/components/Loading";
import SuccessModal from "@/components/SuccessModal";
import { FaPen } from "react-icons/fa";

function NewWarehouseModal({ managers, products, onSuccess }) {
  const [name, setName] = useState();
  const [plot, setPlot] = useState();
  const [street, setStreet] = useState();
  const [area, setArea] = useState();
  const [city, setCity] = useState();
  const [district, setDistrict] = useState();
  const [state, setState] = useState();
  const [country, setCountry] = useState();
  const [pincode, setPincode] = useState();
  const [type, setType] = useState();

  const [managerId, setManagerId] = useState();
  const [showMap, setShowMap] = useState(false);

  const [openingStock, setOpeningStock] = useState([]);

  const { axiosAPI } = useAuth();
  const [errors, setErrors] = useState({});
  const [successful, setSuccessful] = useState();

  const [error, setError] = useState();
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const closeModal = () => {
    setIsModalOpen(false);
  };

  const [defaultLocation, setDefaultLocation] = useState({
    lat: 17.4065,
    lng: 78.4772,
  });
  const [location, setLocation] = useState(defaultLocation);

  const setNulls = () => {
    setName(null);
    setPlot(null);
    setStreet(null);
    setArea(null);
    setCity(null);
    setDistrict(null);
    setState(null);
    setCountry(null);
    setPincode(null);
    setType(null);
  };
  const closeSuccessModal = () => {
    setSuccessful(null);
  };

  const validateFields = () => {
    const newErrors = {};
    if (!name) newErrors.name = true;
    if (!type) newErrors.type = true;
    if (!plot) newErrors.plot = true;
    if (!street) newErrors.street = true;
    if (!city) newErrors.city = true;
    if (!district) newErrors.district = true;
    if (!state) newErrors.state = true;
    if (!country) newErrors.country = true;
    if (!pincode) newErrors.pincode = true;
    if (!type) newErrors.pincode = true;
    if (!location?.lat || !location?.lng) newErrors.location = true;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onError = (e, vari, setter) => {
    const value = e.target.value === "null" ? null : e.target.value;
    setter(value);
    if (value) setErrors((prev) => ({ ...prev, vari: false }));
  };

  // form subbmission

  // console.log(name, location);
  // console.log(
  //   name,
  //   plot,
  // type,
  //   street,
  //   area,
  //   city,
  //   district,
  //   state,
  //   country,
  //   pincode,
  //   managerId
  // );
  // console.log(location);

  const handleStockChange = (index, field, value) => {
    const updated = [...openingStock];
    updated[index][field] = value;
    setOpeningStock(updated);
  };

  const addStockRow = () => {
    setOpeningStock([
      ...openingStock,
      {
        productId: "",
        stockQuantity: "",
        primaryUnit: "",
        productType: "loose",
      },
    ]);
  };

  const removeStockRow = (index) => {
    const updated = [...openingStock];
    updated.splice(index, 1);
    setOpeningStock(updated);
  };

  const onSubmitClick = (e) => {
    e?.preventDefault();

    if (!validateFields()) {
      setError("Please fill all fields");
      setIsModalOpen(true);
      return;
    }

    async function create() {
      try {
        setLoading(true);

        const payload = {
          name,
          type,
          plot,
          street,
          area,
          city,
          district,
          state,
          country,
          pincode,
          latitude: location.lat,
          longitude: location.lng,
          managerId,
          openingStock: openingStock.filter(
            (s) => s.productId && s.stockQuantity,
          ),
        };

        const res = await axiosAPI.post("/warehouse/add", payload);

        setSuccessful(res.data.message);

        setTimeout(() => {
          onSuccess?.();
        }, 300);
      } catch (e) {
        console.log("Caught error:", e); // <-- Force print the error
        setError(e.response?.data?.message || "Error creating warehouse");
        setIsModalOpen(true);
      } finally {
        setLoading(false);
      }
    }

    create();
  };

  // useEffect(() => {
  //   const getAddressFromCoords = async () => {
  // console.log("maps runned");
  //     if (location.lng == null || location.lat == null) return;

  // console.log("maps runned 2.0");
  //     const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API;
  //     const response = await fetch(
  //       `https://maps.googleapis.com/maps/api/geocode/json?latlng=${location.lat},${location.lng}&key=${apiKey}`
  //     );
  //     const data = await response.json();
  //     if (data.status === "OK") {
  //       const result = data.results[0];
  //       const components = result.address_components;

  //       const getComponent = (type) =>
  //         components.find((comp) => comp.types.includes(type))?.long_name || "";
  //       setPlot(getComponent("premise") || getComponent("subpremise"));
  //       setStreet(getComponent("route"));
  //       setArea(getComponent("sublocality_level_1"));
  //       setDistrict(getComponent("administrative_area_level_2"));
  //       setState(getComponent("administrative_area_level_1"));
  //       setPincode(getComponent("postal_code"));
  //     }
  //   };
  //   getAddressFromCoords();
  // }, [location]);

  return (
    <>
      <h3 className={`px-3 pb-3 mdl-title`}>Create Warehouse</h3>
      {/* Basic Info */}

      <div className="row justify-content-center">
        <div className={`col-4  ${styles.longformmdl}`}>
          <label>Warehouse Name</label>
          <input
            value={name || ""}
            onChange={(e) => onError(e, name, setName)}
            className={errors.name ? styles.errorField : ""}
          />
        </div>
        <div className={`col-4   ${styles.longformmdl}`}>
          <label htmlFor="">Warehouse Type :</label>
          <select
            name=""
            id=""
            value={type}
            onChange={(e) => onError(e, type, setType)}
            required
            className={errors.type ? styles.errorField : ""}
          >
            <option value="null">--select--</option>
            <option value="local">Local</option>
            <option value="central">Central</option>
          </select>
        </div>
        <div className={`col-4   ${styles.longformmdl}`}>
          <label htmlFor="">Plot / H.No :</label>
          <input
            type="text"
            value={plot}
            onChange={(e) => onError(e, plot, setPlot)}
            required
            className={errors.plot ? styles.errorField : ""}
          />
        </div>
        <div className={`col-4  ${styles.longformmdl}`}>
          <label>Street</label>
          <input
            value={street || ""}
            onChange={(e) => onError(e, street, setStreet)}
            className={errors.street ? styles.errorField : ""}
          />
        </div>
        <div className={`col-4  ${styles.longformmdl}`}>
          <label>Area</label>
          <input
            value={area || ""}
            onChange={(e) => onError(e, area, setArea)}
            className={errors.area ? styles.errorField : ""}
          />
        </div>
        <div className={`col-4  ${styles.longformmdl}`}>
          <label>City/Village</label>
          <input
            value={city || ""}
            onChange={(e) => onError(e, city, setCity)}
            className={errors.city ? styles.errorField : ""}
          />
        </div>
        <div className={`col-4  ${styles.longformmdl}`}>
          <label>District</label>
          <input
            value={district || ""}
            onChange={(e) => onError(e, district, setDistrict)}
            className={errors.district ? styles.errorField : ""}
          />
        </div>
        <div className={`col-4  ${styles.longformmdl}`}>
          <label>State</label>
          <input
            value={state || ""}
            onChange={(e) => onError(e, state, setState)}
            className={errors.state ? styles.errorField : ""}
          />
        </div>
        <div className={`col-4  ${styles.longformmdl}`}>
          <label>Country</label>
          <input
            value={country || ""}
            onChange={(e) => onError(e, country, setCountry)}
            className={errors.country ? styles.errorField : ""}
          />
        </div>
        <div className={`col-4  ${styles.longformmdl}`}>
          <label>Pincode</label>
          <input
            value={pincode || ""}
            onChange={(e) => onError(e, pincode, setPincode)}
            className={errors.pincode ? styles.errorField : ""}
          />
        </div>
        <div className={`col-4  ${styles.longformmdl}`}>
          <label>Manager</label>
          <select
            value={managerId || "null"}
            onChange={(e) => onError(e, managerId, setManagerId)}
            className={errors.managerId ? styles.errorField : ""}
          >
            <option value="null">--Select--</option>
            {managers?.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
        {/* Location Selector */}
        <div
          className={`col-4 d-flex align-items-center ${styles.longformmdl}`}
        >
          <label className="">Location:</label>
          {showMap ? (
            <MapViewModal
              setLocation={setLocation}
              defaultLocation={defaultLocation}
              setDefaultLocation={setDefaultLocation}
              onClose={() => setShowMap(false)} // Optional close handler
            />
          ) : location?.lat ? (
            <>
              <span>
                {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
              </span>
              <FaPen
                className="ms-2 cursor-pointer"
                onClick={() => setShowMap(true)}
              />
            </>
          ) : (
            <button>Locate</button>
          )}
        </div>
      </div>

      {/* Opening Stock Section */}
      <div className="row justify-content-center mt-4">
        <div className="col-10">
          <h5>Opening Stock</h5>
          <table className={`table table-bordered ${styles.mdltable}`}>
            <thead>
              <tr>
                <th>Product</th>
                <th>Quantity</th>
                <th>Unit</th>
                <th>Type</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {openingStock.map((row, index) => {
                const product = products.find((p) => p.id == row.productId);
                const displayUnit =
                  product?.productType === "packed"
                    ? "packets"
                    : product?.unit || "--";
                const displayType =
                  product?.productType || row.productType || "--";

                return (
                  <tr key={index}>
                    <td>
                      <select
                        value={row.productId}
                        onChange={(e) => {
                          const selectedId = e.target.value;
                          const selectedProduct = products.find(
                            (p) => p.id == selectedId,
                          );
                          handleStockChange(index, "productId", selectedId);
                          if (selectedProduct) {
                            handleStockChange(
                              index,
                              "primaryUnit",
                              selectedProduct.productType === "packed"
                                ? "packets"
                                : selectedProduct.unit,
                            );
                            handleStockChange(
                              index,
                              "productType",
                              selectedProduct.productType || "loose",
                            );
                          }
                        }}
                      >
                        <option value="">--Select--</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        type="number"
                        value={row.stockQuantity}
                        onChange={(e) =>
                          handleStockChange(
                            index,
                            "stockQuantity",
                            e.target.value,
                          )
                        }
                      />
                    </td>
                    <td>
                      <span>{displayUnit}</span>
                    </td>
                    <td>
                      <span>{displayType}</span>
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => removeStockRow(index)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <button className="btn btn-sm btn-primary" onClick={addStockRow}>
            Add Stock
          </button>
        </div>
      </div>
      {/* Submit */}
      {!loading && !successful && (
        <div className="row pt-3 mt-3 justify-content-center">
          <div className="col-5">
            <button className="submitbtn" onClick={onSubmitClick}>
              Create
            </button>
            <DialogActionTrigger asChild>
              <button className="cancelbtn" data-bs-dismiss="modal">
                Close
              </button>
            </DialogActionTrigger>
          </div>
        </div>
      )}
      {successful && (
        <div className="row pt-3 mt-3 justify-content-center">
          <div className="col-5">
            <DialogActionTrigger asChild>
              <button className="submitbtn" data-bs-dismiss="modal">
                {successful}
              </button>
            </DialogActionTrigger>
          </div>
        </div>
      )}
      {loading && <Loading />}
      {isModalOpen && (
        <ErrorModal isOpen={isModalOpen} message={error} onClose={closeModal} />
      )}
      {successful && (
        <SuccessModal
          isOpen={true}
          message={successful}
          onClose={closeSuccessModal}
        />
      )}
    </>
  );
}
export default NewWarehouseModal;
