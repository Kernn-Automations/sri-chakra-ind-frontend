import React, { useEffect, useState } from "react";
import styles from "./Customer.module.css";
import { useAuth } from "@/Auth";
import Loading from "@/components/Loading";
import ErrorModal from "@/components/ErrorModal";
import SuccessModal from "@/components/SuccessModal";
import journalVoucherService from "@/services/journalVoucherService";

function JournalVoucher({ navigate }) {
  const { axiosAPI } = useAuth();
  
  const [form, setForm] = useState({
    customerId: "",
    transactionDate: "",
    particulars: "",
    vchType: "",
    vchTypeOther: "",
    vchNo: "",
    ledgerType: "",
    amount: ""
  });

  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerBalance, setCustomerBalance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  const [vchTypes, setVchTypes] = useState([]);
  const [ledgerTypes, setLedgerTypes] = useState([]);

  // Fetch customers and JV options on component mount
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoading(true);
        
        // Get division ID from localStorage for division filtering
        const currentDivisionId = localStorage.getItem('currentDivisionId');
        
        let endpoint = "/customers";
        if (currentDivisionId && currentDivisionId !== '1') {
          endpoint += `?divisionId=${currentDivisionId}`;
        } else if (currentDivisionId === '1') {
          endpoint += `?showAllDivisions=true`;
        }
        
        const response = await axiosAPI.get(endpoint);
        setCustomers(response.data.customers || []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch customers");
        setIsErrorModalOpen(true);
      } finally {
        setLoading(false);
      }
    };

    const fetchOptions = async () => {
      try {
        const currentDivisionId = localStorage.getItem('currentDivisionId');
        const showAll = currentDivisionId === '1';
        const res = await journalVoucherService.getOptions(currentDivisionId, showAll);
        if (res?.success && res.data) {
          setVchTypes(res.data.vchTypes || []);
          setLedgerTypes(res.data.ledgerTypes || []);
        }
      } catch (e) {
        // fallback to basic options
        setVchTypes([
          { value: 'Sales', label: 'Sales' },
          { value: 'Receipt', label: 'Receipt' },
          { value: 'Credit Note', label: 'Credit Note' },
          { value: 'Other', label: 'Other' }
        ]);
        setLedgerTypes([
          { value: 'Dr', label: 'Debit' },
          { value: 'Cr', label: 'Credit' }
        ]);
      }
    };

    fetchCustomers();
    fetchOptions();
  }, [axiosAPI]);

  // Fetch customer balance when customer is selected
  useEffect(() => {
    const fetchCustomerBalance = async () => {
      if (!form.customerId) {
        setCustomerBalance(null);
        setSelectedCustomer(null);
        return;
      }

      try {
        const customer = customers.find(c => c.id === parseInt(form.customerId));
        setSelectedCustomer(customer);

        const currentDivisionId = localStorage.getItem('currentDivisionId');
        const showAll = currentDivisionId === '1';
        const balanceRes = await journalVoucherService.getCustomerBalance(form.customerId, currentDivisionId, showAll);
        if (balanceRes?.success && balanceRes.data) {
          setCustomerBalance(balanceRes.data.currentBalance ?? 0);
        } else {
          setCustomerBalance(0);
        }
      } catch (err) {
        console.error("Failed to fetch customer balance:", err);
        // Set balance to 0 if API fails or doesn't exist yet
        setCustomerBalance(0);
      }
    };

    fetchCustomerBalance();
  }, [form.customerId, customers, axiosAPI]);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    
    // Reset other vch type when vchType changes
    if (field === "vchType" && value !== "Other") {
      setForm(prev => ({ ...prev, vchTypeOther: "" }));
    }
  };

  const handleSubmit = async () => {
    try {
      // Validation
      if (!form.customerId) {
        setError("Please select a customer");
        setIsErrorModalOpen(true);
        return;
      }
      if (!form.transactionDate) {
        setError("Please select transaction date");
        setIsErrorModalOpen(true);
        return;
      }
      if (!form.particulars) {
        setError("Please enter particulars");
        setIsErrorModalOpen(true);
        return;
      }
      if (!form.vchType) {
        setError("Please select voucher type");
        setIsErrorModalOpen(true);
        return;
      }
      if (form.vchType === "Other" && !form.vchTypeOther) {
        setError("Please enter voucher type details");
        setIsErrorModalOpen(true);
        return;
      }
      if (!form.vchNo) {
        setError("Please enter voucher number");
        setIsErrorModalOpen(true);
        return;
      }
      if (!form.ledgerType) {
        setError("Please select ledger type (Dr/Cr)");
        setIsErrorModalOpen(true);
        return;
      }
      if (!form.amount || parseFloat(form.amount) <= 0) {
        setError("Please enter a valid amount");
        setIsErrorModalOpen(true);
        return;
      }

      setLoading(true);

      // Prepare data for submission
      const payload = {
        customerId: parseInt(form.customerId),
        transactionDate: form.transactionDate,
        particulars: form.particulars,
        vchType: form.vchType === "Other" ? form.vchTypeOther : form.vchType,
        vchNo: form.vchNo,
        ledgerType: form.ledgerType,
        amount: parseFloat(form.amount)
      };

      const currentDivisionId = localStorage.getItem('currentDivisionId');
      const showAll = currentDivisionId === '1';
      const response = await journalVoucherService.createJournalVoucher(payload, currentDivisionId, showAll);
      
      setSuccess(response.message || "Journal voucher created successfully");
      setIsSuccessModalOpen(true);
      
      // Reset form
      setForm({
        customerId: "",
        transactionDate: "",
        particulars: "",
        vchType: "",
        vchTypeOther: "",
        vchNo: "",
        ledgerType: "",
        amount: ""
      });
      setSelectedCustomer(null);
      setCustomerBalance(null);
      
    } catch (err) {
      setError(err?.message || err?.response?.data?.message || "Failed to create journal voucher");
      setIsErrorModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <p className="path">
        <span onClick={() => navigate("/customers")}>Customers</span>{" "}
        <i className="bi bi-chevron-right"></i> Journal Voucher
      </p>

      <div className="row m-0 p-3">
        <h5 className={styles.head}>Journal Voucher</h5>
        
        {/* Customer Selection */}
        <div className={`col-4 ${styles.longform}`}>
          <label>Customer :</label>
          <select
            value={form.customerId}
            onChange={(e) => handleChange("customerId", e.target.value)}
            required
          >
            <option value="">--Select Customer--</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name} - {customer.firmName || customer.name}
              </option>
            ))}
          </select>
        </div>

        {/* Customer Balance Display */}
        {selectedCustomer && (
          <div className={`col-4 ${styles.longform}`}>
            <label>Current Balance :</label>
            <span className="ms-2" style={{ 
              fontSize: '14px', 
              fontWeight: '600',
              color: customerBalance >= 0 ? '#28a745' : '#dc3545'
            }}>
              ₹ {customerBalance?.toLocaleString('en-IN') || '0'}
            </span>
          </div>
        )}

        {/* Transaction Date */}
        <div className={`col-3 ${styles.longform}`}>
          <label>Transaction Date :</label>
          <input
            type="date"
            value={form.transactionDate}
            onChange={(e) => handleChange("transactionDate", e.target.value)}
            required
          />
        </div>

        {/* Particulars */}
        <div className={`col-6 ${styles.longform}`}>
          <label>Particulars :</label>
          <input
            type="text"
            value={form.particulars}
            onChange={(e) => handleChange("particulars", e.target.value)}
            placeholder="Enter transaction details"
            required
          />
        </div>

        {/* Voucher Type */}
        <div className={`col-3 ${styles.longform}`}>
          <label>Voucher Type :</label>
          <select
            value={form.vchType}
            onChange={(e) => handleChange("vchType", e.target.value)}
            required
          >
            <option value="">--Select Type--</option>
            {vchTypes.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Other Voucher Type Input */}
        {form.vchType === "Other" && (
          <div className={`col-3 ${styles.longform}`}>
            <label>Enter Voucher Type :</label>
            <input
              type="text"
              value={form.vchTypeOther}
              onChange={(e) => handleChange("vchTypeOther", e.target.value)}
              placeholder="Enter voucher type"
              required
            />
          </div>
        )}

        {/* Voucher Number */
        }
        <div className={`col-3 ${styles.longform}`}>
          <label>Voucher Number :</label>
          <input
            type="text"
            value={form.vchNo}
            onChange={(e) => handleChange("vchNo", e.target.value)}
            placeholder="Enter voucher number"
            required
          />
        </div>

        {/* Ledger Type */}
        <div className={`col-3 ${styles.longform}`}>
          <label>Ledger Type :</label>
          <select
            value={form.ledgerType}
            onChange={(e) => handleChange("ledgerType", e.target.value)}
            required
          >
            <option value="">--Select Type--</option>
            {ledgerTypes.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Amount */}
        <div className={`col-3 ${styles.longform}`}>
          <label>Amount :</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={form.amount}
            onChange={(e) => handleChange("amount", e.target.value)}
            placeholder="Enter amount"
            required
          />
        </div>
      </div>

      {/* Submit and Cancel Buttons */}
      {!loading && (
        <div className="row m-0 p-3 justify-content-center">
          <div className="col-3">
            <button className="submitbtn" onClick={handleSubmit}>
              Create Voucher
            </button>
            <button
              className="cancelbtn"
              onClick={() => navigate("/customers")}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading && <Loading />}
      
      {isErrorModalOpen && (
        <ErrorModal
          isOpen={isErrorModalOpen}
          message={error}
          onClose={() => setIsErrorModalOpen(false)}
        />
      )}
      
      {isSuccessModalOpen && (
        <SuccessModal
          isOpen={isSuccessModalOpen}
          message={success}
          onClose={() => {
            setIsSuccessModalOpen(false);
            navigate("/customers");
          }}
        />
      )}
    </>
  );
}

export default JournalVoucher;


