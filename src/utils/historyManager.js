// ─────────────────────────────────────────────────────────────────────────────
// historyManager.js
// Manages stock analysis history:
// - localStorage for in-app sidebar (instant access)
// - Auto-downloads JSON + Markdown files to disk (offline flat files)
// - Master index file tracks all searches
// ─────────────────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'sri_stock_history';
const INDEX_KEY   = 'sri_stock_index';

// ── Extract key metrics from raw analysis text ────────────────────────────────
export function extractMetrics(analysisText) {
  const get = (patterns) => {
    for (const p of patterns) {
      const m = analysisText.match(p);
      if (m) return m[1]?.trim();
    }
    return 'N/A';
  };

  return {
    currentPrice:  get([/Current Price[:\s]+₹([\d,\.]+)/i, /Price[:\s]+₹([\d,\.]+)/i]),
    trend:         get([/Primary Trend[:\s]+([^\n]+)/i]),
    rsi:           get([/RSI[^:]*:\s*([\d\.]+)/i]),
    macd:          get([/MACD[^:]*crossover[:\s]+([^\n]+)/i, /Crossover[:\s]+([^\n]+)/i]),
    rating:        get([/Overall Rating[:\s]+([^\n]+)/i, /Rating[:\s]+([^\n]+)/i]),
    confidence:    get([/Confidence[:\s]+([^\n]+)/i]),
    strategy:      get([/Best Strategy[:\s]+([^\n]+)/i]),
    sentiment:     get([/Overall Sentiment[:\s]+([^\n]+)/i]),
    support:       get([/Key Support[:\s]+([^\n]+)/i]),
    resistance:    get([/Key Resistance[:\s]+([^\n]+)/i]),
    buyZone:       get([/Buy Zone[:\s]+([^\n]+)/i]),
    target1:       get([/Target 1[:\s]+([^\n]+)/i]),
    target2:       get([/Target 2[:\s]+([^\n]+)/i]),
    stopLoss:      get([/Stop.Loss[:\s]+([^\n]+)/i]),
    riskReward:    get([/Risk.Reward[:\s]+([^\n]+)/i]),
  };
}

// ── Save to localStorage ──────────────────────────────────────────────────────
export function saveToHistory(stock, index, timeframe, analysisText) {
  const metrics  = extractMetrics(analysisText);
  const now      = new Date();
  const dateStr  = now.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' });
  const timeStr  = now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' });
  const id       = `${stock.toUpperCase()}_${now.getTime()}`;

  const entry = {
    id,
    stock:      stock.toUpperCase(),
    index:      index || 'NSE/BSE',
    timeframe,
    date:       dateStr,
    time:       timeStr,
    timestamp:  now.getTime(),
    metrics,
    analysisText,
  };

  // Load existing history
  const existing = getHistory();
  const updated  = [entry, ...existing];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

  // Update master index
  updateMasterIndex(entry);

  // Auto-download files
  downloadJSON(entry);
  downloadMarkdown(entry);

  return entry;
}

// ── Get all history from localStorage ────────────────────────────────────────
export function getHistory() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

// ── Delete one entry ──────────────────────────────────────────────────────────
export function deleteFromHistory(id) {
  const updated = getHistory().filter(e => e.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  rebuildIndex(updated);
}

// ── Master index ──────────────────────────────────────────────────────────────
function updateMasterIndex(entry) {
  const index = getMasterIndex();
  index.unshift({
    id:        entry.id,
    stock:     entry.stock,
    index:     entry.index,
    date:      entry.date,
    time:      entry.time,
    timestamp: entry.timestamp,
    rating:    entry.metrics.rating,
    price:     entry.metrics.currentPrice,
    trend:     entry.metrics.trend,
    sentiment: entry.metrics.sentiment,
  });
  localStorage.setItem(INDEX_KEY, JSON.stringify(index));
  downloadMasterIndex(index);
}

function rebuildIndex(history) {
  const index = history.map(e => ({
    id:        e.id,
    stock:     e.stock,
    index:     e.index,
    date:      e.date,
    time:      e.time,
    timestamp: e.timestamp,
    rating:    e.metrics.rating,
    price:     e.metrics.currentPrice,
    trend:     e.metrics.trend,
    sentiment: e.metrics.sentiment,
  }));
  localStorage.setItem(INDEX_KEY, JSON.stringify(index));
}

export function getMasterIndex() {
  try {
    return JSON.parse(localStorage.getItem(INDEX_KEY) || '[]');
  } catch {
    return [];
  }
}

// ── Download helpers ──────────────────────────────────────────────────────────
function triggerDownload(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function downloadJSON(entry) {
  const filename = `stocks/${entry.stock}_${entry.date.replace(/\//g, '-')}.json`;
  triggerDownload(filename, JSON.stringify(entry, null, 2), 'application/json');
}

function downloadMarkdown(entry) {
  const md = buildMarkdown(entry);
  const filename = `stocks/${entry.stock}_${entry.date.replace(/\//g, '-')}.md`;
  triggerDownload(filename, md, 'text/markdown');
}

function downloadMasterIndex(index) {
  const md = buildIndexMarkdown(index);
  triggerDownload('stocks/MASTER_INDEX.md', md, 'text/markdown');
}

// ── Build Markdown content ────────────────────────────────────────────────────
function buildMarkdown(entry) {
  const m = entry.metrics;
  return `# ${entry.stock} — Analysis Report
**Date:** ${entry.date} ${entry.time} IST  
**Index:** ${entry.index}  
**Timeframe:** ${entry.timeframe}  

---

## Key Metrics Summary

| Metric | Value |
|--------|-------|
| Current Price | ₹${m.currentPrice} |
| Primary Trend | ${m.trend} |
| RSI (14) | ${m.rsi} |
| MACD Signal | ${m.macd} |
| News Sentiment | ${m.sentiment} |
| Buy Zone | ${m.buyZone} |
| Target 1 | ${m.target1} |
| Target 2 | ${m.target2} |
| Stop-Loss | ${m.stopLoss} |
| Risk:Reward | ${m.riskReward} |
| Support | ${m.support} |
| Resistance | ${m.resistance} |

---

## Verdict

| | |
|--|--|
| **Overall Rating** | ${m.rating} |
| **Confidence** | ${m.confidence} |
| **Best Strategy** | ${m.strategy} |

---

## Full Analysis

${entry.analysisText}

---
*Generated by Sri's Stock Analyzer | ${entry.date} ${entry.time} IST*  
*⚠️ Not financial advice. For educational purposes only.*
`;
}

function buildIndexMarkdown(index) {
  const rows = index.map(e =>
    `| ${e.date} | **${e.stock}** | ${e.index} | ₹${e.price} | ${e.trend || 'N/A'} | ${e.rating || 'N/A'} | ${e.sentiment || 'N/A'} |`
  ).join('\n');

  return `# Sri's Stock Analysis — Master Index
*Last updated: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST*  
*Total searches: ${index.length}*

---

| Date | Stock | Index | Price | Trend | Rating | Sentiment |
|------|-------|-------|-------|-------|--------|-----------|
${rows}

---
*⚠️ Not financial advice. For educational purposes only.*
`;
}

// ── Export full history as ZIP-like bundle ────────────────────────────────────
export function exportAllHistory() {
  const history = getHistory();
  if (!history.length) return;

  // Download master index
  downloadMasterIndex(getMasterIndex());

  // Download each stock file
  history.forEach((entry, i) => {
    setTimeout(() => {
      downloadJSON(entry);
      downloadMarkdown(entry);
    }, i * 300); // stagger to avoid browser blocking
  });
}
