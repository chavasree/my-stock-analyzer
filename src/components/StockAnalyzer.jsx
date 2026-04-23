import React, { useState, useEffect, useRef } from 'react';
import HistoryPanel from './HistoryPanel';
import { saveToHistory } from '../utils/historyManager';

const INDICES = [
  'BSE SENSEX','NIFTY 50','NIFTY 100','NIFTY MIDCAP 100',
  'NIFTY SMALLCAP 100','NIFTY BANK','NIFTY IT','NIFTY PHARMA',
  'NIFTY AUTO','NIFTY FMCG','NIFTY REALTY','NIFTY METAL',
  'NIFTY ENERGY','NIFTY INFRA','BSE MIDCAP','BSE SMALLCAP'
];
const TIMEFRAMES = ['Short-term (Weekly)', 'Long-term (Weekly/Monthly)', 'Both'];
const SECTIONS = [
  { id: 'trend',       icon: '📈', label: 'Trend & Structure' },
  { id: 'indicators',  icon: '📊', label: 'Technical Indicators' },
  { id: 'priceaction', icon: '🕯️', label: 'Price Action' },
  { id: 'news',        icon: '📰', label: 'News & Sentiment' },
  { id: 'setup',       icon: '🎯', label: 'Trade Setups' },
  { id: 'checklist',   icon: '✅', label: 'Confirmation' },
  { id: 'verdict',     icon: '⚖️', label: 'Final Verdict' },
];
const LOADING_MSGS = [
  '🔍 Fetching current price data...',
  '📊 Running technical indicator analysis...',
  '📈 Analyzing trend & structure...',
  '🕯️ Scanning price action patterns...',
  '📰 Reading latest market news...',
  '🎯 Computing trade setups...',
  '✅ Running confirmation checklist...',
  '⚖️ Generating final verdict...',
  '💾 Saving to history...',
];

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

function RatingBadge({ rating }) {
  const map = {
    'Strong Buy': { color: '#00ff88', bg: '#003322' },
    'Buy':        { color: '#44ff99', bg: '#002211' },
    'Hold':       { color: '#ffcc00', bg: '#332200' },
    'Avoid':      { color: '#ff8844', bg: '#331100' },
    'Sell':       { color: '#ff3355', bg: '#330011' },
  };
  const key = Object.keys(map).find(k => rating?.includes(k)) || 'Hold';
  const s = map[key];
  return (
    <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.color}`, borderRadius: 4, padding: '3px 12px', fontWeight: 700, fontSize: '0.9em' }}>{key}</span>
  );
}

function AnalysisDisplay({ analysisText, stock, index }) {
  const [activeSection, setActiveSection] = useState(0);
  const parts = analysisText.split(/(?=## STEP)/i).filter(Boolean);
  const ratingMatch = analysisText.match(/Strong Buy|Buy|Hold|Avoid|Sell/i);

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      <div style={{ width: 170, flexShrink: 0, background: '#080f0a', borderRight: '1px solid #1a2e1f', padding: '14px 0', overflowY: 'auto' }}>
        <div style={{ padding: '0 12px 10px', borderBottom: '1px solid #1a2e1f', marginBottom: 6 }}>
          <div style={{ color: '#00ff88', fontSize: '0.65em', letterSpacing: '0.1em', marginBottom: 3 }}>ANALYZING</div>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.9em' }}>{stock}</div>
          <div style={{ color: '#4a7a55', fontSize: '0.72em' }}>{index || 'NSE/BSE'}</div>
        </div>
        {SECTIONS.map((s, i) => (
          <button key={s.id} onClick={() => setActiveSection(i)}
            style={{ display: 'block', width: '100%', textAlign: 'left', padding: '7px 12px', background: activeSection === i ? '#0d2016' : 'transparent', border: 'none', borderLeft: activeSection === i ? '2px solid #00ff88' : '2px solid transparent', color: activeSection === i ? '#00ff88' : '#4a7a55', cursor: 'pointer', fontSize: '0.72em', fontFamily: 'inherit', transition: 'all 0.2s' }}>
            <span style={{ marginRight: 5 }}>{s.icon}</span>{s.label}
          </button>
        ))}
        {ratingMatch && (
          <div style={{ padding: '10px 12px', marginTop: 6, borderTop: '1px solid #1a2e1f' }}>
            <div style={{ color: '#4a7a55', fontSize: '0.62em', marginBottom: 5 }}>VERDICT</div>
            <RatingBadge rating={ratingMatch[0]} />
          </div>
        )}
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '18px 22px' }}>
        <div style={{ fontFamily: "'Courier New', monospace", fontSize: '0.8em', lineHeight: 1.85, color: '#c8e8d0', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          <TypewriterText text={parts[activeSection] || analysisText} speed={2} />
        </div>
      </div>
    </div>
  );
}

export default function StockAnalyzer() {
  const [step, setStep]                   = useState('input');
  const [stock, setStock]                 = useState('');
  const [selectedIndex, setSelectedIndex] = useState('');
  const [timeframe, setTimeframe]         = useState(TIMEFRAMES[2]);
  const [analysis, setAnalysis]           = useState('');
  const [error, setError]                 = useState('');
  const [loadingMsg, setLoadingMsg]       = useState('');
  const [showHistory, setShowHistory]     = useState(false);
  const [savedMsg, setSavedMsg]           = useState('');
  const inputRef = useRef();

  useEffect(() => { if (step === 'input' && inputRef.current) inputRef.current.focus(); }, [step]);

  function loadFromHistory(entry) {
    setStock(entry.stock);
    setSelectedIndex(entry.index);
    setTimeframe(entry.timeframe);
    setAnalysis(entry.analysisText);
    setStep('result');
    setShowHistory(false);
  }

  async function runAnalysis() {
    if (!stock.trim()) return;
    setStep('loading'); setError(''); setAnalysis('');
    let mi = 0; setLoadingMsg(LOADING_MSGS[0]);
    const iv = setInterval(() => {
      mi = (mi + 1) % LOADING_MSGS.length;
      setLoadingMsg(LOADING_MSGS[mi]);
    }, 2200);

    try {
      const prompt = `You are an expert Indian stock market analyst with 20+ years experience.
Analyze: "${stock.trim()}" ${selectedIndex ? `(Index: ${selectedIndex})` : '(NSE/BSE India)'}
Timeframe: ${timeframe}
Today: ${new Date().toLocaleDateString('en-IN')}

FIRST use web search to get the current live price of ${stock.trim()} on NSE/BSE today.

Then provide COMPLETE analysis in this EXACT format:

## STEP 1: 🔹 TREND & STRUCTURE ANALYSIS
- Current Price: ₹[price] (as of [date])
- 52-Week High: ₹[value] | 52-Week Low: ₹[value]
- Primary Trend: [Uptrend/Downtrend/Sideways]
- Secondary Trend: [describe]
- Short-term Trend: [describe]
- Market Phase: [Accumulation/Distribution/Markup/Markdown]
- Key Support: ₹[s1], ₹[s2], ₹[s3]
- Key Resistance: ₹[r1], ₹[r2], ₹[r3]
- Channels/Breakouts: [describe]

## STEP 2: 📊 TECHNICAL INDICATORS
Moving Averages:
- 20 EMA: ₹[value] → Price [above/below]
- 50 SMA: ₹[value] → Price [above/below]
- 200 SMA: ₹[value] → Price [above/below]
- Signal: [Golden Cross/Death Cross/Neutral]

RSI (14): [value] → [Overbought/Oversold/Neutral]
- Divergence: [Bullish/Bearish/None]

MACD (12,26,9):
- MACD: [value] | Signal: [value] | Histogram: [Expanding/Contracting]
- Crossover: [Bullish/Bearish/Neutral]

Stochastic: %K=[value] %D=[value] → [status]

Volume:
- Avg Volume: [value] | Recent: [expanding/contracting]
- OBV: [Bullish confirmation/Bearish divergence]

Fibonacci (Swing High ₹[h] → Swing Low ₹[l]):
- 38.2%: ₹[value]
- 50.0%: ₹[value]
- 61.8%: ₹[value]
- Current zone: [describe]

## STEP 3: 🕯️ PRICE ACTION & PATTERNS
- Candlestick Pattern: [name + significance]
- Chart Pattern: [name + status]
- Breakout/Breakdown: [describe or None]
- Volume on Breakout: [Confirmed/Not confirmed]

## STEP 4: 📰 NEWS & SENTIMENT
- Earnings: [latest + impact]
- Management: [recent statements]
- Sector: [relevant developments]
- Regulatory: [if any]
- Overall Sentiment: [Bullish/Neutral/Bearish]
- Price Impact: [explain]

## STEP 5: 🎯 TRADE SETUPS
SHORT-TERM SETUP:
- Bias: [Bullish/Bearish/Neutral]
- Buy Zone: ₹[low] to ₹[high]
- Target 1: ₹[t1] | Target 2: ₹[t2]
- Stop-Loss: ₹[sl]
- Risk:Reward = 1:[X]
- Duration: [X days/weeks]

LONG-TERM INVESTMENT VIEW:
- Trend Strength: [Strong/Moderate/Weak]
- Accumulation Zone: ₹[low] to ₹[high]
- Profit Booking: ₹[level1], ₹[level2]
- Invalidation: ₹[level]
- Horizon: [X months/years]

## STEP 6: ✅ CONFIRMATION CHECKLIST
1. Trend Direction: [✅/⚠️/❌] — [reason]
2. RSI Behavior: [✅/⚠️/❌] — [reason]
3. MACD Crossover: [✅/⚠️/❌] — [reason]
4. Volume Confirmation: [✅/⚠️/❌] — [reason]
5. Price Action Pattern: [✅/⚠️/❌] — [reason]
6. News Sentiment: [✅/⚠️/❌] — [reason]
7. Fundamentals: [✅/⚠️/❌] — [reason]
Confirmed: [X/7] | Trade Go/No-Go: [YES if ≥4 / NO]

## STEP 7: ⚖️ FINAL VERDICT
- Overall Rating: [Strong Buy / Buy / Hold / Avoid / Sell]
- Confidence: [High / Medium / Low]
- Best Strategy: [Intraday / Swing / Positional / Long-term]
- Key Catalysts: [list]
- Invalidation: [list]
- Index Context (Nifty/Sensex): [current trend & impact]

⚠️ DISCLAIMER: Technical analysis for educational purposes only. Not financial advice. Consult a SEBI-registered advisor before investing.`;

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
          max_tokens: 4000,
          tools: [{ type: 'web_search_20250305', name: 'web_search' }],
          messages: [{ role: 'user', content: prompt }]
        })
      });

      const data = await response.json();
      clearInterval(iv);
      if (data.error) { setError(data.error.message); setStep('input'); return; }

      const text = data.content.filter(b => b.type === 'text').map(b => b.text).join('\n');

      // ── AUTO-SAVE TO HISTORY ─────────────────────────────────────────────
      saveToHistory(stock.trim(), selectedIndex, timeframe, text);
      setSavedMsg('✅ Saved to history + files downloaded');
      setTimeout(() => setSavedMsg(''), 4000);

      setAnalysis(text);
      setStep('result');
    } catch (err) {
      clearInterval(iv);
      setError('Analysis failed: ' + err.message);
      setStep('input');
    }
  }

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 52px)' }}>

      {/* ── History Sidebar ───────────────────────────────────────────────── */}
      <div style={{
        width: showHistory ? 280 : 0, flexShrink: 0,
        background: '#060e07',
        borderRight: showHistory ? '1px solid #1a2e1f' : 'none',
        overflow: 'hidden', transition: 'width 0.25s ease'
      }}>
        {showHistory && <HistoryPanel onLoadAnalysis={loadFromHistory} />}
      </div>

      {/* ── Main ─────────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Topbar */}
        <div style={{ background: '#050d07', borderBottom: '1px solid #0d2016', padding: '6px 16px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <button onClick={() => setShowHistory(!showHistory)}
            style={{ background: showHistory ? '#0d2016' : 'transparent', border: `1px solid ${showHistory ? '#00ff88' : '#1a3d24'}`, color: showHistory ? '#00ff88' : '#4a7a55', padding: '4px 14px', fontSize: '0.72em', cursor: 'pointer', fontFamily: 'inherit', borderRadius: 2 }}>
            {showHistory ? '◀ Hide History' : '📋 History'}
          </button>
          {savedMsg && <span style={{ color: '#00ff88', fontSize: '0.72em' }}>{savedMsg}</span>}
        </div>

        {step === 'input' && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', overflowY: 'auto' }}>
            <div style={{ maxWidth: 620, width: '100%' }} className="fade-in">
              <div style={{ background: '#0a1a0e', border: '1px solid #1a3d24', borderRadius: '4px 4px 0 0', padding: '8px 14px', display: 'flex', gap: 7, alignItems: 'center' }}>
                {['#ff5f56','#ffbd2e','#27c93f'].map((c,i) => <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />)}
                <span style={{ color: '#2a5a35', fontSize: '0.72em', marginLeft: 8 }}>stock_analyzer.sh</span>
              </div>
              <div style={{ background: '#050d07', border: '1px solid #1a3d24', borderTop: 'none', borderRadius: '0 0 4px 4px', padding: '26px 24px' }}>
                <div style={{ marginBottom: 22 }}>
                  <div style={{ color: '#00ff88', fontSize: '0.72em', letterSpacing: '0.1em', marginBottom: 6 }}>$ ./analyze --market india --mode full --history auto</div>
                  <div style={{ color: '#00ff88', fontSize: '1.2em', fontWeight: 700 }}>Stock Technical Analyzer</div>
                  <div style={{ color: '#4a7a55', fontSize: '0.76em', marginTop: 4 }}>7-Step Deep Analysis · Auto-saves JSON + Markdown to disk</div>
                </div>

                <div style={{ marginBottom: 13 }}>
                  <label style={{ display: 'block', color: '#4a7a55', fontSize: '0.67em', letterSpacing: '0.1em', marginBottom: 5 }}>STOCK NAME OR SYMBOL</label>
                  <div style={{ display: 'flex', alignItems: 'center', background: '#0a1a0e', border: '1px solid #1a3d24', borderRadius: 3, padding: '0 12px' }}>
                    <span style={{ color: '#00ff88', marginRight: 8 }}>$</span>
                    <input ref={inputRef} value={stock} onChange={e => setStock(e.target.value)} onKeyDown={e => e.key === 'Enter' && runAnalysis()}
                      placeholder="e.g. RELIANCE, TCS, HDFC BANK, NIFTY 50..."
                      style={{ flex: 1, background: 'transparent', border: 'none', color: '#c8e8d0', padding: '11px 0', fontSize: '0.88em', fontFamily: 'inherit', outline: 'none' }} />
                  </div>
                </div>

                <div style={{ marginBottom: 13 }}>
                  <label style={{ display: 'block', color: '#4a7a55', fontSize: '0.67em', letterSpacing: '0.1em', marginBottom: 5 }}>INDEX (OPTIONAL)</label>
                  <select value={selectedIndex} onChange={e => setSelectedIndex(e.target.value)}
                    style={{ width: '100%', background: '#0a1a0e', border: '1px solid #1a3d24', color: '#c8e8d0', padding: '9px 12px', fontSize: '0.82em', fontFamily: 'inherit', borderRadius: 3, outline: 'none' }}>
                    <option value="">-- Auto-detect --</option>
                    {INDICES.map(i => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', color: '#4a7a55', fontSize: '0.67em', letterSpacing: '0.1em', marginBottom: 5 }}>TIMEFRAME</label>
                  <div style={{ display: 'flex', gap: 7 }}>
                    {TIMEFRAMES.map(tf => (
                      <button key={tf} onClick={() => setTimeframe(tf)}
                        style={{ flex: 1, padding: '7px', fontSize: '0.7em', background: timeframe === tf ? '#0d2016' : 'transparent', border: `1px solid ${timeframe === tf ? '#00ff88' : '#1a3d24'}`, color: timeframe === tf ? '#00ff88' : '#4a7a55', borderRadius: 3, cursor: 'pointer', fontFamily: 'inherit' }}>{tf}</button>
                    ))}
                  </div>
                </div>

                <button onClick={runAnalysis}
                  style={{ width: '100%', padding: '13px', background: '#00ff88', color: '#040a06', border: 'none', borderRadius: 3, fontWeight: 700, fontSize: '0.88em', letterSpacing: '0.1em', cursor: 'pointer', fontFamily: 'inherit', textTransform: 'uppercase' }}>
                  ▶ RUN FULL ANALYSIS
                </button>
                {error && <div style={{ marginTop: 12, padding: '9px 13px', background: '#1a0008', border: '1px solid #ff3355', color: '#ff3355', borderRadius: 3, fontSize: '0.78em' }}>⚠️ {error}</div>}
              </div>
            </div>
          </div>
        )}

        {step === 'loading' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }} className="fade-in">
            <div style={{ width: 48, height: 48, border: '2px solid #0d2016', borderTop: '2px solid #00ff88', borderRadius: '50%', marginBottom: 22 }} className="spin" />
            <div style={{ color: '#00ff88', fontSize: '0.9em', fontWeight: 700, marginBottom: 6 }}>Analyzing: {stock.toUpperCase()}</div>
            <div style={{ color: '#4a7a55', fontSize: '0.78em' }}><TypewriterText text={loadingMsg} speed={20} key={loadingMsg} /></div>
          </div>
        )}

        {step === 'result' && analysis && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }} className="fade-in">
            <div style={{ background: '#050d07', borderBottom: '1px solid #0d2016', padding: '7px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <span style={{ color: '#00ff88', fontWeight: 700 }}>{stock.toUpperCase()}</span>
                {selectedIndex && <span style={{ color: '#4a7a55', fontSize: '0.78em' }}>{selectedIndex}</span>}
                <span style={{ color: '#00ff44', fontSize: '0.68em' }}>💾 Saved to history</span>
              </div>
              <div style={{ display: 'flex', gap: 7 }}>
                <button onClick={() => { setStep('input'); setAnalysis(''); }}
                  style={{ background: 'transparent', border: '1px solid #1a3d24', color: '#4a7a55', padding: '4px 13px', fontSize: '0.72em', cursor: 'pointer', fontFamily: 'inherit', borderRadius: 2 }}>← New</button>
                <button onClick={() => {
                  const blob = new Blob([analysis], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a'); a.href = url;
                  a.download = `${stock.toUpperCase()}_analysis.txt`; a.click();
                }}
                  style={{ background: 'transparent', border: '1px solid #1a3d24', color: '#4a7a55', padding: '4px 13px', fontSize: '0.72em', cursor: 'pointer', fontFamily: 'inherit', borderRadius: 2 }}>⬇ Export</button>
              </div>
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <AnalysisDisplay analysisText={analysis} stock={stock.toUpperCase()} index={selectedIndex} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
