# Deploying DealsHub to Render

Static site, no build step, no server. Free tier works.

---

## Step 1 — Put it on GitHub

In a terminal, from the `DealsHub` folder:

```bash
cd DealsHub
git init
git add .
git commit -m "DealsHub affiliate site"
```

Then create an empty repo on github.com and push:

```bash
git remote add origin https://github.com/YOURNAME/dealshub.git
git branch -M main
git push -u origin main
```

(GitHub may ask for a personal access token instead of your password.)

---

## Step 2 — Create the Render site

1. Go to <https://dashboard.render.com> → **New +** → **Static Site**
2. Connect the GitHub repo you just pushed
3. Fill in:

| Field | Value |
|---|---|
| Name | `dealshub` (gives you `dealshub.onrender.com`) |
| Branch | `main` |
| Build Command | *leave empty* |
| Publish Path | `.` |
| Instance Type | Free |

4. **Create Static Site**

Render builds in ~10 seconds. Your site is live at
`https://dealshub.onrender.com`.

---

## Alternative: use render.yaml

The repo already contains `render.yaml`. In Render choose
**New → Blueprint** and point it at the repo — it reads the config and
creates the static site for you with the right settings.

---

## Step 3 — Adding your real affiliate links later

You do NOT need to redeploy to change links. Open
[`links.js`](links.js) in GitHub (or locally), edit it, and commit.

**Find-and-replace is your friend.** If your Amazon tag is `johnp-20`, open
`links.js` in GitHub's editor, press Ctrl+H, and:

```
find:    YOURTAG-20
replace: johnp-20
```

Commit. Render auto-redeploys in about a minute and your site is updated.

### How the placeholder-hiding works

`app.js` treats any URL still containing `YOURTAG`, `YOUR_ID`, or `XXXX`
as unfilled and **does not render it**. So if you deploy before adding real
links, visitors see a clean empty state rather than dead placeholder links.

Once you replace the tag, the card appears automatically. No other edits.

---

## Fields you can change per link

```js
{
  title: "Product name",                    // clickable text
  url:   "https://...?tag=yourtag-20",      // your affiliate link
  note:  "One honest line about it.",       // short description
  price: "$59.99",                          // optional, "" to hide
  badge: "BEST DEAL",                       // optional, "" to hide
  emoji: "🎧"                               // optional card icon
}
```

To add a whole new category, copy a `{ name, slug, blurb, items: [...] }`
block at the bottom of `links.js`. New filter chips appear automatically.

---

## Making it look like you (two quick changes)

**1. Your name on the page** — in `index.html`, replace
`DealsHub` in the `<title>`, the `.logo`, and the hero `<h1>`/`.sub`
with your own wording.

**2. Colours** — at the top of `style.css`, edit these three lines:

```css
--accent:   #6d8cff;   /* main colour  */
--accent-2: #b06dff;   /* gradient end */
--accent-3: #22d3ee;   /* highlight    */
```

---

## Legal / FTC

The site already carries a disclosure in the About section and footer, and
all outlinks use `rel="sponsored"`. The FTC's endorsement guides require a
clear, conspicuous disclosure — what is there is a reasonable starting
point, but if you promote heavily you may want it more prominent (e.g. also
directly under the hero, before the deals). Not legal advice.
