# Dealbase / DealsHub — affiliate showcase

Two versions of the same affiliate link site. They **share one data file**,
so you edit your links in exactly one place and both versions update.

| Version | URL | Style |
|---|---|---|
| v1 | `https://imjppp.github.io/dealshub/` | Dark, gradient, card grid |
| v2 | `https://imjppp.github.io/dealshub/v2/` | Light, airy, cal.com-inspired |

## Adding your affiliate links

**Edit `links.js` only.** Both versions read it.

1. Open `links.js`
2. Find-and-replace `YOURTAG-20` → your real affiliate tag
3. Commit. GitHub Pages rebuilds in about a minute.

Anything still containing `YOURTAG` is **hidden automatically** on the live
site, so you can deploy before your links are ready — visitors never see a
dead link.

### Item fields

```js
{
  title:    "Product name",              // required
  url:      "https://...?tag=YOURTAG-20", // required — your affiliate link
  note:     "One honest line about it.",
  price:    "$59.99",                     // optional, "" to hide
  badge:    "BEST DEAL",                  // optional, "" to hide
  emoji:    "🎧",                         // optional card icon
  rating:   4.5,                          // optional, 0-5
  retailer: "Amazon"                      // optional
}
```

### Adding a category

Append a new block to the array in `links.js`:

```js
,{
  name: "Category Name",
  slug: "category-name",
  blurb: "One line about this category.",
  items: [ { title: "...", url: "...", note: "...", price: "$9.99" } ]
}
```

New filter chips and category tiles appear automatically in both versions.
No other edits needed.

## Deploying

Already live via GitHub Pages. To redeploy: push to `main`.

Settings > Pages > Source: **Deploy from a branch** → `main` / `/ (root)`.

Note: the repo must be **public** — GitHub Pages on private repos requires a
paid plan.

## Files

```
index.html      v1 page
style.css       v1 styles
app.js          v1 renderer
v2/index.html   v2 page (cal.com-style)
v2/style.css    v2 styles
v2/app.js       v2 renderer
links.js        ← YOUR LINKS (shared by both versions)
render.yaml     Render config (if you'd rather host there)
DEPLOY.md       Render/hosting notes
```

## Legal

Affiliate disclosure is included in both footers. The FTC endorsement
guides require a clear, conspicuous disclosure — what's here is a reasonable
baseline, not legal advice.
