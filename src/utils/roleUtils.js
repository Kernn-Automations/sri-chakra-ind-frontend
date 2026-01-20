// src/utils/roleUtils.js

export const normalizeRoleName = (role) => {
  if (!role) return "";
  if (typeof role === "string") return role.toLowerCase();
  if (typeof role === "object") {
    const name = role.name || role.role || String(role);
    return (name || "").toLowerCase();
  }
  return String(role).toLowerCase();
};

export const getUserFromStorage = () => {
  try {
    return JSON.parse(localStorage.getItem("user")) || {};
  } catch (e) {
    return {};
  }
};

export const isAdmin = (userLike) => {
  const user = userLike || getUserFromStorage();
  const roles = user?.roles || [];
  return roles.some((r) => {
    const n = normalizeRoleName(r);
    return (
      n === "admin" ||
      n === "super admin" ||
      n === "super_admin" ||
      n === "superadmin" ||
      n.includes("admin")
    );
  });
};

export const isStoreManager = (userLike) => {
  const user = userLike || getUserFromStorage();
  const roles = user?.roles || [];
  console.log("isStoreManager check, user roles:", roles);
  return roles.some((r) => {
    const n = normalizeRoleName(r);
    console.log("Checking role:", n);
    return (
      n === "staff_manager" ||
      n === "staff manager" ||
      n === "store_manager" ||
      n === "store manager" ||
      n === "manager" ||
      n.includes("staff") ||
      n.includes("manager")
    );
  });
};

export const hasBothAdminAndStaff = (userLike) => {
  const user = userLike || getUserFromStorage();
  return isAdmin(user) && isStoreManager(user);
};

export const isStoreEmployee = (userLike) => {
  const user = userLike || getUserFromStorage();
  const roles = user?.roles || [];
  return roles.some((r) => {
    const n = normalizeRoleName(r);
    return (
      n === "employee" ||
      n === "staff_employee" ||
      n === "staff employee" ||
      n.includes("employee")
    );
  });
};

export const isSuperAdmin = (userLike) => {
  const user = userLike || getUserFromStorage();
  const roles = user?.roles || [];
  return roles.some((r) => {
    const n = normalizeRoleName(r);
    return n === "super admin" || n === "super_admin" || n === "superadmin";
  });
};

export const isDivisionHead = (userLike) => {
  const user = userLike || getUserFromStorage();
  const roles = user?.roles || [];
  return roles.some((r) => {
    const n = normalizeRoleName(r);
    return (
      n === "division head" ||
      n === "division_head" ||
      n === "divisionhead" ||
      (n.includes("division") && n.includes("head"))
    );
  });
};

export const isBusinessOfficer = (userLike) => {
  const user = userLike || getUserFromStorage();
  const roles = user?.roles || [];
  return roles.some((r) => {
    const n = normalizeRoleName(r);
    return (
      n === "business officer" ||
      n === "business_officer" ||
      n === "businessofficer" ||
      n === "business office" ||
      n === "business_office" ||
      n === "businessoffice" ||
      (n.includes("business") && n.includes("officer")) ||
      (n.includes("business") && n.includes("office"))
    );
  });
};

export const isWarehouseManager = (userLike) => {
  const user = userLike || getUserFromStorage();
  const roles = user?.roles || [];
  return roles.some((r) => {
    const n = normalizeRoleName(r);
    return (
      n === "warehouse manager" ||
      n === "warehouse_manager" ||
      n === "warehousemanager" ||
      (n.includes("warehouse") && n.includes("manager"))
    );
  });
};

export const isAreaBusinessManager = (userLike) => {
  const user = userLike || getUserFromStorage();
  const roles = user?.roles || [];
  return roles.some((r) => {
    const n = normalizeRoleName(r);
    return (
      n === "area business manager" ||
      n === "area_business_manager" ||
      n === "areabusinessmanager" ||
      (n.includes("area") && n.includes("business") && n.includes("manager"))
    );
  });
};

export const isZBM = (userLike) => {
  const user = userLike || getUserFromStorage();
  const roles = user?.roles || [];
  return roles.some((r) => {
    const n = normalizeRoleName(r);
    return n === "zbm" || n === "zone business manager" || n === "zone_business_manager" || 
           (n.includes("zone") && n.includes("business") && n.includes("manager"));
  });
};

/**
 * Get all roles for a user as an array of normalized role names
 * @param {Object} userLike - User object or null to get from storage
 * @returns {Array<string>} - Array of normalized role names
 */
export const getUserRoles = (userLike) => {
  const user = userLike || getUserFromStorage();
  const roles = user?.roles || [];
  return roles.map((r) => normalizeRoleName(r));
};

/**
 * Check if user has a specific role
 * @param {Object} userLike - User object or null to get from storage
 * @param {string} roleName - Role name to check (case-insensitive)
 * @returns {boolean} - True if user has the role
 */
export const hasRole = (userLike, roleName) => {
  const user = userLike || getUserFromStorage();
  const roles = user?.roles || [];
  const normalizedRoleName = normalizeRoleName(roleName);
  return roles.some((r) => {
    const n = normalizeRoleName(r);
    return (
      n === normalizedRoleName ||
      n.includes(normalizedRoleName) ||
      normalizedRoleName.includes(n)
    );
  });
};
