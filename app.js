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
  var allBtn;

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

    var foot = el("div", "card-top");
    if (item.price) foot.appendChild(el("span", "price", item.price));

    var go = el("span", "go");
    go.appendChild(el("span", null, "View deal →"));
    go.appendChild(el("span", "ext", "↗"));
    foot.appendChild(go);

    a.appendChild(foot);

    if (cat && cat.name) a.appendChild(el("div", "cat", cat.name));
    return a;
  }

  function render(filterSlug) {
    grid.innerHTML = "";
    var shown = 0;

    cats.forEach(function (cat) {
      if (filterSlug && cat.slug !== filterSlug) return;
      (cat.items || []).forEach(function (item) {
        if (!isLive(item.url)) return;   // hide unfilled placeholders
        grid.appendChild(buildCard(item, filterSlug ? null : cat));
        shown++;
      });
    });

    empty.hidden = shown !== 0;
  }

  function buildFilters() {
    allBtn = el("button", "chip active", "All");
    allBtn.type = "button";
    allBtn.addEventListener("click", function () { setActive(""); render(""); });
    bar.appendChild(allBtn);

    cats.forEach(function (cat) {
      var b = el("button", "chip", cat.name);
      b.type = "button";
      b.addEventListener("click", function () { setActive(cat.slug); render(cat.slug); });
      bar.appendChild(b);
    });

    function setActive(slug) {
      Array.prototype.forEach.call(bar.children, function (c) {
        c.classList.toggle("active", slug ? c.textContent === catName(slug) : c === allBtn);
      });
    }
  }

  function catName(slug) {
    var hit = cats.filter(function (c) { return c.slug === slug; })[0];
    return hit ? hit.name : "";
  }

  document.getElementById("yr").textContent = new Date().getFullYear();
  buildFilters();
  render("");
})();
