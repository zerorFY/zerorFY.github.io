const DATA_PATHS = {
  document: "./data/document.sample.json",
  annotations: "./data/annotations.sample.json",
  thread: "./data/thread.sample.json",
  tasks: "./data/tasks.sample.json"
};

const LOCAL_TASK_KEY = "pls.localTasks.v1";
const LOCAL_LANGUAGE_KEY = "pls.languageMode.v1";

const LANGUAGE_LABELS = {
  en: "English Original",
  zh: "中文正式译文"
};

const state = {
  document: null,
  annotations: [],
  thread: null,
  tasks: [],
  localTasks: [],
  activeSegmentId: null,
  activeTab: "annotations",
  languageMode: "zh",
  mobilePanel: "body",
  search: "",
  outlineOpen: false
};

const dom = {
  versionBadge: document.querySelector("#versionBadge"),
  docTitle: document.querySelector("#docTitle"),
  sectionCount: document.querySelector("#sectionCount"),
  segmentCount: document.querySelector("#segmentCount"),
  annotationCount: document.querySelector("#annotationCount"),
  sourceTypeBadge: document.querySelector("#sourceTypeBadge"),
  sourcePath: document.querySelector("#sourcePath"),
  importPlaceholder: document.querySelector("#importPlaceholder"),
  loadSummary: document.querySelector("#loadSummary"),
  segmentSearch: document.querySelector("#segmentSearch"),
  sectionList: document.querySelector("#sectionList"),
  queueStats: document.querySelector("#queueStats"),
  taskList: document.querySelector("#taskList"),
  activeSegmentTitle: document.querySelector("#activeSegmentTitle"),
  prevSegment: document.querySelector("#prevSegment"),
  nextSegment: document.querySelector("#nextSegment"),
  segmentList: document.querySelector("#segmentList"),
  detailContent: document.querySelector("#detailContent"),
  questionForm: document.querySelector("#questionForm"),
  questionInput: document.querySelector("#questionInput"),
  selectedSegmentBadge: document.querySelector("#selectedSegmentBadge"),
  clearLocalTasks: document.querySelector("#clearLocalTasks"),
  languageButtons: [...document.querySelectorAll("[data-language-mode]")],
  mobileNav: document.querySelector("#mobileNav"),
  mobileButtons: [...document.querySelectorAll("[data-mobile-panel]")],
  outlineToggle: document.querySelector("#outlineToggle"),
  outlineScrim: document.querySelector("#outlineScrim"),
  railLeft: document.querySelector(".rail-left"),
  railRight: document.querySelector(".rail-right")
};

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function loadJson(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to load ${path}: ${response.status}`);
  }
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
  localStorage.setItem(LOCAL_LANGUAGE_KEY, state.languageMode);
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
  const variant = getVariant(item, language);
  return variant?.[field] ?? item?.[field] ?? "";
}

function getAllVariantText(item) {
  const variants = item?.language_variants ?? {};
  return Object.values(variants)
    .flatMap((variant) => Object.values(variant ?? {}))
    .join(" ");
}

function getAllSegments() {
  if (!state.document) return [];
  return state.document.sections.flatMap((section) =>
    section.segments.map((segment) => ({
      ...segment,
      sectionId: section.section_id,
      sectionTitle: getDisplayText(section, "title")
    }))
  );
}

function getActiveSegment() {
  return getAllSegments().find((segment) => segment.segment_id === state.activeSegmentId) ?? null;
}

function getCombinedTasks() {
  return [...state.localTasks, ...state.tasks].sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
}

function loadLocalTasks() {
  try {
    const raw = localStorage.getItem(LOCAL_TASK_KEY);
    state.localTasks = raw ? JSON.parse(raw) : [];
  } catch {
    state.localTasks = [];
  }
}

function saveLocalTasks() {
  localStorage.setItem(LOCAL_TASK_KEY, JSON.stringify(state.localTasks));
}

function setActiveSegment(segmentId) {
  state.activeSegmentId = segmentId;
  render();
  const element = document.querySelector(`[data-segment-id="${CSS.escape(segmentId)}"]`);
  if (element) {
    element.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }
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
  renderDetail();
  renderMobilePanel();
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

function renderDocPanel() {
  const segments = getAllSegments();
  const sectionTotal = state.document.sections.length;
  const sampleOnly = DATA_PATHS.document.includes("sample") || String(state.document.version_label ?? "").toLowerCase().includes("local");
  dom.versionBadge.textContent = state.document.version_label;
  dom.docTitle.textContent = getDisplayText(state.document, "title");
  dom.sectionCount.textContent = String(sectionTotal);
  dom.segmentCount.textContent = String(segments.length);
  dom.annotationCount.textContent = String(state.annotations.length);
  dom.loadSummary.textContent = `${sectionTotal} sections / ${segments.length} segments loaded`;
  dom.sourceTypeBadge.textContent = sampleOnly ? "Sample only" : "Imported";
  dom.sourcePath.textContent = DATA_PATHS.document;
  dom.importPlaceholder.textContent = sampleOnly ? "Full paper import pending" : "Import full paper";
  dom.importPlaceholder.disabled = true;
}

function renderSections() {
  const activeSegment = getActiveSegment();
  dom.sectionList.innerHTML = state.document.sections.map((section) => {
    const isActive = activeSegment?.sectionId === section.section_id;
    return `
      <button class="section-button ${isActive ? "is-active" : ""}" type="button" data-section-id="${escapeHtml(section.section_id)}">
        <span>${escapeHtml(getDisplayText(section, "title"))}</span>
        <span>${section.segments.length}</span>
      </button>
    `;
  }).join("");

  dom.sectionList.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      const section = state.document.sections.find((item) => item.section_id === button.dataset.sectionId);
      if (section?.segments[0]) setActiveSegment(section.segments[0].segment_id);
    });
  });
}

function renderLanguageBlock(item, language, fields = ["title", "text_content"]) {
  const variant = getVariant(item, language);
  if (!variant) return "";
  const title = fields.includes("title") ? variant.title : "";
  const bodyField = fields.find((field) => field !== "title" && variant[field]);
  const body = bodyField ? variant[bodyField] : "";
  const status = item.translation_status ? `<span>${escapeHtml(item.translation_status)}</span>` : "";
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
    const annotationTotal = state.annotations.filter((annotation) => annotation.segment_id === segment.segment_id).length;
    return `
      <section class="segment ${active ? "is-active" : ""}" data-segment-id="${escapeHtml(segment.segment_id)}">
        <button class="segment-index icon-button" type="button" title="Select segment ${escapeHtml(segment.anchor_key)}" aria-label="Select segment ${escapeHtml(segment.anchor_key)}">${String(index + 1).padStart(2, "0")}</button>
        <div class="segment-body">
          ${renderSegmentContent(segment)}
          <div class="segment-meta">
            <span>${escapeHtml(segment.anchor_key)}</span>
            <span>${escapeHtml(segment.sectionTitle)}</span>
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
      <span class="document-end-source">Source: ${escapeHtml(DATA_PATHS.document)}</span>
    </footer>
  `;

  dom.segmentList.querySelectorAll(".segment").forEach((element) => {
    element.addEventListener("click", () => setActiveSegment(element.dataset.segmentId));
  });
}

function renderActiveHeader() {
  const segment = getActiveSegment();
  dom.activeSegmentTitle.textContent = segment ? `${segment.anchor_key} - ${getDisplayText(segment, "title")}` : "No segment selected";
  dom.selectedSegmentBadge.textContent = segment ? segment.anchor_key : "segment";
}

function renderQueue() {
  const tasks = getCombinedTasks();
  const queued = tasks.filter((task) => ["queued", "pending", "running"].includes(task.status)).length;
  const done = tasks.filter((task) => ["done", "succeeded"].includes(task.status)).length;
  const failed = tasks.filter((task) => task.status === "failed").length;

  dom.queueStats.innerHTML = `
    <div><span>${queued}</span><label>Open</label></div>
    <div><span>${done}</span><label>Done</label></div>
    <div><span>${failed}</span><label>Failed</label></div>
  `;

  dom.taskList.innerHTML = tasks.slice(0, 8).map((task) => `
    <div class="task-item">
      <span class="task-status ${escapeHtml(task.status)}">${escapeHtml(task.status)}</span>
      <strong>${escapeHtml(task.task_type)}</strong>
      <p>${escapeHtml(getDisplayText(task, "title") || task.task_id)}</p>
    </div>
  `).join("") || document.querySelector("#emptyTemplate").innerHTML;
}

function renderAnnotationVariant(annotation, language) {
  const variant = getVariant(annotation, language);
  if (!variant) return "";
  return `
    <div class="language-block" lang="${escapeHtml(language)}">
      <div class="language-label"><span>${escapeHtml(LANGUAGE_LABELS[language] ?? language)}</span><span>${escapeHtml(annotation.translation_status)}</span></div>
      <h3>${escapeHtml(variant.title)}</h3>
      <p>${escapeHtml(variant.summary)}</p>
      <div class="note-block"><p>${escapeHtml(variant.explanation)}</p></div>
      <div class="note-block"><p><strong>Boundary: </strong>${escapeHtml(variant.boundary_notes)}</p></div>
    </div>
  `;
}

function renderAnnotations() {
  const segment = getActiveSegment();
  const annotations = state.annotations.filter((annotation) => annotation.segment_id === segment?.segment_id);
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
      <strong>${escapeHtml(message.role)} - ${escapeHtml(message.created_at)}</strong>
      ${blocks}
    </div>
  `;
}

function renderQuestions() {
  const segment = getActiveSegment();
  const baseMessages = (state.thread?.messages ?? []).filter((message) => !state.thread?.segment_id || state.thread.segment_id === segment?.segment_id);
  const localMessages = state.localTasks
    .filter((task) => task.segment_id === segment?.segment_id)
    .map((task) => ({
      role: "user",
      original_language: task.original_language,
      original_text: task.question,
      language_variants: task.language_variants,
      created_at: task.created_at
    }));
  const messages = [...localMessages, ...baseMessages];

  if (!messages.length) {
    dom.detailContent.innerHTML = document.querySelector("#emptyTemplate").innerHTML;
    return;
  }

  dom.detailContent.innerHTML = messages.map(renderMessage).join("");
}

function renderContract() {
  const copy = {
    en: [
      ["Canonical Translation", "Only approved translation-provider output is treated as official page content."],
      ["Language Variant", "Document, segment, annotation, question, and answer content are displayed through language variants."],
      ["Worker", "Codex currently orchestrates tasks; later workers must consume the same bilingual task/result contracts."],
      ["SQL", "Remote import remains paused until the bilingual tables are frozen in the schema draft."]
    ],
    zh: [
      ["Canonical Translation", "网页正式内容只使用已批准的 Translation Provider 输出。"],
      ["Language Variant", "文档、Segment、批注、问题和回答都通过语言变体显示。"],
      ["Worker", "Codex 当前负责任务编排；后续 Worker 必须消费同一套双语任务/结果契约。"],
      ["SQL", "远端导入仍暂停，等双语表在 schema 草稿中冻结后再接入。"]
    ]
  };
  const languages = state.languageMode === "both" ? ["en", "zh"] : [state.languageMode];
  dom.detailContent.innerHTML = languages.map((language) => `
    <ul class="contract-list" lang="${escapeHtml(language)}">
      ${copy[language].map(([title, body]) => `<li><strong>${escapeHtml(title)}</strong><p>${escapeHtml(body)}</p></li>`).join("")}
    </ul>
  `).join("");
}

function renderDetail() {
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.classList.toggle("is-active", tab.dataset.tab === state.activeTab);
  });

  if (state.activeTab === "annotations") renderAnnotations();
  if (state.activeTab === "questions") renderQuestions();
  if (state.activeTab === "contract") renderContract();
}

function render() {
  if (!state.document) return;
  renderLanguageControls();
  renderDocPanel();
  renderSections();
  renderSegments();
  renderActiveHeader();
  renderQueue();
  renderDetail();
  renderMobilePanel();
}

function moveSegment(delta) {
  const segments = getAllSegments();
  const currentIndex = segments.findIndex((segment) => segment.segment_id === state.activeSegmentId);
  const next = segments[currentIndex + delta];
  if (next) setActiveSegment(next.segment_id);
}

function createLocalTask(question) {
  const segment = getActiveSegment();
  const now = new Date().toISOString();
  const idSeed = Math.random().toString(16).slice(2, 10);
  const originalLanguage = state.languageMode === "en" ? "en" : "zh";
  const title = originalLanguage === "en" ? `Question for ${segment.anchor_key}` : `${segment.anchor_key} 的问题`;
  const task = {
    task_id: `local-${Date.now()}-${idSeed}`,
    task_type: "answer_question",
    status: "queued",
    original_language: originalLanguage,
    question,
    document_id: state.document.document_id,
    version_id: state.document.version_id,
    segment_id: segment.segment_id,
    created_at: now,
    language_variants: {
      [originalLanguage]: {
        title,
        body: question
      }
    }
  };
  state.localTasks.unshift(task);
  saveLocalTasks();
}

async function init() {
  try {
    const [documentData, annotationData, threadData, taskData] = await Promise.all([
      loadJson(DATA_PATHS.document),
      loadJson(DATA_PATHS.annotations),
      loadJson(DATA_PATHS.thread),
      loadJson(DATA_PATHS.tasks)
    ]);

    state.document = documentData;
    state.annotations = annotationData.annotations;
    state.thread = threadData;
    state.tasks = taskData.tasks;
    state.activeSegmentId = getAllSegments()[0]?.segment_id ?? null;
    state.languageMode = readLanguageMode();
    loadLocalTasks();
    render();
  } catch (error) {
    dom.segmentList.innerHTML = `<div class="empty-state"><strong>Load failed</strong><span>${escapeHtml(error.message)}</span></div>`;
  }
}

dom.segmentSearch.addEventListener("input", (event) => {
  state.search = event.target.value;
  renderSegments();
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

dom.questionForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const question = dom.questionInput.value.trim();
  if (!question || !getActiveSegment()) return;
  createLocalTask(question);
  dom.questionInput.value = "";
  state.activeTab = "questions";
  state.mobilePanel = "questions";
  render();
});

dom.clearLocalTasks.addEventListener("click", () => {
  state.localTasks = [];
  saveLocalTasks();
  render();
});

init();