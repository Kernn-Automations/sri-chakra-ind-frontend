import React, { useState, useContext, useEffect, useRef } from "react";
import OtpInput from "react-otp-input";
import axios from "axios";
import Loading from "./Loading";
import ErrorModal from "./ErrorModal";
import styles from "./Login.module.css";
import { useAuth } from "../Auth";

function OTP({ email, resendOtp, setLogin, setUser }) {
  const { saveTokens } = useAuth();
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const VITE_API = import.meta.env.VITE_API_URL;

  const persistActiveStore = (storeInfo, fallbackId) => {
    if (!storeInfo && !fallbackId) {
      localStorage.removeItem("activeStore");
      return;
    }

    const resolvedId =
      storeInfo?.id ||
      storeInfo?.storeId ||
      storeInfo?.store_id ||
      storeInfo?.assignedStoreId ||
      fallbackId ||
      null;

    if (!resolvedId) {
      localStorage.removeItem("activeStore");
      return;
    }

    const payload = {
      id: resolvedId,
      name: storeInfo?.name || storeInfo?.storeName || storeInfo?.title || "",
      code: storeInfo?.storeCode || storeInfo?.code || "",
      type: storeInfo?.storeType || storeInfo?.type || "",
    };

    localStorage.setItem("activeStore", JSON.stringify(payload));
  };

  // Add ref for auto-focus functionality
  const otpInputRef = useRef(null);

  // Auto-focus on the first OTP input when component mounts
  useEffect(() => {
    // Small delay to ensure the OTP input is fully rendered
    const timer = setTimeout(() => {
      // Try to find the first OTP input using the ref
      if (otpInputRef.current) {
        const firstInput = otpInputRef.current.querySelector("input");
        if (firstInput) {
          firstInput.focus();
          firstInput.select();
        }
      }

      // Fallback: try multiple selectors to find the first OTP input
      if (!otpInputRef.current) {
        const firstInput =
          document.querySelector(".otp-input input") ||
          document.querySelector('[data-testid="otp-input"]') ||
          document.querySelector('input[type="text"]');
        if (firstInput) {
          firstInput.focus();
          firstInput.select();
        }
      }
    }, 200);

    return () => clearTimeout(timer);
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Detect if running on mobile device
    const isMobileDevice =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent,
      );
    const isMobileBrowser = window.innerWidth <= 768 || isMobileDevice;

    try {
      const res = await axios.post(
        `${VITE_API}/auth/verify`,
        {
          mobile: email,
          otp,
          allowMobile: true, // Explicitly allow mobile login
          deviceType: isMobileBrowser ? "mobile" : "web",
        },
        {
          headers: {
            "X-Allow-Mobile": "true", // Header to indicate mobile access should be allowed
            "X-Device-Type": isMobileBrowser ? "mobile" : "web",
          },
        },
      );

      if (res.status === 200) {
        console.log("OTP.jsx - OTP verified successfully, storing tokens...");
        console.log("OTP.jsx - Backend response data:", res.data);

        // Store both tokens using Auth context
        saveTokens(res.data.accessToken, res.data.refreshToken);

        const baseUserData = res.data.data?.user || res.data.data || {};
        let userPayload = {
          ...baseUserData,
          roles: res.data.roles || baseUserData.roles,
          showDivisions: res.data.showDivisions ?? baseUserData.showDivisions,
          userDivision: res.data.userDivision || baseUserData.userDivision,
        };
        console.log("OTP.jsx - Created userPayload:", userPayload);
        console.log("OTP.jsx - showDivisions flag:", userPayload.showDivisions);

        try {
          const profileResponse = await axios.get(`${VITE_API}/auth/me`, {
            headers: {
              Authorization: `Bearer ${res.data.accessToken}`,
            },
          });

          const profileData =
            profileResponse.data?.data || profileResponse.data;
          if (profileData && typeof profileData === "object") {
            const normalizedProfile = profileData.user || profileData;
            const resolvedStore =
              normalizedProfile.store ||
              normalizedProfile.storeDetails ||
              normalizedProfile.assignedStore ||
              normalizedProfile.employeeStore ||
              profileData.defaultStore ||
              (Array.isArray(normalizedProfile.stores)
                ? normalizedProfile.stores[0]
                : null);

            const resolvedStoreId =
              normalizedProfile.storeId ||
              normalizedProfile.store_id ||
              normalizedProfile.assignedStoreId ||
              resolvedStore?.id ||
              resolvedStore?.storeId ||
              resolvedStore?.store_id;

            // Store requiresStoreSelection and assignedStores from /auth/me response
            const requiresStoreSelection =
              profileData.requiresStoreSelection === true ||
              profileData.storeSelectionRequired === true;
            const assignedStores = profileData.assignedStores || [];
            const defaultStore = profileData.defaultStore;

            userPayload = {
              ...userPayload,
              ...normalizedProfile,
              roles: normalizedProfile.roles || userPayload.roles,
              showDivisions:
                typeof normalizedProfile.showDivisions === "boolean"
                  ? normalizedProfile.showDivisions
                  : userPayload.showDivisions,
              userDivision:
                normalizedProfile.userDivision || userPayload.userDivision,
              store:
                resolvedStore || normalizedProfile.store || userPayload.store,
              storeId: resolvedStoreId || userPayload.storeId,
              requiresStoreSelection: requiresStoreSelection,
              assignedStores: assignedStores,
              defaultStore: defaultStore,
              isStoreManager: profileData.isStoreManager || false,
            };

            // Store the full profile data for later use
            localStorage.setItem(
              "authMeData",
              JSON.stringify({
                requiresStoreSelection: requiresStoreSelection,
                assignedStores: assignedStores,
                defaultStore: defaultStore,
                isStoreManager: profileData.isStoreManager || false,
              }),
            );

            if (resolvedStore || resolvedStoreId) {
              const finalStoreId = resolvedStoreId;

              // Existing logic (keep this)
              persistActiveStore(
                resolvedStore || userPayload.store,
                finalStoreId,
              );

              // 🔴 ADD THESE LINES (NORMALIZATION FIX)
              if (finalStoreId) {
                localStorage.setItem("currentStoreId", finalStoreId.toString());

                localStorage.setItem(
                  "selectedStore",
                  JSON.stringify({
                    id: finalStoreId,
                    name: resolvedStore?.name || userPayload.store?.name || "",
                  }),
                );
              }
            } else if (userPayload.storeId) {
              persistActiveStore(userPayload.store, userPayload.storeId);

              // 🔴 ADD THIS TOO (fallback path)
              localStorage.setItem(
                "currentStoreId",
                userPayload.storeId.toString(),
              );
            } else {
              persistActiveStore(null, null);
            }
          }
        } catch (profileError) {
          console.error("Failed to fetch extended user profile:", profileError);
          if (userPayload.store || userPayload.storeId) {
            persistActiveStore(userPayload.store, userPayload.storeId);
          } else {
            persistActiveStore(null, null);
          }
        }

        localStorage.setItem("user", JSON.stringify(userPayload));

        // 3) update your parent Login state
        setUser({
          accesstoken: res.data.accessToken,
          refresh: res.data.refreshToken,
          user: userPayload,
        });
        setLogin(true);
      } else {
        throw new Error("Incorrect OTP");
      }
    } catch (e) {
      console.error("OTP verify failed:", e);
      setError(e.response?.data?.message || e.message || "OTP failed");
      setIsModalOpen(true);
      setOtp("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={onSubmit}>
        <label className={styles.otplabel}>OTP</label>
        <div className={styles.otps} ref={otpInputRef}>
          <OtpInput
            value={otp}
            onChange={setOtp}
            numInputs={6}
            renderSeparator={<span></span>}
            renderInput={(props) => (
              <input
                className={styles.otps}
                {...props}
                required
                autoFocus={props.index === 0}
                type="number"
              />
            )}
            shouldAutoFocus={true}
          />
        </div>
        <p className={styles.resend}>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              resendOtp();
            }}
          >
            Resend Again
          </a>
        </p>

        {!loading && (
          <button className={styles.verifybutton}>Verify OTP</button>
        )}
        {loading && <Loading />}
      </form>

      {isModalOpen && (
        <ErrorModal
          isOpen={isModalOpen}
          message={error}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
}

export default OTP;
