// ─────────────────────────────────────────────────────────────────────────────
// optionsHistoryManager.js
// Manages options trade history:
// - localStorage for in-app access
// - Auto-downloads JSON + Markdown on save
// - Tracks Win / Loss / Pending per trade
// - Computes success rate + total P&L per strategy
// ─────────────────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'sri_options_history';

// ── Save a trade plan ─────────────────────────────────────────────────────────
export function saveOptionsTrade(entry) {
  const now = new Date();
  const record = {
    id:         `OPT_${now.getTime()}`,
    savedAt:    now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    date:       now.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' }),
    time:       now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }),
    timestamp:  now.getTime(),
    outcome:    'Pending', // Pending | Win | Loss
    pnl:        null,      // filled manually
    ...entry,
  };

  const history = getOptionsHistory();
  history.unshift(record);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));

  // Auto-download files
  _downloadJSON(record);
  _downloadMarkdown(record);

  return record;
}

// ── Get all history ───────────────────────────────────────────────────────────
export function getOptionsHistory() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
}

// ── Update outcome + P&L on a trade ──────────────────────────────────────────
export function updateTradeOutcome(id, outcome, pnl) {
  const history = getOptionsHistory();
  const idx = history.findIndex(h => h.id === id);
  if (idx === -1) return;
  history[idx].outcome = outcome;
  history[idx].pnl     = pnl !== undefined ? pnl : history[idx].pnl;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  return history[idx];
}

// ── Delete one record ─────────────────────────────────────────────────────────
export function deleteOptionsTrade(id) {
  const updated = getOptionsHistory().filter(h => h.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

// ── Analytics ─────────────────────────────────────────────────────────────────
export function getAnalytics() {
  const history = getOptionsHistory();
  const strategies = ['vertical', 'ironcondor', 'coveredcall'];
  const labels     = { vertical: 'Vertical Spread', ironcondor: 'Iron Condor', coveredcall: 'Covered Call' };

  const overall = { total: 0, wins: 0, losses: 0, pending: 0, totalPnl: 0 };
  const byStrategy = {};

  strategies.forEach(s => {
    byStrategy[s] = { label: labels[s], total: 0, wins: 0, losses: 0, pending: 0, totalPnl: 0 };
  });

  history.forEach(h => {
    const s = byStrategy[h.strategyId];
    if (!s) return;
    s.total++;
    overall.total++;
    if (h.outcome === 'Win')     { s.wins++;    overall.wins++;    }
    if (h.outcome === 'Loss')    { s.losses++;  overall.losses++;  }
    if (h.outcome === 'Pending') { s.pending++; overall.pending++; }
    const p = parseFloat(h.pnl) || 0;
    s.totalPnl     += p;
    overall.totalPnl += p;
  });

  // Win rate %
  Object.values(byStrategy).forEach(s => {
    const decided = s.wins + s.losses;
    s.winRate = decided > 0 ? Math.round((s.wins / decided) * 100) : null;
  });
  const decidedOverall = overall.wins + overall.losses;
  overall.winRate = decidedOverall > 0 ? Math.round((overall.wins / decidedOverall) * 100) : null;

  return { overall, byStrategy };
}

// ── Export all history ────────────────────────────────────────────────────────
export function exportAllOptionsHistory() {
  const history = getOptionsHistory();
  if (!history.length) return;

  // Master JSON
  _triggerDownload(
    'options_history/MASTER_OPTIONS_HISTORY.json',
    JSON.stringify(history, null, 2),
    'application/json'
  );

  // Master Markdown index
  const analytics = getAnalytics();
  const md = _buildMasterMarkdown(history, analytics);
  _triggerDownload('options_history/MASTER_OPTIONS_INDEX.md', md, 'text/markdown');
}

// ── Internal helpers ──────────────────────────────────────────────────────────
function _triggerDownload(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}

function _downloadJSON(record) {
  const filename = `options_history/${record.strategyId}_${record.underlying}_${record.date.replace(/\//g,'-')}.json`;
  _triggerDownload(filename, JSON.stringify(record, null, 2), 'application/json');
}

function _downloadMarkdown(record) {
  const outcomeEmoji = record.outcome === 'Win' ? '✅' : record.outcome === 'Loss' ? '❌' : '⏳';
  const md = `# ${record.strategyLabel} — ${record.underlying}
**Date:** ${record.date} ${record.time} IST
**Outcome:** ${outcomeEmoji} ${record.outcome}${record.pnl ? ` | P&L: ₹${record.pnl}` : ''}

---

## Market Context
- Spot: ₹${record.ctx?.spot || 'N/A'}
- VIX: ${record.ctx?.vix || 'N/A'}
- Bias: ${record.ctx?.bias || 'N/A'}
- IV: ${record.ctx?.iv || 'N/A'}%

---

## Trade Plan
${record.content || 'No content saved.'}

---
*Generated by Sri's Weekly Options Planner*
*⚠️ Not financial advice. Educational purposes only.*
`;
  const filename = `options_history/${record.strategyId}_${record.underlying}_${record.date.replace(/\//g,'-')}.md`;
  _triggerDownload(filename, md, 'text/markdown');
}

function _buildMasterMarkdown(history, analytics) {
  const { overall, byStrategy } = analytics;

  const stratRows = Object.values(byStrategy).map(s =>
    `| ${s.label} | ${s.total} | ${s.wins} | ${s.losses} | ${s.pending} | ${s.winRate !== null ? s.winRate + '%' : 'N/A'} | ₹${s.totalPnl.toLocaleString('en-IN')} |`
  ).join('\n');

  const tradeRows = history.map(h => {
    const emoji = h.outcome === 'Win' ? '✅' : h.outcome === 'Loss' ? '❌' : '⏳';
    return `| ${h.date} | ${h.underlying} | ${h.strategyLabel} | ${emoji} ${h.outcome} | ${h.pnl ? '₹' + h.pnl : '-'} |`;
  }).join('\n');

  return `# Sri's Options Trade History
*Last updated: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST*

---

## Overall Analytics
- Total Trades: **${overall.total}**
- Wins: **${overall.wins}** | Losses: **${overall.losses}** | Pending: **${overall.pending}**
- Overall Win Rate: **${overall.winRate !== null ? overall.winRate + '%' : 'N/A'}**
- Total P&L: **₹${overall.totalPnl.toLocaleString('en-IN')}**

---

## By Strategy

| Strategy | Trades | Wins | Losses | Pending | Win Rate | Total P&L |
|----------|--------|------|--------|---------|----------|-----------|
${stratRows}

---

## All Trades

| Date | Underlying | Strategy | Outcome | P&L |
|------|-----------|----------|---------|-----|
${tradeRows}

---
*⚠️ Not financial advice. Educational purposes only.*
`;
}
