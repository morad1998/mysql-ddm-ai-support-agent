-- =============================================================================
-- 02_install_component_object_policy.sql
-- Installs component_object_policy (column masking policies).
-- =============================================================================
--
-- This is Oracle's shipped script: <basedir>\share\install_component_object_policy.sql
-- It creates mysql.column_masking_policies and then runs
--   INSTALL COMPONENT 'file://component_object_policy';
--
-- Run it as root, for example:
--
--   mysql --host=127.0.0.1 --port=3308 -uroot -p
--     < "<basedir>\share\install_component_object_policy.sql"
--
-- Install 01_masking_functions_install.sql first. No server restart is needed.

-- Verification (expected: one row, column_masking_policies)
SHOW TABLES FROM mysql LIKE 'column_masking_policies';

-- Expected components after both install steps:
--   file://component_masking
--   file://component_masking_functions
--   file://component_object_policy
SELECT component_id, component_urn FROM mysql.component;
