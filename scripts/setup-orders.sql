-- Setup script for new orders table with sequential IDs
-- This will create a fresh orders table with auto-incrementing IDs

USE snsu_canteen;

-- Drop existing orders table if it exists
DROP TABLE IF EXISTS orders;

-- Create new orders table with auto-incrementing ID
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

-- Insert a sample order to test the auto-increment
INSERT INTO orders (student_id, student_name, total_amount, status, items) VALUES 
('sample_student_id', 'Sample Student', 150.00, 'PENDING', '[{"name":"Sample Item","price":150,"quantity":1}]');

-- Verify the table structure
DESCRIBE orders;

-- Show the sample order
SELECT * FROM orders;
