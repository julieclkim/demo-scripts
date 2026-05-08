(function () {
  "use strict";

  const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

  function $(selector) {
    return document.querySelector(selector);
  }

  function params() {
    return new URLSearchParams(window.location.search);
  }

  async function loadStudent(key) {
    try {
      const response = await fetch("data/students.json", { cache: "no-store" });
      if (!response.ok) throw new Error("Unable to load students.json");
      const data = await response.json();
      return data[key] || null;
    } catch (error) {
      console.warn(error);
      return null;
    }
  }

  function parseAmount(value) {
    const amount = Number(String(value || "0").replace(/[^0-9.-]/g, ""));
    return Number.isFinite(amount) ? amount : 0;
  }

  async function init() {
    const p = params();
    const key = p.get("k") || p.get("key") || "demo";
    const amount = parseAmount(p.get("a") || p.get("amount"));
    const confirmation = p.get("c") || p.get("confirmation") || `WGU-${Date.now().toString().slice(-6)}`;
    const student = await loadStudent(key);
    const name = student?.full_name || "Demo Student";

    if ($("#portalStudentName")) $("#portalStudentName").textContent = name;
    if ($("#portalStudentId")) $("#portalStudentId").textContent = key;
    if ($("#portalAmount")) $("#portalAmount").textContent = money.format(amount);
    if ($("#portalConfirmation")) $("#portalConfirmation").textContent = confirmation;
    if ($("#cardName")) $("#cardName").value = name;

    $("#studentPaymentForm")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const panel = $("#studentPaymentSuccess");
      if (panel) {
        panel.classList.remove("hidden");
        panel.innerHTML = `<strong>Payment submitted successfully.</strong><br>Confirmation ${confirmation}. You may return to the call.`;
      }
      const button = event.currentTarget.querySelector("button[type='submit']");
      if (button) {
        button.textContent = "Payment Submitted";
        button.setAttribute("disabled", "disabled");
      }
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
