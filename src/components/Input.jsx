import { useState } from "react";
import styles from "./Login.module.css";
import axios from "axios";
import Loading from "./Loading";
import ErrorModal from "./ErrorModal";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { normalizeLoginUser } from "../utils/normalizeLoginUser";
import { useAuth } from "../Auth";

function Input({ setLogin, setUser }) {
  const { saveTokens } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [showChangePassword, setShowChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [employeeId, setEmployeeId] = useState(null);

  const onChangeMobile = (e) => {
    setEmail(e.target.value.replace(/[^0-9]/g, ""));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const VITE_API = import.meta.env.VITE_API_URL;

    try {
      const res = await axios.post(`${VITE_API}/auth/login`, {
        mobile: email,
        password,
        deviceType: "web",
      });
      console.log("Input:", res);
      if (res.status === 200) {
        // 🔥 OTP-STYLE NORMALIZATION
        const normalizedUser = await normalizeLoginUser({
          apiResponse: res.data,
          axios,
          VITE_API,
          saveTokens,
        });

        // 🔥 MATCH OTP STATE SHAPE
        setUser({
          accesstoken: res.data.accessToken,
          refresh: res.data.refreshToken,
          user: normalizedUser,
        });

        setLogin(true);
      }
    } catch (err) {
      const data = err.response?.data;

      if (data?.mustChangePassword) {
        setEmployeeId(data.employeeId);
        localStorage.setItem("changePasswordToken", data.accessToken);
        setShowChangePassword(true);
      } else {
        setError(data?.message || "Invalid credentials");
        setIsModalOpen(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      setError("Please fill all fields");
      setIsModalOpen(true);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      setIsModalOpen(true);
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      setIsModalOpen(true);
      return;
    }

    try {
      setLoading(true);
      const VITE_API = import.meta.env.VITE_API_URL;

      await axios.post(
        `${VITE_API}/auth/change-password`,
        {
          employeeId,
          newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("changePasswordToken")}`,
          },
        },
      );

      // Reset state
      setShowChangePassword(false);
      setNewPassword("");
      setConfirmPassword("");
      setEmployeeId(null);

      setError("Password updated successfully. Please login again.");
      setIsModalOpen(true);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update password");
      setIsModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className={styles.inputbox}>
        <div className={styles.wel}>
          <h1>Welcome!</h1>
        </div>

        <form onSubmit={onSubmit}>
          <p className={styles.p}>Login to continue</p>

          <label className={styles.label}>Mobile number</label>
          <input
            type="tel"
            maxLength={10}
            value={email}
            onChange={onChangeMobile}
            className={styles.input}
            required
          />

          <label className={styles.label}>Password</label>

          <div className={styles.passwordWrapper}>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.input}
              required
            />
            <span
              className={styles.eyeIcon}
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          <button className={styles.sendbutton} disabled={loading}>
            Login
          </button>
        </form>

        {loading && <Loading />}

        {isModalOpen && (
          <ErrorModal
            isOpen={isModalOpen}
            message={error}
            onClose={() => setIsModalOpen(false)}
          />
        )}
      </div>
      {showChangePassword && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalBox}>
            <h3>Change Password</h3>
            <p className={styles.p}>
              You must change your password before continuing.
            </p>

            <label className={styles.label}>New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={styles.input}
            />

            <label className={styles.label}>Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={styles.input}
            />

            <button
              className={styles.sendbutton}
              onClick={handleChangePassword}
              disabled={loading}
            >
              Update Password
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default Input;
