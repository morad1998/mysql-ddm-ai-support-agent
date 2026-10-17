-- =============================================================================
-- 01_pii_masking_policies.sql
-- Final PII masking policies and their column attachments (D1 Steps 6-9).
-- =============================================================================
--
-- Rules this design follows (see docs/decisions/d1-findings.md):
--   * A masking policy has exactly one WHEN clause.
--   * CURRENT_ROLE_IN() takes exactly one role and may only appear in that WHEN.
-- So each exemption is a single "badge" role:
--   r_pii_exempt   -> Supervisor and Auditor see clear contact, ID and payment data
--   r_name_visible -> Tier-1, Supervisor and Auditor see the full name
-- Everyone else, including accounts with no role (such as root), sees the mask.
-- The badge roles are created in 03_roles_accounts/01_roles_and_grants.sql.

USE support;

-- -----------------------------------------------------------------------------
-- Policies
-- -----------------------------------------------------------------------------

-- "Yousef Al-Harbi" -> "Yousef A."
CREATE MASKING POLICY mp_full_name(c) CASE
  WHEN CURRENT_ROLE_IN('r_name_visible') THEN c
  ELSE CONCAT(SUBSTRING_INDEX(c, ' ', 1), ' ', LEFT(SUBSTRING_INDEX(c, ' ', -1), 1), '.')
END;

-- "yousef.harbi@example.com" -> "y***@example.com"
CREATE MASKING POLICY mp_email(c) CASE
  WHEN CURRENT_ROLE_IN('r_pii_exempt') THEN c
  ELSE CONCAT(LEFT(c,1), '***@', SUBSTRING_INDEX(c,'@',-1))
END;

-- "0501112222" -> "******2222"
CREATE MASKING POLICY mp_mobile(c) CASE
  WHEN CURRENT_ROLE_IN('r_pii_exempt') THEN c
  ELSE CONCAT('******', RIGHT(c,4))
END;

-- "1012345678" -> "******5678"
CREATE MASKING POLICY mp_national_id(c) CASE
  WHEN CURRENT_ROLE_IN('r_pii_exempt') THEN c
  ELSE CONCAT('******', RIGHT(c,4))
END;

-- "4000000000000101" -> "XXXXXXXXXXXX0101" (built-in mask_pan)
CREATE MASKING POLICY mp_pan(c) CASE
  WHEN CURRENT_ROLE_IN('r_pii_exempt') THEN c
  ELSE mask_pan(c)
END;

-- "SA0000000000000000000101" -> "********************0101"
CREATE MASKING POLICY mp_iban(c) CASE
  WHEN CURRENT_ROLE_IN('r_pii_exempt') THEN c
  ELSE CONCAT(REPEAT('*', CHAR_LENGTH(c)-4), RIGHT(c,4))
END;

-- street and postal_code are hidden; district and city stay visible to everyone
CREATE MASKING POLICY mp_street(c) CASE
  WHEN CURRENT_ROLE_IN('r_pii_exempt') THEN c
  ELSE '[hidden]'
END;

CREATE MASKING POLICY mp_postal(c) CASE
  WHEN CURRENT_ROLE_IN('r_pii_exempt') THEN c
  ELSE '[hidden]'
END;

-- -----------------------------------------------------------------------------
-- Attachments
-- -----------------------------------------------------------------------------

ALTER TABLE customer MODIFY COLUMN full_name   VARCHAR(100) NOT NULL MASKING POLICY mp_full_name;
ALTER TABLE customer MODIFY COLUMN email       VARCHAR(254) NOT NULL MASKING POLICY mp_email;
ALTER TABLE customer MODIFY COLUMN mobile      VARCHAR(20)  NOT NULL MASKING POLICY mp_mobile;
ALTER TABLE customer MODIFY COLUMN national_id VARCHAR(20)  NOT NULL MASKING POLICY mp_national_id;

ALTER TABLE payment MODIFY COLUMN card_pan VARCHAR(19) NOT NULL MASKING POLICY mp_pan;
ALTER TABLE payment MODIFY COLUMN iban     VARCHAR(34) NOT NULL MASKING POLICY mp_iban;

ALTER TABLE customer_address MODIFY COLUMN street      VARCHAR(150) NOT NULL MASKING POLICY mp_street;
ALTER TABLE customer_address MODIFY COLUMN postal_code VARCHAR(10)  NOT NULL MASKING POLICY mp_postal;
