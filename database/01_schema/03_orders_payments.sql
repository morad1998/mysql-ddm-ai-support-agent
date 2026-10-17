-- =============================================================================
-- 03_orders_payments.sql
-- sales_order and payment tables (D1 Step 3).
-- =============================================================================

USE support;

CREATE TABLE sales_order (
  order_id     INT PRIMARY KEY AUTO_INCREMENT,
  customer_id  INT NOT NULL,
  order_date   DATE NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status       ENUM('PAID','REFUNDED','CANCELLED') NOT NULL,
  CONSTRAINT fk_order_customer FOREIGN KEY (customer_id) REFERENCES customer(customer_id)
);

CREATE TABLE payment (
  payment_id  INT PRIMARY KEY AUTO_INCREMENT,
  order_id    INT NOT NULL,
  card_pan    VARCHAR(19) NOT NULL,
  card_holder VARCHAR(100) NOT NULL,
  iban        VARCHAR(34) NOT NULL,
  amount      DECIMAL(10,2) NOT NULL,
  paid_at     DATETIME NOT NULL,
  auth_code   VARCHAR(10) NOT NULL,
  CONSTRAINT fk_payment_order FOREIGN KEY (order_id) REFERENCES sales_order(order_id)
);
