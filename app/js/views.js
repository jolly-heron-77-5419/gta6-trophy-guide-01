// Views: the checklist rows, the trophy detail pane, and the full pages
// (roadmap, missables, sources). All rendering is plain DOM, no framework.
import { filterTrophies, gradeCounts, isSpoiled, stageProgress, trophyKindLabel } from './filters.js';

export const ROADMAP_STAGES = [
  { stage: 1, title: 'Play the story', blurb: 'Chapters 1–4, the named missions and the finale. All 12 of these unlock by playing the campaign — nothing here can be missed.' },
  { stage: 2, title: 'Stranger strands', blurb: 'The contact and stranger mission chains: Andy, Kenton, Billy, Randy and Tyrone, plus any other stranger markers you find. Eight finished strands earn the silver.' },
  { stage: 3, title: 'Explore Leonida', blurb: 'The map-wide sweep: all 52 areas, 100 vehicles, 100 WAiNK scans, card sets and the 18 meditation spots. Do the meditation spots before the finale — one is missable.' },
  { stage: 4, title: 'Activities and skill', blurb: 'The nine activity types, 42 shooting-range golds, drone races at all 14 locations, 20 race wins and 250 stunts. The shooting range is the hardest skill grind in the set.' },
  { stage: 5, title: 'Robberies and money', blurb: 'Bank vaults, armored trucks, gang operations, the jewelry store, laundering $250,000 and buying all 8 garages. Plan the getaway before the job.' },
  { stage: 6, title: 'Cleanup and the platinum', blurb: '50 challenges, the 500-choice counter and 100% completion — then the platinum pops on its own.' },
];

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function renderProgress(trophies, earned) {
  const counts = gradeCounts(trophies, earned);
  document.getElementById('progressCount').textContent = `${earned.size} / ${trophies.length}`;
  document.getElementById('progressLabel').textContent =
    `${Math.round((earned.size / trophies.length) * 100)}% to the platinum`;
  document.getElementById('progressBreakdown').textContent =
    `${counts.platinum} platinum · ${counts.gold} gold · ${counts.silver} silver · ${counts.bronze} bronze`;
}

export function renderChecklist(listEl, metaEl, trophies, earned, filters, settings, selectedId, onSelect, onToggle) {
  const shown = filterTrophies(trophies, earned, filters);
  metaEl.textContent = shown.length === trophies.length
    ? `Showing all ${trophies.length} trophies — 1 platinum, 2 gold, 6 silver, 46 bronze.`
    : `Showing ${shown.length} of ${trophies.length} trophies.`;
  listEl.replaceChildren();
  for (const trophy of shown) {
    const row = el('li', 'trophy-row' + (earned.has(trophy.name) ? ' earned' : '') + (trophy.id === selectedId ? ' selected' : ''));
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = earned.has(trophy.name);
    box.setAttribute('aria-label', `Mark ${trophy.name} as earned`);
    box.addEventListener('click', (event) => event.stopPropagation());
    box.addEventListener('change', () => onToggle(trophy));
    const body = el('div');
    const name = el('p', 'trophy-name');
    if (isSpoiled(trophy, earned, settings)) {
      name.textContent = 'Hidden story trophy';
      const hidden = el('span', 'spoiler-hidden', ' — earn it to reveal its name');
      name.append(hidden);
    } else {
      name.textContent = trophy.name;
      if (earned.has(trophy.name)) name.append(el('span', 'earned-mark', ' ✓'));
    }
    const desc = el('p', 'trophy-desc', isSpoiled(trophy, earned, settings)
      ? 'Hidden until earned — spoiler setting is on.'
      : trophy.description);
    const tags = el('p', 'trophy-tags');
    tags.append(el('span', `tag grade-${trophy.grade}`, trophy.grade));
    tags.append(el('span', 'tag', trophyKindLabel(trophy)));
    if (trophy.count) tags.append(el('span', 'tag', `Target: ${trophy.count.toLocaleString()}`));
    if (trophy.missable) tags.append(el('span', 'tag missable', '⚠ Missable'));
    if (trophy.time) tags.append(el('span', 'tag', trophy.time));
    body.append(name, desc, tags);
    const dot = el('span', `grade-dot ${trophy.grade}`);
    dot.title = trophy.grade;
    row.append(box, body, dot);
    row.addEventListener('click', () => onSelect(trophy));
    listEl.append(row);
  }
  if (shown.length === 0) {
    listEl.append(el('li', 'detail-empty', 'No trophies match these filters. Clear the search or pick another kind.'));
  }
}

export function renderDetail(pane, trophy, sourcesIndex, earned, onToggle) {
  pane.replaceChildren();
  if (!trophy) {
    pane.append(el('p', 'detail-empty', 'Pick a trophy from the list to see its guide — what to do, where and how, when it can be missed, and where each fact comes from.'));
    return;
  }
  pane.append(el('h2', null, trophy.name));
  pane.append(el('p', 'detail-desc', trophy.description));
  const meta = el('div', 'detail-meta');
  meta.append(el('span', `tag grade-${trophy.grade}`, trophy.grade));
  meta.append(el('span', 'tag', trophyKindLabel(trophy)));
  meta.append(el('span', 'tag', `Roadmap stage ${trophy.stage}`));
  if (trophy.count) meta.append(el('span', 'tag', `PSN target: ${trophy.count.toLocaleString()}`));
  if (trophy.missable) meta.append(el('span', 'tag missable', '⚠ Missable — do this before the finale'));
  meta.append(el('span', 'tag', `Difficulty ${'★'.repeat(trophy.difficulty)}${'☆'.repeat(5 - trophy.difficulty)}`));
  if (trophy.time) meta.append(el('span', 'tag', trophy.time));
  pane.append(meta);

  pane.append(el('h3', null, 'How to unlock it'));
  pane.append(el('p', null, trophy.guide));
  if (trophy.steps && trophy.steps.length > 0) {
    const steps = el('ol');
    for (const step of trophy.steps) steps.append(el('li', null, step));
    pane.append(steps);
  }

  pane.append(el('h3', null, 'Sources'));
  const list = el('ul', 'source-list');
  for (const key of trophy.sources ?? []) {
    const source = sourcesIndex[key];
    const item = el('li');
    if (source) {
      const link = document.createElement('a');
      link.href = source.url;
      link.target = '_blank';
      link.rel = 'noopener';
      link.textContent = source.name;
      item.append(link, document.createTextNode(` — ${source.covers}.`));
    } else {
      item.textContent = key;
    }
    list.append(item);
  }
  list.append(el('li', null, 'Guide text: this guide’s own advice, written from the official description above — not yet checked in the game. Where the description names no place or step, the guide says so.'));
  pane.append(list);

  const button = el('button', 'earn-btn' + (earned.has(trophy.name) ? ' earned' : ''),
    earned.has(trophy.name) ? '✓ Earned — click to unmark' : 'Mark as earned');
  button.type = 'button';
  button.addEventListener('click', () => onToggle(trophy));
  pane.append(button);
}

export function renderRoadmap(page, trophies, earned) {
  page.replaceChildren();
  page.append(el('h2', null, 'Roadmap to the platinum'));
  page.append(el('p', null, 'Fifty-five trophies, one playthrough, no online trophies. The order below is built from the official descriptions: story first, then strands, then the map, then the grinds. Everything in the list unlocks in single player, and nothing needs a second playthrough — except the one missable meditation spot, so do Stage 3’s meditation before the finale.'));
  for (const stage of ROADMAP_STAGES) {
    const progress = stageProgress(trophies, earned, stage.stage);
    const card = el('section', 'stage-card');
    const head = el('div', 'stage-head');
    head.append(el('h3', null, `Stage ${stage.stage} — ${stage.title}`));
    head.append(el('span', 'stage-count', `${progress.done} / ${progress.total} earned`));
    card.append(head, el('p', null, stage.blurb));
    const list = el('ul');
    for (const trophy of trophies.filter((t) => t.stage === stage.stage)) {
      const item = el('li');
      const link = document.createElement('a');
      link.href = `#/trophy/${trophy.id}`;
      link.textContent = trophy.name;
      item.append(link, document.createTextNode(` — ${trophy.grade}${earned.has(trophy.name) ? ' ✓' : ''}`));
      list.append(item);
    }
    card.append(list);
    page.append(card);
  }
}

export function renderMissables(page, trophies, earned) {
  page.replaceChildren();
  page.append(el('h2', null, 'Missable trophies'));
  const callout = el('section', 'missable-callout');
  callout.append(el('h3', null, '⚠ One confirmed missable'));
  callout.append(el('p', null, 'Positive Mental Attitude — meditate at all 18 spots. One meditation spot is only reachable during a story window, per the GameMapa trophy guide, so a spot left until after the finale may be gone for that playthrough. Meditate at every spot you pass while the story is still running, and check the count before the final mission.'));
  page.append(callout);
  page.append(el('h3', null, 'What the official list does — and does not — say'));
  page.append(el('p', null, 'Every other trophy’s description names an act you can repeat or a mission the story hands you, so nothing else in the list is flagged missable here. The story and named-mission trophies (13 of them) unlock automatically. The rest — collectibles, activities, robberies — stay available in free roam after the finale, and early guides report the whole list is earnable in a single playthrough with no online trophies.'));
  page.append(el('h3', null, 'Worth doing before the finale anyway'));
  const watch = el('ul');
  for (const line of [
    'Meditation spots (18) — the one missable above.',
    'Stranger strands (8 for the silver) — finish them while their markers are live rather than assuming they wait.',
    'Actions Speak Louder — the 500-choice counter only grows while you make choices, so play decisively instead of avoiding decisions.',
  ]) watch.append(el('li', null, line));
  page.append(watch);
  page.append(el('h3', null, 'The full list, by kind'));
  const kinds = ['story', 'collectible', 'activity', 'robbery', 'exploration', 'misc'];
  for (const kind of kinds) {
    const inKind = trophies.filter((t) => t.kind === kind);
    const done = inKind.filter((t) => earned.has(t.name)).length;
    page.append(el('p', null, `${trophyKindLabel({ kind })}: ${done} / ${inKind.length} earned.`));
  }
}

export function renderSources(page, sourcesIndex) {
  page.replaceChildren();
  page.append(el('h2', null, 'Sources & about'));
  page.append(el('p', null, 'Every trophy’s name, description and grade is shown as PlayStation publishes it. The list itself comes from the two trackers that published it before this guide was written, and the two agree on every name, description and grade:'));
  const list = el('ul', 'source-list');
  for (const source of Object.values(sourcesIndex)) {
    const item = el('li');
    const link = document.createElement('a');
    link.href = source.url;
    link.target = '_blank';
    link.rel = 'noopener';
    link.textContent = source.name;
    item.append(link, document.createTextNode(` — ${source.covers}.`));
    list.append(item);
  }
  page.append(list);
  page.append(el('h3', null, 'How the guides are written'));
  page.append(el('p', null, 'Each guide is written in this guide’s own words from the official description of its trophy. Where the description does not name a place, a step or a count, the guide says so instead of inventing one — the game released on 19 November 2026 and community walkthroughs are still being confirmed in-game. Counts the guide quotes are the ones PSN tracks (via PSNProfiles) or are cross-checked against the KeenGamer and GameMapa guides, and each trophy’s detail pane names its sources beside its guide.'));
  page.append(el('h3', null, 'About this guide'));
  page.append(el('p', null, 'Leonida Ledger is an independent, fan-made guide and tracker. It is not affiliated with Rockstar Games, Take-Two Interactive or Sony Interactive Entertainment, and it uses no Rockstar logo, artwork or game screenshots. Progress is saved only in your browser (localStorage); export writes a JSON file and import reads one back. The guide loads nothing over the network and works with the network off.'));
}
