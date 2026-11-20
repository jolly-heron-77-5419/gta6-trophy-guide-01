// Filters: kind, grade, earned state, search text and the spoiler rule.
// A story trophy is spoiled when its name or description would give the plot
// away; with spoilers hidden, un-earned story trophies show as a locked card
// until the player earns them.

export const KIND_LABELS = {
  story: 'Story',
  collectible: 'Collectible',
  activity: 'Activity',
  robbery: 'Robbery',
  exploration: 'Exploration',
  misc: 'Open world',
};

export function trophyKindLabel(trophy) {
  return KIND_LABELS[trophy.kind] ?? 'Open world';
}

export function isSpoiled(trophy, earned, settings) {
  return settings.hideSpoilers && trophy.kind === 'story' && !earned.has(trophy.name);
}

export function filterTrophies(trophies, earned, filters) {
  const query = (filters.query ?? '').trim().toLowerCase();
  return trophies.filter((trophy) => {
    if (filters.kind === 'missable' && !trophy.missable) return false;
    if (filters.kind !== 'all' && filters.kind !== 'missable' && trophy.kind !== filters.kind) return false;
    if (filters.grade !== 'all' && trophy.grade !== filters.grade) return false;
    if (filters.earned === 'earned' && !earned.has(trophy.name)) return false;
    if (filters.earned === 'unearned' && earned.has(trophy.name)) return false;
    if (query) {
      const haystack = `${trophy.name} ${trophy.description} ${trophy.guide} ${trophyKindLabel(trophy)}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });
}

export function gradeCounts(trophies, earned) {
  const counts = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  for (const trophy of trophies) {
    if (earned.has(trophy.name)) counts[trophy.grade] = (counts[trophy.grade] ?? 0) + 1;
  }
  return counts;
}

export function stageProgress(trophies, earned, stage) {
  const inStage = trophies.filter((t) => t.stage === stage);
  const done = inStage.filter((t) => earned.has(t.name)).length;
  return { total: inStage.length, done };
}
