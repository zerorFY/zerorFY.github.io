(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.BirthdayPhotoPool = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  function buildPhotoPool(uploaded, defaults, slots = 5) {
    const uniqueUploads = [...new Set((uploaded || []).filter(Boolean))];
    if (uniqueUploads.length >= slots) return uniqueUploads;

    const fallback = (defaults || []).filter(Boolean);
    const needed = slots - uniqueUploads.length;
    const fillers = Array.from(
      { length: needed },
      (_, index) => fallback[index % fallback.length]
    );
    return [...uniqueUploads, ...fillers];
  }

  return { buildPhotoPool };
});
