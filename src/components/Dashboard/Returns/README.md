# Returns Management Module

## Overview

The Returns Management Module is a comprehensive system for handling product returns, cancellations, and related processes in the Feed Bazaar application. It provides a complete workflow from return request creation to final processing, including approval workflows, credit note generation, and detailed reporting.

## Features

### 1. Return Request Management
- **Create Return Requests**: Users can create return requests for various scenarios
- **Multiple Return Types**: Support for different return categories (damaged goods, expired products, quality issues, cancellations, etc.)
- **Order Integration**: Seamless integration with existing orders and customer data
- **Warehouse Management**: Track returns by warehouse and manage stock updates

### 2. Return Types & Categories
- **Predefined Types**: System includes common return types:
  - Damaged Goods (delivery damage)
  - Expired Goods
  - Quality Issues
  - Order Cancellation
  - Wrong Item
  - Over Delivery
- **Custom Types**: Ability to create and manage custom return types
- **Type Configuration**: Each type can be configured with specific requirements:
  - Inspection Required
  - Replacement Allowed
  - Credit Note Allowed

### 3. Approval Workflow
- **Role-based Approval**: Configurable approval roles (Admin, Manager, etc.)
- **Multi-level Approval**: Support for different approval levels
- **Approval Actions**:
  - Approve Return Only
  - Approve with Replacement
  - Approve with Credit Note
- **Rejection Handling**: Detailed rejection reasons and alternative suggestions

### 4. Credit Note Generation
- **Automatic Generation**: Credit notes can be auto-generated on approval
- **Manual Generation**: Manual credit note creation with custom amounts
- **Credit Note Management**: Track credit note validity and usage
- **Integration**: Seamless integration with accounting systems

### 5. Processing & Completion
- **Return Processing**: Track return processing status
- **Inspection Management**: Handle inspection requirements and reports
- **Stock Updates**: Automatic stock updates when returns are completed
- **Customer Notification**: Automated notifications for customers

### 6. Reporting & Analytics
- **Summary Reports**: Overview of return statistics and trends
- **Detailed Reports**: Comprehensive return data with filtering options
- **Export Functionality**: CSV export for external analysis
- **Analytics Dashboard**: Visual representation of return data

### 7. Settings & Configuration
- **Approval Settings**: Configure approval roles and auto-approval rules
- **Notification Settings**: Email notification preferences
- **Processing Settings**: Default processing rules and time limits
- **Integration Settings**: System integration configurations

## Return Scenarios

### 1. Warehouse Level Cancellation
- **Before Loading**: Cancel invoice before stock is loaded
- **Stock Restoration**: Automatically add stock back to originating warehouse
- **Cross-warehouse**: Handle transfers between warehouses
- **Customer Notification**: Notify customer about cancellation

### 2. Post-Delivery Returns

#### Damaged Goods
- **Driver Damage**: Goods damaged during delivery
- **Options**: Replace damaged quantity or raise credit note
- **Inspection**: Required inspection of returned goods
- **Reporting**: Damage reports for quality control

#### Quality Issues
- **Customer Dissatisfaction**: Customer not satisfied with product quality
- **Full Return**: Return entire order quantity
- **Credit Note**: Raise credit note for full amount
- **Quality Tracking**: Track quality issues for improvement

#### Expired Goods
- **Expiration Check**: Identify expired products
- **Partial Return**: Return only expired quantities
- **Replacement/Credit**: Customer choice between replacement or credit
- **Expiry Tracking**: Monitor expiration patterns

## User Roles & Permissions

### Admin
- Full access to all return functions
- Can approve/reject any return
- Can modify settings and configurations
- Can generate credit notes

### Manager
- Can approve/reject returns
- Can process returns
- Can generate credit notes
- Limited settings access

### Warehouse Manager
- Can process approved returns
- Can complete return processing
- Can update stock levels
- Can handle inspections

### BO (Business Operations)
- Can create return requests
- Can view return status
- Limited processing capabilities

## API Endpoints

The module expects the following API endpoints:

### Returns
- `GET /returns` - Get all returns
- `POST /returns` - Create new return
- `PUT /returns/:id` - Update return
- `POST /returns/:id/approve` - Approve return
- `POST /returns/:id/reject` - Reject return
- `POST /returns/:id/process` - Process return
- `POST /returns/:id/complete` - Complete return
- `POST /returns/:id/credit-note` - Generate credit note

### Return Types
- `GET /return-types` - Get return types
- `POST /return-types` - Create return type
- `PUT /return-types/:id` - Update return type

### Settings
- `GET /return-settings` - Get return settings
- `PUT /return-settings` - Update return settings

## File Structure

```
src/components/Dashboard/Returns/
├── ReturnsHome.jsx              # Main returns dashboard
├── ReturnRequests.jsx           # Return requests management
├── ReturnTypes.jsx              # Return types management
├── ReturnReports.jsx            # Reports and analytics
├── ReturnSettings.jsx           # Settings and configuration
├── CreateReturnModal.jsx        # Create return request modal
├── ViewReturnModal.jsx          # View return details modal
├── ApproveReturnModal.jsx       # Approve return modal
├── RejectReturnModal.jsx        # Reject return modal
├── ReturnRoutes.jsx             # Routing configuration
├── Returns.module.css           # Styling
└── README.md                    # Documentation
```

## Usage

### Creating a Return Request

1. Navigate to Returns module
2. Click "Create Return Request"
3. Select the order to return
4. Choose return type and reason
5. Enter return amount and quantity
6. Select warehouse
7. Add description and submit

### Approving a Return

1. View pending returns
2. Click "Approve" on a return request
3. Add approval notes
4. Choose approval action (approve only, with replacement, with credit note)
5. Set inspection requirements if needed
6. Submit approval

### Processing a Return

1. View approved returns
2. Click "Process" to start processing
3. Handle inspection if required
4. Update stock levels
5. Complete the return process

### Generating Reports

1. Navigate to Reports tab
2. Select report type (Summary or Detailed)
3. Apply filters (date range, type, status)
4. View results or export to CSV

## Configuration

### Return Types
- Configure predefined return types
- Create custom return types
- Set type-specific requirements
- Manage type categories

### Settings
- Configure approval roles
- Set notification preferences
- Define processing rules
- Configure integrations

## Integration Points

### Inventory System
- Automatic stock updates on return completion
- Stock restoration to appropriate warehouses
- Inventory tracking for returned items

### Accounting System
- Credit note generation
- Financial reporting
- Cost tracking for returns

### Customer Management
- Customer notification system
- Return history tracking
- Customer satisfaction monitoring

### Order Management
- Order status updates
- Order modification tracking
- Order history integration

## Best Practices

1. **Regular Monitoring**: Monitor return trends and patterns
2. **Quality Control**: Use inspection data to improve product quality
3. **Customer Communication**: Keep customers informed throughout the process
4. **Documentation**: Maintain detailed records of all return activities
5. **Process Optimization**: Continuously improve return processes based on data

## Troubleshooting

### Common Issues

1. **Return Not Appearing**: Check if user has proper permissions
2. **Approval Issues**: Verify approval roles are configured correctly
3. **Stock Update Problems**: Ensure inventory integration is enabled
4. **Notification Failures**: Check email settings and templates

### Support

For technical support or feature requests, please contact the development team or create an issue in the project repository.
