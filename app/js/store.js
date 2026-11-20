// Progress store: earned trophies and settings live in localStorage only.
// Nothing is sent anywhere; export writes a file, import reads one back.
export const PROGRESS_KEY = 'leonida-ledger-progress-v1';
export const SETTINGS_KEY = 'leonida-ledger-settings-v1';

// Thirteen trophies earned for the demo view (?demo=1): a plausible early-game
// spread — the opening mission, the first chapters and a few easy open-world ones.
export const DEMO_EARNED = [
  'Just Like Paradise', 'Paradise Lost', 'Trust', 'In The Beginning…',
  'Capital Offense', 'Catch Me If You Can', 'Stick Fiddler',
  'Let’s Go Bowling', 'Whip It Good', 'Master of None',
  'Baited My Tackle', 'Ten Pin', 'Treat Yo Self',
];

export function loadProgress() {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed.filter((n) => typeof n === 'string') : []);
  } catch {
    return new Set();
  }
}

export function saveProgress(earned) {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify([...earned]));
}

export function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return { hideSpoilers: Boolean(parsed.hideSpoilers) };
  } catch {
    return { hideSpoilers: false };
  }
}

export function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function seedDemoIfRequested(earned) {
  const params = new URLSearchParams(location.search);
  if (params.get('demo') !== '1') return false;
  if (earned.size > 0) return false;
  for (const name of DEMO_EARNED) earned.add(name);
  saveProgress(earned);
  return true;
}

export function exportProgress(earned, settings) {
  // The exported file is the same shape importProgressFile reads back, so a
  // file exported here imports cleanly on any browser running this guide.
  const payload = {
    app: 'leonida-ledger',
    game: 'Grand Theft Auto VI',
    exportedAt: new Date().toISOString(),
    earned: [...earned].sort(),
    settings,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'gta6-trophy-progress.json';
  link.click();
  URL.revokeObjectURL(link.href);
}

export async function importProgressFile(file, validNames) {
  const text = await file.text();
  const data = JSON.parse(text);
  const names = Array.isArray(data) ? data : data.earned;
  if (!Array.isArray(names)) throw new Error('That file has no earned-trophy list.');
  const known = new Set(validNames);
  const kept = names.filter((n) => typeof n === 'string' && known.has(n));
  return { earned: new Set(kept), settings: data.settings ?? null, ignored: names.length - kept.length };
}
