const upload = document.querySelector("#artUpload");
const previewImage = document.querySelector("#previewImage");
const previewWindow = document.querySelector("#previewWindow");
const qualityBox = document.querySelector("#qualityBox");
const scaleRange = document.querySelector("#scaleRange");
const rotateRange = document.querySelector("#rotateRange");
const shirtColor = document.querySelector("#shirtColor");
const form = document.querySelector("#requestForm");
const samplePicker = document.querySelector("#samplePicker");

if (form && previewImage && previewWindow) {
  const samples = [
    {
      key: "birthday",
      title: "Birthday 2026 Shirt",
      image: "assets/ui-slices/sample-birthday.png",
      preview: "assets/ui-slices/sample-birthday.png",
    },
    {
      key: "class",
      title: "Class Memories Shirt",
      image: "assets/ui-slices/sample-class.png",
      preview: "assets/ui-slices/preview-shirt.png",
    },
    {
      key: "teacher",
      title: "Teacher Thank You Card",
      image: "assets/ui-slices/sample-teacher.png",
      preview: "assets/ui-slices/sample-teacher.png",
    },
    {
      key: "family",
      title: "Family Matching Shirt",
      image: "assets/ui-slices/sample-family.png",
      preview: "assets/ui-slices/sample-family.png",
    },
  ];

  const state = {
    fileName: "Class Memories Shirt",
    imageWidth: 0,
    imageHeight: 0,
  };

  function updatePreviewTransform() {
    previewWindow.style.setProperty("--preview-scale", Number(scaleRange.value) / 100);
    previewWindow.style.setProperty("--preview-rotate", `${Number(rotateRange.value)}deg`);
  }

  function updateQuality(file, image) {
    state.fileName = file?.name || state.fileName;
    state.imageWidth = image?.naturalWidth || 0;
    state.imageHeight = image?.naturalHeight || 0;

    if (!file || !image) {
      qualityBox.className = "quality";
      qualityBox.innerHTML = "<strong>Selected sample</strong><p>This is a sample preview. Final artwork can be adjusted before making it.</p>";
      return;
    }

    const width = image.naturalWidth;
    const height = image.naturalHeight;
    const shortest = Math.min(width, height);
    const estimatedDpi = Math.round(width / 10);
    const sizeMb = file.size / 1024 / 1024;

    qualityBox.className = "quality";
    let status = "Artwork check: low resolution";
    if (width >= 3000 && height >= 3000) {
      qualityBox.classList.add("good");
      status = "Artwork check: print ready";
    } else if (shortest >= 1400) {
      qualityBox.classList.add("warn");
      status = "Artwork check: usable";
    } else {
      qualityBox.classList.add("bad");
    }

    qualityBox.innerHTML = `<strong>${status}</strong><p>${width} x ${height}px, ${sizeMb.toFixed(1)} MB. Estimated ${estimatedDpi} DPI for a 10 inch wide print.</p>`;
  }

  function selectSample(sample, button) {
    document.querySelectorAll("[data-sample]").forEach((item) => item.classList.remove("active"));
    if (button) button.classList.add("active");
    state.fileName = sample.title;
    previewImage.src = sample.preview;
    previewImage.alt = sample.title;
    scaleRange.value = 100;
    rotateRange.value = 0;
    updatePreviewTransform();
    updateQuality(null, null);
  }

  function renderSamplePicker() {
    const querySample = new URLSearchParams(window.location.search).get("sample") || "class";
    let initialButton = null;
    let initialSample = samples.find((sample) => sample.key === querySample) || samples[1];

    samples.forEach((sample) => {
      const picker = document.createElement("button");
      picker.type = "button";
      picker.dataset.sample = sample.key;
      picker.innerHTML = `<img src="${sample.image}" alt="${sample.title}">`;
      picker.addEventListener("click", () => selectSample(sample, picker));
      samplePicker.appendChild(picker);

      if (sample.key === initialSample.key) {
        initialButton = picker;
      }
    });

    selectSample(initialSample, initialButton);
  }

  upload.addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const image = new Image();
    image.onload = () => updateQuality(file, image);
    const url = URL.createObjectURL(file);
    image.src = url;
    previewImage.src = url;
    previewImage.alt = file.name;
    document.querySelectorAll("[data-sample]").forEach((item) => item.classList.remove("active"));
  });

  scaleRange.addEventListener("input", updatePreviewTransform);
  rotateRange.addEventListener("input", updatePreviewTransform);
  shirtColor.addEventListener("input", (event) => {
    previewWindow.style.background = `linear-gradient(180deg, ${event.target.value}, #fffaf2)`;
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const size = document.querySelector("#shirtSize").value;
    const quantity = document.querySelector("#quantity").value;
    const email = document.querySelector("#email").value.trim();
    const telegram = document.querySelector("#telegram").value.trim();
    const notes = document.querySelector("#notes").value.trim();
    const subject = encodeURIComponent("Freya's Family Creations idea");
    const body = encodeURIComponent(
      [
        "Freya's Family Creations idea",
        "",
        `Size: ${size}`,
        `Quantity: ${quantity}`,
        `Email: ${email || "Not provided"}`,
        `Telegram: ${telegram || "Not provided"}`,
        `Artwork or sample: ${state.fileName}`,
        state.imageWidth ? `Artwork size: ${state.imageWidth} x ${state.imageHeight}px` : "",
        `Preview scale: ${scaleRange.value}%`,
        `Preview rotation: ${rotateRange.value} degrees`,
        "",
        "Notes:",
        notes || "None",
        "",
        "Please attach the original artwork file when sending this email.",
      ]
        .filter(Boolean)
        .join("\n"),
    );
    window.location.href = `mailto:hello@zeror.ca?subject=${subject}&body=${body}`;
  });

  renderSamplePicker();
  updatePreviewTransform();
}
