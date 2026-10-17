-- =============================================================================
-- 01_customer_tables.sql
-- support database, customer and customer_address tables (D1 Step 1).
-- Masking policies are attached later by 02_policies/01_pii_masking_policies.sql.
-- =============================================================================

CREATE DATABASE IF NOT EXISTS support CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE support;

CREATE TABLE customer (
  customer_id   INT PRIMARY KEY AUTO_INCREMENT,
  customer_code VARCHAR(20) NOT NULL UNIQUE,
  full_name     VARCHAR(100) NOT NULL,
  email         VARCHAR(254) NOT NULL,
  mobile        VARCHAR(20) NOT NULL,
  national_id   VARCHAR(20) NOT NULL,
  city          VARCHAR(50) NOT NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE customer_address (
  address_id   INT PRIMARY KEY AUTO_INCREMENT,
  customer_id  INT NOT NULL,
  street       VARCHAR(150) NOT NULL,
  district     VARCHAR(80) NOT NULL,
  city         VARCHAR(50) NOT NULL,
  postal_code  VARCHAR(10) NOT NULL,
  CONSTRAINT fk_addr_customer FOREIGN KEY (customer_id) REFERENCES customer(customer_id)
);
