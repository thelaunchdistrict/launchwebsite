// Runs inside the page (via page.evaluate). Collects everything the checks need in one pass.
// Must be self-contained: no closures over Node-side variables.
export function probe({ mobile }) {
  const W = document.documentElement.clientWidth;
  const vis = (e) => {
    const r = e.getBoundingClientRect();
    const s = getComputedStyle(e);
    return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && !e.closest('[aria-hidden="true"], .sr-only, [hidden]');
  };
  const label = (e) => (e.getAttribute('aria-label') || e.textContent || e.getAttribute('title') || e.getAttribute('alt') || '').replace(/\s+/g, ' ').trim().slice(0, 60);
  const sel = (e) => {
    const parts = [];
    for (let n = e; n && n !== document.body && parts.length < 4; n = n.parentElement) {
      let s = n.tagName.toLowerCase();
      if (n.id) { s += '#' + n.id; parts.unshift(s); break; }
      const cls = typeof n.className === 'string' ? n.className.split(/\s+/).filter((c) => c && !c.includes(':') && !c.includes('[')).slice(0, 2) : [];
      if (cls.length) s += '.' + cls.join('.');
      parts.unshift(s);
    }
    return parts.join(' > ');
  };

  // ---- document metadata
  const meta = (n) => document.querySelector(`meta[name="${n}"], meta[property="${n}"]`)?.getAttribute('content') ?? null;
  const headings = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map((h) => ({ level: Number(h.tagName[1]), text: h.textContent.replace(/\s+/g, ' ').trim(), visible: vis(h) || h.classList.contains('sr-only') }));

  // ---- visible text, split into blocks so findings can point at a sentence
  const blocks = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
  const BLOCK = /^(P|LI|H[1-6]|DT|DD|TD|TH|FIGCAPTION|SUMMARY|LABEL|BUTTON|A|LEGEND|CAPTION|OPTION|SPAN|DIV)$/;
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (!BLOCK.test(n.tagName) || n.closest('script, style, noscript, svg')) continue;
    // Leaf-ish blocks only: skip elements that contain other block children with text.
    if ([...n.children].some((c) => BLOCK.test(c.tagName) && c.textContent.trim())) continue;
    // innerText respects layout (block children become line breaks), so adjacent cells don't glue together.
    const t = (n.innerText ?? n.textContent).replace(/\s+/g, ' ').trim();
    if (t) blocks.push({ text: t, where: sel(n), hidden: !vis(n) });
  }
  // Individual text nodes: repeated-word checks must not span two separate labels ("Pre-launch | Launch").
  const textNodes = [];
  const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = tw.nextNode(); n; n = tw.nextNode()) {
    const t = n.data.replace(/\s+/g, ' ').trim();
    if (t.length > 3 && !n.parentElement.closest('script, style, noscript')) textNodes.push(t);
  }
  const attrText =[...document.querySelectorAll('[alt], [aria-label], [title], [placeholder]')]
    .map((e) => ['alt', 'aria-label', 'title', 'placeholder'].map((a) => e.getAttribute(a)).filter(Boolean).join(' '))
    .filter(Boolean);

  // ---- links
  const links = [...document.querySelectorAll('a[href]')].map((a) => ({ href: a.getAttribute('href'), text: label(a), where: sel(a), target: a.getAttribute('target'), rel: a.getAttribute('rel') }));
  const ids = [...document.querySelectorAll('[id]')].map((e) => e.id);
  const dupIds = ids.filter((id, i) => ids.indexOf(id) !== i);

  // ---- images
  const images = [...document.querySelectorAll('img')].map((img) => {
    const r = img.getBoundingClientRect();
    return {
      src: img.currentSrc || img.src, alt: img.getAttribute('alt'), complete: img.complete, nw: img.naturalWidth, nh: img.naturalHeight,
      w: Math.round(r.width), h: Math.round(r.height), fit: getComputedStyle(img).objectFit, lazy: img.loading === 'lazy',
      decorative: img.getAttribute('alt') === '' && !!img.closest('button[aria-label], a[aria-label]'), where: sel(img),
    };
  });

  // ---- layout
  const overflowX = document.documentElement.scrollWidth - W;
  const inScroller = (e) => { for (let a = e.parentElement; a; a = a.parentElement) { const o = getComputedStyle(a).overflowX; if (o === 'auto' || o === 'scroll' || o === 'hidden') return true; } return false; };
  const overflowers = overflowX > 0
    ? [...document.querySelectorAll('body *')].filter((e) => e.getBoundingClientRect().right > W + 1 && !inScroller(e) && ![...function* () { for (let a = e; a; a = a.parentElement) yield a; }()].some((a) => getComputedStyle(a).position === 'fixed')).slice(-3).map((e) => sel(e) + ' «' + label(e).slice(0, 30) + '»')
    : [];

  const smallTargets = mobile
    ? [...document.querySelectorAll('a[href], button, input:not([type=hidden]), select, summary, [role=tab], [role=switch]')]
        .filter(vis)
        .filter((e) => !e.closest('[data-qa-touch-exempt]'))
        .filter((e) => {
          const r = e.getBoundingClientRect();
          // Stretched-link pattern: an ::after overlay makes the whole card the target.
          if (getComputedStyle(e, '::after').position === 'absolute') return false;
          if (r.width >= 44 && r.height >= 44) return false;
          if (e.matches('input[type=checkbox], input[type=radio]') && e.closest('label') && e.closest('label').getBoundingClientRect().height >= 44) return false;
          if (e.matches('input[type=range]') && r.height >= 44) return false;
          // Inline links inside running text are exempt (WCAG 2.5.8 inline exception).
          if (e.tagName === 'A' && e.closest('p, li p, dd, td, figcaption, nav[aria-label="Breadcrumb"]') && getComputedStyle(e).display === 'inline') return false;
          return true;
        })
        .map((e) => { const r = e.getBoundingClientRect(); return `${e.tagName.toLowerCase()} «${label(e)}» ${Math.round(r.width)}×${Math.round(r.height)} at ${sel(e)}`; })
    : [];

  const clipped = [...document.querySelectorAll('body *')]
    .filter((e) => {
      if (!vis(e) || e.closest('svg') || e.children.length > 3) return false;
      const s = getComputedStyle(e);
      const cls = typeof e.className === 'string' ? e.className : '';
      if (/truncate|line-clamp|sr-only|overflow-x-auto|overflow-y-auto/.test(cls)) return false;
      if (!/hidden|clip/.test(s.overflowX + s.overflowY)) return false;
      if (['IMG', 'VIDEO', 'svg', 'BUTTON'].includes(e.tagName)) return false;
      return (e.scrollWidth > e.clientWidth + 2 || e.scrollHeight > e.clientHeight + 2) && e.textContent.trim().length > 0 && !e.querySelector('img');
    })
    .slice(0, 5)
    .map((e) => `${sel(e)} «${label(e).slice(0, 40)}»`);

  const exemptTargets = mobile ? [...document.querySelectorAll('[data-qa-touch-exempt]')].map((e) => `${e.querySelectorAll('a[href], button').length} controls: ${e.getAttribute('data-qa-touch-exempt')}`) : [];
  const btnHeights = [...document.querySelectorAll('.btn')].filter(vis).map((b) => Math.round(b.getBoundingClientRect().height));
  const emptyInteractive = [...document.querySelectorAll('a[href], button')].filter((e) => !label(e) && !e.querySelector('img[alt]:not([alt=""])')).map(sel);
  const deadLinks = links.filter((l) => l.href === '#' || l.href === '' || l.href.startsWith('javascript:')).map((l) => l.where);
  const jsonLd = [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => s.textContent);

  return {
    title: document.title,
    description: meta('description'),
    canonical: document.querySelector('link[rel=canonical]')?.getAttribute('href') ?? null,
    ogTitle: meta('og:title'),
    lang: document.documentElement.lang,
    headings, blocks, textNodes, attrText, links, ids, dupIds: [...new Set(dupIds)], images,
    overflowX, overflowers, smallTargets, exemptTargets, clipped, btnHeights, emptyInteractive, deadLinks, jsonLd,
    status: document.querySelector('[role=status]')?.textContent?.replace(/\s+/g, ' ').trim() ?? null,
  };
}
