import React, { useEffect, useState } from "react";
import styles from "./Customer.module.css";
import { DialogActionTrigger } from "@/components/ui/dialog";

import Loading from "@/components/Loading";
import ErrorModal from "@/components/ErrorModal";
import { useAuth } from "@/Auth";
import ImagesViewModal from "./ImagesViewModal";
import { FaMapMarkerAlt } from "react-icons/fa";
import axios from "axios";
import PhotosDrawer from "./PhotosDrawer";

function KYCModal({ customerId, setCustomerId, isAdmin }) {
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

  const [trigger, setTrigger] = useState(false);

  useEffect(() => {
    async function fetch() {
      try {
        setLoading(true);
        const res = await axiosAPI.get(`/customers/${customerId}`);
        console.log(res);
        setCustomerdata(res.data.customer);
      } catch (e) {
        // console.log(e);
        setError(e.response.data.message);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [trigger]);

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
  const [seId, setSeId] = useState();

  useEffect(() => {
    setName(customerdata?.name);
    setMobile(customerdata?.mobile);
    setWhatsapp(customerdata?.whatsapp);
    setEmail(customerdata?.email);
    setAddress(customerdata?.address);
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
    if (!address) newErrors.address = true;
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
    formdata.append("address", address);

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
                // onChange={(e) => setEmail(e.target.value)}
                // readOnly={!editclick}
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
              <label>WhatsApp :</label>
              <input
                type="text"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
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
              <label>Mobile :</label>
              <input
                type="text"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                readOnly={!editclick}
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
            <div className={`col-10 ${styles.textform}`}>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                readOnly={!editclick}
              />
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
                title={"Aadhaar "}
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
                title={"PAN"}
                front={customerdata.kycDocuments?.[1]?.frontImage}
                back={customerdata.kycDocuments?.[1]?.backImage}
              />
            </div>
            <div className={`col-4`}>
              <h5 className={styles.headmdl}>Customer Photo</h5>
              {/* <ImagesViewModal title={"Photo"} front={customerdata.photo} /> */}
              <PhotosDrawer title={"Photo"} front={customerdata.photo} />
            </div>
          </div>

          {!loading && !successful && (
            <div className="row m-0 p-3 pt-4 justify-content-center">
              {!editclick && (
                <div className={`col-5`}>
                  <button className="submitbtn" onClick={onApproveClick}>
                    Approve
                  </button>
                  <button className="cancelbtn" onClick={onDeclineClick}>
                    Decline
                  </button>
                  {isAdmin && (
                    <button
                      className={`cancelbtn ${styles.editbtn}`}
                      onClick={() => setEditclick(true)}
                    >
                      Edit
                    </button>
                  )}
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

export default KYCModal;
