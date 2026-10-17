-- =============================================================================
-- 01_roles_and_grants.sql
-- Persona roles, table grants, badge roles and account role assignments
-- (D1 Steps 5, 7 and 9).
-- =============================================================================
--
-- Table access (grants) and column masking (policies) are separate layers:
--   * grants decide which tables a persona can read at all;
--   * masking policies decide what a persona sees inside readable columns.

-- -----------------------------------------------------------------------------
-- Roles
-- -----------------------------------------------------------------------------

CREATE ROLE IF NOT EXISTS r_ai_agent, r_tier1, r_supervisor, r_auditor;

-- Badge roles checked by the masking policies (CURRENT_ROLE_IN takes one role)
CREATE ROLE IF NOT EXISTS r_pii_exempt;
CREATE ROLE IF NOT EXISTS r_name_visible;

-- -----------------------------------------------------------------------------
-- Table grants
-- -----------------------------------------------------------------------------

-- AI agent: everything except internal_cost
GRANT SELECT ON support.customer TO r_ai_agent;
GRANT SELECT ON support.customer_address TO r_ai_agent;
GRANT SELECT ON support.product_unit TO r_ai_agent;
GRANT SELECT ON support.warranty TO r_ai_agent;
GRANT SELECT ON support.sales_order TO r_ai_agent;
GRANT SELECT ON support.payment TO r_ai_agent;
GRANT SELECT ON support.service_ticket TO r_ai_agent;

-- Tier-1: same table access as the AI agent
GRANT SELECT ON support.customer TO r_tier1;
GRANT SELECT ON support.customer_address TO r_tier1;
GRANT SELECT ON support.product_unit TO r_tier1;
GRANT SELECT ON support.warranty TO r_tier1;
GRANT SELECT ON support.sales_order TO r_tier1;
GRANT SELECT ON support.payment TO r_tier1;
GRANT SELECT ON support.service_ticket TO r_tier1;

-- Supervisor: everything, including internal_cost
GRANT SELECT ON support.customer TO r_supervisor;
GRANT SELECT ON support.customer_address TO r_supervisor;
GRANT SELECT ON support.product_unit TO r_supervisor;
GRANT SELECT ON support.warranty TO r_supervisor;
GRANT SELECT ON support.sales_order TO r_supervisor;
GRANT SELECT ON support.payment TO r_supervisor;
GRANT SELECT ON support.service_ticket TO r_supervisor;
GRANT SELECT ON support.internal_cost TO r_supervisor;

-- Auditor: everything, including internal_cost
GRANT SELECT ON support.customer TO r_auditor;
GRANT SELECT ON support.customer_address TO r_auditor;
GRANT SELECT ON support.product_unit TO r_auditor;
GRANT SELECT ON support.warranty TO r_auditor;
GRANT SELECT ON support.sales_order TO r_auditor;
GRANT SELECT ON support.payment TO r_auditor;
GRANT SELECT ON support.service_ticket TO r_auditor;
GRANT SELECT ON support.internal_cost TO r_auditor;

-- -----------------------------------------------------------------------------
-- Accounts (passwords are never stored in this repository)
-- -----------------------------------------------------------------------------

-- CREATE USER 'svc_ai_agent'@'localhost' IDENTIFIED BY '<set via secrets file, never hard-coded>';
-- CREATE USER 'svc_tier1'@'localhost' IDENTIFIED BY '<set via secrets file, never hard-coded>';
-- CREATE USER 'svc_supervisor'@'localhost' IDENTIFIED BY '<set via secrets file, never hard-coded>';
-- CREATE USER 'svc_auditor'@'localhost' IDENTIFIED BY '<set via secrets file, never hard-coded>';

-- -----------------------------------------------------------------------------
-- Role assignments
-- -----------------------------------------------------------------------------

GRANT r_ai_agent   TO 'svc_ai_agent'@'localhost';
GRANT r_tier1      TO 'svc_tier1'@'localhost';
GRANT r_supervisor TO 'svc_supervisor'@'localhost';
GRANT r_auditor    TO 'svc_auditor'@'localhost';

GRANT r_pii_exempt   TO 'svc_supervisor'@'localhost', 'svc_auditor'@'localhost';
GRANT r_name_visible TO 'svc_tier1'@'localhost', 'svc_supervisor'@'localhost', 'svc_auditor'@'localhost';

-- Default roles must include the badge roles, or the policies will not see them
-- as current roles. Final state after D1 Steps 5, 7 and 9:
SET DEFAULT ROLE r_ai_agent                                TO 'svc_ai_agent'@'localhost';
SET DEFAULT ROLE r_tier1, r_name_visible                   TO 'svc_tier1'@'localhost';
SET DEFAULT ROLE r_supervisor, r_pii_exempt, r_name_visible TO 'svc_supervisor'@'localhost';
SET DEFAULT ROLE r_auditor, r_pii_exempt, r_name_visible    TO 'svc_auditor'@'localhost';
