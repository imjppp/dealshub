/* ============================================================================
 *  analytics.js — PostHog loader
 *  Reads window.POSTHOG_KEY / POSTHOG_HOST / ENABLE_POSTHOG from ph.js.
 *  Adds a few demo events on top of the automatic pageview capture:
 *    deal_filter  — a category chip was clicked
 *    deal_search  — the search box was used
 *    deal_click   — an affiliate card was clicked (the one that matters)
 *    cta_click    — a hero/nav call-to-action
 *  Nothing loads at all when ENABLE_POSTHOG is false.
 * ========================================================================== */

(function () {
  "use strict";

  if (window.ENABLE_POSTHOG === false) return;

  var KEY = window.POSTHOG_KEY;
  var HOST = window.POSTHOG_HOST;
  if (!KEY || !HOST) return;

  /* ---------------------------------------------------------- loader stub */

  /* Minimal queue stub. It only records init() calls; the real SDK replaces it
     when array.js finishes loading. Note the earlier failure mode: a stub that
     enumerates a hand-picked list of method names silently no-ops anything it
     omits, so captures never flush. Keeping this to just `init` + the queue
     and letting the vendor script do the rest avoids that. */
  if (!window.posthog) {
    window.posthog = [];
    window.posthog._i = [];
    window.posthog.init = function (i, s, a) { window.posthog._i.push([i, s, a]); };
  }

  (function () {
    var s = document.createElement("script");
    s.type = "text/javascript";
    s.async = true;
    s.crossOrigin = "anonymous";
    s.src = HOST.replace(".i.posthog.com", "-assets.i.posthog.com") + "/static/array.js";
    s.onerror = function () { /* analytics must never break the page */ };
    var first = document.getElementsByTagName("script")[0];
    if (first && first.parentNode) first.parentNode.insertBefore(s, first);
    else document.head.appendChild(s);
  })();

  /* ------------------------------------------------------------- initialise */

  // Works whether or not array.js has landed yet: the stub above records the
  // call and the vendor SDK replays the queue when it boots.
  window.posthog.init(KEY, {
    api_host: HOST,
    defaults: "2026-05-30",
    person_profiles: "always"
  });

  /* ------------------------------------------------------- demo events */

  function onReady(fn) {
    /* Ready when the vendor SDK has actually booted. Do NOT gate on
       posthog._loaded — it stays 0 even in a fully working session, so
       checking it would silently drop every custom event. The reliable
       signals are: the stub has been replaced (__loaded) and init() ran. */
    var attempts = 0;
    var iv = setInterval(function () {
      attempts++;
      var ph = window.posthog;
      var ready = ph && ph.__loaded && typeof ph.capture === "function" &&
                   typeof ph._send_request === "function";
      if (ready) { clearInterval(iv); fn(); return; }
      if (attempts > 100) {                   // ~10s cap
        clearInterval(iv);
        try { fn(); } catch (e) {}            // still try; never break the page
      }
    }, 100);
  }

  function safe(fn) {
    onReady(function () { try { fn(); } catch (e) { /* never break the page */ } });
  }

  document.addEventListener("click", function (e) {
    var el = e.target;
    if (!el || !el.closest) return;

    var deal = el.closest(".card, .deal, .pick");
    if (deal) {
      safe(function () {
        posthog.capture("deal_click", {
          title: (deal.querySelector("h3") || {}).textContent || "unknown",
          badge: (deal.querySelector(".badge, .tag") || {}).textContent || "",
          price: (deal.querySelector(".price") || {}).textContent || ""
        });
      });
      return;
    }

    var chip = el.closest(".chip, .cat");
    if (chip) {
      safe(function () { posthog.capture("deal_filter", { filter: chip.textContent.trim() }); });
      return;
    }

    var cta = el.closest(".btn, .cta-band a, .deal-cta");
    if (cta) {
      safe(function () { posthog.capture("cta_click", { label: cta.textContent.trim().slice(0, 40) }); });
    }
  }, true);

  var si = document.getElementById("searchInput");
  if (si) {
    var t = null;
    si.addEventListener("input", function () {
      clearTimeout(t);
      var v = si.value;
      t = setTimeout(function () {
        if (!v) return;
        safe(function () { posthog.capture("deal_search", { query: v }); });
      }, 700);
    });
  }
})();
