-- =============================================================================
-- 02_product_warranty.sql
-- product_unit and warranty tables (D1 Step 2).
-- =============================================================================

USE support;

CREATE TABLE product_unit (
  unit_id      INT PRIMARY KEY AUTO_INCREMENT,
  customer_id  INT NOT NULL,
  model_no     VARCHAR(30) NOT NULL,
  serial_no    VARCHAR(40) NOT NULL UNIQUE,
  install_date DATE NOT NULL,
  CONSTRAINT fk_unit_customer FOREIGN KEY (customer_id) REFERENCES customer(customer_id)
);

CREATE TABLE warranty (
  warranty_id INT PRIMARY KEY AUTO_INCREMENT,
  unit_id     INT NOT NULL,
  type        ENUM('STANDARD','EXTENDED') NOT NULL,
  start_date  DATE NOT NULL,
  end_date    DATE NOT NULL,
  status      ENUM('ACTIVE','EXPIRED','VOID') NOT NULL,
  CONSTRAINT fk_warranty_unit FOREIGN KEY (unit_id) REFERENCES product_unit(unit_id)
);
