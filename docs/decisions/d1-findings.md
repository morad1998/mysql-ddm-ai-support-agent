# D1 findings

Source note: the Checkpoint v4 document was not available on this machine when this file was
written. These findings are taken from the recorded D0/D1 session results on MySQL Enterprise
Server 26.7.0-commercial. Reconcile the numbering with Checkpoint v4 if it differs.

D1-F1 — One WHEN clause per policy. CREATE MASKING POLICY with more than one WHEN clause is
rejected with ERROR 6566 ("MASKING POLICY must have exactly one WHEN clause"). A policy can only
choose between one exempt case and one masked case.

D1-F2 — CURRENT_ROLE_IN() only in the top-level WHEN. Moving the second role check into a nested
CASE inside ELSE is rejected with ERROR 6570 ("MASKING POLICY references a disallowed construct:
current_role_in"). Multi-tier logic cannot be built inside one policy.

D1-F3 — CURRENT_ROLE_IN() takes exactly one role. CURRENT_ROLE_IN('r_supervisor','r_auditor') is
rejected with ERROR 1582 ("Incorrect parameter count"). Exempting several personas therefore needs
a shared role.

D1-F4 — Badge roles solve multi-persona exemption. A dedicated role per exemption (r_pii_exempt for
contact, ID and payment data; r_name_visible for full names) is granted to the personas that should
see clear values and checked by every policy. The badge role must be part of the account's default
roles so it is active in the session; CURRENT_ROLE() then lists it alongside the persona role.

D1-F5 — No implicit admin bypass. root, which has no roles active, sees masked values like any other
non-exempt account. Exemption comes only from the badge role, not from privilege level.

D1-F6 — Masking is applied before expressions and views. A view computing SHA2(email, 256) returned,
for root, the hash of the masked placeholder "y***@example.com", not of the real email. Wrapping a
masked column in a function does not reveal the original. Still untested: what an exempt persona
sees through a view, and whether a DEFINER view follows the definer's or the caller's roles.

D1-F7 — Grants and masking are separate layers. internal_cost is protected by not granting SELECT:
the AI agent and Tier-1 get ERROR 1142 (SELECT command denied), while Supervisor and Auditor read
all rows. Masking policies only change what readable columns show.

D1-F8 — Auditor hashing needs a separate design. Because of F1–F3, an auditor tier that sees hashed
values (instead of clear or partially masked values) cannot be expressed in the same policy. For now
the Auditor shares r_pii_exempt with the Supervisor and sees clear values. A view-based or other
approach is an open item.
