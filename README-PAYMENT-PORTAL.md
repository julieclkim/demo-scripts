# Payment portal demo notes

This update replaces `payment-script.html` with an advisor-facing payment portal workflow.

## Files to add or replace

Copy these files into the root of your GitHub repo:

- `payment-script.html`
- `assets/payment-portal.js`
- `assets/styles.css`

The page keeps the same lookup pattern:

```text
https://julieclkim.github.io/demo-scripts/payment-script.html?key=941115
```

## What the page does

- Shows the student's balance from URL parameters or `data/students.json`.
- Hides the payment portal until the agent clicks **Collect Payment**.
- Simulates a secure payment handoff.
- Lets the agent choose amount, date, and payment method.
- Walks through review, authorization, and confirmation.
- Generates a confirmation number and SMS message payload.
- Emits browser events named `paymentSecureFlowRequested` and `paymentSubmitted`.

## What still requires Genesys configuration

Static GitHub Pages cannot place a call into a real Genesys secure flow and cannot send SMS through Genesys on its own.

For a live demo with real Genesys behavior, configure Genesys to handle these two actions:

1. **Secure flow handoff**
   - Create or reuse an Architect secure call flow for payment collection.
   - Add the Genesys-side action that transfers or refers the call into that secure flow.
   - Use the page's **Collect Payment** click as the advisor cue, or mirror the click with a Genesys Script button/action.

2. **SMS confirmation**
   - Create a Genesys Cloud Data Action, Function Data Action, or Architect flow step that sends the confirmation SMS.
   - Inputs should include `smsPhoneNumber`, `smsMessage`, `paymentAmount`, `paymentDate`, `confirmationNumber`, and `studentKey`.

Recommended script variables:

```text
key
secureFlowRequested
paymentAmount
paymentDate
paymentMethod
paymentConfirmationNumber
smsPhoneNumber
smsMessage
paymentStatus
```

For the demo-only version, no extra Genesys Data Action is required. For an actual SMS, yes, use a Data Action or an Architect flow that sends the outbound message through the approved Genesys messaging path.
