//You can edit ALL of the code here
const API_URL = "https://api.tvmaze.com/shows/82/episodes"; // api url constant at top of 
// file

/**
 * Entry point for the app.
 * Fetches all episodes and renders them to the page.
 *
 * @return {void}
 */
function setup() {
  const allEpisodes = getAllEpisodes();

  makePageForEpisodes(allEpisodes);
  setupSearch(allEpisodes);
  setupSelector(allEpisodes);
  updateEpisodeCount(allEpisodes.length, allEpisodes.length);
}

function updateEpisodeCount(shown, total) {
  const countDisplay = document.getElementById("episode-count");
  countDisplay.textContent = `Displaying ${shown}/${total} episodes`;
}


function setupSearch(allEpisodes) {
  const searchInput = document.getElementById("search");

  searchInput.addEventListener("input", () => {
    const term = searchInput.value.toLowerCase();

    const filtered = allEpisodes.filter(ep =>
      ep.name.toLowerCase().includes(term) ||
      ep.summary.toLowerCase().includes(term)
    );

    makePageForEpisodes(filtered);
    updateEpisodeCount(filtered.length, allEpisodes.length);
  });
}

function setupSelector(allEpisodes) {
  const selector = document.getElementById("episode-selector");

  const defaultOption = document.createElement("option");
  defaultOption.value = "all";
  defaultOption.textContent = "Show all episodes";
  selector.appendChild(defaultOption);

  // Fill dropdown
  allEpisodes.forEach(ep => {
    const option = document.createElement("option");
    const code = formatEpisodeCode(ep.season, ep.number);
    option.value = ep.id;
    option.textContent = `${code} - ${ep.name}`;
    selector.appendChild(option);
  });

  // When user selects an episode
 selector.addEventListener("change", () => {
    if (selector.value === "all") {
      makePageForEpisodes(allEpisodes);
      updateEpisodeCount(allEpisodes.length, allEpisodes.length);
      return;
    }

    const selectedId = Number(selector.value);
    const selectedEpisode = allEpisodes.find(ep => ep.id === selectedId);

    makePageForEpisodes([selectedEpisode]);
    updateEpisodeCount(1, allEpisodes.length);
  });
}

/**
 * Formats a season and episode number into a zero-padded episode code.
 *
 * @param {number} season - The season number.
 * @param {number} episode - The episode number.
 * @return {string} Formatted code e.g. "S02E07".
 *
 * @example
 * formatEpisodeCode(2, 7) // returns "S02E07"
 */
function formatEpisodeCode(season, episode) {
  const s = String(season).padStart(2, "0");
  const e = String(episode).padStart(2, "0");
  return `S${s}E${e}`;
}

/**
 * Renders a list of episodes to the page as cards.
 * Clears any previously displayed episodes before rendering.
 *
 * @param {Array<{
 *   id: number,
 *   name: string,
 *   season: number,
 *   number: number,
 *   summary: string,
 *   image: { medium: string }
 * }>} episodeList - Array of episode objects from TVMaze.
 * @return {void}
 */
function makePageForEpisodes(episodeList) {
  const rootElem = document.getElementById("root");
  rootElem.innerHTML = "";

  const grid = document.createElement("div");
  grid.className = "episode-grid";

  for (const episode of episodeList) {
    const card = document.createElement("article");
    card.className = "episode-card";

    const code = formatEpisodeCode(episode.season, episode.number);

    card.innerHTML = `
      <img src="${episode.image?.medium ?? ""}" alt="${episode.name}" />
      <div class="episode-info">
        <h2>${episode.name}</h2>
        <p class="episode-code">${code}</p>
        <div class="episode-summary">${episode.summary ?? ""}</div>
      </div>
    `;

    grid.appendChild(card);
  }

  // TVMaze licensing requires attribution when using their data
  const attribution = document.createElement("footer");
  attribution.innerHTML = `Data originally from <a href="https://www.tvmaze.com/" target="_blank">TVMaze.com</a>`;
  attribution.className = "attribution";

  rootElem.appendChild(grid);
  rootElem.appendChild(attribution);
}

window.onload = setup;
