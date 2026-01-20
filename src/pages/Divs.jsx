import React, { useState, useEffect } from "react";
import { normalizeRoleName } from "../utils/roleUtils";
import { useNavigate } from "react-router-dom";
import styles from "./Divs.module.css";
import tokenManager from "../utils/tokenManager";
import feedsLogo from "../assets/logo_no_bg.png";
import { useDivision } from "../components/context/DivisionContext";

const Divs = () => {
  const [divisions, setDivisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectingDivision, setSelectingDivision] = useState(false);
  const [divisionSelected, setDivisionSelected] = useState(false);
  const [error, setError] = useState("");
  const [username, setUsername] = useState("");
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // Get the division context functions
  const { setSelectedDivision, setShowAllDivisions } = useDivision();

  useEffect(() => {
    if (!tokenManager.isAuthenticated()) {
      console.log("Divs.jsx - No valid tokens found, redirecting to login");
      navigate("/login");
      return;
    }

    // Get username and user data from localStorage - try multiple possible field names
    try {
      const userData = JSON.parse(localStorage.getItem("user"));
      if (userData) {
        const userName =
          userData.name ||
          userData.employee_name ||
          userData.username ||
          userData.fullName ||
          "User";
        setUsername(userName);
        setUser(userData);
      } else {
        setUsername("User");
        setUser(null);
      }
    } catch (error) {
      console.error("Error parsing user data:", error);
      setUsername("User");
      setUser(null);
    }
  }, [navigate]);

  // Separate useEffect for fetching divisions after user state is set
  useEffect(() => {
    if (user) {
      fetchDivisions();
    }
  }, [user]);

  const fetchDivisions = async () => {
    try {
      setLoading(true);
      const authHeader = tokenManager.getAuthHeader();
      const VITE_API = import.meta.env.VITE_API_URL;

      console.log("Divs.jsx - Fetching divisions...");
      console.log("Divs.jsx - Auth header exists:", !!authHeader);
      console.log("Divs.jsx - Current user:", user);
      console.log("Divs.jsx - User roles:", user?.roles);

      const response = await fetch(`${VITE_API}/divisions/user-divisions`, {
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      console.log("Divs.jsx - Response:", data);

      if (data.success) {
        const divisionsList = data.data;

        // Add "All Divisions" option if user is Admin or Super Admin (but NOT Business Officer, Warehouse Manager, etc.)
        let divisionsWithAll = [...divisionsList];

        // Check if user is Admin or Super Admin and has multiple divisions
        if (user && user.roles && Array.isArray(user.roles)) {
          const isAdminOrSuperAdmin = user.roles.some((role) => {
            const roleName = normalizeRoleName(role);
            return (
              roleName === "admin" ||
              roleName === "super admin" ||
              roleName === "super_admin" ||
              roleName === "superadmin"
            );
          });

          // Check for restricted roles that should NOT have All Divisions access
          const hasRestrictedRole = user.roles.some((role) => {
            const roleName = normalizeRoleName(role);
            return (
              roleName.includes("business officer") ||
              roleName.includes("business office") ||
              roleName.includes("warehouse manager") ||
              roleName.includes("area business manager")
            );
          });

          console.log(
            "Divs.jsx - Is Admin or Super Admin:",
            isAdminOrSuperAdmin,
          );
          console.log(
            "Divs.jsx - Has Restricted Role (BO/WM/ABM):",
            hasRestrictedRole,
          );
          console.log("Divs.jsx - Divisions count:", divisionsList.length);

          // Always include All Divisions for admins (without restricted roles), even if only one division is present
          if (isAdminOrSuperAdmin && !hasRestrictedRole) {
            console.log(
              "Divs.jsx - Adding All Divisions option (admin without restricted roles)",
            );
            divisionsWithAll = [
              {
                id: "all",
                name: "All Divisions",
                state: "All",
                isAllDivisions: true,
              },
              ...divisionsList,
            ];
          } else {
            // Ensure non-admin users and restricted roles never see an All Divisions option
            console.log(
              "Divs.jsx - Filtering out All Divisions option (isAdmin:",
              isAdminOrSuperAdmin,
              ", hasRestrictedRole:",
              hasRestrictedRole,
              ")",
            );
            divisionsWithAll = divisionsWithAll.filter(
              (d) => d?.id !== "all" && !d?.isAllDivisions,
            );
          }
        }

        console.log("Divs.jsx - Final divisions list:", divisionsWithAll);
        setDivisions(divisionsWithAll);
      } else {
        setError(data.message || "Failed to fetch divisions");
      }
    } catch (err) {
      setError("Error fetching divisions");
    } finally {
      setLoading(false);
    }
  };

  const handleDivisionSelect = async (division) => {
    if (selectingDivision) return; // Prevent multiple calls

    console.log("Handle select called for division:", division);

    try {
      setSelectingDivision(true);
      setError(""); // Clear previous errors

      const authHeader = tokenManager.getAuthHeader();
      const VITE_API = import.meta.env.VITE_API_URL;

      console.log("Divs.jsx - Selecting division:", division);
      console.log("Divs.jsx - Auth header exists:", !!authHeader);

      // Handle "All Divisions" selection differently
      if (division.isAllDivisions) {
        console.log("Divs.jsx - All Divisions selected, setting global access");

        // Store "All Divisions" selection
        const divisionData = {
          id: "all",
          name: "All Divisions",
          state: "All",
          isActive: true,
          isAllDivisions: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // Update the DivisionContext first
        console.log("Divs.jsx - Updating DivisionContext with All Divisions");
        setSelectedDivision(divisionData);
        setShowAllDivisions(true);
        console.log("Divs.jsx - DivisionContext updated");

        // Store in localStorage
        localStorage.setItem("selectedDivision", JSON.stringify(divisionData));
        localStorage.setItem("currentDivisionId", "all");
        localStorage.setItem("currentDivisionName", "All Divisions");

        // Update user data to hide division selector
        try {
          const userData = JSON.parse(localStorage.getItem("user"));
          if (userData) {
            console.log(
              "Divs.jsx - Updating user data for All Divisions, before:",
              userData.showDivisions,
            );
            userData.showDivisions = false;
            localStorage.setItem("user", JSON.stringify(userData));
            console.log(
              "Divs.jsx - User data updated for All Divisions, showDivisions set to:",
              userData.showDivisions,
            );
          }
        } catch (error) {
          console.error("Error updating user data:", error);
        }

        console.log(
          "Divs.jsx - All Divisions stored in localStorage:",
          divisionData,
        );

        // Set success state and navigate
        setDivisionSelected(true);

        // Ensure activeView is set to "admin" when selecting All Divisions
        // This prevents redirect back to stores if the user came from a store view
        try {
          const currentActiveView = localStorage.getItem("activeView");
          if (!currentActiveView || currentActiveView !== "admin") {
            const userData = JSON.parse(localStorage.getItem("user"));
            if (userData && userData.roles && Array.isArray(userData.roles)) {
              const isAdminOrSuperAdmin = userData.roles.some((role) => {
                const roleName = normalizeRoleName(role);
                return (
                  roleName === "admin" ||
                  roleName === "super admin" ||
                  roleName === "super_admin" ||
                  roleName === "superadmin"
                );
              });
              if (isAdminOrSuperAdmin) {
                console.log(
                  "Divs.jsx - Setting activeView to 'admin' for All Divisions selection",
                );
                localStorage.setItem("activeView", "admin");
              }
            }
          }
        } catch (error) {
          console.error(
            "Error setting activeView in Divs.jsx (All Divisions):",
            error,
          );
        }

        // Add a small delay to ensure context state is updated
        setTimeout(() => {
          console.log(
            "Divs.jsx - Navigating to dashboard with All Divisions access...",
          );
          navigate("/", { replace: true });
        }, 1500);

        return;
      }

      // Regular division selection
      const response = await fetch(`${VITE_API}/divisions/select`, {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ divisionId: division.id }),
      });

      console.log(
        "Divs.jsx - Select division response status:",
        response.status,
      );

      if (response.ok) {
        let data = {};
        // Handle 204 No Content responses
        if (response.status !== 204) {
          try {
            data = await response.json();
            console.log("Divs.jsx - Select division success:", data);
          } catch (jsonError) {
            console.log("Divs.jsx - No JSON payload (204 No Content)");
          }
        } else {
          console.log("Divs.jsx - Select division success (204 No Content)");
        }

        // Store selected division with proper fields
        const divisionData = {
          id: division.id,
          name: division.name,
          state: division.state,
          isActive: division.isActive,
          createdAt: division.createdAt,
          updatedAt: division.updatedAt,
          isAllDivisions: division.isAllDivisions || false,
        };

        // Update the DivisionContext first
        console.log(
          "Divs.jsx - Updating DivisionContext with regular division:",
          divisionData,
        );
        setSelectedDivision(divisionData);
        console.log("Divs.jsx - DivisionContext updated");

        localStorage.setItem("selectedDivision", JSON.stringify(divisionData));

        // ✅ ALSO update currentDivisionId and currentDivisionName for consistency
        localStorage.setItem("currentDivisionId", division.id.toString());
        localStorage.setItem("currentDivisionName", division.name);

        // Update user data to hide division selector
        try {
          const userData = JSON.parse(localStorage.getItem("user"));
          if (userData) {
            console.log(
              "Divs.jsx - Updating user data for regular division, before:",
              userData.showDivisions,
            );
            userData.showDivisions = false;
            localStorage.setItem("user", JSON.stringify(userData));
            console.log(
              "Divs.jsx - User data updated for regular division, showDivisions set to:",
              userData.showDivisions,
            );
          }
        } catch (error) {
          console.error("Error updating user data:", error);
        }

        console.log(
          "Divs.jsx - Division stored in localStorage:",
          divisionData,
        );
        console.log(
          "Divs.jsx - currentDivisionId stored:",
          localStorage.getItem("currentDivisionId"),
        );
        console.log(
          "Divs.jsx - currentDivisionName stored:",
          localStorage.getItem("currentDivisionName"),
        );

        // Set success state to prevent any further actions
        setDivisionSelected(true);

        // Ensure activeView is set to "admin" if not already set (for admin users)
        // This prevents redirect to stores after division selection
        const currentActiveView = localStorage.getItem("activeView");
        if (!currentActiveView || currentActiveView !== "admin") {
          // Check if user is admin - if so, set activeView to "admin"
          try {
            const userData = JSON.parse(localStorage.getItem("user"));
            if (userData && userData.roles && Array.isArray(userData.roles)) {
              const isAdminOrSuperAdmin = userData.roles.some((role) => {
                const roleName = normalizeRoleName(role);
                return (
                  roleName === "admin" ||
                  roleName === "super admin" ||
                  roleName === "super_admin" ||
                  roleName === "superadmin"
                );
              });
              if (isAdminOrSuperAdmin) {
                console.log(
                  "Divs.jsx - Setting activeView to 'admin' for admin user",
                );
                localStorage.setItem("activeView", "admin");
              }
            }
          } catch (error) {
            console.error("Error checking user role in Divs.jsx:", error);
          }
        }

        // Navigate to dashboard with a delay to ensure context state is updated
        setTimeout(() => {
          console.log("Divs.jsx - Navigating to dashboard...");
          console.log("Divs.jsx - Current tokens before navigation:", {
            accessToken: localStorage.getItem("accessToken"),
            refreshToken: localStorage.getItem("refreshToken"),
          });
          console.log(
            "Divs.jsx - ActiveView before navigation:",
            localStorage.getItem("activeView"),
          );
          console.log("navigate to /");
          navigate("/", { replace: true });
        }, 1500); // Increased delay to ensure context state is updated
      } else {
        let errorData = {};
        try {
          errorData = await response.json();
        } catch (e) {}
        console.error("Divs.jsx - Select division failed:", errorData);

        // Graceful fallback: if server denies changing division (common for non-admins),
        // proceed with client-side selection so app can filter by division locally
        const msg = (errorData.message || "").toLowerCase();
        if (
          response.status === 403 ||
          msg.includes("permission") ||
          msg.includes("not allowed") ||
          msg.includes("not have permission")
        ) {
          console.warn(
            "Divs.jsx - Server denied division change; applying client-side selection fallback.",
          );

          const divisionData = {
            id: division.id,
            name: division.name,
            state: division.state,
            isActive: division.isActive,
            createdAt: division.createdAt,
            updatedAt: division.updatedAt,
            isAllDivisions: division.isAllDivisions || false,
          };

          // Update context and localStorage
          setSelectedDivision(divisionData);
          localStorage.setItem(
            "selectedDivision",
            JSON.stringify(divisionData),
          );
          localStorage.setItem("currentDivisionId", division.id.toString());
          localStorage.setItem("currentDivisionName", division.name);

          try {
            const userData = JSON.parse(localStorage.getItem("user"));
            if (userData) {
              userData.showDivisions = false;
              localStorage.setItem("user", JSON.stringify(userData));
            }
          } catch {}

          // Ensure activeView is set to "admin" for admin users
          try {
            const userData = JSON.parse(localStorage.getItem("user"));
            if (userData && userData.roles && Array.isArray(userData.roles)) {
              const isAdminOrSuperAdmin = userData.roles.some((role) => {
                const roleName = normalizeRoleName(role);
                return (
                  roleName === "admin" ||
                  roleName === "super admin" ||
                  roleName === "super_admin" ||
                  roleName === "superadmin"
                );
              });
              if (isAdminOrSuperAdmin) {
                console.log(
                  "Divs.jsx - Setting activeView to 'admin' for admin user (fallback)",
                );
                localStorage.setItem("activeView", "admin");
              }
            }
          } catch (error) {
            console.error("Error checking user role in Divs.jsx:", error);
          }

          setDivisionSelected(true);
          setTimeout(() => {
            console.log(
              "Divs.jsx - ActiveView before navigation (fallback):",
              localStorage.getItem("activeView"),
            );
            navigate("/", { replace: true });
          }, 800);
        } else {
          setError(
            `Failed to select division: ${errorData.message || "Unknown error"}`,
          );
        }
      }
    } catch (error) {
      console.error("Error selecting division:", error);
      setError("Network error while selecting division");
    } finally {
      setSelectingDivision(false);
    }
  };

  // Check if user is Admin or Super Admin
  const isAdminOrSuperAdmin =
    user &&
    user.roles &&
    Array.isArray(user.roles) &&
    user.roles.some((role) => {
      const roleName = role.name && role.name.toLowerCase();
      return (
        roleName === "admin" ||
        roleName === "super admin" ||
        roleName === "superadmin"
      );
    });

  // Debug information - remove this in production
  useEffect(() => {
    if (user) {
      console.log("=== DEBUG INFO ===");
      console.log("User object:", user);
      console.log("User roles:", user.roles);
      console.log("Roles type:", typeof user.roles);
      console.log("Is array:", Array.isArray(user.roles));
      if (user.roles && Array.isArray(user.roles)) {
        user.roles.forEach((role, index) => {
          console.log(`Role ${index}:`, role);
          console.log(`Role name:`, role.name);
          console.log(`Role name type:`, typeof role.name);
          console.log(
            `Is admin (case-insensitive):`,
            role.name && role.name.toLowerCase() === "admin",
          );
        });
      }
      console.log("Final isAdmin result:", isAdminOrSuperAdmin);
      console.log("==================");
    }
  }, [user, isAdminOrSuperAdmin]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <div className={styles.loading}>Loading divisions...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>{error}</div>
      </div>
    );
  }

  if (divisionSelected) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.loading}>Division selected successfully! </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.logoContainer}>
          <img src={feedsLogo} alt="Feeds Logo" className={styles.logo} />
        </div>

        <h1 className={styles.companyName}>Sri Chakra Industries</h1>

        <div className={styles.welcomeMessage}>
          Welcome! <span className={styles.username}>{username}</span>
        </div>

        <p className={styles.instruction}>Choose your Division to continue</p>

        <div className={styles.divisionsList}>
          {divisions.map((division, index) => (
            <div
              key={division.id}
              className={`${styles.divisionCard} ${selectingDivision ? styles.disabled : ""}`}
              onClick={() => handleDivisionSelect(division)}
              style={{
                animationDelay: `${index * 0.1}s`,
                animation: "slideInUp 0.6s ease-out both",
              }}
            >
              <div className={styles.divisionInfo}>
                <span className={styles.divisionName}>{division.name}</span>
                {division.isAllDivisions && (
                  <span className={styles.adminBadge}>Admin Access</span>
                )}
                {/* <span className={styles.accessText}>access : allowed</span> */}
              </div>
              {/* {selectingDivision && <div className={styles.selecting}>Selecting...</div>} */}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Divs;
