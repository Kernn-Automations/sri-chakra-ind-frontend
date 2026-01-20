# 🧪 Damage Reporting Frontend Test Guide

## 📋 **Test Checklist for Frontend Developer**

### **1. Image Upload Testing**

#### **✅ File Type Validation:**
- [ ] Upload JPG image → Should work
- [ ] Upload PNG image → Should work  
- [ ] Upload GIF image → Should work
- [ ] Upload BMP image → Should work
- [ ] Upload WebP image → Should work
- [ ] Upload PDF file → Should show error "Please select a valid image file"
- [ ] Upload TXT file → Should show error "Please select a valid image file"

#### **✅ File Size Validation:**
- [ ] Upload 5MB image → Should work
- [ ] Upload 10MB image → Should work
- [ ] Upload 25MB image → Should work
- [ ] Upload 31MB image → Should show error "Image size should be less than 30MB"

#### **✅ Image Preview:**
- [ ] Select image → Should show preview
- [ ] Remove image → Should clear preview
- [ ] Preview should be clickable and show full image

### **2. Form Validation Testing**

#### **✅ Required Fields:**
- [ ] Submit without quantity → Should show error "Please enter a valid damaged quantity"
- [ ] Submit with quantity 0 → Should show error "Please enter a valid damaged quantity"
- [ ] Submit without reason → Should show error "Please enter a reason for damage"
- [ ] Submit without image → Should show error "Please upload an image of the damaged goods"

#### **✅ Quantity Validation:**
- [ ] Enter quantity > available stock → Should show error "Damaged quantity cannot exceed available quantity"
- [ ] Enter valid quantity → Should accept

### **3. Form Submission Testing**

#### **✅ Successful Submission:**
- [ ] Fill all fields correctly → Should submit successfully
- [ ] Check browser network tab → Should send FormData (not JSON)
- [ ] Check request headers → Should NOT have Content-Type set manually
- [ ] After success → Should show success message
- [ ] After success → Should reset form
- [ ] After success → Should close modal after 2 seconds

#### **✅ Error Handling:**
- [ ] Network error → Should show "Network error. Please try again."
- [ ] Server error → Should show server error message
- [ ] Invalid product ID → Should show appropriate error

### **4. Damage Summary Report Testing**

#### **✅ Report Display:**
- [ ] Click "Damage Summary Report" → Should open modal
- [ ] Check if reports load → Should show loading spinner
- [ ] Check total reports count → Should match actual reports
- [ ] Check total damaged quantity → Should sum all quantities

#### **✅ Image Display in Table:**
- [ ] Reports with images → Should show thumbnail (50x50px)
- [ ] Click thumbnail → Should open full image in new tab
- [ ] Reports without images → Should show "No image"

#### **✅ Details Modal:**
- [ ] Click "Details" → Should open details modal
- [ ] Check all fields → Should display correctly
- [ ] Check image in details → Should show full size image
- [ ] Click image in details → Should open in new tab

### **5. Integration Testing**

#### **✅ Backend Integration:**
- [ ] Submit report → Check if appears in summary
- [ ] Check image URL → Should use `proofFileSignedUrl`
- [ ] Verify image accessibility → Should be viewable
- [ ] Check database → Should store correct `proofFilePath`

### **6. Browser Compatibility Testing**

#### **✅ Different Browsers:**
- [ ] Chrome → All features work
- [ ] Firefox → All features work
- [ ] Safari → All features work
- [ ] Edge → All features work

#### **✅ Mobile Testing:**
- [ ] Mobile Chrome → Image upload works
- [ ] Mobile Safari → Image upload works
- [ ] Touch interactions → Should work properly

## 🔧 **Debug Information**

### **Network Tab Checks:**
```javascript
// Check request format
Request URL: /warehouses/{warehouseId}/damage-reporting
Request Method: POST
Content-Type: multipart/form-data (auto-set by browser)

// Check FormData contents
FormData:
- productId: number
- damagedQuantity: number  
- reason: string
- imageFile: File object
```

### **Console Logs to Check:**
```javascript
// Should see these logs
"Submitting damage report with data: {...}"
"Damage report response: {...}"
"Setting damage reports: [...]"
```

### **Common Issues & Solutions:**

#### **❌ Issue: Image not uploading**
**Solution:** Check if FormData is being sent correctly, not JSON

#### **❌ Issue: Content-Type error**
**Solution:** Remove manual Content-Type header, let browser set it

#### **❌ Issue: Images not displaying**
**Solution:** Check if using `proofFileSignedUrl` from API response

#### **❌ Issue: Form validation not working**
**Solution:** Check if all required fields are properly validated

## 📞 **Support Contacts**

If you encounter issues:
1. Check browser console for errors
2. Verify network requests in DevTools
3. Test with Postman to confirm backend works
4. Check if all required fields are filled

## 🎯 **Success Criteria**

✅ Image upload works with all supported formats  
✅ File size validation works (max 30MB)  
✅ Form validation prevents invalid submissions  
✅ Images display correctly in summary table  
✅ Click-to-zoom functionality works  
✅ Form resets after successful submission  
✅ Error messages are user-friendly  
✅ Mobile responsiveness works  

---

**🚀 Ready to test! The backend is fully configured to handle image uploads to Google Cloud Storage.** 