import React, { useState, useMemo } from 'react';
import customerLedgerService from '../../../services/customerLedgerService';
import styles from './CustomerLedgerReports.module.css';

const CustomerLedgerTable = ({ 
  ledgerData, 
  loading = false,
  onExportExcel,
  onExportCSV,
  onPrint
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [transactionTypeFilter, setTransactionTypeFilter] = useState('all');
  const [balanceTypeFilter, setBalanceTypeFilter] = useState('all');

  // Transaction type filter options
  const transactionTypeOptions = [
    { value: 'all', label: 'All Transactions' },
    { value: 'Invoice', label: 'Sales Orders' },
    { value: 'Receipt', label: 'Payments' },
    { value: 'Return', label: 'Returns' },
    { value: 'Credit Note', label: 'Credit Notes' }
  ];

  // Balance type filter options
  const balanceTypeOptions = [
    { value: 'all', label: 'All Balances' },
    { value: 'Dr', label: 'Debit Balances Only' },
    { value: 'Cr', label: 'Credit Balances Only' }
  ];

  // Filter and search transactions
  const filteredTransactions = useMemo(() => {
    if (!ledgerData?.transactions) return [];

    let filtered = [...ledgerData.transactions];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(transaction =>
        transaction.particulars?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.vchNo?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply transaction type filter
    if (transactionTypeFilter !== 'all') {
      filtered = filtered.filter(transaction =>
        transaction.vchType === transactionTypeFilter
      );
    }

    // Apply balance type filter
    if (balanceTypeFilter !== 'all') {
      filtered = filtered.filter(transaction =>
        transaction.balanceType === balanceTypeFilter
      );
    }

    return filtered;
  }, [ledgerData?.transactions, searchTerm, transactionTypeFilter, balanceTypeFilter]);

  // Sort transactions
  const sortedTransactions = useMemo(() => {
    if (!sortConfig.key) return filteredTransactions;

    return [...filteredTransactions].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // Handle different data types
      if (sortConfig.key === 'date') {
        aValue = new Date(aValue || '1900-01-01');
        bValue = new Date(bValue || '1900-01-01');
      } else if (sortConfig.key === 'debit' || sortConfig.key === 'credit' || sortConfig.key === 'balance') {
        // Extract numeric values from currency strings
        aValue = parseFloat(String(aValue).replace(/[₹,\s]/g, '')) || 0;
        bValue = parseFloat(String(bValue).replace(/[₹,\s]/g, '')) || 0;
      } else {
        aValue = String(aValue || '').toLowerCase();
        bValue = String(bValue || '').toLowerCase();
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [filteredTransactions, sortConfig]);

  // Handle sorting
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Get sort icon
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return <i className="bi bi-arrow-down-up text-muted"></i>;
    }
    return sortConfig.direction === 'asc' 
      ? <i className="bi bi-arrow-up text-primary"></i>
      : <i className="bi bi-arrow-down text-primary"></i>;
  };

  // Format currency
  const formatCurrency = (amount) => {
    return customerLedgerService.formatCurrency(amount);
  };

  // Format balance with color
  const formatBalance = (balance, balanceType) => {
    if (!balance && balance !== 0) return '';
    
    const formatted = customerLedgerService.formatBalance(balance, balanceType);
    const colorClass = balanceType === 'Dr' ? 'text-danger' : balanceType === 'Cr' ? 'text-success' : '';
    
    return <span className={colorClass}>{formatted}</span>;
  };

  // Handle export actions
  const handleExportExcel = () => {
    if (onExportExcel) {
      onExportExcel(sortedTransactions);
    }
  };

  const handleExportCSV = () => {
    if (onExportCSV) {
      onExportCSV(sortedTransactions);
    }
  };

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  if (loading) {
    return (
      <div className={`card ${styles.tableCard}`}>
        <div className="card-body">
          <div className={styles.loadingState}>
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p>Loading ledger data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!ledgerData) {
    return (
      <div className={`card ${styles.tableCard}`}>
        <div className="card-body">
          <div className={styles.emptyState}>
            <i className="bi bi-journal-text"></i>
            <p>No ledger data available. Please select a customer and generate report.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`card ${styles.tableCard}`}>
      <div className="card-header">
        <div className="row align-items-center">
          <div className="col">
            <h5 className="mb-0">Customer Ledger Report</h5>
            {ledgerData.customer && (
              <small>
                {ledgerData.customer.name} | Period: {ledgerData.period?.fromDate} to {ledgerData.period?.toDate}
              </small>
            )}
          </div>
          <div className="col-auto">
            <div className={styles.exportButtons}>
              <button 
                type="button" 
                className={`${styles.exportBtn} ${styles.success}`}
                onClick={handleExportExcel}
                title="Export to Excel"
              >
                <i className="bi bi-file-earmark-excel"></i>
              </button>
              <button 
                type="button" 
                className={`${styles.exportBtn} ${styles.info}`}
                onClick={handleExportCSV}
                title="Export to CSV"
              >
                <i className="bi bi-filetype-csv"></i>
              </button>
              <button 
                type="button" 
                className={styles.exportBtn}
                onClick={handlePrint}
                title="Print"
              >
                <i className="bi bi-printer"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Balance Summary */}
      {ledgerData.openingBalance !== undefined && (
        <div className={styles.balanceSummary}>
          <div className="row">
            <div className="col-md-3 mb-3 mb-md-0">
              <div className={styles.balanceCard}>
                <small className="d-block">Opening Balance</small>
                <strong>{formatCurrency(ledgerData.openingBalance)}</strong>
              </div>
            </div>
            <div className="col-md-3 mb-3 mb-md-0">
              <div className={styles.balanceCard}>
                <small className="d-block">Closing Balance</small>
                <strong>{formatCurrency(ledgerData.closingBalance)}</strong>
              </div>
            </div>
            <div className="col-md-3 mb-3 mb-md-0">
              <div className={styles.balanceCard}>
                <small className="d-block">Total Debits</small>
                <strong className="text-danger">{formatCurrency(ledgerData.summary?.totalDebits)}</strong>
              </div>
            </div>
            <div className="col-md-3">
              <div className={styles.balanceCard}>
                <small className="d-block">Total Credits</small>
                <strong className="text-success">{formatCurrency(ledgerData.summary?.totalCredits)}</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className={styles.filterBar}>
        <div className="row g-3">
          <div className="col-md-4">
            <input
              type="text"
              className="form-control"
              placeholder="Search particulars or voucher number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="col-md-3">
            <select
              className="form-select"
              value={transactionTypeFilter}
              onChange={(e) => setTransactionTypeFilter(e.target.value)}
            >
              {transactionTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-3">
            <select
              className="form-select"
              value={balanceTypeFilter}
              onChange={(e) => setBalanceTypeFilter(e.target.value)}
            >
              {balanceTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-2">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm w-100"
              onClick={() => {
                setSearchTerm('');
                setTransactionTypeFilter('all');
                setBalanceTypeFilter('all');
                setSortConfig({ key: null, direction: 'asc' });
              }}
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="card-body p-0">
        <div className="table-responsive">
          <table className={`table table-hover mb-0 ${styles.dataTable}`}>
            <thead>
              <tr>
                <th 
                  scope="col" 
                  className="sortable-header"
                  onClick={() => handleSort('date')}
                  style={{ cursor: 'pointer' }}
                >
                  Date {getSortIcon('date')}
                </th>
                <th 
                  scope="col"
                  className="sortable-header"
                  onClick={() => handleSort('particulars')}
                  style={{ cursor: 'pointer' }}
                >
                  Particulars {getSortIcon('particulars')}
                </th>
                <th 
                  scope="col"
                  className="sortable-header"
                  onClick={() => handleSort('vchType')}
                  style={{ cursor: 'pointer' }}
                >
                  Vch Type {getSortIcon('vchType')}
                </th>
                <th 
                  scope="col"
                  className="sortable-header"
                  onClick={() => handleSort('vchNo')}
                  style={{ cursor: 'pointer' }}
                >
                  Vch No {getSortIcon('vchNo')}
                </th>
                <th 
                  scope="col" 
                  className="text-end sortable-header"
                  onClick={() => handleSort('debit')}
                  style={{ cursor: 'pointer' }}
                >
                  Debit {getSortIcon('debit')}
                </th>
                <th 
                  scope="col" 
                  className="text-end sortable-header"
                  onClick={() => handleSort('credit')}
                  style={{ cursor: 'pointer' }}
                >
                  Credit {getSortIcon('credit')}
                </th>
                <th 
                  scope="col" 
                  className="text-end sortable-header"
                  onClick={() => handleSort('balance')}
                  style={{ cursor: 'pointer' }}
                >
                  Balance {getSortIcon('balance')}
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedTransactions.length > 0 ? (
                sortedTransactions.map((transaction, index) => (
                  <tr key={index}>
                    <td>
                      <small>{customerLedgerService.formatDate(transaction.date)}</small>
                    </td>
                    <td>
                      <div className="text-truncate" style={{ maxWidth: '200px' }} title={transaction.particulars}>
                        {transaction.particulars}
                      </div>
                    </td>
                    <td>
                      {transaction.vchType && (
                        <span className={`badge ${
                          transaction.vchType === 'Invoice' ? 'bg-primary' :
                          transaction.vchType === 'Receipt' ? 'bg-success' :
                          transaction.vchType === 'Return' ? 'bg-warning' :
                          transaction.vchType === 'Credit Note' ? 'bg-info' :
                          'bg-secondary'
                        }`}>
                          {transaction.vchType}
                        </span>
                      )}
                    </td>
                    <td>
                      <small className="font-monospace">{transaction.vchNo}</small>
                    </td>
                    <td className="text-end">
                      {transaction.debit && transaction.debit !== '0.00' && (
                        <span className="text-danger font-monospace">
                          {formatCurrency(transaction.debit)}
                        </span>
                      )}
                    </td>
                    <td className="text-end">
                      {transaction.credit && transaction.credit !== '0.00' && (
                        <span className="text-success font-monospace">
                          {formatCurrency(transaction.credit)}
                        </span>
                      )}
                    </td>
                    <td className="text-end">
                      <span className="font-monospace">
                        {formatBalance(transaction.balance, transaction.balanceType)}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center text-muted py-4">
                    <i className="bi bi-search fs-1 mb-2 d-block"></i>
                    No transactions found matching the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction Summary */}
      {ledgerData.summary && sortedTransactions.length > 0 && (
        <div className="card-footer">
          <div className="row text-center">
            <div className="col-md-3">
              <small className="text-muted">Transactions Shown:</small>
              <div><strong>{sortedTransactions.length}</strong></div>
            </div>
            <div className="col-md-3">
              <small className="text-muted">Total Transactions:</small>
              <div><strong>{ledgerData.summary.transactionCount}</strong></div>
            </div>
            <div className="col-md-3">
              <small className="text-muted">Net Balance:</small>
              <div><strong>{formatCurrency(ledgerData.summary.netBalance)}</strong></div>
            </div>
            <div className="col-md-3">
              <small className="text-muted">Period:</small>
              <div><strong>{ledgerData.period?.fromDate} to {ledgerData.period?.toDate}</strong></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerLedgerTable;
