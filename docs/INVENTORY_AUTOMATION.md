# Inventory Automation Logic

This document explains exactly how stock updates, ledger entries, and KPI calculations work in StockMaster.

## Core Principles

1. **Stock is always stored per Product + Location**
2. **All stock changes must create Ledger entries**
3. **Validation triggers automation (not draft creation)**
4. **Transactions are atomic (all or nothing)**

## 1. Receipt Validation Flow

### Trigger
User clicks "Validate" on a PENDING receipt.

### Process
```javascript
async function validateReceipt(receiptId) {
  // 1. Load receipt with items
  const receipt = await getReceiptWithItems(receiptId);
  
  // 2. Validate receipt is not already validated
  if (receipt.status === 'VALIDATED') {
    throw new Error('Receipt already validated');
  }
  
  // 3. Start database transaction
  await prisma.$transaction(async (tx) => {
    // 4. For each item in receipt:
    for (const item of receipt.items) {
      // 4a. Find or create Stock record
      let stock = await tx.stock.findUnique({
        where: {
          productId_locationId: {
            productId: item.productId,
            locationId: item.locationId
          }
        }
      });
      
      if (!stock) {
        stock = await tx.stock.create({
          data: {
            productId: item.productId,
            locationId: item.locationId,
            quantity: 0
          }
        });
      }
      
      // 4b. Update stock: ADD quantity
      await tx.stock.update({
        where: { id: stock.id },
        data: {
          quantity: {
            increment: item.quantity  // stock.quantity += item.quantity
          }
        }
      });
      
      // 4c. Create Ledger entry
      await tx.ledger.create({
        data: {
          date: receipt.date,
          productId: item.productId,
          locationId: item.locationId,
          type: 'RECEIPT',
          documentNumber: receipt.documentNumber,
          quantity: item.quantity,  // Positive for receipt
          previousStock: stock.quantity - item.quantity,
          newStock: stock.quantity + item.quantity,
          userId: currentUser.id,
          notes: `Receipt ${receipt.documentNumber} validated`
        }
      });
    }
    
    // 5. Update receipt status
    await tx.receipt.update({
      where: { id: receiptId },
      data: {
        status: 'VALIDATED',
        validatedBy: currentUser.id,
        validatedAt: new Date()
      }
    });
  });
}
```

### Stock Update Formula
```
New Stock = Current Stock + Receipt Quantity
```

### Ledger Entry
- Type: `RECEIPT`
- Quantity: `+item.quantity` (positive)
- Previous Stock: `stock.quantity - item.quantity`
- New Stock: `stock.quantity + item.quantity`

## 2. Delivery Validation Flow

### Trigger
User clicks "Validate" on a PENDING delivery.

### Process
```javascript
async function validateDelivery(deliveryId) {
  const delivery = await getDeliveryWithItems(deliveryId);
  
  if (delivery.status === 'VALIDATED') {
    throw new Error('Delivery already validated');
  }
  
  await prisma.$transaction(async (tx) => {
    // 1. Validate stock availability FIRST
    for (const item of delivery.items) {
      const stock = await tx.stock.findUnique({
        where: {
          productId_locationId: {
            productId: item.productId,
            locationId: item.locationId
          }
        }
      });
      
      const availableStock = stock?.quantity || 0;
      
      if (availableStock < item.quantity) {
        throw new Error(
          `Insufficient stock for ${item.product.sku}. ` +
          `Available: ${availableStock}, Required: ${item.quantity}`
        );
      }
    }
    
    // 2. If all items have sufficient stock, proceed with updates
    for (const item of delivery.items) {
      const stock = await tx.stock.findUnique({
        where: {
          productId_locationId: {
            productId: item.productId,
            locationId: item.locationId
          }
        }
      });
      
      // 2a. Update stock: SUBTRACT quantity
      await tx.stock.update({
        where: { id: stock.id },
        data: {
          quantity: {
            decrement: item.quantity  // stock.quantity -= item.quantity
          }
        }
      });
      
      // 2b. Create Ledger entry
      await tx.ledger.create({
        data: {
          date: delivery.date,
          productId: item.productId,
          locationId: item.locationId,
          type: 'DELIVERY',
          documentNumber: delivery.documentNumber,
          quantity: -item.quantity,  // Negative for delivery
          previousStock: stock.quantity,
          newStock: stock.quantity - item.quantity,
          userId: currentUser.id,
          notes: `Delivery ${delivery.documentNumber} validated`
        }
      });
    }
    
    // 3. Update delivery status
    await tx.delivery.update({
      where: { id: deliveryId },
      data: {
        status: 'VALIDATED',
        validatedBy: currentUser.id,
        validatedAt: new Date()
      }
    });
  });
}
```

### Stock Update Formula
```
New Stock = Current Stock - Delivery Quantity
(Only if Current Stock >= Delivery Quantity)
```

### Ledger Entry
- Type: `DELIVERY`
- Quantity: `-item.quantity` (negative)
- Previous Stock: `stock.quantity`
- New Stock: `stock.quantity - item.quantity`

## 3. Internal Transfer Flow

### Trigger
User clicks "Validate" on a PENDING transfer.

### Process
```javascript
async function validateTransfer(transferId) {
  const transfer = await getTransferWithItems(transferId);
  
  if (transfer.status === 'VALIDATED') {
    throw new Error('Transfer already validated');
  }
  
  await prisma.$transaction(async (tx) => {
    // 1. Validate source stock availability
    for (const item of transfer.items) {
      const sourceStock = await tx.stock.findUnique({
        where: {
          productId_locationId: {
            productId: item.productId,
            locationId: item.fromLocationId
          }
        }
      });
      
      const availableStock = sourceStock?.quantity || 0;
      
      if (availableStock < item.quantity) {
        throw new Error(
          `Insufficient stock at source location. ` +
          `Available: ${availableStock}, Required: ${item.quantity}`
        );
      }
    }
    
    // 2. Process each item
    for (const item of transfer.items) {
      // 2a. Get source stock
      let sourceStock = await tx.stock.findUnique({
        where: {
          productId_locationId: {
            productId: item.productId,
            locationId: item.fromLocationId
          }
        }
      });
      
      // 2b. Decrease source stock
      await tx.stock.update({
        where: { id: sourceStock.id },
        data: {
          quantity: {
            decrement: item.quantity
          }
        }
      });
      
      // 2c. Get or create destination stock
      let destStock = await tx.stock.findUnique({
        where: {
          productId_locationId: {
            productId: item.productId,
            locationId: item.toLocationId
          }
        }
      });
      
      if (!destStock) {
        destStock = await tx.stock.create({
          data: {
            productId: item.productId,
            locationId: item.toLocationId,
            quantity: 0
          }
        });
      }
      
      // 2d. Increase destination stock
      await tx.stock.update({
        where: { id: destStock.id },
        data: {
          quantity: {
            increment: item.quantity
          }
        }
      });
      
      // 2e. Create TWO ledger entries
      // Entry 1: Source (outgoing)
      await tx.ledger.create({
        data: {
          date: transfer.date,
          productId: item.productId,
          locationId: item.fromLocationId,
          type: 'TRANSFER_OUT',
          documentNumber: transfer.documentNumber,
          quantity: -item.quantity,
          previousStock: sourceStock.quantity,
          newStock: sourceStock.quantity - item.quantity,
          userId: currentUser.id,
          notes: `Transfer ${transfer.documentNumber} - Outgoing`
        }
      });
      
      // Entry 2: Destination (incoming)
      await tx.ledger.create({
        data: {
          date: transfer.date,
          productId: item.productId,
          locationId: item.toLocationId,
          type: 'TRANSFER_IN',
          documentNumber: transfer.documentNumber,
          quantity: item.quantity,
          previousStock: destStock.quantity,
          newStock: destStock.quantity + item.quantity,
          userId: currentUser.id,
          notes: `Transfer ${transfer.documentNumber} - Incoming`
        }
      });
    }
    
    // 3. Update transfer status
    await tx.transfer.update({
      where: { id: transferId },
      data: {
        status: 'VALIDATED',
        validatedBy: currentUser.id,
        validatedAt: new Date()
      }
    });
  });
}
```

### Stock Update Formula
```
Source: New Stock = Current Stock - Transfer Quantity
Destination: New Stock = Current Stock + Transfer Quantity
```

### Ledger Entries
- **TRANSFER_OUT**: Negative quantity at source location
- **TRANSFER_IN**: Positive quantity at destination location
- Both entries linked by same `documentNumber`

## 4. Adjustment Flow

### Trigger
User clicks "Save" on an adjustment form (no validation step).

### Process
```javascript
async function createAdjustment(adjustmentData) {
  await prisma.$transaction(async (tx) => {
    // 1. Create adjustment record
    const adjustment = await tx.adjustment.create({
      data: {
        warehouseId: adjustmentData.warehouseId,
        date: adjustmentData.date,
        reason: adjustmentData.reason,
        createdBy: currentUser.id
      }
    });
    
    // 2. Process each item
    for (const item of adjustmentData.items) {
      // 2a. Get current stock
      let stock = await tx.stock.findUnique({
        where: {
          productId_locationId: {
            productId: item.productId,
            locationId: item.locationId
          }
        }
      });
      
      const currentStock = stock?.quantity || 0;
      const physicalCount = item.physicalCount;
      const difference = physicalCount - currentStock;
      
      // 2b. Create or update stock record
      if (!stock) {
        stock = await tx.stock.create({
          data: {
            productId: item.productId,
            locationId: item.locationId,
            quantity: physicalCount
          }
        });
      } else {
        await tx.stock.update({
          where: { id: stock.id },
          data: {
            quantity: physicalCount  // SET to physical count
          }
        });
      }
      
      // 2c. Create adjustment item record
      await tx.adjustmentItem.create({
        data: {
          adjustmentId: adjustment.id,
          productId: item.productId,
          locationId: item.locationId,
          currentStock: currentStock,
          physicalCount: physicalCount,
          difference: difference
        }
      });
      
      // 2d. Create ledger entry
      await tx.ledger.create({
        data: {
          date: adjustment.date,
          productId: item.productId,
          locationId: item.locationId,
          type: 'ADJUSTMENT',
          documentNumber: adjustment.documentNumber,
          quantity: difference,  // Can be positive or negative
          previousStock: currentStock,
          newStock: physicalCount,
          userId: currentUser.id,
          notes: `Adjustment: ${adjustment.reason}`
        }
      });
    }
    
    return adjustment;
  });
}
```

### Stock Update Formula
```
New Stock = Physical Count
Difference = Physical Count - Current Stock
```

### Ledger Entry
- Type: `ADJUSTMENT`
- Quantity: `difference` (can be positive or negative)
- Previous Stock: `currentStock`
- New Stock: `physicalCount`
- Notes: Includes reason for adjustment

## 5. Dashboard KPI Calculations

### Total Stock
```sql
SELECT SUM(quantity) as totalStock
FROM Stock
WHERE warehouseId = ? -- Optional filter
```

### Low Stock Items
```sql
SELECT COUNT(DISTINCT productId) as lowStockItems
FROM Stock s
JOIN Product p ON s.productId = p.id
WHERE s.quantity < p.reorderPoint  -- Assuming reorderPoint field
  AND s.warehouseId = ? -- Optional filter
```

Or simpler (if no reorderPoint):
```sql
SELECT COUNT(DISTINCT productId) as lowStockItems
FROM Stock
WHERE quantity < 10  -- Threshold
  AND warehouseId = ? -- Optional filter
```

### Pending Receipts
```sql
SELECT COUNT(*) as pendingReceipts
FROM Receipt
WHERE status = 'PENDING'
  AND warehouseId = ? -- Optional filter
  AND date BETWEEN ? AND ? -- Optional date range
```

### Pending Deliveries
```sql
SELECT COUNT(*) as pendingDeliveries
FROM Delivery
WHERE status = 'PENDING'
  AND warehouseId = ? -- Optional filter
  AND date BETWEEN ? AND ? -- Optional date range
```

### Pending Transfers
```sql
SELECT COUNT(*) as pendingTransfers
FROM Transfer
WHERE status = 'PENDING'
  AND (fromWarehouseId = ? OR toWarehouseId = ?) -- Optional filter
  AND date BETWEEN ? AND ? -- Optional date range
```

## 6. Ledger Entry Creation Rules

### When Ledger Entries Are Created

1. **Receipt Validation**: One entry per item (type: RECEIPT)
2. **Delivery Validation**: One entry per item (type: DELIVERY)
3. **Transfer Validation**: Two entries per item (TRANSFER_OUT, TRANSFER_IN)
4. **Adjustment Creation**: One entry per item (type: ADJUSTMENT)

### Ledger Entry Structure

```typescript
{
  date: Date,                    // Transaction date
  productId: number,              // Product reference
  locationId: number,             // Location reference
  type: 'RECEIPT' | 'DELIVERY' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'ADJUSTMENT',
  documentNumber: string,         // REC-001, DEL-002, etc.
  quantity: number,               // Positive or negative
  previousStock: number,          // Stock before transaction
  newStock: number,               // Stock after transaction
  userId: number,                 // Who performed the action
  notes: string                  // Additional context
}
```

## 7. Transaction Safety

All stock updates use **database transactions** to ensure:
- **Atomicity**: All operations succeed or all fail
- **Consistency**: Stock levels are always accurate
- **Isolation**: Concurrent operations don't interfere
- **Durability**: Changes are permanently saved

### Example: Concurrent Receipt Validation

If two receipts are validated simultaneously:
1. Database locks prevent race conditions
2. Each transaction sees consistent stock levels
3. Both updates are applied sequentially
4. Final stock = initial + receipt1 + receipt2

## 8. Stock Availability Check

Before any operation that decreases stock:
1. Check current stock level
2. Compare with required quantity
3. If insufficient, throw error with details
4. If sufficient, proceed with transaction

This prevents:
- Negative stock levels
- Overselling
- Invalid transfers

---

**All automation is handled server-side for security and data integrity.**

