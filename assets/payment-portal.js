(function () {
  "use strict";

  const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
  let step = 1;
  let balance = 0;
  let minimum = 0;

  function $(selector) {
    return document.querySelector(selector);
  }

  function text(selector) {
    const el = $(selector);
    return el ? el.textContent.trim() : "";
  }

  function parseMoney(value) {
    const cleaned = String(value || "").replace(/[^0-9.-]/g, "");
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? Math.max(parsed, 0) : 0;
  }

  function todayISO() {
    return new Date().toISOString().slice(0, 10);
  }

  function cleanPhone(value) {
    const digits = String(value || "").replace(/\D/g, "");
    if (digits.length === 10) return `+1${digits}`;
    if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
    return value || "student phone on file";
  }

  function confirmationNumber() {
    const key = text("[data-param='key']") || "000000";
    const suffix = Math.random().toString(36).slice(2, 7).toUpperCase();
    return `WGU-${key.replace(/\D/g, "").slice(-4) || "0000"}-${suffix}`;
  }

  function setStep(nextStep) {
    step = Math.min(3, Math.max(1, nextStep));
    document.querySelectorAll("[data-payment-step]").forEach((section) => {
      section.classList.toggle("hidden", Number(section.dataset.paymentStep) !== step);
    });
    document.querySelectorAll("[data-step-marker]").forEach((marker) => {
      marker.classList.toggle("active", Number(marker.dataset.stepMarker) <= step);
    });
    const badge = $("#portalStepBadge");
    if (badge) badge.textContent = `Step ${step} of 3`;
    $("#portalBackBtn")?.toggleAttribute("disabled", step === 1);
    $("#portalNextBtn")?.classList.toggle("hidden", step === 3);
    $("#submitPaymentBtn")?.classList.toggle("hidden", step !== 3);
    if (step === 3) buildConfirmation();
  }

  function selectedAmount() {
    return parseMoney($("#paymentAmount")?.value);
  }

  function validateStep() {
    const message = $("#paymentValidation");
    if (message) message.textContent = "";

    if (step === 1) {
      const amount = selectedAmount();
      if (!amount || amount <= 0) {
        if (message) message.textContent = "Enter a payment amount greater than $0.";
        return false;
      }
      if (balance && amount > balance) {
        if (message) message.textContent = "Payment amount cannot exceed the outstanding balance for this demo.";
        return false;
      }
      if (!$("#paymentDate")?.value) {
        if (message) message.textContent = "Select a payment date.";
        return false;
      }
    }

    if (step === 2) {
      if (!$("#studentAuthorized")?.checked || !$("#secureFlowCompleted")?.checked) {
        alert("Confirm student authorization and secure flow completion before continuing.");
        return false;
      }
    }
    return true;
  }

  function buildSmsBody(conf) {
    const amount = selectedAmount();
    const name = text("[data-param='full_name']") || "student";
    const remaining = Math.max(balance - amount, 0);
    return `WGU Student Accounts: Payment of ${money.format(amount)} for ${name} was submitted for ${$("#paymentDate")?.value}. Confirmation ${conf}. Remaining balance: ${money.format(remaining)}.`;
  }

  function buildConfirmation() {
    let conf = $("#confirmationNumber")?.textContent.trim();
    if (!conf || conf === "Pending") {
      conf = confirmationNumber();
      if ($("#confirmationNumber")) $("#confirmationNumber").textContent = conf;
    }
    if ($("#smsPreview")) $("#smsPreview").value = buildSmsBody(conf);
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

  function openPortal() {
    const portal = $("#paymentPortal");
    if (!portal) return;
    portal.classList.remove("hidden");
    portal.scrollIntoView({ behavior: "smooth", block: "start" });
    const flag = $("#secureFlowFlag");
    const status = $("#paymentStatus");
    if (flag) flag.textContent = "Requested";
    if (status) status.textContent = "Secure flow requested";

    emitGenesysBridgeEvent("paymentSecureFlowRequested", {
      secureFlowRequested: true,
      studentKey: text("[data-param='key']"),
      studentName: text("[data-param='full_name']"),
      phoneNumber: cleanPhone(text("[data-sms-phone]")),
      balanceDue: balance
    });
  }

  function setQuickAmount(type) {
    let amount = minimum || balance;
    if (type === "half") amount = balance / 2;
    if (type === "full") amount = balance;
    if ($("#paymentAmount")) $("#paymentAmount").value = amount.toFixed(2);
  }

  function submitPayment(event) {
    event.preventDefault();
    if (!validateStep()) return;
    buildConfirmation();
    const conf = text("#confirmationNumber");
    const amount = selectedAmount();
    const phoneNumber = cleanPhone(text("[data-sms-phone]"));
    const smsBody = $("#smsPreview")?.value || buildSmsBody(conf);
    const payload = {
      secureFlowCompleted: true,
      paymentStatus: "Submitted",
      confirmationNumber: conf,
      studentKey: text("[data-param='key']"),
      studentName: text("[data-param='full_name']"),
      paymentAmount: amount.toFixed(2),
      paymentDate: $("#paymentDate")?.value,
      paymentMethod: $("#paymentMethod")?.value,
      smsPhoneNumber: phoneNumber,
      smsMessage: smsBody
    };

    if ($("#paymentStatus")) $("#paymentStatus").textContent = `Submitted: ${conf}`;
    if ($("#submitPaymentBtn")) {
      $("#submitPaymentBtn").textContent = "Payment Submitted";
      $("#submitPaymentBtn").setAttribute("disabled", "disabled");
    }
    emitGenesysBridgeEvent("paymentSubmitted", payload);
    alert(`Demo payment submitted. SMS payload prepared for ${phoneNumber}.`);
  }

  function init() {
    balance = parseMoney(text("[data-balance-source]"));
    minimum = parseMoney(text("[data-minimum-source]"));
    if (!minimum && balance) minimum = Math.min(balance, Math.max(50, balance * 0.25));
    if ($("#paymentAmount")) $("#paymentAmount").value = (minimum || balance || 0).toFixed(2);
    if ($("#paymentDate")) $("#paymentDate").value = todayISO();

    $("#collectPaymentBtn")?.addEventListener("click", openPortal);
    $("#portalBackBtn")?.addEventListener("click", () => setStep(step - 1));
    $("#portalNextBtn")?.addEventListener("click", () => {
      if (validateStep()) setStep(step + 1);
    });
    $("#cancelPaymentBtn")?.addEventListener("click", () => {
      $("#paymentPortal")?.classList.add("hidden");
      if ($("#paymentStatus")) $("#paymentStatus").textContent = "Cancelled";
      emitGenesysBridgeEvent("paymentCancelled", { studentKey: text("[data-param='key']") });
    });
    $("#paymentForm")?.addEventListener("submit", submitPayment);
    document.querySelectorAll("[data-amount-choice]").forEach((btn) => {
      btn.addEventListener("click", () => setQuickAmount(btn.dataset.amountChoice));
    });
    setStep(1);
  }

  document.addEventListener("DOMContentLoaded", () => {
    window.setTimeout(init, 0);
  });
})();
