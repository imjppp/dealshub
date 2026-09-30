/* ============================================================================
   DealsHub — renderer
   Reads window.DEAL_CATEGORIES from links.js and builds the card grid.
   Any link still containing the placeholder YOURTAG is treated as unfilled
   and hidden from the live site, so placeholder URLs never reach visitors.
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
  var grid = document.getElementById("dealGrid");
  var bar = document.getElementById("filterBar");
  var empty = document.getElementById("emptyMsg");
  var search = document.getElementById("searchInput");
  var countEl = document.getElementById("resultCount");
  var allBtn;

  var state = { cat: "", q: "" };

  /* Stars read better at a glance than a bare "4.7", so render both. */
  function buildRating(value) {
    var wrap = el("span", "rating");
    var full = Math.round(value);
    for (var i = 1; i <= 5; i++) {
      wrap.appendChild(el("span", i <= full ? "star on" : "star", "★"));
    }
    wrap.appendChild(el("span", "rating-num", value.toFixed(1)));
    return wrap;
  }

  function buildCard(item, cat) {
    var a = el("a", "card");
    a.href = item.url;
    a.target = "_blank";
    a.rel = "sponsored noopener noreferrer nofollow";

    var top = el("div", "card-top");
    top.appendChild(el("span", "card-ico", item.emoji || "🔗"));
    if (item.badge) top.appendChild(el("span", "badge", item.badge));
    a.appendChild(top);

    a.appendChild(el("h3", null, item.title || "Untitled deal"));
    if (item.note) a.appendChild(el("p", "note", item.note));

    if (item.rating) a.appendChild(buildRating(Number(item.rating)));

    var foot = el("div", "card-foot");
    var left = el("div", "foot-left");
    if (item.price) left.appendChild(el("span", "price", item.price));
    if (item.retailer) left.appendChild(el("span", "retailer", item.retailer));
    foot.appendChild(left);

    var go = el("span", "go");
    go.appendChild(el("span", null, "View deal →"));
    go.appendChild(el("span", "ext", "↗"));
    foot.appendChild(go);

    a.appendChild(foot);

    if (cat && cat.name) a.appendChild(el("div", "cat", cat.name));
    return a;
  }

  function matches(item, cat, q) {
    if (state.cat && cat.slug !== state.cat) return false;
    if (!q) return true;
    var hay = [item.title, item.note, item.retailer, item.badge, cat.name]
      .filter(Boolean).join(" ").toLowerCase();
    return hay.indexOf(q) !== -1;
  }

  function render() {
    grid.innerHTML = "";
    var shown = 0;
    var q = state.q.trim().toLowerCase();

    cats.forEach(function (cat) {
      (cat.items || []).forEach(function (item) {
        if (!isLive(item.url)) return;      // hide unfilled placeholders
        if (!matches(item, cat, q)) return;
        // Category footer is redundant when already filtered to one category.
        grid.appendChild(buildCard(item, state.cat ? null : cat));
        shown++;
      });
    });

    empty.hidden = shown !== 0;
    if (countEl) countEl.textContent = shown === 1 ? "1 deal" : shown + " deals";
  }

  function setActive(slug) {
    Array.prototype.forEach.call(bar.children, function (c) {
      c.classList.toggle("active", slug ? c.textContent === catName(slug) : c === allBtn);
    });
  }

  function buildFilters() {
    allBtn = el("button", "chip active", "All");
    allBtn.type = "button";
    allBtn.addEventListener("click", function () { state.cat = ""; setActive(""); render(); });
    bar.appendChild(allBtn);

    cats.forEach(function (cat) {
      var b = el("button", "chip", cat.name);
      b.type = "button";
      b.addEventListener("click", function () { state.cat = cat.slug; setActive(cat.slug); render(); });
      bar.appendChild(b);
    });
  }

  function catName(slug) {
    var hit = cats.filter(function (c) { return c.slug === slug; })[0];
    return hit ? hit.name : "";
  }

  /* ---------------------------------------------------------------- search */

  if (search) {
    search.addEventListener("input", function () { state.q = search.value; render(); });

    var clear = document.getElementById("searchClear");
    if (clear) {
      clear.addEventListener("click", function () {
        search.value = "";
        state.q = "";
        render();
        search.focus();
      });
    }

    // "/" focuses search, Escape clears it.
    document.addEventListener("keydown", function (e) {
      if (e.key === "/" && document.activeElement !== search) {
        e.preventDefault();
        search.focus();
      } else if (e.key === "Escape" && document.activeElement === search) {
        search.value = "";
        state.q = "";
        render();
      }
    });
  }

  /* ------------------------------------------------------------- top picks */

  /* Three highest-rated live items become the "Start here" cards. */
  function buildPicks() {
    var host = document.getElementById("picksGrid");
    if (!host) return;

    var all = [];
    cats.forEach(function (cat) {
      (cat.items || []).forEach(function (item) {
        if (isLive(item.url)) all.push({ item: item, cat: cat });
      });
    });

    all.sort(function (a, b) { return (b.item.rating || 0) - (a.item.rating || 0); });

    all.slice(0, 3).forEach(function (entry, i) {
      var it = entry.item;
      var a = el("a", "pick");
      a.href = it.url;
      a.target = "_blank";
      a.rel = "sponsored noopener noreferrer nofollow";

      a.appendChild(el("span", "pick-rank", "#" + (i + 1)));
      a.appendChild(el("span", "pick-ico", it.emoji || "🔗"));
      a.appendChild(el("h3", null, it.title || "Untitled deal"));
      if (it.note) a.appendChild(el("p", "pick-note", it.note));

      var f = el("div", "pick-foot");
      if (it.price) f.appendChild(el("span", "price", it.price));
      if (it.rating) f.appendChild(buildRating(Number(it.rating)));
      a.appendChild(f);

      host.appendChild(a);
    });
  }

  /* ----------------------------------------------------------------- stats */

  function buildStats() {
    var live = 0;
    cats.forEach(function (c) {
      (c.items || []).forEach(function (i) { if (isLive(i.url)) live++; });
    });
    var t = document.getElementById("statTotal");
    var c2 = document.getElementById("statCats");
    if (t) t.textContent = live;
    if (c2) c2.textContent = cats.length;
  }

  document.getElementById("yr").textContent = new Date().getFullYear();
  buildFilters();
  buildPicks();
  buildStats();
  render();
})();
