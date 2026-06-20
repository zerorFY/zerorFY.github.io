const DATA_PATHS = {
  document: "./data/document.sample.json",
  annotations: "./data/annotations.sample.json",
  thread: "./data/thread.sample.json",
  tasks: "./data/tasks.sample.json"
};

const LOCAL_TASK_KEY = "pls.localTasks.v1";

const state = {
  document: null,
  annotations: [],
  thread: null,
  tasks: [],
  localTasks: [],
  activeSegmentId: null,
  activeTab: "annotations",
  search: ""
};

const dom = {
  versionBadge: document.querySelector("#versionBadge"),
  docTitle: document.querySelector("#docTitle"),
  segmentCount: document.querySelector("#segmentCount"),
  annotationCount: document.querySelector("#annotationCount"),
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
  clearLocalTasks: document.querySelector("#clearLocalTasks")
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

function getAllSegments() {
  if (!state.document) return [];
  return state.document.sections.flatMap((section) =>
    section.segments.map((segment) => ({ ...segment, sectionTitle: section.title, sectionId: section.section_id }))
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
}

function renderDocPanel() {
  const segments = getAllSegments();
  dom.versionBadge.textContent = state.document.version_label;
  dom.docTitle.textContent = state.document.title;
  dom.segmentCount.textContent = String(segments.length);
  dom.annotationCount.textContent = String(state.annotations.length);
}

function renderSections() {
  const activeSegment = getActiveSegment();
  dom.sectionList.innerHTML = state.document.sections.map((section) => {
    const isActive = activeSegment?.sectionId === section.section_id;
    return `
      <button class="section-button ${isActive ? "is-active" : ""}" type="button" data-section-id="${escapeHtml(section.section_id)}">
        <span>${escapeHtml(section.title)}</span>
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

function renderSegments() {
  const query = state.search.trim().toLowerCase();
  const segments = getAllSegments().filter((segment) => {
    if (!query) return true;
    return [segment.anchor_key, segment.title, segment.text_content, segment.sectionTitle]
      .join(" ")
      .toLowerCase()
      .includes(query);
  });

  if (segments.length === 0) {
    dom.segmentList.innerHTML = document.querySelector("#emptyTemplate").innerHTML;
    return;
  }

  dom.segmentList.innerHTML = segments.map((segment, index) => {
    const active = segment.segment_id === state.activeSegmentId;
    const annotationTotal = state.annotations.filter((annotation) => annotation.segment_id === segment.segment_id).length;
    return `
      <section class="segment ${active ? "is-active" : ""}" data-segment-id="${escapeHtml(segment.segment_id)}">
        <button class="segment-index icon-button" type="button" title="Select segment ${escapeHtml(segment.anchor_key)}" aria-label="Select segment ${escapeHtml(segment.anchor_key)}">${String(index + 1).padStart(2, "0")}</button>
        <div class="segment-body">
          <h3>${escapeHtml(segment.title)}</h3>
          <p>${escapeHtml(segment.text_content)}</p>
          <div class="segment-meta">
            <span>${escapeHtml(segment.anchor_key)}</span>
            <span>${escapeHtml(segment.sectionTitle)}</span>
            <span>${annotationTotal} notes</span>
          </div>
        </div>
      </section>
    `;
  }).join("");

  dom.segmentList.querySelectorAll(".segment").forEach((element) => {
    element.addEventListener("click", () => setActiveSegment(element.dataset.segmentId));
  });
}

function renderActiveHeader() {
  const segment = getActiveSegment();
  dom.activeSegmentTitle.textContent = segment ? `${segment.anchor_key} - ${segment.title}` : "No segment selected";
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
      <p>${escapeHtml(task.title || task.task_id)}</p>
    </div>
  `).join("") || document.querySelector("#emptyTemplate").innerHTML;
}

function renderAnnotations() {
  const segment = getActiveSegment();
  const annotations = state.annotations.filter((annotation) => annotation.segment_id === segment?.segment_id);
  if (!segment || annotations.length === 0) {
    dom.detailContent.innerHTML = document.querySelector("#emptyTemplate").innerHTML;
    return;
  }

  dom.detailContent.innerHTML = annotations.map((annotation) => `
    <article class="annotation-card">
      <h3>${escapeHtml(annotation.title)}</h3>
      <p>${escapeHtml(annotation.summary)}</p>
      <div class="note-block"><p>${escapeHtml(annotation.explanation)}</p></div>
      <div class="note-block"><p><strong>Boundary: </strong>${escapeHtml(annotation.boundary_notes)}</p></div>
    </article>
  `).join("");
}

function renderQuestions() {
  const segment = getActiveSegment();
  const baseMessages = state.thread?.messages ?? [];
  const localMessages = state.localTasks
    .filter((task) => task.segment_id === segment?.segment_id)
    .map((task) => ({ role: "user", body: task.question, created_at: task.created_at }));
  const messages = [...localMessages, ...baseMessages];

  if (!messages.length) {
    dom.detailContent.innerHTML = document.querySelector("#emptyTemplate").innerHTML;
    return;
  }

  dom.detailContent.innerHTML = messages.map((message) => `
    <div class="message">
      <strong>${escapeHtml(message.role)} - ${escapeHtml(message.created_at)}</strong>
      <p>${escapeHtml(message.body)}</p>
    </div>
  `).join("");
}

function renderContract() {
  dom.detailContent.innerHTML = `
    <ul class="contract-list">
      <li><strong>Task Package</strong><p>Maps to <code>pls_tasks.input_package_json</code>; currently simulated by local-json queue.</p></li>
      <li><strong>Model Result</strong><p>Structured output maps to <code>pls_model_results</code>; raw output is saved through Artifact.</p></li>
      <li><strong>Worker</strong><p>Current adapter is Codex; later replaceable by Python or service Worker.</p></li>
      <li><strong>SQL</strong><p>Remote import is paused; local schema has 18 frozen tables.</p></li>
    </ul>
  `;
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
  renderDocPanel();
  renderSections();
  renderSegments();
  renderActiveHeader();
  renderQueue();
  renderDetail();
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
  const task = {
    task_id: `local-${Date.now()}-${idSeed}`,
    task_type: "answer_question",
    status: "queued",
    title: `Question for ${segment.anchor_key}`,
    question,
    document_id: state.document.document_id,
    version_id: state.document.version_id,
    segment_id: segment.segment_id,
    created_at: now
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

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    state.activeTab = tab.dataset.tab;
    renderDetail();
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
  render();
});

dom.clearLocalTasks.addEventListener("click", () => {
  state.localTasks = [];
  saveLocalTasks();
  render();
});

init();

