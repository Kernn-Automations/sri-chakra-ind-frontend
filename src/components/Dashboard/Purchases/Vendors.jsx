import { useAuth } from "@/Auth";
import ErrorModal from "@/components/ErrorModal";
import Loading from "@/components/Loading";
import React, { useEffect, useState } from "react";
import AddVendorViewModal from "./AddVendorViewModal";
import styles from "./Purchases.module.css";
import EditVendorViewModal from "./EditVendorViewModal";
import DeleteModal from "./DeleteModal";
import { FaArrowLeftLong, FaArrowRightLong } from "react-icons/fa6";

function Vendors({ navigate }) {
  const { axiosAPI } = useAuth();

  const [trigger, setTrigger] = useState(false);

  const changeTrigger = () => setTrigger(!trigger);

  const [error, setError] = useState();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const closeModal = () => {
    setIsModalOpen(false);
  };

  const [suppliers, setSuppliers] = useState();
  const [allSuppliers, setAllSuppliers] = useState([]); // Store all suppliers for frontend pagination

  // Add search state variables for searchable fields
  const [dateSearchTerm, setDateSearchTerm] = useState("");
  const [showDateSearch, setShowDateSearch] = useState(false);
  const [vendorIdSearchTerm, setVendorIdSearchTerm] = useState("");
  const [showVendorIdSearch, setShowVendorIdSearch] = useState(false);
  const [vendorNameSearchTerm, setVendorNameSearchTerm] = useState("");
  const [showVendorNameSearch, setShowVendorNameSearch] = useState(false);

  // Pagination state
  const [pageNo, setPageNo] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(0);

  // Reset page number when limit changes
  useEffect(() => {
    setPageNo(1);
  }, [limit]);

  // Handle frontend pagination
  const updatePagination = (allItems, currentPage, itemsPerPage) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedItems = allItems.slice(startIndex, endIndex);
    
    console.log('🔄 Frontend pagination:', {
      totalItems: allItems.length,
      currentPage,
      itemsPerPage,
      startIndex,
      endIndex,
      paginatedItemsCount: paginatedItems.length,
      totalPages: Math.ceil(allItems.length / itemsPerPage)
    });
    
    setSuppliers(paginatedItems);
    setTotalPages(Math.ceil(allItems.length / itemsPerPage));
  };

  // Update pagination when page number changes
  useEffect(() => {
    if (allSuppliers.length > 0) {
      updatePagination(allSuppliers, pageNo, limit);
    }
  }, [pageNo, allSuppliers, limit]);

  // Update pagination when limit changes
  useEffect(() => {
    if (allSuppliers.length > 0) {
      updatePagination(allSuppliers, pageNo, limit);
    }
  }, [limit, allSuppliers, pageNo]);

  useEffect(() => {
    async function fetch() {
      setLoading(true);
      try {
        const res = await axiosAPI.get("/suppliers");
        // console.log(res);
        const allItems = res.data.suppliers;
        console.log('All suppliers:', allItems);
        console.log('Total suppliers:', allItems.length);
        
        // Store all suppliers for frontend pagination
        setAllSuppliers(allItems);
        
        // Apply frontend pagination
        updatePagination(allItems, pageNo, limit);
      } catch (e) {
        // console.log(e);
        setError(e.response.data.message);
        setIsModalOpen(true);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [trigger]);

  // Add ESC key functionality to exit search mode
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        if (showDateSearch) {
          setShowDateSearch(false);
          setDateSearchTerm("");
        }
        if (showVendorIdSearch) {
          setShowVendorIdSearch(false);
          setVendorIdSearchTerm("");
        }
        if (showVendorNameSearch) {
          setShowVendorNameSearch(false);
          setVendorNameSearchTerm("");
        }
      }
    };

    if (showDateSearch || showVendorIdSearch || showVendorNameSearch) {
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [showDateSearch, showVendorIdSearch, showVendorNameSearch]);

  // Add click outside functionality to exit search mode
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if click is outside any of the search headers
      const dateHeader = document.querySelector('[data-date-header]');
      const vendorIdHeader = document.querySelector('[data-vendorid-header]');
      const vendorNameHeader = document.querySelector('[data-vendorname-header]');
      
      if (showDateSearch && dateHeader && !dateHeader.contains(event.target)) {
        setShowDateSearch(false);
        setDateSearchTerm("");
      }
      
      if (showVendorIdSearch && vendorIdHeader && !vendorIdHeader.contains(event.target)) {
        setShowVendorIdSearch(false);
        setVendorIdSearchTerm("");
      }
      
      if (showVendorNameSearch && vendorNameHeader && !vendorNameHeader.contains(event.target)) {
        setShowVendorNameSearch(false);
        setVendorNameSearchTerm("");
      }
    };

    if (showDateSearch || showVendorIdSearch || showVendorNameSearch) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDateSearch, showVendorIdSearch, showVendorNameSearch]);

  return (
    <>
      <p className="path">
        <span onClick={() => navigate("/purchases")}>Purchase</span>{" "}
        <i class="bi bi-chevron-right"></i> Vendors
      </p>

      <div className="row m-0 p-3 pt-0">
        <div className="col-3">
          <AddVendorViewModal changeTrigger={changeTrigger} />
        </div>
      </div>

      {suppliers && (
        <div className="row m-0 p-3 justify-content-center">
          <div className="col-md-9">
            {/* Entity Limit */}
            <div className="row m-0 p-0 mb-3 justify-content-end">
              <div className="col-lg-2">
                <label htmlFor="">Entity :</label>
                <select
                  name=""
                  id=""
                  value={limit}
                  onChange={(e) => setLimit(Number(e.target.value))}
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={30}>30</option>
                  <option value={40}>40</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            <table className="table table-bordered borderedtable">
              <thead>
                <tr>
                  <th>S.No</th>
                  <th 
                    onClick={() => setShowDateSearch(!showDateSearch)}
                    style={{ cursor: 'pointer', position: 'relative' }}
                    data-date-header
                  >
                    {showDateSearch ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="text"
                          placeholder="Search by date..."
                          value={dateSearchTerm}
                          onChange={(e) => setDateSearchTerm(e.target.value)}
                          style={{
                            flex: 1,
                            padding: '2px 6px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontSize: '12px',
                            minWidth: '120px',
                            height: '28px',
                            color: '#000',
                            backgroundColor: '#fff'
                          }}
                          autoFocus
                        />
                        {dateSearchTerm && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDateSearchTerm("");
                            }}
                            style={{
                              padding: '4px 8px',
                              border: '1px solid #dc3545',
                              borderRadius: '4px',
                              background: '#dc3545',
                              color: '#fff',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              minWidth: '24px',
                              height: '28px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ) : (
                      <>
                        Date
                      </>
                    )}
                  </th>
                  <th 
                    onClick={() => setShowVendorIdSearch(!showVendorIdSearch)}
                    style={{ cursor: 'pointer', position: 'relative' }}
                    data-vendorid-header
                  >
                    {showVendorIdSearch ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="text"
                          placeholder="Search by vendor ID..."
                          value={vendorIdSearchTerm}
                          onChange={(e) => setVendorIdSearchTerm(e.target.value)}
                          style={{
                            flex: 1,
                            padding: '2px 6px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontSize: '12px',
                            minWidth: '120px',
                            height: '28px',
                            color: '#000',
                            backgroundColor: '#fff'
                          }}
                          autoFocus
                        />
                        {vendorIdSearchTerm && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setVendorIdSearchTerm("");
                            }}
                            style={{
                              padding: '4px 8px',
                              border: '1px solid #dc3545',
                              borderRadius: '4px',
                              background: '#dc3545',
                              color: '#fff',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              minWidth: '24px',
                              height: '28px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ) : (
                      <>
                        Vendor ID
                      </>
                    )}
                  </th>
                  <th 
                    onClick={() => setShowVendorNameSearch(!showVendorNameSearch)}
                    style={{ cursor: 'pointer', position: 'relative' }}
                    data-vendorname-header
                  >
                    {showVendorNameSearch ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="text"
                          placeholder="Search by vendor name..."
                          value={vendorNameSearchTerm}
                          onChange={(e) => setVendorNameSearchTerm(e.target.value)}
                          style={{
                            flex: 1,
                            padding: '2px 6px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontSize: '12px',
                            minWidth: '120px',
                            height: '28px',
                            color: '#000',
                            backgroundColor: '#fff'
                          }}
                          autoFocus
                        />
                        {vendorNameSearchTerm && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setVendorNameSearchTerm("");
                            }}
                            style={{
                              padding: '4px 8px',
                              border: '1px solid #dc3545',
                              borderRadius: '4px',
                              background: '#dc3545',
                              color: '#fff',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              minWidth: '24px',
                              height: '28px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ) : (
                      <>
                        Vendor Name
                      </>
                    )}
                  </th>
                  <th>Action</th>
                </tr>
                {(showDateSearch && dateSearchTerm) || (showVendorIdSearch && vendorIdSearchTerm) || (showVendorNameSearch && vendorNameSearchTerm) ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '8px', fontSize: '12px', color: '#666', backgroundColor: '#f8f9fa' }}>
                      {(() => {
                        const filteredItems = allSuppliers.filter(supplier => {
                          let pass = true;
                          if (dateSearchTerm) {
                            const supplierDate = supplier.createdAt ? supplier.createdAt.slice(0, 10) : '';
                            if (!supplierDate.includes(dateSearchTerm)) {
                              pass = false;
                            }
                          }
                          if (vendorIdSearchTerm) {
                            const supplierId = supplier.supplierCode || '';
                            if (!supplierId.toLowerCase().includes(vendorIdSearchTerm.toLowerCase())) {
                              pass = false;
                            }
                          }
                          if (vendorNameSearchTerm) {
                            const supplierName = supplier.name || '';
                            if (!supplierName.toLowerCase().includes(vendorNameSearchTerm.toLowerCase())) {
                              pass = false;
                            }
                          }
                          return pass;
                        });
                        return `${filteredItems.length} item(s) found`;
                      })()}
                    </td>
                  </tr>
                ) : null}
              </thead>
              <tbody>
                {(() => {
                  // Apply search filters to the suppliers data
                  let filteredSuppliers = suppliers || [];
                  
                  if (dateSearchTerm || vendorIdSearchTerm || vendorNameSearchTerm) {
                    filteredSuppliers = suppliers.filter(supplier => {
                      let pass = true;
                      
                      // Apply date search filter
                      if (dateSearchTerm) {
                        const supplierDate = supplier.createdAt ? supplier.createdAt.slice(0, 10) : '';
                        if (!supplierDate.includes(dateSearchTerm)) {
                          pass = false;
                        }
                      }
                      
                      // Apply vendor ID search filter
                      if (vendorIdSearchTerm) {
                        const supplierId = supplier.supplierCode || '';
                        if (!supplierId.toLowerCase().includes(vendorIdSearchTerm.toLowerCase())) {
                          pass = false;
                        }
                      }
                      
                      // Apply vendor name search filter
                      if (vendorNameSearchTerm) {
                        const supplierName = supplier.name || '';
                        if (!supplierName.toLowerCase().includes(vendorNameSearchTerm.toLowerCase())) {
                          pass = false;
                        }
                      }
                      
                      return pass;
                    });
                  }
                  
                  if (filteredSuppliers.length === 0) {
                    return (
                  <tr>
                    <td colSpan={5}>NO DATA FOUND</td>
                  </tr>
                    );
                  }
                  
                  return filteredSuppliers.map((supplier, index) => (
                    <tr
                      key={supplier.id}
                      className="animated-row"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <td>{((pageNo - 1) * limit) + index + 1}</td>
                      <td>{supplier.createdAt.slice(0, 10)}</td>
                      <td>{supplier.supplierCode}</td>
                      <td>{supplier.name}</td>
                      <td className={styles.delcol}>
                        <EditVendorViewModal supplier={supplier} />
                        <DeleteModal supplier={supplier} changeTrigger={changeTrigger}/>
                      </td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="row m-0 p-0 pt-3 justify-content-between">
              <div className={`col-2 m-0 p-0 ${styles.buttonbox}`}>
                {pageNo > 1 && (
                  <button onClick={() => setPageNo(pageNo - 1)}>
                    <span>
                      <FaArrowLeftLong />
                    </span>{" "}
                    Previous
                  </button>
                )}
              </div>
              <div className="col-4 text-center">
                <span className="text-muted">
                  Page {pageNo} of {totalPages || 1}
                </span>
              </div>
              <div className={`col-2 m-0 p-0 ${styles.buttonbox}`}>
                {pageNo < totalPages && (
                  <button onClick={() => setPageNo(pageNo + 1)}>
                    Next{" "}
                    <span>
                      <FaArrowRightLong />
                    </span>
                  </button>
                )}
              </div>
            </div>
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

export default Vendors;
