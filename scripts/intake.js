const storageKey = "hasibul-portfolio-intake";
const form = document.querySelector("#portfolio-intake");
const preview = document.querySelector("#json-preview");
const statusText = document.querySelector("#save-status");
const uploadPreview = document.querySelector("#upload-preview");
const downloadButton = document.querySelector("#download-json");
const copyButton = document.querySelector("#copy-json");
const clearButton = document.querySelector("#clear-draft");
const previewButton = document.querySelector("#preview-portfolio");
const importInput = document.querySelector("#import-json");
const fileInputs = [...document.querySelectorAll("[data-file-input]")];

const fileState = {};
const previewKey = "hasibul-portfolio-live-preview";
const maxInlineImageSize = 1500000;

function splitLines(value) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (!value) return [];

  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function toTextLines(value) {
  return splitLines(value).join("\n");
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
      profilePhotoPreviewDataUrl: fileState.profilePhotoFile?.[0]?.previewDataUrl || "",
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

function readImageDataUrl(file) {
  return new Promise((resolve) => {
    if (!file.type.startsWith("image/") || file.size > maxInlineImageSize) {
      resolve("");
      return;
    }

    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(reader.result));
    reader.addEventListener("error", () => resolve(""));
    reader.readAsDataURL(file);
  });
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
    const previewNote = file.previewDataUrl ? " - available for browser preview" : "";
    item.append(strong, `: ${file.name} (${Math.round(file.size / 1024)} KB)${previewNote}`);
    list.append(item);
  });
  uploadPreview.append(list);

  const imagePreview = fileState.profilePhotoFile?.[0]?.previewDataUrl;
  if (imagePreview) {
    const image = document.createElement("img");
    image.className = "selected-photo-preview";
    image.src = imagePreview;
    image.alt = "Selected profile preview";
    uploadPreview.append(image);
  }
}

async function updateFileState(input) {
  const files = await Promise.all(
    [...input.files].map(async (file) => ({
      name: file.name,
      type: file.type,
      size: file.size,
      lastModified: new Date(file.lastModified).toISOString(),
      previewDataUrl: input.name === "profilePhotoFile" ? await readImageDataUrl(file) : "",
    }))
  );

  if (files.length > 0) {
    fileState[input.name] = files;
    if (input.name === "profilePhotoFile" && !files[0].previewDataUrl) {
      statusText.textContent = "Photo selected. Add a URL/path for publish, or choose an image under 1.5 MB for browser preview.";
    }
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
  link.download = "portfolio-data.json";
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
previewButton.addEventListener("click", () => {
  saveDraft();
  localStorage.setItem(previewKey, preview.value);
  statusText.textContent = "Preview data saved";
  window.open("index.html?preview=1", "_blank");
});

importInput.addEventListener("change", async () => {
  const [file] = importInput.files;
  if (!file) return;

  const imported = JSON.parse(await file.text());
  const values = {
    fullName: imported.basic?.fullName || "",
    title: imported.basic?.title || "",
    location: imported.basic?.location || "",
    email: imported.basic?.email || "",
    phone: imported.basic?.phone || "",
    summary: imported.basic?.summary || "",
    github: imported.links?.github || "",
    linkedin: imported.links?.linkedin || "",
    scholar: imported.links?.googleScholar || "",
    importantLinks: toTextLines(imported.links?.importantLinks),
    profilePhotoUrl: imported.media?.profilePhotoUrl || "",
    cvUrl: imported.media?.cvUrl || "",
    education: imported.academic?.education || "",
    researchInterests: toTextLines(imported.academic?.researchInterests),
    coursework: toTextLines(imported.academic?.coursework),
    publications: toTextLines(imported.academic?.publications),
    achievements: toTextLines(imported.academic?.achievements),
    jobTargets: toTextLines(imported.targets?.jobs),
    phdTargets: toTextLines(imported.targets?.phdFunding),
    projects: toTextLines(imported.projects),
    notes: imported.notes || "",
  };

  Object.entries(values).forEach(([key, value]) => {
    const field = form.elements[key];
    if (field) field.value = value;
  });

  saveDraft();
  statusText.textContent = "JSON imported";
});

clearButton.addEventListener("click", () => {
  localStorage.removeItem(storageKey);
  localStorage.removeItem(previewKey);
  form.reset();
  Object.keys(fileState).forEach((key) => delete fileState[key]);
  renderFilePreview();
  statusText.textContent = "Draft cleared";
  updatePreview();
});

loadDraft();
