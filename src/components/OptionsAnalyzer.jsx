import React, { useState, useRef, useEffect } from 'react';

const STRATEGIES = [
  { id: 'call',        icon: '📗', label: 'Call Option',    color: '#00ff88', desc: 'Bullish directional play' },
  { id: 'put',         icon: '📕', label: 'Put Option',     color: '#ff3355', desc: 'Bearish directional / Hedge' },
  { id: 'vertical',    icon: '↕️', label: 'Vertical Spread',color: '#44aaff', desc: 'Bull Call / Bear Put Spread' },
  { id: 'straddle',    icon: '⚡', label: 'Straddle',       color: '#ffcc00', desc: 'Volatility play — both sides' },
  { id: 'butterfly',   icon: '🦋', label: 'Butterfly',      color: '#ff88ff', desc: 'Low-cost limited range play' },
  { id: 'ironcondor',  icon: '🦅', label: 'Iron Condor',    color: '#ff9944', desc: 'Range-bound premium collection' },
];

const EXPIRY_OPTIONS = ['Weekly', 'Monthly', 'Quarterly', 'Next Month'];
const INDICES_OPT   = ['NIFTY','BANKNIFTY','FINNIFTY','MIDCPNIFTY','SENSEX'];

function TypewriterText({ text, speed = 5 }) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  const idx = useRef(0);

  useEffect(() => {
    setDisplayed(''); setDone(false); idx.current = 0;
    if (!text) return;
    const iv = setInterval(() => {
      idx.current += 4;
      if (idx.current >= text.length) { setDisplayed(text); setDone(true); clearInterval(iv); }
      else setDisplayed(text.slice(0, idx.current));
    }, speed);
    return () => clearInterval(iv);
  }, [text]);

  return <span>{displayed}{!done && text && <span className="cursor">▌</span>}</span>;
}

function InputField({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: 'block', color: '#4a7a55', fontSize: '0.66em', letterSpacing: '0.1em', marginBottom: 5 }}>{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)} type={type} placeholder={placeholder}
        style={{ width: '100%', background: '#0a1a0e', border: '1px solid #1a3d24', color: '#c8e8d0', padding: '9px 12px', fontSize: '0.85em', fontFamily: 'inherit', borderRadius: 3, outline: 'none' }} />
    </div>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: 'block', color: '#4a7a55', fontSize: '0.66em', letterSpacing: '0.1em', marginBottom: 5 }}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ width: '100%', background: '#0a1a0e', border: '1px solid #1a3d24', color: '#c8e8d0', padding: '9px 12px', fontSize: '0.85em', fontFamily: 'inherit', borderRadius: 3, outline: 'none' }}>
        <option value="">-- Select --</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

// ─── Strategy-specific form fields ────────────────────────────────────────────
function StrategyForm({ strategy, form, setForm }) {
  const f = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const commonFields = (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <InputField label="UNDERLYING (Stock/Index)" value={form.underlying||''} onChange={v=>f('underlying',v)} placeholder="e.g. NIFTY, RELIANCE" />
        <InputField label="SPOT PRICE ₹" value={form.spot||''} onChange={v=>f('spot',v)} placeholder="e.g. 24500" type="number" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <SelectField label="EXPIRY" value={form.expiry||''} onChange={v=>f('expiry',v)} options={EXPIRY_OPTIONS} />
        <InputField label="IV (Implied Volatility %)" value={form.iv||''} onChange={v=>f('iv',v)} placeholder="e.g. 18.5" type="number" />
      </div>
    </>
  );

  if (strategy === 'call') return (
    <>{commonFields}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <InputField label="STRIKE PRICE ₹" value={form.strike||''} onChange={v=>f('strike',v)} placeholder="e.g. 24500" type="number" />
        <InputField label="PREMIUM PAID ₹" value={form.premium||''} onChange={v=>f('premium',v)} placeholder="e.g. 150" type="number" />
      </div>
      <InputField label="LOT SIZE" value={form.lot||''} onChange={v=>f('lot',v)} placeholder="e.g. 25 (NIFTY=25)" type="number" />
    </>
  );

  if (strategy === 'put') return (
    <>{commonFields}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <InputField label="STRIKE PRICE ₹" value={form.strike||''} onChange={v=>f('strike',v)} placeholder="e.g. 24500" type="number" />
        <InputField label="PREMIUM PAID ₹" value={form.premium||''} onChange={v=>f('premium',v)} placeholder="e.g. 120" type="number" />
      </div>
      <InputField label="LOT SIZE" value={form.lot||''} onChange={v=>f('lot',v)} placeholder="e.g. 25" type="number" />
    </>
  );

  if (strategy === 'vertical') return (
    <>{commonFields}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <InputField label="BUY STRIKE ₹" value={form.buyStrike||''} onChange={v=>f('buyStrike',v)} placeholder="e.g. 24400" type="number" />
        <InputField label="SELL STRIKE ₹" value={form.sellStrike||''} onChange={v=>f('sellStrike',v)} placeholder="e.g. 24600" type="number" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        <InputField label="BUY PREMIUM ₹" value={form.buyPrem||''} onChange={v=>f('buyPrem',v)} placeholder="e.g. 200" type="number" />
        <InputField label="SELL PREMIUM ₹" value={form.sellPrem||''} onChange={v=>f('sellPrem',v)} placeholder="e.g. 80" type="number" />
        <InputField label="LOT SIZE" value={form.lot||''} onChange={v=>f('lot',v)} placeholder="e.g. 25" type="number" />
      </div>
      <SelectField label="SPREAD TYPE" value={form.spreadType||''} onChange={v=>f('spreadType',v)} options={['Bull Call Spread','Bear Put Spread','Bull Put Spread','Bear Call Spread']} />
    </>
  );

  if (strategy === 'straddle') return (
    <>{commonFields}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <InputField label="ATM STRIKE ₹" value={form.strike||''} onChange={v=>f('strike',v)} placeholder="e.g. 24500" type="number" />
        <InputField label="LOT SIZE" value={form.lot||''} onChange={v=>f('lot',v)} placeholder="e.g. 25" type="number" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <InputField label="CALL PREMIUM ₹" value={form.callPrem||''} onChange={v=>f('callPrem',v)} placeholder="e.g. 150" type="number" />
        <InputField label="PUT PREMIUM ₹" value={form.putPrem||''} onChange={v=>f('putPrem',v)} placeholder="e.g. 130" type="number" />
      </div>
      <SelectField label="POSITION" value={form.position||''} onChange={v=>f('position',v)} options={['Long Straddle (Buy)','Short Straddle (Sell)']} />
    </>
  );

  if (strategy === 'butterfly') return (
    <>{commonFields}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        <InputField label="LOWER STRIKE ₹" value={form.lowerStrike||''} onChange={v=>f('lowerStrike',v)} placeholder="e.g. 24300" type="number" />
        <InputField label="MIDDLE STRIKE ₹" value={form.midStrike||''} onChange={v=>f('midStrike',v)} placeholder="e.g. 24500" type="number" />
        <InputField label="UPPER STRIKE ₹" value={form.upperStrike||''} onChange={v=>f('upperStrike',v)} placeholder="e.g. 24700" type="number" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <InputField label="NET DEBIT ₹" value={form.netDebit||''} onChange={v=>f('netDebit',v)} placeholder="e.g. 50" type="number" />
        <InputField label="LOT SIZE" value={form.lot||''} onChange={v=>f('lot',v)} placeholder="e.g. 25" type="number" />
      </div>
      <SelectField label="TYPE" value={form.bfType||''} onChange={v=>f('bfType',v)} options={['Long Call Butterfly','Long Put Butterfly','Iron Butterfly']} />
    </>
  );

  if (strategy === 'ironcondor') return (
    <>{commonFields}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <InputField label="SELL PUT STRIKE ₹" value={form.sellPut||''} onChange={v=>f('sellPut',v)} placeholder="e.g. 24200" type="number" />
        <InputField label="BUY PUT STRIKE ₹" value={form.buyPut||''} onChange={v=>f('buyPut',v)} placeholder="e.g. 24000" type="number" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <InputField label="SELL CALL STRIKE ₹" value={form.sellCall||''} onChange={v=>f('sellCall',v)} placeholder="e.g. 24800" type="number" />
        <InputField label="BUY CALL STRIKE ₹" value={form.buyCall||''} onChange={v=>f('buyCall',v)} placeholder="e.g. 25000" type="number" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <InputField label="NET CREDIT RECEIVED ₹" value={form.netCredit||''} onChange={v=>f('netCredit',v)} placeholder="e.g. 80" type="number" />
        <InputField label="LOT SIZE" value={form.lot||''} onChange={v=>f('lot',v)} placeholder="e.g. 25" type="number" />
      </div>
    </>
  );

  return null;
}

export default function OptionsAnalyzer() {
  const [selectedStrategy, setSelectedStrategy] = useState('call');
  const [form, setForm] = useState({});
  const [step, setStep] = useState('input');
  const [analysis, setAnalysis] = useState('');
  const [error, setError] = useState('');
  const [loadingMsg, setLoadingMsg] = useState('');

  const strategy = STRATEGIES.find(s => s.id === selectedStrategy);

  const LOADING_MSGS = [
    '🔍 Fetching option chain data...',
    '📊 Calculating Greeks (Delta, Gamma, Theta, Vega)...',
    `🎯 Analyzing ${strategy.label} strategy...`,
    '📈 Computing max profit / max loss...',
    '📰 Reading IV & market sentiment...',
    '⚖️ Generating trade recommendation...'
  ];

  async function runAnalysis() {
    setStep('loading'); setError(''); setAnalysis('');
    let mi = 0; setLoadingMsg(LOADING_MSGS[0]);
    const iv = setInterval(() => {
      mi = (mi + 1) % LOADING_MSGS.length;
      setLoadingMsg(LOADING_MSGS[mi]);
    }, 2000);

    try {
      const prompt = `You are an expert Indian options trader and analyst (NSE/BSE).
Today: ${new Date().toLocaleDateString('en-IN')}

Analyze this options strategy:
Strategy: ${strategy.label}
${Object.entries(form).filter(([k,v])=>v).map(([k,v])=>`${k}: ${v}`).join('\n')}

Provide COMPLETE analysis:

## OPTIONS ANALYSIS: ${strategy.label.toUpperCase()}

### STRATEGY OVERVIEW
- Strategy Type: [name]
- Market Outlook: [Bullish/Bearish/Neutral/Volatile]
- Risk Profile: [Limited/Unlimited risk]
- Reward Profile: [Limited/Unlimited reward]
- Best Used When: [market condition]

### PAYOFF CALCULATION
- Max Profit: ₹[amount] (at [price level])
- Max Loss: ₹[amount] (at [price level])
- Breakeven Point(s): ₹[level1] ${['straddle','butterfly','ironcondor'].includes(selectedStrategy) ? '| ₹[level2]' : ''}
- Net Cost/Credit: ₹[amount]
- Return on Risk: [X]%

### GREEKS ANALYSIS
- Delta: [value] → [interpretation]
- Gamma: [value] → [interpretation]
- Theta: ₹[daily decay] → [interpretation]
- Vega: [value] → [interpretation]
- Rho: [value] → [interpretation]

### PROBABILITY ANALYSIS
- Probability of Profit: [X]%
- Probability of Max Loss: [X]%
- Expected Value: ₹[amount]
- IV Rank/Percentile: [value] → [High/Low IV environment]

### MARKET CONDITIONS CHECK
- Current IV: ${form.iv||'[estimate]'}%
- IV Favorable for this strategy: [Yes/No — explain]
- Theta Impact: [Positive/Negative for this trade]
- Days to Expiry sensitivity: [explain]

### RISK MANAGEMENT
- Recommended Position Size: [% of capital or lot count]
- Adjustment trigger: [when to adjust]
- Exit strategy: [when to take profit/cut loss]
- Hedge suggestion: [if any]

### SCENARIO ANALYSIS
| Price Level | P&L | Action |
|---|---|---|
| [Spot -10%] | ₹[value] | [Hold/Exit/Adjust] |
| [Spot -5%]  | ₹[value] | [Hold/Exit/Adjust] |
| [Current]   | ₹[value] | [entry point] |
| [Spot +5%]  | ₹[value] | [Hold/Exit/Adjust] |
| [Spot +10%] | ₹[value] | [Hold/Exit/Adjust] |

### TRADE RECOMMENDATION
- Entry: [conditions to enter]
- Target Exit: ₹[level] or [X]% profit
- Stop-Loss: ₹[level] or [X]% loss
- Time Stop: [exit if no movement by X days]
- Verdict: [Strong Opportunity / Good Setup / Risky / Avoid]
- Confidence: [High / Medium / Low]

⚠️ DISCLAIMER: For educational purposes only. Options trading involves significant risk. Not financial advice. Consult a SEBI-registered advisor.`;

      const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 3000,
          messages: [{ role: 'user', content: prompt }]
        })
      });

      const data = await response.json();
      clearInterval(iv);
      if (data.error) { setError(data.error.message); setStep('input'); return; }
      const text = data.content.filter(b => b.type === 'text').map(b => b.text).join('\n');
      setAnalysis(text); setStep('result');
    } catch (err) {
      clearInterval(iv);
      setError('Analysis failed: ' + err.message);
      setStep('input');
    }
  }

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 52px)' }}>
      {/* Strategy Sidebar */}
      <div style={{ width: 200, background: '#080f0a', borderRight: '1px solid #1a2e1f', padding: '16px 0', flexShrink: 0, overflowY: 'auto' }}>
        <div style={{ padding: '0 14px 12px', borderBottom: '1px solid #1a2e1f', marginBottom: 8 }}>
          <div style={{ color: '#00ff88', fontSize: '0.65em', letterSpacing: '0.1em', marginBottom: 3 }}>OPTIONS STRATEGIES</div>
          <div style={{ color: '#4a7a55', fontSize: '0.7em' }}>Select to analyze</div>
        </div>
        {STRATEGIES.map(s => (
          <button key={s.id} onClick={() => { setSelectedStrategy(s.id); setStep('input'); setAnalysis(''); setForm({}); }}
            style={{
              display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px',
              background: selectedStrategy === s.id ? '#0d2016' : 'transparent',
              border: 'none', borderLeft: selectedStrategy === s.id ? `2px solid ${s.color}` : '2px solid transparent',
              cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s'
            }}>
            <div style={{ color: selectedStrategy === s.id ? s.color : '#c8e8d0', fontSize: '0.8em', fontWeight: 600 }}>{s.icon} {s.label}</div>
            <div style={{ color: '#4a7a55', fontSize: '0.65em', marginTop: 2 }}>{s.desc}</div>
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
        {step === 'input' && (
          <div style={{ maxWidth: 680 }} className="fade-in">
            <div style={{ marginBottom: 22 }}>
              <div style={{ color: strategy.color, fontSize: '1.1em', fontWeight: 700, letterSpacing: '0.05em' }}>
                {strategy.icon} {strategy.label} Analysis
              </div>
              <div style={{ color: '#4a7a55', fontSize: '0.78em', marginTop: 3 }}>{strategy.desc}</div>
            </div>

            <div style={{ background: '#050d07', border: '1px solid #1a3d24', borderRadius: 4, padding: '22px' }}>
              <StrategyForm strategy={selectedStrategy} form={form} setForm={setForm} />

              <button onClick={runAnalysis}
                style={{
                  width: '100%', marginTop: 10, padding: '13px',
                  background: strategy.color, color: '#040a06',
                  border: 'none', borderRadius: 3, fontWeight: 700,
                  fontSize: '0.88em', letterSpacing: '0.1em',
                  cursor: 'pointer', fontFamily: 'inherit', textTransform: 'uppercase'
                }}>
                ▶ ANALYZE {strategy.label.toUpperCase()}
              </button>

              {error && <div style={{ marginTop: 12, padding: '8px 12px', background: '#1a0008', border: '1px solid #ff3355', color: '#ff3355', borderRadius: 3, fontSize: '0.78em' }}>⚠️ {error}</div>}
            </div>

            {/* Strategy Info Card */}
            <div style={{ marginTop: 18, background: '#050d07', border: `1px solid ${strategy.color}22`, borderRadius: 4, padding: '16px 18px' }}>
              <div style={{ color: strategy.color, fontSize: '0.72em', letterSpacing: '0.08em', marginBottom: 10 }}>STRATEGY QUICK REFERENCE</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: '0.75em', color: '#4a7a55' }}>
                {selectedStrategy === 'call' && <>
                  <span>📗 Bullish outlook required</span><span>Max loss = Premium paid</span>
                  <span>Max profit = Unlimited</span><span>Breakeven = Strike + Premium</span>
                </>}
                {selectedStrategy === 'put' && <>
                  <span>📕 Bearish outlook required</span><span>Max loss = Premium paid</span>
                  <span>Max profit = Strike - Premium</span><span>Breakeven = Strike - Premium</span>
                </>}
                {selectedStrategy === 'vertical' && <>
                  <span>↕️ Defined risk/reward</span><span>Lower cost than naked options</span>
                  <span>Max profit = Spread - Net Debit</span><span>Max loss = Net Debit paid</span>
                </>}
                {selectedStrategy === 'straddle' && <>
                  <span>⚡ High IV expected move play</span><span>Two breakeven points</span>
                  <span>Profit from big moves either way</span><span>Theta decay works against you</span>
                </>}
                {selectedStrategy === 'butterfly' && <>
                  <span>🦋 Low cost, low risk strategy</span><span>Max profit at middle strike</span>
                  <span>Best in low volatility markets</span><span>3 strike prices needed</span>
                </>}
                {selectedStrategy === 'ironcondor' && <>
                  <span>🦅 Range-bound premium collection</span><span>4 options, defined risk</span>
                  <span>Max profit = Net credit received</span><span>Theta positive strategy</span>
                </>}
              </div>
            </div>
          </div>
        )}

        {step === 'loading' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh' }} className="fade-in">
            <div style={{ width: 48, height: 48, border: '2px solid #0d2016', borderTop: `2px solid ${strategy.color}`, borderRadius: '50%', marginBottom: 20 }} className="spin" />
            <div style={{ color: strategy.color, fontSize: '0.88em', fontWeight: 700, marginBottom: 6 }}>{strategy.icon} {strategy.label}</div>
            <div style={{ color: '#4a7a55', fontSize: '0.78em' }}><TypewriterText text={loadingMsg} speed={20} key={loadingMsg} /></div>
          </div>
        )}

        {step === 'result' && analysis && (
          <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div>
                <span style={{ color: strategy.color, fontWeight: 700 }}>{strategy.icon} {strategy.label}</span>
                <span style={{ color: '#4a7a55', fontSize: '0.75em', marginLeft: 10 }}>{form.underlying?.toUpperCase()} · {form.expiry}</span>
              </div>
              <div style={{ display: 'flex', gap: 7 }}>
                <button onClick={() => { setStep('input'); setAnalysis(''); }}
                  style={{ background: 'transparent', border: '1px solid #1a3d24', color: '#4a7a55', padding: '4px 13px', fontSize: '0.72em', cursor: 'pointer', fontFamily: 'inherit', borderRadius: 2 }}>← New</button>
                <button onClick={() => {
                  const blob = new Blob([analysis], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a'); a.href = url;
                  a.download = `${strategy.id}_${form.underlying||'options'}_${Date.now()}.txt`; a.click();
                }}
                  style={{ background: 'transparent', border: '1px solid #1a3d24', color: '#4a7a55', padding: '4px 13px', fontSize: '0.72em', cursor: 'pointer', fontFamily: 'inherit', borderRadius: 2 }}>⬇ Export</button>
              </div>
            </div>
            <div style={{ background: '#050d07', border: '1px solid #1a3d24', borderRadius: 4, padding: '22px', fontFamily: "'Courier New', monospace", fontSize: '0.8em', lineHeight: 1.85, color: '#c8e8d0', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              <TypewriterText text={analysis} speed={2} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
