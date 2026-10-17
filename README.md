# MySQL DDM AI Support Agent

This project is a bounty submission in progress. It shows how MySQL Enterprise dynamic data
masking (column masking policies) can protect customer PII when an AI support agent and human
support staff query the same database. The scenario is an air-conditioning support desk. One
synthetic customer reports a unit that has stopped cooling while under warranty, and says they were
charged twice for an extended warranty.

What is built so far:

- **D0, runtime spike:** a separate MySQL Enterprise Server 26.7.0-commercial instance, listening
  on 127.0.0.1:3308 only. The masking components are installed (`component_masking`,
  `component_masking_functions`, `component_object_policy`), and a first masking policy was proven.
- **D1, schema, personas and policies:**
  - the `support` database with 8 tables, loaded with entirely synthetic data;
  - four personas (AI agent, Tier-1, Supervisor, Auditor) with table-level grants;
  - 8 verified masking policies on full name, email, mobile, national ID, card PAN, IBAN, street
    and postal code.

  The design findings behind the policies are in `docs/decisions/d1-findings.md`.

Run order: `database/00_install`, `01_schema`, `03_roles_accounts`, then `02_policies`. Account
passwords are generated locally and kept outside this repository.

**Status:** work in progress. Not yet submitted.
