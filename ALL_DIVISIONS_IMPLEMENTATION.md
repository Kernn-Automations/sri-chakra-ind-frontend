# 🎯 All Divisions Implementation Guide

## 📋 Overview
This document explains how the "All Divisions" functionality has been implemented in the Kernn Automations frontend application. This feature allows Admin users to view data from all divisions without filtering, while regular users can only access their assigned division.

## 🔐 Access Control
- **Admin Users**: Can see and select "All Divisions" option
- **Regular Users**: Can only see and select their assigned divisions
- **Role Check**: Uses `user.roles` array to check for "Admin" role

## 🚀 Implementation Details

### 1. Division Selection Page (`/divs`)
**File**: `src/pages/Divs.jsx`

#### Key Features:
- Automatically detects Admin users
- Shows "All Divisions" button for Admin users only
- Handles "All Divisions" selection differently from regular divisions
- Stores division selection in localStorage

#### Code Example:
```javascript
// Check if user is Admin
const isAdmin = user && user.roles && Array.isArray(user.roles) && 
  user.roles.some(role => role.name && role.name.toLowerCase() === "admin");

// Add "All Divisions" option for Admin users
if (isAdmin && divisionsList.length > 1) {
  divisionsWithAll = [
    { 
      id: "all", 
      name: "All Divisions", 
      state: "All", 
      isAllDivisions: true 
    },
    ...divisionsList
  ];
}
```

### 2. Division Utilities
**File**: `src/utils/divisionUtils.js`

#### Key Functions:
- `canAccessAllDivisions(user)`: Check if user can access all divisions
- `isAllDivisions(divisionId)`: Check if division ID represents "All Divisions"
- `getDivisionApiParams(divisionId)`: Get API parameters for division filtering
- `getCurrentDivision()`: Get current division from localStorage

#### Usage Examples:
```javascript
import { 
  canAccessAllDivisions, 
  getDivisionApiParams, 
  isCurrentDivisionAll 
} from '../utils/divisionUtils';

// Check access
const canAccessAll = canAccessAllDivisions(user);

// Get API parameters
const params = getDivisionApiParams(divisionId);
// Returns: { showAllDivisions: 'true' } for "All Divisions"
// Returns: { divisionId: 11 } for specific division

// Check current state
const isAll = isCurrentDivisionAll();
```

### 3. API Integration

#### Backend Parameters:
- **"All Divisions"**: `?showAllDivisions=true`
- **Specific Division**: `?divisionId=11`
- **No Parameters**: Uses user's default division

#### Example API Calls:
```javascript
// Fetch data for "All Divisions"
const fetchAllDivisionsData = async () => {
  const response = await axiosAPI.get('/api/products?showAllDivisions=true');
  return response.data;
};

// Fetch data for specific division
const fetchDivisionData = async (divisionId) => {
  const response = await axiosAPI.get(`/api/products?divisionId=${divisionId}`);
  return response.data;
};

// Fetch data with current division
const fetchCurrentDivisionData = async () => {
  const currentDivision = getCurrentDivision();
  const params = getDivisionApiParams(currentDivision.id);
  const queryString = new URLSearchParams(params).toString();
  const response = await axiosAPI.get(`/api/products?${queryString}`);
  return response.data;
};
```

## 🎨 UI Components

### 1. Division Selector
**File**: `src/components/Dashboard/DivisionSelector.jsx`
- Shows "All Divisions" option for Admin users
- Handles division selection and localStorage updates

### 2. Division Switcher
**File**: `src/components/Dashboard/DivisionSwitcher.jsx`
- Displays current division in header
- Shows "All Divisions" when selected

### 3. Division Manager
**File**: `src/components/Dashboard/DivisionManager.jsx`
- Admin tool for managing divisions
- Shows statistics for all divisions

## 🔧 How to Use in New Components

### Step 1: Import Utilities
```javascript
import { 
  canAccessAllDivisions, 
  getDivisionApiParams, 
  getCurrentDivision 
} from '../utils/divisionUtils';
```

### Step 2: Check User Access
```javascript
const user = JSON.parse(localStorage.getItem("user"));
const canAccessAll = canAccessAllDivisions(user);
```

### Step 3: Handle Division Selection
```javascript
const [selectedDivision, setSelectedDivision] = useState(getCurrentDivision());

const handleDivisionChange = (division) => {
  setSelectedDivision(division);
  // Update localStorage if needed
  localStorage.setItem("selectedDivision", JSON.stringify(division));
};
```

### Step 4: Make API Calls
```javascript
const fetchData = async () => {
  const params = getDivisionApiParams(selectedDivision.id);
  const queryString = new URLSearchParams(params).toString();
  
  try {
    const response = await axiosAPI.get(`/api/endpoint?${queryString}`);
    setData(response.data);
  } catch (error) {
    console.error('Error fetching data:', error);
  }
};
```

### Step 5: Conditional Rendering
```javascript
return (
  <div>
    {/* Show "All Divisions" option for Admin users */}
    {canAccessAll && (
      <button 
        className={selectedDivision.id === 'all' ? 'active' : ''}
        onClick={() => handleDivisionChange({ id: 'all', name: 'All Divisions' })}
      >
        All Divisions
      </button>
    )}
    
    {/* Show specific division options */}
    {divisions.map(division => (
      <button 
        key={division.id}
        className={selectedDivision.id === division.id ? 'active' : ''}
        onClick={() => handleDivisionChange(division)}
      >
        {division.name}
      </button>
    ))}
  </div>
);
```

## 🎯 Expected Behavior

### For Admin Users:
1. **Division Selection Page**: Shows "All Divisions" button at the top
2. **Data Access**: Can view data from all divisions when "All Divisions" is selected
3. **API Calls**: Sends `showAllDivisions=true` parameter
4. **Filtering**: No division filtering applied

### For Regular Users:
1. **Division Selection Page**: Only shows their assigned divisions
2. **Data Access**: Limited to their assigned division
3. **API Calls**: Sends `divisionId=X` parameter
4. **Filtering**: Division filtering applied

## 🔒 Security Considerations

1. **Role-Based Access**: Only Admin users can access "All Divisions"
2. **Backend Validation**: Backend should validate user permissions
3. **Data Isolation**: Regular users cannot bypass division restrictions
4. **Audit Trail**: All division access should be logged

## 🐛 Troubleshooting

### Common Issues:

1. **"All Divisions" not showing**
   - Check if user has Admin role in `user.roles`
   - Verify `user.roles` is an array
   - Check role name is exactly "Admin" (case-sensitive)

2. **API calls not working**
   - Verify backend supports `showAllDivisions=true` parameter
   - Check if `divisionId` parameter is correct
   - Ensure proper authentication headers

3. **Division not persisting**
   - Check localStorage for "selectedDivision"
   - Verify division object structure
   - Check for JavaScript errors in console

### Debug Steps:
```javascript
// Check user roles
console.log('User roles:', user?.roles);

// Check current division
console.log('Current division:', getCurrentDivision());

// Check API parameters
console.log('API params:', getDivisionApiParams(selectedDivision.id));
```

## 📚 Related Files

- `src/pages/Divs.jsx` - Main division selection page
- `src/utils/divisionUtils.js` - Division utility functions
- `src/components/Dashboard/DivisionSelector.jsx` - Division selector component
- `src/components/Dashboard/DivisionSwitcher.jsx` - Division switcher component
- `src/components/Dashboard/DivisionManager.jsx` - Division management

## 🎉 Success Criteria

✅ Admin users can see "All Divisions" option  
✅ Regular users cannot see "All Divisions" option  
✅ "All Divisions" selection works correctly  
✅ API calls include proper parameters  
✅ Division filtering works for specific divisions  
✅ No filtering applied for "All Divisions"  
✅ UI updates correctly based on selection  
✅ localStorage persistence works  
✅ Role-based access control enforced  

---

**Implementation Status**: ✅ Complete  
**Last Updated**: Current Date  
**Version**: 1.0.0
