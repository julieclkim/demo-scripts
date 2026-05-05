# Genesys Cloud setup fix

This version supports the same pattern Andy used: pass only the student key from Genesys, then let the GitHub page look up the rest of the demo record from `data/students.json`.

## Why `{{variables}}` showed up literally

`{{key}}`, `{{full_name}}`, and similar text are not automatically replaced by Genesys just because they appear in a URL. They must be real Genesys script variables inserted into the Web Page component or provided as script input variables through Architect Set Screen Pop.

The exported Andy script uses a Web Page component URL with one input variable: `accountNumber`. His HTML then fetches a JSON file and looks up all details from that account number.

## Recommended demo pattern

Use this Web Page Source for the Student Dashboard:

```text
https://julieclkim.github.io/demo-scripts/agent-script.html?key=<insert the Genesys script variable key here>
```

Use the Genesys variable picker or Insert Variable control for the `key` value. Do not manually type literal braces unless Genesys converts it into a real script variable token.

The runtime URL should look like this:

```text
https://julieclkim.github.io/demo-scripts/agent-script.html?key=941115
```

It should not look like this at runtime:

```text
https://julieclkim.github.io/demo-scripts/agent-script.html?key={{key}}
```

## Architect checklist

1. In the Genesys script, create a string variable named `key`.
2. Set `Input` to Yes on the `key` variable.
3. Publish the script.
4. In Architect, after the virtual agent collects the student ID, map that value into the screen pop input variable `key`.
5. Transfer to ACD after the Set Screen Pop action.
6. Test with a real call or message conversation. Some participant data behavior is not fully testable from Architect Test mode.

## Test keys included

- 12345: Matt Martell
- 23456: Emerson Wells
- 67890: Tony Montana
- 941115: Julie Kim
- 98765: Hudson Thorton

## Page URLs

```text
https://julieclkim.github.io/demo-scripts/agent-script.html?key=941115
https://julieclkim.github.io/demo-scripts/financial-aid-script.html?key=941115
https://julieclkim.github.io/demo-scripts/payment-script.html?key=941115
```

Navigation between the three pages preserves the `key` query string.
