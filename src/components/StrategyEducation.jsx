import React, { useState } from 'react';
import { STRATEGY_LIST } from '../utils/strategyData';
import { useSessionState } from '../hooks/useSessionState';

// ─────────────────────────────────────────────────────────────────────────────
// SVG P&L CHART — zero dependencies
// ─────────────────────────────────────────────────────────────────────────────
function PnLChart({ pnlPoints, color }) {
  const W = 540, H = 210, PL = 52, PR = 16, PT = 28, PB = 36;
  const iW = W - PL - PR, iH = H - PT - PB;

  const spots = pnlPoints.map(p => p.spot);
  const pnls  = pnlPoints.map(p => p.pnl);
  const minS = Math.min(...spots), maxS = Math.max(...spots);
  const minP = Math.min(...pnls),  maxP = Math.max(...pnls);
  const rngS = maxS - minS || 1,   rngP = maxP - minP || 1;

  const x  = s => PL + ((s - minS) / rngS) * iW;
  const y  = p => PT + ((maxP - p) / rngP) * iH;
  const y0 = y(0);

  const linePath = pnlPoints.map((p, i) =>
    `${i === 0 ? 'M' : 'L'}${x(p.spot).toFixed(1)},${y(p.pnl).toFixed(1)}`
  ).join(' ');

  const fillPath = linePath
    + ` L${x(maxS).toFixed(1)},${y0.toFixed(1)}`
    + ` L${x(minS).toFixed(1)},${y0.toFixed(1)} Z`;

  // Y-axis tick values
  const yTicks = [minP, 0, maxP].filter((v, i, a) => a.indexOf(v) === i);

  return (
    <div style={{ background: '#060e07', border: '1px solid #1a2e1f', borderRadius: 4, padding: '10px 0 4px' }}>
      <div style={{ color: '#4a7a55', fontSize: '0.6em', letterSpacing: '0.1em', paddingLeft: PL, marginBottom: 4 }}>
        P&L AT EXPIRY (₹)
      </div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', maxWidth: W }}>
        {/* Background grid */}
        {[0.25, 0.5, 0.75].map(f => (
          <line key={f}
            x1={PL} y1={PT + f * iH} x2={W - PR} y2={PT + f * iH}
            stroke="#0d2016" strokeWidth="1" strokeDasharray="3,4" />
        ))}

        {/* Zero baseline */}
        {y0 >= PT && y0 <= PT + iH && (
          <>
            <line x1={PL} y1={y0} x2={W - PR} y2={y0} stroke="#2a5a35" strokeWidth="1.5" />
            <text x={PL - 3} y={y0 + 4} textAnchor="end" fill="#2a5a35" fontSize="9">₹0</text>
          </>
        )}

        {/* Y-axis ticks */}
        {yTicks.map(v => {
          if (v === 0) return null;
          const yy = y(v);
          if (yy < PT || yy > PT + iH) return null;
          const label = v > 0 ? `+${(v/1000).toFixed(1)}K` : `-${Math.abs(v/1000).toFixed(1)}K`;
          return (
            <text key={v} x={PL - 3} y={yy + 4} textAnchor="end"
              fill={v > 0 ? '#00ff8877' : '#ff335577'} fontSize="8.5">{label}</text>
          );
        })}

        {/* Fill area */}
        <path d={fillPath} fill={color} opacity="0.07" />

        {/* Main P&L line */}
        <path d={linePath} fill="none" stroke={color} strokeWidth="2.5"
          strokeLinejoin="round" strokeLinecap="round" />

        {/* Data points */}
        {pnlPoints.map((p, i) => {
          const px = x(p.spot), py = y(p.pnl);
          const dot = p.pnl === 0 ? '#ffcc00' : p.pnl > 0 ? '#00ff88' : '#ff3355';
          const labelY = py > PT + 16 ? py - 8 : py + 16;
          const pLabel = p.pnl === 0 ? 'BE'
            : p.pnl > 0 ? `+₹${(p.pnl/1000).toFixed(1)}K`
            : `-₹${Math.abs(p.pnl/1000).toFixed(1)}K`;
          return (
            <g key={i}>
              <circle cx={px} cy={py} r={4.5} fill={dot} stroke="#040a06" strokeWidth="1.5" />
              <text x={px} y={labelY} textAnchor="middle" fill={dot} fontSize="8.5" fontWeight="700">
                {pLabel}
              </text>
              <text x={px} y={H - PB + 14} textAnchor="middle" fill="#2a5a35" fontSize="8">
                {p.label || Math.round(p.spot / 100) * 100}
              </text>
            </g>
          );
        })}

        {/* Axis labels */}
        <text x={PL + iW / 2} y={H - 2} textAnchor="middle" fill="#2a5a35" fontSize="9">
          NIFTY Spot at Expiry →
        </text>
      </svg>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SMALL BUILDING BLOCKS
// ─────────────────────────────────────────────────────────────────────────────
function Tag({ text, color }) {
  return (
    <span style={{
      background: color + '18', color, border: `1px solid ${color}44`,
      padding: '2px 9px', borderRadius: 2, fontSize: '0.68em',
      fontWeight: 600, marginRight: 6, whiteSpace: 'nowrap'
    }}>{text}</span>
  );
}

function SectionHead({ icon, title, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7,
      margin: '22px 0 10px', paddingBottom: 6,
      borderBottom: `1px solid ${color}33` }}>
      <span>{icon}</span>
      <span style={{ color, fontWeight: 700, fontSize: '0.8em', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        {title}
      </span>
    </div>
  );
}

function InfoGrid({ items }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
      {items.map((item, i) => (
        <div key={i} style={{ background: '#0a1a0e', border: '1px solid #1a3d24', borderRadius: 3, padding: '8px 11px' }}>
          <div style={{ color: '#4a7a55', fontSize: '0.58em', letterSpacing: '0.1em', marginBottom: 3 }}>{item.label}</div>
          <div style={{ color: item.color || '#c8e8d0', fontWeight: 600, fontSize: '0.78em' }}>{item.value}</div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SINGLE STRATEGY DETAIL PAGE
// ─────────────────────────────────────────────────────────────────────────────
function StrategyDetail({ s }) {
  const c = s.color;

  return (
    <div style={{ maxWidth: 820, padding: '0 4px' }}>

      {/* Header */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <span style={{ fontSize: '1.6em' }}>{s.icon}</span>
          <div>
            <div style={{ color: c, fontWeight: 700, fontSize: '1.1em' }}>{s.label}</div>
            <div style={{ color: '#4a7a55', fontSize: '0.76em', marginTop: 2 }}>{s.tagline}</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
          <Tag text={s.type}     color={c} />
          <Tag text={`Win Rate: ${s.winRate}`} color={c} />
          <Tag text={s.capital}  color="#ffcc00" />
          <Tag text={s.outlook}  color="#c8e8d0" />
        </div>
      </div>

      {/* Quick stats */}
      <InfoGrid items={[
        { label: 'RISK',       value: s.risk,     color: '#ff8844' },
        { label: 'REWARD',     value: s.reward,   color: '#00ff88' },
        { label: 'BEST ENTRY', value: s.bestTime, color: '#ffcc00' },
      ]} />

      {/* What is it */}
      <SectionHead icon="📖" title="What Is It?" color={c} />
      <div style={{ color: '#c8e8d0', fontSize: '0.8em', lineHeight: 1.9, whiteSpace: 'pre-line', marginBottom: 4 }}>
        {s.what}
      </div>

      {/* When to use */}
      <SectionHead icon="✅" title="When to Use" color={c} />
      <div style={{ marginBottom: 14 }}>
        {s.when.map((w, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
            <span style={{ color: '#00ff88', flexShrink: 0, fontSize: '0.8em' }}>✓</span>
            <span style={{ color: '#c8e8d0', fontSize: '0.78em', lineHeight: 1.6 }}>{w}</span>
          </div>
        ))}
      </div>

      {/* When NOT to use */}
      <SectionHead icon="🚫" title="When NOT to Use" color={c} />
      <div style={{ marginBottom: 4 }}>
        {s.whenNot.map((w, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
            <span style={{ color: '#ff3355', flexShrink: 0, fontSize: '0.8em' }}>✗</span>
            <span style={{ color: '#c8e8d0', fontSize: '0.78em', lineHeight: 1.6 }}>{w}</span>
          </div>
        ))}
      </div>

      {/* NIFTY Example */}
      <SectionHead icon="📊" title={`NIFTY Example — ${s.example.title}`} color={c} />
      <div style={{ background: '#060e07', border: `1px solid ${c}33`, borderRadius: 4, padding: '14px 16px', marginBottom: 14 }}>
        <div style={{ color: '#4a7a55', fontSize: '0.7em', marginBottom: 10 }}>{s.example.setup}</div>

        {/* Legs table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1a2e1f' }}>
              {['Action', 'Strike', 'Premium', 'Role'].map(h => (
                <th key={h} style={{ padding: '5px 8px', textAlign: 'left', color: '#4a7a55', fontSize: '0.65em', letterSpacing: '0.08em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {s.example.legs.map((leg, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #0d1f12' }}>
                <td style={{ padding: '6px 8px' }}>
                  <span style={{ color: leg.action === 'BUY' || leg.action === 'OWN' ? '#00ff88' : '#ff3355', fontWeight: 700, fontSize: '0.75em' }}>
                    {leg.action}
                  </span>
                </td>
                <td style={{ padding: '6px 8px', color: '#c8e8d0', fontSize: '0.75em' }}>{leg.strike}</td>
                <td style={{ padding: '6px 8px', color: '#ffcc00', fontSize: '0.75em' }}>{leg.premium}</td>
                <td style={{ padding: '6px 8px', color: '#4a7a55', fontSize: '0.72em' }}>{leg.role}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Key levels */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            { label: 'Net Cost / Credit', value: s.example.netCost,      color: '#ffcc00' },
            { label: 'Max Profit',         value: s.example.maxProfit,    color: '#00ff88' },
            { label: 'Breakeven',          value: s.example.breakeven,    color: '#ffcc00' },
            { label: 'Risk : Reward',      value: s.example.riskReward,   color: '#44aaff' },
            { label: 'Exit Target',        value: s.example.exitTarget,   color: '#00ff88' },
            { label: 'Stop-Loss Rule',     value: s.example.exitStopLoss, color: '#ff3355' },
          ].map((item, i) => (
            <div key={i} style={{ background: '#0a1a0e', borderRadius: 2, padding: '6px 10px' }}>
              <div style={{ color: '#4a7a55', fontSize: '0.58em', marginBottom: 2 }}>{item.label}</div>
              <div style={{ color: item.color, fontSize: '0.73em', lineHeight: 1.4 }}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* P&L Chart */}
      <SectionHead icon="📈" title="P&L Chart at Expiry" color={c} />
      <PnLChart pnlPoints={s.example.pnlPoints} color={c} />

      {/* How to trade */}
      <SectionHead icon="🖥️" title="How to Place the Trade (Zerodha / Groww)" color={c} />
      <div style={{ marginBottom: 14 }}>
        {s.howToTrade.map((step, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8, alignItems: 'flex-start' }}>
            <div style={{ background: c + '22', color: c, border: `1px solid ${c}44`, borderRadius: 2, padding: '1px 7px', fontSize: '0.65em', fontWeight: 700, flexShrink: 0, minWidth: 22, textAlign: 'center' }}>
              {i + 1}
            </div>
            <span style={{ color: '#c8e8d0', fontSize: '0.78em', lineHeight: 1.6 }}>{step}</span>
          </div>
        ))}
      </div>

      {/* Common mistakes */}
      <SectionHead icon="⚠️" title="Common Mistakes to Avoid" color={c} />
      <div style={{ marginBottom: 14 }}>
        {s.mistakes.map((m, i) => (
          <div key={i} style={{ background: '#1a0008', border: '1px solid #ff335522', borderRadius: 3, padding: '10px 14px', marginBottom: 8 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
              <span style={{ color: '#ff3355', fontSize: '0.75em' }}>✗</span>
              <span style={{ color: '#ff8888', fontSize: '0.75em', fontWeight: 600 }}>{m.mistake}</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <span style={{ color: '#00ff88', fontSize: '0.75em' }}>→</span>
              <span style={{ color: '#c8e8d0', fontSize: '0.75em', lineHeight: 1.5 }}>{m.fix}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Adjustment rules */}
      <SectionHead icon="🔧" title="Adjustment Rules" color={c} />
      <div style={{ marginBottom: 20 }}>
        {s.adjustments.map((a, i) => (
          <div key={i} style={{ background: '#0a1a0e', border: `1px solid ${c}22`, borderRadius: 3, padding: '10px 14px', marginBottom: 8 }}>
            <div style={{ color: '#ffcc00', fontSize: '0.72em', fontWeight: 600, marginBottom: 4 }}>
              📍 If: {a.situation}
            </div>
            <div style={{ color: '#c8e8d0', fontSize: '0.75em', lineHeight: 1.5 }}>
              → {a.action}
            </div>
          </div>
        ))}
      </div>

      {/* Quick reference card */}
      <SectionHead icon="⚡" title="Quick Reference Card" color={c} />
      <div style={{ background: c + '12', border: `1px solid ${c}44`, borderRadius: 4, padding: '12px 16px', marginBottom: 20 }}>
        <div style={{ color: c, fontSize: '0.78em', fontWeight: 600, lineHeight: 1.8 }}>{s.quickRef}</div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EDUCATION TAB
// ─────────────────────────────────────────────────────────────────────────────
export default function StrategyEducation() {
  const [activeStrategy, setActiveStrategy] = useSessionState('sri_edu_strategy', 'vertical');
  const current = STRATEGY_LIST.find(s => s.id === activeStrategy) || STRATEGY_LIST[0];

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 52px)' }}>

      {/* ── Left nav ───────────────────────────────────────────────────────── */}
      <div style={{ width: 200, flexShrink: 0, background: '#080f0a', borderRight: '1px solid #1a2e1f', padding: '14px 0', overflowY: 'auto' }}>
        <div style={{ padding: '0 14px 12px', borderBottom: '1px solid #1a2e1f', marginBottom: 10 }}>
          <div style={{ color: '#00ff88', fontSize: '0.65em', letterSpacing: '0.1em', marginBottom: 2 }}>📚 STRATEGY GUIDE</div>
          <div style={{ color: '#2a5a35', fontSize: '0.62em', lineHeight: 1.6 }}>
            Full theory · NIFTY examples<br />
            P&L charts · Mistakes<br />
            Adjustment rules · Zero API
          </div>
        </div>

        {STRATEGY_LIST.map(s => (
          <button key={s.id} onClick={() => setActiveStrategy(s.id)}
            style={{
              display: 'block', width: '100%', textAlign: 'left',
              padding: '10px 14px',
              background: activeStrategy === s.id ? '#0d2016' : 'transparent',
              border: 'none',
              borderLeft: `3px solid ${activeStrategy === s.id ? s.color : 'transparent'}`,
              cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s'
            }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '1.1em' }}>{s.icon}</span>
              <div>
                <div style={{ color: activeStrategy === s.id ? s.color : '#c8e8d0', fontSize: '0.78em', fontWeight: 600 }}>
                  {s.label}
                </div>
                <div style={{ color: '#2a5a35', fontSize: '0.62em', marginTop: 1 }}>{s.type}</div>
              </div>
            </div>
            {activeStrategy === s.id && (
              <div style={{ paddingLeft: 26, marginTop: 6 }}>
                <div style={{ color: s.color + '99', fontSize: '0.62em' }}>Win Rate: {s.winRate}</div>
                <div style={{ color: s.color + '99', fontSize: '0.62em' }}>Capital: {s.capital}</div>
              </div>
            )}
          </button>
        ))}

        {/* Strategy comparison mini-table */}
        <div style={{ margin: '14px 12px 0', padding: '10px', background: '#0a1a0e', border: '1px solid #1a3d24', borderRadius: 3 }}>
          <div style={{ color: '#4a7a55', fontSize: '0.58em', letterSpacing: '0.08em', marginBottom: 8 }}>QUICK COMPARE</div>
          {STRATEGY_LIST.map(s => (
            <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ color: s.color, fontSize: '0.62em' }}>{s.icon} {s.label.split(' ')[0]}</span>
              <span style={{ color: '#4a7a55', fontSize: '0.62em' }}>{s.winRate}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Main content ───────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
        <StrategyDetail s={current} />
      </div>
    </div>
  );
}
