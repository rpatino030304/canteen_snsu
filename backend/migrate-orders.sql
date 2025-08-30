-- Migration script to update orders table to use auto-incrementing IDs
-- Run this after updating the schema.sql

-- First, backup existing orders data
CREATE TABLE orders_backup AS SELECT * FROM orders;

-- Drop the existing orders table
DROP TABLE orders;

-- Recreate the orders table with auto-incrementing ID
CREATE TABLE `orders` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `student_id` VARCHAR(32) NOT NULL,
  `student_name` VARCHAR(191) NOT NULL,
  `total_amount` DECIMAL(10,2) NOT NULL,
  `status` ENUM('PENDING', 'CONFIRMED', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
  `items` JSON NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE,
  INDEX `idx_student_id` (`student_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Restore data from backup (this will assign new sequential IDs)
INSERT INTO orders (student_id, student_name, total_amount, status, items, created_at, updated_at)
SELECT student_id, student_name, total_amount, status, items, created_at, updated_at
FROM orders_backup
ORDER BY created_at ASC;

-- Drop the backup table
DROP TABLE orders_backup;

-- Verify the migration
SELECT id, student_name, total_amount, status, created_at FROM orders ORDER BY id;
