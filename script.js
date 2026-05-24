// You can edit ALL of the code here
const episodeCache = {};
let allShowsCache = null; // level 500 -> caches /shows to avoid fetching the same data multiple times if setup() is called again for any reason

/**
 * Entry point for the app.
 * Fetches all shows, populates the show selector, wires the back button
 * and show-selector change handler, then lands on the shows listing view.
 *
 * CHANGED from Level 400:
 *  - No longer auto-loads the first show's episodes.
 *  - Wires the new back-to-shows button.
 *  - Show-selector change now drives showEpisodesView (was loadEpisodesForShow).
 *  - Calls showShowsView() to render the new landing view.
 *
 * @return {Promise<void>}
 */
async function setup() {
  const allShows = await fetchAllShows();
  populateShowSelector(allShows);

   // back-to-shows click returns to the shows listing
  document
    .getElementById("back-to-shows")
    .addEventListener("click", showShowsView);

    // CHANGED: now calls showEpisodesView (which also toggles the view), not loadEpisodesForShow
  document.getElementById("show-selector").addEventListener("change", (e) => {
    showEpisodesView(e.target.value);
  });

  // CHANGED: land on the shows listing instead of auto-loading episodes
  showShowsView();
}

/**
 * Renders the shows listing view.
 * Resets the search, hides episode-only controls, wires the search input
 * to filter shows.
 *
 * @return {Promise<void>}
 */
async function showShowsView() {
  const allShows = await fetchAllShows(); // uses cache after the first call

  document.getElementById("search").value = "";
  document.getElementById("search").placeholder = "Search shows...";
  document.getElementById("back-to-shows").style.display = "none";
  document.getElementById("episode-selector").style.display = "none";
  document.getElementById("show-selector").style.display = "inline-block";

  makePageForShows(allShows);
  setupShowSearch(allShows);
  updateCountDisplay(allShows.length, allShows.length, "shows");
}

/**
 * Renders the episodes view for the given show.
 * Replaces Level 400's loadEpisodesForShow, with toggling view logic added
 * (showing the back button, swapping search placeholder, syncing the dropdown).
 *
 * @param {string|number} showId - The TVMaze show id.
 * @return {Promise<void>}
 */
async function showEpisodesView(showId) {
  document.getElementById("root").innerHTML = "<p>Loading episodes...</p>";
  document.getElementById("search").value = "";
  document.getElementById("search").placeholder = "Search episodes...";
  document.getElementById("back-to-shows").style.display = "inline-block";
  document.getElementById("episode-selector").style.display = "inline-block";
  document.getElementById("show-selector").value = showId;

  const episodes = await fetchEpisodesForShow(showId); // uses cache after first call

  setupSelector(episodes);
  setupSearch(episodes);
  makePageForEpisodes(episodes);
  updateCountDisplay(episodes.length, episodes.length, "episodes");
}

/**
 * Updates the "Displaying X/Y episodes" counter in the header.
 * Generic so it works in both the shows view and the episodes view.
 *
 * @param {number} shown - Number of items currently visible.
 * @param {number} total - Total items in the current dataset.
 * @param {"shows"|"episodes"} label - Label suffix for the counter.
 * @return {void}
 */
function updateCountDisplay(shown, total, label) {
  const countDisplay = document.getElementById("episode-count");
  countDisplay.textContent = `Displaying ${shown}/${total} ${label}`;
}

/**
 * Filters the shows listing as the user types.
 * Matches against name, genres, and summary (Level 500 requirement).
 * Uses .oninput so re-wiring overwrites the prior handler.
 *
 * @param {Array<{ name: string, summary: string|null, genres: string[] }>} allShows
 * @return {void}
 */
function setupShowSearch(allShows) {
  const searchInput = document.getElementById("search");

  searchInput.oninput = () => {
    const term = searchInput.value.toLowerCase();
    const filtered = allShows.filter((show) => {
      const name = show.name.toLowerCase();
      const summary = show.summary ? show.summary.toLowerCase() : "";
      const genres = show.genres.join(" ").toLowerCase();
      return (
        name.includes(term) ||
        summary.includes(term) ||
        genres.includes(term)
      );
    });
    makePageForShows(filtered);
    updateCountDisplay(filtered.length, allShows.length, "shows");
  };
}

/**
 * Wires the search input to filter episodes by name or summary as the user types.
 * Uses .oninput to replace any previous handler (prevents listener stacking on show change).
 * updateCountDisplay is called instead of updateEpisodeCount since this is generic and used for both shows and episodes search.
 * "episodes" label is passed to updateCountDisplay since this search is only used in the episodes view, but could be parameterized if we wanted to reuse this function for shows search as well.
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
    updateCountDisplay(filtered.length, allEpisodes.length, "episodes");
  };
}

/**
 * Populates the episode dropdown with "Show all" plus one option per episode,
 * and wires the change handler to render the selected episode (or all).
 * Clears any previous options first.
 * updateCountDisplay is called with the full episode count when "Show all" is selected, and with 1 when a specific episode is selected.
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
      updateCountDisplay(allEpisodes.length, allEpisodes.length, "episodes");
      return;
    }
    const selectedId = Number(selector.value);
    const selectedEpisode = allEpisodes.find((ep) => ep.id === selectedId);
    if (selectedEpisode) {
      makePageForEpisodes([selectedEpisode]);
      updateCountDisplay(1, allEpisodes.length, "episodes");
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
 * Renders a grid of show cards. Clicking a card drills into that show's episodes.
 *
 * @param {Array<{
 *   id: number,
 *   name: string,
 *   summary: string|null,
 *   genres: string[],
 *   status: string,
 *   rating: { average: number|null }|null,
 *   runtime: number|null,
 *   image: { medium: string }|null
 * }>} shows - Shows from TVMaze.
 * @return {void}
 */
function makePageForShows(shows) {
  const rootElem = document.getElementById("root");
  rootElem.innerHTML = "";

  const grid = document.createElement("div");
  grid.className = "show-grid";

  shows.forEach((show) => {
    const card = document.createElement("article");
    card.className = "show-card";

    const imgSrc = show.image?.medium ?? "";
    const genres = show.genres.join(", ");
    const rating = show.rating?.average ?? "N/A";
    const runtime = show.runtime ?? "N/A";
    const summary = show.summary ?? "";

    card.innerHTML = `
      <img src="${imgSrc}" alt="${show.name}" />
      <div class="show-info">
        <h2>${show.name}</h2>
        <p><strong>Genres:</strong> ${genres}</p>
        <p><strong>Status:</strong> ${show.status}</p>
        <p><strong>Rating:</strong> ${rating}</p>
        <p><strong>Runtime:</strong> ${runtime} min</p>
        <div class="show-summary">${summary}</div>
      </div>
    `;

    card.addEventListener("click", () => showEpisodesView(show.id));
    grid.appendChild(card);
  });

  rootElem.appendChild(grid);
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
  * Fetches all shows from TVMaze, sorted alphabetically by name.
 * Cached so we only hit /shows once per visit (Level 500 requirement).
 *
 * @return {Promise<Array<Object>>} Resolves with the sorted shows, or [] on failure.
 */
async function fetchAllShows() {
    if (allShowsCache) return allShowsCache; // Level 500 — short-circuit on cache hit
  try {
    const response = await fetch("https://api.tvmaze.com/shows");
    if (!response.ok) {
      throw new Error("Failed to load shows");
    }
    const shows = await response.json();
    shows.sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
    );
    allShowsCache = shows; // Level 500 — store for next call
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