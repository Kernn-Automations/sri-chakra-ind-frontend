# Division System - Frontend Implementation

## Overview
This document describes the frontend implementation of the division-based access control system that allows organizations to manage multiple business units/regions with complete data isolation.

## Components Created

### 1. DivisionSelector (`src/components/DivisionSelector.jsx`)
- **Purpose**: Shows division selection page after login for admin/super admin users
- **Features**:
  - Displays available divisions as rounded rectangle cards
  - Handles division selection and API calls
  - Stores selected division in localStorage
  - Navigates to dashboard after selection

### 2. DivisionManager (`src/components/Dashboard/DivisionManager.jsx`)
- **Purpose**: Admin interface for managing divisions
- **Features**:
  - Create new divisions
  - View existing divisions with statistics
  - Delete divisions
  - Only accessible to Admin/Super Admin users

### 3. DivisionSwitcher (`src/components/Dashboard/DivisionSwitcher.jsx`)
- **Purpose**: Quick division switching in dashboard header
- **Features**:
  - Dropdown selector for available divisions
  - Shows current selected division
  - Automatically refreshes page when division changes
  - Only visible to users with division access

## Updated Components

### 1. Login Flow (`src/components/Login.jsx`)
- Modified to show DivisionSelector for users with `showDivisions` permission
- Regular users go directly to WelcomePage

### 2. OTP Verification (`src/components/OTP.jsx`)
- Updated to handle new login response format with division information
- Stores `showDivisions` and `userDivision` in user data

### 3. WelcomePage (`src/components/WelComePage.jsx`)
- Updated to store division information for regular users
- Handles users assigned to specific divisions

### 4. Dashboard Navigation (`src/components/Dashboard/navs/NavBg.jsx`)
- Added "Divisions" navigation link for Admin users
- Links to DivisionManager component

### 5. Dashboard Header (`src/components/Dashboard/DashHeader.jsx`)
- Added DivisionSwitcher component for quick division switching

### 6. Auth Context (`src/Auth.jsx`)
- Updated logout function to clear division-related localStorage items

## API Endpoints Used

### Division Management
- `GET /divisions/user-divisions` - Get user's accessible divisions
- `POST /divisions/select` - Select a division (Admin/Super Admin only)
- `GET /divisions` - Get all divisions with statistics (Admin only)
- `POST /divisions` - Create new division (Admin only)
- `DELETE /divisions/:id` - Delete division (Admin only)

## User Experience Flow

### For Regular Users:
1. Login → OTP verification
2. Welcome page → Dashboard (automatically assigned to their division)
3. All data filtered by their division
4. No division selector shown

### For Admin/Super Admin:
1. Login → OTP verification
2. Division selector page (if `showDivisions` is true)
3. Select division → Dashboard
4. Can switch divisions using header dropdown
5. Can manage divisions via navigation menu

## LocalStorage Keys

- `selectedDivision` - Currently selected division object
- `showDivisions` - Boolean indicating if user can see division selector

## Security Features

- **Role-based access**: Only Admin/Super Admin can access division management
- **Data isolation**: All API calls automatically filtered by selected division
- **Session management**: Selected division stored in localStorage and session

## Styling

### DivisionSelector.module.css
- Modern gradient background
- Rounded rectangle cards for division options
- Hover effects and responsive design

### DivisionManager.module.css
- Clean admin interface
- Form styling for creating divisions
- Card layout for division list

### DivisionSwitcher.module.css
- Dropdown selector styling
- Hover effects and transitions
- Responsive design for mobile

## Testing

To test the division system:

1. **Admin User**:
   - Login with admin credentials
   - Should see division selector after OTP
   - Can create/manage divisions
   - Can switch between divisions

2. **Regular User**:
   - Login with regular user credentials
   - Should go directly to dashboard
   - Data should be filtered by their assigned division

## Backend Integration

The frontend expects the following response format from the login API:

```javascript
{
  "accessToken": "...",
  "refreshToken": "...",
  "data": { ... },
  "roles": [ ... ],
  "showDivisions": true,        // Only for Admin/Super Admin
  "userDivision": {             // User's assigned division
    "id": 1,
    "name": "Maharashtra",
    "state": "Maharashtra"
  }
}
```

## Future Enhancements

1. **Division Statistics**: Add more detailed statistics in DivisionManager
2. **Bulk Operations**: Add bulk user assignment to divisions
3. **Division Templates**: Pre-configured division setups
4. **Audit Logs**: Track division changes and access
5. **Advanced Filtering**: More granular division-based filtering options 