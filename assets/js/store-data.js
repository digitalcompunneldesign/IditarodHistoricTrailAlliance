/* ==========================================================================
   STORE CATALOGUE — products, prices and memberships.
   Migrated from the Alliance's current online store. In the CMS build this
   file is replaced by the commerce platform's product feed; the cart reads
   whatever is in window.IHTA_PRODUCTS.
   ship: true  → a physical item that needs a mailing address at checkout
   ========================================================================== */
window.IHTA_PRODUCTS = {
  'poster-van-zyle': { name: 'Commemorative poster by Jon Van Zyle', price: 49, cat: 'merch', ship: true,
    img: 'assets/img/store/poster-van-zyle.jpg',
    desc: 'A commemorative Iditarod National Historic Trail poster by Alaskan artist Jon Van Zyle.' },
  'book-frozen-trail': { name: 'The Frozen Trail', price: 15, cat: 'books', ship: true,
    img: 'assets/img/store/book-frozen-trail.jpg',
    desc: 'A book on Alaska’s Iditarod National Historic Trail. Price includes U.S. Postal Service shipping.' },
  'book-goodwin': { name: 'The Reports of Walter L. Goodwin, Trail Blazer', price: 15, cat: 'books', ship: true,
    img: 'assets/img/store/book-goodwin.jpg',
    desc: 'The Alaska Road Commission surveyor’s own reports from scouting and blazing the trail, 1908–1910.' },
  'dvd-history': { name: 'Iditarod National Historic Trail: A History (DVD)', price: 20, cat: 'books', ship: true,
    img: 'assets/img/store/dvd-history.jpg',
    desc: 'A documentary history of the Iditarod National Historic Trail.' },
  'trail-lovers-pack': { name: 'Trail Lovers Pack — all three, save 30%', price: 35, cat: 'books', ship: true,
    img: 'assets/img/store/trail-lovers-pack.jpg',
    desc: 'The Frozen Trail, the Goodwin reports and the history DVD together.' },
  'map-southern-trek': { name: 'Exploration Map — INHT Southern Trek', price: 3, cat: 'merch', ship: true,
    img: 'assets/img/store/map-southern-trek.jpg',
    desc: 'An exploration map of the trail\u2019s Southern Trek.' },
  'patch': { name: 'Patch — Iditarod National Historic Trail', price: 6, cat: 'merch', ship: true,
    img: 'assets/img/store/patch.jpg',
    desc: 'The embroidered trail-marker patch.' },
  'pin': { name: 'Pin — Iditarod National Historic Trail', price: 15, cat: 'merch', ship: true,
    img: 'assets/img/store/pin.jpg',
    desc: 'The enamel trail-marker lapel pin.' },

  /* memberships run January 1 – December 31 */
  'member-junior': { name: 'Annual membership — Junior (18 and under)', price: 10, cat: 'membership', img: 'assets/img/store/membership.jpg' },
  'member-individual': { name: 'Annual membership — Individual', price: 20, cat: 'membership', img: 'assets/img/store/membership.jpg' },
  'member-school': { name: 'Annual membership — School', price: 20, cat: 'membership', img: 'assets/img/store/membership.jpg' },
  'member-family': { name: 'Annual membership — Family', price: 30, cat: 'membership', img: 'assets/img/store/membership.jpg' },
  'member-nonprofit': { name: 'Annual membership — Non-profit organization', price: 50, cat: 'membership', img: 'assets/img/store/membership.jpg' },
  'member-contributor': { name: 'Annual membership — Contributor', price: 75, cat: 'membership', img: 'assets/img/store/membership.jpg' }
};
