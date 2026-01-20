# Role-Based Login Verification Guide

This guide explains how to verify that role-based login is working correctly for all user roles in the system.

## Available Roles

The system supports the following roles:

1. **Admin** - Full administrative access
2. **Super Admin** - Highest level administrative access
3. **Store Manager** - Store management access
4. **Store Employee** - Limited store access
5. **Division Head** - Division-level administrative access
6. **Business Officer** / **Business Office** - Business operations role
7. **Warehouse Manager** - Warehouse management role
8. **Area Business Manager** - Area-level business management role

## How Role Detection Works

### Role Detection Functions

All role detection functions are located in `src/utils/roleUtils.js`:

- `isAdmin(user)` - Checks for Admin role
- `isSuperAdmin(user)` - Checks for Super Admin role
- `isStoreManager(user)` - Checks for Store Manager role
- `isStoreEmployee(user)` - Checks for Store Employee role
- `isDivisionHead(user)` - Checks for Division Head role
- `isBusinessOfficer(user)` - Checks for Business Officer/Business Office role
- `isWarehouseManager(user)` - Checks for Warehouse Manager role
- `isAreaBusinessManager(user)` - Checks for Area Business Manager role

### Role Normalization

Roles are normalized (converted to lowercase) for consistent matching. The system handles various formats:
- "Business Officer" → "business officer"
- "Business Office" → "business office"
- "business_officer" → "business officer"
- etc.

## Login Flow and Routing

### Priority Order (checked in this order):

1. **Store Selection Required** → `/store-selector`
   - Users with `requiresStoreSelection: true`
   - Redirects to store selector page

2. **Store Manager** (with store already selected) → `/store`
   - Users with Store Manager role
   - Store already selected (no store selection required)
   - Sets `activeView: "staff"`

3. **Store Employee** → `/store`
   - Users with Store Employee role
   - Sets `activeView: "employee"`

4. **Admin/SuperAdmin/DivisionHead** (not store manager) → Role Choice Popup
   - Shows popup to choose between:
     - Store Management view
     - Admin Dashboard view

5. **Business Officer / Warehouse Manager / Area Business Manager / Other Regular Users**:
   - If `showDivisions: true` → `/divs` (division selection)
   - Otherwise → `/` (dashboard)

## How to Verify Role-Based Login

### Method 1: Browser Console Logging

1. Open the application in your browser
2. Open Developer Tools (F12)
3. Go to the Console tab
4. Log in with a user account
5. Look for the following log messages:

```
Login.jsx - ========== ROLE DETECTION VERIFICATION ==========
Login.jsx - User ID: [user_id]
Login.jsx - User Name: [user_name]
Login.jsx - Raw Roles Array: [roles_array]
Login.jsx - Normalized Roles: [normalized_roles]
Login.jsx - Role Checks: { ... }
Login.jsx - All Known Roles Verification: { ... }
Login.jsx - Detected Roles: [detected_roles_array]
```

### Method 2: Using Role Verification Utility

You can use the role verification utility in the browser console:

```javascript
// Import the verification functions (if available in global scope)
// Or use them in a React component

import { printRoleVerification, verifyAllKnownRoles } from './utils/roleVerification';

// Print comprehensive role verification
printRoleVerification();

// Verify all known roles
const verification = verifyAllKnownRoles();
console.log(verification);
```

### Method 3: Manual Testing Checklist

For each role, verify:

- [ ] **Business Officer**:
  - User with "Business Officer" or "Business Office" role logs in
  - Console shows `isBusinessOfficerUser: true`
  - User is routed to `/divs` if `showDivisions: true`, otherwise to `/`
  - Console shows "Business Officer" in detected roles

- [ ] **Store Manager**:
  - User with Store Manager role logs in
  - Console shows `isStoreManagerUser: true`
  - If store selection required → `/store-selector`
  - If store already selected → `/store` with `activeView: "staff"`

- [ ] **Store Employee**:
  - User with Store Employee role logs in
  - Console shows `isStoreEmployeeUser: true`
  - User is routed to `/store` with `activeView: "employee"`

- [ ] **Admin**:
  - User with Admin role logs in
  - Console shows `isAdminUser: true`
  - Role choice popup appears (if not store manager)
  - Can choose between Store Management and Admin Dashboard

- [ ] **Super Admin**:
  - User with Super Admin role logs in
  - Console shows `isSuperAdminUser: true`
  - Role choice popup appears (if not store manager)

- [ ] **Division Head**:
  - User with Division Head role logs in
  - Console shows `isDivisionHeadUser: true`
  - Role choice popup appears (if not store manager)

- [ ] **Warehouse Manager**:
  - User with Warehouse Manager role logs in
  - Console shows `isWarehouseManagerUser: true`
  - User is routed to `/divs` if `showDivisions: true`, otherwise to `/`

- [ ] **Area Business Manager**:
  - User with Area Business Manager role logs in
  - Console shows `isAreaBusinessManagerUser: true`
  - User is routed to `/divs` if `showDivisions: true`, otherwise to `/`

## Common Issues and Solutions

### Issue: Role not detected

**Symptoms:**
- Console shows `isBusinessOfficerUser: false` even though user has Business Officer role
- User is not routed correctly

**Solutions:**
1. Check the raw roles array in console - verify the exact role name from backend
2. Check if role name matches expected formats (case-insensitive)
3. Verify role is in `user.roles` array
4. Check role normalization in `roleUtils.js`

### Issue: Wrong routing

**Symptoms:**
- User with Business Officer role goes to wrong page
- User should go to `/divs` but goes to `/` or vice versa

**Solutions:**
1. Check `showDivisions` flag in user object
2. Verify `wantsDivision` calculation in Login.jsx
3. Check console logs for routing decisions
4. Verify user object structure matches expected format

### Issue: Role choice popup not showing

**Symptoms:**
- Admin user should see role choice but doesn't
- User is routed directly without popup

**Solutions:**
1. Check if user is also a Store Manager (popup won't show for store managers)
2. Verify `isAdminUser`, `isSuperAdminUser`, or `isDivisionHeadUser` is true
3. Check if `isStoreManagerUser` is false
4. Verify `showRoleChoice` state is being set correctly

## Testing Script

To test all roles systematically:

1. Create test users for each role (or use existing users)
2. For each user:
   - Log in
   - Check browser console for role verification logs
   - Verify routing is correct
   - Verify expected features are accessible
3. Document any discrepancies

## Files Modified

- `src/utils/roleUtils.js` - Added Business Officer, Warehouse Manager, Area Business Manager role checks
- `src/components/Login.jsx` - Updated login flow to handle all roles with comprehensive logging
- `src/utils/roleVerification.js` - New utility for role verification and testing

## Notes

- Role names are case-insensitive
- Multiple roles can be assigned to a single user
- Role detection uses normalized role names for matching
- Store selection takes priority over role-based routing
- Admin/SuperAdmin/DivisionHead users get role choice popup (unless they're also store managers)


