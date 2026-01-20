import React, { useState, useMemo, useEffect } from "react";
import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogRoot,
} from "@/components/ui/dialog";
import styles from "./Sales.module.css";
import { useAuth } from "@/Auth";

function ComplementryModal({
  openComplementryModal,
  setOpenComplementryModal,
  isComplementryAdded,
  setIsComplementryAdded,
  complimentries = [],
  setComplimentries,
  products = [],
  orderId,
}) {
  const [currentRow, setCurrentRow] = useState({ productId: "", bags: "" });

  const { axiosAPI } = useAuth();

  // ✅ Compute available products excluding already added ones
  const availableProducts = useMemo(() => {
    const addedIds = new Set(complimentries.map((c) => String(c.productId)));
    return products.filter((p) => !addedIds.has(String(p.id)));
  }, [products, complimentries]);

  // ✅ Handle input changes
  const handleRowChange = (field, value) => {
    setCurrentRow((prev) => ({ ...prev, [field]: value }));
  };

  // ✅ Add new product to complimentries
  const handleAddProduct = () => {
    if (!currentRow.productId || !currentRow.bags) return;

    setComplimentries((prev) => {
      const updated = [...(prev || []), { ...currentRow }];
      return updated;
    });

    setCurrentRow({ productId: "", bags: "" });
    setIsComplementryAdded(true);
  };

  // ✅ Remove product and re-enable it in dropdown
  const handleRemoveProduct = (productId) => {
    setComplimentries((prev) =>
      (prev || []).filter((c) => String(c.productId) !== String(productId))
    );
  };

  const [pastcomps, setPastcomps] = useState();
  const [loading, setLoading] = useState();

  useEffect(() => {
    async function fetch(params) {
      try {
        setLoading(true);
        const res = await axiosAPI.get(
          `/sales-orders/${orderId}/partial-dispatch-status`
        );
        console.log(res);
        setPastcomps(res.data.complimentaryItems);
      } catch (e) {
        console.log(e);
      } finally {
        setLoading(false);
      }
    }

    fetch();
  }, []);

  return (
    <DialogRoot
      placement="center"
      size="md"
      className={styles.mdl}
      open={openComplementryModal}
      onOpenChange={setOpenComplementryModal}
    >
      <DialogContent className="mdl">
        <DialogBody>
          <h5>Products Quantity</h5>

          {loading && <p>Loading...</p>}

          {pastcomps && (
            <div className={styles.compDetails}>
              <h6>Past Complementries</h6>
              {pastcomps.length === 0 && <p>No Past Complimentries</p>}
              {pastcomps.map((comp) => {
                const product = products.find(
                  (p) => String(p.id) === String(comp.productId)
                );
                return (
                  <p>
                    <span>{product?.name || comp.productId} : </span>
                    {comp.bags} Bags
                  </p>
                );
              })}
            </div>
          )}

          <table
            className={`table table-bordered mt-3 borderedtable ${styles.dispatchTable}`}
          >
            <thead>
              <tr>
                <th>Product</th>
                <th>No of Bags</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {/* ✅ Existing added products */}
              {(complimentries || []).map((item) => {
                const product = products.find(
                  (p) => String(p.id) === String(item.productId)
                );
                return (
                  <tr key={item.productId}>
                    <td>{product?.name || item.productId}</td>
                    <td>{item.bags}</td>
                    <td>
                      <button
                        className="cancelbtn"
                        onClick={() => handleRemoveProduct(item.productId)}
                      >
                        <i class="bi bi-trash3"></i>
                      </button>
                    </td>
                  </tr>
                );
              })}

              {/* ✅ Input row for adding new product */}
              <tr>
                <td>
                  <select
                    value={currentRow.productId}
                    onChange={(e) =>
                      handleRowChange("productId", e.target.value)
                    }
                  >
                    <option value="">Select Product</option>
                    {availableProducts.map((prod) => (
                      <option key={prod.id} value={prod.id}>
                        {prod.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <input
                    type="number"
                    value={currentRow.bags}
                    onChange={(e) => handleRowChange("bags", e.target.value)}
                    min="1"
                  />
                </td>
                <td>
                  <button onClick={handleAddProduct}>Add</button>
                </td>
              </tr>
            </tbody>
          </table>

          <div className="d-flex justify-content-end gap-2 py-3">
            <button
              className="cancelbtn"
              onClick={() => {
                setIsComplementryAdded(false);
                setOpenComplementryModal(false);
              }}
            >
              Cancel
            </button>
            <button
              className="submitbtn"
              onClick={() => {
                setOpenComplementryModal(false);
                console.log("Final complementries:", complimentries);
              }}
            >
              Done
            </button>
          </div>
        </DialogBody>

        <DialogCloseTrigger className="inputcolumn-mdl-close" asChild>
          <button onClick={() => setOpenComplementryModal(false)}>
            <i className="bi bi-x"></i>
          </button>
        </DialogCloseTrigger>
      </DialogContent>
    </DialogRoot>
  );
}

export default ComplementryModal;
