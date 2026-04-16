import { useState } from "react";
import axios from "axios";
import Loading from "./Loading";
import ErrorModal from "./ErrorModal";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { normalizeLoginUser } from "../utils/normalizeLoginUser";
import { useAuth } from "../Auth";

const styles = {
  inputbox: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
  },
  wel: {
    marginBottom: "4px",
  },
  welHeading: {
    fontSize: "22px",
    fontWeight: "700",
    color: "#1e293b",
    margin: "0",
  },
  p: {
    fontSize: "13px",
    color: "#64748b",
    margin: "0 0 20px",
  },
  label: {
    display: "block",
    fontSize: "12px",
    fontWeight: "600",
    color: "#475569",
    marginBottom: "6px",
    marginTop: "14px",
  },
  input: {
    width: "100%",
    padding: "10px 14px",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    fontSize: "14px",
    color: "#1e293b",
    background: "#f8fafc",
    outline: "none",
    fontFamily: "inherit",
    boxSizing: "border-box",
  },
  inputFocused: {
    borderColor: "#2563eb",
    boxShadow: "0 0 0 3px rgba(37,99,235,0.1)",
    background: "#ffffff",
  },
  passwordWrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  passwordInput: {
    width: "100%",
    padding: "10px 40px 10px 14px",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    fontSize: "14px",
    color: "#1e293b",
    background: "#f8fafc",
    outline: "none",
    fontFamily: "inherit",
    boxSizing: "border-box",
  },
  eyeIcon: {
    position: "absolute",
    right: "12px",
    color: "#94a3b8",
    cursor: "pointer",
    fontSize: "14px",
    display: "flex",
    alignItems: "center",
    userSelect: "none",
  },
  sendbutton: {
    width: "100%",
    marginTop: "24px",
    padding: "11px",
    background: "#2563eb",
    border: "none",
    borderRadius: "8px",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "background 0.2s",
  },
  sendbuttonDisabled: {
    background: "#93c5fd",
    cursor: "not-allowed",
  },
  /* Change password modal */
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modalBox: {
    background: "#ffffff",
    borderRadius: "12px",
    padding: "32px 28px",
    width: "90%",
    maxWidth: "400px",
    boxShadow: "0 16px 48px rgba(0,0,0,0.18)",
    display: "flex",
    flexDirection: "column",
  },
  modalHeading: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#1e293b",
    margin: "0 0 6px",
  },
};

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

  const [mobileFocused, setMobileFocused] = useState(false);
  const [passFocused, setPassFocused] = useState(false);
  const [newPassFocused, setNewPassFocused] = useState(false);
  const [confirmPassFocused, setConfirmPassFocused] = useState(false);

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
      <div style={styles.inputbox}>
        <div style={styles.wel}>
          <h1 style={styles.welHeading}>Welcome!</h1>
        </div>

        <form onSubmit={onSubmit}>
          <p style={styles.p}>Login to continue</p>

          <label style={styles.label}>Mobile number</label>
          <input
            type="tel"
            maxLength={10}
            value={email}
            onChange={onChangeMobile}
            onFocus={() => setMobileFocused(true)}
            onBlur={() => setMobileFocused(false)}
            style={{
              ...styles.input,
              ...(mobileFocused ? styles.inputFocused : {}),
            }}
            required
          />

          <label style={styles.label}>Password</label>
          <div style={styles.passwordWrapper}>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setPassFocused(true)}
              onBlur={() => setPassFocused(false)}
              style={{
                ...styles.passwordInput,
                ...(passFocused ? styles.inputFocused : {}),
              }}
              required
            />
            <span
              style={styles.eyeIcon}
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          <button
            style={{
              ...styles.sendbutton,
              ...(loading ? styles.sendbuttonDisabled : {}),
            }}
            disabled={loading}
          >
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
        <div style={styles.modalOverlay}>
          <div style={styles.modalBox}>
            <h3 style={styles.modalHeading}>Change Password</h3>
            <p style={styles.p}>
              You must change your password before continuing.
            </p>

            <label style={styles.label}>New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              onFocus={() => setNewPassFocused(true)}
              onBlur={() => setNewPassFocused(false)}
              style={{
                ...styles.input,
                ...(newPassFocused ? styles.inputFocused : {}),
              }}
            />

            <label style={styles.label}>Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onFocus={() => setConfirmPassFocused(true)}
              onBlur={() => setConfirmPassFocused(false)}
              style={{
                ...styles.input,
                ...(confirmPassFocused ? styles.inputFocused : {}),
              }}
            />

            <button
              style={{
                ...styles.sendbutton,
                ...(loading ? styles.sendbuttonDisabled : {}),
              }}
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
