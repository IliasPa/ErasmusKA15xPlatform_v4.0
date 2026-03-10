document.addEventListener("DOMContentLoaded", function () {
  const platform = window.ErasmusFilters;
  const state = platform.createInitialState();
  const elements = {
    searchInput: document.getElementById("searchInput"),
    monthFilter: document.getElementById("monthFilter"),
    projectTypeFilter: document.getElementById("projectTypeFilter"),
    destinationFilter: document.getElementById("destinationFilter"),
    residenceFilter: document.getElementById("residenceFilter"),
    projectsGrid: document.getElementById("projectsGrid"),
    resultsCount: document.getElementById("resultsCount"),
    emptyState: document.getElementById("emptyState")
  };

  let allProjects = [];

  initialize().catch(function () {
    elements.resultsCount.textContent = "Unable to load projects.";
    elements.emptyState.hidden = false;
    elements.emptyState.querySelector("h2").textContent = "Project data could not be loaded.";
    elements.emptyState.querySelector("p").textContent = "Open the site through GitHub Pages or a local static server if your browser blocks local JSON access.";
  });

  async function initialize() {
    platform.populateCountrySelect(elements.residenceFilter, state.residence);

    allProjects = await platform.loadProjectsData();
    hydrateFilterOptions(allProjects);
    bindEvents();
    renderProjects();
  }

  function hydrateFilterOptions(projects) {
    const upcomingMonths = platform.getUpcomingMonths(13);

    platform.populateSelect(
      elements.monthFilter,
      upcomingMonths.map(function (monthOption) {
        return monthOption.label;
      }),
      "All",
      "all"
    );
    Array.from(elements.monthFilter.options).forEach(function (option, index) {
      if (index === 0) {
        return;
      }

      option.value = upcomingMonths[index - 1].value;
    });
    platform.populateSelect(
      elements.destinationFilter,
      platform.getUniqueValues(projects, "destination_country"),
      "All",
      "all"
    );

    elements.monthFilter.value = state.month;
    elements.projectTypeFilter.value = state.projectType;
    elements.destinationFilter.value = state.destination;
  }

  function bindEvents() {
    elements.searchInput.addEventListener("input", function (event) {
      state.search = event.target.value.trim();
      renderProjects();
    });

    elements.monthFilter.addEventListener("change", function (event) {
      state.month = event.target.value;
      renderProjects();
    });

    elements.projectTypeFilter.addEventListener("change", function (event) {
      state.projectType = event.target.value;
      renderProjects();
    });

    elements.destinationFilter.addEventListener("change", function (event) {
      state.destination = event.target.value;
      renderProjects();
    });

    elements.residenceFilter.addEventListener("change", function (event) {
      state.residence = event.target.value;
      platform.saveResidenceCountry(state.residence);
      renderProjects();
    });
  }

  function renderProjects() {
    const filteredProjects = platform.filterProjects(allProjects, state);
    elements.projectsGrid.innerHTML = filteredProjects.map(createProjectCard).join("");

    const totalProjects = filteredProjects.length;
    elements.resultsCount.textContent = totalProjects === 1 ? "1 project found" : totalProjects + " projects found";
    elements.emptyState.hidden = totalProjects !== 0;
  }

  function createProjectCard(project) {
    const location = project.location_city + ", " + project.destination_country;
    const dateRange = platform.formatProjectDateRange(project.start_date, project.end_date);

    return [
      '<a class="project-card" href="project.html?id=' + encodeURIComponent(project.id) + '" aria-label="View details for ' + escapeAttribute(project.title) + '">',
      '  <div class="project-card__meta">',
      '    <span class="pill">' + escapeHtml(project.ka_action) + '</span>',
      '    <span class="pill">' + escapeHtml(project.destination_country) + '</span>',
      "  </div>",
      '  <div class="project-card__content">',
      '    <h2>' + escapeHtml(project.title) + '</h2>',
      '    <p class="project-card__ngo">Hosted by ' + escapeHtml(project.hosting_ngo) + '</p>',
      '    <p class="project-card__summary">' + escapeHtml(project.summary) + '</p>',
      '    <div class="project-card__facts">',
      '      <p class="project-card__fact"><span class="project-card__icon" aria-hidden="true">📍</span><span>' + escapeHtml(location) + '</span></p>',
      '      <p class="project-card__fact"><span class="project-card__icon" aria-hidden="true">📅</span><span>' + escapeHtml(dateRange) + '</span></p>',
      "    </div>",
      "  </div>",
      "</a>"
    ].join("");
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function escapeAttribute(value) {
    return escapeHtml(value);
  }
});