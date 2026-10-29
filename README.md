# Iditarod Historic Trail Alliance — homepage and trail map

This site has two pages:

- `index.html` — the homepage
- `trail-map.html` — the interactive trail map, Seward to Nome

## Navigation

The full site navigation is kept: all five header menus with their dropdowns, the Donate
button, the footer link columns and the legal links. Every item that belongs to a page
outside this package is a static label. It looks the same but isn't a link. The only live
page links are the logo (Home) and "Interactive trail map". `assets/js/unlink.js` also
turns any link to a missing page that a script adds later into plain text.

## Viewing the pages

Run a local server from this folder, then open http://localhost:8000:

    python3 -m http.server

## Photos and the map route

Photographs replace the template videos. They are public-domain images from the Bureau of
Land Management, the USDA Forest Service and the Historic American Buildings Survey, plus
the Alliance's own photos.

The trail route on the map is approximate.
