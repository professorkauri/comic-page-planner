const scriptInput = document.getElementById("scriptInput");
const categoriesInput = document.getElementById("categoriesInput");
const layoutCanvas = document.getElementById("layoutCanvas");
const layoutTitle = document.getElementById("layoutTitle");
const planningPanel = document.querySelector(".planning-panel");

const scriptingPanel = document.getElementById("scriptingPanel");
const settingsPanel = document.getElementById("settingsPanel");
const togglePlanningBtn = document.getElementById("togglePlanning");

const openScriptingBtn = document.getElementById("openScripting");
const openSettingsBtn = document.getElementById("openSettings");

function setActivePanel(panelName) {
  const isCollapsed = planningPanel.classList.contains("collapsed");

  if (isCollapsed) {
    planningPanel.classList.remove("collapsed");
    togglePlanningBtn.textContent = "⟨";
    togglePlanningBtn.title = "Collapse Planning Panel";
    togglePlanningBtn.setAttribute("aria-label", "Collapse Planning Panel");
  }

  const isScripting = panelName === "scripting";
  const isSettings = panelName === "settings";

  scriptingPanel.classList.toggle("active", isScripting);
  settingsPanel.classList.toggle("active", isSettings);

  openScriptingBtn.classList.toggle("active", isScripting);
  openSettingsBtn.classList.toggle("active", isSettings);
}

openScriptingBtn.addEventListener("click", () => {
  setActivePanel("scripting");
});

openSettingsBtn.addEventListener("click", () => {
  setActivePanel("settings");
});

togglePlanningBtn.addEventListener("click", () => {
  const isCollapsed = planningPanel.classList.toggle("collapsed");

  if (isCollapsed) {
    scriptingPanel.classList.remove("active");
    settingsPanel.classList.remove("active");
    openScriptingBtn.classList.remove("active");
    openSettingsBtn.classList.remove("active");

    togglePlanningBtn.textContent = "⮚";
    togglePlanningBtn.title = "Open Planning Panel";
    togglePlanningBtn.setAttribute("aria-label", "Open Planning Panel");
  } else {
    togglePlanningBtn.textContent = "⮘";
    togglePlanningBtn.title = "Collapse Planning Panel";
    togglePlanningBtn.setAttribute("aria-label", "Collapse Planning Panel");

    setActivePanel("scripting");
  }
});

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, function (char) {
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#039;"
    };
    return map[char];
  });
}

function parseCategories() {
  const lines = categoriesInput.value
    .split("\n")
    .map(line => line.trim())
    .filter(Boolean);

  const categories = {};

  for (const line of lines) {
    const parts = line.split("|");
    const name = (parts[0] || "").trim();
    const colour = (parts[1] || "").trim();

    if (name) {
      categories[name.toLowerCase()] = {
        name,
        colour: colour || "#e5e5e5"
      };
    }
  }

  return categories;
}

function parseScript() {
  const lines = scriptInput.value.split("\n");
  const pages = [];
  let comicTitle = "";
  let currentPage = null;

  lines.forEach((rawLine, index) => {
    const line = rawLine.trim();

    if (!line) {
      return;
    }

    if (index === 0) {
      comicTitle = line;
      return;
    }

    const pageMatch = line.match(/^--\s*(.+?)(?:\s*\|\s*(.*?)\s*\|\s*(.*))?$/);

    if (pageMatch) {
      if (currentPage) {
        pages.push(currentPage);
      }

      const [, title, category, feeling] = pageMatch;

      currentPage = {
        number: "",
        title: (title || "").trim(),
        category: (category || "").trim(),
        feeling: (feeling || "").trim(),
        description: ""
      };

      return;
    }

    if (currentPage) {
      currentPage.description += (currentPage.description ? "\n" : "") + line;
    }
  });

  if (currentPage) {
    pages.push(currentPage);
  }

  pages.forEach((page, index) => {
    page.number = String(index + 1);
  });

  return {
    comicTitle,
    pages
  };
}

function getPageColour(page, categories) {
  const key = page.category.toLowerCase();
  return categories[key]?.colour || "#efefef";
}

function createPageHtml(page, categories, previousPage = null) {
  const bgColour = getPageColour(page, categories);
  const safeNumber = escapeHtml(page.number || "");
  const safeTitle = escapeHtml(page.title || "Untitled");
  const safeFeeling = escapeHtml(page.feeling || "");
  const safeCategory = escapeHtml(page.category || "");
  const safeDescription = escapeHtml(page.description || "").replace(/\n/g, "<br>");

  const currentCategory = (page.category || "").trim().toLowerCase();
  const previousCategory = previousPage ? (previousPage.category || "").trim().toLowerCase() : "";
  const showCategory = currentCategory && currentCategory !== previousCategory;

  return `
    <div class="page" style="background:${bgColour};">
      <div class="page-info-box">
        ${showCategory ? `<div class="page-category" style="background:${bgColour};">${safeCategory}</div>` : ""}
        <div class="page-title">${safeTitle}</div>
        ${safeDescription ? `<div class="page-description">${safeDescription}</div>` : ""}
      </div>
      <div class="page-feeling"><span class="page-number">${safeNumber}</span>${safeFeeling ? `${safeFeeling}` : ""}</div>
    </div>
  `;
}

function createSpreadBlock(label, leftPage, rightPage, categories, leftPreviousPage = null, rightPreviousPage = null) {
  return `
    <section class="spread-block">
      <div class="spread-label">${escapeHtml(label)}</div>
      <div class="spread">
        <div class="page-slot ${leftPage ? "" : "empty"}">
          ${leftPage ? createPageHtml(leftPage, categories, leftPreviousPage) : ""}
        </div>
        <div class="page-slot ${rightPage ? "" : "empty"}">
          ${rightPage ? createPageHtml(rightPage, categories, rightPreviousPage) : ""}
        </div>
      </div>
    </section>
  `;
}

function renderLayout() {
  const categories = parseCategories();
  const { comicTitle, pages } = parseScript();

  const titleText = comicTitle
    ? `Layout: <b>${comicTitle}</b> <span>(${pages.length} pages)</span>`
    : `Layout (${pages.length} pages)`;

  layoutTitle.innerHTML = titleText;

  if (!pages.length) {
    layoutCanvas.innerHTML = `
      <div class="empty-state">
        Add some page lines in the Scripting panel to begin laying out your comic.
      </div>
    `;
    return;
  }

  let html = "";

  const firstPage = pages[0];

  html += `
    <section class="spread-block">
      <div class="spread-label">Opening Page</div>
      <div class="spread single-right">
        <div class="page-slot empty"></div>
        <div class="page-slot">${createPageHtml(firstPage, categories, null)}</div>
      </div>
    </section>
  `;

  let spreadCount = 1;
  for (let i = 1; i < pages.length; i += 2) {
    const leftPage = pages[i] || null;
    const rightPage = pages[i + 1] || null;

    const leftPreviousPage = pages[i - 1] || null;
    const rightPreviousPage = pages[i] || null;

    html += createSpreadBlock(
      `Spread ${spreadCount}`,
      leftPage,
      rightPage,
      categories,
      leftPreviousPage,
      rightPreviousPage
    );
    spreadCount++;
  }

  layoutCanvas.innerHTML = html;
}

let renderQueued = false;

function queueRender() {
  if (renderQueued) {
    return;
  }

  renderQueued = true;

  requestAnimationFrame(() => {
    renderLayout();
    renderQueued = false;
  });
}

scriptInput.addEventListener("input", queueRender);
categoriesInput.addEventListener("input", queueRender);

setActivePanel("scripting");
renderLayout();