-- phpMyAdmin SQL Dump
-- version 4.9.7
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Aug 30, 2025 at 08:01 AM
-- Server version: 10.6.5-MariaDB
-- PHP Version: 7.4.26

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `snsu_canteen`
--

-- --------------------------------------------------------

--
-- Table structure for table `combos`
--

DROP TABLE IF EXISTS `combos`;
CREATE TABLE IF NOT EXISTS `combos` (
  `id` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `price` int(11) NOT NULL,
  `item_ids` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `image` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `combos`
--

INSERT INTO `combos` (`id`, `name`, `price`, `item_ids`, `image`, `created_at`) VALUES
('rCJu9Ncc3UzpvZRK', 'chiRice', 25, '[\"zSms8hO_TVmyFV3Z\",\"L5HOSjBHu0KzLvuy\"]', '/images/1756539794455-188486259.png', '2025-08-30 07:43:16');

-- --------------------------------------------------------

--
-- Table structure for table `items`
--

DROP TABLE IF EXISTS `items`;
CREATE TABLE IF NOT EXISTS `items` (
  `id` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` enum('MEAL','SNACKS','DRINKS','BISCUIT') COLLATE utf8mb4_unicode_ci NOT NULL,
  `price` int(11) NOT NULL,
  `image` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `items`
--

INSERT INTO `items` (`id`, `name`, `category`, `price`, `image`, `created_at`) VALUES
('L5HOSjBHu0KzLvuy', 'Rice', 'MEAL', 10, '/images/1756535190017-961976306.webp', '2025-08-30 06:26:31'),
('zSms8hO_TVmyFV3Z', 'chicken', 'MEAL', 15, '/images/1756535209153-973490926.webp', '2025-08-30 06:26:50');

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
CREATE TABLE IF NOT EXISTS `orders` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `student_name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_amount` decimal(10,2) NOT NULL,
  `status` enum('PENDING','CONFIRMED','REFUNDED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `items` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`items`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_student_id` (`student_id`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`id`, `student_id`, `student_name`, `total_amount`, `status`, `items`, `created_at`, `updated_at`) VALUES
(1, '-8wrIAQYVAQgdZ2W', 'ace', '25.00', 'PENDING', '[{\"id\":1756538827580,\"name\":\"chicken\",\"price\":15,\"quantity\":1,\"image\":{\"uri\":\"http://192.168.1.5:4000/images/1756535209153-973490926.webp\"}},{\"id\":1756538828616,\"name\":\"Rice\",\"price\":10,\"quantity\":1,\"image\":{\"uri\":\"http://192.168.1.5:4000/images/1756535190017-961976306.webp\"}}]', '2025-08-30 07:28:55', '2025-08-30 07:28:55'),
(2, '-8wrIAQYVAQgdZ2W', 'ace', '70.00', 'PENDING', '[{\"id\":\"L5HOSjBHu0KzLvuy\",\"name\":\"Rice\",\"price\":10,\"quantity\":1,\"image\":{\"uri\":\"http://192.168.1.5:4000/images/1756535190017-961976306.webp\"}},{\"id\":\"zSms8hO_TVmyFV3Z\",\"name\":\"chicken\",\"price\":15,\"quantity\":4,\"image\":{\"uri\":\"http://192.168.1.5:4000/images/1756535209153-973490926.webp\"}}]', '2025-08-30 07:29:09', '2025-08-30 07:29:09'),
(3, 'MSb929pUUliaUZZx', 'Uverru', '25.00', 'PENDING', '[{\"id\":\"zSms8hO_TVmyFV3Z\",\"name\":\"chicken\",\"price\":15,\"quantity\":1,\"image\":{\"uri\":\"http://192.168.1.5:4000/images/1756535209153-973490926.webp\"}},{\"id\":\"L5HOSjBHu0KzLvuy\",\"name\":\"Rice\",\"price\":10,\"quantity\":1,\"image\":{\"uri\":\"http://192.168.1.5:4000/images/1756535190017-961976306.webp\"}}]', '2025-08-30 07:29:42', '2025-08-30 07:29:42');

-- --------------------------------------------------------

--
-- Table structure for table `students`
--

DROP TABLE IF EXISTS `students`;
CREATE TABLE IF NOT EXISTS `students` (
  `id` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `balance` int(65) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `students`
--

INSERT INTO `students` (`id`, `email`, `password`, `name`, `balance`, `created_at`) VALUES
('-8wrIAQYVAQgdZ2W', 'ace@gmail.com', 'dotaimba', 'ace', 631, '2025-08-27 11:29:58'),
('MSb929pUUliaUZZx', 'Uverru@gmail.com', '12345678', 'Uverru', 175, '2025-08-27 11:22:47');

--
-- Constraints for dumped tables
--

--
-- Constraints for table `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
