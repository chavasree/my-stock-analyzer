import React, { useState, useRef } from 'react';
import { saveOptionsTrade } from '../utils/optionsHistoryManager';
import { useSessionState } from '../hooks/useSessionState';
import { STRATEGY_EDUCATION } from '../utils/strategyData';

const API_URL  = 'https://api.anthropic.com/v1/messages';
const MODEL    = 'claude-sonnet-4-20250514';
const DELAY_MS = 600;
const sleep = ms => new Promise(r => setTimeout(r, ms));

const STRATEGIES = [
  { id: 'vertical',    icon: '↕️', label: 'Vertical Spread',  sublabel: 'Bull Call / Bear Put',      color: '#44aaff', capital: '₹5K–₹10K',  winRate: '55–65%', weeklyTarget: '₹2K–₹4K',    bestWhen: 'Trending market' },
  { id: 'ironcondor',  icon: '🦅', label: 'Iron Condor',       sublabel: 'NIFTY/BANKNIFTY/Stocks',    color: '#ff9944', capital: '₹15K–₹25K', winRate: '60–68%', weeklyTarget: '₹1.5K–₹2.5K', bestWhen: 'Sideways market' },
  { id: 'coveredcall', icon: '📞', label: 'Covered Call',      sublabel: 'Weekly premium on stocks',  color: '#00ff88', capital: '₹50K–₹80K', winRate: '70–75%', weeklyTarget: '₹1K–₹1.5K',  bestWhen: 'Stable/mild bullish' },
  { id: 'straddle',    icon: '⚡', label: 'Straddle',          sublabel: 'Before events — big moves', color: '#ffcc00', capital: '₹5K–₹15K',  winRate: '45–55%', weeklyTarget: '₹3K–₹8K',    bestWhen: 'Before RBI/Budget/earnings' },
];

// ─────────────────────────────────────────────────────────────────────────────
// API HELPER
// ─────────────────────────────────────────────────────────────────────────────
async function callAPI(prompt, maxTokens = 600, useSearch = false, retries = 2) {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const body = {
        model: MODEL, max_tokens: maxTokens,
        messages: [{ role: 'user', content: prompt }],
        ...(useSearch && { tools: [{ type: 'web_search_20250305', name: 'web_search' }] })
      };
      const res  = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
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
// PROMPTS
// ─────────────────────────────────────────────────────────────────────────────
function marketContextPrompt(underlying) {
  return `You are an expert Indian options trader (NSE/BSE). Today: ${new Date().toLocaleDateString('en-IN')}.
Underlying: ${underlying}
Search web for live price, India VIX, lot size. Return ONLY this JSON (no other text):
{"spot":0,"lot":0,"iv":0,"vix":0,"bias":"Bullish|Bearish|Neutral|Sideways","trend_strength":"Strong|Moderate|Weak","major_event_this_week":false,"event_name":"","best_strategy":"vertical|ironcondor|coveredcall|straddle","reason":"one sentence","avoid_strategy":"vertical|ironcondor|coveredcall|straddle","avoid_reason":"one sentence","week_note":"one sentence market context"}`;
}

function strategyPrompt(underlying, ctx, strategyId) {
  const base = `NSE weekly options expert. Today: ${new Date().toLocaleDateString('en-IN')}.
${underlying} Spot=₹${ctx.spot}, Lot=${ctx.lot}, IV=${ctx.iv}%, VIX=${ctx.vix}, Bias=${ctx.bias}, Trend=${ctx.trend_strength}.
Use LIVE data where possible. If unavailable, use realistic example based on current market levels.`;

  const templates = {
    vertical: `${base}
Analyze a weekly VERTICAL SPREAD. Reply in EXACTLY this format:

═══ TRADE SETUP ═══
TYPE: [Bull Call Spread / Bear Put Spread]
REASON: [one line — why this direction based on current bias]

STRIKES & PREMIUMS (Live/Example):
  Buy : ₹[strike] [CE/PE] @ ₹[premium]
  Sell: ₹[strike] [CE/PE] @ ₹[premium]
  Net Cost   : ₹[value] per lot
  Total Outlay: ₹[value × ${ctx.lot}] for ${ctx.lot} qty

KEY LEVELS:
  Breakeven  : ₹[value]
  Target     : ₹[value] (+[X]% move needed) → Profit ₹[amount]
  Stop-Loss  : Exit if loss > ₹[amount] (cost × 1.5)
  Risk:Reward: 1:[X]

P&L SCENARIOS AT EXPIRY:
  Spot ₹[spot-5%]  → P&L: ₹[value]  [Loss/Profit]
  Spot ₹[spot-2%]  → P&L: ₹[value]  [Loss/Profit]
  Spot ₹[current]  → P&L: ₹[value]  [Loss/Profit]
  Spot ₹[spot+2%]  → P&L: ₹[value]  [Loss/Profit]
  Spot ₹[spot+5%]  → P&L: ₹[value]  [Loss/Profit]
  Spot ₹[spot+8%]  → P&L: ₹[value] (MAX PROFIT)

═══ HOW TO PLACE ON ZERODHA ═══
1. Login to Kite → go to F&O section
2. Search: [UNDERLYING][EXPIRY][STRIKE][CE/PE] (e.g. NIFTY24JAN24500CE)
3. Click BUY on [strike] CE/PE → Qty=[lot] → Order Type=LIMIT → Price=₹[premium] → CONFIRM
4. Click SELL on [strike] CE/PE → Qty=[lot] → Order Type=LIMIT → Price=₹[premium] → CONFIRM
5. Check positions tab — both legs should show
6. Set GTT alert: if premium hits ₹[target] → place exit order

═══ HOW TO PLACE ON GROWW ═══
1. Open Groww → F&O tab → Options Chain
2. Search [underlying] options → select weekly expiry
3. BUY [strike] [CE/PE]: Qty [lot] → Market/Limit @ ₹[premium] → Swipe to confirm
4. SELL [strike] [CE/PE]: Qty [lot] → Market/Limit @ ₹[premium] → Swipe to confirm
5. Monitor in Portfolio → F&O positions

EXIT RULE: Exit at 50% profit OR if loss hits ₹[amount]. Close by Thursday 1:30pm.
WIN RATE: 55-65% in trending markets
VERDICT: [Strong Setup / Good / Skip this week] — [reason]`,

    ironcondor: `${base}
Analyze a weekly IRON CONDOR. Reply in EXACTLY this format:

═══ TRADE SETUP ═══
LEGS (Live/Example):
  1. SELL PUT : ₹[strike] PE @ ₹[premium] (collect)
  2. BUY  PUT : ₹[strike] PE @ ₹[premium] (hedge)
  3. BUY  CALL: ₹[strike] CE @ ₹[premium] (hedge)
  4. SELL CALL: ₹[strike] CE @ ₹[premium] (collect)

PREMIUM:
  Net Credit  : ₹[value] per lot
  Total Income: ₹[value × ${ctx.lot}] (max profit if stays in range)
  Max Loss    : ₹[value × ${ctx.lot}]

KEY LEVELS:
  Lower Breakeven: ₹[value]
  Upper Breakeven: ₹[value]
  Profit Zone    : ₹[lower] to ₹[upper] ([X]% range)
  Danger Zones   : Below ₹[value] or Above ₹[value]

P&L SCENARIOS AT EXPIRY:
  Spot ₹[lower BE - 3%] → P&L: -₹[max loss] (MAX LOSS)
  Spot ₹[lower BE]      → P&L: ₹0 (breakeven)
  Spot ₹[middle]        → P&L: +₹[max profit] (MAX PROFIT)
  Spot ₹[upper BE]      → P&L: ₹0 (breakeven)
  Spot ₹[upper BE + 3%] → P&L: -₹[max loss] (MAX LOSS)

ADJUSTMENT RULE: If spot approaches ₹[danger level] → close that spread immediately

═══ HOW TO PLACE ON ZERODHA ═══
1. Login Kite → F&O → search [UNDERLYING] options chain
2. LEG 1 — SELL PE: [strike] PE → SELL → Qty [lot] → Limit @ ₹[premium] → CONFIRM
3. LEG 2 — BUY PE:  [strike] PE → BUY  → Qty [lot] → Limit @ ₹[premium] → CONFIRM
4. LEG 3 — BUY CE:  [strike] CE → BUY  → Qty [lot] → Limit @ ₹[premium] → CONFIRM
5. LEG 4 — SELL CE: [strike] CE → SELL → Qty [lot] → Limit @ ₹[premium] → CONFIRM
6. Verify: Positions tab shows 4 legs
7. Basket order tip: Use Kite Basket Orders to place all 4 at once

═══ HOW TO PLACE ON GROWW ═══
1. Groww → F&O → Options Chain → [Underlying]
2. Select weekly expiry
3. Place 4 orders as above one by one
4. Check all 4 in Portfolio → F&O

EXIT RULE: Exit when 50% credit collected (₹[target]) OR close by Wednesday EOD.
AVOID IF: VIX below 12 (low premium) or major event this week.
WIN RATE: 60-68% in range-bound markets
VERDICT: [Strong Setup / Good / Skip — reason]`,

    coveredcall: `${base}
Analyze a weekly COVERED CALL. Reply in EXACTLY this format:

═══ TRADE SETUP ═══
STOCK POSITION:
  Buy : [${underlying}] shares @ ₹${ctx.spot} (current price)
  Qty : 100 shares
  Cost: ₹[${ctx.spot} × 100 = total]

CALL TO SELL (Weekly):
  Sell: ₹[strike] CE weekly expiry @ ₹[premium]
  Income : ₹[premium] × 100 = ₹[weekly income]
  Monthly: ₹[weekly × 4] = [X]% monthly return on investment

EFFECTIVE PRICES:
  Effective Buy Price: ₹[spot - premium] (cost reduced by premium)
  Called Away Price  : ₹[strike] (if stock rises above this)
  Stop-Loss on stock : ₹[spot × 0.93] (exit if stock falls 7%)

P&L SCENARIOS AT EXPIRY:
  Stock @ ₹[strike-10%] → Stock loss ₹[amount] + Keep premium ₹[amount] = Net -₹[amount] ❌
  Stock @ ₹[strike-5%]  → Stock loss ₹[amount] + Keep premium ₹[amount] = Net -₹[amount] ❌
  Stock @ ₹[spot]       → No change + Keep premium = Net +₹[premium×100] ✅
  Stock @ ₹[strike]     → Keep premium + no gain = Net +₹[premium×100] ✅
  Stock @ ₹[strike+5%]  → Called away at ₹[strike] + premium = Net +₹[amount] ✅ (capped)

WEEK-BY-WEEK INCOME (4 weeks):
  Week 1: Sell ₹[strike] CE @ ₹[premium] → ₹[income]
  Week 2: Roll to new weekly strike → ₹[estimated income]
  Week 3: Roll again → ₹[estimated income]
  Week 4: Roll again → ₹[estimated income]
  Monthly Total: ₹[sum] = [X]% return

═══ HOW TO PLACE ON ZERODHA ═══
1. Login Kite → buy [${underlying}] stock: 100 qty @ ₹${ctx.spot} (CNC order)
2. Same day/next day → go to Options chain for [${underlying}]
3. Select nearest weekly expiry
4. SELL ₹[strike] CE → Qty 100 → Limit @ ₹[premium] → CONFIRM (this is covered — stock is your collateral)
5. Monitor: if stock rises near ₹[strike] → decide: let it get called away OR buy back CE and roll up
6. On expiry Thursday: if CE expires worthless → repeat next week

═══ HOW TO PLACE ON GROWW ═══
1. Buy [${underlying}] stock first: 100 qty CNC/Delivery
2. Go to F&O → Options chain → [underlying] stocks
3. Select weekly expiry → SELL [strike] CE → 100 qty → Limit → Confirm
4. Check: you'll see covered position in portfolio

ROLLING RULE: If stock surges above strike → buy back CE, sell higher strike next week
EXIT RULE  : If stock falls below ₹[stop] → exit both stock + CE immediately
WIN RATE: 70-75% of weeks
VERDICT: [Strong Setup / Good / Skip — reason]`,

    straddle: `${base}
Analyze a weekly STRADDLE (Long). Reply in EXACTLY this format:

═══ TRADE SETUP ═══
POSITION: Long Straddle
REASON: [one line — what event or catalyst justifies this?]

STRIKES & PREMIUMS (Live/Example):
  Buy CALL: ₹[ATM strike] CE @ ₹[premium]
  Buy PUT : ₹[ATM strike] PE @ ₹[premium]
  Total Cost: ₹[call+put] × ${ctx.lot} lot = ₹[total risk]

KEY LEVELS:
  Upper Breakeven: ₹[strike + total premium]
  Lower Breakeven: ₹[strike - total premium]
  Required Move  : ±[X]% from current spot to profit
  Max Loss       : ₹[total premium paid] (if market stays flat)

P&L SCENARIOS AT EXPIRY:
  Spot ₹[spot-5%]  → P&L: +₹[value] (put profits)
  Spot ₹[lower BE] → P&L: ₹0 (lower breakeven)
  Spot ₹[spot]     → P&L: -₹[total cost] (max loss if flat)
  Spot ₹[upper BE] → P&L: ₹0 (upper breakeven)
  Spot ₹[spot+5%]  → P&L: +₹[value] (call profits)

═══ HOW TO PLACE ON ZERODHA ═══
1. Login Kite → F&O → Options chain for [UNDERLYING]
2. Select weekly expiry closest to event date
3. BUY [strike] CE → qty [lot] → Limit @ ₹[premium] → Confirm
4. BUY [strike] PE → qty [lot] → Limit @ ₹[premium] → Confirm
5. Verify both legs in Positions tab
6. Set alert: notify if [underlying] moves ±[X]% from entry

═══ HOW TO PLACE ON GROWW ═══
1. Groww → F&O → Options chain → select underlying
2. Choose weekly expiry → BUY [strike] CE → qty [lot] → Confirm
3. BUY [strike] PE → qty [lot] → Confirm
4. Monitor both legs in Portfolio → F&O

ENTRY RULE : Enter 1–2 days BEFORE the event — not on event day
EXIT RULE  : Exit the losing leg immediately once market moves. Hold winner.
             OR exit both if premium drops 40% before event
TIME STOP  : Never hold a long straddle beyond 3 days — theta decay kills it
WARNING    : If no event coming, DO NOT use this strategy — time decay will lose money
WIN RATE: 45-55% — needs a big move to profit
VERDICT: [Strong Setup (event week) / Risky (no event) / Skip]`,
  };

  return templates[strategyId];
}

// ─────────────────────────────────────────────────────────────────────────────
// WEEKLY PLANNER CARD
// ─────────────────────────────────────────────────────────────────────────────
function PlannerCard({ ctx, underlying }) {
  if (!ctx) return null;
  const best  = STRATEGIES.find(s => s.id === ctx.best_strategy);
  const avoid = STRATEGIES.find(s => s.id === ctx.avoid_strategy);
  const biasColor = ctx.bias === 'Bullish' ? '#00ff88' : ctx.bias === 'Bearish' ? '#ff3355' : ctx.bias === 'Sideways' ? '#ffcc00' : '#44aaff';
  const vixColor  = ctx.vix > 20 ? '#ff3355' : ctx.vix > 13 ? '#ffcc00' : '#00ff88';

  return (
    <div style={{ background: '#050d07', border: '1px solid #1a3d24', borderRadius: 5, padding: '18px 20px', marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div>
          <div style={{ color: '#00ff88', fontWeight: 700, fontSize: '0.95em', letterSpacing: '0.04em' }}>📅 WEEKLY TRADE PLANNER</div>
          <div style={{ color: '#4a7a55', fontSize: '0.7em', marginTop: 2 }}>{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: '#00ff88', fontWeight: 700 }}>{underlying.toUpperCase()}</div>
          <div style={{ color: '#c8e8d0', fontSize: '0.85em' }}>₹{ctx.spot}</div>
        </div>
      </div>

      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 7, marginBottom: 14 }}>
        {[
          { label: 'SPOT',  value: `₹${ctx.spot}`,  color: '#c8e8d0' },
          { label: 'LOT',   value: ctx.lot,          color: '#c8e8d0' },
          { label: 'IV',    value: `${ctx.iv}%`,     color: '#ffcc00' },
          { label: 'VIX',   value: ctx.vix,          color: vixColor  },
          { label: 'BIAS',  value: ctx.bias,         color: biasColor },
        ].map(m => (
          <div key={m.label} style={{ background: '#0a1a0e', border: '1px solid #1a3d24', borderRadius: 3, padding: '7px 10px', textAlign: 'center' }}>
            <div style={{ color: '#4a7a55', fontSize: '0.56em', letterSpacing: '0.1em', marginBottom: 2 }}>{m.label}</div>
            <div style={{ color: m.color, fontWeight: 700, fontSize: '0.8em' }}>{m.value}</div>
          </div>
        ))}
      </div>

      {ctx.major_event_this_week && (
        <div style={{ background: '#1a0a00', border: '1px solid #ff444455', borderRadius: 3, padding: '7px 12px', marginBottom: 12 }}>
          <span style={{ color: '#ff8844', fontSize: '0.73em' }}>⚠️ <strong>EVENT THIS WEEK:</strong> {ctx.event_name} — Reduce size 50%</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
        <div style={{ background: '#001a0e', border: `1px solid ${best?.color || '#00ff88'}44`, borderRadius: 4, padding: '11px 13px' }}>
          <div style={{ color: '#00ff88', fontSize: '0.6em', letterSpacing: '0.1em', marginBottom: 5 }}>✅ USE THIS WEEK</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
            <span style={{ fontSize: '1.1em' }}>{best?.icon}</span>
            <span style={{ color: best?.color, fontWeight: 700, fontSize: '0.85em' }}>{best?.label}</span>
          </div>
          <div style={{ color: '#c8e8d0', fontSize: '0.7em', lineHeight: 1.5 }}>{ctx.reason}</div>
          <div style={{ marginTop: 7, display: 'flex', gap: 10 }}>
            <span style={{ color: '#4a7a55', fontSize: '0.63em' }}>Win: <span style={{ color: best?.color }}>{best?.winRate}</span></span>
            <span style={{ color: '#4a7a55', fontSize: '0.63em' }}>Target: <span style={{ color: best?.color }}>{best?.weeklyTarget}</span></span>
          </div>
        </div>
        <div style={{ background: '#1a0008', border: '1px solid #ff335533', borderRadius: 4, padding: '11px 13px' }}>
          <div style={{ color: '#ff3355', fontSize: '0.6em', letterSpacing: '0.1em', marginBottom: 5 }}>❌ AVOID THIS WEEK</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
            <span style={{ fontSize: '1.1em' }}>{avoid?.icon}</span>
            <span style={{ color: '#ff8888', fontWeight: 700, fontSize: '0.85em' }}>{avoid?.label}</span>
          </div>
          <div style={{ color: '#c8e8d0', fontSize: '0.7em', lineHeight: 1.5 }}>{ctx.avoid_reason}</div>
        </div>
      </div>

      <div style={{ background: '#0a1a0e', borderLeft: '3px solid #00ff8833', padding: '7px 12px', borderRadius: '0 3px 3px 0', marginBottom: 12 }}>
        <span style={{ color: '#4a7a55', fontSize: '0.63em' }}>WEEK CONTEXT: </span>
        <span style={{ color: '#c8e8d0', fontSize: '0.7em' }}>{ctx.week_note}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
        {[
          { icon: '💰', rule: 'Exit at 50% profit — lock in gains' },
          { icon: '🛑', rule: 'Exit at 2× premium loss — cut fast' },
          { icon: '📅', rule: 'Close ALL positions by Thu 1:30pm' },
        ].map((r, i) => (
          <div key={i} style={{ background: '#0a1a0e', border: '1px solid #1a3d24', borderRadius: 3, padding: '6px 9px', display: 'flex', gap: 5, alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.82em', flexShrink: 0 }}>{r.icon}</span>
            <span style={{ color: '#4a7a55', fontSize: '0.6em', lineHeight: 1.5 }}>{r.rule}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STRATEGY ACCORDION — lazy load, auto-save, full detail
// ─────────────────────────────────────────────────────────────────────────────
function StrategyAccordion({ strategy, underlying, ctx, isRecommended }) {
  // Keys scoped to underlying + strategy so each combo persists independently
  const sessionKey = `sri_opt_acc_${underlying}_${strategy.id}`;
  const [open, setOpen]       = useSessionState(`${sessionKey}_open`, false);
  const [content, setContent] = useSessionState(`${sessionKey}_content`, '');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [saved, setSaved]     = useState(!!content);
  // loaded ref: true if content already in session
  const loaded = useRef(!!content);

  async function handleExpand() {
    const nowOpen = !open;
    setOpen(nowOpen);
    if (!nowOpen || loaded.current) return;
    loaded.current = true;
    setLoading(true); setError('');
    try {
      const prompt = strategyPrompt(underlying, ctx, strategy.id);
      const result = await callAPI(prompt, 700, false);
      setContent(result);

      // ── AUTO-SAVE TO OPTIONS HISTORY ──────────────────────────────────
      saveOptionsTrade({
        strategyId:    strategy.id,
        strategyLabel: strategy.label,
        underlying:    underlying.toUpperCase(),
        ctx:           ctx,
        content:       result,
      });
      setSaved(true);
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
      boxShadow: isRecommended ? `0 0 14px ${strategy.color}0d` : 'none'
    }}>
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
              {isRecommended && <span style={{ background: strategy.color + '22', color: strategy.color, border: `1px solid ${strategy.color}55`, padding: '1px 8px', borderRadius: 2, fontSize: '0.6em', fontWeight: 700 }}>✅ RECOMMENDED</span>}
              {saved && <span style={{ color: '#00ff8866', fontSize: '0.6em' }}>💾 saved</span>}
            </div>
            <div style={{ color: '#4a7a55', fontSize: '0.63em', marginTop: 1 }}>
              {strategy.sublabel} · {strategy.capital} · Win {strategy.winRate} · {strategy.weeklyTarget}/wk
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {!loaded.current && !loading && <span style={{ color: '#2a5a35', fontSize: '0.62em' }}>click to load live plan</span>}
          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 12, height: 12, border: `2px solid #1a3d24`, borderTop: `2px solid ${strategy.color}`, borderRadius: '50%' }} className="spin" />
              <span style={{ color: '#4a7a55', fontSize: '0.63em' }}>loading...</span>
            </div>
          )}
          {content && !loading && <span style={{ color: strategy.color + '88', fontSize: '0.62em' }}>✓ loaded</span>}
          <span style={{ color: strategy.color, fontSize: '0.8em' }}>{open ? '▲' : '▼'}</span>
        </div>
      </button>

      {open && (
        <div style={{ padding: '16px 18px', background: '#050d07' }}>
          {/* Quick Reference Card — always visible when open, zero API cost */}
          {STRATEGY_EDUCATION[strategy.id] && (
            <div style={{
              background: strategy.color + '0e',
              border: `1px solid ${strategy.color}33`,
              borderRadius: 3, padding: '8px 12px', marginBottom: 14,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10
            }}>
              <span style={{ color: strategy.color, fontSize: '0.72em', lineHeight: 1.6, flex: 1 }}>
                {STRATEGY_EDUCATION[strategy.id].quickRef}
              </span>
              <a href="#" onClick={e => { e.preventDefault(); sessionStorage.setItem('sri_active_tab', 'education'); sessionStorage.setItem('sri_edu_strategy', strategy.id); window.dispatchEvent(new Event('sri_goto_edu')); }}
                style={{ color: strategy.color + '99', fontSize: '0.62em', whiteSpace: 'nowrap', textDecoration: 'none', border: `1px solid ${strategy.color}33`, padding: '2px 8px', borderRadius: 2 }}>
                📚 Full Guide →
              </a>
            </div>
          )}
          {loading && (
            <div style={{ color: '#4a7a55', fontSize: '0.78em', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 14, height: 14, border: `2px solid #1a3d24`, borderTop: `2px solid ${strategy.color}`, borderRadius: '50%' }} className="spin" />
              Fetching live data + building {strategy.label} plan for {underlying.toUpperCase()}...
            </div>
          )}
          {error && (
            <div style={{ color: '#ff3355', fontSize: '0.75em', display: 'flex', alignItems: 'center', gap: 10 }}>
              ⚠️ {error}
              <button onClick={() => { loaded.current = false; setOpen(false); setTimeout(() => handleExpand(), 100); }}
                style={{ background: 'transparent', border: '1px solid #ff3355', color: '#ff3355', padding: '2px 8px', fontSize: '0.85em', cursor: 'pointer', fontFamily: 'inherit', borderRadius: 2 }}>
                Retry
              </button>
            </div>
          )}
          {content && (
            <pre style={{ fontFamily: "'Courier New', monospace", fontSize: '0.79em', lineHeight: 1.9, color: '#c8e8d0', whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0 }}>
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
  // ── Persisted — survives tab switches ─────────────────────────────────────
  const [step, setStep]             = useSessionState('sri_opt_step', 'input');
  const [underlying, setUnderlying] = useSessionState('sri_opt_underlying', '');
  const [manualSpot, setManualSpot] = useSessionState('sri_opt_spot', '');
  const [manualLot, setManualLot]   = useSessionState('sri_opt_lot', '');
  const [ctx, setCtx]               = useSessionState('sri_opt_ctx', null);
  // ── Local only ────────────────────────────────────────────────────────────
  const [fetching, setFetching]     = useState(false);
  const [error, setError]           = useState('');

  async function fetchPlan() {
    if (!underlying.trim()) { setError('Enter an underlying — NIFTY, BANKNIFTY, RELIANCE...'); return; }
    setFetching(true); setError(''); setCtx(null);
    try {
      const raw  = await callAPI(marketContextPrompt(underlying.trim()), 280, true);
      const json = raw.match(/\{[\s\S]*\}/);
      if (!json) throw new Error('Could not read market data. Try again or enter spot manually.');
      const parsed = JSON.parse(json[0]);
      if (manualSpot) parsed.spot = parseFloat(manualSpot);
      if (manualLot)  parsed.lot  = parseInt(manualLot);
      if (!parsed.spot) throw new Error('Live price not found. Please enter spot price manually.');
      setCtx(parsed);
      setStep('result');
    } catch (err) {
      setError(err.message);
    }
    setFetching(false);
  }

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 52px)' }}>
      {/* Sidebar */}
      <div style={{ width: 190, flexShrink: 0, background: '#080f0a', borderRight: '1px solid #1a2e1f', padding: '14px 0', overflowY: 'auto' }}>
        <div style={{ padding: '0 12px 12px', borderBottom: '1px solid #1a2e1f', marginBottom: 10 }}>
          <div style={{ color: '#00ff88', fontSize: '0.65em', letterSpacing: '0.1em', marginBottom: 2 }}>WEEKLY PLANNER</div>
          <div style={{ color: '#2a5a35', fontSize: '0.6em', lineHeight: 1.6 }}>Live data + examples<br/>Zerodha/Groww steps<br/>P&L scenarios<br/>Auto-saves to history</div>
        </div>
        {STRATEGIES.map(s => (
          <div key={s.id} style={{ padding: '7px 12px', borderBottom: '1px solid #060e07' }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 2 }}>
              <span style={{ fontSize: '0.9em' }}>{s.icon}</span>
              <span style={{ color: s.color, fontSize: '0.7em', fontWeight: 600 }}>{s.label}</span>
            </div>
            <div style={{ paddingLeft: 20, color: '#2a5a35', fontSize: '0.6em', lineHeight: 1.6 }}>
              {s.capital} · {s.winRate}<br/>{s.weeklyTarget}/wk
            </div>
          </div>
        ))}
        <div style={{ margin: '10px 12px', padding: '8px 10px', background: '#0a1a0e', border: '1px solid #1a3d24', borderRadius: 3 }}>
          <div style={{ color: '#4a7a55', fontSize: '0.58em', marginBottom: 3 }}>WHAT YOU GET</div>
          <div style={{ color: '#2a5a35', fontSize: '0.6em', lineHeight: 1.7 }}>
            ✓ Live strikes & premiums<br/>
            ✓ P&L at every price level<br/>
            ✓ Zerodha order steps<br/>
            ✓ Groww order steps<br/>
            ✓ Auto-saved to history
          </div>
        </div>
        {step === 'result' && (
          <div style={{ padding: '0 12px', marginTop: 6 }}>
            <button onClick={() => { setStep('input'); setCtx(null); }}
              style={{ width: '100%', padding: '6px', background: 'transparent', border: '1px solid #1a3d24', color: '#4a7a55', fontSize: '0.68em', cursor: 'pointer', fontFamily: 'inherit', borderRadius: 2 }}>
              ← New Week
            </button>
          </div>
        )}
      </div>

      {/* Main */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
        {step === 'input' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80%' }}>
            <div style={{ maxWidth: 500, width: '100%' }} className="fade-in">
              <div style={{ marginBottom: 18 }}>
                <div style={{ color: '#00ff88', fontSize: '1.15em', fontWeight: 700 }}>📅 Weekly Options Planner</div>
                <div style={{ color: '#4a7a55', fontSize: '0.74em', marginTop: 4, lineHeight: 1.7 }}>
                  Live data + Zerodha/Groww steps + P&L scenarios + Auto-saved history
                </div>
              </div>
              <div style={{ background: '#050d07', border: '1px solid #1a3d24', borderRadius: 4, padding: '22px' }}>
                <div style={{ marginBottom: 13 }}>
                  <label style={{ display: 'block', color: '#4a7a55', fontSize: '0.65em', letterSpacing: '0.1em', marginBottom: 5 }}>UNDERLYING *</label>
                  <div style={{ display: 'flex', alignItems: 'center', background: '#0a1a0e', border: '1px solid #1a3d24', borderRadius: 3, padding: '0 12px' }}>
                    <span style={{ color: '#00ff88', marginRight: 8 }}>$</span>
                    <input value={underlying} onChange={e => setUnderlying(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchPlan()}
                      placeholder="NIFTY, BANKNIFTY, RELIANCE, TCS..."
                      style={{ flex: 1, background: 'transparent', border: 'none', color: '#c8e8d0', padding: '11px 0', fontSize: '0.88em', fontFamily: 'inherit', outline: 'none' }} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
                  {[
                    { label: 'SPOT ₹ (optional)', val: manualSpot, set: setManualSpot, ph: 'Auto-fetched' },
                    { label: 'LOT (optional)',     val: manualLot,  set: setManualLot,  ph: 'Auto-detected' },
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
                  {fetching ? '⏳ Reading live market...' : '📅 GET THIS WEEK\'S PLAN'}
                </button>
                {error && <div style={{ marginTop: 12, padding: '9px 13px', background: '#1a0008', border: '1px solid #ff3355', color: '#ff3355', borderRadius: 3, fontSize: '0.78em' }}>⚠️ {error}</div>}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginTop: 14 }}>
                {STRATEGIES.map(s => (
                  <div key={s.id} style={{ background: '#050d07', border: `1px solid ${s.color}22`, borderRadius: 4, padding: '10px 12px' }}>
                    <div style={{ color: s.color, fontSize: '0.76em', fontWeight: 700, marginBottom: 4 }}>{s.icon} {s.label}</div>
                    <div style={{ color: '#2a5a35', fontSize: '0.6em', lineHeight: 1.7 }}>
                      {s.capital}<br/>{s.weeklyTarget}/week<br/>{s.winRate} win rate
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 'result' && ctx && (
          <div className="fade-in">
            <PlannerCard ctx={ctx} underlying={underlying} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ flex: 1, height: '1px', background: '#1a3d24' }} />
              <span style={{ color: '#4a7a55', fontSize: '0.68em', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>
                CLICK STRATEGY → LIVE NUMBERS + ZERODHA/GROWW STEPS + P&L TABLE (AUTO-SAVED)
              </span>
              <div style={{ flex: 1, height: '1px', background: '#1a3d24' }} />
            </div>
            {STRATEGIES.map(s => (
              <StrategyAccordion key={s.id} strategy={s} underlying={underlying} ctx={ctx} isRecommended={s.id === ctx.best_strategy} />
            ))}
            <div style={{ marginTop: 16, padding: '9px 13px', background: '#0a0a04', border: '1px solid #2a2a18', borderRadius: 3, fontSize: '0.67em', color: '#3a3a28', lineHeight: 1.7 }}>
              ⚠️ Educational purposes only. Not SEBI-registered financial advice. Options carry real risk of capital loss. Paper-trade 4–6 weeks before using real money.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
