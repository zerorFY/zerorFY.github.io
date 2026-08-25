(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.BirthdayUsageCounterModule = api;
    if (root.document && root.BirthdayPartyStore?.ready) {
      const createSessionId = () => {
        if (root.crypto?.randomUUID) return root.crypto.randomUUID();
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, character => {
          const random = Math.floor(Math.random() * 16);
          const value = character === 'x' ? random : (random & 0x3) | 0x8;
          return value.toString(16);
        });
      };
      const counter = api.createUsageCounter({
        transport: root.BirthdayPartyStore,
        now: () => Date.now(),
        randomUUID: createSessionId,
        documentRef: root.document,
        windowRef: root,
        setIntervalFn: root.setInterval.bind(root),
        clearIntervalFn: root.clearInterval.bind(root)
      });
      root.BirthdayUsageCounter = counter;
      void counter.start().catch(error => root.console?.error?.(error));
    }
  }
})(typeof window !== 'undefined' ? window : globalThis, function () {
  const SCENES = new Set(['opening', 'labubu', 'spider', 'football', 'mixed', 'finale']);

  function createUsageCounter(options) {
    const {
      transport,
      now,
      randomUUID,
      documentRef,
      windowRef,
      setIntervalFn,
      clearIntervalFn
    } = options;
    const sessionId = randomUUID();
    let scene = 'opening';
    let started = false;
    let visibleSince = null;
    let visibleElapsedMs = 0;
    let intervalId = null;

    function durationSeconds() {
      const activeMs = visibleSince === null ? 0 : Math.max(0, now() - visibleSince);
      return Math.floor((visibleElapsedMs + activeMs) / 1000);
    }

    async function heartbeat() {
      if (!started) return;
      await transport.heartbeatUsageSession(sessionId, durationSeconds(), scene);
    }

    function setScene(nextScene) {
      if (SCENES.has(nextScene)) scene = nextScene;
    }

    async function handleVisibilityChange() {
      if (documentRef.visibilityState === 'hidden') {
        if (visibleSince !== null) {
          visibleElapsedMs += Math.max(0, now() - visibleSince);
          visibleSince = null;
        }
        await heartbeat();
      } else if (visibleSince === null) {
        visibleSince = now();
      }
    }

    async function handlePageHide() {
      await heartbeat();
    }

    async function start() {
      if (started) return;
      started = true;
      visibleSince = documentRef.visibilityState === 'hidden' ? null : now();
      documentRef.addEventListener('visibilitychange', () => { void handleVisibilityChange(); });
      windowRef.addEventListener('pagehide', () => { void handlePageHide(); });
      await transport.startUsageSession(sessionId, scene);
      intervalId = setIntervalFn(() => { void heartbeat(); }, 30000);
    }

    function stop() {
      if (intervalId !== null) clearIntervalFn(intervalId);
      intervalId = null;
    }

    return { start, stop, heartbeat, setScene, handleVisibilityChange, handlePageHide, durationSeconds };
  }

  return { createUsageCounter, SCENES };
});
