import React, { useEffect, useState } from "react";
import ModifyProductForm from "./ModifyProductForm";
import { useAuth } from "@/Auth";
import Loading from "@/components/Loading";
import ErrorModal from "@/components/ErrorModal";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { CheckCircle, Package, Filter, Search } from "lucide-react";

function ModifyProduct({ navigate, isAdmin }) {
  const [viewclick, setViewclick] = useState();
  const [product, setProduct] = useState();
  const [error, setError] = useState();
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [products, setProducts] = useState();
  const [divisions, setDivisions] = useState([]);
  const [selectedDivisions, setSelectedDivisions] = useState({});
  const [updatingDivision, setUpdatingDivision] = useState(false);
  const [visiblePrices, setVisiblePrices] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const { axiosAPI } = useAuth();

  const onViewClick = (product) => {
    viewclick ? setViewclick(false) : setViewclick(true);
    if (product) setProduct(product);
    else setProduct(null);
  };

  /* -------------------------
   * AUTO-HIDE SUCCESS MESSAGE
   * ------------------------- */
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage("");
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  /* -------------------------
   * INDIAN NUMBER FORMATTING
   * ------------------------- */
  const formatIndianNumber = (num) => {
    if (!num) return "0";
    const number = parseFloat(num);
    if (isNaN(number)) return "0";
    return number.toLocaleString("en-IN", {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    });
  };

  const handleDivisionChange = async (product, value) => {
    if (
      (value === "all" && product.division?.id === null) ||
      Number(value) === product.division?.id
    ) {
      return;
    }

    setUpdatingDivision(true);

    setSelectedDivisions((prev) => ({
      ...prev,
      [product.id]: value,
    }));

    try {
      await axiosAPI.put(`/products/${product.id}/division`, {
        divisionId: value === "all" ? null : Number(value),
      });

      product.division = {
        id: value === "all" ? null : Number(value),
        name:
          value === "all"
            ? "All"
            : divisions.find((d) => d.id === Number(value))?.name || "Unknown",
      };

      setSuccessMessage("Division updated successfully");
    } catch (e) {
      console.error(e);
      setError("Failed to update product division");
      setIsModalOpen(true);

      setSelectedDivisions((prev) => ({
        ...prev,
        [product.id]:
          product.division?.id === null ? "all" : product.division?.id,
      }));
    } finally {
      setUpdatingDivision(false);
    }
  };

  useEffect(() => {
    async function fetchDivisions() {
      try {
        const res = await axiosAPI.get("/divisions");
        setDivisions(res.data.data || []);
      } catch (e) {
        console.error("Failed to fetch divisions", e);
      }
    }

    fetchDivisions();
  }, []);

  useEffect(() => {
    if (products && products.length > 0) {
      const initialDivisions = {};

      products.forEach((p) => {
        initialDivisions[p.id] =
          p.division?.id === null ? "all" : p.division?.id;
      });

      setSelectedDivisions(initialDivisions);
    }
  }, [products]);

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleStatusToggle = async (productId, currentStatus) => {
    try {
      const newStatus = currentStatus === "Active" ? "Inactive" : "Active";
      await axiosAPI.put(`/products/${productId}/status`, {
        status: newStatus,
      });

      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, status: newStatus } : p)),
      );

      setSuccessMessage(`Product ${newStatus.toLowerCase()} successfully`);
    } catch (e) {
      setError("Failed to update status");
      setIsModalOpen(true);
    }
  };

  useEffect(() => {
    async function fetch() {
      try {
        setLoading(true);

        const currentDivisionId = localStorage.getItem("currentDivisionId");
        const currentDivisionName = localStorage.getItem("currentDivisionName");

        let endpoint = `/products?showAll=true&divisionId=${currentDivisionId}`;

        const res = await axiosAPI.get(endpoint);
        setProducts(res.data.products);
      } catch (e) {
        setError(e.response?.data?.message || "Failed to load products");
        setIsModalOpen(true);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, []);

  const togglePriceVisibility = (productId) => {
    setVisiblePrices((prev) => ({
      ...prev,
      [productId]: !prev[productId],
    }));
  };

  // Filter products based on search
  const filteredProducts = products?.filter((product) => {
    const search = searchTerm.toLowerCase();
    return (
      product.name?.toLowerCase().includes(search) ||
      product.SKU?.toLowerCase().includes(search) ||
      product.category?.name?.toLowerCase().includes(search)
    );
  });

  return (
    <div style={styles.page}>
      {/* SUCCESS NOTIFICATION */}
      {successMessage && (
        <div style={styles.successBanner}>
          <div style={styles.successContent}>
            <CheckCircle size={20} />
            <span>{successMessage}</span>
          </div>
          <button style={styles.closeBtn} onClick={() => setSuccessMessage("")}>
            ×
          </button>
        </div>
      )}

      {!viewclick && (
        <>
          <div style={styles.header}>
            <div>
              <h2 style={styles.title}>Product Management</h2>
              <p style={styles.breadcrumb}>
                <span
                  onClick={() => navigate("/products")}
                  style={styles.breadcrumbLink}
                >
                  Products
                </span>
                <span style={styles.breadcrumbSeparator}>›</span>
                <span>Ongoing Products</span>
              </p>
            </div>

            {/* Search Bar */}
            <div style={styles.searchWrapper}>
              <Search size={18} style={styles.searchIcon} />
              <input
                style={styles.searchInput}
                placeholder="Search by name, SKU, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Stats Cards */}
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statIcon}>
                <Package size={24} color="#003176" />
              </div>
              <div>
                <div style={styles.statLabel}>Total Products</div>
                <div style={styles.statValue}>{products?.length || 0}</div>
              </div>
            </div>
            <div style={styles.statCard}>
              <div style={{ ...styles.statIcon, background: "#dcfce7" }}>
                <Package size={24} color="#16a34a" />
              </div>
              <div>
                <div style={styles.statLabel}>Active</div>
                <div style={styles.statValue}>
                  {products?.filter((p) => p.status === "Active").length || 0}
                </div>
              </div>
            </div>
            <div style={styles.statCard}>
              <div style={{ ...styles.statIcon, background: "#fee2e2" }}>
                <Package size={24} color="#dc2626" />
              </div>
              <div>
                <div style={styles.statLabel}>Inactive</div>
                <div style={styles.statValue}>
                  {products?.filter((p) => p.status === "Inactive").length || 0}
                </div>
              </div>
            </div>
          </div>

          {/* Table Card */}
          <div style={styles.tableCard}>
            <div style={styles.tableHeader}>
              <h3 style={styles.tableTitle}>Products List</h3>
              <div style={styles.resultCount}>
                {filteredProducts?.length || 0} results
              </div>
            </div>

            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>S.No</th>
                    <th style={styles.th}>Date</th>
                    <th style={styles.th}>SKU</th>
                    <th style={styles.th}>Product Name</th>
                    <th style={styles.th}>Category</th>
                    <th style={styles.th}>Units</th>
                    {isAdmin && (
                      <>
                        <th style={styles.th}>Purchase Price</th>
                        <th style={styles.th}>Status</th>
                        <th style={styles.th}>Action</th>
                        <th style={styles.th}>Division</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts?.length === 0 && (
                    <tr>
                      <td colSpan={isAdmin ? 10 : 6} style={styles.emptyCell}>
                        <div style={styles.emptyState}>
                          <Package size={48} color="#cbd5e1" />
                          <p style={styles.emptyText}>
                            {searchTerm
                              ? "No products match your search"
                              : "No products found"}
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                  {filteredProducts?.map((product, idx) => (
                    <tr key={product.id} style={styles.tr}>
                      <td style={styles.td}>{idx + 1}</td>
                      <td style={styles.td}>
                        {product.createdAt?.slice(0, 10) || "-"}
                      </td>
                      <td style={styles.td}>
                        <span style={styles.skuBadge}>{product.SKU}</span>
                      </td>
                      <td style={styles.td}>
                        <strong>{product.name}</strong>
                      </td>
                      <td style={styles.td}>{product.category?.name || "-"}</td>
                      <td style={styles.td}>
                        <span style={styles.unitBadge}>
                          {product.productType === "packed"
                            ? product.packageWeightUnit
                            : product.unit}
                        </span>
                      </td>
                      {isAdmin && (
                        <>
                          <td style={styles.td}>
                            <div style={styles.priceCell}>
                              <span style={styles.rupeeSymbolInline}>₹</span>
                              <span>
                                {visiblePrices[product.id]
                                  ? formatIndianNumber(product.purchasePrice)
                                  : "•••••"}
                              </span>
                              <button
                                style={styles.eyeBtn}
                                onClick={() =>
                                  togglePriceVisibility(product.id)
                                }
                              >
                                {visiblePrices[product.id] ? (
                                  <FaEyeSlash size={14} />
                                ) : (
                                  <FaEye size={14} />
                                )}
                              </button>
                            </div>
                          </td>
                          <td style={styles.td}>
                            <div style={styles.statusWrapper}>
                              <label style={styles.toggle}>
                                <input
                                  type="checkbox"
                                  checked={product.status === "Active"}
                                  onChange={() =>
                                    handleStatusToggle(
                                      product.id,
                                      product.status,
                                    )
                                  }
                                />
                                <span
                                  style={{
                                    ...styles.toggleSlider,
                                    ...(product.status === "Active"
                                      ? styles.toggleOn
                                      : styles.toggleOff),
                                  }}
                                />
                                <span
                                  style={{
                                    ...styles.toggleKnob,
                                    transform:
                                      product.status === "Active"
                                        ? "translateX(20px)"
                                        : "translateX(0)",
                                  }}
                                />
                              </label>

                              <span
                                style={{
                                  ...styles.statusPill,
                                  ...(product.status === "Active"
                                    ? styles.statusActive
                                    : styles.statusInactive),
                                }}
                              >
                                {product.status}
                              </span>
                            </div>
                          </td>

                          <td style={styles.td}>
                            <button
                              style={styles.viewBtn}
                              onClick={() => onViewClick(product)}
                            >
                              View Details
                            </button>
                          </td>
                          <td style={styles.td}>
                            <select
                              style={styles.divisionSelect}
                              value={selectedDivisions[product.id]}
                              onChange={(e) =>
                                handleDivisionChange(product, e.target.value)
                              }
                              disabled={updatingDivision}
                            >
                              <option value="all">All Divisions</option>
                              {divisions.map((division) => (
                                <option key={division.id} value={division.id}>
                                  {division.name}
                                </option>
                              ))}
                            </select>
                            <small style={styles.autoSaveText}>
                              Auto-saved
                            </small>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {viewclick && (
        <ModifyProductForm
          onViewClick={onViewClick}
          productId={product.id}
          isAdmin={isAdmin}
        />
      )}

      {isModalOpen && (
        <ErrorModal isOpen={isModalOpen} message={error} onClose={closeModal} />
      )}

      {loading && <Loading />}
    </div>
  );
}

/* -------------------------
 * STYLES
 * ------------------------- */
const styles = {
  page: {
    padding: "32px",
    background: "linear-gradient(to bottom, #f8fafc, #f1f5f9)",
    minHeight: "100vh",
  },
  successBanner: {
    position: "fixed",
    top: "20px",
    right: "20px",
    background: "#10b981",
    color: "white",
    padding: "16px 20px",
    borderRadius: "12px",
    boxShadow: "0 10px 25px rgba(16, 185, 129, 0.3)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "16px",
    zIndex: 1000,
    minWidth: "320px",
  },
  successContent: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    fontSize: "14px",
    fontWeight: "500",
  },
  closeBtn: {
    background: "rgba(255, 255, 255, 0.2)",
    border: "none",
    borderRadius: "6px",
    padding: "4px 8px",
    cursor: "pointer",
    fontSize: "20px",
    color: "white",
    lineHeight: 1,
  },
  header: {
    marginBottom: "32px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: "20px",
  },
  title: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: "8px",
  },
  breadcrumb: {
    fontSize: "14px",
    color: "#64748b",
    margin: 0,
  },
  breadcrumbLink: {
    cursor: "pointer",
    color: "#003176",
    fontWeight: "500",
  },
  breadcrumbSeparator: {
    margin: "0 8px",
    color: "#cbd5e1",
  },
  searchWrapper: {
    position: "relative",
    width: "100%",
    maxWidth: "400px",
  },
  searchIcon: {
    position: "absolute",
    left: "16px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "#94a3b8",
    pointerEvents: "none",
  },
  searchInput: {
    width: "100%",
    padding: "12px 16px 12px 44px",
    borderRadius: "12px",
    border: "2px solid #e2e8f0",
    fontSize: "14px",
    outline: "none",
    transition: "all 0.2s",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "20px",
    marginBottom: "32px",
  },
  statCard: {
    background: "white",
    padding: "20px",
    borderRadius: "16px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
    border: "1px solid #e2e8f0",
  },
  statIcon: {
    width: "56px",
    height: "56px",
    borderRadius: "12px",
    background: "#dbeafe",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  statLabel: {
    fontSize: "13px",
    color: "#64748b",
    marginBottom: "4px",
    fontWeight: "500",
  },
  statValue: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#1e293b",
  },

  statusWrapper: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },

  toggle: {
    position: "relative",
    display: "inline-block",
    width: "42px",
    height: "22px",
  },

  toggleSlider: {
    position: "absolute",
    cursor: "pointer",
    inset: 0,
    borderRadius: "999px",
    transition: "all 0.25s ease",
  },
  toggleKnob: {
    position: "absolute",
    height: "16px",
    width: "16px",
    left: "3px",
    top: "3px",
    backgroundColor: "white",
    borderRadius: "50%",
    transition: "transform 0.25s ease",
  },

  toggleOn: {
    backgroundColor: "#22c55e",
  },

  toggleOff: {
    backgroundColor: "#cbd5e1",
  },

  statusPill: {
    padding: "4px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "600",
    lineHeight: 1.4,
    whiteSpace: "nowrap",
  },

  tableCard: {
    background: "white",
    borderRadius: "16px",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
    border: "1px solid #e2e8f0",
    overflow: "hidden",
  },
  tableHeader: {
    padding: "24px",
    borderBottom: "2px solid #f1f5f9",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tableTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#1e293b",
    margin: 0,
  },
  resultCount: {
    fontSize: "14px",
    color: "#64748b",
    fontWeight: "500",
  },
  tableWrapper: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    padding: "16px",
    textAlign: "left",
    fontSize: "12px",
    fontWeight: "600",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    background: "#f8fafc",
    borderBottom: "2px solid #e2e8f0",
    whiteSpace: "nowrap",
  },
  tr: {
    transition: "background 0.2s",
    borderBottom: "1px solid #f1f5f9",
  },
  td: {
    padding: "16px",
    fontSize: "14px",
    color: "#475569",
    verticalAlign: "middle",
  },
  emptyCell: {
    padding: 0,
    border: "none",
  },
  emptyState: {
    textAlign: "center",
    padding: "64px 24px",
  },
  emptyText: {
    marginTop: "16px",
    fontSize: "15px",
    color: "#64748b",
  },
  skuBadge: {
    display: "inline-block",
    padding: "4px 12px",
    background: "#f1f5f9",
    borderRadius: "6px",
    fontSize: "13px",
    fontWeight: "600",
    color: "#475569",
    fontFamily: "monospace",
  },
  unitBadge: {
    display: "inline-block",
    padding: "4px 10px",
    background: "#dbeafe",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "600",
    color: "#003176",
    textTransform: "uppercase",
  },
  priceCell: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  rupeeSymbolInline: {
    color: "#64748b",
    fontWeight: "600",
    fontSize: "13px",
  },
  eyeBtn: {
    background: "none",
    border: "none",
    padding: "4px",
    cursor: "pointer",
    color: "#64748b",
    display: "flex",
    alignItems: "center",
    transition: "color 0.2s",
  },
  switch: {
    position: "relative",
    display: "inline-block",
    width: "44px",
    height: "24px",
    marginBottom: "8px",
  },
  slider: {
    position: "absolute",
    cursor: "pointer",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "#cbd5e1",
    transition: "0.3s",
    borderRadius: "24px",
  },
  statusBadge: {
    display: "inline-block",
    padding: "4px 12px",
    borderRadius: "12px",
    fontSize: "12px",
    fontWeight: "600",
    textAlign: "center",
  },
  statusActive: {
    background: "#dcfce7",
    color: "#16a34a",
  },
  statusInactive: {
    background: "#fee2e2",
    color: "#dc2626",
  },
  viewBtn: {
    padding: "8px 16px",
    background: "#003176",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  divisionSelect: {
    width: "100%",
    padding: "8px 12px",
    borderRadius: "8px",
    border: "2px solid #e2e8f0",
    fontSize: "13px",
    outline: "none",
    marginBottom: "4px",
  },
  autoSaveText: {
    fontSize: "11px",
    color: "#94a3b8",
    fontStyle: "italic",
  },
};

export default ModifyProduct;
