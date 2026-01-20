import { useAuth } from "@/Auth";
import React, { useEffect, useRef, useState } from "react";
import styles from "./Payments.module.css";
import Loading from "@/components/Loading";
import ErrorModal from "@/components/ErrorModal";
import success from "../../../images/animations/SuccessAnimation.gif";

function GenerateMonthly({ navigate }) {
  const [credits, setCredits] = useState([]);
  const [selectedData, setSelectedData] = useState([]);
  const { axiosAPI } = useAuth();

  const [error, setError] = useState();
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const selectAllRef = useRef(null);

  const closeModal = () => setIsModalOpen(false);
  const [successfull, setSuccessfull] = useState();

  useEffect(() => {
    async function fetchCredits() {
      try {
        setLoading(true);
        const query = `/credit-notes/monthly/get-pending`;
        const res = await axiosAPI.get(query);
        const dataWithSelection = res.data?.data.map((item) => ({
          ...item,
          selected: false,
        }));
        setCredits(dataWithSelection);
      } catch (e) {
        setError(e.response?.data?.message || "Something went wrong");
        setIsModalOpen(true);
        console.error(e);
      } finally {
        setLoading(false);
      }
    }

    fetchCredits();
  }, []);

  const isAllSelected = credits.length > 0 && credits.every((c) => c.selected);
  const isSomeSelected = credits.some((c) => c.selected) && !isAllSelected;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = isSomeSelected;
    }

    const selected = credits
      .filter((credit) => credit.selected)
      .map((credit) => ({
        customerId: credit.customerId,
        month: credit.month,
      }));

    setSelectedData(selected);
  }, [credits]);

  const handleSelectAll = () => {
    setCredits((prev) =>
      prev.map((credit) => ({ ...credit, selected: !isAllSelected }))
    );
  };

  const handleItemChange = (customerId, month) => {
    setCredits((prev) =>
      prev.map((credit) =>
        credit.customerId === customerId && credit.month === month
          ? { ...credit, selected: !credit.selected }
          : credit
      )
    );
  };

  const handleGenerate = async () => {
    if (selectedData.length === 0) return;
    console.log("Sending:", selectedData);

    try {
      setLoading(true);
      const res = await axiosAPI.post(
        `/credit-notes/monthly/generate-selected`,
        {
          selected: selectedData,
        }
      );
      console.log(res);
      setSuccessfull(res.data.message);
      // navigate("/payments/credit-notes");
    } catch (e) {
      setError(e.response?.data?.message || "Failed to generate credit notes");
      setIsModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <p className="path">
        <span onClick={() => navigate("/payments")}>Payments</span>{" "}
        <i className="bi bi-chevron-right"></i>{" "}
        <span onClick={() => navigate("/payments/credit-notes")}>
          Credit-Notes
        </span>{" "}
        <i className="bi bi-chevron-right"></i> Generate Monthly
      </p>

      {!successfull && (
        <div className="row m-0 p-3 pt-5 justify-content-center">
          <div className={`col-lg-10 ${styles.select}`}>
            <input
              ref={selectAllRef}
              id="selectall"
              type="checkbox"
              checked={isAllSelected}
              onChange={handleSelectAll}
            />
            <label htmlFor="selectall" className="ms-2">
              Select all
            </label>

            <table className="table table-bordered borderedtable mt-3">
              <thead>
                <tr>
                  <th>Select</th>
                  <th>Month</th>
                  <th>Customer Id</th>
                  <th>Customer Name</th>
                  <th>Status</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {credits.map((credit) => (
                  <tr key={credit.creditNoteId}>
                    <td>
                      <input
                        type="checkbox"
                        checked={!!credit.selected}
                        onChange={() =>
                          handleItemChange(credit.customerId, credit.month)
                        }
                      />
                    </td>
                    <td>{credit.month}</td>
                    <td>{credit.customerId}</td>
                    <td>{credit.customerName}</td>
                    <td>{credit.status}</td>
                    <td>{credit.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="text-end mt-3">
              <button
                className="submitbtn"
                disabled={selectedData.length === 0}
                onClick={handleGenerate}
              >
                Generate
              </button>
            </div>
          </div>
        </div>
      )}

      {successfull && <LoadingAnimation gif={success} msg={successfull} />} 

      {loading && <Loading />}
      {isModalOpen && (
        <ErrorModal isOpen={isModalOpen} message={error} onClose={closeModal} />
      )}
    </>
  );
}

export default GenerateMonthly;
