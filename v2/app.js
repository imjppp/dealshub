/* ============================================================================
   Dealbase (v2) — renderer
   Reads the SAME window.DEAL_CATEGORIES from ../links.js as v1, so adding a
   link updates both versions at once. Placeholder YOURTAG links are hidden.
   ========================================================================== */

(function () {
  "use strict";

  var PLACEHOLDER = /YOURTAG|YOUR[-_]?AFFILIATE[-_]?ID|YOUR_ID|XXXX/i;

  function isLive(url) {
    return typeof url === "string" && /^https?:\/\//i.test(url) && !PLACEHOLDER.test(url);
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  var cats = Array.isArray(window.DEAL_CATEGORIES) ? window.DEAL_CATEGORIES : [];
  var CFG  = window.SITE_CONFIG || { demoMode: false };
  var DEMO = CFG.demoMode === true;
  var grid = document.getElementById("dealGrid");
  var catGrid = document.getElementById("catGrid");
  var empty = document.getElementById("emptyMsg");
  var search = document.getElementById("searchInput");
  var sortSel = document.getElementById("sortSel");
  var afBar = document.getElementById("activeFilters");

  var state = { cat: "", q: "", sort: "featured" };

  /* Per-category emoji used on the category tiles. Falls back to the first
     item's emoji so a new category still looks intentional without edits. */
  function catEmoji(cat) {
    if (cat.emoji) return cat.emoji;
    var first = (cat.items || [])[0];
    return (first && first.emoji) || "📦";
  }

  function liveItems() {
    var out = [];
    cats.forEach(function (cat) {
      (cat.items || []).forEach(function (item) {
        if (isLive(item.url)) out.push({ item: item, cat: cat });
      });
    });
    return out;
  }

  function priceValue(str) {
    if (!str) return 0;
    var m = String(str).match(/([\d,]+(?:\.\d+)?)/);
    return m ? parseFloat(m[1].replace(/,/g, "")) : 0;
  }

  function buildRating(value) {
    var wrap = el("span", "rating");
    var full = Math.round(value);
    for (var i = 1; i <= 5; i++) {
      wrap.appendChild(el("span", i <= full ? "star on" : "star", "★"));
    }
    wrap.appendChild(el("span", "rating-num", value.toFixed(1)));
    return wrap;
  }

  function buildDeal(entry) {
    var it = entry.item;
    var a = el("a", "deal");
    a.href = it.url;
    a.target = "_blank";
    a.rel = "sponsored noopener noreferrer nofollow";

    var top = el("div", "deal-top");
    top.appendChild(el("span", "deal-ico", it.emoji || "🔗"));
    if (it.badge) top.appendChild(el("span", "tag", it.badge));
    a.appendChild(top);

    a.appendChild(el("h3", null, it.title || "Untitled deal"));
    if (it.note) a.appendChild(el("p", "note", it.note));
    if (it.rating) {
      var rw = buildRating(Number(it.rating));
      if (it.reviews) rw.appendChild(el("span", "review-count", "(" + it.reviews.toLocaleString() + ")"));
      a.appendChild(rw);
    }

    var foot = el("div", "deal-foot");
    var left = el("div", "foot-l");
    if (it.price) left.appendChild(el("span", "price", it.price));
    if (it.retailer) left.appendChild(el("span", "retailer", it.retailer));
    if (!it.price && !it.retailer) left.appendChild(el("span", "retailer", entry.cat.name));
    foot.appendChild(left);
    foot.appendChild(el("span", "deal-cta", "View deal ↗"));
    a.appendChild(foot);

    return a;
  }

  function sortEntries(list) {
    var s = state.sort;
    if (s === "price-asc") {
      return list.sort(function (a, b) { return priceValue(a.item.price) - priceValue(b.item.price); });
    }
    if (s === "price-desc") {
      return list.sort(function (a, b) { return priceValue(b.item.price) - priceValue(a.item.price); });
    }
    if (s === "rating") {
      return list.sort(function (a, b) { return (b.item.rating || 0) - (a.item.rating || 0); });
    }
    return list;  // featured = original hand-ordered order
  }

  function render() {
    var q = state.q.trim().toLowerCase();

    var list = liveItems().filter(function (e) {
      if (state.cat && e.cat.slug !== state.cat) return false;
      if (!q) return true;
      var hay = [e.item.title, e.item.note, e.item.retailer, e.item.badge, e.cat.name]
        .filter(Boolean).join(" ").toLowerCase();
      return hay.indexOf(q) !== -1;
    });

    list = sortEntries(list);

    grid.innerHTML = "";
    list.forEach(function (e) { grid.appendChild(buildDeal(e)); });

    empty.hidden = list.length !== 0;
    var rc = document.getElementById("resultCount");
    if (rc) rc.textContent = list.length === 1 ? "1 deal" : list.length + " deals";

    // placeholder in the search input reflects the real total
    if (search && search.tagName === "INPUT") {
      search.placeholder = "Search " + liveItems().length + " deals…";
    }

    renderActiveFilters();
    highlightCatCards();
  }

  function renderActiveFilters() {
    if (!afBar) return;
    afBar.innerHTML = "";
    var chips = [];

    if (state.cat) {
      var c = cats.filter(function (x) { return x.slug === state.cat; })[0];
      if (c) chips.push({ label: c.name, clear: function () { state.cat = ""; } });
    }
    if (state.q.trim()) {
      chips.push({ label: '“' + state.q.trim() + '”', clear: function () { state.q = ""; search.value = ""; } });
    }

    afBar.hidden = chips.length === 0;
    chips.forEach(function (chip) {
      var p = el("span", "af-pill");
      p.appendChild(el("span", null, chip.label));
      var x = el("button", "af-clear", "×");
      x.type = "button";
      x.setAttribute("aria-label", "Remove filter " + chip.label);
      x.addEventListener("click", function () { chip.clear(); render(); });
      p.appendChild(x);
      afBar.appendChild(p);
    });
  }

  function highlightCatCards() {
    if (!catGrid) return;
    Array.prototype.forEach.call(catGrid.children, function (c) {
      c.classList.toggle("active", c.getAttribute("data-slug") === state.cat);
    });
  }

  function buildCategoryCards() {
    if (!catGrid) return;
    cats.forEach(function (cat) {
      var n = (cat.items || []).filter(function (i) { return isLive(i.url); }).length;

      var b = el("button", "cat");
      b.type = "button";
      b.setAttribute("data-slug", cat.slug);
      b.appendChild(el("span", "cat-ico", catEmoji(cat)));
      b.appendChild(el("h3", null, cat.name));
      b.appendChild(el("p", null, n === 1 ? "1 deal" : n + " deals"));
      b.addEventListener("click", function () {
        state.cat = state.cat === cat.slug ? "" : cat.slug;   // toggle
        render();
      });
      catGrid.appendChild(b);
    });
  }

  function buildStats() {
    var live = liveItems().length;
    var d = document.getElementById("hpDeals");
    var c = document.getElementById("hpCats");
    if (d) d.textContent = live;
    if (c) c.textContent = cats.length;
  }

  /* ------------------------------------------------------------- controls */

  if (search) {
    search.addEventListener("input", function () { state.q = search.value; render(); });
    var clear = document.getElementById("searchClear");
    if (clear) {
      clear.addEventListener("click", function () {
        search.value = ""; state.q = ""; render(); search.focus();
      });
    }
  }

  if (sortSel) {
    sortSel.addEventListener("change", function () { state.sort = sortSel.value; render(); });
  }

  var resetBtn = document.getElementById("resetBtn");
  if (resetBtn) {
    resetBtn.addEventListener("click", function () {
      state.cat = ""; state.q = "";
      if (search) search.value = "";
      render();
    });
  }

  document.addEventListener("keydown", function (e) {
    if (e.key === "/" && document.activeElement !== search && search) {
      e.preventDefault();
      search.focus();
    } else if (e.key === "Escape" && document.activeElement === search) {
      search.value = ""; state.q = ""; render();
    }
  });

  /* ===================================================================
     SOCIAL PROOF — demo mode only. Removed from the DOM entirely when
     demoMode is false. See the warning at the top of links.js.
     =================================================================== */

  function fmt(n) { return Number(n || 0).toLocaleString(); }

  function buildProof() {
    var p = CFG.proof || {};
    var row = document.getElementById("trustRow");
    var rv = document.getElementById("reviews");

    if (!DEMO) {
      [row, rv, document.getElementById("demoBanner")].forEach(function (n) {
        if (n && n.parentNode) n.parentNode.removeChild(n);
      });
      return;
    }

    var b = document.getElementById("demoBanner");
    if (b) b.hidden = false;

    var set = function (id, v) { var n = document.getElementById(id); if (n) n.textContent = v; };
    set("pfReaders", fmt(p.readers));
    set("pfClicks", fmt(p.clicks));
    set("pfSaved", fmt(p.saved));
    set("pfRating", Number(p.rating || 0).toFixed(1));
    set("pfReviewCount", fmt(p.reviewCount) + " reviews");
    if (row) row.hidden = false;

    if (rv) {
      set("rvScore", Number(p.rating || 0).toFixed(1));
      set("rvCount", "from " + fmt(p.reviewCount) + " reviews");
      set("trustLine", p.trustLine || "");

      var st = document.getElementById("rvStars");
      if (st) {
        st.textContent = "";
        var full = Math.round(Number(p.rating || 0));
        for (var i = 1; i <= 5; i++) {
          var sp = document.createElement("span");
          sp.textContent = i <= full ? "★" : "☆";
          if (i > full) sp.style.opacity = ".35";
          st.appendChild(sp);
        }
      }

      var host = document.getElementById("reviewsGrid");
      var list = Array.isArray(CFG.testimonials) ? CFG.testimonials : [];
      list.forEach(function (t) {
        var card = el("div", "review");
        var stars = el("div", "r-stars");
        for (var i2 = 1; i2 <= 5; i2++) stars.textContent += i2 <= (t.stars || 5) ? "★" : "☆";
        card.appendChild(stars);
        card.appendChild(el("p", "r-text", t.text || ""));
        var who = el("div", "r-who");
        who.appendChild(el("span", "r-ava", (t.name || "?").charAt(0).toUpperCase()));
        var meta = el("div");
        meta.appendChild(el("div", "r-name", t.name || "Anonymous"));
        meta.appendChild(el("div", "r-role", t.role || ""));
        who.appendChild(meta);
        card.appendChild(who);
        host.appendChild(card);
      });

      rv.hidden = false;
    }
  }

  document.getElementById("yr").textContent = new Date().getFullYear();
  buildProof();
  buildCategoryCards();
  buildStats();
  render();
})();
