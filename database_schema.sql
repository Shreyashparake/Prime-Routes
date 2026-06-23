-- PrimeRoutes Database Schema

CREATE DATABASE IF NOT EXISTS prime_routes;
USE prime_routes;

-- Operators table
CREATE TABLE IF NOT EXISTS operators (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_name VARCHAR(255) NOT NULL,
  owner_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20) NOT NULL,
  password VARCHAR(255) NOT NULL,
  address TEXT,
  bank_account VARCHAR(50),
  ifsc_code VARCHAR(20),
  fleet_size INT,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Routes table
CREATE TABLE IF NOT EXISTS routes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  from_city VARCHAR(100) NOT NULL,
  to_city VARCHAR(100) NOT NULL,
  distance_km INT,
  estimated_duration TIME
);

-- Buses table
CREATE TABLE IF NOT EXISTS buses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  operator_id INT NULL,
  route_id INT NOT NULL,
  bus_type VARCHAR(100) NOT NULL,
  capacity INT NOT NULL,
  route_from VARCHAR(100) NOT NULL,
  route_to VARCHAR(100) NOT NULL,
  departure_time DATETIME NOT NULL,
  arrival_time DATETIME NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  amenities TEXT,
  FOREIGN KEY (operator_id) REFERENCES operators(id),
  FOREIGN KEY (route_id) REFERENCES routes(id)
);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pnr VARCHAR(20) UNIQUE NOT NULL,
  bus_id INT NOT NULL,
  booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  total_amount DECIMAL(10,2) NOT NULL,
  status ENUM('confirmed', 'cancelled', 'pending') DEFAULT 'confirmed',
  FOREIGN KEY (bus_id) REFERENCES buses(id)
);

-- Passengers table
CREATE TABLE IF NOT EXISTS passengers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  age INT NOT NULL,
  gender ENUM('Male', 'Female', 'Other') NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255) NOT NULL,
  seat_no VARCHAR(10) NOT NULL,
  FOREIGN KEY (booking_id) REFERENCES bookings(id)
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('user', 'admin') DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample data
INSERT INTO routes (from_city, to_city, distance_km, estimated_duration) VALUES
('Mumbai', 'Pune', 150, '03:00:00'),
('Bangalore', 'Hyderabad', 570, '10:00:00'),
('Delhi', 'Jaipur', 280, '05:00:00'),
('Chennai', 'Coimbatore', 510, '08:00:00');

INSERT INTO operators (company_name, owner_name, email, phone, password, address, bank_account, ifsc_code, fleet_size, status) VALUES
('SRS Travels', 'Rajesh Sharma', 'rajesh@srs.com', '9876543210', '$2b$10$dummyhashedpassword', 'Mumbai, India', '1234567890', 'SBIN0001234', 50, 'approved'),
('VRL Travels', 'Vijay Kumar', 'vijay@vrl.com', '9876543211', '$2b$10$dummyhashedpassword', 'Bangalore, India', '1234567891', 'HDFC0001234', 40, 'approved');

INSERT INTO routes (from_city, to_city, distance_km, estimated_duration) VALUES
('Kolhapur', 'Pune', 230, '05:00:00');

INSERT INTO buses (operator_id, route_id, bus_type, capacity, route_from, route_to, departure_time, arrival_time, price, amenities) VALUES
(1, 1, 'Volvo AC Sleeper', 40, 'Mumbai', 'Pune', '2024-12-01 18:30:00', '2024-12-01 21:45:00', 1200.00, 'WiFi, Water Bottle, Entertainment'),
(2, 1, 'Non-AC Seater', 50, 'Mumbai', 'Pune', '2024-12-01 19:00:00', '2024-12-01 22:30:00', 899.00, 'Water Bottle'),
(1, (SELECT id FROM routes WHERE from_city='Kolhapur' AND to_city='Pune'), 'AC Sleeper', 40, 'Kolhapur', 'Pune', '2025-10-18 10:00:00', '2025-10-18 15:00:00', 1100.00, 'WiFi, Water Bottle');

-- Insert sample bookings and passengers for testing occupied seats
INSERT INTO bookings (pnr, bus_id, total_amount, status) VALUES
('PR123456', 1, 2400.00, 'confirmed'),
('PR123457', 1, 1200.00, 'confirmed');

INSERT INTO passengers (booking_id, name, age, gender, phone, email, seat_no) VALUES
(1, 'John Doe', 30, 'Male', '9876543210', 'john@example.com', '1'),
(1, 'Jane Doe', 28, 'Female', '9876543211', 'jane@example.com', '2'),
(2, 'Bob Smith', 35, 'Male', '9876543212', 'bob@example.com', '5');
