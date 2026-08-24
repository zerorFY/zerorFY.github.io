(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.BirthdayPhotoCapacity = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  function planPhotoBatch(currentCount, files, maximum = 20) {
    const selected = Array.from(files || []);
    const count = Math.max(0, Number(currentCount) || 0);
    const limit = Math.max(0, Number(maximum) || 0);
    const available = Math.max(0, limit - count);
    const accepted = selected.slice(0, available);
    const rejected = selected.slice(available);

    return {
      accepted,
      rejected,
      remaining: Math.max(0, available - accepted.length),
      limitReached: rejected.length > 0
    };
  }

  return { planPhotoBatch };
});
