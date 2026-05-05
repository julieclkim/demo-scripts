# Higher Education Genesys Cloud Screen Pop Demo

Static GitHub Pages demo for a higher education agent-facing script embedded in Genesys Cloud.

## Files

- `agent-script.html`: Student dashboard
- `financial-aid-script.html`: Financial aid script
- `payment-script.html`: Payment script
- `assets/styles.css`: Shared responsive card layout and WGU-inspired branding colors
- `assets/app.js`: URL parameter parsing, defaults, badges, map, payment portal link, and query preservation across pages
- `.nojekyll`: Keeps GitHub Pages from applying Jekyll processing

## URL parameter keys

The pages read these query parameters. Missing, empty, `null`, `undefined`, and `NaN` values fall back to safe placeholder text.

### Fields from the uploaded CSV

- `key`
- `full_name`
- `program`
- `student_type`
- `phone_number`
- `email`
- `balance_due`
- `enrollment_status`
- `student_notes`
- `application_status`
- `next_step`
- `missing_requirements`
- `assigned_enrollment_counselor`
- `aid_disbursement_date`
- `financial_aid_status`
- `account_hold_flag`
- `hold_reason`
- `payment_plan_available`
- `next_required_action`
- `last_action_taken`
- `risk_flag`

### Optional demo enhancement fields

- `institution_name`
- `campus_location_name`
- `campus_address`
- `campus_lat`
- `campus_lng`
- `aid_year`
- `estimated_aid_amount`
- `approved_aid_amount`
- `grant_amount`
- `scholarship_amount`
- `loan_amount`
- `remaining_aid_needed`
- `disbursement_status`
- `payment_plan_options`
- `minimum_payment`
- `payment_due_date`
- `payment_reference_id`
- `payment_portal_url`
- `callback_number`

## Example local URLs

```text
agent-script.html?key=12345&full_name=Alex%20Rivera&program=Cybersecurity&student_type=Active&phone_number=15550101010&email=alex.rivera%40example.edu&balance_due=%241500&enrollment_status=Enrolled&financial_aid_status=Approved%20-%20Pending%20Disbursement&aid_disbursement_date=May%2028%202026&account_hold_flag=true&hold_reason=Outstanding%20balance%20preventing%20course%20registration&payment_plan_available=true&risk_flag=Financial%20Risk
```

## GitHub Pages setup

1. Clone your empty repo.

```bash
git clone https://github.com/julieclkim/demo-scripts.git
cd demo-scripts
```

2. Copy these files into the repo root.

3. Commit and push.

```bash
git add .
git commit -m "Add higher education Genesys Cloud demo scripts"
git push origin main
```

4. In GitHub, open the repo, go to **Settings > Pages**, set **Source** to **Deploy from a branch**, choose **main**, choose `/root`, and save.

5. After Pages publishes, the hosted pages should be:

```text
https://julieclkim.github.io/demo-scripts/agent-script.html
https://julieclkim.github.io/demo-scripts/financial-aid-script.html
https://julieclkim.github.io/demo-scripts/payment-script.html
```

## Genesys Cloud Screen Pop setup pattern

1. In Genesys Cloud Scripts, create a script for the higher education demo.
2. Add a Web Page component.
3. Set the Web Page Source to the GitHub Pages URL for the desired page with participant attributes appended as query parameters.
4. Publish the Genesys Cloud script.
5. In Architect, use Set Screen Pop and select the published script. Define the input variables that your flow will pass into the script.

Use HTTPS URLs only. The hosted page must also allow iframe embedding.

## Screen Pop URL formats

Replace the Genesys placeholder syntax with your actual script variables or a single prebuilt URL variable.

### Student Dashboard

```text
https://julieclkim.github.io/demo-scripts/agent-script.html?key={{key}}&full_name={{full_name}}&program={{program}}&student_type={{student_type}}&phone_number={{phone_number}}&email={{email}}&balance_due={{balance_due}}&enrollment_status={{enrollment_status}}&student_notes={{student_notes}}&application_status={{application_status}}&next_step={{next_step}}&missing_requirements={{missing_requirements}}&assigned_enrollment_counselor={{assigned_enrollment_counselor}}&aid_disbursement_date={{aid_disbursement_date}}&financial_aid_status={{financial_aid_status}}&account_hold_flag={{account_hold_flag}}&hold_reason={{hold_reason}}&payment_plan_available={{payment_plan_available}}&next_required_action={{next_required_action}}&last_action_taken={{last_action_taken}}&risk_flag={{risk_flag}}
```

### Financial Aid Script

```text
https://julieclkim.github.io/demo-scripts/financial-aid-script.html?key={{key}}&full_name={{full_name}}&program={{program}}&student_type={{student_type}}&phone_number={{phone_number}}&email={{email}}&balance_due={{balance_due}}&enrollment_status={{enrollment_status}}&student_notes={{student_notes}}&application_status={{application_status}}&next_step={{next_step}}&missing_requirements={{missing_requirements}}&assigned_enrollment_counselor={{assigned_enrollment_counselor}}&aid_disbursement_date={{aid_disbursement_date}}&financial_aid_status={{financial_aid_status}}&account_hold_flag={{account_hold_flag}}&hold_reason={{hold_reason}}&payment_plan_available={{payment_plan_available}}&next_required_action={{next_required_action}}&last_action_taken={{last_action_taken}}&risk_flag={{risk_flag}}&aid_year={{aid_year}}&estimated_aid_amount={{estimated_aid_amount}}&approved_aid_amount={{approved_aid_amount}}&grant_amount={{grant_amount}}&scholarship_amount={{scholarship_amount}}&loan_amount={{loan_amount}}&remaining_aid_needed={{remaining_aid_needed}}&disbursement_status={{disbursement_status}}
```

### Payment Script

```text
https://julieclkim.github.io/demo-scripts/payment-script.html?key={{key}}&full_name={{full_name}}&program={{program}}&student_type={{student_type}}&phone_number={{phone_number}}&email={{email}}&balance_due={{balance_due}}&enrollment_status={{enrollment_status}}&student_notes={{student_notes}}&application_status={{application_status}}&next_step={{next_step}}&missing_requirements={{missing_requirements}}&assigned_enrollment_counselor={{assigned_enrollment_counselor}}&aid_disbursement_date={{aid_disbursement_date}}&financial_aid_status={{financial_aid_status}}&account_hold_flag={{account_hold_flag}}&hold_reason={{hold_reason}}&payment_plan_available={{payment_plan_available}}&next_required_action={{next_required_action}}&last_action_taken={{last_action_taken}}&risk_flag={{risk_flag}}&payment_plan_options={{payment_plan_options}}&minimum_payment={{minimum_payment}}&payment_due_date={{payment_due_date}}&payment_reference_id={{payment_reference_id}}&payment_portal_url={{payment_portal_url}}
```

## Notes

For production or sensitive demonstrations, URL-encode parameter values before appending them to the URL. Avoid placing sensitive PII or regulated financial data into participant attributes or public query strings.
