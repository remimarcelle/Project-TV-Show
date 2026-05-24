// You can edit ALL of the code here
const API_URL = "https://api.tvmaze.com/shows/82/episodes"; // (not used yet, fine to keep)
const episodeCache = {};
const showCache = [];
/**
 * Entry point for the app.
 * Uses provided getAllEpisodes() and renders them.
 */
async function setup() {
  const allShows = await fetchAllShows();

  populateShowSelector(allShows);

  makePageForShows(allShows);

  setupShowSearch(allShows);

  const showSelector = document.getElementById("show-selector");

  showSelector.addEventListener("change", async () => {
    const showId = showSelector.value;

    document.getElementById("root").innerHTML = "<p>Loading episodes...</p>";

    const episodes = await fetchEpisodesForShow(showId);

    document.getElementById("search").value = "";

    setupSelector(episodes);

    setupSearch(episodes);

    makePageForEpisodes(episodes);

    updateEpisodeCount(episodes.length, episodes.length);

    backButton.style.display = "block";
  });
}

const backButton = document.getElementById("back-to-shows");

backButton.addEventListener("click", async () => {
  const allShows = await fetchAllShows();
  makePageForShows(allShows);
  setupShowSearch(allShows);
  // Hide the button again
  backButton.style.display = "none";

  // Reset search + selector
  document.getElementById("search").value = "";
  document.getElementById("episode-selector").innerHTML = "";
});

function updateEpisodeCount(shown, total) {
  const countDisplay = document.getElementById("episode-count");
  countDisplay.textContent = `Displaying ${shown}/${total} episodes`;
}

function setupSearch(allEpisodes) {
  const searchInput = document.getElementById("search");

  searchInput.addEventListener("input", () => {
    const term = searchInput.value.toLowerCase();

    const filtered = allEpisodes.filter((ep) => {
      const name = ep.name ? ep.name.toLowerCase() : "";
      const summary = ep.summary ? ep.summary.toLowerCase() : "";
      return name.includes(term) || summary.includes(term);
    });

    makePageForEpisodes(filtered);
    updateEpisodeCount(filtered.length, allEpisodes.length);
  });
}

function setupShowSearch(allShows) {
  const searchInput = document.getElementById("search");

  searchInput.oninput = () => {
    const term = searchInput.value.toLowerCase();

    const filtered = allShows.filter((show) => {
      const name = show.name.toLowerCase();
      const summary = show.summary ? show.summary.toLowerCase() : "";
      const genres = show.genres.join(" ").toLowerCase();

      return (
        name.includes(term) || summary.includes(term) || genres.includes(term)
      );
    });

    makePageForShows(filtered);
  };
}

function setupSelector(allEpisodes) {
  const selector = document.getElementById("episode-selector");

  // "Show all episodes" option
  const defaultOption = document.createElement("option");
  defaultOption.value = "all";
  defaultOption.textContent = "Show all episodes";
  selector.appendChild(defaultOption);

  // Fill dropdown with episodes
  allEpisodes.forEach((ep) => {
    const option = document.createElement("option");
    const code = formatEpisodeCode(ep.season, ep.number);
    option.value = ep.id;
    option.textContent = `${code} - ${ep.name}`;
    selector.appendChild(option);
  });

  selector.addEventListener("change", () => {
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
  });
}

function formatEpisodeCode(season, episode) {
  const s = String(season).padStart(2, "0");
  const e = String(episode).padStart(2, "0");
  return `S${s}E${e}`;
}

function makePageForEpisodes(episodeList) {
  const rootElem = document.getElementById("root");
  rootElem.innerHTML = "";

  const grid = document.createElement("div");
  grid.className = "episode-grid";

  for (const episode of episodeList) {
    const card = document.createElement("article");
    card.className = "episode-card";

    const code = formatEpisodeCode(episode.season, episode.number);
    const imgSrc =
      episode.image && episode.image.medium ? episode.image.medium : "";
    const summary = episode.summary ? episode.summary : "";

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

  const attribution = document.createElement("footer");
  attribution.innerHTML = `Data originally from <a href="https://www.tvmaze.com/" target="_blank">TVMaze.com</a>`;
  attribution.className = "attribution";

  rootElem.appendChild(grid);
  rootElem.appendChild(attribution);
}

async function fetchAllShows() {
  if (showCache.length > 0) {
    return showCache;
  }
  try {
    const response = await fetch("https://api.tvmaze.com/shows");
    if (!response.ok) {
      throw new Error("Failed to load shows");
    }

    const shows = await response.json();

    // Sort alphabetically
    shows.sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
    );

    showCache.push(...shows);

    return shows;
  } catch (error) {
    console.error(error);
    return [];
  }
}

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

async function fetchEpisodesForShow(showId) {
  if (episodeCache[showId]) {
    return episodeCache[showId];
  }

  try {
    const response = await fetch(
      `https://api.tvmaze.com/shows/${showId}/episodes`,
    );
    if (!response.ok) {
      throw new Error("Failed to load episodes");
    }

    const episodes = await response.json();

    // 3. Save to cache
    episodeCache[showId] = episodes;

    return episodes;
  } catch (error) {
    console.error(error);
    return [];
  }
}

function makePageForShows(shows) {
  const rootElem = document.getElementById("root");
  rootElem.innerHTML = "";

  const grid = document.createElement("div");
  grid.className = "show-grid";

  shows.forEach((show) => {
    const card = document.createElement("article");
    card.className = "show-card";

    const imgSrc = show.image?.medium || "";
    const genres = show.genres.join(", ");
    const rating = show.rating?.average || "N/A";
    const runtime = show.runtime || "N/A";

    card.innerHTML = `
      <img src="${imgSrc}" alt="${show.name}" />
      <div class="show-info">
        <h2>${show.name}</h2>
        <p><strong>Genres:</strong> ${genres}</p>
        <p><strong>Status:</strong> ${show.status}</p>
        <p><strong>Rating:</strong> ${rating}</p>
        <p><strong>Runtime:</strong> ${runtime} min</p>
        <div class="show-summary">${show.summary}</div>
      </div>
    `;

    card.addEventListener("click", async () => {
      document.getElementById("root").innerHTML = "<p>Loading episodes...</p>";

      const episodes = await fetchEpisodesForShow(show.id);

      document.getElementById("search").value = "";

      setupSelector(episodes);
      setupSearch(episodes);
      makePageForEpisodes(episodes);
      updateEpisodeCount(episodes.length, episodes.length);
      backButton.style.display = "block";
    });

    grid.appendChild(card);
  });

  rootElem.appendChild(grid);
}

window.onload = setup;