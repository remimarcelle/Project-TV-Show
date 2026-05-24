// You can edit ALL of the code here
const episodeCache = {};

/**
 * Entry point for the app.
 * Fetches all shows, populates the show selector, and loads the first show's episodes.
 *
 * @return {Promise<void>}
 */
async function setup() {
  const allShows = await fetchAllShows();
  populateShowSelector(allShows);

  const showSelector = document.getElementById("show-selector");

  // Load the first show's episodes on initial page load
  await loadEpisodesForShow(showSelector.value);

  showSelector.addEventListener("change", async () => {
    await loadEpisodesForShow(showSelector.value);
  });
}

/**
 * Fetches and renders all episodes for the given show.
 * Resets the search input and rebuilds the episode selector + search handler.
 *
 * @param {string|number} showId - The TVMaze show id.
 * @return {Promise<void>}
 */
async function loadEpisodesForShow(showId) {
  document.getElementById("root").innerHTML = "<p>Loading episodes...</p>";
  document.getElementById("search").value = "";

  const episodes = await fetchEpisodesForShow(showId);

  setupSelector(episodes);
  setupSearch(episodes);
  makePageForEpisodes(episodes);
  updateEpisodeCount(episodes.length, episodes.length);
}

/**
 * Updates the "Displaying X/Y episodes" counter in the header.
 *
 * @param {number} shown - Number of episodes currently visible.
 * @param {number} total - Total number of episodes available.
 * @return {void}
 */
function updateEpisodeCount(shown, total) {
  const countDisplay = document.getElementById("episode-count");
  countDisplay.textContent = `Displaying ${shown}/${total} episodes`;
}

/**
 * Wires the search input to filter episodes by name or summary as the user types.
 * Uses .oninput to replace any previous handler (prevents listener stacking on show change).
 *
 * @param {Array<Object>} allEpisodes - The full list of episodes for the current show.
 * @return {void}
 */
function setupSearch(allEpisodes) {
  const searchInput = document.getElementById("search");

  searchInput.oninput = () => {
    const term = searchInput.value.toLowerCase();
    const filtered = allEpisodes.filter((ep) => {
      const name = ep.name ? ep.name.toLowerCase() : "";
      const summary = ep.summary ? ep.summary.toLowerCase() : "";
      return name.includes(term) || summary.includes(term);
    });
    makePageForEpisodes(filtered);
    updateEpisodeCount(filtered.length, allEpisodes.length);
  };
}

/**
 * Populates the episode dropdown with "Show all" plus one option per episode,
 * and wires the change handler to render the selected episode (or all).
 * Clears any previous options first.
 *
 * @param {Array<Object>} allEpisodes - The full list of episodes for the current show.
 * @return {void}
 */
function setupSelector(allEpisodes) {
  const selector = document.getElementById("episode-selector");
  selector.innerHTML = ""; // clear previous show's options

  const defaultOption = document.createElement("option");
  defaultOption.value = "all";
  defaultOption.textContent = "Show all episodes";
  selector.appendChild(defaultOption);

  allEpisodes.forEach((ep) => {
    const option = document.createElement("option");
    const code = formatEpisodeCode(ep.season, ep.number);
    option.value = ep.id;
    option.textContent = `${code} - ${ep.name}`;
    selector.appendChild(option);
  });

  selector.onchange = () => {
    if (selector.value === "all") {
      makePageForEpisodes(allEpisodes);
      updateEpisodeCount(allEpisodes.length, allEpisodes.length);
      return;
    }
    const selectedId = Number(selector.value);
    const selectedEpisode = allEpisodes.find((ep) => ep.id === selectedId);
    if (selectedEpisode) {
      makePageForEpisodes([selectedEpisode]);
      updateEpisodeCount(1, allEpisodes.length);
    }
  };
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
    const imgSrc = episode.image?.medium ?? "";
    const summary = episode.summary ?? "";

    card.innerHTML = `
      <img src="${imgSrc}" alt="${episode.name}" />
      <div class="episode-info">
        <h2>${episode.name}</h2>
        <p class="episode-code">${code}</p>
        <div class="episode-summary">${summary}</div>
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

/**
 * Fetches the list of all shows from TVMaze and sorts them alphabetically by name.
 *
 * @return {Promise<Array<Object>>} Resolves with the sorted shows, or [] on failure.
 */
async function fetchAllShows() {
  try {
    const response = await fetch("https://api.tvmaze.com/shows");
    if (!response.ok) {
      throw new Error("Failed to load shows");
    }
    const shows = await response.json();
    shows.sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
    );
    return shows;
  } catch (error) {
    console.error(error);
    return [];
  }
}

/**
 * Populates the show selector dropdown with one option per show.
 *
 * @param {Array<{ id: number, name: string }>} shows - Shows to display.
 * @return {void}
 */
function populateShowSelector(shows) {
  const showSelector = document.getElementById("show-selector");
  showSelector.innerHTML = "";

  shows.forEach((show) => {
    const option = document.createElement("option");
    option.value = show.id;
    option.textContent = show.name;
    showSelector.appendChild(option);
  });
}

/**
 * Fetches episodes for a given show, with in-memory caching to avoid repeat requests.
 *
 * @param {string|number} showId - The TVMaze show id.
 * @return {Promise<Array<Object>>} Resolves with the show's episodes, or [] on failure.
 */
async function fetchEpisodesForShow(showId) {
  if (episodeCache[showId]) {
    return episodeCache[showId];
  }
  try {
    const response = await fetch(`https://api.tvmaze.com/shows/${showId}/episodes`);
    if (!response.ok) {
      throw new Error("Failed to load episodes");
    }
    const episodes = await response.json();
    episodeCache[showId] = episodes;
    return episodes;
  } catch (error) {
    console.error(error);
    return [];
  }
}

window.onload = setup;