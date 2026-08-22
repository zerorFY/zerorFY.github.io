(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.MaxwellBirthday1Bootstrap = api;
  if (root?.document && typeof root.fetch === 'function') {
    api.bootstrapBirthday1(root.document, root.fetch.bind(root)).catch(error => {
      root.console?.error?.(error);
      root.document.body.innerHTML = '<main class="birthday1-error">Unable to load the birthday wall.</main>';
      root.document.documentElement.classList.add('birthday1-ready');
    });
  }
})(typeof window !== 'undefined' ? window : globalThis, function () {
  const SHARED_SCRIPTS = [
    'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
    '/birthday/config.js',
    '/birthday/shared.js',
    '/birthday/photo-pool.js',
    '/birthday1/adaptive-layout.js',
    '/birthday/viewer.js'
  ];

  function prepareBirthdayMarkup(html) {
    const bodyMatch = String(html || '').match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);
    if (!bodyMatch) throw new Error('Birthday source document has no body');

    return bodyMatch[1]
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/src=(['"])assets\/happy_birthday_fallback\.wav\1/gi, 'src="/birthday/assets/happy_birthday_fallback.wav"')
      .replace(/href=(['"])upload\/\1/gi, 'href="/birthday/upload/"');
  }

  function loadScript(doc, src) {
    return new Promise((resolve, reject) => {
      const script = doc.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Unable to load ${src}`));
      doc.head.appendChild(script);
    });
  }

  async function bootstrapBirthday1(doc, fetchFn) {
    const response = await fetchFn('/birthday/index.html', { cache: 'no-store' });
    if (!response.ok) throw new Error(`Birthday source returned ${response.status}`);

    doc.body.innerHTML = prepareBirthdayMarkup(await response.text());
    doc.body.dataset.adaptivePhotos = '1';

    for (const src of SHARED_SCRIPTS) await loadScript(doc, src);

    doc.documentElement.classList.add('birthday1-ready');
  }

  return { SHARED_SCRIPTS, prepareBirthdayMarkup, loadScript, bootstrapBirthday1 };
});
