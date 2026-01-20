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
import SignUploadModal from "./SignUploadModal";
import { useAuth } from "@/Auth";

function VerifyOTP({
  orderId,
  order,
  actionLoading,
  setActionLoading,
  enteredOtp,
  setEnteredOtp,
  handleSendOtp,
  isDialogOpen,
  setIsDialogOpen,
  closeDialog,
}) {
  const [error, setError] = useState();
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const closeModal = () => setIsModalOpen(false);

  const { axiosAPI } = useAuth();

  const onVerify = async () => {
    console.log("started");
    if (!enteredOtp) {
      setError("OTP is required");
      console.log("if");
      setIsModalOpen(true);
      return;
    }
    try {
      setActionLoading(true);
      console.log("reqs");
      const res = await axiosAPI.post(`/sales-orders/${orderId}/deliver`, {
        otp: enteredOtp,
      });
      console.log(res);
      setOrder({
        ...order,
        orderStatus: res.data.orderStatus,
      });
      setShowOtpModal(false);
    } catch (err) {
      console.log(err);
      setError(err.response?.data?.message || "OTP verification failed");
      setIsModalOpen(true);
    } finally {
      setActionLoading(false);
    }
  };
  return (
    <>
      <DialogRoot
        placement={"center"}
        size={"md"}
        className={styles.mdl}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      >
        <DialogContent className="mdl">
          <DialogBody>
            <div
              className="modal-content p-3"
              style={{ background: "var(--primary-light)" }}
            >
              <h5>Enter Delivery OTP</h5>
              <input
                type="number"
                className={styles.delsec}
                placeholder="Enter OTP"
                maxLength={6}
                value={enteredOtp}
                onChange={(e) => setEnteredOtp(e.target.value)}
              />
              <SignUploadModal orderId={orderId} closeDialog={closeDialog} />
              <div className="d-flex justify-content-end gap-2">
                <button
                  className="cancelbtn"
                  onClick={() => {
                    setEnteredOtp("");
                    closeDialog();
                  }}
                >
                  Cancel
                </button>

                <button
                  className="submitbtn"
                  disabled={actionLoading}
                  onClick={onVerify}
                >
                  {actionLoading ? "Verifying..." : "Confirm"}
                </button>
              </div>
            </div>
          </DialogBody>
          <DialogCloseTrigger className="inputcolumn-mdl-close" />
        </DialogContent>
      </DialogRoot>
    </>
  );
}

export default VerifyOTP;
