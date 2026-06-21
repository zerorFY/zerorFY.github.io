const DATA_PATHS = {
  library: "./data/library.json",
  documentBase: "./data/"
};

const LOCAL_LANGUAGE_KEY = "pls.languageMode.v2";

const LANGUAGE_LABELS = {
  en: "English Original",
  zh: "中文正式译文"
};

const state = {
  library: null,
  document: null,
  activeDocumentId: null,
  activeSegmentId: null,
  activeTab: "annotations",
  languageMode: "zh",
  mobilePanel: "body",
  search: "",
  outlineOpen: false,
  currentDocumentPath: "",
  lastRefreshMessage: ""
};

const dom = {
  versionBadge: document.querySelector("#versionBadge"),
  docTitle: document.querySelector("#docTitle"),
  sectionCount: document.querySelector("#sectionCount"),
  segmentCount: document.querySelector("#segmentCount"),
  annotationCount: document.querySelector("#annotationCount"),
  sourceTypeBadge: document.querySelector("#sourceTypeBadge"),
  sourcePath: document.querySelector("#sourcePath"),
  documentSelect: document.querySelector("#documentSelect"),
  loadSummary: document.querySelector("#loadSummary"),
  segmentSearch: document.querySelector("#segmentSearch"),
  sectionList: document.querySelector("#sectionList"),
  activeSegmentTitle: document.querySelector("#activeSegmentTitle"),
  prevSegment: document.querySelector("#prevSegment"),
  nextSegment: document.querySelector("#nextSegment"),
  segmentList: document.querySelector("#segmentList"),
  detailContent: document.querySelector("#detailContent"),
  selectedSegmentBadge: document.querySelector("#selectedSegmentBadge"),
  languageButtons: [...document.querySelectorAll("[data-language-mode]")],
  mobileButtons: [...document.querySelectorAll("[data-mobile-panel]")],
  outlineToggle: document.querySelector("#outlineToggle"),
  outlineScrim: document.querySelector("#outlineScrim"),
  railLeft: document.querySelector(".rail-left"),
  railRight: document.querySelector(".rail-right"),
  uploadTopButton: document.querySelector("#uploadTopButton"),
  uploadPanelButton: document.querySelector("#uploadPanelButton"),
  uploadStatus: document.querySelector("#uploadStatus"),
  uploadBadge: document.querySelector("#uploadBadge"),
  refreshDriveButton: document.querySelector("#refreshDriveButton")
};

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getAdapterUrl() {
  return state.library?.adapter?.url?.trim() ?? "";
}

function buildAdapterUrl(action, params = {}) {
  const adapterUrl = getAdapterUrl();
  if (!adapterUrl) return "";
  const url = new URL(adapterUrl, window.location.href);
  url.searchParams.set("action", action);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, value);
  });
  return url.toString();
}
async function loadJson(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) throw new Error(`Failed to load ${path}: ${response.status}`);
  return response.json();
}

function normalizeLanguageMode(mode) {
  return ["zh", "en", "both"].includes(mode) ? mode : "zh";
}

function readLanguageMode() {
  try {
    return normalizeLanguageMode(localStorage.getItem(LOCAL_LANGUAGE_KEY));
  } catch {
    return "zh";
  }
}

function saveLanguageMode() {
  try {
    localStorage.setItem(LOCAL_LANGUAGE_KEY, state.languageMode);
  } catch {}
}

function usesPageScroll() {
  return window.matchMedia("(max-width: 820px)").matches;
}

function usesOutlineDrawer() {
  return window.matchMedia("(max-width: 1100px)").matches;
}

function getReaderScrollTop() {
  return usesPageScroll() ? window.scrollY : dom.segmentList.scrollTop;
}

function restoreReaderScrollTop(scrollTop) {
  if (usesPageScroll()) window.scrollTo(0, scrollTop);
  else dom.segmentList.scrollTop = scrollTop;
}

function getVariant(item, language) {
  if (!item?.language_variants) return null;
  return item.language_variants[language] ?? item.language_variants.en ?? item.language_variants.zh ?? null;
}

function getDisplayLanguage() {
  return state.languageMode === "both" ? "zh" : state.languageMode;
}

function getDisplayText(item, field, language = getDisplayLanguage()) {
  const directField = field === "text_content" ? `content_${language}` : null;
  const variant = getVariant(item, language);
  return variant?.[field] ?? (directField ? item?.[directField] : "") ?? item?.[field] ?? "";
}

function getAllVariantText(item) {
  const variants = item?.language_variants ?? {};
  return [item?.content_en, item?.content_zh, ...Object.values(variants).flatMap((variant) => Object.values(variant ?? {}))]
    .filter(Boolean)
    .join(" ");
}

function getSectionSegments(section) {
  if (Array.isArray(section.segments)) return section.segments;
  return (state.document?.segments ?? []).filter((segment) => segment.section_id === section.section_id);
}

function getAllSegments() {
  if (!state.document) return [];
  if (Array.isArray(state.document.sections)) {
    return state.document.sections.flatMap((section) =>
      getSectionSegments(section).map((segment) => ({
        ...segment,
        sectionId: section.section_id,
        sectionTitle: getDisplayText(section, "title")
      }))
    );
  }
  return (state.document.segments ?? []).map((segment) => ({
    ...segment,
    sectionId: segment.section_id,
    sectionTitle: segment.section_id
  }));
}

function getAnnotations() {
  return state.document?.annotations ?? [];
}

function getQuestionThreads() {
  return state.document?.question_threads ?? [];
}

function getActiveSegment() {
  return getAllSegments().find((segment) => segment.segment_id === state.activeSegmentId) ?? null;
}

function getDocumentEntry(documentId = state.activeDocumentId) {
  return state.library?.documents?.find((item) => item.document_id === documentId) ?? null;
}

function getDocumentPath(entry) {
  if (!entry) return "";
  if (entry.file_url) return entry.file_url;
  if (entry.file && /^https?:\/\//i.test(entry.file)) return entry.file;
  if (entry.file) return `${DATA_PATHS.documentBase}${entry.file}`;
  if (entry.document_id && getAdapterUrl()) return buildAdapterUrl("document", { document_id: entry.document_id });
  return "";
}

function setActiveSegment(segmentId) {
  state.activeSegmentId = segmentId;
  render();
  const element = document.querySelector(`[data-segment-id="${CSS.escape(segmentId)}"]`);
  if (element) element.scrollIntoView({ block: "nearest", behavior: "smooth" });
  if (usesOutlineDrawer()) setOutlineOpen(false);
}

function setLanguageMode(mode) {
  const readerScrollTop = getReaderScrollTop();
  state.languageMode = normalizeLanguageMode(mode);
  saveLanguageMode();
  render();
  restoreReaderScrollTop(readerScrollTop);
}

function setOutlineOpen(open) {
  state.outlineOpen = Boolean(open) && usesOutlineDrawer();
  renderOutlineDrawer();
}

function setMobilePanel(mobilePanel) {
  state.mobilePanel = mobilePanel;
  if (mobilePanel === "annotations") state.activeTab = "annotations";
  if (mobilePanel === "questions") state.activeTab = "questions";
  if (mobilePanel === "system") state.activeTab = "system";
  renderDetail();
  renderMobilePanel();
}

async function setActiveDocument(documentId) {
  const entry = getDocumentEntry(documentId);
  if (!entry) return;
  state.activeDocumentId = documentId;
  state.currentDocumentPath = getDocumentPath(entry);
  state.document = await loadJson(state.currentDocumentPath);
  state.activeSegmentId = getAllSegments()[0]?.segment_id ?? null;
  state.search = "";
  dom.segmentSearch.value = "";
  render();
  restoreReaderScrollTop(0);
}

function openUploadForm() {
  const url = state.library?.upload?.form_url?.trim();
  if (url) {
    window.open(url, "_blank", "noopener,noreferrer");
    return;
  }
  state.lastRefreshMessage = "Google Form is not configured yet; Drive refresh remains unavailable.";
  dom.uploadStatus.textContent = state.lastRefreshMessage;
  dom.uploadBadge.textContent = "Pending";
}


async function refreshDriveLibrary() {
  const adapterUrl = getAdapterUrl();
  const workflow = state.library?.drive_workflow ?? {};
  const retention = workflow.batch_retention_count ?? 5;

  if (!adapterUrl) {
    state.lastRefreshMessage = `Apps Script adapter URL is not configured yet. Current page still reads deployed library.json; batch retention is ${retention}.`;
    dom.uploadBadge.textContent = "Pending";
    dom.uploadStatus.textContent = state.lastRefreshMessage;
    renderDetail();
    return;
  }

  const previousDocumentId = state.activeDocumentId;
  const previousSegmentId = state.activeSegmentId;
  const previousScrollTop = getReaderScrollTop();
  state.lastRefreshMessage = "Refreshing Drive...";
  dom.uploadStatus.textContent = state.lastRefreshMessage;
  dom.uploadBadge.textContent = "Sync";
  if (dom.refreshDriveButton) dom.refreshDriveButton.disabled = true;

  try {
    const response = await fetch(buildAdapterUrl("refresh"), { cache: "no-store" });
    if (!response.ok) throw new Error(`Apps Script refresh failed: ${response.status}`);
    const payload = await response.json();
    if (payload.ok === false) throw new Error(payload.error || "Apps Script refresh returned an error.");

    if (payload.library) state.library = payload.library;
    else state.library = await loadJson(buildAdapterUrl("library"));

    const hasPreviousDocument = state.library.documents?.some((entry) => entry.document_id === previousDocumentId);
    const nextDocumentId = hasPreviousDocument
      ? previousDocumentId
      : (state.library.active_document_id || state.library.documents?.[0]?.document_id);

    if (nextDocumentId) {
      await setActiveDocument(nextDocumentId);
      if (previousSegmentId && getAllSegments().some((segment) => segment.segment_id === previousSegmentId)) {
        state.activeSegmentId = previousSegmentId;
      }
    }

    state.lastRefreshMessage = `Drive refresh complete. Processed ${payload.processed_count ?? 0} latest file(s); keeping latest ${retention} batch archives.`;
    render();
    restoreReaderScrollTop(previousScrollTop);
  } catch (error) {
    state.lastRefreshMessage = `Drive refresh failed: ${error.message}`;
    dom.uploadStatus.textContent = state.lastRefreshMessage;
    dom.uploadBadge.textContent = "Error";
    renderDetail();
  } finally {
    if (dom.refreshDriveButton) dom.refreshDriveButton.disabled = false;
  }
}
function renderLanguageControls() {
  dom.languageButtons.forEach((button) => {
    const active = button.dataset.languageMode === state.languageMode;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  document.documentElement.lang = state.languageMode === "en" ? "en" : "zh";
}

function renderMobilePanel() {
  dom.mobileButtons.forEach((button) => {
    const active = button.dataset.mobilePanel === state.mobilePanel;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  dom.railRight.classList.toggle("is-mobile-open", state.mobilePanel !== "body");
  dom.railRight.dataset.mobilePanel = state.mobilePanel;
  renderOutlineDrawer();
}

function renderOutlineDrawer() {
  const open = state.outlineOpen && usesOutlineDrawer();
  dom.railLeft.classList.toggle("is-outline-open", open);
  dom.outlineScrim.classList.toggle("is-visible", open);
  dom.outlineToggle.classList.toggle("is-active", open);
  dom.outlineToggle.setAttribute("aria-expanded", String(open));
}

function renderDocumentSelect() {
  const documents = state.library?.documents ?? [];
  dom.documentSelect.innerHTML = documents.map((entry) => `
    <option value="${escapeHtml(entry.document_id)}" ${entry.document_id === state.activeDocumentId ? "selected" : ""}>
      ${escapeHtml(getDisplayText(entry, "title") || entry.title || entry.document_id)}
    </option>
  `).join("");
}

function renderDocPanel() {
  const segments = getAllSegments();
  const sectionTotal = state.document?.sections?.length ?? 0;
  const annotationTotal = getAnnotations().length;
  const entry = getDocumentEntry();
  dom.versionBadge.textContent = state.document?.document_version?.version_label ?? state.document?.version_label ?? "v2";
  dom.docTitle.textContent = getDisplayText(state.document, "title") || entry?.title || "Untitled document";
  dom.sectionCount.textContent = String(sectionTotal);
  dom.segmentCount.textContent = String(segments.length);
  dom.annotationCount.textContent = String(annotationTotal);
  dom.loadSummary.textContent = `${sectionTotal} sections / ${segments.length} segments loaded`;
  dom.sourceTypeBadge.textContent = entry?.status === "sample" ? "Sample" : "Static";
  dom.sourcePath.textContent = state.currentDocumentPath || DATA_PATHS.library;
  renderDocumentSelect();

  const formUrl = state.library?.upload?.form_url?.trim();
  const workflow = state.library?.drive_workflow ?? {};
  const retention = workflow.batch_retention_count ?? 5;
  const adapterReady = Boolean(getAdapterUrl());
  const gptWrites = workflow.gpt_writes ?? "{base_name}.gpt-latest.json";
  const webReads = workflow.web_reads ?? "{base_name}.json";
  dom.uploadBadge.textContent = adapterReady ? "Drive" : (formUrl ? "Form" : "Pending");
  const defaultUploadStatus = formUrl
    ? `Upload opens Google Form. GPT writes ${gptWrites}; refresh publishes ${webReads} and keeps latest ${retention} batches.`
    : "Google Form URL not configured yet; reader is ready for the connection.";
  dom.uploadStatus.textContent = state.lastRefreshMessage || defaultUploadStatus;
  if (dom.refreshDriveButton) dom.refreshDriveButton.disabled = false;
}

function renderSections() {
  const activeSegment = getActiveSegment();
  const sections = state.document?.sections ?? [];
  dom.sectionList.innerHTML = sections.map((section) => {
    const isActive = activeSegment?.sectionId === section.section_id;
    return `
      <button class="section-button ${isActive ? "is-active" : ""}" type="button" data-section-id="${escapeHtml(section.section_id)}">
        <span>${escapeHtml(getDisplayText(section, "title") || section.section_id)}</span>
        <span>${getSectionSegments(section).length}</span>
      </button>
    `;
  }).join("");

  dom.sectionList.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      const section = sections.find((item) => item.section_id === button.dataset.sectionId);
      const firstSegment = section ? getSectionSegments(section)[0] : null;
      if (firstSegment) setActiveSegment(firstSegment.segment_id);
    });
  });
}

function renderLanguageBlock(item, language, fields = ["title", "text_content"]) {
  const variant = getVariant(item, language);
  const title = fields.includes("title") ? (variant?.title ?? item?.[`title_${language}`] ?? "") : "";
  const bodyField = fields.find((field) => field !== "title" && (variant?.[field] || item?.[`content_${language}`]));
  const body = bodyField ? (variant?.[bodyField] ?? item?.[`content_${language}`] ?? "") : "";
  const status = item?.translation_status ? `<span>${escapeHtml(item.translation_status)}</span>` : "";
  return `
    <div class="language-block" lang="${escapeHtml(language)}">
      <div class="language-label"><span>${escapeHtml(LANGUAGE_LABELS[language] ?? language)}</span>${status}</div>
      ${title ? `<h3>${escapeHtml(title)}</h3>` : ""}
      ${body ? `<p>${escapeHtml(body)}</p>` : ""}
    </div>
  `;
}

function renderSegmentContent(segment) {
  if (state.languageMode === "both") {
    return `
      <div class="translation-stack">
        ${renderLanguageBlock(segment, "en")}
        ${renderLanguageBlock(segment, "zh")}
      </div>
    `;
  }
  return renderLanguageBlock(segment, state.languageMode);
}

function renderSegments() {
  const query = state.search.trim().toLowerCase();
  const allSegments = getAllSegments();
  const annotations = getAnnotations();
  const segments = allSegments.filter((segment) => {
    if (!query) return true;
    return [segment.anchor_key, segment.sectionTitle, getAllVariantText(segment)]
      .join(" ")
      .toLowerCase()
      .includes(query);
  });

  if (segments.length === 0) {
    dom.segmentList.innerHTML = document.querySelector("#emptyTemplate").innerHTML;
    return;
  }

  const segmentMarkup = segments.map((segment, index) => {
    const active = segment.segment_id === state.activeSegmentId;
    const annotationTotal = annotations.filter((annotation) => annotation.segment_id === segment.segment_id).length;
    return `
      <section class="segment ${active ? "is-active" : ""}" data-segment-id="${escapeHtml(segment.segment_id)}">
        <button class="segment-index icon-button" type="button" title="Select segment ${escapeHtml(segment.anchor_key)}" aria-label="Select segment ${escapeHtml(segment.anchor_key)}">${String(index + 1).padStart(2, "0")}</button>
        <div class="segment-body">
          ${renderSegmentContent(segment)}
          <div class="segment-meta">
            <span>${escapeHtml(segment.anchor_key ?? segment.segment_id)}</span>
            <span>${escapeHtml(segment.sectionTitle ?? "Section")}</span>
            <span>${annotationTotal} notes</span>
          </div>
        </div>
      </section>
    `;
  }).join("");

  const endTitle = query ? "End of results" : "End of document";
  const endSubtitle = query
    ? `${segments.length} of ${allSegments.length} segments visible from ${state.document.sections.length} sections.`
    : `${allSegments.length} segments loaded from ${state.document.sections.length} sections.`;

  dom.segmentList.innerHTML = `${segmentMarkup}
    <footer class="document-end" aria-label="${escapeHtml(endTitle)}">
      <strong>${escapeHtml(endTitle)} / 文档结束</strong>
      <span>${escapeHtml(endSubtitle)}</span>
      <span class="document-end-source">Source: ${escapeHtml(state.currentDocumentPath)}</span>
    </footer>
  `;

  dom.segmentList.querySelectorAll(".segment").forEach((element) => {
    element.addEventListener("click", () => setActiveSegment(element.dataset.segmentId));
  });
}

function renderActiveHeader() {
  const segment = getActiveSegment();
  dom.activeSegmentTitle.textContent = segment ? `${segment.anchor_key ?? segment.segment_id} - ${getDisplayText(segment, "title")}` : "No segment selected";
  dom.selectedSegmentBadge.textContent = segment ? (segment.anchor_key ?? segment.segment_id) : "segment";
}

function renderAnnotationVariant(annotation, language) {
  const variant = getVariant(annotation, language);
  const content = annotation?.[`content_${language}`];
  if (!variant && !content) return "";
  return `
    <div class="language-block" lang="${escapeHtml(language)}">
      <div class="language-label"><span>${escapeHtml(LANGUAGE_LABELS[language] ?? language)}</span><span>${escapeHtml(annotation.translation_status ?? "static")}</span></div>
      ${variant?.title ? `<h3>${escapeHtml(variant.title)}</h3>` : ""}
      ${variant?.summary ? `<p>${escapeHtml(variant.summary)}</p>` : ""}
      ${variant?.explanation ? `<div class="note-block"><p>${escapeHtml(variant.explanation)}</p></div>` : ""}
      ${variant?.boundary_notes ? `<div class="note-block"><p><strong>Boundary: </strong>${escapeHtml(variant.boundary_notes)}</p></div>` : ""}
      ${content ? `<p>${escapeHtml(content)}</p>` : ""}
    </div>
  `;
}

function renderAnnotations() {
  const segment = getActiveSegment();
  const annotations = getAnnotations().filter((annotation) => annotation.segment_id === segment?.segment_id);
  if (!segment || annotations.length === 0) {
    dom.detailContent.innerHTML = document.querySelector("#emptyTemplate").innerHTML;
    return;
  }

  dom.detailContent.innerHTML = annotations.map((annotation) => {
    const body = state.languageMode === "both"
      ? `${renderAnnotationVariant(annotation, "en")}${renderAnnotationVariant(annotation, "zh")}`
      : renderAnnotationVariant(annotation, state.languageMode);
    return `<article class="annotation-card translation-stack">${body}</article>`;
  }).join("");
}

function renderMessage(message) {
  const languages = state.languageMode === "both" ? ["en", "zh"] : [state.languageMode];
  const blocks = languages.map((language) => {
    const body = getDisplayText(message, "body", language) || message.original_text || message.body;
    return `
      <div class="language-block" lang="${escapeHtml(language)}">
        <div class="language-label"><span>${escapeHtml(LANGUAGE_LABELS[language] ?? language)}</span></div>
        <p>${escapeHtml(body)}</p>
      </div>
    `;
  }).join("");
  return `
    <div class="message translation-stack">
      <strong>${escapeHtml(message.role)} - ${escapeHtml(message.created_at ?? "static")}</strong>
      ${blocks}
    </div>
  `;
}

function renderQuestions() {
  const segment = getActiveSegment();
  const messages = getQuestionThreads()
    .filter((thread) => !thread.segment_id || thread.segment_id === segment?.segment_id)
    .flatMap((thread) => thread.messages ?? []);

  if (!messages.length) {
    dom.detailContent.innerHTML = document.querySelector("#emptyTemplate").innerHTML;
    return;
  }

  dom.detailContent.innerHTML = messages.map(renderMessage).join("");
}

function renderSystem() {
  const entry = getDocumentEntry();
  const uploadMode = state.library?.upload?.mode ?? "not_configured";
  const formUrl = state.library?.upload?.form_url?.trim();
  const adapter = state.library?.adapter ?? {};
  const adapterUrl = getAdapterUrl();
  const workflow = state.library?.drive_workflow ?? {};
  const retention = workflow.batch_retention_count ?? 5;
  const gptWrites = workflow.gpt_writes ?? "{base_name}.gpt-latest.json";
  const webReads = workflow.web_reads ?? "{base_name}.json";
  const archivePattern = workflow.batch_archive_pattern ?? "{base_name}.batch-{yyyyMMdd-HHmmss}.json";

  dom.detailContent.innerHTML = `
    <ul class="contract-list system-list">
      <li><strong>Active workflow</strong><p>V2.1 Drive workflow. GPT writes ${escapeHtml(gptWrites)}; Apps Script archives, verifies, merges, and the reader loads ${escapeHtml(webReads)}.</p></li>
      <li><strong>Data source</strong><p>${escapeHtml(state.currentDocumentPath || DATA_PATHS.library)}</p></li>
      <li><strong>Upload</strong><p>${formUrl ? "Google Form is configured." : `Pending Google Form URL (${escapeHtml(uploadMode)}).`}</p></li>
      <li><strong>Adapter</strong><p>${adapterUrl ? "Apps Script URL configured." : `Apps Script URL pending (${escapeHtml(adapter.status ?? "pending")}).`}</p></li>
      <li><strong>Batch retention</strong><p>Keep latest ${escapeHtml(String(retention))} archives matching ${escapeHtml(archivePattern)}; older batch files move to Drive trash.</p></li>
      <li><strong>No SQL</strong><p>No database, online queue, or concurrent worker is required for this stage.</p></li>
      <li><strong>Document</strong><p>${escapeHtml(entry?.document_id ?? "none")}</p></li>
    </ul>
  `;
}
function renderDetail() {
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.classList.toggle("is-active", tab.dataset.tab === state.activeTab);
  });

  if (state.activeTab === "annotations") renderAnnotations();
  if (state.activeTab === "questions") renderQuestions();
  if (state.activeTab === "system") renderSystem();
}

function render() {
  if (!state.document) return;
  renderLanguageControls();
  renderDocPanel();
  renderSections();
  renderSegments();
  renderActiveHeader();
  renderDetail();
  renderMobilePanel();
}

function moveSegment(delta) {
  const segments = getAllSegments();
  const currentIndex = segments.findIndex((segment) => segment.segment_id === state.activeSegmentId);
  const next = segments[currentIndex + delta];
  if (next) setActiveSegment(next.segment_id);
}

async function init() {
  try {
    state.library = await loadJson(DATA_PATHS.library);
    state.activeDocumentId = state.library.active_document_id || state.library.documents?.[0]?.document_id;
    state.languageMode = readLanguageMode();
    await setActiveDocument(state.activeDocumentId);
  } catch (error) {
    dom.segmentList.innerHTML = `<div class="empty-state"><strong>Load failed</strong><span>${escapeHtml(error.message)}</span></div>`;
  }
}

dom.segmentSearch.addEventListener("input", (event) => {
  state.search = event.target.value;
  renderSegments();
});

dom.documentSelect.addEventListener("change", (event) => {
  setActiveDocument(event.target.value).catch((error) => {
    dom.segmentList.innerHTML = `<div class="empty-state"><strong>Load failed</strong><span>${escapeHtml(error.message)}</span></div>`;
  });
});

dom.languageButtons.forEach((button) => {
  button.addEventListener("click", () => setLanguageMode(button.dataset.languageMode));
});

dom.mobileButtons.forEach((button) => {
  button.addEventListener("click", () => setMobilePanel(button.dataset.mobilePanel));
});

dom.outlineToggle.addEventListener("click", () => setOutlineOpen(!state.outlineOpen));
dom.outlineScrim.addEventListener("click", () => setOutlineOpen(false));
window.addEventListener("resize", renderOutlineDrawer);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") setOutlineOpen(false);
});

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    state.activeTab = tab.dataset.tab;
    state.mobilePanel = state.activeTab;
    renderDetail();
    renderMobilePanel();
  });
});

dom.prevSegment.addEventListener("click", () => moveSegment(-1));
dom.nextSegment.addEventListener("click", () => moveSegment(1));
dom.uploadTopButton.addEventListener("click", openUploadForm);
dom.uploadPanelButton.addEventListener("click", openUploadForm);
if (dom.refreshDriveButton) dom.refreshDriveButton.addEventListener("click", () => refreshDriveLibrary());

init();