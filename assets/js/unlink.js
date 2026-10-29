/* Only the homepage and the trail map are in this package. Any link to another
   page — including ones scripts add later (cart, map cards) — is turned into
   plain text so nothing leads to a missing page. */
(function () {
  'use strict';
  const KEEP = ['index.html', 'trail-map.html'];
  const isOther = href => {
    if (!href || /^(https?:|mailto:|tel:|#|assets\/|javascript:)/.test(href)) return false;
    return KEEP.indexOf(href.split('#')[0].split('?')[0]) === -1;
  };
  function sweep(root) {
    (root.querySelectorAll ? root : document).querySelectorAll('a[href]').forEach(a => {
      if (!isOther(a.getAttribute('href'))) return;
      ['href', 'target', 'rel', 'download'].forEach(n => a.removeAttribute(n));
      a.classList.add('is-unlinked'); a.classList.remove('text-link', 'link-cta');
    });
  }
  sweep(document);
  new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => { if (n.nodeType === 1) sweep(n.parentNode || n); })))
    .observe(document.body, { childList: true, subtree: true });
})();
