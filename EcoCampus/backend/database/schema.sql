CREATE DATABASE IF NOT EXISTS ecocampus;
USE ecocampus;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin','user') NOT NULL DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bin_code VARCHAR(30) NOT NULL UNIQUE,
    location VARCHAR(150) NOT NULL,
    waste_type ENUM('General','Recyclable','Organic','E-Waste') DEFAULT 'General',
    fill_level INT NOT NULL DEFAULT 0,
    latitude DECIMAL(10,7) NULL,
    longitude DECIMAL(10,7) NULL,
    status ENUM('LOW','MEDIUM','FULL') NOT NULL DEFAULT 'LOW',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS collections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bin_id INT NOT NULL,
    user_id INT NOT NULL,
    status ENUM('completed') DEFAULT 'completed',
    collected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bin_id) REFERENCES bins(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS issues (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bin_id INT NULL,
    user_id INT NOT NULL,
    issue_type VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    status ENUM('open','in_progress','resolved') DEFAULT 'open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bin_id) REFERENCES bins(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

INSERT IGNORE INTO bins
(bin_code, location, waste_type, fill_level, status)
VALUES
('B001','Canteen','Organic',92,'FULL'),
('B002','Block A','General',55,'MEDIUM'),
('B003','Library','Recyclable',25,'LOW'),
('B004','Parking','General',87,'FULL'),
('B005','Main Gate','Recyclable',71,'MEDIUM'),
('B006','Block B','Organic',43,'LOW'),
('B007','Hostel A','General',82,'FULL'),
('B008','Sports Ground','Recyclable',61,'MEDIUM');
