import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "./Footer";
import Header from "./Header";
import Input from "./Input";
import styles from "./Login.module.css";
import {
  isAdmin,
  isStoreManager,
  hasBothAdminAndStaff,
  isStoreEmployee,
  isSuperAdmin,
  isDivisionHead,
  isBusinessOfficer,
  isWarehouseManager,
  isAreaBusinessManager,
  getUserRoles,
} from "../utils/roleUtils";
import {
  printRoleVerification,
  verifyAllKnownRoles,
} from "../utils/roleVerification";
import { useAuth } from "../Auth";

function Login() {
  const [login, setLogin] = useState(false);
  const [user, setUser] = useState({});
  const [showRoleChoice, setShowRoleChoice] = useState(false);
  const navigate = useNavigate();
  const { axiosAPI } = useAuth();

  // Helper function to check for multiple stores and redirect accordingly
  const checkAndRedirectToStoreSelector = useCallback(
    async (token, fallbackRoute) => {
      try {
        console.log("Login.jsx - Checking available stores...");
        const response = await axiosAPI.get("/auth/available-stores");
        const data = response.data;

        if (data.success && Array.isArray(data.data)) {
          const stores = data.data;
          console.log("Login.jsx - Available stores count:", stores.length);

          // If more than one store, redirect to selector
          if (stores.length > 1) {
            console.log(
              "Login.jsx - Multiple stores found, redirecting to store selector",
            );
            navigate("/store-selector");
          } else if (stores.length === 1) {
            // Auto-select the single store
            console.log("Login.jsx - Single store found, auto-selecting");
            try {
              await axiosAPI.post("/auth/select-store", {
                storeId: stores[0].id,
              });
              const storeData = {
                id: stores[0].id,
                name: stores[0].name,
                address: stores[0].address,
                isActive: stores[0].isActive,
              };
              localStorage.setItem("selectedStore", JSON.stringify(storeData));
              localStorage.setItem("currentStoreId", stores[0].id.toString());
              localStorage.setItem("currentStoreName", stores[0].name);
              navigate(fallbackRoute);
            } catch (error) {
              console.error("Login.jsx - Error auto-selecting store:", error);
              navigate(fallbackRoute);
            }
          } else {
            // No stores available, go to fallback route
            console.log("Login.jsx - No stores available");
            navigate(fallbackRoute);
          }
        } else {
          // API error, go to fallback route
          console.log(
            "Login.jsx - Failed to fetch stores, using fallback route",
          );
          navigate(fallbackRoute);
        }
      } catch (error) {
        console.error("Login.jsx - Error checking stores:", error);
        // On error, go to fallback route
        navigate(fallbackRoute);
      }
    },
    [axiosAPI, navigate],
  );

  useEffect(() => {
    console.log("Login.jsx - useEffect triggered:", {
      login,
      user,
      showDivisions: user.user?.showDivisions,
    });

    // Check if user has already selected admin view and division
    // If so, don't run login routing logic (user is already in the right place)
    const activeView = localStorage.getItem("activeView");
    const selectedDivision = localStorage.getItem("selectedDivision");
    if (activeView === "admin" && selectedDivision && login) {
      console.log(
        "Login.jsx - User already has admin view and division selected, skipping login routing logic",
      );
      return;
    }

    const currentUser = user.user || user; // Handle both user.user and direct user
    if (!currentUser || !currentUser.id) return; // Don't proceed if no user data

    // Check for requiresStoreSelection flag from /auth/me response
    const requiresStoreSelection =
      currentUser?.requiresStoreSelection === true ||
      currentUser?.storeSelectionRequired === true;
    const assignedStores = currentUser?.assignedStores || [];
    const defaultStore = currentUser?.defaultStore;

    // Get authMeData from localStorage as fallback
    let authMeData = null;
    try {
      const stored = localStorage.getItem("authMeData");
      if (stored) {
        authMeData = JSON.parse(stored);
      }
    } catch (e) {
      console.error("Error parsing authMeData:", e);
    }

    const finalRequiresStoreSelection =
      requiresStoreSelection ||
      authMeData?.requiresStoreSelection === true ||
      authMeData?.storeSelectionRequired === true;
    const finalAssignedStores =
      assignedStores.length > 0
        ? assignedStores
        : authMeData?.assignedStores || [];
    const finalDefaultStore = defaultStore || authMeData?.defaultStore;

    // First, check all role types (must be defined before using them)
    const isStoreManagerUser =
      isStoreManager(currentUser) ||
      currentUser?.isStoreManager === true ||
      authMeData?.isStoreManager === true;
    const isAdminUser = isAdmin(currentUser);
    const isSuperAdminUser = isSuperAdmin(currentUser);
    const isStoreEmployeeUser = isStoreEmployee(currentUser);
    const isBusinessOfficerUser = isBusinessOfficer(currentUser);
    const isWarehouseManagerUser = isWarehouseManager(currentUser);
    const isAreaBusinessManagerUser = isAreaBusinessManager(currentUser);
    const isDivisionHeadUser = isDivisionHead(currentUser);
    const userRolesList = getUserRoles(currentUser);
    const onlyStaff = isStoreManagerUser && !isAdminUser;
    const bothRoles = hasBothAdminAndStaff(currentUser);

    // Business Officer, Warehouse Manager, and Area Business Manager should always go to division selection
    // unless they already have a division selected
    const shouldForceDivisionSelection =
      isBusinessOfficerUser ||
      isWarehouseManagerUser ||
      isAreaBusinessManagerUser;
    const hasSelectedDivision =
      localStorage.getItem("selectedDivision") !== null;

    // Check if user needs division selection
    // Business Officer and similar roles should ALWAYS go to /divs to select division
    // For other users, check showDivisions flag or admin status
    const wantsDivision = shouldForceDivisionSelection
      ? true // Always force division selection for Business Officer, Warehouse Manager, Area Business Manager
      : currentUser?.showDivisions || isAdminUser; // For others, use showDivisions flag or admin check

    // Comprehensive role detection logging
    console.log(
      "Login.jsx - ========== ROLE DETECTION VERIFICATION ==========",
    );
    console.log("Login.jsx - User ID:", currentUser?.id);
    console.log(
      "Login.jsx - User Name:",
      currentUser?.name || currentUser?.username,
    );
    console.log("Login.jsx - Raw Roles Array:", currentUser?.roles);
    console.log("Login.jsx - Normalized Roles:", userRolesList);
    console.log("Login.jsx - Role Checks:", {
      isAdminUser,
      isSuperAdminUser,
      isStoreManagerUser,
      isStoreEmployeeUser,
      isBusinessOfficerUser,
      isWarehouseManagerUser,
      isAreaBusinessManagerUser,
      isDivisionHeadUser,
      onlyStaff,
      bothRoles,
    });
    console.log("Login.jsx - Store Selection:", {
      requiresStoreSelection: finalRequiresStoreSelection,
      assignedStoresCount: finalAssignedStores.length,
      hasDefaultStore: !!finalDefaultStore,
    });
    console.log("Login.jsx - Division Settings:", {
      showDivisions: currentUser?.showDivisions,
      wantsDivision,
      userDivision: currentUser?.userDivision,
      shouldForceDivisionSelection,
      hasSelectedDivision,
      selectedDivisionFromStorage: localStorage.getItem("selectedDivision"),
    });

    // Comprehensive role verification
    try {
      const allRolesVerification = verifyAllKnownRoles(currentUser);
      console.log(
        "Login.jsx - All Known Roles Verification:",
        allRolesVerification,
      );
      console.log(
        "Login.jsx - Detected Roles:",
        allRolesVerification.summary.detectedRoles,
      );
    } catch (error) {
      console.error("Login.jsx - Error in role verification:", error);
    }

    console.log(
      "Login.jsx - =================================================",
    );

    // Check if store selection is required (from /auth/me response)
    // This should be checked FIRST, before any other role checks
    if (login && finalRequiresStoreSelection) {
      console.log(
        "Login.jsx - Store selection required, redirecting to /store-selector",
      );
      const token = localStorage.getItem("accessToken");
      if (token) {
        localStorage.setItem("activeView", "staff");
        navigate("/store-selector");
        return; // Important: return early to prevent other logic from running
      } else {
        const timer = setTimeout(() => {
          const tokenCheck = localStorage.getItem("accessToken");
          if (tokenCheck) {
            localStorage.setItem("activeView", "staff");
            navigate("/store-selector");
          }
        }, 100);
        return () => clearTimeout(timer);
      }
    }

    // Store managers ALWAYS get store management access - but only if store is already selected
    // This should be checked AFTER requiresStoreSelection check
    if (login && isStoreManagerUser && !finalRequiresStoreSelection) {
      console.log(
        "Login.jsx - Store manager detected, store already selected, redirecting to /store",
      );
      const token = localStorage.getItem("accessToken");
      if (token) {
        localStorage.setItem("activeView", "staff");
        navigate("/store");
        return; // Important: return early to prevent other logic from running
      } else {
        const timer = setTimeout(() => {
          const tokenCheck = localStorage.getItem("accessToken");
          if (tokenCheck) {
            localStorage.setItem("activeView", "staff");
            navigate("/store");
          }
        }, 100);
        return () => clearTimeout(timer);
      }
    }

    // Store employees get limited store access - navigate to /store
    if (login && isStoreEmployeeUser) {
      console.log("Login.jsx - Store employee detected, redirecting to /store");
      const token = localStorage.getItem("accessToken");
      if (token) {
        localStorage.setItem("activeView", "employee");
        navigate("/store");
        return; // Important: return early
      } else {
        const timer = setTimeout(() => {
          const tokenCheck = localStorage.getItem("accessToken");
          if (tokenCheck) {
            localStorage.setItem("activeView", "employee");
            navigate("/store");
          }
        }, 100);
        return () => clearTimeout(timer);
      }
    }

    // Show popup for admins, superadmins, and division heads (so they can choose store management or admin view)
    // Only show this if they are NOT store managers, business officers, warehouse managers, or area business managers
    if (
      login &&
      (isAdminUser || isSuperAdminUser || isDivisionHeadUser) &&
      !isStoreManagerUser &&
      !isBusinessOfficerUser &&
      !isWarehouseManagerUser &&
      !isAreaBusinessManagerUser
    ) {
      console.log(
        "Login.jsx - Admin/SuperAdmin/DivisionHead detected (not store manager), showing role choice",
      );
      // Show chooser popup
      setShowRoleChoice(true);
      return;
    }

    // Handle Business Officer, Warehouse Manager, Area Business Manager, and other regular users
    // These users should go to division selection if they need it, otherwise to dashboard
    if (
      login &&
      currentUser &&
      !isAdminUser &&
      !isSuperAdminUser &&
      !isStoreManagerUser &&
      !isStoreEmployeeUser &&
      (isBusinessOfficerUser ||
        isWarehouseManagerUser ||
        isAreaBusinessManagerUser ||
        (!isBusinessOfficerUser &&
          !isWarehouseManagerUser &&
          !isAreaBusinessManagerUser &&
          !isDivisionHeadUser))
    ) {
      console.log(
        "Login.jsx - Regular user detected (Business Officer/Warehouse Manager/Area Business Manager/Other):",
        {
          isBusinessOfficerUser,
          isWarehouseManagerUser,
          isAreaBusinessManagerUser,
          roles: userRolesList,
        },
      );
      const token = localStorage.getItem("accessToken");

      if (wantsDivision) {
        console.log(
          "Login.jsx - User needs division selection, redirecting to /divs",
        );
        console.log(
          "Login.jsx - Reason: showDivisions=",
          currentUser?.showDivisions,
          "roles=",
          currentUser?.roles,
        );
        if (token) {
          console.log("Login.jsx - Token found, navigating to /divs");
          navigate("/divs");
        } else {
          console.log("Login.jsx - Token not found, waiting...");
          const timer = setTimeout(() => {
            const tokenCheck = localStorage.getItem("accessToken");
            if (tokenCheck) {
              console.log(
                "Login.jsx - Token found after delay, navigating to /divs",
              );
              navigate("/divs");
            }
          }, 100);
          return () => clearTimeout(timer);
        }
      } else {
        console.log(
          "Login.jsx - User does not need division selection, redirecting to /dashboard",
        );
        // User doesn't need division selection, go to dashboard
        if (token) {
          navigate("/");
        } else {
          const timer = setTimeout(() => {
            const tokenCheck = localStorage.getItem("accessToken");
            if (tokenCheck) {
              navigate("/");
            }
          }, 100);
          return () => clearTimeout(timer);
        }
      }
    }

    // Fallback: If login is successful but no other condition matched, go to home
    if (login) {
      console.warn(
        "Login.jsx - No specific route matched, executing fallback redirection to /",
      );
      navigate("/");
    }
  }, [login, user, navigate, axiosAPI, checkAndRedirectToStoreSelector]);

  return (
    <>
      <div className={`container-fluid ${styles.cont}`}>
        {!login && (
          <>
            <div className={styles.logincontainer}>
              <Header />
              <main className={styles.formWrapper}>
                <Input setLogin={setLogin} setUser={setUser} />
              </main>
              <Footer />
            </div>
          </>
        )}

        {/* {login && !user.user?.showDivisions && <WelcomePage data={user} />} */}

        {showRoleChoice && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            className="role-choice-overlay"
          >
            <div
              style={{
                background: "#fff",
                borderRadius: 8,
                padding: 24,
                width: "90%",
                maxWidth: 420,
                boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
              }}
            >
              <h4 style={{ marginBottom: 12 }}>Choose a view</h4>
              <p style={{ marginBottom: 20 }}>
                You have admin privileges. Select how you want to continue:
              </p>
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  justifyContent: "space-between",
                }}
              >
                <button
                  className="btn btn-primary"
                  onClick={async () => {
                    localStorage.setItem("activeView", "staff");
                    setShowRoleChoice(false);

                    // Check if store selection is required
                    const currentUser = user.user || user;
                    const requiresStoreSelection =
                      currentUser?.requiresStoreSelection === true ||
                      currentUser?.storeSelectionRequired === true;

                    // Get authMeData from localStorage as fallback
                    let authMeData = null;
                    try {
                      const stored = localStorage.getItem("authMeData");
                      if (stored) {
                        authMeData = JSON.parse(stored);
                      }
                    } catch (e) {
                      console.error("Error parsing authMeData:", e);
                    }

                    const finalRequiresStoreSelection =
                      requiresStoreSelection ||
                      authMeData?.requiresStoreSelection === true ||
                      authMeData?.storeSelectionRequired === true;

                    // For admin/division head, also check available stores
                    if (finalRequiresStoreSelection) {
                      navigate("/store-selector");
                    } else {
                      // Check available stores for admin/division head
                      try {
                        const response = await axiosAPI.get(
                          "/auth/available-stores",
                        );
                        const data = response.data;

                        if (data.success && Array.isArray(data.data)) {
                          const stores = data.data;
                          console.log(
                            "Login.jsx - Admin/Division Head available stores count:",
                            stores.length,
                          );

                          if (stores.length > 1) {
                            // Multiple stores - redirect to selector
                            console.log(
                              "Login.jsx - Multiple stores found for admin/division head, redirecting to selector",
                            );
                            navigate("/store-selector");
                          } else if (stores.length === 1) {
                            // Single store - auto-select
                            console.log(
                              "Login.jsx - Single store found for admin/division head, auto-selecting",
                            );
                            try {
                              await axiosAPI.post("/auth/select-store", {
                                storeId: stores[0].id,
                              });
                              const storeData = {
                                id: stores[0].id,
                                name: stores[0].name,
                                address: stores[0].address,
                                isActive: stores[0].isActive,
                              };
                              localStorage.setItem(
                                "selectedStore",
                                JSON.stringify(storeData),
                              );
                              localStorage.setItem(
                                "currentStoreId",
                                stores[0].id.toString(),
                              );
                              localStorage.setItem(
                                "currentStoreName",
                                stores[0].name,
                              );
                              navigate("/store");
                            } catch (error) {
                              console.error(
                                "Login.jsx - Error auto-selecting store:",
                                error,
                              );
                              navigate("/store");
                            }
                          } else {
                            // No stores available
                            console.log(
                              "Login.jsx - No stores available for admin/division head",
                            );
                            navigate("/store");
                          }
                        } else {
                          // API error, go to store
                          navigate("/store");
                        }
                      } catch (error) {
                        console.error(
                          "Login.jsx - Error checking available stores for admin/division head:",
                          error,
                        );
                        navigate("/store");
                      }
                    }
                  }}
                  style={{ flex: 1 }}
                >
                  Store Management
                </button>
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => {
                    localStorage.setItem("activeView", "admin");
                    setShowRoleChoice(false);
                    navigate("/divs");
                  }}
                  style={{ flex: 1 }}
                >
                  Admin Dashboard
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default Login;
