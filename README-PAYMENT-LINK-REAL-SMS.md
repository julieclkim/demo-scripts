# WGU Payment Link Flow: Real SMS Data Action Patch

This patch updates the Payment Script so the agent-facing popup prepares a real Genesys Cloud agentless SMS request using the existing Data Action contract.

## Upload these files

Replace or add these files in the repository root:

- `payment-script.html`
- `pay.html`
- `assets/payment-link.js`
- `assets/student-payment-portal.js`
- `assets/styles.css`
- `README-PAYMENT-LINK-REAL-SMS.md`

## What the page does

When the agent clicks **Collect Payment**, the popup displays a compact balance review and payment amount field.

When the agent clicks **Send Payment Link**, the page builds:

- The dummy student payment portal URL
- The SMS body
- The secure flow ID: `b5907385-d3ac-4e53-a9e8-9b99d2de6c60`
- A Genesys Data Action input payload for the Agentless SMS Notification action

The Data Action payload is shown in the **Genesys Data Action payload** details panel.

## Data Action payload

The uploaded Data Action posts to:

```text
/api/v2/conversations/messages/agentless
```

The page creates this payload shape:

```json
{
  "fromAddress": "+18015551212",
  "toAddress": "+16054311804",
  "toAddressMessengerType": "sms",
  "textBody": "Hi, Diana. Securely complete your payment here: https://julieclkim.github.io/demo-scripts/pay.html?k=941115&a=250.00&c=WGU-1115-DEMO1. I'll be waiting on the other side until you complete your payment. Let me know if you run into any issues.",
  "rawRequest": "{...same request as JSON string...}"
}
```

Your exported Data Action uses `${input.rawRequest}` as the request body, so the page includes `rawRequest` in addition to the named fields.

## Important Genesys wiring note

A public GitHub Pages iframe cannot call a Genesys Data Action by itself. It can only prepare the payload. To send the real SMS, wire a Genesys-side step to call the Data Action using the values shown in the payload.

The simplest working demo pattern is:

1. Keep this GitHub page embedded in the Genesys script.
2. Use the page to build the SMS text and payment link.
3. Add a Genesys script action, Architect action, or middleware bridge that calls the Data Action with:
   - `fromAddress`
   - `toAddress`
   - `toAddressMessengerType`
   - `textBody`
   - `rawRequest`
4. Move the call into secure flow `b5907385-d3ac-4e53-a9e8-9b99d2de6c60`.

## Where numbers come from

- `toAddress` comes from `phone_number` in `data/students.json`.
- `fromAddress` comes from `sms_from_address` in `data/students.json` when present.
- If `sms_from_address` is not present, the page defaults to `+18015551212`.

To change the sending number per student or scenario, add this to the student record:

```json
"sms_from_address": "+18015551212"
```

## Test URLs

Agent payment page:

```text
https://julieclkim.github.io/demo-scripts/payment-script.html?key=941115
```

Dummy student payment portal:

```text
https://julieclkim.github.io/demo-scripts/pay.html?k=941115&a=250.00&c=WGU-1115-DEMO1
```
