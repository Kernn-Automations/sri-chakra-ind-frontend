import React, { useEffect, useState } from "react";
import styles from "./Customer.module.css";
import {
  DialogActionTrigger,
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogRoot,
  DialogTrigger,
} from "@/components/ui/dialog";
import img from "./../../../images/dummy-img.jpeg";
import { useAuth } from "@/Auth";
import { FaMapMarkerAlt } from "react-icons/fa";
import ErrorModal from "@/components/ErrorModal";
import Loading from "@/components/Loading";
import ImagesViewModal from "./ImagesViewModal";
import axios from "axios";
import PhotosDrawer from "./PhotosDrawer";

function CustomersModal({ customerId, setCustomerId, isAdmin }) {
  const { axiosAPI } = useAuth();

  const [error, setError] = useState();
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const closeModal = () => setIsModalOpen(false);

  const [successful, setSuccessful] = useState();

  const [showGstinMsmeModal, setShowGstinMsmeModal] = useState(false);
  const [requireGstin, setRequireGstin] = useState(false);
  const [requireMsme, setRequireMsme] = useState(false);
  const [gstin, setGstin] = useState("");
  const [msme, setMsme] = useState("");

  const [customerdata, setCustomerdata] = useState();
  const [products, setProducts] = useState([]);
  const [billToBillDiscounts, setBillToBillDiscounts] = useState([]);
  const [monthlyDiscounts, setMonthlyDiscounts] = useState([]);

  const [trigger, setTrigger] = useState(false);

  useEffect(() => {
    async function fetch() {
      try {
        setLoading(true);
        const currentDivisionId = localStorage.getItem('currentDivisionId');

        // Build both endpoint variants with division context
        const buildUrl = (base) => {
          let u = `${base}/${customerId}`;
          if (currentDivisionId && currentDivisionId !== '1') {
            u += `?divisionId=${currentDivisionId}`;
          } else if (currentDivisionId === '1') {
            u += `?showAllDivisions=true`;
          }
          return u;
        };

        const customersUrl = buildUrl('/customers');
        const customerUrl = buildUrl('/customer');

        let res;
        try {
          // Try plural endpoint first (observed in backend)
          res = await axiosAPI.get(customersUrl);
        } catch (err) {
          if (err?.response?.status === 404) {
            // Fallback to singular endpoint
            res = await axiosAPI.get(customerUrl);
          } else {
            throw err;
          }
        }

        const data = res.data || {};
        const customer = data.customer || data?.data?.customer || data;
        const pad = data.productsAndDiscounting || data?.data?.productsAndDiscounting || {};
        setCustomerdata(customer);
        setProducts(pad?.products || []);
        setBillToBillDiscounts(pad?.billToBillDiscounts || pad?.bill_to_bill_discounts || []);
        setMonthlyDiscounts(pad?.monthlyDiscounts || pad?.monthly_discounts || []);
      } catch (e) {
        setError(e.response?.data?.message || 'Failed to load customer');
        setIsModalOpen(true);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [trigger, customerId]);

  // Update a single product custom price
  const saveProductPrice = async (productId, customPrice) => {
    try {
      setLoading(true);
      await axiosAPI.put(`/customer/product-pricing`, {
        customerId,
        productId,
        customPrice: customPrice === '' || customPrice == null ? null : Number(customPrice),
      });
      // Optimistically update UI
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, customPrice } : p));
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to update product price');
      setIsModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  // Edit existing bill-to-bill discount
  const saveBillToBillDiscount = async (discount) => {
    try {
      setLoading(true);
      await axiosAPI.put(`/bill-to-bill-discount`, {
        discountId: discount.id,
        minQuantity: Number(discount.minQuantity ?? discount.min_quantity ?? 0),
        discountAmount: Number(discount.discountAmount ?? discount.discount_amount ?? 0),
      });
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to update bill-to-bill discount');
      setIsModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  // Edit existing monthly discount
  const saveMonthlyDiscount = async (discount) => {
    try {
      setLoading(true);
      await axiosAPI.put(`/monthly-discount`, {
        discountId: discount.id,
        minTurnover: Number(discount.minTurnover ?? discount.min_turnover ?? 0),
        discountAmount: Number(discount.discountAmount ?? discount.discount_amount ?? 0),
      });
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to update monthly discount');
      setIsModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  // Add new discounts
  const addBillToBillDiscount = async () => {
    try {
      setLoading(true);
      const res = await axiosAPI.post(`/bill-to-bill-discount`, {
        customerId,
        minQuantity: 0,
        discountAmount: 0,
      });
      const created = res.data?.discount || res.data;
      setBillToBillDiscounts(prev => [...prev, created]);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to add bill-to-bill discount');
      setIsModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const addMonthlyDiscount = async () => {
    try {
      setLoading(true);
      const res = await axiosAPI.post(`/monthly-discount`, {
        customerId,
        minTurnover: 0,
        discountAmount: 0,
      });
      const created = res.data?.discount || res.data;
      setMonthlyDiscounts(prev => [...prev, created]);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to add monthly discount');
      setIsModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const onApproveClick = async () => {
    try {
      setLoading(true);
      const res = await axiosAPI.put(
        `/customers/${customerdata.id}/kyc/approve`
      );
      setSuccessful(res.data.message);

      // 🔍 Fetch updated customer info
      const customerRes = await axiosAPI.get(`/customers/${customerdata.id}`);
      const customer = customerRes.data;

      // 🧾 Check for missing GSTIN or MSME
      const hasGstin = !!customer.gstin;
      const hasMsme = !!customer.msmeNumber;

      // Set flags only for missing fields
      setRequireGstin(!hasGstin);
      setRequireMsme(!hasMsme);

      // Open modal only if one of them is missing
      if (!hasGstin || !hasMsme) {
        setShowGstinMsmeModal(true);
      } else {
        // changeTrigger();
      }
    } catch (e) {
      setError(e.response?.data?.message || "Approval failed");
      setIsModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [rejectionRemark, setRejectionRemark] = useState("");

  const onDeclineClick = () => {
    setShowRejectionModal(true);
  };

  const submitRejection = async () => {
    try {
      if (!rejectionRemark.trim()) {
        setError("Please enter a rejection remark.");
        setIsModalOpen(true);
        return;
      }
      setLoading(true);
      const res = await axiosAPI.put(
        `/customers/${customerdata.id}/kyc/reject`,
        {
          remark: rejectionRemark,
        }
      );
      setSuccessful(res.data.message);
      // changeTrigger();
    } catch (e) {
      setError(e.response?.data?.message || "Rejection failed");
      setIsModalOpen(true);
    } finally {
      setLoading(false);
      setShowRejectionModal(false);
      setRejectionRemark("");
    }
  };

  // cusomer update
  const today = new Date(Date.now()).toISOString().slice(0, 10);
  const nowIST = new Date().toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  });

  const [name, setName] = useState();
  const [mobile, setMobile] = useState();
  const [whatsapp, setWhatsapp] = useState();
  const [email, setEmail] = useState();
  const [address, setAddress] = useState();
  const [latitude, setLatitude] = useState();
  const [longitude, setLongitude] = useState();
  const [aadharNumber, setAadharNumber] = useState();
  const [panNumber, setPanNumber] = useState();
  const [firmName, setFirmName] = useState();
  const [plot, setPlot] = useState();
  const [street, setStreet] = useState();
  const [area, setArea] = useState();
  const [city, setCity] = useState();
  const [mandal, setMandal] = useState();
  const [district, setDistrict] = useState();
  const [stateName, setStateName] = useState(); // "state" is a reserved word
  const [pincode, setPincode] = useState();
  const [seId, setSeId] = useState();

  useEffect(() => {
    setName(customerdata?.name);
    setMobile(customerdata?.mobile);
    setWhatsapp(customerdata?.whatsapp);
    setEmail(customerdata?.email);
    setPlot(customerdata?.plot);
    setStreet(customerdata?.street);
    setArea(customerdata?.area);
    setCity(customerdata?.city);
    setMandal(customerdata?.mandal);
    setDistrict(customerdata?.district);
    setStateName(customerdata?.state);
    setPincode(customerdata?.pincode);
    setAadharNumber(customerdata?.aadhaarNumber);
    setPanNumber(customerdata?.panNumber);
    setFirmName(customerdata?.firmName);
    setGstin(customerdata?.gstin);
    setMsme(customerdata?.msmeNumber);
    setSeId(customerdata?.salesExecutive?.id);
  }, [customerdata]);

  const [errors, setErrors] = useState({});

  const validateFields = () => {
    const newErrors = {};
    if (!name) newErrors.name = true;
    if (!mobile) newErrors.mobile = true;
    if (!whatsapp) newErrors.whatsapp = true;
    if (!email) newErrors.email = true;
    if (!latitude) newErrors.latitude = true;
    if (!longitude) newErrors.longitude = true;
    if (!aadharNumber) newErrors.aadharNumber = true;
    if (!panNumber) newErrors.panNumber = true;
    // if (!aadharNumber) newErrors.aadharNumber = true;
    // if (!aadharNumber) newErrors.aadharNumber = true;

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

  const user = JSON.parse(localStorage.getItem("user"));

  const googleMapsURL = customerdata
    ? `https://www.google.com/maps?q=${customerdata.latitude},${customerdata.longitude}`
    : "";

  const [editclick, setEditclick] = useState();

  const [ses, setSes] = useState();
  useEffect(() => {
    async function fetch() {
      try {
        setLoading(true);
        const res = await axiosAPI.get("/employees/role/Business Officer");
        // console.log(res);
        setSes(res.data.employees);
      } catch (e) {
        // console.log(e);
        setError(e.response.data.message);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, []);

  const VITE_API = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem("accessToken");

  // update
  const onUpdate = async () => {
    const formdata = new FormData();
    formdata.append("name", name);
    formdata.append("mobile", mobile);
    formdata.append("whatsapp", whatsapp);
    formdata.append("email", email);
    formdata.append("aadhaarNumber", aadharNumber);
    formdata.append("panNumber", panNumber);
    formdata.append("gstin", gstin);
    formdata.append("msme", msme);
    formdata.append("salesExecutiveId", seId);
    formdata.append("firmName", firmName);
    formdata.append("plot", plot);
    formdata.append("street", street);
    formdata.append("area", area);
    formdata.append("city", city);
    formdata.append("mandal", mandal);
    formdata.append("district", district);
    formdata.append("state", stateName);
    formdata.append("pincode", pincode);

    try {
      setLoading(true);
      const res = await axios.put(
        `${VITE_API}/customers/${customerId}`,
        formdata,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      console.log(res);
      setSuccessful(res.data.message);
    } catch (e) {
      console.log(e);
      setError(e.response.data.message);
      setIsModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {customerdata && (
        <>
          {/* <h3 className={`px-3 mdl-title`}>KYC Approval</h3> */}

          <div className="row m-0 p-0">
            <h5 className={styles.head}>Customer Details</h5>
            <div className={`col-5 ${styles.longform}`}>
              <label>Customer Name :</label>
              <input
                type="text"
                value={name}
                style={{
                  width: `${
                    (customerdata.name?.length > 15
                      ? customerdata.name?.length
                      : 15) + 1
                  }ch`,
                  padding: "0.3rem 0.5rem",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                }}
                readOnly={!editclick}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className={`col-5 ${styles.longform}`}>
              <label>Email :</label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: `${
                    (customerdata.email?.length > 15
                      ? customerdata.email?.length
                      : 15) + 1
                  }ch`,
                  padding: "0.3rem 0.5rem",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                }}
                readOnly={!editclick}
              />
            </div>
            <div className={`col-4 ${styles.longform}`}>
              <label>Customer ID :</label>
              <input
                type="text"
                value={customerdata.customer_id || "-"}
                onChange={(e) => setEmail(e.target.value)}
                readOnly={!editclick}
              />
            </div>
            <div className={`col-4 ${styles.longform}`}>
              <label>Mobile :</label>
              <input
                type="text"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                readOnly={!editclick}
              />
            </div>
            <div className={`col-4 ${styles.longform}`}>
              <label>WhatsApp :</label>
              <input
                type="text"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                readOnly={!editclick}
              />
            </div>

            <div className={`col-4 ${styles.longform}`}>
              <label>Aadhaar Number :</label>
              <input
                type="text"
                value={aadharNumber}
                maxlength="12"
                pattern="\d{12}"
                inputmode="numeric"
                readOnly={!editclick}
                onChange={(e) => setAadharNumber(e.target.value)}
                required
              />
            </div>
            <div className={`col-4 ${styles.longform}`}>
              <label>PAN Number :</label>
              <input
                type="text"
                value={panNumber}
                readOnly={!editclick}
                onChange={(e) => setPanNumber(e.target.value)}
              />
            </div>
            <div className={`col-4 ${styles.longform}`}>
              <label>KYC Status :</label>
              <input
                type="text"
                value={customerdata.kycStatus || "-"}
                readOnly={!editclick}
              />
            </div>

            <div className={`col-4 ${styles.longform}`}>
              <label>GSTIN :</label>
              <input
                type="text"
                value={gstin}
                onChange={(e) => setGstin(e.target.value)}
              />
            </div>

            <div className={`col-4 ${styles.longform}`}>
              <label>MSME Number :</label>
              <input
                type="text"
                value={msme}
                onChange={(e) => setMsme(e.target.value)}
                readOnly={!editclick}
              />
            </div>

            <div className={`col-4 ${styles.longform}`}>
              <label>Firm Name :</label>
              <input
                type="text"
                value={firmName}
                onChange={(e) => setFirmName(e.target.value)}
                readOnly={!editclick}
              />
            </div>

            {customerdata.rejectionRemark && (
              <div className={`col-8 ${styles.longform}`}>
                <label>Rejection Remark :</label>
                <textarea
                  value={customerdata.rejectionRemark}
                  readOnly={!editclick}
                />
              </div>
            )}
            {!editclick && (
              <>
                <div className={`col-4 ${styles.longform}`}>
                  <label>SE ID :</label>
                  <input
                    type="text"
                    value={customerdata.salesExecutive?.id || "NA"}
                    readOnly={!editclick}
                  />
                </div>
                <div className={`col-4 ${styles.longform}`}>
                  <label>SE Name :</label>
                  <input
                    type="text"
                    value={customerdata.salesExecutive?.name || "NA"}
                    readOnly={!editclick}
                  />
                </div>
              </>
            )}
            {editclick && (
              <div className={`col-4 ${styles.longform}`}>
                <label>SE :</label>
                <select value={seId} onChange={(e) => setSeId(e.target.value)}>
                  <option value="null">--select--</option>
                  {ses?.map((se) => (
                    <option value={se.id}>{se.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div className={`col-4 ${styles.location}`}>
              <label htmlFor="">Location :</label>
              <a
                href={googleMapsURL}
                target="_blank"
                rel="noreferrer"
                className={styles.mapLink}
              >
                <FaMapMarkerAlt /> View on Map
              </a>
            </div>
          </div>

          <div className="row m-0 p-0">
            <h5 className={styles.headmdl}>Address</h5>
            {[
              { label: "Plot", value: plot, set: setPlot },
              { label: "Street", value: street, set: setStreet },
              { label: "Area", value: area, set: setArea },
              { label: "City", value: city, set: setCity },
              { label: "Mandal", value: mandal, set: setMandal },
              { label: "District", value: district, set: setDistrict },
              { label: "State", value: stateName, set: setStateName },
              { label: "Pincode", value: pincode, set: setPincode },
            ].map(({ label, value, set }) => (
              <div key={label} className={`col-4 ${styles.longform}`}>
                <label>{label} :</label>
                <input
                  type="text"
                  value={value || ""}
                  onChange={(e) => set(e.target.value)}
                  readOnly={!editclick}
                />
              </div>
            ))}
          </div>

          {/* Products & Discounting */}
          <div className="row m-0 p-0 mt-3">
            <h5 className={styles.headmdl}>Products & Discounting</h5>
            <div className="col-12">
              <div className="table-responsive">
                <table className="table table-bordered borderedtable">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Base Price</th>
                      <th>Custom Price</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.length === 0 && (
                      <tr>
                        <td colSpan="4" className="text-center">No products</td>
                      </tr>
                    )}
                    {products.map((p) => (
                      <tr key={p.id}>
                        <td>{p.name}</td>
                        <td>{p.basePrice ?? p.base_price ?? '-'}</td>
                        <td>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="Enter price"
                            className="text-center"
                            value={p.customPrice ?? ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setProducts(prev => prev.map(x => x.id === p.id ? { ...x, customPrice: val } : x));
                            }}
                          />
                        </td>
                        <td>
                          <button className="btn btn-sm btn-primary" onClick={() => saveProductPrice(p.id, p.customPrice)}>Save</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="row m-0 p-0 mt-3">
            <div className="col-6">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h6 className="mb-0">Bill-to-Bill Discounts</h6>
                <button className="btn btn-sm btn-outline-primary" onClick={addBillToBillDiscount}>Add</button>
              </div>
              <div className="table-responsive">
                <table className="table table-sm table-bordered borderedtable">
                  <thead>
                    <tr>
                      <th>Min Qty</th>
                      <th>Amount</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {(billToBillDiscounts || []).map((d) => (
                      <tr key={d.id}>
                        <td>
                          <input type="number" value={d.minQuantity ?? d.min_quantity ?? 0}
                            onChange={(e) => {
                              const val = e.target.value;
                              setBillToBillDiscounts(prev => prev.map(x => x.id === d.id ? { ...x, minQuantity: val } : x));
                            }} />
                        </td>
                        <td>
                          <input type="number" step="0.01" value={d.discountAmount ?? d.discount_amount ?? 0}
                            onChange={(e) => {
                              const val = e.target.value;
                              setBillToBillDiscounts(prev => prev.map(x => x.id === d.id ? { ...x, discountAmount: val } : x));
                            }} />
                        </td>
                        <td>
                          <button className="btn btn-sm btn-primary" onClick={() => saveBillToBillDiscount(d)}>Save</button>
                        </td>
                      </tr>
                    ))}
                    {billToBillDiscounts.length === 0 && (
                      <tr><td colSpan="3" className="text-center">No discounts</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="col-6">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h6 className="mb-0">Monthly Discounts</h6>
                <button className="btn btn-sm btn-outline-primary" onClick={addMonthlyDiscount}>Add</button>
              </div>
              <div className="table-responsive">
                <table className="table table-sm table-bordered borderedtable">
                  <thead>
                    <tr>
                      <th>Min Turnover</th>
                      <th>Amount</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {(monthlyDiscounts || []).map((d) => (
                      <tr key={d.id}>
                        <td>
                          <input type="number" value={d.minTurnover ?? d.min_turnover ?? 0}
                            onChange={(e) => {
                              const val = e.target.value;
                              setMonthlyDiscounts(prev => prev.map(x => x.id === d.id ? { ...x, minTurnover: val } : x));
                            }} />
                        </td>
                        <td>
                          <input type="number" step="0.01" value={d.discountAmount ?? d.discount_amount ?? 0}
                            onChange={(e) => {
                              const val = e.target.value;
                              setMonthlyDiscounts(prev => prev.map(x => x.id === d.id ? { ...x, discountAmount: val } : x));
                            }} />
                        </td>
                        <td>
                          <button className="btn btn-sm btn-primary" onClick={() => saveMonthlyDiscount(d)}>Save</button>
                        </td>
                      </tr>
                    ))}
                    {monthlyDiscounts.length === 0 && (
                      <tr><td colSpan="3" className="text-center">No discounts</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="row m-0 p-0 justify-content-center">
            <div className={`col-4`}>
              <h5 className={styles.headmdl}>Aadhaar Proof</h5>
              {/* <ImagesViewModal
                title={"Aadhar"}
                front={customerdata.kycDocuments?.[0]?.frontImage}
                back={customerdata.kycDocuments?.[0]?.backImage}
              /> */}
              <PhotosDrawer
                title={"Aadhaar Details"}
                front={customerdata.kycDocuments?.[0]?.frontImage}
                back={customerdata.kycDocuments?.[0]?.backImage}
              />
            </div>
            <div className={`col-4`}>
              <h5 className={styles.headmdl}>PAN Card Proof</h5>
              {/* <ImagesViewModal
                title={"PAN"}
                front={customerdata.kycDocuments?.[1]?.frontImage}
                back={customerdata.kycDocuments?.[1]?.backImage}
              /> */}
              <PhotosDrawer
                title={"PAN Details"}
                front={customerdata.kycDocuments?.[1]?.frontImage}
                back={customerdata.kycDocuments?.[1]?.backImage}
              />
            </div>
            <div className={`col-4`}>
              <h5 className={styles.headmdl}>Customer Photo</h5>
              {/* <ImagesViewModal title={"Photo"} front={customerdata.photo} /> */}
              <PhotosDrawer
                title={"Customer Photo"}
                front={customerdata.photo}
              />
            </div>
          </div>

          {!loading && !successful && (
            <div className="row m-0 p-3 pt-4 justify-content-center">
              {!editclick && (
                <div className={`col-5`}>
                  {isAdmin && (
                    <button
                      className="submitbtn"
                      onClick={() => setEditclick(true)}
                    >
                      Edit
                    </button>
                  )}
                  <button
                    className="cancelbtn"
                    onClick={() => setCustomerId(null)}
                  >
                    cancel
                  </button>
                </div>
              )}
              {editclick && (
                <div className={`col-4`}>
                  <button className="submitbtn" onClick={onUpdate}>
                    Update
                  </button>
                  <button
                    className="cancelbtn"
                    onClick={() => setEditclick(false)}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}

          {successful && (
            <div className="row m-0 p-3 pt-4 justify-content-center">
              <div className={`col-4`}>
                <button
                  className="submitbtn"
                  onClick={() => setCustomerId(null)}
                >
                  {successful}
                </button>
              </div>
            </div>
          )}

          {showRejectionModal && (
            <div
              className="modal d-block"
              tabIndex="-1"
              style={{ background: "rgba(0,0,0,0.5)" }}
            >
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content p-3">
                  <h5>Enter Rejection Remark</h5>
                  <textarea
                    className="form-control mb-3"
                    placeholder="Write rejection reason..."
                    value={rejectionRemark}
                    onChange={(e) => setRejectionRemark(e.target.value)}
                  />
                  <div className="d-flex justify-content-end gap-2">
                    <button
                      className="btn btn-secondary"
                      onClick={() => setShowRejectionModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={submitRejection}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          {showGstinMsmeModal && (
            <div
              className="modal d-block"
              tabIndex="-1"
              style={{ background: "rgba(0,0,0,0.5)" }}
            >
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content p-3">
                  <h5>Additional Details</h5>

                  {!customerdata.gstin && (
                    <>
                      <div className="form-check my-2">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={requireGstin}
                          onChange={() => setRequireGstin(!requireGstin)}
                          id="gstinCheck"
                        />
                        <label
                          className="form-check-label"
                          htmlFor="gstinCheck"
                        >
                          Add GSTIN
                        </label>
                      </div>
                      {requireGstin && (
                        <input
                          type="text"
                          className="form-control mb-3"
                          placeholder="Enter GSTIN"
                          value={gstin}
                          onChange={(e) => setGstin(e.target.value)}
                        />
                      )}
                    </>
                  )}

                  {!customerdata.msme && (
                    <>
                      <div className="form-check my-2">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={requireMsme}
                          onChange={() => setRequireMsme(!requireMsme)}
                          id="msmeCheck"
                        />
                        <label className="form-check-label" htmlFor="msmeCheck">
                          Add MSME Number
                        </label>
                      </div>
                      {requireMsme && (
                        <input
                          type="text"
                          className="form-control mb-3"
                          placeholder="Enter MSME Number"
                          value={msme}
                          onChange={(e) => setMsme(e.target.value)}
                        />
                      )}
                    </>
                  )}

                  <div className="d-flex justify-content-end gap-2">
                    <button
                      className="btn btn-secondary"
                      onClick={() => setShowGstinMsmeModal(false)}
                    >
                      Skip
                    </button>
                    <button
                      className="btn btn-primary"
                      onClick={async () => {
                        try {
                          setLoading(true);
                          const payload = {};
                          if (requireGstin) payload.gstin = gstin;
                          if (requireMsme) payload.msmeNumber = msme;
                          if (Object.keys(payload).length > 0) {
                            await axiosAPI.put(
                              `/customers/${customerdata.id}/details`,
                              payload
                            );
                          }
                          changeTrigger();
                        } catch (e) {
                          setError(
                            e.response?.data?.message ||
                              "Failed to update details"
                          );
                          setIsModalOpen(true);
                        } finally {
                          setLoading(false);
                          setShowGstinMsmeModal(false);
                        }
                      }}
                    >
                      Save
                    </button>
                  </div>
                </div>
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

export default CustomersModal;
