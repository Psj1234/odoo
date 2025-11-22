# API Documentation

Base URL: `http://localhost:5000/api`

All endpoints require JWT authentication (except login endpoints). Include token in header:
```
Authorization: Bearer <token>
```

## Authentication

### 1. Request OTP
**POST** `/auth/request-otp`

Request body:
```json
{
  "phone": "+1234567890"
}
```

Response (200):
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "sessionId": "session_abc123"
}
```

Error (400):
```json
{
  "success": false,
  "error": "Invalid phone number format"
}
```

### 2. Verify OTP
**POST** `/auth/verify-otp`

Request body:
```json
{
  "phone": "+1234567890",
  "code": "123456",
  "sessionId": "session_abc123"
}
```

Response (200):
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "phone": "+1234567890",
    "name": "John Doe",
    "role": "INVENTORY_MANAGER"
  }
}
```

Error (401):
```json
{
  "success": false,
  "error": "Invalid OTP code"
}
```

## Dashboard

### Get Dashboard KPIs
**GET** `/dashboard/kpis?warehouseId=1&startDate=2024-01-01&endDate=2024-01-31`

Response (200):
```json
{
  "success": true,
  "data": {
    "totalStock": 1234,
    "lowStockItems": 12,
    "pendingReceipts": 5,
    "pendingDeliveries": 3,
    "pendingTransfers": 2
  }
}
```

### Get Recent Transactions
**GET** `/dashboard/recent?limit=10`

Response (200):
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "type": "RECEIPT",
      "documentNumber": "REC-001",
      "date": "2024-01-15",
      "status": "VALIDATED",
      "warehouse": "WH-001"
    }
  ]
}
```

## Products

### List Products
**GET** `/products?page=1&limit=20&search=SKU&categoryId=1&warehouseId=1`

Response (200):
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "sku": "SKU-001",
      "name": "Product A",
      "category": "Category 1",
      "unit": "pcs",
      "stock": {
        "total": 100,
        "byLocation": [
          {"locationId": 1, "quantity": 60},
          {"locationId": 2, "quantity": 40}
        ]
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3
  }
}
```

### Get Product by ID
**GET** `/products/:id`

Response (200):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "sku": "SKU-001",
    "name": "Product A",
    "description": "Product description",
    "categoryId": 1,
    "unit": "pcs",
    "stock": {
      "total": 100,
      "byLocation": [...]
    }
  }
}
```

### Create Product
**POST** `/products`

Request body:
```json
{
  "sku": "SKU-001",
  "name": "Product A",
  "description": "Product description",
  "categoryId": 1,
  "unit": "pcs"
}
```

Response (201):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "sku": "SKU-001",
    "name": "Product A",
    ...
  }
}
```

### Update Product
**PUT** `/products/:id`

Request body: (same as create)

### Delete Product
**DELETE** `/products/:id`

Response (200):
```json
{
  "success": true,
  "message": "Product deleted successfully"
}
```

## Receipts

### List Receipts
**GET** `/receipts?page=1&limit=20&status=PENDING&warehouseId=1&startDate=2024-01-01&endDate=2024-01-31`

Response (200):
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "documentNumber": "REC-001",
      "date": "2024-01-15",
      "warehouseId": 1,
      "warehouse": "WH-001",
      "status": "PENDING",
      "items": [
        {
          "productId": 1,
          "product": "Product A",
          "quantity": 50,
          "unitPrice": 100.00
        }
      ],
      "total": 5000.00
    }
  ],
  "pagination": {...}
}
```

### Get Receipt by ID
**GET** `/receipts/:id`

Response (200):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "documentNumber": "REC-001",
    "date": "2024-01-15",
    "warehouseId": 1,
    "status": "PENDING",
    "items": [...],
    "notes": "Received from supplier",
    "createdBy": 1,
    "validatedBy": null,
    "validatedAt": null
  }
}
```

### Create Receipt
**POST** `/receipts`

Request body:
```json
{
  "warehouseId": 1,
  "date": "2024-01-15",
  "notes": "Received from supplier",
  "items": [
    {
      "productId": 1,
      "locationId": 1,
      "quantity": 50,
      "unitPrice": 100.00
    }
  ]
}
```

Response (201):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "documentNumber": "REC-001",
    ...
  }
}
```

### Validate Receipt
**POST** `/receipts/:id/validate`

Response (200):
```json
{
  "success": true,
  "message": "Receipt validated successfully",
  "data": {
    "id": 1,
    "status": "VALIDATED",
    "validatedAt": "2024-01-15T10:30:00Z"
  }
}
```

**Business Logic:**
- Updates stock for each item: `Stock[productId][locationId] += quantity`
- Creates ledger entries for each item
- Updates receipt status to VALIDATED
- Cannot validate already validated receipt

Error (400):
```json
{
  "success": false,
  "error": "Receipt already validated"
}
```

## Delivery Orders

### List Deliveries
**GET** `/deliveries?page=1&limit=20&status=PENDING&warehouseId=1`

Response format: Same as receipts

### Get Delivery by ID
**GET** `/deliveries/:id`

### Create Delivery
**POST** `/deliveries`

Request body:
```json
{
  "warehouseId": 1,
  "date": "2024-01-15",
  "customerName": "Customer ABC",
  "notes": "Delivery notes",
  "items": [
    {
      "productId": 1,
      "locationId": 1,
      "quantity": 10,
      "unitPrice": 100.00
    }
  ]
}
```

### Validate Delivery
**POST** `/deliveries/:id/validate`

**Business Logic:**
- Validates stock availability: `Stock[productId][locationId] >= quantity`
- Updates stock: `Stock[productId][locationId] -= quantity`
- Creates ledger entries
- Updates delivery status to VALIDATED

Error (400):
```json
{
  "success": false,
  "error": "Insufficient stock for product SKU-001"
}
```

## Internal Transfers

### List Transfers
**GET** `/transfers?page=1&limit=20&status=PENDING&fromWarehouseId=1&toWarehouseId=2`

### Get Transfer by ID
**GET** `/transfers/:id`

### Create Transfer
**POST** `/transfers`

Request body:
```json
{
  "fromWarehouseId": 1,
  "toWarehouseId": 2,
  "date": "2024-01-15",
  "notes": "Transfer notes",
  "items": [
    {
      "productId": 1,
      "fromLocationId": 1,
      "toLocationId": 3,
      "quantity": 20
    }
  ]
}
```

### Validate Transfer
**POST** `/transfers/:id/validate`

**Business Logic:**
- Validates source stock: `Stock[productId][fromLocationId] >= quantity`
- Updates source: `Stock[productId][fromLocationId] -= quantity`
- Updates destination: `Stock[productId][toLocationId] += quantity`
- Creates ledger entries for both movements
- Updates transfer status to VALIDATED

## Adjustments

### List Adjustments
**GET** `/adjustments?page=1&limit=20&warehouseId=1`

### Get Adjustment by ID
**GET** `/adjustments/:id`

### Create Adjustment
**POST** `/adjustments`

Request body:
```json
{
  "warehouseId": 1,
  "date": "2024-01-15",
  "reason": "Stocktake",
  "items": [
    {
      "productId": 1,
      "locationId": 1,
      "physicalCount": 95,
      "currentStock": 100,
      "difference": -5
    }
  ]
}
```

**Business Logic:**
- Calculates difference: `difference = physicalCount - currentStock`
- Updates stock: `Stock[productId][locationId] = physicalCount`
- Creates ledger entry with reason
- Cannot be "validated" - saved immediately

Response (201):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "items": [
      {
        "productId": 1,
        "physicalCount": 95,
        "currentStock": 100,
        "difference": -5
      }
    ]
  }
}
```

## Ledger (Move History)

### Get Ledger Entries
**GET** `/ledger?page=1&limit=50&productId=1&warehouseId=1&startDate=2024-01-01&endDate=2024-01-31&type=RECEIPT`

Response (200):
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "date": "2024-01-15",
      "productId": 1,
      "product": "Product A",
      "type": "RECEIPT",
      "documentNumber": "REC-001",
      "quantity": 50,
      "locationId": 1,
      "location": "Zone A",
      "warehouseId": 1,
      "warehouse": "WH-001",
      "user": "John Doe",
      "notes": "Receipt validated"
    }
  ],
  "pagination": {...}
}
```

## Settings

### Warehouses

#### List Warehouses
**GET** `/warehouses`

#### Create Warehouse
**POST** `/warehouses`

Request body:
```json
{
  "name": "Warehouse 1",
  "code": "WH-001",
  "address": "123 Main St",
  "phone": "+1234567890"
}
```

#### Update Warehouse
**PUT** `/warehouses/:id`

#### Delete Warehouse
**DELETE** `/warehouses/:id`

### Locations

#### List Locations
**GET** `/locations?warehouseId=1`

#### Create Location
**POST** `/locations`

Request body:
```json
{
  "warehouseId": 1,
  "name": "Zone A",
  "code": "Z-A",
  "type": "STORAGE"
}
```

#### Update Location
**PUT** `/locations/:id`

#### Delete Location
**DELETE** `/locations/:id`

### Categories

#### List Categories
**GET** `/categories`

#### Create Category
**POST** `/categories`

Request body:
```json
{
  "name": "Category 1",
  "description": "Category description"
}
```

## Profile

### Get Current User
**GET** `/profile`

### Update Profile
**PUT** `/profile`

Request body:
```json
{
  "name": "John Doe",
  "phone": "+1234567890"
}
```

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": "Error message",
  "details": {} // Optional, for validation errors
}
```

Status codes:
- 200: Success
- 201: Created
- 400: Bad Request (validation errors)
- 401: Unauthorized (invalid/missing token)
- 403: Forbidden (insufficient permissions)
- 404: Not Found
- 500: Internal Server Error

