(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.BirthdayAdaptiveLayout = api;
  if (root?.document) api.startAdaptiveLayout(root.document);
})(typeof window !== 'undefined' ? window : globalThis, function () {
  const MIN_RATIO = 9 / 16;
  const MAX_RATIO = 16 / 9;
  const PHOTO_CLASSES = ['photo-portrait', 'photo-square', 'photo-landscape', 'photo-wide'];

  function getPhotoLayout(width, height) {
    if (!(width > 0) || !(height > 0)) {
      return { kind: 'landscape', ratio: 4 / 3, extreme: false };
    }

    const naturalRatio = width / height;
    const kind = naturalRatio < 0.82
      ? 'portrait'
      : naturalRatio <= 1.18
        ? 'square'
        : naturalRatio <= 1.70
          ? 'landscape'
          : 'wide';
    const ratio = Math.min(MAX_RATIO, Math.max(MIN_RATIO, naturalRatio));

    return {
      kind,
      ratio,
      extreme: ratio !== naturalRatio
    };
  }

  async function applyPhotoLayout(img) {
    const card = img?.closest?.('.photo');
    if (!card) return null;

    const sourceAtStart = img.getAttribute?.('src') || img.src || '';
    card.removeAttribute('data-photo-ready');

    try {
      if (typeof img.decode === 'function') await img.decode();
    } catch (_) {
      // Natural dimensions below provide a stable fallback for failed images.
    }

    if (sourceAtStart !== (img.getAttribute?.('src') || img.src || '')) return null;

    const layout = getPhotoLayout(img.naturalWidth, img.naturalHeight);
    card.classList.remove(...PHOTO_CLASSES);
    card.classList.add(`photo-${layout.kind}`);
    card.style.setProperty('--photo-ratio', String(layout.ratio));
    card.style.setProperty('--photo-bg', `url(${JSON.stringify(sourceAtStart)})`);
    card.setAttribute('data-photo-extreme', layout.extreme ? '1' : '0');
    card.setAttribute('data-photo-ready', '1');
    return layout;
  }

  function startAdaptiveLayout(doc) {
    const zone = doc?.getElementById?.('photoZone');
    if (!zone) return null;

    const classify = img => { void applyPhotoLayout(img); };
    zone.querySelectorAll('img').forEach(classify);

    const Observer = doc.defaultView?.MutationObserver || globalThis.MutationObserver;
    if (!Observer) return null;

    const observer = new Observer(records => {
      records.forEach(record => {
        if (record.type === 'attributes' && record.target?.matches?.('img')) {
          classify(record.target);
        }
        record.addedNodes?.forEach(node => {
          if (node.matches?.('img')) classify(node);
          node.querySelectorAll?.('img').forEach(classify);
        });
      });
    });
    observer.observe(zone, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['src']
    });
    return observer;
  }

  return { getPhotoLayout, applyPhotoLayout, startAdaptiveLayout };
});
