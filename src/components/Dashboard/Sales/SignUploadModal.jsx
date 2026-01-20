import React, { useState } from "react";
import styles from "./Sales.module.css";
import {
  DialogActionTrigger,
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogRoot,
  DialogTrigger,
} from "@/components/ui/dialog";
import axios from "axios";
import Loading from "@/components/Loading";
import ErrorModal from "@/components/ErrorModal";

function SignUploadModal({ orderId, closeDialog }) {
  const [signatureFile, setSignatureFile] = useState(null);
  const [signaturePreview, setSignaturePreview] = useState(null);

  const [error, setError] = useState();
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successful, setSuccessful] = useState(null);
  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleSignatureUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSignatureFile(file);
      setSignaturePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmitSignature = async () => {
    if (!signatureFile) {
      alert("Please upload a signature.");
      return;
    }

    const token = localStorage.getItem("accessToken");
    const VITE_API = import.meta.env.VITE_API_URL;

    const formData = new FormData();
    formData.append("salesOrderId", orderId);
    formData.append("signedInvoice", signatureFile);

    // console.log(order)

    try {
      setLoading(true);
      const res = await axios.post(
        `${VITE_API}/sales-orders/upload-signed-invoice`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      console.log(res);
      setSuccessful(res.data.message);
    } catch (e) {
      console.log(e);
      setError(e.response.data.message || "Unable to upload");
      setIsModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <DialogRoot placement={"center"} size={"lg"} className={styles.mdl}>
        <DialogTrigger asChild>
          <p className={styles.signtext}>Didn't recieved OTP?</p>
        </DialogTrigger>
        <DialogContent className="mdl">
          <DialogBody>
            <div className="flex flex-col gap-4 p-4">
              <h2 className="text-xl font-semibold text-gray-700">
                Alternative Verification
              </h2>
              <p className="text-sm text-gray-600">
                If you didn’t receive the OTP, please upload the customer’s
                signature for verification.
              </p>

              {/* Signature Upload Section */}
              <label className="text-sm font-medium text-gray-700">
                Upload Signature:
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleSignatureUpload}
                className="border p-2 rounded-md"
              />

              {/* Optional: Preview uploaded signature */}
              {signaturePreview && (
                <div className="row m-0 p-3 justify-content-center">
                  <p className="text-sm font-medium text-gray-600">Preview:</p>
                  <div className="col-6">
                    <img
                      src={signaturePreview}
                      alt="Signature Preview"
                      className={styles.imagemd}
                    />
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="row m-0 p-2 justify-content-end">
                {!loading && !successful && (
                  <div className="col-5">
                    <DialogActionTrigger asChild>
                      <button className="cancelbtn">Cancel</button>
                    </DialogActionTrigger>
                    <button
                      className="submitbtn"
                      onClick={handleSubmitSignature}
                    >
                      Upload
                    </button>
                  </div>
                )}
                {successful && (
                  <div className="col-8">
                    <DialogActionTrigger asChild>
                      <button className="submitbtn" onClick={closeDialog}>
                        {successful}
                      </button>
                    </DialogActionTrigger>
                  </div>
                )}
                {loading && <Loading />}
                {isModalOpen && (
                  <ErrorModal
                    isOpen={isModalOpen}
                    message={error}
                    onClose={closeModal}
                  />
                )}
              </div>
            </div>
          </DialogBody>
          <DialogCloseTrigger className="inputcolumn-mdl-close" />
        </DialogContent>
      </DialogRoot>
    </>
  );
}

export default SignUploadModal;
