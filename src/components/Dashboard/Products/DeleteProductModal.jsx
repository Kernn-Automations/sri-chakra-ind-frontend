import styles from "./Products.module.css";
import React, { useEffect, useState } from "react";
import { DialogActionTrigger } from "@/components/ui/dialog";
import Loading from "@/components/Loading";
import ErrorModal from "@/components/ErrorModal";
import { useAuth } from "@/Auth";

function DeleteProductModal() {
  const onSubmit = (e) => e.preventDefault();

  const [products, setProducts] = useState();

  const { axiosAPI } = useAuth();

  const [error, setError] = useState();
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const closeModal = () => {
    setIsModalOpen(false);
  };

  // const [issuccessModalOpen, setIssuccessModalOpen] = useState(false);
  // const closesuccessModal = () => {
  //   setIssuccessModalOpen(false);
  // };

  useEffect(() => {
    async function fetch() {
      try {
        setLoading(true);
        
        // ✅ Get division ID from localStorage for division filtering
        const currentDivisionId = localStorage.getItem('currentDivisionId');
        const currentDivisionName = localStorage.getItem('currentDivisionName');
        
        // ✅ Add division parameters to endpoint
        let endpoint = "/products/list";
        if (currentDivisionId && currentDivisionId !== '1') {
          endpoint += `?divisionId=${currentDivisionId}`;
        } else if (currentDivisionId === '1') {
          endpoint += `?showAllDivisions=true`;
        }
        
        console.log('DeleteProductModal - Fetching products with endpoint:', endpoint);
        console.log('DeleteProductModal - Division ID:', currentDivisionId);
        console.log('DeleteProductModal - Division Name:', currentDivisionName);
        
        const res = await axiosAPI.get(endpoint);
        // console.log(res);
        setProducts(res.data.products);
      } catch (e) {
        // console.log(e);
        setError(e.response.data.message);
        setIsModalOpen(true);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, []);

  const [product, setProduct] = useState();

  const onDelete = () => {
    if (!product) {
      setError("Please select one product");
      setIsModalOpen(true);
      return;
    }

    async function del() {
      try {
        setLoading(true);
        const res = await axiosAPI.delete(`/product/delete/${product}`);
        // console.log(res);
        setError(res.data.message);
        setIssuccessModalOpen(true);
      } catch (e) {
        // console.log(e);
        setError(e.response.data.message);
        setIsModalOpen(true);
      } finally {
        setLoading(false);
      }
    }
    del();
  };

  return (
    <>
      <h3 className={`px-3 pb-3 mdl-title`}>Delete product</h3>
      <form action="" onSubmit={onSubmit}>
        <div className="row pt-3 justify-content-center">
          {products && (
            <div className={`col inputcolumn-mdl`}>
              <select
                name=""
                id=""
                className={styles.delsec}
                onChange={(e) =>
                  setProduct(e.target.value === "null" ? null : e.target.value)
                }
              >
                <option value="null">--Select Product--</option>
                {products.map((prod) => (
                  <option value={prod.id}>{prod.name}</option>
                ))}
              </select>
            </div>
          )}

          {isModalOpen && (
            <ErrorModal
              isOpen={isModalOpen}
              message={error}
              onClose={closeModal}
            />
          )}
        </div>
        {!loading && (
          <div className="row pt-3 justify-content-center">
            <div className={`col-5`}>
              <button
                type="button"
                className={` cancelbtn`}
                data-bs-dismiss="modal"
                onClick={onDelete}
              >
                Delete
              </button>

              <DialogActionTrigger asChild>
                <button
                  type="button"
                  className={`submitbtn`}
                  data-bs-dismiss="modal"
                >
                  Close
                </button>
              </DialogActionTrigger>
            </div>
          </div>
        )}
      </form>

      {loading && <Loading />}
      {isModalOpen && (
        <ErrorModal isOpen={isModalOpen} message={error} onClose={closeModal} />
      )}
    </>
  );
}

export default DeleteProductModal;
