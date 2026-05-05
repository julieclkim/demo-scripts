(function () {
  "use strict";

  const params = new URLSearchParams(window.location.search);

  const aliases = {
    key: ["student_id", "studentId", "student_number", "studentNumber"],
    full_name: ["student_name", "studentName", "name", "customer_name", "CustomerName"],
    phone_number: ["phone", "ani", "ANI", "customer_phone"],
    email: ["email_address", "student_email", "customer_email"],
    balance_due: ["outstanding_balance", "balance", "amount_due"],
    enrollment_status: ["status", "student_status"],
    financial_aid_status: ["aid_status", "financialAidStatus"],
    aid_disbursement_date: ["disbursement_date", "aidDisbursementDate"],
    account_hold_flag: ["hold_flag", "accountHoldFlag", "has_hold"],
    payment_plan_available: ["payment_plan", "paymentPlanAvailable"],
    payment_portal_url: ["portal_url", "student_payment_portal", "paymentPortalUrl"],
    risk_flag: ["risk", "risk_status", "riskFlag"],
    institution_name: ["institution", "university_name", "school_name"],
    campus_location_name: ["campus_name", "location_name"],
    campus_address: ["address", "campus"],
    campus_lat: ["lat", "latitude"],
    campus_lng: ["lng", "lon", "longitude"]
  };

  const defaults = {
    institution_name: "Western Governors University",
    key: "123456",
    full_name: "Sample Student",
    program: "Bachelor of Science, Business Administration",
    student_type: "Active Student",
    phone_number: "(555) 010-1010",
    email: "student@example.edu",
    balance_due: "$0",
    enrollment_status: "Enrolled",
    student_notes: "Student record loaded from Genesys Cloud participant attributes.",
    application_status: "Completed",
    next_step: "Confirm the student's goal and guide them to the next required action.",
    missing_requirements: "None listed",
    assigned_enrollment_counselor: "Not Assigned",
    aid_disbursement_date: "Date pending",
    financial_aid_status: "Eligibility review pending",
    account_hold_flag: "False",
    hold_reason: "No active holds",
    payment_plan_available: "True",
    next_required_action: "Review account and document the outcome.",
    last_action_taken: "No prior action recorded",
    risk_flag: "No risk flagged",
    campus_location_name: "WGU Headquarters",
    campus_address: "4001 S 700 E, Salt Lake City, UT 84107",
    campus_lat: "40.6869",
    campus_lng: "-111.8708",
    aid_year: "2026",
    estimated_aid_amount: "$0",
    approved_aid_amount: "$0",
    grant_amount: "$0",
    scholarship_amount: "$0",
    loan_amount: "$0",
    remaining_aid_needed: "$0",
    disbursement_status: "Pending review",
    payment_plan_options: "Monthly installment plan, one-time payment, employer reimbursement documentation",
    minimum_payment: "$0",
    payment_due_date: "Date pending",
    payment_portal_url: "https://my.wgu.edu/",
    payment_reference_id: "Generated at payment portal",
    callback_number: "Student preferred number on file"
  };

  function clean(value) {
    if (value === null || value === undefined) return "";
    const text = String(value).trim();
    if (!text) return "";
    const bad = ["null", "undefined", "nan", "n/a"];
    return bad.includes(text.toLowerCase()) ? "" : text;
  }

  function getParam(name, fallback) {
    const keys = [name].concat(aliases[name] || []);
    for (const key of keys) {
      const value = clean(params.get(key));
      if (value) return value;
    }
    return fallback !== undefined ? fallback : defaults[name] || "Not provided";
  }

  function yesNo(value) {
    const text = clean(value).toLowerCase();
    if (["true", "yes", "y", "1", "available", "active"].includes(text)) return "Yes";
    if (["false", "no", "n", "0", "none", "not available", "inactive"].includes(text)) return "No";
    return clean(value) || "Not provided";
  }

  function isTrue(value) {
    return ["true", "yes", "y", "1", "available", "active"].includes(clean(value).toLowerCase());
  }

  function formatPhone(value) {
    const raw = clean(value);
    const digits = raw.replace(/\D/g, "");
    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    if (digits.length === 11 && digits.startsWith("1")) {
      return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    }
    return raw || defaults.phone_number;
  }

  function badgeClass(value, type) {
    const text = clean(value).toLowerCase();
    if (type === "hold") return isTrue(value) ? "danger" : "success";
    if (type === "payment_plan") return isTrue(value) ? "success" : "warning";
    if (type === "risk") {
      if (!text || text === "no risk flagged" || text === "none listed") return "success";
      if (text.includes("financial")) return "danger";
      if (text.includes("delay") || text.includes("risk")) return "warning";
      return "warning";
    }
    if (text.includes("enrolled") || text.includes("completed") || text.includes("disbursed") || text.includes("approved")) return "success";
    if (text.includes("hold") || text.includes("blocked") || text.includes("overdue")) return "danger";
    if (text.includes("pending") || text.includes("pre") || text.includes("prospect") || text.includes("inquiry")) return "info";
    return "neutral";
  }

  function setText(el, value) {
    if (!el) return;
    const mode = el.dataset.format || "text";
    let output = value;
    if (mode === "phone") output = formatPhone(value);
    if (mode === "yesno") output = yesNo(value);
    el.textContent = output;
  }

  function populateText() {
    document.querySelectorAll("[data-param]").forEach((el) => {
      const name = el.dataset.param;
      const fallback = el.dataset.default;
      setText(el, getParam(name, fallback));
    });
  }

  function populateBadges() {
    document.querySelectorAll("[data-badge-param]").forEach((el) => {
      const name = el.dataset.badgeParam;
      const value = getParam(name, el.dataset.default);
      const type = el.dataset.badgeType || name;
      if (type === "hold") {
        el.textContent = isTrue(value) ? "Account Hold Active" : "No Account Hold";
      } else if (type === "payment_plan") {
        el.textContent = isTrue(value) ? "Payment Plan Available" : "Payment Plan Unavailable";
      } else {
        el.textContent = value;
      }
      el.classList.remove("success", "warning", "danger", "info", "neutral");
      el.classList.add(badgeClass(value, type));
    });
  }

  function populateHeader() {
    const institution = getParam("institution_name");
    document.querySelectorAll("[data-institution]").forEach((el) => {
      el.textContent = institution;
    });
    if (document.title.includes("Student Demo")) {
      document.title = document.title.replace("Student Demo", institution);
    }
  }

  function populateNavLinks() {
    document.querySelectorAll("a[data-preserve-query]").forEach((link) => {
      const url = new URL(link.getAttribute("href"), window.location.href);
      if (window.location.search) url.search = window.location.search;
      link.setAttribute("href", url.pathname.split("/").pop() + url.search);
    });
  }

  function populateMap() {
    const frame = document.querySelector("[data-campus-map]");
    if (!frame) return;
    const lat = Number(getParam("campus_lat"));
    const lng = Number(getParam("campus_lng"));
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    const spreadLat = 0.008;
    const spreadLng = 0.014;
    const bbox = [lng - spreadLng, lat - spreadLat, lng + spreadLng, lat + spreadLat].map((num) => num.toFixed(5)).join("%2C");
    const marker = `${lat.toFixed(5)}%2C${lng.toFixed(5)}`;
    frame.src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${marker}`;
    frame.title = `${getParam("campus_location_name")} map`;
  }

  function populatePortalLink() {
    const link = document.querySelector("[data-payment-portal]");
    if (!link) return;
    const raw = getParam("payment_portal_url");
    try {
      const url = new URL(raw, window.location.href);
      if (!["https:", "http:"].includes(url.protocol)) throw new Error("Invalid protocol");
      link.href = url.href;
      link.textContent = "Open student payment portal";
    } catch (error) {
      link.removeAttribute("href");
      link.textContent = "Payment portal URL unavailable";
      link.classList.add("secondary");
    }
  }

  function setConditionalMessages() {
    const holdFlag = getParam("account_hold_flag");
    const holdActive = isTrue(holdFlag);
    document.querySelectorAll("[data-show-if-hold]").forEach((el) => {
      el.classList.toggle("hidden", !holdActive);
    });
    document.querySelectorAll("[data-show-if-no-hold]").forEach((el) => {
      el.classList.toggle("hidden", holdActive);
    });

    const planAvailable = isTrue(getParam("payment_plan_available"));
    document.querySelectorAll("[data-show-if-payment-plan]").forEach((el) => {
      el.classList.toggle("hidden", !planAvailable);
    });
    document.querySelectorAll("[data-show-if-no-payment-plan]").forEach((el) => {
      el.classList.toggle("hidden", planAvailable);
    });
  }

  function addEmbeddedClass() {
    if (window.self !== window.top) {
      document.body.classList.add("embedded");
    }
  }

  function init() {
    addEmbeddedClass();
    populateHeader();
    populateText();
    populateBadges();
    populateNavLinks();
    populateMap();
    populatePortalLink();
    setConditionalMessages();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
