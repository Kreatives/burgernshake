/* ============================================================
   Franchisecheck — meerstaps-formulier + trackingvelden
   - Vult verborgen UTM/landing/submitted_at velden
   - Stuurt (indien ingesteld) een JSON-payload naar de Make-webhook
   - Beide formulieren houden elk antwoord als los veld (field key = name)
   ============================================================ */
(function () {
  "use strict";

  /* Verborgen trackingvelden vullen op alle formulieren. */
  function populateTracking() {
    var params = new URLSearchParams(window.location.search);
    var landing = window.location.href.split("#")[0];
    document.querySelectorAll("input[data-track]").forEach(function (el) {
      if (el.value) return;
      var key = el.getAttribute("data-track");
      if (key === "landing_page") { el.value = landing; return; }
      if (key === "submitted_at") return; // pas bij inzending
      if (key === "lead_source") {
        el.value = params.get("lead_source") || params.get("utm_source") || "website";
        return;
      }
      el.value = params.get(key) || "";
    });
  }

  function stampSubmittedAt(form) {
    var el = form.querySelector('input[data-track="submitted_at"]');
    if (el) el.value = new Date().toISOString();
  }

  /* Elk veld los als key-value; meerkeuzevelden (brand_interest) als array. */
  function buildPayload(form) {
    var data = new FormData(form);
    var out = {};
    data.forEach(function (value, key) {
      if (Object.prototype.hasOwnProperty.call(out, key)) {
        out[key] = [].concat(out[key], value);
      } else {
        out[key] = value;
      }
    });
    return out;
  }

  function sendToWebhook(form) {
    var url = form.getAttribute("data-webhook");
    if (!url) return;
    try {
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload(form)),
        keepalive: true,
      }).catch(function () {});
    } catch (e) { /* stil falen: UX niet blokkeren */ }
  }

  /* Stamp + webhook voor losse data-webhook formulieren (bv. brochure).
     De wizard regelt dit zelf, dus die slaan we hier over. */
  function wireWebhookForms() {
    document.querySelectorAll("form[data-webhook]:not([data-check-form])").forEach(function (form) {
      form.addEventListener("submit", function () {
        if (!form.checkValidity()) return;
        stampSubmittedAt(form);
        sendToWebhook(form);
      }, true);
    });
  }

  /* De meerstaps-Franchisecheck. */
  function initWizard() {
    var form = document.querySelector("[data-check-form]");
    if (!form) return;

    var steps = Array.prototype.slice.call(form.querySelectorAll("[data-step]"));
    var total = steps.length;
    var fill = form.querySelector("[data-fill]");
    var curEl = form.querySelector("[data-current]");
    var totalEl = form.querySelector("[data-total]");
    var pctEl = form.querySelector("[data-pct]");
    var prevBtn = form.querySelector("[data-prev]");
    var nextBtn = form.querySelector("[data-next]");
    var submitBtn = form.querySelector("[data-submit]");
    var okBox = form.querySelector(".fcheck__ok");
    var topBar = form.querySelector(".fcheck__top");
    var stepsWrap = form.querySelector(".fcheck__steps");
    var navBar = form.querySelector(".fcheck__nav");
    var index = 0;

    if (totalEl) totalEl.textContent = total;

    function render() {
      steps.forEach(function (s, i) { s.classList.toggle("is-active", i === index); });
      var pct = Math.round(((index + 1) / total) * 100);
      if (fill) fill.style.width = pct + "%";
      if (curEl) curEl.textContent = index + 1;
      if (pctEl) pctEl.textContent = pct + "%";
      prevBtn.hidden = index === 0;
      nextBtn.hidden = index === total - 1;
      submitBtn.hidden = index !== total - 1;
    }

    function markInvalid(el) {
      var q = el.closest(".fquestion") || el.closest(".field");
      if (q) q.classList.add("is-invalid");
    }

    function validateStep(step) {
      step.querySelectorAll(".is-invalid").forEach(function (el) { el.classList.remove("is-invalid"); });
      var firstInvalid = null;

      step.querySelectorAll("input:not([type=radio]):not([type=checkbox]), select, textarea").forEach(function (el) {
        if (!el.checkValidity()) {
          markInvalid(el);
          if (!firstInvalid) firstInvalid = el;
        }
      });

      var seen = {};
      step.querySelectorAll("input[type=radio]").forEach(function (r) {
        if (seen[r.name]) return;
        seen[r.name] = true;
        var group = step.querySelectorAll('input[name="' + r.name + '"]');
        var required = Array.prototype.some.call(group, function (g) { return g.required; });
        var checked = Array.prototype.some.call(group, function (g) { return g.checked; });
        if (required && !checked) {
          markInvalid(group[0]);
          if (!firstInvalid) firstInvalid = group[0];
        }
      });

      step.querySelectorAll("[data-require-one]").forEach(function (groupEl) {
        var boxes = groupEl.querySelectorAll('input[type=checkbox]');
        var any = Array.prototype.some.call(boxes, function (b) { return b.checked; });
        if (!any) {
          groupEl.classList.add("is-invalid");
          if (!firstInvalid) firstInvalid = boxes[0];
        }
      });

      if (firstInvalid) {
        var target = firstInvalid.closest(".fquestion") || firstInvalid.closest(".field") || firstInvalid;
        target.scrollIntoView({ behavior: "smooth", block: "center" });
        try { firstInvalid.focus({ preventScroll: true }); } catch (e) { try { firstInvalid.focus(); } catch (e2) {} }
        return false;
      }
      return true;
    }

    function goTo(i) {
      index = Math.max(0, Math.min(total - 1, i));
      render();
      if (topBar) topBar.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    nextBtn.addEventListener("click", function () {
      if (validateStep(steps[index])) goTo(index + 1);
    });
    prevBtn.addEventListener("click", function () { goTo(index - 1); });

    form.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && e.target.tagName !== "TEXTAREA" && index < total - 1) {
        e.preventDefault();
        if (validateStep(steps[index])) goTo(index + 1);
      }
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!validateStep(steps[index])) return;
      stampSubmittedAt(form);
      sendToWebhook(form);
      form.querySelectorAll("input, select, textarea, button").forEach(function (el) { el.disabled = true; });
      if (topBar) topBar.hidden = true;
      if (stepsWrap) stepsWrap.hidden = true;
      if (navBar) navBar.hidden = true;
      if (okBox) {
        okBox.hidden = false;
        okBox.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      if (window.dataLayer) window.dataLayer.push({ event: "franchise_check_submit" });
    });

    render();
  }

  function start() {
    populateTracking();
    wireWebhookForms();
    initWizard();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
