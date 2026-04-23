import React, { useState, useRef } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────────────────────
const API_URL    = 'https://api.anthropic.com/v1/messages';
const MODEL      = 'claude-sonnet-4-20250514';
const DELAY_MS   = 600;
const sleep = ms => new Promise(r => setTimeout(r, ms));

const STRATEGIES = [
  {
    id:        'vertical',
    icon:      '↕️',
    label:     'Vertical Spread',
    sublabel:  'Bull Call / Bear Put',
    color:     '#44aaff',
    capital:   '₹5,000–₹10,000',
    winRate:   '55–65%',
    weeklyTarget: '₹2,000–₹4,000',
    bestWhen:  'Trending market — clear direction',
    avoid:     'Choppy / sideways market',
  },
  {
    id:        'ironcondor',
    icon:      '🦅',
    label:     'Iron Condor',
    sublabel:  'NIFTY / BANKNIFTY / Stocks',
    color:     '#ff9944',
    capital:   '₹15,000–₹25,000',
    winRate:   '60–68%',
    weeklyTarget: '₹1,500–₹2,500',
    bestWhen:  'Sideways market, VIX > 13, no major events',
    avoid:     'Trending / high volatility week',
  },
  {
    id:        'coveredcall',
    icon:      '📞',
    label:     'Covered Call',
    sublabel:  'Weekly premium on stocks',
    color:     '#00ff88',
    capital:   '₹50,000–₹80,000',
    winRate:   '70–75%',
    weeklyTarget: '₹1,000–₹1,500',
    bestWhen:  'Stable/mild bullish stock, low IV',
    avoid:     'Strongly trending up — caps your upside',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// API HELPER — retry on rate limit
// ─────────────────────────────────────────────────────────────────────────────
async function callAPI(prompt, maxTokens = 500, useSearch = false, retries = 2) {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const body = {
        model: MODEL,
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: prompt }],
        ...(useSearch && { tools: [{ type: 'web_search_20250305', name: 'web_search' }] })
      };
      const res  = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.error?.type === 'rate_limit_error') { await sleep((attempt + 1) * 3000); continue; }
      if (data.error) throw new Error(data.error.message);
      return data.content.filter(b => b.type === 'text').map(b => b.text).join('');
    } catch (err) {
      if (attempt === retries) throw err;
      await sleep(1500);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MICRO PROMPTS — focused, minimal tokens
// ─────────────────────────────────────────────────────────────────────────────

// PROMPT 1 — Market context + Weekly Planner recommendation (~250 tokens response)
function marketContextPrompt(underlying) {
  return `You are an expert Indian options trader (NSE/BSE). Today: ${new Date().toLocaleDateString('en-IN')}.
Underlying: ${underlying}

Use web search to get: current spot price, India VIX, and market trend.
Return ONLY this JSON — no other text:
{
  "spot": 0,
  "lot": 0,
  "iv": 0,
  "vix": 0,
  "bias": "Bullish|Bearish|Neutral|Sideways",
  "trend_strength": "Strong|Moderate|Weak",
  "major_event_this_week": false,
  "event_name": "",
  "best_strategy": "vertical|ironcondor|coveredcall",
  "reason": "one sentence why",
  "avoid_strategy": "vertical|ironcondor|coveredcall",
  "avoid_reason": "one sentence why",
  "week_note": "one sentence market context for this week"
}`;
}

// PROMPT 2 — Vertical Spread exact trade (~400 tokens response)
function verticalPrompt(underlying, ctx) {
  return `NSE weekly options expert. Today: ${new Date().toLocaleDateString('en-IN')}.
${underlying} Spot=₹${ctx.spot}, Lot=${ctx.lot}, IV=${ctx.iv}%, Bias=${ctx.bias}, Trend=${ctx.trend_strength}

Weekly VERTICAL SPREAD trade plan. Reply ONLY in this exact format:

TRADE TYPE: [Bull Call Spread / Bear Put Spread]
REASON: [one line — why this direction]

STRIKES:
  Buy : ₹[strike] [CE/PE] @ ₹[premium]
  Sell: ₹[strike] [CE/PE] @ ₹[premium]
  Net Cost: ₹[value] × ${ctx.lot} lot = ₹[total risk]

LEVELS:
  Breakeven : ₹[value]
  Target    : ₹[value] (+[X]% from spot) → Profit ₹[amount]
  Stop-Loss : ₹[value] → Max Loss ₹[amount]
  Risk:Reward: 1:[X]

ENTRY RULE  : [exact condition to enter — price level or signal]
EXIT RULE   : Exit at 50% profit OR if loss hits ₹[amount]
BEST ENTRY DAY: [Monday/Tuesday/Any]
EXIT BEFORE : Thursday 1:30pm (never hold to expiry)

WIN RATE: 55–65% in trending markets
CAPITAL NEEDED: ₹[amount]
VERDICT: [Strong Setup / Good / Skip this week]`;
}

// PROMPT 3 — Iron Condor exact trade (~450 tokens response)
function ironCondorPrompt(underlying, ctx) {
  return `NSE weekly options expert. Today: ${new Date().toLocaleDateString('en-IN')}.
${underlying} Spot=₹${ctx.spot}, Lot=${ctx.lot}, IV=${ctx.iv}%, VIX=${ctx.vix}, Bias=${ctx.bias}

Weekly IRON CONDOR trade plan. Reply ONLY in this exact format:

SETUP:
  Sell PUT : ₹[strike] @ ₹[premium]
  Buy  PUT : ₹[strike] @ ₹[premium]  (hedge)
  Buy  CALL: ₹[strike] @ ₹[premium]  (hedge)
  Sell CALL: ₹[strike] @ ₹[premium]

PREMIUM:
  Net Credit : ₹[value] × ${ctx.lot} lot = ₹[total credit]
  Max Loss   : ₹[value] × ${ctx.lot} = ₹[total max loss]

LEVELS:
  Lower Breakeven: ₹[value]
  Upper Breakeven: ₹[value]
  Profit Zone    : ₹[lower] to ₹[upper] ([X]% range — market must stay here)
  Adjust if spot hits: ₹[lower danger] or ₹[upper danger]

RULES:
  Entry  : [exact condition — VIX level, day, time]
  Target : Collect 50% of credit = ₹[amount] → EXIT
  Stop   : Loss hits 2× credit = ₹[amount] → EXIT immediately
  Exit by: Wednesday close or Thursday 1pm latest

AVOID THIS WEEK IF: [specific condition — event, VIX spike, etc.]
WIN RATE: 60–68% in range-bound weeks
CAPITAL NEEDED: ₹[amount]
VERDICT: [Strong Setup / Good / Skip — VIX too low/high]`;
}

// PROMPT 4 — Covered Call exact trade (~400 tokens response)
function coveredCallPrompt(underlying, ctx) {
  return `NSE weekly options expert. Today: ${new Date().toLocaleDateString('en-IN')}.
${underlying} Spot=₹${ctx.spot}, Lot/Shares=100, IV=${ctx.iv}%, Bias=${ctx.bias}

Weekly COVERED CALL trade plan. Reply ONLY in this exact format:

STOCK POSITION:
  Buy : [${underlying}] 100 shares @ ₹${ctx.spot}
  Cost: ₹[total investment]

CALL TO SELL:
  Sell: ₹[strike] CE weekly @ ₹[premium]
  Premium collected: ₹[premium] × 100 = ₹[weekly income]
  Monthly income (4 weeks): ₹[amount] = [X]% monthly return

LEVELS:
  Called Away (max profit) : If stock > ₹[strike] → sell at ₹[profit]
  Breakeven                : ₹[spot - premium]
  Stop-Loss on stock       : ₹[level] (if stock falls here → exit both)
  Net downside protection  : ₹[premium] per share

SCENARIOS:
  Stock stays below ₹[strike] → Keep premium ₹[amount] ✅
  Stock rises above ₹[strike] → Called away, profit ₹[amount] ✅
  Stock falls below ₹[stop]   → Exit, loss ₹[amount] ❌

ENTRY RULE: [exact entry condition]
ROLL RULE : If stock approaches strike, roll call to next week at higher strike
EXIT RULE : Buy back call if premium falls to ₹[value] (25% of sold premium)

WIN RATE: 70–75% of weeks
WEEKLY INCOME TARGET: ₹[amount]
VERDICT: [Strong Setup / Good / Skip — stock too volatile]`;
}

// ─────────────────────────────────────────────────────────────────────────────
// WEEKLY PLANNER CARD
// ─────────────────────────────────────────────────────────────────────────────
function PlannerCard({ ctx, underlying }) {
  if (!ctx) return null;

  const best  = STRATEGIES.find(s => s.id === ctx.best_strategy);
  const avoid = STRATEGIES.find(s => s.id === ctx.avoid_strategy);

  const biasColor = ctx.bias === 'Bullish' ? '#00ff88'
    : ctx.bias === 'Bearish' ? '#ff3355'
    : ctx.bias === 'Sideways' ? '#ffcc00' : '#44aaff';

  const vixColor = ctx.vix > 20 ? '#ff3355' : ctx.vix > 13 ? '#ffcc00' : '#00ff88';

  return (
    <div style={{ background: '#050d07', border: '1px solid #1a3d24', borderRadius: 5, padding: '18px 20px', marginBottom: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <div style={{ color: '#00ff88', fontWeight: 700, fontSize: '1em', letterSpacing: '0.04em' }}>
            📅 WEEKLY TRADE PLANNER
          </div>
          <div style={{ color: '#4a7a55', fontSize: '0.72em', marginTop: 2 }}>
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: '#00ff88', fontWeight: 700, fontSize: '0.95em' }}>{underlying.toUpperCase()}</div>
          <div style={{ color: '#c8e8d0', fontSize: '0.85em' }}>₹{ctx.spot}</div>
        </div>
      </div>

      {/* Market metrics row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 16 }}>
        {[
          { label: 'SPOT',     value: `₹${ctx.spot}`,          color: '#c8e8d0' },
          { label: 'LOT SIZE', value: ctx.lot,                  color: '#c8e8d0' },
          { label: 'IV',       value: `${ctx.iv}%`,             color: '#ffcc00' },
          { label: 'VIX',      value: ctx.vix,                  color: vixColor  },
          { label: 'BIAS',     value: ctx.bias,                 color: biasColor },
        ].map(m => (
          <div key={m.label} style={{ background: '#0a1a0e', border: '1px solid #1a3d24', borderRadius: 3, padding: '8px 10px', textAlign: 'center' }}>
            <div style={{ color: '#4a7a55', fontSize: '0.58em', letterSpacing: '0.1em', marginBottom: 3 }}>{m.label}</div>
            <div style={{ color: m.color, fontWeight: 700, fontSize: '0.82em' }}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* Event warning */}
      {ctx.major_event_this_week && (
        <div style={{ background: '#1a0a00', border: '1px solid #ff444455', borderRadius: 3, padding: '8px 12px', marginBottom: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: '1em' }}>⚠️</span>
          <div>
            <span style={{ color: '#ff8844', fontSize: '0.75em', fontWeight: 700 }}>MAJOR EVENT THIS WEEK: </span>
            <span style={{ color: '#ff8844', fontSize: '0.75em' }}>{ctx.event_name} — Reduce position size by 50%</span>
          </div>
        </div>
      )}

      {/* Best strategy recommendation */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
        {/* USE */}
        <div style={{ background: '#001a0e', border: `1px solid ${best?.color || '#00ff88'}44`, borderRadius: 4, padding: '12px 14px' }}>
          <div style={{ color: '#00ff88', fontSize: '0.62em', letterSpacing: '0.1em', marginBottom: 6 }}>✅ USE THIS WEEK</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: '1.2em' }}>{best?.icon}</span>
            <span style={{ color: best?.color, fontWeight: 700, fontSize: '0.9em' }}>{best?.label}</span>
          </div>
          <div style={{ color: '#c8e8d0', fontSize: '0.72em', lineHeight: 1.5 }}>{ctx.reason}</div>
          <div style={{ marginTop: 8, display: 'flex', gap: 12 }}>
            <div style={{ color: '#4a7a55', fontSize: '0.65em' }}>Win Rate: <span style={{ color: best?.color }}>{best?.winRate}</span></div>
            <div style={{ color: '#4a7a55', fontSize: '0.65em' }}>Target: <span style={{ color: best?.color }}>{best?.weeklyTarget}</span></div>
          </div>
        </div>

        {/* AVOID */}
        <div style={{ background: '#1a0008', border: '1px solid #ff335533', borderRadius: 4, padding: '12px 14px' }}>
          <div style={{ color: '#ff3355', fontSize: '0.62em', letterSpacing: '0.1em', marginBottom: 6 }}>❌ AVOID THIS WEEK</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: '1.2em' }}>{avoid?.icon}</span>
            <span style={{ color: '#ff8888', fontWeight: 700, fontSize: '0.9em' }}>{avoid?.label}</span>
          </div>
          <div style={{ color: '#c8e8d0', fontSize: '0.72em', lineHeight: 1.5 }}>{ctx.avoid_reason}</div>
        </div>
      </div>

      {/* Week note */}
      <div style={{ background: '#0a1a0e', borderLeft: '3px solid #00ff8844', padding: '8px 12px', borderRadius: '0 3px 3px 0' }}>
        <span style={{ color: '#4a7a55', fontSize: '0.65em', letterSpacing: '0.08em' }}>WEEK CONTEXT: </span>
        <span style={{ color: '#c8e8d0', fontSize: '0.72em' }}>{ctx.week_note}</span>
      </div>

      {/* Rules reminder */}
      <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
        {[
          { icon: '💰', rule: 'Exit at 50% profit — don\'t be greedy' },
          { icon: '🛑', rule: 'Exit at 2× premium loss — cut fast' },
          { icon: '📅', rule: 'Close all by Thursday 1:30pm' },
        ].map((r, i) => (
          <div key={i} style={{ background: '#0a1a0e', border: '1px solid #1a3d24', borderRadius: 3, padding: '6px 10px', display: 'flex', gap: 6, alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.85em', flexShrink: 0 }}>{r.icon}</span>
            <span style={{ color: '#4a7a55', fontSize: '0.62em', lineHeight: 1.5 }}>{r.rule}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STRATEGY ACCORDION — lazy loads on first expand
// ─────────────────────────────────────────────────────────────────────────────
function StrategyAccordion({ strategy, underlying, ctx, isRecommended }) {
  const [open, setOpen]       = useState(false);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const loaded = useRef(false);

  async function handleExpand() {
    const nowOpen = !open;
    setOpen(nowOpen);
    if (!nowOpen || loaded.current) return;
    loaded.current = true;
    setLoading(true); setError('');
    try {
      let prompt;
      if (strategy.id === 'vertical')    prompt = verticalPrompt(underlying, ctx);
      if (strategy.id === 'ironcondor')  prompt = ironCondorPrompt(underlying, ctx);
      if (strategy.id === 'coveredcall') prompt = coveredCallPrompt(underlying, ctx);
      const result = await callAPI(prompt, 500, false);
      setContent(result);
    } catch (err) {
      setError(err.message);
      loaded.current = false;
    }
    setLoading(false);
  }

  return (
    <div style={{
      border: `1px solid ${isRecommended ? strategy.color + '66' : strategy.color + '22'}`,
      borderRadius: 4, marginBottom: 10,
      boxShadow: isRecommended ? `0 0 12px ${strategy.color}11` : 'none'
    }}>
      {/* Header */}
      <button onClick={handleExpand}
        style={{
          width: '100%', textAlign: 'left', padding: '12px 16px',
          background: open ? '#0a1a0e' : isRecommended ? '#081408' : '#060e07',
          border: 'none', cursor: 'pointer', fontFamily: 'inherit',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderBottom: open ? `1px solid ${strategy.color}22` : 'none'
        }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: '1.2em' }}>{strategy.icon}</span>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: strategy.color, fontWeight: 700, fontSize: '0.88em' }}>{strategy.label}</span>
              {isRecommended && (
                <span style={{ background: strategy.color + '22', color: strategy.color, border: `1px solid ${strategy.color}55`, padding: '1px 8px', borderRadius: 2, fontSize: '0.6em', fontWeight: 700, letterSpacing: '0.08em' }}>
                  ✅ RECOMMENDED
                </span>
              )}
            </div>
            <div style={{ color: '#4a7a55', fontSize: '0.65em', marginTop: 1 }}>
              {strategy.sublabel} · {strategy.capital} · Win Rate {strategy.winRate}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {!loaded.current && !loading && (
            <span style={{ color: '#2a5a35', fontSize: '0.62em' }}>click to load trade plan</span>
          )}
          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 12, height: 12, border: `2px solid #1a3d24`, borderTop: `2px solid ${strategy.color}`, borderRadius: '50%' }} className="spin" />
              <span style={{ color: '#4a7a55', fontSize: '0.65em' }}>loading...</span>
            </div>
          )}
          {content && !loading && (
            <span style={{ color: strategy.color + '99', fontSize: '0.62em' }}>✓ loaded</span>
          )}
          <span style={{ color: strategy.color, fontSize: '0.8em' }}>{open ? '▲' : '▼'}</span>
        </div>
      </button>

      {/* Content */}
      {open && (
        <div style={{ padding: '16px 18px', background: '#050d07' }}>
          {loading && (
            <div style={{ color: '#4a7a55', fontSize: '0.78em', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 14, height: 14, border: `2px solid #1a3d24`, borderTop: `2px solid ${strategy.color}`, borderRadius: '50%' }} className="spin" />
              Building {strategy.label} trade plan for {underlying.toUpperCase()}...
            </div>
          )}
          {error && (
            <div style={{ color: '#ff3355', fontSize: '0.75em', display: 'flex', alignItems: 'center', gap: 10 }}>
              ⚠️ {error}
              <button onClick={() => { loaded.current = false; handleExpand(); }}
                style={{ background: 'transparent', border: '1px solid #ff3355', color: '#ff3355', padding: '2px 8px', fontSize: '0.85em', cursor: 'pointer', fontFamily: 'inherit', borderRadius: 2 }}>
                Retry
              </button>
            </div>
          )}
          {content && (
            <pre style={{
              fontFamily: "'Courier New', monospace",
              fontSize: '0.8em', lineHeight: 1.9,
              color: '#c8e8d0', whiteSpace: 'pre-wrap',
              wordBreak: 'break-word', margin: 0
            }}>
              {content}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────
export default function OptionsAnalyzer() {
  const [step, setStep]             = useState('input');
  const [underlying, setUnderlying] = useState('');
  const [manualSpot, setManualSpot] = useState('');
  const [manualLot, setManualLot]   = useState('');
  const [ctx, setCtx]               = useState(null);
  const [fetching, setFetching]     = useState(false);
  const [error, setError]           = useState('');

  async function fetchPlan() {
    if (!underlying.trim()) { setError('Enter an underlying — e.g. NIFTY, BANKNIFTY, RELIANCE'); return; }
    setFetching(true); setError(''); setCtx(null);
    try {
      const raw = await callAPI(marketContextPrompt(underlying.trim()), 280, true);
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Could not read market data. Please try again or enter spot manually.');
      const parsed = JSON.parse(jsonMatch[0]);
      if (manualSpot) parsed.spot = parseFloat(manualSpot);
      if (manualLot)  parsed.lot  = parseInt(manualLot);
      if (!parsed.spot) throw new Error('Live price not found. Please enter the spot price manually.');
      setCtx(parsed);
      setStep('result');
    } catch (err) {
      setError(err.message);
    }
    setFetching(false);
  }

  function reset() { setStep('input'); setCtx(null); setError(''); }

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 52px)' }}>

      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <div style={{ width: 190, flexShrink: 0, background: '#080f0a', borderRight: '1px solid #1a2e1f', padding: '14px 0', overflowY: 'auto' }}>
        <div style={{ padding: '0 12px 12px', borderBottom: '1px solid #1a2e1f', marginBottom: 10 }}>
          <div style={{ color: '#00ff88', fontSize: '0.65em', letterSpacing: '0.1em', marginBottom: 2 }}>WEEKLY PLANNER</div>
          <div style={{ color: '#2a5a35', fontSize: '0.62em', lineHeight: 1.6 }}>3 proven strategies<br/>Weekly income focus<br/>Lazy-load · Min tokens</div>
        </div>

        {STRATEGIES.map(s => (
          <div key={s.id} style={{ padding: '8px 12px', borderBottom: '1px solid #060e07' }}>
            <div style={{ display: 'flex', gap: 7, alignItems: 'center', marginBottom: 3 }}>
              <span>{s.icon}</span>
              <span style={{ color: s.color, fontSize: '0.72em', fontWeight: 600 }}>{s.label}</span>
            </div>
            <div style={{ paddingLeft: 22 }}>
              <div style={{ color: '#2a5a35', fontSize: '0.6em' }}>Capital: {s.capital}</div>
              <div style={{ color: '#2a5a35', fontSize: '0.6em' }}>Target: {s.weeklyTarget}/wk</div>
              <div style={{ color: '#2a5a35', fontSize: '0.6em' }}>Win: {s.winRate}</div>
            </div>
          </div>
        ))}

        {/* Token efficiency info */}
        <div style={{ margin: '10px 12px', padding: '8px 10px', background: '#0a1a0e', border: '1px solid #1a3d24', borderRadius: 3 }}>
          <div style={{ color: '#4a7a55', fontSize: '0.58em', marginBottom: 4, letterSpacing: '0.08em' }}>TOKEN BUDGET</div>
          <div style={{ color: '#2a5a35', fontSize: '0.62em', lineHeight: 1.7 }}>
            Context: ~280<br/>
            Per strategy: ~500<br/>
            Max total: ~1,780<br/>
            Load only on click
          </div>
        </div>

        {step === 'result' && (
          <div style={{ padding: '0 12px', marginTop: 8 }}>
            <button onClick={reset}
              style={{ width: '100%', padding: '7px', background: 'transparent', border: '1px solid #1a3d24', color: '#4a7a55', fontSize: '0.7em', cursor: 'pointer', fontFamily: 'inherit', borderRadius: 2 }}>
              ← New Week
            </button>
          </div>
        )}
      </div>

      {/* ── Main ─────────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>

        {/* INPUT */}
        {step === 'input' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80%' }}>
            <div style={{ maxWidth: 500, width: '100%' }} className="fade-in">
              <div style={{ marginBottom: 20 }}>
                <div style={{ color: '#00ff88', fontSize: '1.15em', fontWeight: 700 }}>📅 Weekly Options Planner</div>
                <div style={{ color: '#4a7a55', fontSize: '0.75em', marginTop: 4, lineHeight: 1.7 }}>
                  Enter any underlying → get this week's best strategy<br/>
                  with exact strikes, entry, target and stop-loss
                </div>
              </div>

              <div style={{ background: '#050d07', border: '1px solid #1a3d24', borderRadius: 4, padding: '22px' }}>

                {/* Underlying input */}
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', color: '#4a7a55', fontSize: '0.65em', letterSpacing: '0.1em', marginBottom: 5 }}>
                    UNDERLYING *
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', background: '#0a1a0e', border: '1px solid #1a3d24', borderRadius: 3, padding: '0 12px' }}>
                    <span style={{ color: '#00ff88', marginRight: 8 }}>$</span>
                    <input
                      value={underlying}
                      onChange={e => setUnderlying(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && fetchPlan()}
                      placeholder="NIFTY, BANKNIFTY, RELIANCE, TCS..."
                      style={{ flex: 1, background: 'transparent', border: 'none', color: '#c8e8d0', padding: '11px 0', fontSize: '0.88em', fontFamily: 'inherit', outline: 'none' }}
                    />
                  </div>
                </div>

                {/* Optional overrides */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
                  {[
                    { label: 'SPOT PRICE ₹ (optional)', val: manualSpot, set: setManualSpot, ph: 'Auto-fetched via search' },
                    { label: 'LOT SIZE (optional)',      val: manualLot,  set: setManualLot,  ph: 'Auto-detected' },
                  ].map(f => (
                    <div key={f.label}>
                      <label style={{ display: 'block', color: '#4a7a55', fontSize: '0.62em', letterSpacing: '0.1em', marginBottom: 4 }}>{f.label}</label>
                      <input value={f.val} onChange={e => f.set(e.target.value)} type="number" placeholder={f.ph}
                        style={{ width: '100%', background: '#0a1a0e', border: '1px solid #1a3d24', color: '#c8e8d0', padding: '8px 10px', fontSize: '0.8em', fontFamily: 'inherit', borderRadius: 3, outline: 'none' }} />
                    </div>
                  ))}
                </div>

                <button onClick={fetchPlan} disabled={fetching}
                  style={{ width: '100%', padding: '13px', background: fetching ? '#003322' : '#00ff88', color: '#040a06', border: 'none', borderRadius: 3, fontWeight: 700, fontSize: '0.88em', letterSpacing: '0.1em', cursor: fetching ? 'wait' : 'pointer', fontFamily: 'inherit', textTransform: 'uppercase' }}>
                  {fetching ? '⏳ Reading market...' : '📅 GET THIS WEEK\'S PLAN'}
                </button>

                {error && (
                  <div style={{ marginTop: 12, padding: '9px 13px', background: '#1a0008', border: '1px solid #ff3355', color: '#ff3355', borderRadius: 3, fontSize: '0.78em' }}>
                    ⚠️ {error}
                  </div>
                )}

                {/* Quick start guide */}
                <div style={{ marginTop: 16, background: '#0a1a0e', border: '1px solid #1a3d24', borderRadius: 3, padding: '12px 14px' }}>
                  <div style={{ color: '#4a7a55', fontSize: '0.62em', letterSpacing: '0.08em', marginBottom: 8 }}>HOW TO USE</div>
                  <div style={{ color: '#2a5a35', fontSize: '0.65em', lineHeight: 1.9 }}>
                    1️⃣  Enter underlying → click Get Plan<br/>
                    2️⃣  Planner reads VIX + trend → recommends best strategy<br/>
                    3️⃣  Click any strategy below → get exact strikes + levels<br/>
                    4️⃣  Follow entry/exit rules strictly<br/>
                    5️⃣  Exit by Thursday 1:30pm — no exceptions
                  </div>
                </div>
              </div>

              {/* Strategy cards preview */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 14 }}>
                {STRATEGIES.map(s => (
                  <div key={s.id} style={{ background: '#050d07', border: `1px solid ${s.color}22`, borderRadius: 4, padding: '10px 12px' }}>
                    <div style={{ color: s.color, fontSize: '0.78em', fontWeight: 700, marginBottom: 4 }}>{s.icon} {s.label}</div>
                    <div style={{ color: '#2a5a35', fontSize: '0.6em', lineHeight: 1.7 }}>
                      {s.capital}<br/>
                      {s.weeklyTarget}/week<br/>
                      {s.winRate} win rate
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* RESULT */}
        {step === 'result' && ctx && (
          <div className="fade-in">
            {/* Weekly Planner card at top */}
            <PlannerCard ctx={ctx} underlying={underlying} />

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ flex: 1, height: '1px', background: '#1a3d24' }} />
              <span style={{ color: '#4a7a55', fontSize: '0.7em', letterSpacing: '0.1em' }}>ALL 3 STRATEGIES — CLICK TO LOAD TRADE PLAN</span>
              <div style={{ flex: 1, height: '1px', background: '#1a3d24' }} />
            </div>

            {/* All 3 strategies — accordion, lazy load */}
            {STRATEGIES.map(s => (
              <StrategyAccordion
                key={s.id}
                strategy={s}
                underlying={underlying}
                ctx={ctx}
                isRecommended={s.id === ctx.best_strategy}
              />
            ))}

            {/* Disclaimer */}
            <div style={{ marginTop: 20, padding: '10px 14px', background: '#0a0a04', border: '1px solid #2a2a18', borderRadius: 3, fontSize: '0.68em', color: '#3a3a28', lineHeight: 1.7 }}>
              ⚠️ This weekly plan is for educational purposes only. Not SEBI-registered financial advice. Options trading involves real risk of capital loss. Always paper-trade strategies for 4–6 weeks before deploying real money. Past win rates do not guarantee future results.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
