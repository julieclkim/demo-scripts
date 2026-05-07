(function () {
  "use strict";

  const DATA_URL = "data/students.json";
  const params = new URLSearchParams(window.location.search);
  let studentRecord = {};

  const aliases = {
    key: ["student_id", "studentId", "student_number", "studentNumber", "accountNumber", "account_number"],
    full_name: ["student_name", "studentName", "name", "customer_name", "CustomerName"],
    program: ["program_name", "degree_program", "area_of_study", "areaOfStudy"],
    student_type: ["type", "studentType"],
    enrollment_status: ["status", "student_status"],
    student_notes: ["notes", "advisor_notes", "studentNotes"],
    account_hold_flag: ["hold_flag", "accountHoldFlag", "has_hold"],
    hold_reason: ["holdReason"],
    risk_flag: ["risk", "risk_status", "riskFlag"],
    balance_due: ["balance", "outstanding_balance", "amount_due"]
  };

  const defaults = {
    key: "123456",
    full_name: "Sample Student",
    program: "Bachelor of Science, Business Administration",
    student_type: "Active Student",
    enrollment_status: "Enrolled",
    student_notes: "No advisor note provided.",
    account_hold_flag: "False",
    hold_reason: "No active holds",
    risk_flag: "No risk flagged",
    balance_due: "$0"
  };

  function unresolvedToken(value) {
    return /^\s*\{\{[^}]+\}\}\s*$/.test(String(value || ""));
  }

  function clean(value) {
    if (value === null || value === undefined) return "";
    const text = String(value).trim();
    if (!text || unresolvedToken(text)) return "";
    const bad = ["null", "undefined", "nan", "n/a"];
    return bad.includes(text.toLowerCase()) ? "" : text;
  }

  function getQueryValue(name) {
    const keys = [name].concat(aliases[name] || []);
    for (const key of keys) {
      const value = clean(params.get(key));
      if (value) return value;
    }
    return "";
  }

  function getValue(name) {
    const queryValue = getQueryValue(name);
    if (queryValue) return queryValue;
    const keys = [name].concat(aliases[name] || []);
    for (const key of keys) {
      const value = clean(studentRecord[key]);
      if (value) return value;
    }
    return defaults[name] || "Not provided";
  }

  function isTrue(value) {
    return ["true", "yes", "y", "1", "available", "active"].includes(clean(value).toLowerCase());
  }

  async function loadStudentRecord() {
    const key = getQueryValue("key");
    if (!key) return;
    try {
      const response = await fetch(DATA_URL, { cache: "no-store" });
      if (!response.ok) return;
      const data = await response.json();
      studentRecord = data[key] || {};
    } catch (error) {
      console.warn("Course lookup failed", error);
      studentRecord = {};
    }
  }

  function bucketForProgram(program) {
    const text = clean(program).toLowerCase();
    if (text.includes("nursing") || text.includes("rn")) return "nursing";
    if (text.includes("cyber") || text.includes("security")) return "cybersecurity";
    if (text.includes("finance") || text.includes("business")) return "business_finance";
    if (text.includes("education") || text.includes("teaching")) return "education";
    if (text.includes("it management") || text.includes("information technology") || text.includes("graduate it")) return "grad_it";
    return "general";
  }

  function buildBaseRows(bucket, isProspect) {
    const plans = {
      nursing: {
        active: [
          row("Complete", "NURS-DEMO-201", "Professional Leadership and Communication for Healthcare", "Performance task", "3", "Completed Apr 3, 2026", 100, "Validate completion is reflected before changing term pacing."),
          row("In Progress", "NURS-DEMO-214", "Care of the Older Adult", "Objective assessment", "3", "Target assessment by May 22, 2026", 48, "Primary focus for this call. Confirm study blocks and assessment readiness."),
          row("Queued", "NURS-DEMO-307", "Quality and Safety in Nursing Practice", "Performance task", "3", "Open after current course is scheduled", 0, "Do not accelerate until the student confirms capacity."),
          row("Future", "NURS-DEMO-402", "Evidence-Based Practice and Applied Nursing Project", "Capstone preparation", "3", "Future term planning", 0, "Mention only if student asks about graduation timeline.")
        ],
        prospect: []
      },
      cybersecurity: {
        active: [
          row("In Progress", "CYBR-DEMO-110", "Network and Security Foundations", "Objective assessment", "3", "Target assessment by May 18, 2026", 36, "Start with fundamentals and confirm lab access."),
          row("Queued", "CYBR-DEMO-220", "Cyber Defense and Countermeasures", "Performance task", "4", "Open after foundations assessment", 0, "Introduce course community and instructor support early."),
          row("Queued", "CYBR-DEMO-240", "Cloud Security Fundamentals", "Objective assessment", "3", "Stretch goal if first course is completed early", 0, "Acceleration option only after the first assessment is scheduled."),
          row("Future", "CYBR-DEMO-490", "Security Operations Portfolio", "Capstone preparation", "4", "Future term planning", 0, "No action this week.")
        ],
        prospect: [
          row("Proposed", "CYBR-DEMO-100", "Orientation and Online Learning Readiness", "Readiness module", "1", "Before term start", 0, "Confirm the student understands online pacing and required technology."),
          row("Proposed", "CYBR-DEMO-110", "Network and Security Foundations", "Objective assessment", "3", "First 3 to 4 weeks of term", 0, "Good first course for confidence and momentum."),
          row("Proposed", "CYBR-DEMO-140", "Scripting and Automation Basics", "Performance task", "3", "After foundations course", 0, "Ask about prior IT experience before recommending acceleration."),
          row("Proposed", "CYBR-DEMO-220", "Cyber Defense and Countermeasures", "Performance task", "4", "Late term target", 0, "Position as a stretch course if the student starts strong.")
        ]
      },
      business_finance: {
        active: [
          row("In Progress", "FIN-DEMO-210", "Financial Accounting for Business Decisions", "Objective assessment", "3", "Target assessment by May 20, 2026", 62, "Student has momentum. Confirm assessment date and remove account blockers."),
          row("Queued", "FIN-DEMO-260", "Principles of Finance", "Objective assessment", "3", "Queued pending registration hold review", 0, "Hold may prevent registration expansion. Resolve balance before adding."),
          row("Blocked", "BUS-DEMO-330", "Quantitative Analysis for Business", "Objective assessment", "3", "Blocked until hold clears", 0, "Do not promise access until account hold is resolved."),
          row("Future", "BUS-DEMO-480", "Business Strategy Capstone", "Performance task", "4", "Future term planning", 0, "No action this week.")
        ],
        prospect: [
          row("Proposed", "BUS-DEMO-100", "Business Orientation and Readiness", "Readiness module", "1", "Before term start", 0, "Use as the first confidence-building step."),
          row("Proposed", "FIN-DEMO-210", "Financial Accounting for Business Decisions", "Objective assessment", "3", "First 4 weeks of term", 0, "Set expectation for frequent practice and assessment prep."),
          row("Proposed", "FIN-DEMO-260", "Principles of Finance", "Objective assessment", "3", "Midterm target", 0, "Recommend finance calculator readiness and instructor touchpoint."),
          row("Proposed", "BUS-DEMO-220", "Business Communication", "Performance task", "3", "Late term target", 0, "Good acceleration candidate if writing tasks are completed quickly.")
        ]
      },
      education: {
        active: [
          row("In Progress", "EDU-DEMO-105", "Foundations of Teaching and Learning", "Objective assessment", "3", "Target assessment by May 19, 2026", 42, "Confirm study routine and first assessment readiness."),
          row("Queued", "EDU-DEMO-230", "Educational Psychology and Development", "Objective assessment", "3", "Open after foundations course", 0, "Suggest instructor touchpoint before opening the course."),
          row("Queued", "EDU-DEMO-315", "Classroom Management and Engagement", "Performance task", "3", "Late term target", 0, "Good fit if the student prefers scenario-based work."),
          row("Future", "EDU-DEMO-410", "Professional Practice Preparation", "Field readiness", "3", "Future term planning", 0, "Only discuss after enrollment requirements are complete.")
        ],
        prospect: [
          row("Proposed", "EDU-DEMO-100", "Orientation and Program Readiness", "Readiness module", "1", "Before term start", 0, "Confirm licensure expectations and state requirements."),
          row("Proposed", "EDU-DEMO-105", "Foundations of Teaching and Learning", "Objective assessment", "3", "First 3 to 4 weeks of term", 0, "Good first academic course after enrollment."),
          row("Proposed", "EDU-DEMO-230", "Educational Psychology and Development", "Objective assessment", "3", "Midterm target", 0, "Position as a steady pacing course, not an acceleration promise."),
          row("Proposed", "EDU-DEMO-315", "Classroom Management and Engagement", "Performance task", "3", "Stretch goal", 0, "Use as stretch course if the student has classroom experience.")
        ]
      },
      grad_it: {
        active: [
          row("In Progress", "MGIT-DEMO-610", "IT Strategic Solutions", "Performance task", "3", "Task 1 target by May 17, 2026", 34, "Confirm project topic and evaluator rubric review."),
          row("Queued", "MGIT-DEMO-630", "Project Governance and Risk", "Performance task", "3", "Open after Task 1 submission", 0, "Good course to pair with work experience examples."),
          row("Queued", "MGIT-DEMO-650", "Data-Driven Decision Making", "Objective assessment", "3", "Late term stretch", 0, "Only accelerate if first performance task is submitted early."),
          row("Future", "MGIT-DEMO-690", "Graduate IT Management Capstone", "Capstone preparation", "4", "Future term planning", 0, "No action this week.")
        ],
        prospect: [
          row("Proposed", "MGIT-DEMO-600", "Graduate Orientation and Program Fit", "Readiness module", "1", "Before term start", 0, "Confirm returning student pathway and transcript status."),
          row("Proposed", "MGIT-DEMO-610", "IT Strategic Solutions", "Performance task", "3", "First 4 weeks of term", 0, "Strong first course for a student with prior IT experience."),
          row("Proposed", "MGIT-DEMO-630", "Project Governance and Risk", "Performance task", "3", "Midterm target", 0, "Connect coursework to current role or prior project experience."),
          row("Proposed", "MGIT-DEMO-650", "Data-Driven Decision Making", "Objective assessment", "3", "Stretch goal", 0, "Acceleration candidate if work/life schedule is stable.")
        ]
      },
      general: {
        active: [
          row("In Progress", "GEN-DEMO-110", "Program Foundations", "Objective assessment", "3", "Target assessment by May 21, 2026", 40, "Confirm course goal and study schedule."),
          row("Queued", "GEN-DEMO-220", "Applied Professional Skills", "Performance task", "3", "Open after current course", 0, "Use as acceleration candidate if current course is completed early."),
          row("Future", "GEN-DEMO-330", "Program Core Course", "Objective assessment", "3", "Future term planning", 0, "No action this week.")
        ],
        prospect: [
          row("Proposed", "GEN-DEMO-100", "Orientation and Program Readiness", "Readiness module", "1", "Before term start", 0, "Confirm expectations and support model."),
          row("Proposed", "GEN-DEMO-110", "Program Foundations", "Objective assessment", "3", "First 3 to 4 weeks of term", 0, "First academic course after enrollment."),
          row("Proposed", "GEN-DEMO-220", "Applied Professional Skills", "Performance task", "3", "Midterm target", 0, "Use as stretch course only if pacing is stable.")
        ]
      }
    };

    const plan = plans[bucket] || plans.general;
    return isProspect ? (plan.prospect.length ? plan.prospect : plan.active) : plan.active;
  }

  function row(status, id, title, assessment, cus, target, progress, note) {
    return { status, id, title, assessment, cus, target, progress, note };
  }

  function getStudentContext() {
    const program = getValue("program");
    const notes = getValue("student_notes");
    const risk = getValue("risk_flag");
    const status = getValue("enrollment_status");
    const studentType = getValue("student_type");
    const hold = isTrue(getValue("account_hold_flag"));
    const combined = `${program} ${notes} ${risk} ${status} ${studentType}`.toLowerCase();

    const isProspect = ["inquiry", "prospect", "prospective", "pre-enrollment", "not started"].some((term) => combined.includes(term));
    const overwhelmed = ["overwhelmed", "struggling", "keep up", "full-time", "delay risk", "behind", "adjust schedule"].some((term) => combined.includes(term));
    const financialRisk = hold || ["financial risk", "balance hold", "overdue", "payment"].some((term) => combined.includes(term));
    const bucket = bucketForProgram(program);

    return { program, notes, risk, status, studentType, hold, isProspect, overwhelmed, financialRisk, bucket };
  }

  function buildPlan(context) {
    const rows = buildBaseRows(context.bucket, context.isProspect);
    const activeCount = rows.filter((item) => ["in progress", "active"].includes(item.status.toLowerCase())).length;
    let focus = rows.find((item) => ["in progress", "active", "proposed"].includes(item.status.toLowerCase())) || rows[0];
    let weeklyTarget = context.isProspect ? "Enrollment readiness" : "8 to 10 hours";
    let pacing = context.isProspect ? "Pre-enrollment planning" : "On track";
    let scheduleBadge = context.isProspect ? "Proposed Plan" : "On Track";
    let scheduleBadgeClass = context.isProspect ? "info" : "success";
    let termTitle = context.isProspect ? "Proposed first-term course plan" : "Current term schedule";
    let nextMove = context.isProspect ? "Confirm enrollment requirements, then review first-term pacing." : "Confirm the current assessment target and keep the next course queued.";
    let acceleration = context.isProspect ? "Discuss only after application and readiness steps are complete." : "Add one queued course after the current assessment is scheduled or passed.";
    let escalation = context.isProspect ? "Enrollment counselor follow-up if application or transcripts are incomplete." : "No escalation needed unless the student reports new blockers.";

    if (context.overwhelmed && !context.isProspect) {
      weeklyTarget = "6 to 8 focused hours";
      pacing = "Stabilize pacing";
      scheduleBadge = "Delay Risk";
      scheduleBadgeClass = "warning";
      nextMove = "Create a two-week pacing reset and focus on one active course only.";
      acceleration = "Do not add a course until the current assessment is scheduled and the student confirms capacity.";
      escalation = "Program mentor check-in within 48 hours if the student cannot commit to study blocks.";
    }

    if (context.financialRisk && !context.isProspect) {
      pacing = context.overwhelmed ? "Stabilize and resolve hold" : "Resolve account hold";
      scheduleBadge = "Action Needed";
      scheduleBadgeClass = "danger";
      nextMove = "Resolve the account hold before expanding registration or promising access to additional courses.";
      escalation = "Student accounts or financial aid review if the student cannot clear the hold through the portal.";
    }

    const suggestions = buildSuggestions(context);
    const weeklyPlan = buildWeeklyPlan(context, focus);
    const callGuide = buildCallGuide(context, focus);

    return {
      rows,
      focus: focus ? focus.title : "Confirm current course",
      activeCount: context.isProspect ? "0 active, proposed plan only" : String(activeCount || 1),
      weeklyTarget,
      pacing,
      scheduleBadge,
      scheduleBadgeClass,
      termTitle,
      nextMove,
      acceleration,
      escalation,
      suggestions,
      weeklyPlan,
      callGuide
    };
  }

  function buildSuggestions(context) {
    const suggestions = [];

    if (context.isProspect) {
      suggestions.push("Keep language provisional: this is a proposed first-term plan until enrollment is complete.");
      suggestions.push("Confirm the next enrollment action, such as application, transcripts, aid, or orientation readiness.");
      suggestions.push("Ask about weekly availability before discussing acceleration or heavy course loads.");
    } else {
      suggestions.push("Confirm the current active course, target assessment date, and the student's available study hours this week.");
      suggestions.push("Document the agreed next action before ending the interaction.");
    }

    if (context.overwhelmed && !context.isProspect) {
      suggestions.push("Use a pacing reset: one active course, three study blocks, and one mentor check-in before adding work.");
      suggestions.push("Offer a realistic 6 to 8 hour weekly plan instead of pushing acceleration.");
      suggestions.push("Ask what is driving the overload: work schedule, family obligations, course difficulty, or unclear next steps.");
    }

    if (context.financialRisk && !context.isProspect) {
      suggestions.push(`Address the hold before course expansion. Balance on file: ${getValue("balance_due")}.`);
      suggestions.push("Route to payment or financial aid support if the student cannot clear the blocker during the call.");
    }

    if (!context.overwhelmed && !context.financialRisk && !context.isProspect) {
      suggestions.push("Student appears on track. Offer an acceleration option only after the next assessment is scheduled.");
      suggestions.push("Confirm graduation timeline and whether the student wants to pull one queued course forward.");
    }

    return suggestions;
  }

  function buildWeeklyPlan(context, focus) {
    if (context.isProspect) {
      return [
        "Confirm program fit and weekly availability.",
        "Review application, transcript, financial aid, and orientation readiness steps.",
        "Set expectation that the first course plan may change after enrollment review.",
        "Schedule counselor follow-up and capture preferred contact window."
      ];
    }

    if (context.overwhelmed) {
      return [
        `Focus only on ${focus.title}.`,
        "Agree to three study blocks: two 90-minute weekday blocks and one 3-hour weekend block.",
        "Schedule a mentor touchpoint before the next assessment date.",
        "Hold queued courses until the student confirms capacity."
      ];
    }

    if (context.financialRisk) {
      return [
        "Review balance, hold reason, and payment or aid status first.",
        `Keep academic focus on ${focus.title} while the account issue is resolved.`,
        "Confirm whether queued courses are blocked by registration policy.",
        "Set follow-up after payment, aid disbursement, or hold clearance."
      ];
    }

    return [
      `Confirm target date for ${focus.title}.`,
      "Ask the student to complete the next learning module and readiness check this week.",
      "Schedule instructor support if progress is below 50 percent.",
      "Discuss opening the next queued course after assessment scheduling."
    ];
  }

  function buildCallGuide(context, focus) {
    const guide = [];
    guide.push({
      title: "Open",
      text: `I see your current focus is ${focus.title}. Let's review your pace, any blockers, and the next best action for this week.`
    });

    if (context.isProspect) {
      guide.push({
        title: "Set expectations",
        text: "This is a proposed first-term path. The final plan depends on completed enrollment requirements and program review."
      });
      guide.push({
        title: "Close",
        text: "Confirm the next enrollment step, preferred follow-up time, and whether the student needs help with aid, transcripts, or orientation."
      });
      return guide;
    }

    if (context.overwhelmed) {
      guide.push({
        title: "Pacing reset",
        text: "Acknowledge the workload, narrow the plan to one active course, and agree on a small number of study blocks the student can realistically complete."
      });
    }

    if (context.financialRisk) {
      guide.push({
        title: "Account blocker",
        text: "Explain that the academic plan may be limited until the account hold is resolved. Offer payment or financial aid next steps."
      });
    }

    guide.push({
      title: "Close",
      text: "Restate the assessment target, next action, follow-up owner, and any escalation you are creating after the call."
    });
    return guide;
  }

  function setText(selector, value) {
    document.querySelectorAll(selector).forEach((el) => {
      el.textContent = value;
    });
  }

  function badgeClassForStatus(status) {
    const text = String(status || "").toLowerCase();
    if (text.includes("complete")) return "success";
    if (text.includes("progress") || text.includes("active")) return "info";
    if (text.includes("blocked")) return "danger";
    if (text.includes("queued") || text.includes("future") || text.includes("proposed")) return "neutral";
    return "neutral";
  }

  function renderSchedule(rows) {
    const tbody = document.querySelector("[data-course-rows]");
    if (!tbody) return;
    tbody.replaceChildren();

    rows.forEach((item) => {
      const tr = document.createElement("tr");
      const statusCell = document.createElement("td");
      const status = document.createElement("span");
      status.className = `course-status ${badgeClassForStatus(item.status)}`;
      status.textContent = item.status;
      statusCell.append(status);

      const courseCell = document.createElement("td");
      const courseTitle = document.createElement("strong");
      courseTitle.textContent = item.title;
      const courseId = document.createElement("span");
      courseId.className = "muted-block";
      courseId.textContent = item.id;
      courseCell.append(courseTitle, courseId);

      const assessmentCell = textCell(item.assessment);
      const cuCell = textCell(item.cus);
      const targetCell = textCell(item.target);
      const progressCell = document.createElement("td");
      progressCell.append(progressMeter(item.progress));
      const noteCell = textCell(item.note);

      tr.append(statusCell, courseCell, assessmentCell, cuCell, targetCell, progressCell, noteCell);
      tbody.append(tr);
    });
  }

  function textCell(value) {
    const td = document.createElement("td");
    td.textContent = value;
    return td;
  }

  function progressMeter(value) {
    const wrapper = document.createElement("div");
    wrapper.className = "progress-wrap";

    const label = document.createElement("span");
    label.className = "progress-label";
    label.textContent = `${value}%`;

    const meter = document.createElement("span");
    meter.className = "progress-meter";
    const fill = document.createElement("span");
    fill.style.width = `${Math.max(0, Math.min(100, Number(value) || 0))}%`;
    meter.append(fill);

    wrapper.append(meter, label);
    return wrapper;
  }

  function renderSuggestions(items) {
    const container = document.querySelector("[data-advisor-suggestions]");
    if (!container) return;
    container.replaceChildren();
    items.forEach((item, index) => {
      const div = document.createElement("div");
      div.className = "suggestion-item";
      const label = document.createElement("span");
      label.className = "suggestion-rank";
      label.textContent = String(index + 1);
      const text = document.createElement("span");
      text.textContent = item;
      div.append(label, text);
      container.append(div);
    });
  }

  function renderWeeklyPlan(items) {
    const list = document.querySelector("[data-weekly-plan]");
    if (!list) return;
    list.replaceChildren();
    items.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      list.append(li);
    });
  }

  function renderCallGuide(items) {
    const container = document.querySelector("[data-call-guide]");
    if (!container) return;
    container.replaceChildren();
    items.forEach((item) => {
      const box = document.createElement("div");
      box.className = "callout";
      const h3 = document.createElement("h3");
      h3.textContent = item.title;
      const p = document.createElement("p");
      p.textContent = item.text;
      box.append(h3, p);
      container.append(box);
    });
  }

  function applyCourseBadge(plan) {
    const badge = document.querySelector("[data-course-badge]");
    if (!badge) return;
    badge.textContent = plan.scheduleBadge;
    badge.classList.remove("success", "warning", "danger", "info", "neutral");
    badge.classList.add(plan.scheduleBadgeClass || "neutral");

    const termBadge = document.querySelector("[data-course-term-badge]");
    if (termBadge) {
      termBadge.textContent = plan.scheduleBadge;
      termBadge.classList.remove("success", "warning", "danger", "info", "neutral");
      termBadge.classList.add(plan.scheduleBadgeClass || "neutral");
    }
  }

  function renderPlan() {
    const context = getStudentContext();
    const plan = buildPlan(context);

    setText("[data-course-focus]", plan.focus);
    setText("[data-course-weekly-target]", plan.weeklyTarget);
    setText("[data-course-pacing]", plan.pacing);
    setText("[data-course-count]", plan.activeCount);
    setText("[data-course-next-move]", plan.nextMove);
    setText("[data-course-acceleration]", plan.acceleration);
    setText("[data-course-escalation]", plan.escalation);
    setText("[data-course-term-title]", plan.termTitle);

    applyCourseBadge(plan);
    renderSchedule(plan.rows);
    renderSuggestions(plan.suggestions);
    renderWeeklyPlan(plan.weeklyPlan);
    renderCallGuide(plan.callGuide);
  }

  async function init() {
    await loadStudentRecord();
    renderPlan();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
