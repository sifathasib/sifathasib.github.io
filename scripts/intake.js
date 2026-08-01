const storageKey = "hasibul-portfolio-intake";
const form = document.querySelector("#portfolio-intake");
const preview = document.querySelector("#json-preview");
const statusText = document.querySelector("#save-status");
const uploadPreview = document.querySelector("#upload-preview");
const downloadButton = document.querySelector("#download-json");
const copyButton = document.querySelector("#copy-json");
const clearButton = document.querySelector("#clear-draft");
const fileInputs = [...document.querySelectorAll("[data-file-input]")];

const fileState = {};

function splitLines(value) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function getFormData() {
  const data = Object.fromEntries(new FormData(form).entries());

  return {
    updatedAt: new Date().toISOString(),
    basic: {
      fullName: data.fullName || "",
      title: data.title || "",
      location: data.location || "",
      email: data.email || "",
      phone: data.phone || "",
      summary: data.summary || "",
    },
    links: {
      github: data.github || "",
      linkedin: data.linkedin || "",
      googleScholar: data.scholar || "",
      importantLinks: splitLines(data.importantLinks || ""),
    },
    media: {
      profilePhotoUrl: data.profilePhotoUrl || "",
      cvUrl: data.cvUrl || "",
      selectedFiles: fileState,
    },
    academic: {
      education: data.education || "",
      researchInterests: splitLines(data.researchInterests || ""),
      coursework: splitLines(data.coursework || ""),
      publications: splitLines(data.publications || ""),
      achievements: splitLines(data.achievements || ""),
    },
    targets: {
      jobs: splitLines(data.jobTargets || ""),
      phdFunding: splitLines(data.phdTargets || ""),
    },
    projects: splitLines(data.projects || ""),
    notes: data.notes || "",
  };
}

function updatePreview() {
  preview.value = JSON.stringify(getFormData(), null, 2);
}

function saveDraft() {
  const values = {};
  new FormData(form).forEach((value, key) => {
    if (value instanceof File) return;
    values[key] = value;
  });

  localStorage.setItem(storageKey, JSON.stringify(values));
  statusText.textContent = `Saved ${new Date().toLocaleString()}`;
  updatePreview();
}

function loadDraft() {
  const saved = localStorage.getItem(storageKey);
  if (!saved) {
    updatePreview();
    return;
  }

  const values = JSON.parse(saved);
  Object.entries(values).forEach(([key, value]) => {
    const field = form.elements[key];
    if (field) field.value = value;
  });

  statusText.textContent = "Draft loaded";
  updatePreview();
}

function renderFilePreview() {
  uploadPreview.replaceChildren();

  const label = document.createElement("span");
  label.className = "label";
  label.textContent = "Selected files";
  uploadPreview.append(label);

  const fileItems = Object.entries(fileState).flatMap(([field, files]) =>
    files.map((file) => ({ field, file }))
  );

  if (fileItems.length === 0) {
    const empty = document.createElement("p");
    empty.textContent = "No files selected yet.";
    uploadPreview.append(empty);
    return;
  }

  const list = document.createElement("ul");
  fileItems.forEach(({ field, file }) => {
    const item = document.createElement("li");
    const strong = document.createElement("strong");
    strong.textContent = field;
    item.append(strong, `: ${file.name} (${Math.round(file.size / 1024)} KB)`);
    list.append(item);
  });
  uploadPreview.append(list);
}

function updateFileState(input) {
  const files = [...input.files].map((file) => ({
    name: file.name,
    type: file.type,
    size: file.size,
    lastModified: new Date(file.lastModified).toISOString(),
  }));

  if (files.length > 0) {
    fileState[input.name] = files;
  } else {
    delete fileState[input.name];
  }

  renderFilePreview();
  updatePreview();
}

function downloadJson() {
  const blob = new Blob([preview.value], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "portfolio-intake.json";
  link.click();
  URL.revokeObjectURL(link.href);
}

async function copyJson() {
  await navigator.clipboard.writeText(preview.value);
  statusText.textContent = "JSON copied";
}

form.addEventListener("input", () => {
  saveDraft();
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  saveDraft();
});

fileInputs.forEach((input) => {
  input.addEventListener("change", () => updateFileState(input));
});

downloadButton.addEventListener("click", downloadJson);
copyButton.addEventListener("click", copyJson);
clearButton.addEventListener("click", () => {
  localStorage.removeItem(storageKey);
  form.reset();
  Object.keys(fileState).forEach((key) => delete fileState[key]);
  renderFilePreview();
  statusText.textContent = "Draft cleared";
  updatePreview();
});

loadDraft();
