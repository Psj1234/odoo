-- SQL script to verify all tables exist
-- Run this in your PostgreSQL database to check table structure

-- Check if tables exist
SELECT 
    table_name,
    CASE 
        WHEN table_name IN ('User', 'Delivery', 'Ledger', 'Location', 'Warehouse', 'Product', 'Receipt', 'Transfer', 'Adjustment', 'Stock', 'Category', 'ReceiptItem', 'DeliveryItem', 'TransferItem', 'AdjustmentItem') 
        THEN '✅ Exists'
        ELSE '❌ Missing'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Count records in each table
SELECT 'User' as table_name, COUNT(*) as record_count FROM "User"
UNION ALL
SELECT 'Delivery', COUNT(*) FROM "Delivery"
UNION ALL
SELECT 'Ledger', COUNT(*) FROM "Ledger"
UNION ALL
SELECT 'Location', COUNT(*) FROM "Location"
UNION ALL
SELECT 'Warehouse', COUNT(*) FROM "Warehouse"
UNION ALL
SELECT 'Product', COUNT(*) FROM "Product"
UNION ALL
SELECT 'Receipt', COUNT(*) FROM "Receipt"
UNION ALL
SELECT 'Transfer', COUNT(*) FROM "Transfer"
UNION ALL
SELECT 'Adjustment', COUNT(*) FROM "Adjustment"
UNION ALL
SELECT 'Stock', COUNT(*) FROM "Stock"
ORDER BY table_name;

