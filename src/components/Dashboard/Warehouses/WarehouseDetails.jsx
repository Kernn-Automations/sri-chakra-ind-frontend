import { useAuth } from "@/Auth";
import ErrorModal from "@/components/ErrorModal";
import Loading from "@/components/Loading";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import styles from "./Warehouse.module.css";
import { FaPen } from "react-icons/fa";
import MapViewModal from "./MapViewModal";

function WarehouseDetails({ navigate, managers, products }) {
  const id = useParams();

  console.log(id.id);
  const warehouseId = id.id;

  const [error, setError] = useState();
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const closeModal = () => {
    setIsModalOpen(false);
  };

  const [warehouse, setWarehouse] = useState();
  const { axiosAPI } = useAuth();

  // update warehouse

  const [name, setName] = useState();
  const [plot, setPlot] = useState();
  const [street, setStreet] = useState();
  const [area, setArea] = useState();
  const [city, setCity] = useState();
  const [district, setDistrict] = useState();
  const [stateName, setStateName] = useState();
  const [country, setCountry] = useState();
  const [pincode, setPincode] = useState();
  const [type, setType] = useState();

  const [managerId, setManagerId] = useState();
  const [showMap, setShowMap] = useState(false);

  const [openingStock, setOpeningStock] = useState([]);

  const [defaultLocation, setDefaultLocation] = useState({
    lat: warehouse?.latitude,
    lng: warehouse?.longitude,
  });
  const [location, setLocation] = useState(defaultLocation);

  const validateFields = () => {
    const newErrors = {};
    if (!name) newErrors.name = true;
    if (!type) newErrors.type = true;
    if (!plot) newErrors.plot = true;
    if (!street) newErrors.street = true;
    if (!area) newErrors.area = true;
    if (!city) newErrors.city = true;
    if (!district) newErrors.district = true;
    if (!stateName) newErrors.stateName = true;
    if (!country) newErrors.country = true;
    if (!pincode) newErrors.pincode = true;
    if (!type) newErrors.pincode = true;
    if (!managerId) newErrors.managerId = true;
    if (!location?.lat || !location?.lng) newErrors.location = true;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onError = (e, vari, setter) => {
    const value = e.target.value === "null" ? null : e.target.value;
    setter(value);
    if (value) setErrors((prev) => ({ ...prev, vari: false }));
  };

  useEffect(() => {
    async function fetch() {
      try {
        setLoading(true);
        // setWarehouses(null);
        const res = await axiosAPI.get(`/warehouses/details/${warehouseId}`);
        console.log(res);
        setWarehouse(res.data.warehouse);
      } catch (e) {
        // console.log(e);
        setError(e.response.data.message);
        setIsModalOpen(true);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, []);

  useEffect(() => {
    setName(warehouse?.name);
    setType(warehouse?.type);
    setPlot(warehouse?.plot);
    setStreet(warehouse?.street);
    setArea(warehouse?.area);
    setCity(warehouse?.city);
    setManagerId(warehouse?.managerId);
    setDistrict(warehouse?.district);
    setStateName(warehouse?.state);
    setPincode(warehouse?.pincode);
    setCountry(warehouse?.country);

    if (warehouse?.inventory) {
      const prods = [];
      warehouse.inventory.map((inv) =>
        prods.push({
          productId: Number(inv.productId),
          stockQuantity: inv.stockQuantity,
          primaryUnit: inv.product?.unit,
          productType: inv.product?.productType,
        })
      );

      setOpeningStock(prods);
    }
  }, [warehouse]);

  const [errors, setErrors] = useState({});

  // function onError(e, vari, setter) {
  //   const value = e.target.value === "null" ? null : e.target.value;
  //   setter(value);
  //   if (value) {
  //     setErrors((prev) => ({ ...prev, vari: false }));
  //   }
  // }

  const user = JSON.parse(localStorage.getItem("user"));

  const [successful, setSuccessful] = useState();

  const googleMapsURL = warehouse
    ? `https://www.google.com/maps?q=${warehouse.warehouse?.latitude},${warehouse.warehouse?.longitude}`
    : "";

  const [editclick, setEditclick] = useState();

  const onEditClick = () => setEditclick(!editclick);

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

    // if (!validateFields()) {
    //   setError("Please fill all fields");
    //   setIsModalOpen(true);
    //   return;
    // }

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
          stateName,
          country,
          pincode,
          latitude: location.lat,
          longitude: location.lng,
          managerId,
          openingStock: openingStock.filter(
            (s) => s.productId && s.stockQuantity
          ),
        };

        const res = await axiosAPI.put(
          `/warehouses/update/${warehouseId}`,
          payload
        );

        setSuccessful(res.data.message);
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

  return (
    <>
      <p className="path">
        <span onClick={() => navigate("/warehouses")}>Warehouses</span>{" "}
        <i class="bi bi-chevron-right"></i> {warehouseId}
      </p>

      {warehouse && (
        <>
          <div className="row m-0 p-0">
            <h5 className={styles.head}>Warehouse Details</h5>
            <div className={`col-5 ${styles.longform}`}>
              <label>Warehouse Name :</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                readOnly={!editclick}
              />
            </div>
            <div className={`col-5 ${styles.longform}`}>
              <label>Warehouse Type :</label>
              <input
                type="text"
                value={type}
                onChange={(e) => setType(e.target.value)}
                readOnly={!editclick}
              />
            </div>
            <div className={`col-5 ${styles.longform}`}>
              <label>Plot :</label>
              <input
                type="text"
                value={plot}
                onChange={(e) => setPlot(e.target.value)}
                readOnly={!editclick}
              />
            </div>
            <div className={`col-5 ${styles.longform}`}>
              <label>Street :</label>
              <input
                type="text"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                readOnly={!editclick}
              />
            </div>
            <div className={`col-5 ${styles.longform}`}>
              <label>Area :</label>
              <input
                type="text"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                readOnly={!editclick}
              />
            </div>
            <div className={`col-5 ${styles.longform}`}>
              <label>City :</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                readOnly={!editclick}
              />
            </div>
            <div className={`col-5 ${styles.longform}`}>
              <label>District :</label>
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                readOnly={!editclick}
              />
            </div>
            <div className={`col-5 ${styles.longform}`}>
              <label>State :</label>
              <input
                type="text"
                value={stateName}
                onChange={(e) => setStateName(e.target.value)}
                readOnly={!editclick}
              />
            </div>

            <div className={`col-5 ${styles.longform}`}>
              <label>country :</label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                readOnly={!editclick}
              />
            </div>

            <div className={`col-5 ${styles.longform}`}>
              <label>Pincode :</label>
              <input
                type="text"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                readOnly={!editclick}
              />
            </div>

            <div className={`col-5 ${styles.longform}`}>
              <label>Manager :</label>
              <select
                name=""
                id=""
                value={managerId}
                onChange={(e) => setManagerId(e.target.value)}
                readOnly={!editclick}
              >
                <option value="null">--select--</option>
                {managers &&
                  managers.map((manager) => (
                    <option value={manager.id}>{manager.name}</option>
                  ))}
              </select>
            </div>

            <div
              className={`col-4 d-flex align-items-center ${styles.location}`}
            >
              <label className="">Location:</label>
              {!showMap ? (
                <button className={styles.locate} onClick={() => setShowMap(true)} >Locate</button>
              ) : <MapViewModal
                  setLocation={setLocation}
                  defaultLocation={defaultLocation}
                  setDefaultLocation={setDefaultLocation}
                  onClose={() => setShowMap(false)} // Optional close handler
                /> }
            </div>
          </div>

          <div className="row justify-content-center m-0 p-3">
            <div className="col-10">
              <h5>Opening Stock</h5>
              <table className={`table table-bordered borderedtable`}>
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
                            readOnly={!editclick}
                            onChange={(e) => {
                              const selectedId = e.target.value;
                              const selectedProduct = products.find(
                                (p) => p.id == selectedId
                              );
                              handleStockChange(index, "productId", selectedId);
                              if (selectedProduct) {
                                handleStockChange(
                                  index,
                                  "primaryUnit",
                                  selectedProduct.productType === "packed"
                                    ? "packets"
                                    : selectedProduct.unit
                                );
                                handleStockChange(
                                  index,
                                  "productType",
                                  selectedProduct.productType || "loose"
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
                            readOnly={!editclick}
                            onChange={(e) =>
                              handleStockChange(
                                index,
                                "stockQuantity",
                                e.target.value
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
                            style={{ backgroundColor: "#fd3b3b" }}
                            disabled={!editclick}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {editclick && (
                <button
                  className="btn btn-sm btn-primary"
                  onClick={addStockRow}
                >
                  Add Stock
                </button>
              )}
            </div>
          </div>

          {!successful && !loading && !editclick && (
            <div className="row m-0 p-3 justify-content-center">
              <div className="col-5">
                <button className="submitbtn" onClick={onEditClick}>
                  Edit
                </button>
                <button
                  className="cancelbtn"
                  onClick={() => navigate("/warehouse")}
                >
                  Close
                </button>
              </div>
            </div>
          )}
          {!successful && !loading && editclick && (
            <div className="row m-0 p-3 justify-content-center">
              <div className="col-5">
                <button className="submitbtn" onClick={onSubmitClick}>
                  Update
                </button>
                <button className="cancelbtn" onClick={onEditClick}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {successful && (
            <div className="row m-0 p-3 justify-content-center">
              <div className="col-5">
                <button
                  className="submitbtn"
                  onClick={() => navigate("/warehouse")}
                >
                  {successful}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {isModalOpen && (
        <ErrorModal isOpen={isModalOpen} message={error} onClose={closeModal} />
      )}

      {loading && <Loading />}
    </>
  );
}

export default WarehouseDetails;
