/* ============================================================================
 *  DEALSHUB — YOUR AFFILIATE LINKS LIVE HERE.
 *  This is the ONLY file you need to edit to add/remove links.
 *
 *  HOW TO ADD A LINK
 *  -----------------
 *  1. Copy one of the item blocks below.
 *  2. Paste your real affiliate URL into "url" (keep the ?tag=YOURTAG part!).
 *  3. Change title / note / price / badge to whatever you want to advertise.
 *  4. Put it under the category you want. Add a NEW category by adding a new
 *     { "name": ... } block to the list below — new filter chips appear by
 *     themselves, no other edits needed.
 *
 *  FIELD GUIDE
 *  -----------
 *  title  - the clickable name of the product/deal          (required)
 *  url    - where it goes. Use your affiliate link.         (required)
 *  note   - one short line, why it's worth it. Keep it honest.
 *  price  - the price string, e.g. "$59.99" or "from $9". Optional, "" to hide.
 *  badge  - small corner tag, e.g. "BEST DEAL", "NEW", "POPULAR". Optional.
 *  emoji  - a single emoji used as the card icon. Optional.
 *  rating - star rating out of 5, e.g. 4.5. Optional, "" to hide.
 *  retailer - store name shown on the card, e.g. "Amazon". Optional.
 *
 *  ⚠ PLACEHOLDER LINKS ARE HIDDEN AUTOMATICALLY.
 *    Any url still containing YOURTAG, YOUR_ID or XXXX is NOT rendered on the
 *    live site. So you can safely leave the examples below in place while you
 *    swap in your real links — visitors never see a dead link.
 * ========================================================================== */

/* ============================================================================
 *  SITE CONFIG — demo mode switch
 * ============================================================================
 *  ⚠ READ THIS BEFORE SHARING THE LINK WITH ANYONE.
 *
 *  demoMode: true   → the site shows EXAMPLE SOCIAL PROOF (review counts,
 *                     testimonials, "1,200+ readers"). Those numbers are
 *                     INVENTED EXAMPLES, not real people. A red banner shows
 *                     on the site so you cannot forget they are fake.
 *
 *  demoMode: false  → all social-proof blocks are REMOVED from the page
 *                     entirely (not zeroed — not rendered at all). Put your
 *                     real numbers in SITE_CONFIG.proof if you have any.
 *
 *  ⚠ THIS IS A DEMO. The reviews, reader counts and star ratings are invented
 *    example data, and the affiliate tag is a fake one. It is not a real site
 *    and the links do not earn anything.
 *
 *    If you ever reuse this template for a REAL site that other people rely on
 *    to buy something, set demoMode to false first. Publishing invented reviews
 *    or fake review counts as if they were real is deceptive advertising and
 *    breaks the FTC Endorsement Guides.
 * ========================================================================== */

window.SITE_CONFIG = {
  demoMode: true,

  /* Shown in the footer + tab title. Change to your own name/brand. */
  siteName: "Dealbase",
  tagline:  "Every deal here is one I would buy myself.",

  /* Only used when demoMode is true. */
  proof: {
    readers:      1240,     // "joined by X readers"
    clicks:       3860,     // "X link clicks"
    saved:        512,      // "X marked as bought"
    rating:       4.8,      // average site rating
    reviewCount:  96,       // number of reviews behind that rating
    trustLine:    "No pay-to-play placement. Ever."
  },

  /* Example testimonials — ONLY rendered while demoMode is true. */
  testimonials: [
    { name: "Ryan K.",  role: "PC build, 2026",     stars: 5,
      text: "Bought the monitor off this list three weeks ago. First time I've not had to return anything. The notes actually tell you what to avoid." },
    { name: "Aoife M.", role: "Console side",        stars: 5,
      text: "Saved me about €40 by telling me the handheld I wanted was a bad buy for the price. Didn't even know that was a thing." },
    { name: "Danny P.", role: "Streaming setup",     stars: 4,
      text: "Filter by category is genuinely useful. Found the mic in ten seconds instead of twenty minutes of tabs." },
    { name: "Jess R.",  role: "Casual buyer",        stars: 5,
      text: "Was expecting a scam page. It's just links and honest notes. Appreciated that it says prices can be stale." }
  ]
};

window.DEAL_CATEGORIES = [

  /* ---------------------------------------------------------------------
   *  CATEGORY 1 — the big one
   * ------------------------------------------------------------------- */
  {
    name: "PC & Gaming Setups",
    slug: "pc-gaming",
    blurb: "Everything you need to actually play the game properly.",
    items: [
      {
        title: "1440p 165Hz Gaming Monitor",
        url: "https://www.amazon.com/dp/B0CCPVQ5B6/ref=nosim?tag=hermesdemo-20",
        note: "The single biggest upgrade for input feel. 165Hz is the sweet spot.",
        price: "$249.99",
        badge: "BEST DEAL",
        emoji: "🖥️",
        rating: 4.7,
        retailer: "Amazon",
        reviews: 1284
      },
      {
        title: "27\" 1440p IPS — Best Value Pick",
        url: "https://www.amazon.com/s?k=27+1440p+monitor&tag=hermesdemo-20",
        note: "Half the price of the above for 95% of the benefit. Start here.",
        price: "$179.00",
        badge: "BEST VALUE",
        emoji: "🖥️",
        rating: 4.5,
        retailer: "Amazon",
        reviews: 643
      },
      {
        title: "Mechanical Keyboard (Hot-Swappable)",
        url: "https://www.amazon.com/s?k=mechanical+keyboard&tag=hermesdemo-20",
        note: "Tactile switches, no solder needed when you want to change them.",
        price: "$89.00",
        badge: "",
        emoji: "⌨️",
        rating: 4.6,
        retailer: "Amazon",
        reviews: 2210
      },
      {
        title: "Lightweight Wireless Mouse",
        url: "https://www.amazon.com/s?k=wireless+gaming+mouse&tag=hermesdemo-20",
        note: "Under 60g. Your arm will thank you during a long session.",
        price: "$42.95",
        badge: "POPULAR",
        emoji: "🖱️",
        rating: 4.4,
        retailer: "Amazon",
        reviews: 1893
      },
      {
        title: "7200 RPM NVMe SSD — 1TB",
        url: "https://www.amazon.com/s?k=nvme+ssd+1tb&tag=hermesdemo-20",
        note: "Load times go from 'wait' to 'already there'.",
        price: "$64.99",
        badge: "",
        emoji: "⚡",
        rating: 4.8,
        retailer: "Amazon",
        reviews: 5402
      },
      {
        title: "Gaming Headset (Wireless)",
        url: "https://www.amazon.com/s?k=wireless+gaming+headset&tag=hermesdemo-20",
        note: "Check the mic reviews — that is what separates the cheap ones.",
        price: "$79.99",
        badge: "",
        emoji: "🎧",
        rating: 4.3,
        retailer: "Amazon",
        reviews: 976
      }
    ]
  },

  /* ---------------------------------------------------------------------
   *  CATEGORY 2
   * ------------------------------------------------------------------- */
  {
    name: "Consoles & Handhelds",
    slug: "consoles",
    blurb: "Handhelds, subscriptions, and the console your friends all have.",
    items: [
      {
        title: "Xbox Game Pass Ultimate (12 months)",
        url: "https://www.amazon.com/s?k=xbox+game+pass&tag=hermesdemo-20",
        note: "Hundreds of games plus day-one releases. Best value if you buy more than one game a month.",
        price: "$19.99/mo",
        badge: "POPULAR",
        emoji: "🎮",
        rating: 4.7,
        retailer: "Amazon",
        reviews: 3104
      },
      {
        title: "Steam Gift Card (from)",
        url: "https://www.amazon.com/s?k=steam+gift+card&tag=hermesdemo-20",
        note: "Use it for the one game that's never on sale.",
        price: "from $9.50",
        badge: "",
        emoji: "🎫",
        rating: 4.5,
        retailer: "Amazon",
        reviews: 1547
      },
      {
        title: "Handheld Gaming PC",
        url: "https://www.amazon.com/s?k=handheld+gaming+pc&tag=hermesdemo-20",
        note: "PC library on the couch. Check battery reviews, they vary wildly.",
        price: "$499.00",
        badge: "",
        emoji: "🕹️",
        rating: 4.0,
        retailer: "Amazon",
        reviews: 388
      },
      {
        title: "Elgato Stream Deck (Mini)",
        url: "https://www.amazon.com/s?k=elgato+stream+deck+mini&tag=hermesdemo-20",
        note: "Fifteen buttons that do whatever you tell them. Great for macros.",
        price: "$59.99",
        badge: "",
        emoji: "🎛️",
        rating: 4.6,
        retailer: "Amazon",
        reviews: 741
      }
    ]
  },

  /* ---------------------------------------------------------------------
   *  CATEGORY 3
   * ------------------------------------------------------------------- */
  {
    name: "Desk Setup & Comfort",
    slug: "desk",
    blurb: "Small upgrades that stop the back pain.",
    items: [
      {
        title: "Desk Mat (Large)",
        url: "https://www.amazon.com/s?k=desk+mat&tag=hermesdemo-20",
        note: "Protects the desk, stops the mouse catching on the edge.",
        price: "$19.99",
        badge: "",
        emoji: "🖇️",
        rating: 4.2,
        retailer: "Amazon",
        reviews: 1120
      },
      {
        title: "Monitor Arm — Single",
        url: "https://www.amazon.com/s?k=monitor+arm&tag=hermesdemo-20",
        note: "Frees desk space and puts the screen at eye level.",
        price: "$34.99",
        badge: "",
        emoji: "🦾",
        rating: 4.4,
        retailer: "Amazon",
        reviews: 803
      },
      {
        title: "USB-C Hub 8-in-1",
        url: "https://www.amazon.com/s?k=usb+c+hub&tag=hermesdemo-20",
        note: "One cable for monitor, keyboard, drive and charging.",
        price: "$27.50",
        badge: "",
        emoji: "🔌",
        rating: 4.1,
        retailer: "Amazon",
        reviews: 1590
      },
      {
        title: "Desk Chair — Mesh Back",
        url: "https://www.amazon.com/s?k=ergonomic+desk+chair&tag=hermesdemo-20",
        note: "The one upgrade that shows up in how you feel every single day.",
        price: "$189.00",
        badge: "LIFE CHANGER",
        emoji: "🪑",
        rating: 4.5,
        retailer: "Amazon",
        reviews: 654
      }
    ]
  },

  /* ---------------------------------------------------------------------
   *  CATEGORY 4 — new; proof that adding a category needs no other edits
   * ------------------------------------------------------------------- */
  {
    name: "Networking & Streaming",
    slug: "streaming",
    blurb: "Stop the buffering. Fix the lag spikes.",
    items: [
      {
        title: "Wi-Fi 6E Mesh Router",
        url: "https://www.amazon.com/s?k=mesh+wifi+6e+router&tag=hermesdemo-20",
        note: "One of the few things that visibly fixes lag spikes in the same room.",
        price: "$149.00",
        badge: "",
        emoji: "📶",
        rating: 4.4,
        retailer: "Amazon",
        reviews: 500
      },
      {
        title: "1080p Webcam (Auto-Framing)",
        url: "https://www.amazon.com/s?k=auto+framing+webcam&tag=hermesdemo-20",
        note: "Follows your face so you stay in frame when you move.",
        price: "$69.99",
        badge: "NEW",
        emoji: "📷",
        rating: 4.2,
        retailer: "Amazon",
        reviews: 500
      },
      {
        title: "Microphone (USB, Cardioid)",
        url: "https://www.amazon.com/s?k=usb+cardioid+microphone&tag=hermesdemo-20",
        note: "Sounds dramatically better than your headset mic for very little.",
        price: "$54.00",
        badge: "",
        emoji: "🎤",
        rating: 4.5,
        retailer: "Amazon",
        reviews: 500
      }
    ]
  }

  /* ---------------------------------------------------------------------
   *  ADD MORE CATEGORIES BELOW THIS LINE — COPY THE FORMAT
   *
   *  ,{
   *    name: "Category Name",
   *    slug: "category-name",
   *    blurb: "One line about this category.",
   *    items: [
   *      { title: "Product", url: "https://...?tag=hermesdemo-20", note: "Why.", price: "$9.99", badge: "", emoji: "🎁", rating: 4.5, retailer: "Amazon",
        reviews: 500 }
   *    ]
   *  }
   * ------------------------------------------------------------------- */
];
