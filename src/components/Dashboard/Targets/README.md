# Targets Module

This module implements a comprehensive target management system for supervisors to assign and track targets for their subordinates.

## Features

### 1. Sales Targets
- Track quantity sold in bags or metric tons
- Set monthly, quarterly, or yearly targets
- Monitor progress with visual indicators
- View current and previous target performance

### 2. Customer Targets
- Track customer acquisition targets
- Set monthly, quarterly, or yearly targets
- Monitor progress with visual indicators
- View current and previous target performance

## Components

### TargetsHome.jsx
Main landing page with two tabs:
- Sales Targets
- Customer Targets

### SalesTargets.jsx
- Displays list of employees with their sales targets
- Shows current target progress and status
- Allows adding new sales targets
- Modal view for detailed target information

### CustomerTargets.jsx
- Displays list of employees with their customer acquisition targets
- Shows current target progress and status
- Allows adding new customer targets
- Modal view for detailed target information

### TargetRoutes.jsx
Routing configuration for the targets module

### Targets.module.css
Comprehensive styling for all target components

## API Endpoints

The module expects the following API endpoints:

### GET /targets/sales/{employeeId}
Returns current and previous sales targets for an employee

### GET /targets/customers/{employeeId}
Returns current and previous customer targets for an employee

### POST /targets
Creates a new target (sales or customer)

## Target Data Structure

### Sales Target
```javascript
{
  employeeId: number,
  type: "sales",
  targetQuantity: number,
  unit: "bags" | "metric_tons",
  period: "monthly" | "quarterly" | "yearly",
  startDate: string,
  endDate: string,
  achievedQuantity: number
}
```

### Customer Target
```javascript
{
  employeeId: number,
  type: "customers",
  targetCustomers: number,
  period: "monthly" | "quarterly" | "yearly",
  startDate: string,
  endDate: string,
  achievedCustomers: number
}
```

## Navigation

The targets module is accessible through:
- Navigation bar: "Targets" option
- Search bar: Search for "Targets", "Sales Targets", or "Customer Targets"
- Direct URL: `/targets`, `/targets/sales-target`, `/targets/customers`

## Status Indicators

- **Green**: Target achieved (100% or more)
- **Yellow**: Target in progress (70% or more)
- **Red**: Target behind schedule (less than 70%)
- **Overdue**: Target period has ended without achievement

## Usage

1. Navigate to Targets from the main navigation
2. Choose between Sales Targets or Customer Targets
3. Click on an employee to view their target details
4. Use "Add Target" to assign new targets to employees
5. Monitor progress through visual indicators and percentage displays
