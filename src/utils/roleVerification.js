// src/utils/roleVerification.js
// Comprehensive role verification utility for testing role-based login

import {
  isAdmin,
  isSuperAdmin,
  isStoreManager,
  isStoreEmployee,
  isDivisionHead,
  isBusinessOfficer,
  isWarehouseManager,
  isAreaBusinessManager,
  getUserRoles,
  hasRole,
  getUserFromStorage,
} from "./roleUtils";

/**
 * Verify all roles for a user and return comprehensive role information
 * @param {Object} user - User object (optional, will get from storage if not provided)
 * @returns {Object} - Comprehensive role verification report
 */
export const verifyUserRoles = (user = null) => {
  const currentUser = user || getUserFromStorage();
  const roles = currentUser?.roles || [];
  const normalizedRoles = getUserRoles(currentUser);

  const verification = {
    user: {
      id: currentUser?.id,
      name: currentUser?.name || currentUser?.username,
      email: currentUser?.email || currentUser?.mobile,
    },
    roles: {
      raw: roles,
      normalized: normalizedRoles,
      count: roles.length,
    },
    roleChecks: {
      isAdmin: isAdmin(currentUser),
      isSuperAdmin: isSuperAdmin(currentUser),
      isStoreManager: isStoreManager(currentUser),
      isStoreEmployee: isStoreEmployee(currentUser),
      isDivisionHead: isDivisionHead(currentUser),
      isBusinessOfficer: isBusinessOfficer(currentUser),
      isWarehouseManager: isWarehouseManager(currentUser),
      isAreaBusinessManager: isAreaBusinessManager(currentUser),
    },
    expectedRouting: getExpectedRouting(currentUser),
    verificationStatus: {
      hasRoles: roles.length > 0,
      rolesDetected: Object.values(verification.roleChecks).some(v => v === true),
      allRolesNormalized: normalizedRoles.length === roles.length,
    },
  };

  return verification;
};

/**
 * Get expected routing based on user roles
 * @param {Object} user - User object
 * @returns {Object} - Expected routing information
 */
const getExpectedRouting = (user) => {
  const isAdminUser = isAdmin(user);
  const isSuperAdminUser = isSuperAdmin(user);
  const isStoreManagerUser = isStoreManager(user);
  const isStoreEmployeeUser = isStoreEmployee(user);
  const isBusinessOfficerUser = isBusinessOfficer(user);
  const isWarehouseManagerUser = isWarehouseManager(user);
  const isAreaBusinessManagerUser = isAreaBusinessManager(user);
  const isDivisionHeadUser = isDivisionHead(user);
  const requiresStoreSelection = user?.requiresStoreSelection === true || user?.storeSelectionRequired === true;
  const showDivisions = user?.showDivisions || isAdminUser;

  let expectedRoute = "/";
  let expectedView = "admin";
  let description = "";

  // Priority 1: Store selection required
  if (requiresStoreSelection) {
    expectedRoute = "/store-selector";
    expectedView = "staff";
    description = "User requires store selection";
  }
  // Priority 2: Store Manager (with store already selected)
  else if (isStoreManagerUser && !requiresStoreSelection) {
    expectedRoute = "/store";
    expectedView = "staff";
    description = "Store Manager - Store already selected";
  }
  // Priority 3: Store Employee
  else if (isStoreEmployeeUser) {
    expectedRoute = "/store";
    expectedView = "employee";
    description = "Store Employee";
  }
  // Priority 4: Admin/SuperAdmin/DivisionHead (not store manager) - shows role choice
  else if ((isAdminUser || isSuperAdminUser || isDivisionHeadUser) && 
           !isStoreManagerUser && !isBusinessOfficerUser && !isWarehouseManagerUser && !isAreaBusinessManagerUser) {
    expectedRoute = "role-choice-popup";
    expectedView = "admin";
    description = "Admin/SuperAdmin/DivisionHead - Role choice popup";
  }
  // Priority 5: Business Officer, Warehouse Manager, Area Business Manager, and other regular users
  else if (isBusinessOfficerUser || isWarehouseManagerUser || isAreaBusinessManagerUser || 
           (!isAdminUser && !isSuperAdminUser && !isStoreManagerUser && !isStoreEmployeeUser)) {
    if (showDivisions) {
      expectedRoute = "/divs";
      expectedView = "admin";
      description = `${isBusinessOfficerUser ? "Business Officer" : 
                     isWarehouseManagerUser ? "Warehouse Manager" : 
                     isAreaBusinessManagerUser ? "Area Business Manager" : "Regular User"} - Division selection required`;
    } else {
      expectedRoute = "/";
      expectedView = "admin";
      description = `${isBusinessOfficerUser ? "Business Officer" : 
                     isWarehouseManagerUser ? "Warehouse Manager" : 
                     isAreaBusinessManagerUser ? "Area Business Manager" : "Regular User"} - Dashboard`;
    }
  }

  return {
    route: expectedRoute,
    view: expectedView,
    description,
    requiresStoreSelection,
    showDivisions,
  };
};

/**
 * Print comprehensive role verification report to console
 * @param {Object} user - User object (optional)
 */
export const printRoleVerification = (user = null) => {
  const verification = verifyUserRoles(user);
  
  console.log("========================================");
  console.log("ROLE VERIFICATION REPORT");
  console.log("========================================");
  console.log("User Information:", verification.user);
  console.log("Roles:", {
    raw: verification.roles.raw,
    normalized: verification.roles.normalized,
    count: verification.roles.count,
  });
  console.log("Role Checks:", verification.roleChecks);
  console.log("Expected Routing:", verification.expectedRouting);
  console.log("Verification Status:", verification.verificationStatus);
  console.log("========================================");
  
  return verification;
};

/**
 * Test role detection for a specific role name
 * @param {string} roleName - Role name to test
 * @param {Object} user - User object (optional)
 * @returns {Object} - Test results
 */
export const testRoleDetection = (roleName, user = null) => {
  const currentUser = user || getUserFromStorage();
  const hasTheRole = hasRole(currentUser, roleName);
  const normalizedRoles = getUserRoles(currentUser);
  const normalizedRoleName = roleName.toLowerCase();
  
  return {
    roleName,
    normalizedRoleName,
    hasRole: hasTheRole,
    userRoles: normalizedRoles,
    matches: normalizedRoles.filter(r => 
      r === normalizedRoleName || 
      r.includes(normalizedRoleName) || 
      normalizedRoleName.includes(r)
    ),
  };
};

/**
 * Verify all known roles in the system
 * @param {Object} user - User object (optional)
 * @returns {Object} - Verification results for all known roles
 */
export const verifyAllKnownRoles = (user = null) => {
  const knownRoles = [
    "Admin",
    "Super Admin",
    "Store Manager",
    "Store Employee",
    "Division Head",
    "Business Officer",
    "Business Office",
    "Warehouse Manager",
    "Area Business Manager",
  ];

  const currentUser = user || getUserFromStorage();
  const results = {};

  knownRoles.forEach(roleName => {
    results[roleName] = testRoleDetection(roleName, currentUser);
  });

  return {
    user: {
      id: currentUser?.id,
      name: currentUser?.name || currentUser?.username,
    },
    roleTests: results,
    summary: {
      totalRolesTested: knownRoles.length,
      rolesDetected: Object.values(results).filter(r => r.hasRole).length,
      detectedRoles: Object.entries(results)
        .filter(([_, result]) => result.hasRole)
        .map(([roleName, _]) => roleName),
    },
  };
};


