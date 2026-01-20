import { useAuth } from "@/Auth";
import ErrorModal from "@/components/ErrorModal";
import Loading from "@/components/Loading";
import React, { useEffect, useState } from "react";
import styles from "./Payments.module.css";
import CreditNoteModal from "./CreditNoteModal";
import CreditNoteViewModal from "./CreditNoteViewModal";
import CustomSearchDropdown from "@/utils/CustomSearchDropDown";

function CreditNote({ navigate }) {
  const { axiosAPI } = useAuth();

  const [error, setError] = useState();
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const closeModal = () => {
    setIsModalOpen(false);
  };

  const date = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const today = new Date(Date.now()).toISOString().slice(0, 10);

  const [from, setFrom] = useState(date);
  const [to, setTo] = useState(today);

  const [customers, setCustomers] = useState();

  const [warehouse, setWarehouse] = useState();
  const [customer, setCustomer] = useState();
  const [discountType, setDiscountType] = useState();
  const [status, setStatus] = useState();

  useEffect(() => {
    async function fetch() {
      setLoading(true);
      try {
        const res = await axiosAPI.get("/customers?limit=50");

        setCustomers(res.data.customers);
      } catch (e) {
        // console.log(e);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, []);

  const [creditNotes, setCreditNotes] = useState();

  useEffect(() => {
    async function fetch() {
      try {
        setLoading(true);
        const query = `/credit-notes?fromDate=${from}&toDate=${to}${
          customer ? `&customerId=${customer}` : ""
        }${
          status ? `&orderStatus=${status}` : ""
        }${discountType ? `&discountType=${discountType}` : ""}`;

        console.log(query);

        const res = await axiosAPI.get(query);
        console.log(res);

        setCreditNotes(res.data);
      } catch (e) {
        // console.log(e);
        setError(e.response?.data?.message);
        setIsModalOpen(true);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [from, to, discountType, customer, status]);

  let index = 1;

  return (
    <>
      <p className="path">
        <span onClick={() => navigate("/payments")}>Payments</span>{" "}
        <i class="bi bi-chevron-right"></i>{" "}
        <span onClick={() => navigate("/payments/credit-notes")}>
          Credit-Notes
        </span>{" "}
        <i class="bi bi-chevron-right"></i> List
      </p>

      <div className="row m-0 p-3">
        <div className={`col-3 formcontent`}>
          <label htmlFor="">From :</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>
        <div className={`col-3 formcontent`}>
          <label htmlFor="">To :</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>
        <CustomSearchDropdown
          label="Customers"
          onSelect={setCustomer}
          options={customers?.map((c) => ({ value: c.id, label: c.name }))}
        />

        <div className={`col-3 formcontent`}>
          <label htmlFor="">Discount Type :</label>
          <select
            name=""
            id=""
            value={discountType}
            onChange={(e) =>
              setDiscountType(e.target.value === "null" ? null : e.target.value)
            }
          >
            <option value="null">--select--</option>
            <option value="bill_to_bill">Bill to Bill</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>

        <div className={`col-3 formcontent`}>
          <label htmlFor="">Status :</label>
          <select
            name=""
            id=""
            value={status}
            onChange={(e) =>
              setStatus(e.target.value === "null" ? null : e.target.value)
            }
          >
            <option value="null">--select--</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
          </select>
        </div>
      </div>

      {creditNotes && (
        <div className="row m-0 p-3 justify-content-center">
          <div className="col-lg-10">
            <table className={`table table-bordered borderedtable`}>
              <thead>
                <tr
                  className="animated-row"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <th>S.No</th>
                  <th>Credit Note</th>
                  <th>Discount Type</th>
                  <th>Customer Id</th>
                  <th>Customer Name</th>
                  {/* <th>Warehouse Name</th> */}
                  <th>Status</th>
                  <th>Amount</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {creditNotes.length === 0 && (
                  <tr>
                    <td colSpan={6}>NO DATA FOUND</td>
                  </tr>
                )}

                {creditNotes.length > 0 &&
                  creditNotes.map((creditNote) => (
                    <tr
                      key={creditNote.id}
                      className="animated-row"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <td>{index++}</td>
                      <td>{creditNote.creditNoteNumber}</td>
                      <td>{creditNote.discountType}</td>
                      <td>{creditNote.customer?.customer_id}</td>
                      <td>{creditNote.customer?.name}</td>
                      {/* <td>{creditNote.warehouse?.name}</td> */}
                      <td>{creditNote.status}</td>
                      <td>{creditNote.totalCreditAmount}</td>
                      <td>
                        <CreditNoteViewModal creditNote={creditNote} />
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isModalOpen && (
        <ErrorModal isOpen={isModalOpen} message={error} onClose={closeModal} />
      )}

      {loading && <Loading />}
    </>
  );
}

export default CreditNote;
