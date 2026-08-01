const previewKey = "hasibul-portfolio-live-preview";
const year = document.querySelector("#year");

if (year) {
  year.textContent = new Date().getFullYear();
}

function splitValue(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (!value) return [];
  return String(value)
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function setText(key, value) {
  if (!value) return;
  document.querySelectorAll(`[data-portfolio="${key}"]`).forEach((element) => {
    element.textContent = value;
  });
}

function setLink(key, href) {
  if (!href) return;
  document.querySelectorAll(`[data-portfolio-link="${key}"]`).forEach((element) => {
    element.href = href;
  });
}

function createCard(title, body, meta, href) {
  const article = document.createElement("article");
  article.className = "project-card";

  if (meta || href) {
    const top = document.createElement("div");
    top.className = "project-meta";

    const tag = document.createElement("span");
    tag.textContent = meta || "Portfolio item";
    top.append(tag);

    if (href) {
      const link = document.createElement("a");
      link.href = href;
      link.textContent = "Link";
      top.append(link);
    }

    article.append(top);
  }

  const heading = document.createElement("h3");
  heading.textContent = title;
  const paragraph = document.createElement("p");
  paragraph.textContent = body;
  article.append(heading, paragraph);

  return article;
}

function parseItem(line, fallbackMeta) {
  const url = line.match(/https?:\/\/\S+/)?.[0] || "";
  const clean = line.replace(url, "").trim();
  const [rawTitle, ...rest] = clean.split(":");
  const title = rawTitle?.trim() || "Portfolio item";
  const body = rest.join(":").trim() || clean || "Details to be added.";

  return { title, body, meta: fallbackMeta, href: url };
}

function renderCardList(selector, items, fallbackMeta) {
  const container = document.querySelector(selector);
  const lines = splitValue(items);
  if (!container || lines.length === 0) return;

  container.replaceChildren();
  lines.forEach((line, index) => {
    const item = parseItem(line, fallbackMeta);
    const card = createCard(item.title, item.body, item.meta, item.href);
    if (index === 0 && selector.includes("projects")) card.classList.add("featured");
    container.append(card);
  });
}

function renderPortfolioData(data) {
  const basic = data.basic || {};
  const links = data.links || {};
  const media = data.media || {};
  const academic = data.academic || {};
  const targets = data.targets || {};

  setText("name", basic.fullName);
  setText("title", basic.title);
  setText("summary", basic.summary);
  setText("jobTargets", splitValue(targets.jobs).join(", "));
  setText("phdTargets", splitValue(targets.phdFunding).join(", "));
  setText("researchSummary", splitValue(academic.researchInterests).join(", "));

  const heroTitle = basic.fullName
    ? `${basic.fullName} builds evidence for software roles and graduate research.`
    : "";
  setText("heroTitle", heroTitle);

  const contactParts = [
    basic.email ? `Email: ${basic.email}.` : "",
    media.cvUrl ? "CV is linked for academic and hiring review." : "",
    "GitHub remains the primary source of project evidence.",
  ].filter(Boolean);
  setText("contactNote", contactParts.join(" "));

  setLink("github", links.github);
  setLink("githubRepos", links.github ? `${links.github.replace(/\/$/, "")}?tab=repositories` : "");

  const profileImage = document.querySelector("[data-portfolio-image='profile']");
  if (profileImage && media.profilePhotoUrl) {
    profileImage.src = media.profilePhotoUrl;
    profileImage.alt = `${basic.fullName || "Profile"} photo`;
  }

  renderCardList("[data-portfolio-list='research']", academic.researchInterests, "Research interest");
  renderCardList("[data-portfolio-list='projects']", data.projects, "Project");

  const skills = [
    ...(splitValue(academic.coursework).length ? [`Coursework: ${splitValue(academic.coursework).join(", ")}`] : []),
    ...(splitValue(academic.achievements).length ? [`Achievements: ${splitValue(academic.achievements).join(", ")}`] : []),
    ...(splitValue(academic.publications).length ? [`Publications / writing: ${splitValue(academic.publications).join(", ")}`] : []),
  ];
  renderCardList("[data-portfolio-list='skills']", skills, "Evidence");
}

async function loadPortfolioData() {
  const preview = localStorage.getItem(previewKey);
  if (preview) {
    try {
      renderPortfolioData(JSON.parse(preview));
      return;
    } catch {
      localStorage.removeItem(previewKey);
    }
  }

  try {
    const response = await fetch("data/portfolio-data.json", { cache: "no-store" });
    if (response.ok) renderPortfolioData(await response.json());
  } catch {
    // Static fallback content remains visible when no data file exists.
  }
}

const sections = [...document.querySelectorAll("main section[id]")];
const navLinks = [...document.querySelectorAll(".nav-links a")];

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      navLinks.forEach((link) => {
        link.classList.toggle("is-active", link.getAttribute("href") === `#${entry.target.id}`);
      });
    });
  },
  { rootMargin: "-40% 0px -50% 0px" }
);

sections.forEach((section) => observer.observe(section));
loadPortfolioData();
