# D2 verification matrix

Proves that each persona sees the right masked or clear values in all 8 masked columns, and is allowed or denied `internal_cost` by grants. Captured 2026-10-17 on MySQL Enterprise Server 26.7.0-commercial.

Rows checked: `customer_id = 1`, `payment_id = 1`, `address_id = 1`, `internal_cost.unit_id = 1`. All data is synthetic.

| Persona | full_name | email | mobile | national_id | card_pan | iban | street | postal_code | internal_cost |
|---|---|---|---|---|---|---|---|---|---|
| svc_ai_agent | `Yousef A.` | `y***@example.com` | `******2222` | `******5678` | `XXXXXXXXXXXX0101` | `********************0101` | `[hidden]` | `[hidden]` | ERROR 1142: SELECT command denied |
| svc_tier1 | `Yousef Al-Harbi` | `y***@example.com` | `******2222` | `******5678` | `XXXXXXXXXXXX0101` | `********************0101` | `[hidden]` | `[hidden]` | ERROR 1142: SELECT command denied |
| svc_supervisor | `Yousef Al-Harbi` | `yousef.harbi@example.com` | `0501112222` | `1012345678` | `4000000000000101` | `SA0000000000000000000101` | `12 Example Street` | `32241` | SUCCESS: 1450.00 / 22.50 |
| svc_auditor | `Yousef Al-Harbi` | `yousef.harbi@example.com` | `0501112222` | `1012345678` | `4000000000000101` | `SA0000000000000000000101` | `12 Example Street` | `32241` | SUCCESS: 1450.00 / 22.50 |

`district` (`Test District A`) and `city` (`Dammam`) are unmasked and identical for all four personas.

Exact denial text: `ERROR 1142 (42000): SELECT command denied to user '<persona>'@'localhost' for table 'internal_cost'`.

How each result comes about:

- **full_name** shows the full name only to holders of `r_name_visible` (Tier-1, Supervisor, Auditor).
- **The other 7 columns** show clear values only to holders of `r_pii_exempt` (Supervisor, Auditor).
- **internal_cost** is controlled by table grants, not masking.
