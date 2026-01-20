import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../Auth";
import { useDivision } from "../../context/DivisionContext";
import Loading from "@/components/Loading";
import ErrorModal from "@/components/ErrorModal";
import styles from "./StoresAbstract.module.css";
import { handleExportPDF, handleExportExcel } from "@/utils/PDFndXLSGenerator";

const StoresAbstract = () => {
  const navigate = useNavigate();
  const { axiosAPI } = useAuth();
  const { selectedDivision, showAllDivisions } = useDivision();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [storesData, setStoresData] = useState([]);
  const [selectedAgreementImage, setSelectedAgreementImage] = useState(null);
  const [showAgreementModal, setShowAgreementModal] = useState(false);

  useEffect(() => {
    fetchStoresAbstract();
  }, [selectedDivision, showAllDivisions]);

  const exportColumns = [
    "S.No",
    "Store Name",
    "Store Code",
    "Type",
    "Division",
    "Zone",
    "Address",
    "Land Owner",
    "Agreement Period",
    "Start Date",
    "End Date",
    "Monthly Rent",
    "Power Bill No",
    "Distributor",
    "Aadhar",
    "PAN",
    "Mobile",
    "Beneficiary",
    "IFSC",
    "Account No",
    "Bank Name",
  ];

  const fetchStoresAbstract = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {};

      // Division filter is handled by backend based on user role
      // For Division Head, backend automatically applies division filter
      // For Admin/Super Admin, we can optionally pass divisionId
      if (selectedDivision && !showAllDivisions) {
        params.divisionId = selectedDivision.id;
      }

      // Fetch stores abstract from new endpoint
      const response = await axiosAPI.get("/stores/abstract", params);
      const responseData = response.data || response;

      let storesList = [];
      if (responseData.success !== undefined) {
        if (responseData.success) {
          storesList = responseData.data || [];
        } else {
          throw new Error(
            responseData.message || "Failed to fetch stores abstract",
          );
        }
      } else if (Array.isArray(responseData)) {
        storesList = responseData;
      } else if (responseData.data) {
        storesList = Array.isArray(responseData.data) ? responseData.data : [];
      }

      console.log("Stores abstract data received:", storesList);
      if (storesList.length > 0) {
        console.log("First store sample:", storesList[0]);
        console.log(
          "First store rentAgreementDocument:",
          storesList[0].rentAgreementDocument,
        );
      }
      setStoresData(storesList);
    } catch (err) {
      console.error("Error fetching stores abstract:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to fetch stores abstract";
      setError(errorMessage);
      setIsErrorModalOpen(true);
      setStoresData([]);
    } finally {
      setLoading(false);
    }
  };

  const closeErrorModal = () => {
    setIsErrorModalOpen(false);
    setError(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-GB");
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return "-";
    return `₹${Number(amount).toLocaleString("en-IN")}`;
  };

  const handleViewAgreement = (agreementImage) => {
    if (agreementImage) {
      let imageSrc;

      // Check if it's already a data URL
      if (agreementImage.startsWith("data:")) {
        imageSrc = agreementImage;
      }
      // Check if it's a URL (http/https)
      else if (
        agreementImage.startsWith("http://") ||
        agreementImage.startsWith("https://")
      ) {
        imageSrc = agreementImage;
      }
      // Otherwise, assume it's a base64 string
      else {
        imageSrc = `data:image/jpeg;base64,${agreementImage}`;
      }

      setSelectedAgreementImage(imageSrc);
      setShowAgreementModal(true);
    }
  };

  const closeAgreementModal = () => {
    setShowAgreementModal(false);
    setSelectedAgreementImage(null);
  };

  if (loading && storesData.length === 0) {
    return <Loading />;
  }

  const getExportData = () =>
    storesData.map((store, index) => {
      const agreement = store.agreementDetails || {};
      const power = store.powerBillDetails || {};
      const owner = store.ownerDetails || {};

      return [
        index + 1, // S.No
        store.storeName || "-",
        store.storeCode || "-",
        store.type || "-",
        store.division || "-",
        store.zone || "-",
        store.address || "-",
        agreement.landOwner || "-",
        agreement.agreementPeriod || "-",
        agreement.startDate ? formatDate(agreement.startDate) : "-",
        agreement.endDate ? formatDate(agreement.endDate) : "-",
        agreement.monthlyRent || "",
        power.billNumber || "-",
        power.distributor || "-",
        owner.aadhar || "-",
        owner.panCard || "-",
        owner.mobile || "-",
        owner.beneficiary || "-",
        owner.ifsc || "-",
        owner.accountNo || "-",
        owner.bankName || "-",
      ];
    });

  const handlePDFExport = async () => {
    await handleExportPDF(
      exportColumns,
      getExportData(),
      "Stores Abstract Report",
    );
  };

  const handleExcelExport = () => {
    handleExportExcel(exportColumns, getExportData(), "Stores Abstract Report");
  };

  return (
    <div className={styles.container}>
      <p className="path">
        <span onClick={() => navigate("/divisions?tab=stores")}>Stores</span>{" "}
        <i className="bi bi-chevron-right"></i> Stores Abstract
      </p>
      <div className={styles.header}>
        <h1>Stores Abstract</h1>
        <button
          className="homebtn"
          onClick={() => navigate("/divisions?tab=stores")}
        >
          Back to Stores
        </button>
        <div className={styles.actionButtons}>
          <button className={styles.excelBtn} onClick={handleExcelExport}>
            <i className="bi bi-file-earmark-excel"></i> Excel
          </button>

          <button className={styles.pdfBtn} onClick={handlePDFExport}>
            <i className="bi bi-file-earmark-pdf"></i> PDF
          </button>
        </div>
      </div>

      {error && !isErrorModalOpen && (
        <div className={styles.errorBanner}>
          <p>{error}</p>
          <button onClick={fetchStoresAbstract}>Retry</button>
        </div>
      )}

      <div className={styles.tableContainer}>
        <div className={styles.tableWrapper}>
          <table
            className={`table table-bordered borderedtable ${styles.abstractTable}`}
          >
            <thead>
              <tr>
                <th>S.No</th>
                <th rowSpan="2" className={styles.storeColumn}>
                  Store Name
                </th>
                <th rowSpan="2" className={styles.codeColumn}>
                  Store Code
                </th>
                <th rowSpan="2" className={styles.typeColumn}>
                  Type
                </th>
                <th rowSpan="3" className={styles.divisionColumn}>
                  Division
                </th>
                <th rowSpan="4" className={styles.zoneColumn}>
                  Zone
                </th>

                <th rowSpan="2" className={styles.addressColumn}>
                  Address
                </th>
                <th colSpan="6" className={styles.sectionHeader}>
                  Agreement Details
                </th>
                <th colSpan="2" className={styles.sectionHeader}>
                  Power Bill Details
                </th>
                <th colSpan="7" className={styles.sectionHeader}>
                  Owner Details
                </th>
              </tr>
              <tr>
                {/* Agreement Details Sub-headers */}
                <th className={styles.subHeader}>Land Owner</th>
                <th className={styles.subHeader}>Agreement Period</th>
                <th className={styles.subHeader}>Start Date</th>
                <th className={styles.subHeader}>End Date</th>
                <th className={styles.subHeader}>Agreement</th>
                <th className={styles.subHeader}>Monthly Rent</th>
                {/* Power Bill Details Sub-headers */}
                <th className={styles.subHeader}>Bill Number</th>
                <th className={styles.subHeader}>Distributor</th>
                {/* Owner Details Sub-headers */}
                <th className={styles.subHeader}>Aadhar</th>
                <th className={styles.subHeader}>Pan Card</th>
                <th className={styles.subHeader}>Mobile</th>
                <th className={styles.subHeader}>Beneficiary</th>
                <th className={styles.subHeader}>IFSC</th>
                <th className={styles.subHeader}>Account No</th>
                <th className={styles.subHeader}>Bank Name</th>
              </tr>
            </thead>
            <tbody>
              {storesData.length === 0 ? (
                <tr>
                  <td colSpan={19} className={styles.noData}>
                    No stores found
                  </td>
                </tr>
              ) : (
                storesData.map((store, index) => {
                  // Extract nested data from new API format
                  const agreementDetails = store.agreementDetails || {};
                  const powerBillDetails = store.powerBillDetails || {};
                  const ownerDetails = store.ownerDetails || {};

                  return (
                    <tr key={store.id || index}>
                      <td>{index + 1}</td>
                      <td className={styles.storeNameCell}>
                        {store.storeName || "-"}
                      </td>
                      <td>{store.storeCode || "-"}</td>
                      <td>
                        <span
                          className={`${styles.badge} ${store.type === "OWN" ? styles.badgeOwn : styles.badgeRented}`}
                        >
                          {store.type || "-"}
                        </span>
                      </td>
                      <td>{store.division || "-"}</td>
                      <td>{store.zone || "-"}</td>
                      <td className={styles.addressCell}>
                        {store.address || "-"}
                      </td>
                      {/* Agreement Details */}
                      <td>{agreementDetails.landOwner || "-"}</td>
                      <td>{agreementDetails.agreementPeriod || "-"}</td>
                      <td>{formatDate(agreementDetails.startDate)}</td>
                      <td>{formatDate(agreementDetails.endDate)}</td>
                      <td className={styles.agreementCell}>
                        {(() => {
                          // Check for agreementDocument field inside agreementDetails
                          // This is the field name from the updated API response
                          const agreementImageUrl =
                            agreementDetails?.agreementDocument ||
                            store.agreementDocument ||
                            store.rentAgreementDocument;

                          // Check if agreement period is missing
                          const agreementPeriod =
                            agreementDetails?.agreementPeriod;
                          const isAgreementPeriodMissing =
                            !agreementPeriod ||
                            agreementPeriod === "-" ||
                            agreementPeriod === null ||
                            agreementPeriod === "" ||
                            (typeof agreementPeriod === "string" &&
                              agreementPeriod.trim() === "");

                          // Show view button if agreement image URL exists and is valid
                          if (
                            agreementImageUrl &&
                            agreementImageUrl !== "-" &&
                            agreementImageUrl !== null &&
                            agreementImageUrl !== "" &&
                            typeof agreementImageUrl === "string" &&
                            agreementImageUrl.trim() !== ""
                          ) {
                            return (
                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  alignItems: "center",
                                  gap: "4px",
                                }}
                              >
                                <button
                                  className={styles.viewButton}
                                  onClick={() => {
                                    handleViewAgreement(agreementImageUrl);
                                  }}
                                  title="View Agreement Document"
                                >
                                  <i className="bi bi-eye"></i> View
                                </button>
                                {isAgreementPeriodMissing && (
                                  <span
                                    className={styles.warningBadge}
                                    title="Agreement period is missing"
                                  >
                                    <i className="bi bi-exclamation-triangle"></i>{" "}
                                    Period Missing
                                  </span>
                                )}
                              </div>
                            );
                          }

                          // If no agreement document but period is missing, show warning
                          if (isAgreementPeriodMissing) {
                            return (
                              <span
                                className={styles.warningBadge}
                                title="Agreement period is missing"
                              >
                                <i className="bi bi-exclamation-triangle"></i>{" "}
                                Period Missing
                              </span>
                            );
                          }

                          return "-";
                        })()}
                      </td>
                      <td>
                        {agreementDetails.monthlyRent
                          ? formatCurrency(agreementDetails.monthlyRent)
                          : "-"}
                      </td>
                      {/* Power Bill Details */}
                      <td>{powerBillDetails.billNumber || "-"}</td>
                      <td>{powerBillDetails.distributor || "-"}</td>
                      {/* Owner Details */}
                      <td>{ownerDetails.aadhar || "-"}</td>
                      <td className={styles.panCell}>
                        {ownerDetails.panCard || "-"}
                      </td>
                      <td>{ownerDetails.mobile || "-"}</td>
                      <td>{ownerDetails.beneficiary || "-"}</td>
                      <td className={styles.ifscCell}>
                        {ownerDetails.ifsc || "-"}
                      </td>
                      <td className={styles.accountCell}>
                        {ownerDetails.accountNo || "-"}
                      </td>
                      <td>{ownerDetails.bankName || "-"}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isErrorModalOpen && (
        <ErrorModal
          isOpen={isErrorModalOpen}
          message={error}
          onClose={closeErrorModal}
        />
      )}

      {/* Agreement Image View Modal */}
      {showAgreementModal && selectedAgreementImage && (
        <div className={styles.modalOverlay} onClick={closeAgreementModal}>
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <button
                className={styles.modalCloseButton}
                onClick={closeAgreementModal}
                title="Close"
              >
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <img
                src={selectedAgreementImage}
                alt="Agreement Document"
                className={styles.agreementImage}
                onError={(e) => {
                  e.target.src = "";
                  e.target.alt = "Failed to load image";
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoresAbstract;
