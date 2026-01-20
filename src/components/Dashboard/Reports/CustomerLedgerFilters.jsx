import React, { useState, useEffect } from 'react';
import styles from './CustomerLedgerReports.module.css';

const CustomerLedgerFilters = ({ 
  onFiltersChange, 
  customers = [], 
  loading = false,
  onCustomersLoad 
}) => {
  // Filter state
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [reportType, setReportType] = useState('custom');
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Report type options
  const reportTypeOptions = [
    { value: 'custom', label: 'Custom Date Range' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'yearly', label: 'Yearly' },
    { value: 'financial-year', label: 'Financial Year' }
  ];

  // Initialize default dates (current month)
  useEffect(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    setFromDate(firstDay.toISOString().split('T')[0]);
    setToDate(lastDay.toISOString().split('T')[0]);
  }, []);

  // Load customers on mount
  useEffect(() => {
    if (onCustomersLoad) {
      onCustomersLoad();
    }
  }, [onCustomersLoad]);

  // Monthly options - last 12 months
  const getMonthlyOptions = () => {
    const options = [];
    const currentDate = new Date();
   
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const monthName = date.toLocaleString('default', { month: 'long' });
     
      options.push({
        value: `${year}-${String(month).padStart(2, '0')}`,
        label: `${monthName} ${year}`
      });
    }
    return options;
  };

  // Quarterly options - last 12 quarters
  const getQuarterlyOptions = () => {
    const options = [];
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentQuarter = Math.floor(currentDate.getMonth() / 3) + 1;
   
    for (let i = 0; i < 12; i++) {
      let year = currentYear;
      let quarter = currentQuarter - i;
      
      if (quarter <= 0) {
        quarter += 4;
        year -= Math.ceil(Math.abs(quarter - currentQuarter) / 4);
      }
      
      const quarterData = {
        value: `${year}-Q${quarter}`,
        label: `Q${quarter} ${year} (${getQuarterMonths(quarter)})`
      };
      
      options.push(quarterData);
    }
    return options;
  };

  // Helper function to get quarter months
  const getQuarterMonths = (quarter) => {
    const quarterMonths = {
      1: 'Jan-Mar',
      2: 'Apr-Jun', 
      3: 'Jul-Sep',
      4: 'Oct-Dec'
    };
    return quarterMonths[quarter];
  };

  // Yearly options - last 6 years
  const getYearlyOptions = () => {
    const options = [];
    const currentYear = new Date().getFullYear();
   
    for (let year = currentYear; year >= currentYear - 5; year--) {
      options.push({
        value: year.toString(),
        label: `Year ${year}`
      });
    }
    return options;
  };

  // Financial year options - last 6 FYs + next 2 FYs
  const getFinancialYearOptions = () => {
    const options = [];
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1; // 1-12
    
    // Determine current financial year
    let currentFY = currentYear;
    if (currentMonth < 4) { // Jan, Feb, Mar are part of previous FY
      currentFY = currentYear - 1;
    }
   
    for (let i = currentFY - 3; i <= currentFY + 2; i++) {
      const fy = `${i}-${String(i + 1).slice(-2)}`;
      options.push({ 
        value: fy, 
        label: `FY ${fy} (Apr ${i} - Mar ${i + 1})` 
      });
    }
    return options.reverse(); // Most recent first
  };

  // Get period options based on report type
  const getPeriodOptions = () => {
    switch (reportType) {
      case 'monthly':
        return getMonthlyOptions();
      case 'quarterly':
        return getQuarterlyOptions();
      case 'yearly':
        return getYearlyOptions();
      case 'financial-year':
        return getFinancialYearOptions();
      default:
        return [];
    }
  };

  // Handle report type change
  const handleReportTypeChange = (newReportType) => {
    setReportType(newReportType);
    setSelectedPeriod('');
    
    // Set default period for non-custom types
    if (newReportType !== 'custom') {
      const options = getPeriodOptionsForType(newReportType);
      if (options.length > 0) {
        setSelectedPeriod(options[0].value);
      }
    }
  };

  // Get period options for a specific type
  const getPeriodOptionsForType = (type) => {
    switch (type) {
      case 'monthly':
        return getMonthlyOptions();
      case 'quarterly':
        return getQuarterlyOptions();
      case 'yearly':
        return getYearlyOptions();
      case 'financial-year':
        return getFinancialYearOptions();
      default:
        return [];
    }
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!selectedCustomer) {
      alert('Please select a customer');
      return;
    }

    // Validate date range for custom reports
    if (reportType === 'custom') {
      if (!fromDate || !toDate) {
        alert('Please select both from and to dates');
        return;
      }
      if (new Date(fromDate) > new Date(toDate)) {
        alert('From date cannot be after to date');
        return;
      }
    } else {
      if (!selectedPeriod) {
        alert('Please select a period');
        return;
      }
    }

    // Pass filters to parent component
    onFiltersChange({
      customerId: selectedCustomer,
      reportType,
      selectedPeriod,
      fromDate,
      toDate
    });
  };

  // Handle reset
  const handleReset = () => {
    setSelectedCustomer('');
    setReportType('custom');
    setSelectedPeriod('');
    
    // Reset to current month
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    setFromDate(firstDay.toISOString().split('T')[0]);
    setToDate(lastDay.toISOString().split('T')[0]);
    
    // Clear results in parent
    onFiltersChange(null);
  };

  return (
    <>
      {/* Invoice-style Filter Row */}
      <div className="row m-0 p-3">
        <div className="col-3 formcontent">
          <label>Customer:</label>
          <select
            value={selectedCustomer}
            onChange={(e) => setSelectedCustomer(e.target.value)}
            disabled={loading}
          >
            <option value="">--select--</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.customer_id ? `${customer.customer_id} - ` : ''}
                {customer.name || customer.customerName}
                {customer.firmName ? ` (${customer.firmName})` : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="col-3 formcontent">
          <label>Report Type:</label>
          <select
            value={reportType}
            onChange={(e) => handleReportTypeChange(e.target.value)}
          >
            {reportTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Period Selection (for non-custom types) */}
        {reportType !== 'custom' && (
          <div className="col-3 formcontent">
            <label>Period:</label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
            >
              <option value="">--select--</option>
              {getPeriodOptions().map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Custom Date Range (for custom type) */}
        {reportType === 'custom' && (
          <>
            <div className="col-3 formcontent">
              <label>From:</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div className="col-3 formcontent">
              <label>To:</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
          </>
        )}
      </div>

      {/* Invoice-style Button Row */}
      <div className="row m-0 p-3 justify-content-center">
        <div className="col-3 formcontent">
          <button 
            className="submitbtn" 
            onClick={(e) => {
              e.preventDefault();
              handleSubmit(e);
            }}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Submit'}
          </button>
          <button 
            className="cancelbtn"
            onClick={handleReset}
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </div>
    </>
  );
};

export default CustomerLedgerFilters;
