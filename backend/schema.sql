-- Fan Hub Plus Database Schema for MySQL
-- Created: 2026-09-24

CREATE DATABASE IF NOT EXISTS `fan_hub_plus` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `fan_hub_plus`;

-- 1. Roles Table
DROP TABLE IF EXISTS `bookmarks`;
DROP TABLE IF EXISTS `contents`;
DROP TABLE IF EXISTS `feedback`;
DROP TABLE IF EXISTS `merchandise`;
DROP TABLE IF EXISTS `events`;
DROP TABLE IF EXISTS `characters`;
DROP TABLE IF EXISTS `categories`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `roles`;

CREATE TABLE `roles` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(50) NOT NULL UNIQUE,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Users Table
CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(80) NOT NULL UNIQUE,
  `email` VARCHAR(120) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `full_name` VARCHAR(120) DEFAULT '',
  `avatar` VARCHAR(255) DEFAULT '',
  `bio` TEXT,
  `role_id` INT NOT NULL DEFAULT 2,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE RESTRICT,
  INDEX `idx_users_email` (`email`),
  INDEX `idx_users_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Categories Table
CREATE TABLE `categories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL UNIQUE,
  `slug` VARCHAR(100) NOT NULL UNIQUE,
  `description` TEXT,
  `icon` VARCHAR(50) DEFAULT 'folder',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_categories_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Characters Table (Should-Have Feature)
CREATE TABLE `characters` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(120) NOT NULL,
  `anime_fandom` VARCHAR(120) NOT NULL,
  `role_type` VARCHAR(80) DEFAULT 'Protagonist',
  `bio` TEXT,
  `avatar` VARCHAR(500) DEFAULT '',
  `banner` VARCHAR(500) DEFAULT '',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Contents Table
CREATE TABLE `contents` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL UNIQUE,
  `summary` TEXT NOT NULL,
  `content` LONGTEXT NOT NULL,
  `cover_image` VARCHAR(500) DEFAULT '',
  `category_id` INT NOT NULL,
  `character_id` INT NULL,
  `author_id` INT NOT NULL,
  `view_count` INT DEFAULT 0,
  `featured` TINYINT(1) DEFAULT 0,
  `tags` VARCHAR(255) DEFAULT '',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`character_id`) REFERENCES `characters`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_contents_title` (`title`),
  INDEX `idx_contents_category` (`category_id`),
  INDEX `idx_contents_views` (`view_count`),
  INDEX `idx_contents_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Bookmarks Table
CREATE TABLE `bookmarks` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `content_id` INT NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`content_id`) REFERENCES `contents`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_user_bookmark` (`user_id`, `content_id`),
  INDEX `idx_bookmarks_user` (`user_id`),
  INDEX `idx_bookmarks_content` (`content_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Feedback Table (Should-Have Feature)
CREATE TABLE `feedback` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NULL,
  `name` VARCHAR(120) NOT NULL,
  `email` VARCHAR(120) NOT NULL,
  `subject` VARCHAR(200) NOT NULL,
  `message` TEXT NOT NULL,
  `status` VARCHAR(50) DEFAULT 'pending',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. Merchandise Table (Should-Have Feature)
CREATE TABLE `merchandise` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(200) NOT NULL,
  `description` TEXT,
  `price` DECIMAL(10, 2) NOT NULL,
  `image` VARCHAR(500) DEFAULT '',
  `category` VARCHAR(100) DEFAULT 'Figures',
  `stock` INT DEFAULT 50,
  `rating` DECIMAL(3, 1) DEFAULT 4.8,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. Events Table (Should-Have Feature)
CREATE TABLE `events` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(200) NOT NULL,
  `description` TEXT,
  `location` VARCHAR(200) NOT NULL,
  `event_date` VARCHAR(100) NOT NULL,
  `banner` VARCHAR(500) DEFAULT '',
  `organizer` VARCHAR(120) DEFAULT 'Fan Hub Plus Team',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
