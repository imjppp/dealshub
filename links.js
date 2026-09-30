/* ============================================================================
 *  DEALSHUB — YOUR AFFILIATE LINKS LIVE HERE.
 *  This is the ONLY file you need to edit to add/remove links.
 *
 *  HOW TO ADD A LINK
 *  -----------------
 *  1. Copy one of the blocks below.
 *  2. Paste your real affiliate URL into "url" (keep the ?tag=YOURTAG part!).
 *  3. Change title / note / price / badge to whatever you want to advertise.
 *  4. Put it under the category you want. You can also add a NEW category by
 *     adding a new { "name": ... } block to the categories list below.
 *
 *  FIELD GUIDE
 *  -----------
 *  title  - the clickable name of the product/deal          (required)
 *  url    - where it goes. Use your affiliate link.         (required)
 *  note   - one short line, why it's worth it. Keep it honest.
 *  price  - the price string, e.g. "$59.99" or "from $9". Optional, leave "" to hide.
 *  badge  - small corner tag, e.g. "BEST DEAL", "NEW", "POPULAR". Optional.
 *  emoji  - a single emoji used as the card icon. Optional.
 * ========================================================================== */

window.DEAL_CATEGORIES = [

  /* ---------------------------------------------------------------------
   *  CATEGORY 1
   * ------------------------------------------------------------------- */
  {
    name: "PC & Gaming Setups",
    slug: "pc-gaming",
    blurb: "Everything you need to actually play the game properly.",
    items: [
      {
        title: "1440p 165Hz Gaming Monitor",
        url: "https://www.amazon.com/dp/B0CCPVQ5B6?tag=YOURTAG-20",
        note: "The single biggest upgrade for input feel. 165Hz is the sweet spot.",
        price: "$249.99",
        badge: "BEST DEAL",
        emoji: "🖥️"
      },
      {
        title: "Mechanical Keyboard (Hot-Swappable)",
        url: "https://www.amazon.com/s?k=mechanical+keyboard&tag=YOURTAG-20",
        note: "Tactile switches, no solder needed when you want to change them.",
        price: "$89.00",
        badge: "",
        emoji: "⌨️"
      },
      {
        title: "Lightweight Wireless Mouse",
        url: "https://www.amazon.com/s?k=wireless+gaming+mouse&tag=YOURTAG-20",
        note: "Under 60g. Your arm will thank you during a long session.",
        price: "$42.95",
        badge: "POPULAR",
        emoji: "🖱️"
      },
      {
        title: "7200 RPM SSD — 1TB",
        url: "https://www.amazon.com/s?k=nvme+ssd+1tb&tag=YOURTAG-20",
        note: "Load times go from 'wait' to 'already there'.",
        price: "$64.99",
        badge: "",
        emoji: "⚡"
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
        url: "https://www.amazon.com/s?k=xbox+game+pass&tag=YOURTAG-20",
        note: "Hundreds of games plus the day-one releases. Best value if you buy more than one game a month.",
        price: "$19.99/mo",
        badge: "POPULAR",
        emoji: "🎮"
      },
      {
        title: "Steam Gift Card (from)",
        url: "https://www.amazon.com/s?k=steam+gift+card&tag=YOURTAG-20",
        note: "Use it for the one game that's never on sale.",
        price: "from $9.50",
        badge: "",
        emoji: "🎫"
      },
      {
        title: "Handheld Gaming PC",
        url: "https://www.amazon.com/s?k=handheld+gaming+pc&tag=YOURTAG-20",
        note: "PC library on the couch. Check battery life reviews, they vary wildly.",
        price: "$499.00",
        badge: "",
        emoji: "🕹️"
      }
    ]
  },

  /* ---------------------------------------------------------------------
   *  CATEGORY 3  —  delete or edit freely
   * ------------------------------------------------------------------- */
  {
    name: "Desk Setup & Comfort",
    slug: "desk",
    blurb: "Small upgrades that stop the back pain.",
    items: [
      {
        title: "Desk Mat (Large)",
        url: "https://www.amazon.com/s?k=desk+mat&tag=YOURTAG-20",
        note: "Protects the desk, stops the mouse catching on the edge.",
        price: "$19.99",
        badge: "",
        emoji: "🖇️"
      },
      {
        title: "Monitor Arm — Single",
        url: "https://www.amazon.com/s?k=monitor+arm&tag=YOURTAG-20",
        note: "Frees desk space and puts the screen at eye level.",
        price: "$34.99",
        badge: "",
        emoji: "🦾"
      },
      {
        title: "USB-C Hub 8-in-1",
        url: "https://www.amazon.com/s?k=usb+c+hub&tag=YOURTAG-20",
        note: "One cable for monitor, keyboard, drive and charging.",
        price: "$27.50",
        badge: "",
        emoji: "🔌"
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
   *      { title: "Product", url: "https://...?tag=YOURTAG-20", note: "Why.", price: "$9.99", badge: "", emoji: "🎁" }
   *    ]
   *  }
   * ------------------------------------------------------------------- */
];
