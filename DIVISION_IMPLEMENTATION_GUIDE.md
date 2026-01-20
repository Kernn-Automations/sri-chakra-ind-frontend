# Division Implementation Guide

## 🎯 **Frontend Division Filtering Implementation**

### **Problem Solved:**
Frontend now properly sends `divisionId` parameter in API calls, ensuring data is filtered by division.

### **✅ What's Already Fixed:**

1. **DivisionContext** - Properly manages division state and provides division change events
2. **fetchWithDivision utility** - Automatically adds divisionId to API calls
3. **Dashboard component** - Uses division filtering for employee data
4. **HomePage component** - Uses division filtering for dashboard data
5. **DivisionSelector & DivisionSwitcher** - Properly handle division changes
6. **apiService.js** - Provides division-aware API functions

### **🔧 How to Update Your Components:**

#### **Option 1: Use the useDivision Hook (Recommended)**

```javascript
import { useDivision } from "../context/DivisionContext";
import { fetchWithDivision } from "../../../utils/fetchWithDivision";

function YourComponent() {
  const { selectedDivision, showAllDivisions } = useDivision();
  
  useEffect(() => {
    const loadData = async () => {
      const divisionId = selectedDivision?.id;
      if (divisionId) {
        const data = await fetchWithDivision(
          "/your-endpoint",
          localStorage.getItem("accessToken"),
          divisionId,
          showAllDivisions
        );
        // Handle data...
      }
    };
    
    loadData();
  }, [selectedDivision, showAllDivisions]);
  
  // Listen for division change events
  useEffect(() => {
    const handleDivisionChange = (event) => {
      const { divisionId } = event.detail;
      // Refresh your data with new divisionId
      loadData();
    };
    
    window.addEventListener('divisionChanged', handleDivisionChange);
    return () => window.removeEventListener('divisionChanged', handleDivisionChange);
  }, []);
}
```

#### **Option 2: Use the apiService Functions**

```javascript
import { fetchCustomers, getCurrentDivisionId } from "../../../utils/apiService";

function YourComponent() {
  const [customers, setCustomers] = useState([]);
  
  useEffect(() => {
    const loadCustomers = async () => {
      const divisionId = getCurrentDivisionId();
      const token = localStorage.getItem("accessToken");
      
      if (divisionId && token) {
        const data = await fetchCustomers(token, divisionId);
        setCustomers(data.data || []);
      }
    };
    
    loadCustomers();
  }, []);
  
  // Listen for division changes
  useEffect(() => {
    const handleDivisionChange = () => {
      loadCustomers();
    };
    
    window.addEventListener('divisionChanged', handleDivisionChange);
    return () => window.removeEventListener('divisionChanged', handleDivisionChange);
  }, []);
}
```

#### **Option 3: Direct fetchWithDivision Usage**

```javascript
import { fetchWithDivision } from "../../../utils/fetchWithDivision";

function YourComponent() {
  const [data, setData] = useState([]);
  
  useEffect(() => {
    const loadData = async () => {
      const selectedDivision = JSON.parse(localStorage.getItem("selectedDivision"));
      const divisionId = selectedDivision?.id;
      const token = localStorage.getItem("accessToken");
      
      if (divisionId && token) {
        const response = await fetchWithDivision(
          "/your-endpoint",
          token,
          divisionId,
          false // showAllDivisions
        );
        setData(response.data || []);
      }
    };
    
    loadData();
  }, []);
}
```

### **📋 Components That Need Updates:**

#### **High Priority (Core Business Logic):**
- [ ] `src/components/Dashboard/Customers/CustomerList.jsx`
- [ ] `src/components/Dashboard/Employees/ManageEmployees.jsx`
- [ ] `src/components/Dashboard/Warehouses/Warehouses.jsx`
- [ ] `src/components/Dashboard/Products/ProductHome.jsx`
- [ ] `src/components/Dashboard/Inventory/InventoryHome.jsx`
- [ ] `src/components/Dashboard/Sales/SalesHome.jsx`
- [ ] `src/components/Dashboard/Purchases/PurchaseHome.jsx`

#### **Medium Priority:**
- [ ] `src/components/Dashboard/Payments/PaymentHome.jsx`
- [ ] `src/components/Dashboard/Invoice/InvoicePage.jsx`
- [ ] `src/components/Dashboard/StockTransfer/StockHome.jsx`
- [ ] `src/components/Dashboard/Locations/Locations.jsx`

#### **Low Priority:**
- [ ] `src/components/Dashboard/Discounts/DiscountHome.jsx`
- [ ] `src/components/Dashboard/SettingsTab/SettingRoutes.jsx`

### **🔍 Division IDs:**

```javascript
// From DivisionContext.jsx
export const DIVISION_IDS = {
  ALL_DIVISIONS: 1,    // "All Divisions"
  MAHARASHTRA: 2,      // "Maharashtra"
  TELANGANA: 11,       // "Telangana"
  PUNE: 12             // "Pune"
};
```

### **📝 Example: Updating CustomerList.jsx**

**Before (❌ Wrong):**
```javascript
const response = await fetch('/api/customers', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

**After (✅ Correct):**
```javascript
import { useDivision } from "../context/DivisionContext";
import { fetchWithDivision } from "../../../utils/fetchWithDivision";

function CustomerList() {
  const { selectedDivision, showAllDivisions } = useDivision();
  
  useEffect(() => {
    const loadCustomers = async () => {
      const divisionId = selectedDivision?.id;
      if (divisionId) {
        const data = await fetchWithDivision(
          "/customers",
          localStorage.getItem("accessToken"),
          divisionId,
          showAllDivisions
        );
        setCustomers(data.data || []);
      }
    };
    
    loadCustomers();
  }, [selectedDivision, showAllDivisions]);
}
```

### **🚀 Benefits of This Implementation:**

1. **Automatic Division Filtering** - All API calls automatically include divisionId
2. **Real-time Updates** - Data refreshes when division changes
3. **Consistent Behavior** - All components behave the same way
4. **Easy Maintenance** - Centralized division logic
5. **Performance** - Only loads data for selected division

### **⚠️ Important Notes:**

1. **Always check if divisionId exists** before making API calls
2. **Listen for division change events** to refresh data
3. **Use the useDivision hook** when possible for better integration
4. **Test with different divisions** to ensure filtering works
5. **Handle loading states** while division data is being fetched

### **🧪 Testing:**

1. Switch between different divisions
2. Verify data changes appropriately
3. Check console logs for division filtering
4. Ensure no data leaks between divisions
5. Test with "All Divisions" option if available

### **📞 Need Help?**

If you encounter issues:
1. Check console logs for division change events
2. Verify selectedDivision is properly set in localStorage
3. Ensure your component is wrapped in DivisionProvider
4. Check that fetchWithDivision is being called correctly 