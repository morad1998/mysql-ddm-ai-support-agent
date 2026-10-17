-- =============================================================================
-- 04_tickets_costs.sql
-- service_ticket and internal_cost tables (D1 Step 4).
-- internal_cost is restricted by grants (see 03_roles_accounts), not by masking.
-- =============================================================================

USE support;

CREATE TABLE service_ticket (
  ticket_id    INT PRIMARY KEY AUTO_INCREMENT,
  customer_id  INT NOT NULL,
  unit_id      INT NOT NULL,
  channel      ENUM('PHONE','CHAT','EMAIL','APP') NOT NULL,
  problem_text VARCHAR(1000) NOT NULL,
  status       ENUM('OPEN','IN_PROGRESS','RESOLVED','CLOSED') NOT NULL,
  CONSTRAINT fk_ticket_customer FOREIGN KEY (customer_id) REFERENCES customer(customer_id),
  CONSTRAINT fk_ticket_unit FOREIGN KEY (unit_id) REFERENCES product_unit(unit_id)
);

CREATE TABLE internal_cost (
  unit_id       INT PRIMARY KEY,
  standard_cost DECIMAL(10,2) NOT NULL,
  margin_pct    DECIMAL(5,2) NOT NULL,
  CONSTRAINT fk_cost_unit FOREIGN KEY (unit_id) REFERENCES product_unit(unit_id)
);
