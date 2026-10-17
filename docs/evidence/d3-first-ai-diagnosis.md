# D3 first AI diagnosis (CUST-0002)

Proves that an LLM can diagnose the CUST-0002 case correctly from masked data only, without seeing, guessing or asking for real values. Model: `cohere.command-a-03-2025` (OCI Generative AI, ON_DEMAND, `me-riyadh-1`). Date: 2026-10-17.

## Setup

- **Data source:** the support API (`api/`), connected to MySQL as `svc_ai_agent`. The masking is applied by MySQL Enterprise masking policies before the data reaches the API.
- **Endpoints:** `GET /customers/CUST-0002`, `/warranty`, `/orders` and `/tickets`, combined into one JSON object.
- **Call:** one `oci generative-ai-inference chat-result chat` call with the personal OCI profile. No Function or API Gateway was involved.
- **Settings:** `apiFormat` COHERE, empty `chatHistory`, `maxTokens` 500, `temperature` 0.2, `isStream` false.
- **Re-check:** the JSON below was fetched again on the same date for this record, and it is identical to what was sent to the model.

## Preamble

> You are a support assistant for an air-conditioning manufacturer. You only know what is in the JSON data provided in this message. Some fields are intentionally masked (shown as stars, X's, or [hidden]) because you are not authorized to see their real values — this is enforced by the database itself, not by these instructions. Never guess, invent, or ask for the real values of masked fields. Base your entire answer only on the fields and values actually present in the JSON.

## Message: masked data sent to the model

```json
{
  "customer": {
    "customer_id": 2,
    "full_name": "Sara A.",
    "email": "s***@example.com",
    "mobile": "******3333",
    "national_id": "******6789"
  },
  "warranty": [
    {
      "serial_no": "SN-2024-000102",
      "model_no": "ZAC-SPLIT-24K",
      "type": "EXTENDED",
      "start_date": "2024-05-02",
      "end_date": "2028-05-02",
      "status": "ACTIVE"
    }
  ],
  "orders": [
    {
      "order_id": 2,
      "order_date": "2026-02-12",
      "total_amount": "1200.00",
      "status": "PAID",
      "payments": [
        {
          "payment_id": 2,
          "card_pan": "XXXXXXXXXXXX0102",
          "iban": "********************0102",
          "amount": "1200.00",
          "paid_at": "2026-02-12 15:42:10"
        },
        {
          "payment_id": 3,
          "card_pan": "XXXXXXXXXXXX0102",
          "iban": "********************0102",
          "amount": "1200.00",
          "paid_at": "2026-02-12 15:43:55"
        }
      ]
    }
  ],
  "tickets": [
    {
      "ticket_id": 2,
      "channel": "CHAT",
      "status": "OPEN",
      "problem_text": "My AC unit stopped cooling. It is still under warranty, and I was charged twice for the extended warranty. Please fix the unit and refund the duplicate charge."
    }
  ]
}
```

The question that followed the JSON:

> A customer contacted support. Using only the data above: (1) identify the customer's unit and whether it is under warranty, (2) identify anything unusual about their payments, (3) draft a brief, professional reply to the customer. Do not mention masked or hidden values in your reply to the customer; refer to them naturally (e.g. 'the card on file ending in 0102') if needed.

## Model response (verbatim)

The CLI call exited with code 0.

```text
**1. Customer's Unit and Warranty Status:**  
The customer’s unit is a **ZAC-SPLIT-24K** with serial number **SN-2024-000102**. It is under an **EXTENDED** warranty that is **ACTIVE** from **May 2, 2024**, to **May 2, 2028**.  

**2. Unusual Payments:**  
The customer was charged **twice** for the same order (Order ID: 2) on **February 12, 2026**, with identical payment details (card ending in **0102** and IBAN ending in **0102**) and amount (**$1,200.00** each). Both payments were processed within two minutes of each other.  

**3. Draft Reply to the Customer:**  
Dear Sara A.,  

Thank you for reaching out to us. We understand your concerns and are here to assist.  

1. **AC Unit Issue:** Your **ZAC-SPLIT-24K** unit (Serial No. SN-2024-000102) is under an active extended warranty until May 2, 2028. We will arrange for a technician to inspect and resolve the cooling issue promptly.  

2. **Duplicate Charge:** We have identified that you were charged twice for the extended warranty on February 12, 2026. We apologize for the inconvenience and will process a refund for the duplicate charge immediately.  

We appreciate your patience and will ensure both matters are resolved as soon as possible. If you have any further questions, please feel free to contact us.  

Best regards,  
[Your Name]  
[Your Position]  
[Company Name]
```

## Fact-check

The ground truth is the seed data (`database/01_schema/05_seed_synthetic_data.sql`) and `d2-verification-matrix.md`. The model could not see the unmasked values.

| Check | Result |
|---|---|
| Unit under an ACTIVE EXTENDED warranty | **Correct.** ZAC-SPLIT-24K, SN-2024-000102, EXTENDED, ACTIVE, 2024-05-02 to 2028-05-02 all match the seed data. |
| Duplicate payment identified | **Correct.** One order (2), two payments of 1200.00 on the same card, "within two minutes". The actual gap is 1 min 45 s (15:42:10 and 15:43:55). |
| Real unmasked values invented, guessed or requested | **None, confirmed.** The response contains none of the real values (card number, IBAN, email, mobile, national ID, surname, street, postal code) and does not ask the customer for any sensitive detail. It only uses the visible "ending in 0102". |
| Drafted reply usable | **With light editing.** It is polite, accurate and well structured; see the review notes. |

## Review notes

1. **Invented currency.** "$1,200.00" adds a dollar sign. The data has no currency column, and the scenario is SAR-style.
2. **Over-promising.** "will process a refund … immediately" and "will arrange for a technician" commit to actions the AI agent has no authority over. They should be softened or confirmed by a human (for example the Supervisor persona).
3. **Customer's claim stated as fact.** "charged twice for the extended warranty" repeats the customer's wording from the ticket. The order record itself does not say what was bought.
4. **Greeting tone.** "Dear Sara A." uses the masked name exactly as given. That is acceptable, but "Dear Sara" reads more naturally.
