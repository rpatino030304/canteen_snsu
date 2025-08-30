# Order ID System Update

## Overview
This update changes the order ID system from random strings (like `mJ2Jd3NwcqahDeBV`) to sequential numbers starting from 01.

## Changes Made

### 1. Database Schema (`backend/schema.sql`)
- Changed `orders.id` from `VARCHAR(32)` to `INT AUTO_INCREMENT`
- This will automatically generate sequential IDs: 1, 2, 3, 4, etc.

### 2. Backend Server (`backend/server.js`)
- Removed `nanoid(16)` generation
- Now uses `result.insertId` from MySQL auto-increment
- Order IDs are automatically assigned by the database

### 3. Frontend Updates
- **Homepage**: Receipt now shows actual order ID from backend
- **Admin Orders**: Search functionality works with numeric IDs
- Order IDs are displayed as "01", "02", "03", etc.

## Implementation Steps

### Step 1: Update Database
```sql
-- Run the migration script
mysql -u your_username -p snsu_canteen < backend/migrate-orders.sql

-- OR use the setup script for fresh installation
mysql -u your_username -p snsu_canteen < scripts/setup-orders.sql
```

### Step 2: Restart Backend Server
```bash
cd backend
npm start
```

### Step 3: Test the System
1. Create a new order from the homepage
2. Check that the receipt shows a sequential ID (01, 02, 03, etc.)
3. Verify admin orders page displays sequential IDs
4. Test search functionality with numeric IDs

## Benefits

✅ **User-Friendly**: Easy to remember and reference order numbers  
✅ **Professional**: Looks more like real-world order systems  
✅ **Searchable**: Admins can easily find orders by number  
✅ **Sequential**: Natural progression makes tracking easier  

## Example Order IDs

- **Before**: `mJ2Jd3NwcqahDeBV`, `kL9mN2pQrStUvWxY`
- **After**: `01`, `02`, `03`, `04`, `05`

## Notes

- **Existing Orders**: If you have existing orders, they will be renumbered sequentially
- **Backup**: The migration script creates a backup before making changes
- **Compatibility**: All existing functionality remains the same, only ID format changes

## Troubleshooting

If you encounter issues:
1. Check that the database migration completed successfully
2. Verify the backend server is running with updated code
3. Clear any cached data in the frontend
4. Check browser console for any JavaScript errors
