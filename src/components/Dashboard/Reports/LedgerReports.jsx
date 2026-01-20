import React, { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/Auth'
import ErrorModal from '@/components/ErrorModal'
import Loading from '@/components/Loading'
import customerLedgerService from '@/services/customerLedgerService'
import pdf from '../../../images/pdf-png.png'
import styles from '../Sales/Sales.module.css'
import CustomSearchDropdown from '@/utils/CustomSearchDropDown'

function LedgerReports({navigate}) {
  const { axiosAPI } = useAuth()
  const [customers, setCustomers] = useState([])
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [customer, setCustomer] = useState('')
  const [reportType, setReportType] = useState('custom') // custom, financial-year
  const [financialYear, setFinancialYear] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCustomerDetails, setSelectedCustomerDetails] = useState(null)
  const [ledgerData, setLedgerData] = useState([])
  const [showReport, setShowReport] = useState(false)
  const [infoMessage, setInfoMessage] = useState('')
  const [downloadingPDF, setDownloadingPDF] = useState(false)

  const closeModal = () => setIsModalOpen(false)

  // Fetch customers on component mount
  useEffect(() => {
    async function fetchCustomers() {
      try {
        setLoading(true)
        const result = await customerLedgerService.getCustomers(axiosAPI)
        
        if (result.success) {
          const customersList = result.data || []
          
          // Add dummy customer for testing
          const dummyCustomer = {
            id: 'dummy-001',
            name: 'DIGAMBAR SHANKAR SAWANT',
            address: 'SNO 27 1/2, CHANRABHAGA NIVAS, GHATE COLONY, WAI SATARA MH',
            aadhar: '924823386904',
            location: '28.704100, 77.102500',
            contact: '+91-8888000743',
            email: '',
            isDummy: true
          }
          setCustomers([dummyCustomer, ...customersList])
        } else {
          setError(result.message || "Failed to fetch customers")
          setIsModalOpen(true)
        }
      } catch (err) {
        setError("Failed to fetch customers")
        setIsModalOpen(true)
      } finally {
        setLoading(false)
      }
    }
    fetchCustomers()
  }, [])

  const handleSubmit = async () => {
    if (!customer) {
      setError("Please select a customer")
      setIsModalOpen(true)
      return
    }

    // Validate financial year if selected
    if (reportType === 'financial-year' && !financialYear) {
      setError("Please select a financial year")
      setIsModalOpen(true)
      return
    }

    // Validate date range if custom report
    if (reportType === 'custom' && (!fromDate || !toDate)) {
      setError("Please select both from and to dates")
      setIsModalOpen(true)
      return
    }

    const selectedCustomer = customers.find(c => String(c.id) === String(customer))
    if (!selectedCustomer) {
      setError("Customer not found")
      setIsModalOpen(true)
      return
    }

    setSelectedCustomerDetails(selectedCustomer)
    setShowReport(true)
    setInfoMessage('')
    setLoading(true)

    try {
      let result

      if (selectedCustomer.id === 'dummy-001') {
        // Use dummy data for testing
        setLedgerData([
          { date: '01 Apr 25', particulars: 'Opening Balance', vchType: '', vchNo: '', debit: '0.00', credit: '', balance: '0.00' },
          { date: '18 Jun 25', particulars: 'Sales Of Cattle Feed', vchType: 'Sales', vchNo: 'INV-2025-26-00012', debit: '', credit: '29,150.00', balance: '29,150.00 Dr' },
          { date: '', particulars: 'YES BANK LIMITED', vchType: 'Receipt', vchNo: '36', debit: '29,150.00', credit: '', balance: '' },
          { date: '26 Jun 25', particulars: 'YES BANK LIMITED', vchType: 'Receipt', vchNo: '51', debit: '3,590.00', credit: '', balance: '3,590.00 Cr' },
          { date: '', particulars: 'Sales Of Cattle Feed', vchType: 'Sales', vchNo: 'INV-2025-26-00024', debit: '', credit: '3,590.00', balance: '' },
        ])
        setInfoMessage('')
      } else {
        // Fetch real data from backend
        const periodData = reportType === 'financial-year' 
          ? financialYear 
          : { fromDate, toDate }

        result = await customerLedgerService.fetchCustomerLedger(
          axiosAPI, 
          selectedCustomer.customer_id || selectedCustomer.id, 
          reportType, 
          periodData
        )

        if (result.success) {
          // Handle the new backend response structure
          const responseData = result.data;
          
          // Use customer data from API response if available, otherwise use selected customer
          if (responseData?.customer) {
            const apiCustomer = responseData.customer;
            setSelectedCustomerDetails({
              id: apiCustomer.id,
              customer_id: apiCustomer.customer_id,
              name: apiCustomer.name,
              address: apiCustomer.location || '',
              aadhar: apiCustomer.aadhaarNumber || '',
              location: apiCustomer.location || '',
              contact: apiCustomer.contact || `Mobile: ${apiCustomer.mobile || ''}, WhatsApp: ${apiCustomer.whatsapp || ''}`,
              email: apiCustomer.email || '',
              mobile: apiCustomer.mobile || '',
              whatsapp: apiCustomer.whatsapp || '',
              firmName: apiCustomer.firmName || ''
            });
          }
          
          const transactions = responseData?.transactions || [];
          
          const formattedData = transactions.map(item => {
            return {
              date: item.date || '',
              particulars: item.particulars || '',
              vchType: item.vchType || '',
              vchNo: item.vchNo || '',
              debit: item.debit ? customerLedgerService.formatCurrency(item.debit) : '',
              credit: item.credit ? customerLedgerService.formatCurrency(item.credit) : '',
              balance: customerLedgerService.formatBalance(item.balance, item.balanceType)
            }
          })
          
          setLedgerData(formattedData)
          setInfoMessage((formattedData?.length || 0) === 0 ? 'No ledger data found for the selected period' : '')
        } else {
          setError(result.message || 'Failed to fetch ledger data')
          setIsModalOpen(true)
          setLedgerData([])
        }
      }
    } catch (err) {
      setError('Failed to fetch ledger data')
      setIsModalOpen(true)
      setLedgerData([])
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setFromDate('')
    setToDate('')
    setCustomer('')
    setReportType('custom')
    setFinancialYear('')
    setSelectedCustomerDetails(null)
    setLedgerData([])
    setShowReport(false)
    setInfoMessage('')
  }

  const handleDownloadPDF = async () => {
    if (!selectedCustomerDetails) {
      setError("No customer selected")
      setIsModalOpen(true)
      return
    }

    setDownloadingPDF(true)

    try {
      const periodData = reportType === 'financial-year' 
        ? financialYear 
        : { fromDate, toDate }

      const result = await customerLedgerService.downloadPDF(
        axiosAPI,
        selectedCustomerDetails.customer_id || selectedCustomerDetails.id,
        reportType,
        periodData
      )

      if (result.success) {
        // Create download link
        const url = window.URL.createObjectURL(result.blob)
        const link = document.createElement('a')
        link.href = url
        link.download = result.filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      } else {
        setError(result.message || 'Failed to download PDF')
        setIsModalOpen(true)
      }
    } catch (err) {
      setError('Failed to download PDF')
      setIsModalOpen(true)
    } finally {
      setDownloadingPDF(false)
    }
  }

  // Forward-fill empty dates with previous non-empty date for display
  const filledLedgerData = useMemo(() => {
    let lastDate = ''
    return ledgerData.map((row) => {
      const displayDate = row.date && row.date.trim() !== '' ? row.date : lastDate
      if (row.date && row.date.trim() !== '') lastDate = row.date
      return { ...row, displayDate }
    })
  }, [ledgerData])

  function parseLedgerDate(d) {
    if (!d) return null
    const parts = d.split(' ').filter(Boolean)
    if (parts.length !== 3) return null
    const [dd, mon, yy] = parts
    const monthMap = { Jan:0, Feb:1, Mar:2, Apr:3, May:4, Jun:5, Jul:6, Aug:7, Sep:8, Oct:9, Nov:10, Dec:11 }
    const m = monthMap[mon]
    const day = parseInt(dd, 10)
    const year = 2000 + parseInt(yy, 10)
    if (Number.isNaN(day) || m == null || Number.isNaN(year)) return null
    return new Date(year, m, day)
  }

  const rangedLedgerData = useMemo(() => {
    if (!fromDate && !toDate) return filledLedgerData
    const from = fromDate ? new Date(fromDate) : null
    const to = toDate ? new Date(toDate) : null
    return filledLedgerData.filter((row) => {
      const d = parseLedgerDate(row.displayDate)
      if (!d) return true
      if (from && d < from) return false
      if (to) {
        const toEnd = new Date(to)
        toEnd.setHours(23,59,59,999)
        if (d > toEnd) return false
      }
      return true
    })
  }, [filledLedgerData, fromDate, toDate])

  return (
     <>
      <p className="path">
        <span onClick={() => navigate("/reports")}>Reports</span>{" "}
        <i className="bi bi-chevron-right"></i> Ledger-Reports
      </p>

      {/* Filters */}
      <div className="row m-0 p-3">
        <div className="col-2 formcontent">
          <label>Report Type:</label>
          <select
            value={reportType}
            onChange={(e) => {
              setReportType(e.target.value)
              if (e.target.value === 'custom') {
                setFinancialYear('')
              } else {
                setFromDate('')
                setToDate('')
              }
            }}
          >
            <option value="custom">Custom Date Range</option>
            <option value="financial-year">Financial Year</option>
          </select>
        </div>
        
        {reportType === 'custom' ? (
          <>
            <div className="col-2 formcontent">
              <label>From Date:</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div className="col-2 formcontent">
              <label>To Date:</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
          </>
        ) : (
          <div className="col-2 formcontent">
            <label>Financial Year:</label>
            <select
              value={financialYear}
              onChange={(e) => setFinancialYear(e.target.value)}
            >
              <option value="">--select--</option>
              <option value="2024-25">2024-25</option>
              <option value="2023-24">2023-24</option>
              <option value="2022-23">2022-23</option>
              <option value="2021-22">2021-22</option>
            </select>
          </div>
        )}
        
        <CustomSearchDropdown
          label="Customer"
          onSelect={setCustomer}
          options={customers?.map((c) => ({ value: c.id, label: c.name }))}
          showSelectAll={false}
        />
      </div>

      {/* Submit and Cancel Buttons */}
      <div className="row m-0 p-3 justify-content-center">
        <div className="col-4 formcontent d-flex gap-2">
          <button className="submitbtn" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Loading...' : 'Submit'}
          </button>
          <button className="cancelbtn" onClick={handleCancel}>
            Cancel
          </button>
        </div>
      </div>

      {/* Export buttons - centered below Submit/Cancel */}
      {!loading && showReport && selectedCustomerDetails && ledgerData.length > 0 && (
        <div className="row m-0 p-3 justify-content-center">
          <div className="col-4 d-flex justify-content-center">
            <button className={styles.xls} onClick={handleDownloadPDF} disabled={downloadingPDF}>
              <p>Export to </p>
              <img src={pdf} alt="" />
            </button>
          </div>
        </div>
      )}

      {/* Loading and Error Modals */}
      {(loading || downloadingPDF) && <Loading />}
      {error && (
        <ErrorModal
          show={isModalOpen}
          onHide={closeModal}
          message={error}
        />
      )}

      {/* Centered Header Details */}
      {showReport && selectedCustomerDetails && (
        <div className="row m-0 p-3">
          <div className="col-12 text-center">
            <h3 className="fw-bold mb-2">FB AGRI VET PRIVATE LIMITED</h3>
            <div className="mb-2">CS NO 3651,</div>
            <div className="mb-2">Kachare Housing Society,</div>
            <div className="mb-2">JAYSINGPUR KOLHAPUR ROAD</div>
            <div className="mb-2">SAMBHJIPUR, Jaysingpur, Kolhapur,, Maharashtra - 416101</div>
            <div className="mb-3">E-Mail :finance@feedbazaar.in</div>

            <h5 className="fw-bold mb-1">{selectedCustomerDetails.name}</h5>
            <div className="mb-1">Ledger Account</div>
            {selectedCustomerDetails.address && (
              <div className="mb-1">
                {selectedCustomerDetails.address
                  .split(',')
                  .map(part => part.trim())
                  .filter(part => part && part.toLowerCase() !== 'null' && part !== '')
                  .map((part, index) => (
                    <div key={index}>{part}</div>
                  ))}
              </div>
            )}
            <div className="mb-1">Aadhar no : {selectedCustomerDetails.aadhar}</div>
            {selectedCustomerDetails.mobile && (
              <div className="mb-3">Contact : {selectedCustomerDetails.mobile}</div>
            )}

            {rangedLedgerData.length > 0 && (
              <div className="mt-2">
                {rangedLedgerData[0].displayDate} To {rangedLedgerData[rangedLedgerData.length - 1].displayDate}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Ledger Table */}
      {showReport && (
        <div className="row m-0 p-3">
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">Ledger Account</h5>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-bordered borderedtable">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Particulars</th>
                        <th>Vch Type</th>
                        <th>Vch No.</th>
                        <th className="text-center">Debit</th>
                        <th className="text-center">Credit</th>
                        <th className="text-center">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rangedLedgerData.length > 0 ? (
                        rangedLedgerData.map((row, index) => (
                          <tr key={index} className={row.date === '' ? 'table-light' : ''}>
                            <td>{row.displayDate}</td>
                            <td>{row.particulars}</td>
                            <td>{row.vchType}</td>
                            <td>{row.vchNo}</td>
                            <td className="text-center">{row.debit}</td>
                            <td className="text-center">{row.credit}</td>
                            <td className="text-center">{row.balance}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="7" className="text-center text-muted">
                            {infoMessage || (fromDate || toDate ? 'No data for selected date range' : 'No ledger data available.')}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default LedgerReports