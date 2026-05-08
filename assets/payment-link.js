(function () {
  "use strict";

  const SECURE_FLOW_ID = "b5907385-d3ac-4e53-a9e8-9b99d2de6c60";
  const DEFAULT_SMS_FROM_ADDRESS = "+18015551212";
  const DATA_ACTION_NAME = "Agentless SMS Notification";
  const DATA_ACTION_ENDPOINT = "/api/v2/conversations/messages/agentless";

  const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
  let balance = 0;
  let minimum = 0;
  let latestPayload = null;

  function $(selector) {
    return document.querySelector(selector);
  }

  function text(selector) {
    const el = $(selector);
    return el ? el.textContent.trim() : "";
  }

  function parseMoney(value) {
    const parsed = Number(String(value || "").replace(/[^0-9.-]/g, ""));
    return Number.isFinite(parsed) ? Math.max(parsed, 0) : 0;
  }

  function cleanPhone(value) {
    const digits = String(value || "").replace(/\D/g, "");
    if (digits.length === 10) return `+1${digits}`;
    if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
    if (String(value || "").startsWith("+")) return value;
    return value || "";
  }

  function firstName(fullName) {
    return String(fullName || "Student").trim().split(/\s+/)[0] || "Student";
  }

  function currentAmount() {
    return parseMoney($("#paymentRequestAmount")?.value);
  }

  function basePath() {
    const path = window.location.pathname.replace(/[^/]*$/, "");
    return `${window.location.origin}${path}`;
  }

  function confirmationNumber() {
    const key = text("[data-param='key']") || "000000";
    const suffix = Math.random().toString(36).slice(2, 7).toUpperCase();
    return `WGU-${key.replace(/\D/g, "").slice(-4) || "0000"}-${suffix}`;
  }

  function getSmsToAddress() {
    return cleanPhone(text("[data-sms-phone]"));
  }

  function getSmsFromAddress() {
    const fromElement = $("[data-sms-from]");
    const fromValue = cleanPhone(fromElement?.textContent);
    const configured = cleanPhone(window.WGU_SMS_FROM_ADDRESS);
    return fromValue || configured || DEFAULT_SMS_FROM_ADDRESS;
  }

  function studentPortalLink(amount, confirmation) {
    const params = new URLSearchParams({
      k: text("[data-param='key']") || "demo",
      a: amount.toFixed(2),
      c: confirmation
    });
    return `${basePath()}pay.html?${params.toString()}`;
  }

  function smsMessage(amount, confirmation) {
    const name = firstName(text("[data-param='full_name']"));
    const link = studentPortalLink(amount, confirmation);
    return `Hi, ${name}. Securely complete your payment here: ${link}. I'll be waiting on the other side until you complete your payment. Let me know if you run into any issues.`;
  }

  function agentlessSmsRequest(body) {
    return {
      fromAddress: getSmsFromAddress(),
      toAddress: getSmsToAddress(),
      toAddressMessengerType: "sms",
      textBody: body
    };
  }

  function dataActionInputs(body) {
    const request = agentlessSmsRequest(body);
    return {
      ...request,
      rawRequest: JSON.stringify(request)
    };
  }

  function updateSmsPreview() {
    const amount = currentAmount();
    const preview = $("#paymentLinkPreview");
    if (!preview) return;
    const conf = latestPayload?.confirmationNumber || confirmationNumber();
    preview.value = smsMessage(amount || minimum || balance || 0, conf);
  }

  function emitGenesysBridgeEvent(eventName, detail) {
    const payload = {
      source: "wgu-payment-demo",
      event: eventName,
      detail
    };
    window.dispatchEvent(new CustomEvent(eventName, { detail }));
    try {
      window.parent.postMessage(payload, "*");
    } catch (error) {
      console.warn("Unable to post message to parent", error);
    }
  }

  function showModal() {
    $("#paymentModal")?.classList.remove("hidden");
    $("#paymentModalBackdrop")?.classList.remove("hidden");
    $("#paymentModal")?.removeAttribute("aria-hidden");
    $("#paymentRequestAmount")?.focus();
    updateSmsPreview();

    emitGenesysBridgeEvent("secureFlowRequested", {
      secureFlowRequested: true,
      secureFlowId: SECURE_FLOW_ID,
      studentKey: text("[data-param='key']"),
      studentName: text("[data-param='full_name']"),
      balanceDue: balance.toFixed(2),
      toAddress: getSmsToAddress(),
      fromAddress: getSmsFromAddress()
    });
  }

  function hideModal() {
    $("#paymentModal")?.classList.add("hidden");
    $("#paymentModalBackdrop")?.classList.add("hidden");
  }

  function setQuickAmount(type) {
    let amount = minimum || balance;
    if (type === "half") amount = balance / 2;
    if (type === "full") amount = balance;
    const field = $("#paymentRequestAmount");
    if (field) field.value = amount.toFixed(2);
    latestPayload = null;
    updateSmsPreview();
  }

  function payloadForRequest() {
    const amount = currentAmount();
    const confirmation = confirmationNumber();
    const paymentLink = studentPortalLink(amount, confirmation);
    const body = smsMessage(amount, confirmation);
    const actionInputs = dataActionInputs(body);

    return {
      action: "callGenesysDataActionAndStartSecureFlow",
      dataActionName: DATA_ACTION_NAME,
      dataActionEndpoint: DATA_ACTION_ENDPOINT,
      secureFlowRequested: true,
      secureFlowId: SECURE_FLOW_ID,
      studentKey: text("[data-param='key']"),
      studentName: text("[data-param='full_name']"),
      firstName: firstName(text("[data-param='full_name']")),
      balanceDue: balance.toFixed(2),
      paymentAmount: amount.toFixed(2),
      paymentLink,
      smsMessage: body,
      confirmationNumber: confirmation,
      smsDataActionInputs: actionInputs,
      rawRequest: actionInputs.rawRequest,
      sourcePage: "payment-script.html"
    };
  }

  function renderPayload(payload) {
    const pre = $("#paymentPayloadPreview");
    if (pre) pre.textContent = JSON.stringify(payload, null, 2);
    const preview = $("#paymentLinkPreview");
    if (preview) preview.value = payload.smsMessage;
  }

  function showStatus(message, tone) {
    const panel = $("#paymentStatusPanel");
    if (!panel) return;
    panel.classList.remove("hidden", "success", "warning");
    if (tone) panel.classList.add(tone);
    panel.innerHTML = message;
  }

  function sendPaymentLink(event) {
    event.preventDefault();
    const amount = currentAmount();
    if (!amount || amount <= 0) {
      showStatus("<strong>Enter an amount first.</strong> Payment link was not sent.", "warning");
      return;
    }
    if (balance && amount > balance) {
      showStatus("<strong>Amount exceeds current balance.</strong> Lower the amount before sending the payment link.", "warning");
      return;
    }

    latestPayload = payloadForRequest();
    renderPayload(latestPayload);
    emitGenesysBridgeEvent("sendPaymentLinkRequested", latestPayload);

    showStatus(
      `<strong>SMS request ready for Genesys Data Action.</strong><br>To: ${latestPayload.smsDataActionInputs.toAddress}<br>From: ${latestPayload.smsDataActionInputs.fromAddress}<br>The call should now enter secure flow ${SECURE_FLOW_ID}.<br><a href="${latestPayload.paymentLink}" target="_blank" rel="noopener">Open dummy student portal</a>`,
      "success"
    );

    const button = $("#sendPaymentLinkBtn");
    if (button) button.textContent = "Payment Link Requested";
  }

  function checkForPayment() {
    const payload = latestPayload || payloadForRequest();
    latestPayload = payload;
    renderPayload(payload);
    const remaining = Math.max(balance - parseMoney(payload.paymentAmount), 0);
    showStatus(
      `<strong>Payment completed.</strong><br>${payload.studentName} completed a payment of ${money.format(parseMoney(payload.paymentAmount))}. Confirmation ${payload.confirmationNumber}. Remaining balance: ${money.format(remaining)}.`,
      "success"
    );
    emitGenesysBridgeEvent("paymentCompletedCheck", {
      ...payload,
      paymentStatus: "Completed",
      remainingBalance: remaining.toFixed(2)
    });
  }

  function init() {
    balance = parseMoney(text("[data-balance-source]"));
    minimum = parseMoney(text("[data-minimum-source]"));
    if (!minimum && balance) minimum = Math.min(balance, Math.max(50, balance * 0.25));
    const amountField = $("#paymentRequestAmount");
    if (amountField) amountField.value = (minimum || balance || 0).toFixed(2);

    $("#collectPaymentBtn")?.addEventListener("click", showModal);
    $("#closePaymentModal")?.addEventListener("click", hideModal);
    $("#paymentModalBackdrop")?.addEventListener("click", hideModal);
    $("#paymentLinkForm")?.addEventListener("submit", sendPaymentLink);
    $("#checkPaymentBtn")?.addEventListener("click", checkForPayment);
    amountField?.addEventListener("input", () => {
      latestPayload = null;
      updateSmsPreview();
    });
    document.querySelectorAll("[data-amount-choice]").forEach((btn) => {
      btn.addEventListener("click", () => setQuickAmount(btn.dataset.amountChoice));
    });
    updateSmsPreview();
  }

  document.addEventListener("DOMContentLoaded", () => {
    window.setTimeout(init, 0);
  });
})();
