import React, { useState, useEffect } from 'react';
import { getHistory, deleteFromHistory, exportAllHistory } from '../utils/historyManager';

const RATING_COLOR = {
  'Strong Buy': '#00ff88',
  'Buy':        '#44ff99',
  'Hold':       '#ffcc00',
  'Avoid':      '#ff8844',
  'Sell':       '#ff3355',
};

function ratingColor(r) {
  const key = Object.keys(RATING_COLOR).find(k => r?.includes(k));
  return RATING_COLOR[key] || '#4a7a55';
}

function sentimentColor(s) {
  if (s?.includes('Bullish')) return '#00ff88';
  if (s?.includes('Bearish')) return '#ff3355';
  return '#ffcc00';
}

// ── Comparison Table ──────────────────────────────────────────────────────────
function CompareTable({ history }) {
  const cols = [
    { key: 'stock',                   label: 'Stock' },
    { key: 'date',                    label: 'Date' },
    { key: 'metrics.currentPrice',    label: 'Price ₹' },
    { key: 'metrics.trend',           label: 'Trend' },
    { key: 'metrics.rsi',             label: 'RSI' },
    { key: 'metrics.sentiment',       label: 'Sentiment' },
    { key: 'metrics.rating',          label: 'Rating' },
    { key: 'metrics.target1',         label: 'Target 1' },
    { key: 'metrics.stopLoss',        label: 'Stop-Loss' },
    { key: 'metrics.riskReward',      label: 'R:R' },
  ];

  const get = (obj, path) => path.split('.').reduce((o, k) => o?.[k], obj) || 'N/A';

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.7em' }}>
        <thead>
          <tr>
            {cols.map(c => (
              <th key={c.key} style={{
                padding: '6px 10px', textAlign: 'left',
                color: '#4a7a55', borderBottom: '1px solid #1a2e1f',
                whiteSpace: 'nowrap', letterSpacing: '0.06em', fontSize: '0.9em'
              }}>{c.label}</th>
            ))}
            <th style={{ padding: '6px 8px', color: '#4a7a55', borderBottom: '1px solid #1a2e1f' }}>Del</th>
          </tr>
        </thead>
        <tbody>
          {history.map((entry, i) => (
            <tr key={entry.id} style={{ background: i % 2 === 0 ? '#080f0a' : 'transparent' }}>
              {cols.map(c => {
                const val = get(entry, c.key);
                let color = '#c8e8d0';
                if (c.key === 'metrics.rating')    color = ratingColor(val);
                if (c.key === 'metrics.sentiment') color = sentimentColor(val);
                if (c.key === 'stock')             color = '#00ff88';
                return (
                  <td key={c.key} style={{
                    padding: '6px 10px', color,
                    borderBottom: '1px solid #0d1f12',
                    whiteSpace: 'nowrap', maxWidth: 140,
                    overflow: 'hidden', textOverflow: 'ellipsis'
                  }}>{val}</td>
                );
              })}
              <td style={{ padding: '6px 8px', borderBottom: '1px solid #0d1f12' }}>
                <button onClick={() => deleteFromHistory(entry.id)}
                  style={{ background: 'transparent', border: 'none', color: '#ff3355', cursor: 'pointer', fontSize: '0.9em' }}>✕</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Main HistoryPanel ─────────────────────────────────────────────────────────
export default function HistoryPanel({ onLoadAnalysis }) {
  const [history, setHistory]   = useState([]);
  const [view, setView]         = useState('list'); // list | compare
  const [search, setSearch]     = useState('');
  const [expanded, setExpanded] = useState(null);

  const reload = () => setHistory(getHistory());

  useEffect(() => { reload(); }, []);

  const filtered = history.filter(e =>
    e.stock.toLowerCase().includes(search.toLowerCase()) ||
    e.index?.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = filtered.reduce((acc, e) => {
    if (!acc[e.stock]) acc[e.stock] = [];
    acc[e.stock].push(e);
    return acc;
  }, {});

  if (!history.length) return (
    <div style={{ padding: '20px 16px', color: '#2a5a35', fontSize: '0.78em', textAlign: 'center' }}>
      <div style={{ fontSize: '1.5em', marginBottom: 8 }}>📭</div>
      No history yet.<br />Search a stock to start building your history.
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '10px 12px', borderBottom: '1px solid #1a2e1f', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ color: '#00ff88', fontSize: '0.7em', letterSpacing: '0.1em' }}>
            HISTORY ({history.length})
          </span>
          <button onClick={() => exportAllHistory()}
            title="Export all history files"
            style={{ background: 'transparent', border: '1px solid #1a3d24', color: '#4a7a55', padding: '2px 8px', fontSize: '0.65em', cursor: 'pointer', fontFamily: 'inherit', borderRadius: 2 }}>
            ⬇ Export All
          </button>
        </div>

        {/* Search */}
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Filter stocks..."
          style={{ width: '100%', background: '#080f0a', border: '1px solid #1a2e1f', color: '#c8e8d0', padding: '5px 8px', fontSize: '0.72em', fontFamily: 'inherit', borderRadius: 2, outline: 'none', marginBottom: 8 }} />

        {/* View toggle */}
        <div style={{ display: 'flex', gap: 4 }}>
          {['list', 'compare'].map(v => (
            <button key={v} onClick={() => setView(v)}
              style={{
                flex: 1, padding: '4px', fontSize: '0.65em',
                background: view === v ? '#0d2016' : 'transparent',
                border: `1px solid ${view === v ? '#00ff88' : '#1a2e1f'}`,
                color: view === v ? '#00ff88' : '#4a7a55',
                cursor: 'pointer', fontFamily: 'inherit', borderRadius: 2, textTransform: 'uppercase'
              }}>{v === 'list' ? '☰ List' : '⊞ Compare'}</button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {view === 'compare' ? (
          <div style={{ padding: '10px 0' }}>
            <CompareTable history={filtered} />
          </div>
        ) : (
          <div>
            {Object.entries(grouped).map(([stock, entries]) => (
              <div key={stock}>
                {/* Stock group header */}
                <button onClick={() => setExpanded(expanded === stock ? null : stock)}
                  style={{
                    width: '100%', textAlign: 'left', padding: '8px 12px',
                    background: expanded === stock ? '#0a1a0e' : 'transparent',
                    border: 'none', borderBottom: '1px solid #0d1f12',
                    cursor: 'pointer', fontFamily: 'inherit',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}>
                  <span style={{ color: '#00ff88', fontSize: '0.78em', fontWeight: 700 }}>{stock}</span>
                  <span style={{ color: '#2a5a35', fontSize: '0.65em' }}>{entries.length} search{entries.length > 1 ? 'es' : ''} {expanded === stock ? '▲' : '▼'}</span>
                </button>

                {/* Entries under this stock */}
                {expanded === stock && entries.map(entry => (
                  <div key={entry.id} style={{
                    padding: '8px 12px 8px 20px',
                    borderBottom: '1px solid #0d1f12',
                    background: '#060e07'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ color: '#4a7a55', fontSize: '0.65em', marginBottom: 3 }}>{entry.date} {entry.time}</div>
                        <div style={{ color: '#c8e8d0', fontSize: '0.72em', marginBottom: 2 }}>
                          ₹{entry.metrics.currentPrice} · {entry.index}
                        </div>
                        <div style={{ fontSize: '0.68em', marginBottom: 4 }}>
                          <span style={{ color: ratingColor(entry.metrics.rating) }}>{entry.metrics.rating}</span>
                          <span style={{ color: '#2a5a35' }}> · </span>
                          <span style={{ color: sentimentColor(entry.metrics.sentiment) }}>{entry.metrics.sentiment}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 5 }}>
                          <button onClick={() => onLoadAnalysis(entry)}
                            style={{ background: '#0d2016', border: '1px solid #1a3d24', color: '#00ff88', padding: '3px 9px', fontSize: '0.65em', cursor: 'pointer', fontFamily: 'inherit', borderRadius: 2 }}>
                            Load
                          </button>
                          <button onClick={() => { deleteFromHistory(entry.id); reload(); }}
                            style={{ background: 'transparent', border: '1px solid #330011', color: '#ff3355', padding: '3px 9px', fontSize: '0.65em', cursor: 'pointer', fontFamily: 'inherit', borderRadius: 2 }}>
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
