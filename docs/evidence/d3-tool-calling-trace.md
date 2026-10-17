# D3 tool-calling trace (CUST-0002)

Proves that the model can investigate CUST-0002 by choosing and calling the support API tools itself, and only ever receives masked data. Model: `cohere.command-a-03-2025` (OCI Generative AI, ON_DEMAND, `me-riyadh-1`). Date: 2026-10-17.

## Setup

- **Agent:** `api/src/agent.ts` (`npm run agent`).
- **Model access:** OCI CLI with the personal profile, COHERE chat format, `isForceSingleStep: false`, `maxTokens` 600, `temperature` 0.2.
- **Tool format:** taken from `oci generative-ai-inference chat-result chat --generate-param-json-input chat-request`:
  - tool definitions: `tools[].parameterDefinitions`;
  - results: `toolResults[]` (`call` + `outputs`);
  - earlier turns: `chatHistory` roles `USER`, `CHATBOT` (with `toolCalls`) and `TOOL`.
- **Tools:** each one calls the support API, which reads MySQL as `svc_ai_agent`.

  | Tool | API call |
  |---|---|
  | `find_customer(code)` | `GET /customers/:code` |
  | `get_warranty(code)` | `GET /customers/:code/warranty` |
  | `get_orders(code)` | `GET /customers/:code/orders` |
  | `get_tickets(code)` | `GET /customers/:code/tickets` |

- **Safety limit:** 6 tool calls.
- **Preamble:** the same as in `d3-first-ai-diagnosis.md`.
- **Initial message:** "A customer with code CUST-0002 contacted support about a cooling problem and a billing concern. Investigate and draft a reply."

## Tool sequence

The model made 4 tool calls, all in its first turn, and then gave its final answer on the second model call. The 6-call cap was not hit.

| # | Round | Tool | Arguments | What it returned |
|---|---|---|---|---|
| 1 | 1 | `find_customer` | `{"code": "CUST-0002"}` | Customer 2: `Sara A.`, `s***@example.com`, `******3333`, `******6789` |
| 2 | 1 | `get_warranty` | `{"code": "CUST-0002"}` | 1 unit: ZAC-SPLIT-24K, SN-2024-000102, EXTENDED, ACTIVE, 2024-05-02 to 2028-05-02 |
| 3 | 1 | `get_orders` | `{"code": "CUST-0002"}` | 1 order (2, 1200.00, PAID) with 2 payments of 1200.00 at 15:42:10 and 15:43:55; card `XXXXXXXXXXXX0102`, IBAN `********************0102` |
| 4 | 1 | `get_tickets` | `{"code": "CUST-0002"}` | 1 ticket (2, CHAT, OPEN): unit stopped cooling, under warranty, charged twice for the extended warranty |

## Final answer (verbatim)

```text
Dear Sara A.,

Thank you for contacting us. We are sorry to hear about your experience with our product and service.

We have received your support ticket regarding the cooling problem with your ZAC-SPLIT-24K AC unit. We will send a technician to fix the unit as soon as possible.

Regarding your billing concern, we have found that you were charged twice for the extended warranty. We will refund the duplicate charge of $1200.00 to your account within 7 working days.

If you have any further questions or concerns, please do not hesitate to contact us.

Sincerely,
[Your Name]
```

## Comparison with the pre-fetched version

The pre-fetched version is `d3-first-ai-diagnosis.md`.

| Check | Pre-fetched | Tool-calling |
|---|---|---|
| Tools used | none (data given) | all 4, chosen by the model, in one turn |
| Duplicate charge found | yes | **yes** ("charged twice", one 1200.00 refund) |
| Warranty status stated | yes, ACTIVE EXTENDED until 2028-05-02 | **not explicitly.** It fetched the warranty and names the unit, but the reply does not say the warranty is active. |
| Invented currency | `$1,200.00` | `$1200.00` (again) |
| Over-promising | refund "immediately", technician | refund "within 7 working days" (an invented timeline), technician |
| Customer's claim stated as fact | yes | yes ("charged twice for the extended warranty") |

The conclusion on billing is the same. The warranty finding is weaker: the model asked for it but did not state it. The same review notes apply as before, and the reply needs light editing before use.

## Masking confirmation

Each item below was checked against CUST-0002's real values from the seed data: card number, IBAN, email, mobile, national ID, surname, street and postal code.

| Item | Real values found |
|---|---|
| Tool-call arguments (4) | none. The only argument was the customer code. |
| Tool results (4) | none. Every `card_pan` and `iban` is masked. |
| Final answer | none |
