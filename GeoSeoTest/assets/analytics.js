(function () {
  "use strict";

  var measurementIdPattern = /^G-[A-Z0-9]{10}$/;
  var consentStorageKey = "geoseotest.analytics.consent";

  function isValidMeasurementId(value) {
    return typeof value === "string" && measurementIdPattern.test(value);
  }

  function buildRecommendationClickParams(source) {
    var dataset = source && source.dataset ? source.dataset : source || {};
    return {
      experiment_id: typeof dataset.experimentId === "string" ? dataset.experimentId : "",
      batch_id: typeof dataset.batchId === "string" ? dataset.batchId : "",
      treatment: typeof dataset.treatment === "string" ? dataset.treatment : "",
      page_id: typeof dataset.pageId === "string" ? dataset.pageId : "",
      destination_path: typeof dataset.destinationPath === "string" ? dataset.destinationPath : ""
    };
  }

  function resolveAnalyticsPlan(measurementId, storedConsent) {
    var validMeasurementId = isValidMeasurementId(measurementId);
    var consent = storedConsent === "granted" || storedConsent === "denied" ? storedConsent : "unset";
    var enabled = validMeasurementId && consent === "granted";
    var showConsentBanner = validMeasurementId && consent === "unset";
    var disabledReason = "";

    if (!validMeasurementId) {
      disabledReason = measurementId === "" ? "missing-measurement-id" : "invalid-measurement-id";
    } else if (consent === "denied") {
      disabledReason = "consent-denied";
    } else if (consent === "unset") {
      disabledReason = "consent-required";
    }

    return Object.freeze({
      validMeasurementId: validMeasurementId,
      consent: consent,
      enabled: enabled,
      shouldLoad: enabled,
      showConsentBanner: showConsentBanner,
      disabledReason: disabledReason
    });
  }

  window.GeoSeoAnalyticsTest = Object.freeze({
    isValidMeasurementId: isValidMeasurementId,
    buildRecommendationClickParams: buildRecommendationClickParams,
    resolveAnalyticsPlan: resolveAnalyticsPlan
  });

  window.dataLayer = window.dataLayer || [];

  function gtag() {
    window.dataLayer.push(arguments);
  }

  window.gtag = window.gtag || gtag;

  var runtime = window.__GeoSeoAnalyticsRuntime;
  if (!runtime) {
    runtime = { initialized: false, loaded: false, enabled: false, listenerBound: false };
    window.__GeoSeoAnalyticsRuntime = runtime;
    gtag("consent", "default", {
      analytics_storage: "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied"
    });
  }

  if (runtime.initialized) {
    return;
  }
  runtime.initialized = true;

  var config = window.GeoSeoAnalyticsConfig;
  var measurementId = config && typeof config.measurementId === "string" ? config.measurementId : "";

  function setDisabledReason(reason) {
    runtime.enabled = false;
    try {
      document.documentElement.removeAttribute("data-analytics-enabled");
      document.documentElement.setAttribute("data-analytics-disabled", reason);
    } catch (_error) {
      // Analytics must never break page rendering.
    }
  }

  function setEnabled() {
    runtime.enabled = true;
    try {
      document.documentElement.removeAttribute("data-analytics-disabled");
      document.documentElement.setAttribute("data-analytics-enabled", "true");
    } catch (_error) {
      // Analytics must never break page rendering.
    }
  }

  function readStoredConsent() {
    try {
      return window.localStorage.getItem(consentStorageKey);
    } catch (_error) {
      return null;
    }
  }

  function storeConsent(value) {
    try {
      window.localStorage.setItem(consentStorageKey, value);
    } catch (_error) {
      // The current-page choice still applies when storage is unavailable.
    }
  }

  function loadAnalytics(measurementId) {
    if (!measurementIdPattern.test(measurementId)) {
      setDisabledReason(measurementId === "" ? "missing-measurement-id" : "invalid-measurement-id");
      return false;
    }

    if (runtime.loaded) {
      setEnabled();
      return true;
    }

    var script;
    try {
      script = document.createElement("script");
      script.async = true;
      script.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(measurementId);
      script.setAttribute("data-geoseotest-analytics-loader", "");
      script.onerror = function () {
        runtime.loaded = false;
        setDisabledReason("loader-error");
      };
      runtime.loaded = true;
      (document.head || document.documentElement).appendChild(script);
      gtag("js", new Date());
      gtag("config", measurementId);
      setEnabled();
      return true;
    } catch (_error) {
      runtime.loaded = false;
      setDisabledReason("loader-error");
      return false;
    }
  }

  function grantConsentAndLoad() {
    gtag("consent", "update", {
      analytics_storage: "granted",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied"
    });
    loadAnalytics(measurementId);
  }

  function removeConsentBanner() {
    var banner = document.getElementById("geoseotest-analytics-consent");
    if (banner && banner.parentNode) {
      banner.parentNode.removeChild(banner);
    }
  }

  function showConsentBanner() {
    if (!document.body || document.getElementById("geoseotest-analytics-consent")) {
      return;
    }

    var banner = document.createElement("section");
    var copy = document.createElement("p");
    var actions = document.createElement("div");
    var allowButton = document.createElement("button");
    var declineButton = document.createElement("button");

    banner.id = "geoseotest-analytics-consent";
    banner.className = "consent-banner";
    banner.setAttribute("role", "region");
    banner.setAttribute("aria-labelledby", "geoseotest-analytics-consent-copy");
    copy.id = "geoseotest-analytics-consent-copy";
    copy.textContent = "Allow Google Analytics standard measurement plus one limited GeoSeoTest click event. Advertising storage and personalization stay off.";
    actions.className = "consent-actions";
    allowButton.type = "button";
    allowButton.textContent = "Allow analytics";
    declineButton.type = "button";
    declineButton.textContent = "Decline";

    allowButton.addEventListener("click", function () {
      storeConsent("granted");
      removeConsentBanner();
      grantConsentAndLoad();
    }, { once: true });

    declineButton.addEventListener("click", function () {
      storeConsent("denied");
      removeConsentBanner();
      setDisabledReason("consent-denied");
    }, { once: true });

    actions.appendChild(allowButton);
    actions.appendChild(declineButton);
    banner.appendChild(copy);
    banner.appendChild(actions);
    document.body.appendChild(banner);
  }

  function bindRecommendationClicks() {
    if (runtime.listenerBound) {
      return;
    }
    runtime.listenerBound = true;
    document.addEventListener("click", function (event) {
      var target = event.target;
      var recommendation = target && typeof target.closest === "function"
        ? target.closest('[data-analytics-event="recommendation_click"]')
        : null;

      if (!runtime.enabled || !recommendation) {
        return;
      }

      var params = buildRecommendationClickParams(recommendation);
      gtag("event", "recommendation_click", {
        experiment_id: params.experiment_id,
        batch_id: params.batch_id,
        treatment: params.treatment,
        page_id: params.page_id,
        destination_path: params.destination_path
      });
    });
  }

  function initialize() {
    bindRecommendationClicks();
    var plan = resolveAnalyticsPlan(measurementId, readStoredConsent());

    if (!plan.validMeasurementId) {
      setDisabledReason(plan.disabledReason);
      return;
    }
    if (plan.enabled) {
      grantConsentAndLoad();
      return;
    }
    if (plan.showConsentBanner) {
      setDisabledReason(plan.disabledReason);
      showConsentBanner();
      return;
    }
    setDisabledReason(plan.disabledReason);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }
}());
