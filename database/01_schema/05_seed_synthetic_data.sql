-- =============================================================================
-- 05_seed_synthetic_data.sql
-- All data below is entirely synthetic and fictional. No real customers, cards, IDs or IBANs are represented.
-- =============================================================================
--
-- Card numbers use the 4000 test-style prefix and are invented.
-- IBANs use check digits 00, so none is a valid IBAN.
-- Order 2 (CUST-0002) has two identical 1200.00 payments: the
-- "charged twice for the extended warranty" scenario.

USE support;

START TRANSACTION;

-- Customers and addresses (D1 Step 1)
INSERT INTO customer (customer_code, full_name, email, mobile, national_id, city) VALUES
  ('CUST-0001', 'Yousef Al-Harbi',  'yousef.harbi@example.com', '0501112222', '1012345678', 'Dammam'),
  ('CUST-0002', 'Sara Al-Qahtani',  'sara.q@example.com',       '0502223333', '1023456789', 'Dammam'),
  ('CUST-0003', 'Fahad Al-Mutairi', 'fahad.m@example.com',      '0503334444', '1034567890', 'Khobar'),
  ('CUST-0004', 'Noura Al-Zahrani', 'noura.z@example.com',      '0504445555', '1045678901', 'Dhahran'),
  ('CUST-0005', 'Omar Al-Shehri',   'omar.sh@example.com',      '0505556666', '1056789012', 'Dammam');

INSERT INTO customer_address (customer_id, street, district, city, postal_code)
SELECT c.customer_id, a.street, a.district, c.city, a.postal_code
FROM customer c JOIN (
  SELECT 'CUST-0001' AS code, '12 Example Street' AS street, 'Test District A' AS district, '32241' AS postal_code
  UNION ALL SELECT 'CUST-0002', '34 Sample Road',     'Test District B', '32242'
  UNION ALL SELECT 'CUST-0003', '56 Demo Avenue',     'Test District C', '34421'
  UNION ALL SELECT 'CUST-0004', '78 Placeholder Lane','Test District D', '34455'
  UNION ALL SELECT 'CUST-0005', '90 Fictional Way',   'Test District E', '32243'
) a ON a.code = c.customer_code;

-- Product units and warranties (D1 Step 2)
-- STANDARD = install_date + 2 years, EXTENDED = install_date + 4 years.
INSERT INTO product_unit (customer_id, model_no, serial_no, install_date) VALUES
  (1, 'ZAC-SPLIT-18K', 'SN-2024-000101', '2024-03-15'),
  (2, 'ZAC-SPLIT-24K', 'SN-2024-000102', '2024-05-02'),
  (3, 'ZAC-DUCT-36K',  'SN-2023-000103', '2023-11-20'),
  (4, 'ZAC-SPLIT-12K', 'SN-2025-000104', '2025-01-10'),
  (5, 'ZAC-SPLIT-18K', 'SN-2024-000105', '2024-08-30');

INSERT INTO warranty (unit_id, type, start_date, end_date, status)
SELECT p.unit_id, w.type, p.install_date,
       DATE_ADD(p.install_date, INTERVAL IF(w.type = 'STANDARD', 2, 4) YEAR),
       w.status
FROM product_unit p JOIN (
            SELECT 'SN-2024-000101' AS serial_no, 'STANDARD' AS type, 'EXPIRED' AS status
  UNION ALL SELECT 'SN-2024-000102', 'EXTENDED', 'ACTIVE'
  UNION ALL SELECT 'SN-2023-000103', 'STANDARD', 'EXPIRED'
  UNION ALL SELECT 'SN-2025-000104', 'STANDARD', 'ACTIVE'
  UNION ALL SELECT 'SN-2024-000105', 'EXTENDED', 'VOID'
) w ON w.serial_no = p.serial_no
ORDER BY p.unit_id;

-- Orders and payments (D1 Step 3)
INSERT INTO sales_order (customer_id, order_date, total_amount, status) VALUES
  (1, '2025-11-05',  350.00, 'PAID'),
  (2, '2026-02-12', 1200.00, 'PAID'),
  (3, '2026-04-20', 2500.00, 'PAID'),
  (4, '2026-06-08',  750.00, 'REFUNDED'),
  (5, '2026-09-01',  480.00, 'CANCELLED');

INSERT INTO payment (order_id, card_pan, card_holder, iban, amount, paid_at, auth_code)
SELECT o.order_id, v.card_pan, v.card_holder, v.iban, o.total_amount, v.paid_at, v.auth_code
FROM sales_order o JOIN (
            SELECT 1 AS customer_id, '4000000000000101' AS card_pan, 'YOUSEF AL-HARBI'  AS card_holder, 'SA0000000000000000000101' AS iban, '2025-11-05 10:14:00' AS paid_at, 'A1B2C3' AS auth_code
  UNION ALL SELECT 2, '4000000000000102', 'SARA AL-QAHTANI',  'SA0000000000000000000102', '2026-02-12 15:42:10', 'D4E5F6'
  UNION ALL SELECT 2, '4000000000000102', 'SARA AL-QAHTANI',  'SA0000000000000000000102', '2026-02-12 15:43:55', 'G7H8J9'
  UNION ALL SELECT 3, '4000000000000103', 'FAHAD AL-MUTAIRI', 'SA0000000000000000000103', '2026-04-20 09:05:30', 'K1L2M3'
  UNION ALL SELECT 4, '4000000000000104', 'NOURA AL-ZAHRANI', 'SA0000000000000000000104', '2026-06-08 18:20:45', 'N4P5Q6'
  UNION ALL SELECT 5, '4000000000000105', 'OMAR AL-SHEHRI',   'SA0000000000000000000105', '2026-09-01 12:00:00', 'R7S8T9'
) v ON v.customer_id = o.customer_id
ORDER BY v.paid_at;

-- Service tickets and internal costs (D1 Step 4)
INSERT INTO service_ticket (customer_id, unit_id, channel, problem_text, status)
SELECT p.customer_id, p.unit_id, t.channel, t.problem_text, t.status
FROM product_unit p JOIN (
            SELECT 'SN-2024-000101' AS serial_no, 'PHONE' AS channel, 'Indoor unit makes a loud rattling noise when the compressor starts, especially at night.' AS problem_text, 'RESOLVED' AS status
  UNION ALL SELECT 'SN-2024-000102', 'CHAT', 'My AC unit stopped cooling. It is still under warranty, and I was charged twice for the extended warranty. Please fix the unit and refund the duplicate charge.', 'OPEN'
  UNION ALL SELECT 'SN-2023-000103', 'EMAIL', 'Water is leaking from the ducted unit onto the ceiling below; the drain line may be blocked.', 'IN_PROGRESS'
  UNION ALL SELECT 'SN-2025-000104', 'APP', 'The new remote control will not pair with the unit; the display shows no signal.', 'CLOSED'
  UNION ALL SELECT 'SN-2024-000105', 'PHONE', 'Thermostat shows error code E4 and the unit shuts off after a few minutes of running.', 'OPEN'
) t ON t.serial_no = p.serial_no
ORDER BY p.unit_id;

INSERT INTO internal_cost (unit_id, standard_cost, margin_pct)
SELECT p.unit_id, c.standard_cost, c.margin_pct
FROM product_unit p JOIN (
            SELECT 'SN-2024-000101' AS serial_no, 1450.00 AS standard_cost, 22.50 AS margin_pct
  UNION ALL SELECT 'SN-2024-000102', 1850.00, 27.00
  UNION ALL SELECT 'SN-2023-000103', 2950.00, 18.75
  UNION ALL SELECT 'SN-2025-000104',  920.00, 35.00
  UNION ALL SELECT 'SN-2024-000105', 1450.00, 31.25
) c ON c.serial_no = p.serial_no;

COMMIT;
