import React, { useState, useEffect } from 'react';
import {
  getOptionsHistory, updateTradeOutcome,
  deleteOptionsTrade, getAnalytics, exportAllOptionsHistory
} from '../utils/optionsHistoryManager';
import { useSessionState } from '../hooks/useSessionState';

const STRATEGY_COLORS = {
  vertical:    '#44aaff',
  ironcondor:  '#ff9944',
  coveredcall: '#00ff88',
};
const STRATEGY_ICONS = {
  vertical:    '↕️',
  ironcondor:  '🦅',
  coveredcall: '📞',
};

function outcomeColor(o) {
  return o === 'Win' ? '#00ff88' : o === 'Loss' ? '#ff3355' : '#ffcc00';
}
function outcomeEmoji(o) {
  return o === 'Win' ? '✅' : o === 'Loss' ? '❌' : '⏳';
}

// ── Analytics Summary Cards ───────────────────────────────────────────────────
function AnalyticsPanel({ analytics }) {
  const { overall, byStrategy } = analytics;

  return (
    <div style={{ marginBottom: 20 }}>
      {/* Overall summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 14 }}>
        {[
          { label: 'TOTAL TRADES', value: overall.total,   color: '#c8e8d0' },
          { label: 'WINS',         value: overall.wins,    color: '#00ff88' },
          { label: 'LOSSES',       value: overall.losses,  color: '#ff3355' },
          { label: 'WIN RATE',     value: overall.winRate !== null ? overall.winRate + '%' : 'N/A', color: overall.winRate >= 60 ? '#00ff88' : overall.winRate >= 40 ? '#ffcc00' : '#ff3355' },
          { label: 'TOTAL P&L',    value: '₹' + (overall.totalPnl || 0).toLocaleString('en-IN'), color: overall.totalPnl >= 0 ? '#00ff88' : '#ff3355' },
        ].map(m => (
          <div key={m.label} style={{ background: '#080f0a', border: '1px solid #1a2e1f', borderRadius: 4, padding: '10px 12px', textAlign: 'center' }}>
            <div style={{ color: '#4a7a55', fontSize: '0.58em', letterSpacing: '0.1em', marginBottom: 4 }}>{m.label}</div>
            <div style={{ color: m.color, fontWeight: 700, fontSize: '0.95em' }}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* Per-strategy breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {Object.entries(byStrategy).map(([id, s]) => {
          const c = STRATEGY_COLORS[id];
          return (
            <div key={id} style={{ background: '#060e07', border: `1px solid ${c}33`, borderRadius: 4, padding: '12px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
                <span style={{ fontSize: '1em' }}>{STRATEGY_ICONS[id]}</span>
                <span style={{ color: c, fontWeight: 700, fontSize: '0.78em' }}>{s.label}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {[
                  { label: 'Trades',   value: s.total },
                  { label: 'Win Rate', value: s.winRate !== null ? s.winRate + '%' : 'N/A', color: s.winRate >= 60 ? '#00ff88' : s.winRate >= 40 ? '#ffcc00' : '#ff3355' },
                  { label: 'Wins',     value: s.wins,    color: '#00ff88' },
                  { label: 'Losses',   value: s.losses,  color: s.losses > 0 ? '#ff3355' : '#4a7a55' },
                  { label: 'Pending',  value: s.pending, color: '#ffcc00' },
                  { label: 'P&L',      value: '₹' + (s.totalPnl || 0).toLocaleString('en-IN'), color: s.totalPnl >= 0 ? '#00ff88' : '#ff3355' },
                ].map(m => (
                  <div key={m.label} style={{ background: '#0a1a0e', borderRadius: 2, padding: '5px 8px' }}>
                    <div style={{ color: '#2a5a35', fontSize: '0.58em' }}>{m.label}</div>
                    <div style={{ color: m.color || '#c8e8d0', fontWeight: 600, fontSize: '0.75em' }}>{m.value}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Trade Row with outcome marking ────────────────────────────────────────────
function TradeRow({ record, onUpdate, onDelete, onExpand, expanded }) {
  const [outcome, setOutcome] = useState(record.outcome);
  const [pnl, setPnl]         = useState(record.pnl || '');
  const [saving, setSaving]   = useState(false);
  const color = STRATEGY_COLORS[record.strategyId] || '#4a7a55';

  async function saveOutcome(newOutcome) {
    setSaving(true);
    setOutcome(newOutcome);
    updateTradeOutcome(record.id, newOutcome, pnl || null);
    onUpdate();
    setSaving(false);
  }

  function savePnl(val) {
    setPnl(val);
    updateTradeOutcome(record.id, outcome, val || null);
    onUpdate();
  }

  return (
    <>
      <tr style={{ background: expanded ? '#0a1a0e' : 'transparent', borderBottom: '1px solid #0d1f12' }}>
        {/* Date */}
        <td style={{ padding: '8px 10px', color: '#4a7a55', fontSize: '0.72em', whiteSpace: 'nowrap' }}>
          {record.date}<br />
          <span style={{ fontSize: '0.85em' }}>{record.time?.split(',')[1]?.trim() || ''}</span>
        </td>
        {/* Underlying */}
        <td style={{ padding: '8px 10px', color: '#00ff88', fontWeight: 700, fontSize: '0.8em' }}>
          {record.underlying}
          <div style={{ color: '#2a5a35', fontSize: '0.75em', fontWeight: 400 }}>
            ₹{record.ctx?.spot || '—'} · VIX {record.ctx?.vix || '—'}
          </div>
        </td>
        {/* Strategy */}
        <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>
          <span style={{ color: color, fontSize: '0.75em' }}>
            {STRATEGY_ICONS[record.strategyId]} {record.strategyLabel}
          </span>
        </td>
        {/* Outcome buttons */}
        <td style={{ padding: '8px 10px' }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {['Win', 'Loss', 'Pending'].map(o => (
              <button key={o} onClick={() => saveOutcome(o)}
                style={{
                  padding: '3px 8px', fontSize: '0.62em', cursor: 'pointer',
                  fontFamily: 'inherit', borderRadius: 2,
                  background: outcome === o ? (o === 'Win' ? '#003322' : o === 'Loss' ? '#330011' : '#332200') : 'transparent',
                  border: `1px solid ${outcome === o ? outcomeColor(o) : '#1a3d24'}`,
                  color: outcome === o ? outcomeColor(o) : '#2a5a35',
                  transition: 'all 0.15s'
                }}>
                {outcomeEmoji(o)} {o}
              </button>
            ))}
          </div>
        </td>
        {/* P&L input */}
        <td style={{ padding: '8px 10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ color: '#4a7a55', fontSize: '0.7em' }}>₹</span>
            <input
              value={pnl}
              onChange={e => savePnl(e.target.value)}
              type="number"
              placeholder="0"
              style={{
                width: 70, background: '#0a1a0e', border: '1px solid #1a3d24',
                color: parseFloat(pnl) >= 0 ? '#00ff88' : '#ff3355',
                padding: '3px 6px', fontSize: '0.75em',
                fontFamily: 'inherit', borderRadius: 2, outline: 'none'
              }}
            />
          </div>
        </td>
        {/* Actions */}
        <td style={{ padding: '8px 10px' }}>
          <div style={{ display: 'flex', gap: 5 }}>
            <button onClick={() => onExpand(record.id)}
              style={{ background: expanded ? '#0d2016' : 'transparent', border: `1px solid ${expanded ? '#00ff88' : '#1a3d24'}`, color: expanded ? '#00ff88' : '#4a7a55', padding: '3px 8px', fontSize: '0.62em', cursor: 'pointer', fontFamily: 'inherit', borderRadius: 2 }}>
              {expanded ? '▲' : '▼'} Plan
            </button>
            <button onClick={() => { deleteOptionsTrade(record.id); onDelete(); }}
              style={{ background: 'transparent', border: '1px solid #330011', color: '#ff3355', padding: '3px 7px', fontSize: '0.62em', cursor: 'pointer', fontFamily: 'inherit', borderRadius: 2 }}>
              ✕
            </button>
          </div>
        </td>
      </tr>
      {/* Expanded trade plan */}
      {expanded && (
        <tr>
          <td colSpan={6} style={{ padding: '0 10px 12px 10px', background: '#060e07' }}>
            <pre style={{
              fontFamily: "'Courier New', monospace", fontSize: '0.75em',
              lineHeight: 1.8, color: '#c8e8d0', whiteSpace: 'pre-wrap',
              wordBreak: 'break-word', margin: 0,
              background: '#050d07', border: '1px solid #1a3d24',
              borderRadius: 3, padding: '12px 14px'
            }}>
              {record.content || 'No trade plan content saved.'}
            </pre>
          </td>
        </tr>
      )}
    </>
  );
}

// ── Main OptionsHistory component ─────────────────────────────────────────────
export default function OptionsHistory() {
  const [history, setHistory]     = useState([]);
  const [analytics, setAnalytics] = useState(null);
  // ── Persisted filters — survive tab switches ──────────────────────────────
  const [filter, setFilter]             = useSessionState('sri_hist_filter', 'all');
  const [outcomeFilter, setOutcomeFilter] = useSessionState('sri_hist_outcome', 'all');
  const [search, setSearch]             = useSessionState('sri_hist_search', '');
  const [expanded, setExpanded]         = useSessionState('sri_hist_expanded', null);

  function reload() {
    setHistory(getOptionsHistory());
    setAnalytics(getAnalytics());
  }

  useEffect(() => { reload(); }, []);

  function toggleExpand(id) {
    setExpanded(prev => prev === id ? null : id);
  }

  const filtered = history.filter(h => {
    if (filter !== 'all' && h.strategyId !== filter) return false;
    if (outcomeFilter !== 'all' && h.outcome !== outcomeFilter) return false;
    if (search && !h.underlying?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (!history.length) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 52px)', color: '#2a5a35' }}>
      <div style={{ fontSize: '2.5em', marginBottom: 12 }}>📭</div>
      <div style={{ fontSize: '0.9em', fontWeight: 700, marginBottom: 6 }}>No options history yet</div>
      <div style={{ fontSize: '0.75em', textAlign: 'center', lineHeight: 1.7, maxWidth: 320 }}>
        Go to the Weekly Planner tab, search for an underlying,<br />
        and expand any strategy to auto-save it here.
      </div>
    </div>
  );

  return (
    <div style={{ padding: '20px 24px', overflowY: 'auto', height: 'calc(100vh - 52px)' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <div>
          <div style={{ color: '#00ff88', fontWeight: 700, fontSize: '1.05em' }}>📊 Options Trade History</div>
          <div style={{ color: '#4a7a55', fontSize: '0.73em', marginTop: 2 }}>
            {history.length} trade{history.length !== 1 ? 's' : ''} saved · Mark outcomes · Track your success rate
          </div>
        </div>
        <button onClick={exportAllOptionsHistory}
          style={{ background: 'transparent', border: '1px solid #1a3d24', color: '#4a7a55', padding: '6px 16px', fontSize: '0.73em', cursor: 'pointer', fontFamily: 'inherit', borderRadius: 2 }}>
          ⬇ Export All
        </button>
      </div>

      {/* Analytics */}
      {analytics && <AnalyticsPanel analytics={analytics} />}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Search */}
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search underlying..."
          style={{ background: '#080f0a', border: '1px solid #1a2e1f', color: '#c8e8d0', padding: '5px 10px', fontSize: '0.75em', fontFamily: 'inherit', borderRadius: 2, outline: 'none', width: 160 }} />

        {/* Strategy filter */}
        <div style={{ display: 'flex', gap: 4 }}>
          {[
            { id: 'all',        label: 'All Strategies' },
            { id: 'vertical',   label: '↕️ Vertical' },
            { id: 'ironcondor', label: '🦅 Iron Condor' },
            { id: 'coveredcall',label: '📞 Covered Call' },
          ].map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              style={{
                padding: '4px 10px', fontSize: '0.68em', cursor: 'pointer', fontFamily: 'inherit', borderRadius: 2,
                background: filter === f.id ? '#0d2016' : 'transparent',
                border: `1px solid ${filter === f.id ? '#00ff88' : '#1a3d24'}`,
                color: filter === f.id ? '#00ff88' : '#4a7a55',
              }}>{f.label}</button>
          ))}
        </div>

        {/* Outcome filter */}
        <div style={{ display: 'flex', gap: 4 }}>
          {['all', 'Win', 'Loss', 'Pending'].map(o => (
            <button key={o} onClick={() => setOutcomeFilter(o)}
              style={{
                padding: '4px 10px', fontSize: '0.68em', cursor: 'pointer', fontFamily: 'inherit', borderRadius: 2,
                background: outcomeFilter === o ? '#0d2016' : 'transparent',
                border: `1px solid ${outcomeFilter === o ? outcomeColor(o === 'all' ? 'Pending' : o) : '#1a3d24'}`,
                color: outcomeFilter === o ? outcomeColor(o === 'all' ? 'Pending' : o) : '#4a7a55',
              }}>{o === 'all' ? 'All Outcomes' : outcomeEmoji(o) + ' ' + o}</button>
          ))}
        </div>

        <span style={{ color: '#2a5a35', fontSize: '0.68em', marginLeft: 'auto' }}>
          {filtered.length} of {history.length} shown
        </span>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div style={{ color: '#2a5a35', fontSize: '0.78em', textAlign: 'center', padding: '30px 0' }}>
          No trades match current filters.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78em' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1a2e1f' }}>
                {['Date', 'Underlying', 'Strategy', 'Outcome', 'P&L ₹', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '7px 10px', textAlign: 'left', color: '#4a7a55', fontSize: '0.75em', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(record => (
                <TradeRow
                  key={record.id}
                  record={record}
                  onUpdate={reload}
                  onDelete={reload}
                  onExpand={toggleExpand}
                  expanded={expanded === record.id}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Disclaimer */}
      <div style={{ marginTop: 24, padding: '8px 12px', background: '#0a0a04', border: '1px solid #2a2a18', borderRadius: 3, fontSize: '0.67em', color: '#3a3a28', lineHeight: 1.7 }}>
        ⚠️ History is for personal tracking only. P&L entries are self-reported. Not SEBI-registered advice. Options trading involves real risk of capital loss.
      </div>
    </div>
  );
}
