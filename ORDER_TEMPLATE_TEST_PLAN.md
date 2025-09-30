# Order Template Testing Plan

## 🎯 Features to Test

### 1. **Template Creation**
- [ ] Create a new order template with multiple coffee items
- [ ] Save template with name and description
- [ ] Save as public vs private template
- [ ] Validate template name uniqueness
- [ ] Handle empty templates (should show error)

### 2. **Template Loading**
- [ ] Load existing template into order form
- [ ] Verify quantities are populated correctly
- [ ] Modify quantities after loading template
- [ ] Out-of-stock items should be cleared automatically
- [ ] Template loading should show info message

### 3. **Stock Validation**
- [ ] Out-of-stock coffee should be marked as unavailable
- [ ] Input fields should be disabled for out-of-stock items
- [ ] Low stock items should show warning chips
- [ ] Quantity validation should work correctly

### 4. **Template Management**
- [ ] View list of available templates
- [ ] Delete own templates (delete button should be disabled for others' templates)
- [ ] Templates should show item count
- [ ] Public templates should be visible to all users

### 5. **Order Submission**
- [ ] Submit order after loading template
- [ ] Submit order after modifying template quantities
- [ ] Validation should prevent submitting invalid quantities
- [ ] Success should refresh data and close dialog

## 🧪 Test Scenarios

### Scenario 1: Basic Template Workflow
1. Open order dialog
2. Fill in quantities for 2-3 coffee items
3. Click save template button
4. Enter template name "Weekly Order"
5. Save template
6. Clear form and load the template
7. Modify one quantity
8. Submit order

### Scenario 2: Out-of-Stock Handling
1. Create template with coffee that will be out of stock
2. Reduce coffee inventory to 0
3. Load template
4. Verify out-of-stock items are cleared and disabled
5. Submit order with remaining items

### Scenario 3: Template Management
1. Create multiple templates
2. Load different templates
3. Try to delete someone else's template (should be disabled)
4. Delete own template
5. Verify template list updates

## 🔍 Manual Testing Steps

### Step 1: Access the Application
1. Open http://localhost:3001
2. Login with admin credentials (admin/admin123)
3. Navigate to Orders page
4. Select a shop
5. Click "Create Order" button

### Step 2: Test Template Creation
1. In the order dialog, expand "Order Templates" section
2. Fill in some quantities for available coffee
3. Click the save icon (💾) in the dialog header
4. Enter template name and description
5. Click "Save Template"
6. Verify template appears in the list

### Step 3: Test Template Loading
1. Clear the form by refreshing or reopening dialog
2. Select your saved template from dropdown
3. Verify quantities are loaded
4. Modify some quantities
5. Verify you can still submit the order

### Step 4: Test Stock Validation
1. Check if any coffee shows "Out of Stock" or "Low Stock" chips
2. Verify input fields are disabled for out-of-stock items
3. Try entering quantities that exceed available stock
4. Verify validation errors appear

## ✅ Expected Results

- **Template Creation**: Should save successfully and appear in list
- **Template Loading**: Should populate form with saved quantities
- **Stock Validation**: Out-of-stock items should be clearly marked and disabled
- **Order Submission**: Should work normally after loading/modifying templates
- **UI Feedback**: Clear messages about template loading and stock status

## 🐛 Common Issues to Watch For

1. **Import Errors**: Check browser console for any module import issues
2. **API Errors**: Check network tab for failed API calls to `/api/retail/order-templates`
3. **Database Errors**: Ensure OrderTemplate tables were created properly
4. **Validation Issues**: Ensure quantity validation works after template loading
5. **UI Issues**: Check that disabled fields and chips display correctly

## 📊 Success Criteria

- ✅ All template CRUD operations work
- ✅ Stock validation prevents invalid orders
- ✅ UI clearly shows stock status
- ✅ Templates can be loaded and modified
- ✅ Order submission works with templates
- ✅ No console errors or API failures
