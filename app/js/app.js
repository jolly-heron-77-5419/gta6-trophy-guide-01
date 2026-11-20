// Leonida Ledger — boot and wiring. Loads app/data/trophies.json (a file of
// this app, fetched from the same server that serves it), then renders the
// checklist, the detail pane and the roadmap / missables / sources pages.
// Progress lives in localStorage; the app makes no other request.
import { exportProgress, importProgressFile, loadProgress, loadSettings, saveProgress, saveSettings, seedDemoIfRequested } from './store.js';
import { renderChecklist, renderDetail, renderMissables, renderProgress, renderRoadmap, renderSources } from './views.js';

const listEl = document.getElementById('trophyList');
const metaEl = document.getElementById('listMeta');
const detailPane = document.getElementById('detailPane');
const pageView = document.getElementById('pageView');
const layoutEl = document.querySelector('.layout');
const searchInput = document.getElementById('search');
const gradeSelect = document.getElementById('grade');
const earnedSelect = document.getElementById('earnedFilter');
const spoilersBox = document.getElementById('spoilers');
const kindChips = document.getElementById('kindChips');

const data = await (await fetch('data/trophies.json')).json();
const trophies = data.trophies;
const sourcesIndex = data.sources ?? {};

let earned = loadProgress();
let settings = loadSettings();
let selectedId = null;
let filters = { kind: 'all', grade: 'all', earned: 'all', query: '' };

seedDemoIfRequested(earned);

function currentRoute() {
  const hash = location.hash.replace(/^#\/?/, '');
  const [page, arg] = hash.split('/');
  if (page === 'trophy' && arg) return { page: 'trophy', id: Number(arg) };
  if (page === 'roadmap' || page === 'missables' || page === 'sources') return { page };
  return { page: 'checklist' };
}

function renderAll() {
  renderProgress(trophies, earned);
  document.title = earned.size > 0
    ? `Leonida Ledger — ${earned.size} / ${trophies.length} trophies`
    : 'Leonida Ledger — GTA VI Trophy Guide & Tracker';
  const route = currentRoute();
  const isPage = route.page === 'roadmap' || route.page === 'missables' || route.page === 'sources';
  pageView.hidden = !isPage;
  layoutEl.style.display = isPage ? 'none' : '';
  document.querySelectorAll('.tabs a').forEach((link) => {
    link.classList.toggle('active', link.dataset.tab === (isPage ? route.page : 'checklist'));
  });
  if (route.page === 'roadmap') renderRoadmap(pageView, trophies, earned);
  if (route.page === 'missables') renderMissables(pageView, trophies, earned);
  if (route.page === 'sources') renderSources(pageView, sourcesIndex);
  if (route.page === 'trophy') {
    selectedId = route.id;
    const trophy = trophies.find((t) => t.id === route.id) ?? null;
    renderChecklist(listEl, metaEl, trophies, earned, filters, settings, selectedId, selectTrophy, toggleEarned);
    renderDetail(detailPane, trophy, sourcesIndex, earned, toggleEarned);
    return;
  }
  selectedId = route.page === 'checklist' ? selectedId : null;
  renderChecklist(listEl, metaEl, trophies, earned, filters, settings, selectedId, selectTrophy, toggleEarned);
  renderDetail(detailPane, trophies.find((t) => t.id === selectedId) ?? null, sourcesIndex, earned, toggleEarned);
}

function selectTrophy(trophy) {
  selectedId = trophy.id;
  location.hash = `#/trophy/${trophy.id}`;
}

function toggleEarned(trophy) {
  if (earned.has(trophy.name)) earned.delete(trophy.name);
  else earned.add(trophy.name);
  saveProgress(earned);
  renderAll();
}

searchInput.addEventListener('input', () => {
  filters.query = searchInput.value;
  renderAll();
});
gradeSelect.addEventListener('change', () => {
  filters.grade = gradeSelect.value;
  renderAll();
});
earnedSelect.addEventListener('change', () => {
  filters.earned = earnedSelect.value;
  renderAll();
});
kindChips.addEventListener('click', (event) => {
  const chip = event.target.closest('[data-kind]');
  if (!chip) return;
  filters.kind = chip.dataset.kind;
  kindChips.querySelectorAll('.chip').forEach((c) => c.classList.toggle('active', c === chip));
  renderAll();
});
spoilersBox.checked = settings.hideSpoilers;
spoilersBox.addEventListener('change', () => {
  settings.hideSpoilers = spoilersBox.checked;
  saveSettings(settings);
  renderAll();
});

document.getElementById('exportBtn').addEventListener('click', () => {
  exportProgress(earned, settings);
});
document.getElementById('importFile').addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    const result = await importProgressFile(file, trophies.map((t) => t.name));
    earned = result.earned;
    if (result.settings) {
      settings = { hideSpoilers: Boolean(result.settings.hideSpoilers) };
      spoilersBox.checked = settings.hideSpoilers;
      saveSettings(settings);
    }
    saveProgress(earned);
    renderAll();
    const note = result.ignored > 0 ? ` Imported ${earned.size} trophies (${result.ignored} unknown names skipped).` : ` Imported ${earned.size} trophies.`;
    metaEl.textContent += note;
  } catch {
    metaEl.textContent = 'That file could not be imported — it is not a Leonida Ledger progress file.';
  }
  event.target.value = '';
});
document.getElementById('resetBtn').addEventListener('click', () => {
  if (!window.confirm('Clear all earned trophies and settings in this browser?')) return;
  earned = new Set();
  settings = { hideSpoilers: false };
  spoilersBox.checked = false;
  saveProgress(earned);
  saveSettings(settings);
  renderAll();
});

window.addEventListener('hashchange', renderAll);
renderAll();
