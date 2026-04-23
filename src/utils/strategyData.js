// ─────────────────────────────────────────────────────────────────────────────
// strategyData.js
// Complete static education content for 4 options strategies
// NIFTY-based examples, P&L data, mistakes, adjustment rules
// ─────────────────────────────────────────────────────────────────────────────

export const STRATEGY_EDUCATION = {

  // ══════════════════════════════════════════════════════════════════════════
  vertical: {
    id:       'vertical',
    icon:     '↕️',
    label:    'Vertical Spread',
    tagline:  'Directional trade with defined risk and defined reward',
    color:    '#44aaff',
    type:     'Debit Spread',
    risk:     'Limited — net premium paid',
    reward:   'Limited — width of spread minus premium',
    outlook:  'Bullish → Bull Call Spread | Bearish → Bear Put Spread',
    winRate:  '55–65%',
    capital:  '₹3,000–₹10,000 per trade',
    bestTime: 'Monday/Tuesday entry, exit by Thursday 1:30pm',

    // ── What is it ────────────────────────────────────────────────────────
    what: `A Vertical Spread means buying one option and simultaneously selling another option of the same type (both calls or both puts), same expiry, but different strike prices.

You pay a NET DEBIT to enter. Your maximum loss is exactly what you paid. Your maximum profit is capped at the width of the spread minus what you paid.

There are two types:
• Bull Call Spread — used when you expect the market to go UP
• Bear Put Spread — used when you expect the market to go DOWN`,

    // ── When to use ───────────────────────────────────────────────────────
    when: [
      'You have a clear directional view (bullish or bearish)',
      'India VIX is above 14 — higher premiums make spreads worthwhile',
      'Market is trending — not choppy or sideways',
      'No major events (RBI, Budget, earnings) in the same week',
      'You want to trade options but limit your max loss to a fixed amount',
    ],

    // ── When NOT to use ───────────────────────────────────────────────────
    whenNot: [
      'Market is sideways or range-bound (use Iron Condor instead)',
      'VIX below 12 — premiums too low, not worth the risk',
      'You have no clear direction view',
      'Event week — gap risk kills directional trades',
    ],

    // ── NIFTY Bull Call Spread Example ─────────────────────────────────
    example: {
      title: 'Bull Call Spread — NIFTY (Weekly)',
      setup: 'NIFTY Spot: ₹24,500 | Lot Size: 25 | Expiry: This Thursday',
      legs: [
        { action: 'BUY',  strike: '24,500 CE', premium: '₹150', role: 'Long Leg (you pay)' },
        { action: 'SELL', strike: '24,700 CE', premium: '₹75',  role: 'Short Leg (you collect)' },
      ],
      netCost:      '₹75 per share × 25 lot = ₹1,875 total risk',
      maxProfit:    '(200 – 75) × 25 = ₹3,125',
      breakeven:    '24,500 + 75 = ₹24,575',
      riskReward:   '1:1.67',
      exitTarget:   'Exit when profit = ₹1,500 (50% of max)',
      exitStopLoss: 'Exit if loss = ₹1,875 (full premium lost)',
      pnlPoints: [
        { spot: 24100, pnl: -1875, label: '-1.6%' },
        { spot: 24300, pnl: -1875, label: '-0.8%' },
        { spot: 24500, pnl: -1875, label: 'Entry' },
        { spot: 24575, pnl: 0,     label: 'BE' },
        { spot: 24600, pnl: 625,   label: '+0.4%' },
        { spot: 24700, pnl: 3125,  label: 'MAX' },
        { spot: 24900, pnl: 3125,  label: '+1.6%' },
      ],
    },

    // ── Step-by-step on Zerodha ───────────────────────────────────────────
    howToTrade: [
      'Check NIFTY direction — is it in uptrend? Use Bull Call Spread',
      'Pick ATM strike as your BUY leg (e.g. 24500 CE)',
      'Pick a strike 100–200 points above as your SELL leg (e.g. 24700 CE)',
      'Calculate net cost: Buy premium minus Sell premium = your max risk',
      'On Kite: search NIFTY24JAN24500CE → BUY → qty 25 → Limit → Confirm',
      'Then: search NIFTY24JAN24700CE → SELL → qty 25 → Limit → Confirm',
      'Set GTT alert at 50% profit level',
      'Close both legs together on exit — never close one leg alone',
    ],

    // ── Common mistakes ───────────────────────────────────────────────────
    mistakes: [
      { mistake: 'Closing only one leg', fix: 'Always close BOTH legs together. Closing just one converts it to a naked position — unlimited risk.' },
      { mistake: 'Holding till expiry', fix: 'Exit by Thursday 1:30pm. Gap risk on expiry day is unpredictable.' },
      { mistake: 'Using too wide a spread', fix: 'Keep spread width 100–200 points on NIFTY. Wider spreads cost more and need a bigger move.' },
      { mistake: 'Entering on event days', fix: 'Avoid RBI policy days, Budget day, major earnings weeks. Gaps destroy directional trades.' },
      { mistake: 'Not setting stop-loss', fix: 'If premium doubles in value against you, exit immediately. Never hope for recovery.' },
    ],

    // ── Adjustment rules ──────────────────────────────────────────────────
    adjustments: [
      { situation: 'Trade going well — near max profit', action: 'Exit early at 50–60% of max profit. Do not wait for 100%.' },
      { situation: 'Market reverses against you', action: 'Exit both legs immediately when loss equals your entry premium. No averaging.' },
      { situation: 'Spot hits your sell strike before expiry', action: 'Take profit — do not hold hoping for more. You have hit your target zone.' },
      { situation: 'VIX spikes suddenly', action: 'Exit the trade. High VIX means big moves coming — not good for spreads.' },
    ],

    quickRef: '↕️ Bull Call Spread: BUY ATM Call + SELL OTM Call | Net Debit | Profit if market rises above breakeven | Max Loss = Premium Paid',
  },

  // ══════════════════════════════════════════════════════════════════════════
  ironcondor: {
    id:       'ironcondor',
    icon:     '🦅',
    label:    'Iron Condor',
    tagline:  'Collect premium when market stays range-bound',
    color:    '#ff9944',
    type:     'Credit Spread (4 legs)',
    risk:     'Limited — spread width minus net credit',
    reward:   'Limited — net credit received upfront',
    outlook:  'Neutral — market stays within a range',
    winRate:  '60–68%',
    capital:  '₹15,000–₹25,000 per trade',
    bestTime: 'Monday entry, exit Wednesday/Thursday at 50% profit',

    what: `An Iron Condor combines a Bull Put Spread + Bear Call Spread simultaneously. You sell both an OTM Put and an OTM Call, and buy further OTM options as protection on both sides.

You collect a NET CREDIT upfront. You keep the full credit if the market stays inside your range at expiry. You lose if the market makes a big move in either direction.

Think of it as selling insurance — you profit when nothing dramatic happens.`,

    when: [
      'Market is in a range — no clear direction',
      'VIX is above 13 — more premium to collect',
      'No major events that week',
      'You expect the market to stay within ±1.5% for the week',
      'You want to profit from time decay (theta) working for you',
    ],

    whenNot: [
      'Strong trending market — big moves will breach your range',
      'VIX below 12 — not enough premium to make it worthwhile',
      'Event week — RBI, Budget, earnings release',
      'You cannot monitor the trade at least once a day',
    ],

    example: {
      title: 'Iron Condor — NIFTY (Weekly)',
      setup: 'NIFTY Spot: ₹24,500 | Lot Size: 25 | Expiry: This Thursday',
      legs: [
        { action: 'SELL', strike: '24,200 PE', premium: '₹60',  role: 'Short Put (collect)' },
        { action: 'BUY',  strike: '24,000 PE', premium: '₹28',  role: 'Long Put hedge' },
        { action: 'BUY',  strike: '24,800 CE', premium: '₹32',  role: 'Long Call hedge' },
        { action: 'SELL', strike: '25,000 CE', premium: '₹65',  role: 'Short Call (collect)' },
      ],
      netCost:      'Net Credit = (60+65–28–32) = ₹65 × 25 = ₹1,625 (your max profit)',
      maxProfit:    '₹1,625 (if NIFTY stays between 24,200 and 25,000)',
      breakeven:    'Lower: 24,200 – 65 = ₹24,135 | Upper: 25,000 + 65 = ₹25,065',
      riskReward:   'Max Loss = (200–65) × 25 = ₹3,375',
      exitTarget:   'Exit when profit = ₹812 (50% of ₹1,625)',
      exitStopLoss: 'Exit if loss = ₹3,375 (max loss) or if NIFTY approaches 24,200 or 25,000',
      pnlPoints: [
        { spot: 23900, pnl: -3375, label: 'Max Loss' },
        { spot: 24135, pnl: 0,     label: 'Lower BE' },
        { spot: 24300, pnl: 1625,  label: 'Profit' },
        { spot: 24500, pnl: 1625,  label: 'Center' },
        { spot: 24700, pnl: 1625,  label: 'Profit' },
        { spot: 25065, pnl: 0,     label: 'Upper BE' },
        { spot: 25200, pnl: -3375, label: 'Max Loss' },
      ],
    },

    howToTrade: [
      'Confirm NIFTY is sideways — check weekly range for the last 2 weeks',
      'Pick sell strikes ~1.5% away from spot on each side',
      'Pick buy strikes 200 points beyond each sell strike (your hedge)',
      'Calculate net credit: (Sell Put + Sell Call) – (Buy Put + Buy Call)',
      'On Kite: place all 4 legs — use Basket Order for efficiency',
      'LEG 1: SELL 24200 PE → qty 25 → Limit → Confirm',
      'LEG 2: BUY 24000 PE → qty 25 → Limit → Confirm',
      'LEG 3: BUY 24800 CE → qty 25 → Limit → Confirm',
      'LEG 4: SELL 25000 CE → qty 25 → Limit → Confirm',
      'Set alerts at 24,200 and 25,000 — if either hit, close the breached spread',
    ],

    mistakes: [
      { mistake: 'Setting strikes too close', fix: 'Keep sell strikes at least 1–1.5% away from spot. Too close = trade gets tested frequently.' },
      { mistake: 'Not adjusting when breached', fix: 'If spot hits your short strike, close that spread immediately. Do not hope it reverses.' },
      { mistake: 'Holding for full credit', fix: 'Exit at 50% of credit. Last 50% is not worth the risk of a sudden move.' },
      { mistake: 'Trading on event weeks', fix: 'RBI policy, Budget or major earnings can gap 2–3% instantly. One event wipes 3 weeks of profit.' },
      { mistake: 'Ignoring VIX direction', fix: 'If VIX is rising fast, IV expansion can hurt your short options. Exit when VIX spikes above 18.' },
    ],

    adjustments: [
      { situation: 'Spot approaches short PUT strike', action: 'Close the put spread (buy back short put, sell long put). Keep call spread open.' },
      { situation: 'Spot approaches short CALL strike', action: 'Close the call spread. Keep put spread open.' },
      { situation: 'Both sides under threat (big gap)', action: 'Close entire trade immediately. Accept the loss. Do not average.' },
      { situation: '50% profit reached before Wednesday', action: 'Close the trade. Bank the profit. No reason to hold longer.' },
      { situation: 'Monday gap opening beyond your range', action: 'Exit at market open. The trade thesis has failed.' },
    ],

    quickRef: '🦅 Iron Condor: SELL OTM Put + BUY lower Put + BUY OTM Call + SELL higher Call | Net Credit | Profit = market stays range-bound | 4 legs total',
  },

  // ══════════════════════════════════════════════════════════════════════════
  coveredcall: {
    id:       'coveredcall',
    icon:     '📞',
    label:    'Covered Call',
    tagline:  'Earn weekly rent on stocks you already hold',
    color:    '#00ff88',
    type:     'Income Strategy (Stock + Short Call)',
    risk:     'Stock downside minus premium collected',
    reward:   'Premium collected + stock appreciation up to strike',
    outlook:  'Neutral to mildly bullish on the stock',
    winRate:  '70–75%',
    capital:  '₹50,000–₹80,000 (stock purchase)',
    bestTime: 'Sell call on Monday, let expire Thursday or buy back at 25% value',

    what: `A Covered Call means you own shares of a stock AND sell a Call option against those shares.

You collect the call premium upfront as income. If the stock stays below your strike price at expiry, the call expires worthless and you keep the premium. If stock rises above strike, your shares get "called away" at the strike price — still a profit.

It is called "covered" because your sold call is covered by the shares you own — no naked risk.`,

    when: [
      'You own or want to own a quality stock for the long term',
      'You believe the stock will be flat or rise slowly this week',
      'Stock IV is elevated — higher premiums available',
      'You want to generate 2–6% monthly income on your stock portfolio',
      'Stock has low beta — does not jump wildly on random days',
    ],

    whenNot: [
      'Stock is expected to surge — you will miss the upside above strike',
      'Major earnings announcement coming — stock can gap massively',
      'You plan to sell your shares this week',
      'Stock has been very volatile lately — risk of sharp drop',
    ],

    example: {
      title: 'Covered Call — RELIANCE (Weekly)',
      setup: 'RELIANCE Spot: ₹2,900 | 100 shares | Weekly expiry Thursday',
      legs: [
        { action: 'OWN',  strike: '100 shares',   premium: '₹2,900',  role: 'Stock position (your collateral)' },
        { action: 'SELL', strike: '2,950 CE',      premium: '₹30',     role: 'Weekly Call sold' },
      ],
      netCost:      '100 shares × ₹2,900 = ₹2,90,000 stock cost | Premium collected = ₹3,000',
      maxProfit:    'If called away: (₹2,950 – ₹2,900 + ₹30) × 100 = ₹8,000',
      breakeven:    '₹2,900 – ₹30 = ₹2,870 (stock must fall below this to lose)',
      riskReward:   'Monthly income: ₹3,000 × 4 = ₹12,000 = 4.1% monthly return',
      exitTarget:   'Let call expire worthless Thursday → sell new call next Monday',
      exitStopLoss: 'If stock falls below ₹2,697 (7% stop) → exit stock + buy back call',
      pnlPoints: [
        { spot: 2700, pnl: -17000, label: '-6.9%' },
        { spot: 2800, pnl: -7000,  label: '-3.4%' },
        { spot: 2870, pnl: 0,      label: 'BE' },
        { spot: 2900, pnl: 3000,   label: 'Entry' },
        { spot: 2950, pnl: 8000,   label: 'Max' },
        { spot: 3000, pnl: 8000,   label: 'Capped' },
        { spot: 3100, pnl: 8000,   label: 'Capped' },
      ],
    },

    howToTrade: [
      'Buy 100 shares of a quality stock (RELIANCE, HDFC, TCS, INFY) — use CNC/Delivery order',
      'Same day or next day: go to Options chain for that stock',
      'Select nearest weekly expiry',
      'Choose a strike 1–2% ABOVE current price (slightly OTM)',
      'SELL that Call option — Qty = 100 (or 1 lot) — Limit order at market premium',
      'Collect the premium immediately in your account',
      'Thursday: if stock below strike → call expires worthless, keep premium → repeat next week',
      'Thursday: if stock above strike → shares get called away at strike price → you still profit',
      'Rolling: if stock approaches strike early → buy back call, sell higher strike next week',
    ],

    mistakes: [
      { mistake: 'Selling too deep ITM', fix: 'Always sell OTM calls — 1–2% above spot. ITM calls cap your profit AND give less premium per risk.' },
      { mistake: 'Not owning the stock first', fix: 'NEVER sell a call without owning the shares — that becomes a naked call with unlimited risk.' },
      { mistake: 'Forgetting to roll', fix: 'If stock rises toward your strike, roll your call to a higher strike next week before expiry.' },
      { mistake: 'Ignoring stock stop-loss', fix: 'The premium does not protect you from a 10–20% stock crash. Always have a stop on the stock itself.' },
      { mistake: 'Selling before earnings', fix: 'Stocks can gap 5–15% on earnings. Do not sell weekly calls the week of earnings results.' },
    ],

    adjustments: [
      { situation: 'Stock rises above your call strike', action: 'Let shares get called away — you profit. Or roll the call to higher strike + next week.' },
      { situation: 'Stock falls 3–4%', action: 'The premium provides some cushion. Hold if fundamentals are intact. Set alert at your stop level.' },
      { situation: 'Stock falls below your stop-loss level', action: 'Sell the stock AND buy back the call. Exit both positions. Capital protection first.' },
      { situation: 'Call premium drops to 25% of what you sold it for', action: 'Buy it back (cheap) and sell a new one for next week. Keeps premium rolling.' },
      { situation: 'Earnings week approaching', action: 'Do not sell a call this week. Wait until after earnings to resume the strategy.' },
    ],

    quickRef: '📞 Covered Call: OWN stock + SELL OTM Call above it | Collect weekly premium | Profit = premium + stock gain up to strike | Miss upside above strike',
  },

  // ══════════════════════════════════════════════════════════════════════════
  straddle: {
    id:       'straddle',
    icon:     '⚡',
    label:    'Straddle',
    tagline:  'Profit from big moves in either direction',
    color:    '#ffcc00',
    type:     'Debit Strategy (Long) or Credit (Short)',
    risk:     'Long: Premium paid | Short: Spread beyond breakevens',
    reward:   'Long: Unlimited | Short: Net credit received',
    outlook:  'Long: Expecting big move | Short: Expecting no move',
    winRate:  '45–55% (Long) | 55–65% (Short)',
    capital:  '₹5,000–₹15,000 per trade',
    bestTime: 'Before major events (Long) | After IV spike settles (Short)',

    what: `A Straddle means buying (or selling) BOTH a Call AND a Put at the SAME strike price, same expiry.

LONG STRADDLE — You buy both. You profit if the market makes a BIG move in either direction. You lose if the market stays flat and time decay eats your premium.

SHORT STRADDLE — You sell both. You collect premium upfront and profit if market stays flat. But you have unlimited risk if the market moves sharply. Avoid short straddle unless you are experienced.

Best used BEFORE known events — RBI policy, Budget, major earnings — when a big move is expected but direction is unknown.`,

    when: [
      'Before a major event where big move expected but direction unknown',
      'IV (implied volatility) is LOW and expected to spike — long straddle',
      'Stock is coiling in a tight range — breakout expected soon',
      'You see signs of accumulation or distribution with no clear direction',
      'Short straddle: after an event, IV has spiked and you expect it to fall',
    ],

    whenNot: [
      'No event coming — time decay (theta) will kill the long straddle daily',
      'IV is already very HIGH — buying a straddle when IV is high means you overpay',
      'You cannot monitor the trade actively — straddles need quick exits',
      'Avoid SHORT straddle if you are a beginner — risk is unlimited on both sides',
    ],

    example: {
      title: 'Long Straddle — NIFTY (Before RBI Policy)',
      setup: 'NIFTY Spot: ₹24,500 | Lot Size: 25 | 2 days before RBI policy',
      legs: [
        { action: 'BUY', strike: '24,500 CE', premium: '₹150', role: 'Call leg (profit if market rises)' },
        { action: 'BUY', strike: '24,500 PE', premium: '₹140', role: 'Put leg (profit if market falls)' },
      ],
      netCost:      '(₹150 + ₹140) × 25 = ₹7,250 total risk',
      maxProfit:    'Unlimited on upside | ₹24,500 × 25 on downside (theoretical)',
      breakeven:    'Upper: 24,500 + 290 = ₹24,790 | Lower: 24,500 – 290 = ₹24,210',
      riskReward:   'Need ±1.18% move to breakeven. RBI events typically move ±1–3%',
      exitTarget:   'Exit when total premium doubles (₹14,500) OR on event day itself',
      exitStopLoss: 'If premium falls 40% (₹4,350 loss) → exit both legs',
      pnlPoints: [
        { spot: 23800, pnl: 10250,  label: '-2.9%' },
        { spot: 24210, pnl: 0,      label: 'Lower BE' },
        { spot: 24350, pnl: -3625,  label: '-0.6%' },
        { spot: 24500, pnl: -7250,  label: 'Max Loss' },
        { spot: 24650, pnl: -3625,  label: '+0.6%' },
        { spot: 24790, pnl: 0,      label: 'Upper BE' },
        { spot: 25100, pnl: 10250,  label: '+2.5%' },
      ],
    },

    howToTrade: [
      'Identify an upcoming event — RBI, Budget, major stock earnings',
      'Enter 1–3 days BEFORE the event — not on event day (IV already high by then)',
      'Choose the ATM strike — whichever strike is closest to current spot price',
      'On Kite: BUY 24500 CE → qty 25 → Limit → Confirm',
      'Then: BUY 24500 PE → qty 25 → Limit → Confirm',
      'Calculate your breakeven: Spot ± total premium paid',
      'On event day: as soon as market makes a big move, EXIT the losing leg first, hold winning leg',
      'Or exit both legs together once premium doubles',
      'Never hold a long straddle more than 3–4 days — theta decay is severe',
    ],

    mistakes: [
      { mistake: 'Buying after the event has happened', fix: 'IV crushes after events. Buy BEFORE the event, not after. Day after event = overpriced options.' },
      { mistake: 'Holding too long', fix: 'Time decay destroys straddles fast. Exit within 1–3 days of entry. Do not hold to expiry.' },
      { mistake: 'Entering when IV is already high', fix: 'Check IV rank. If IV is already above 80th percentile, the straddle is overpriced — skip it.' },
      { mistake: 'Not exiting the losing leg', fix: 'Once market moves clearly one way, sell the losing leg immediately. It still has some value.' },
      { mistake: 'Using short straddle as a beginner', fix: 'Short straddle has unlimited risk. Stick to long straddle only until you have 1+ year of options experience.' },
    ],

    adjustments: [
      { situation: 'Market moves quickly in one direction', action: 'Sell the losing leg immediately. It still has value. Let the winning leg run.' },
      { situation: 'Event passes, market barely moved', action: 'Exit both legs the same day. IV will crush and premium will evaporate fast.' },
      { situation: 'Premium drops 30–40% before event', action: 'Consider exiting early — the trade thesis (big move) may not materialize.' },
      { situation: 'Premium doubles', action: 'Exit. Take the 100% gain. Greed after a double leads to giving it back.' },
      { situation: 'One leg profits significantly', action: 'Convert to a single leg trade — sell the losing leg, hold only the winning call or put.' },
    ],

    quickRef: '⚡ Long Straddle: BUY ATM Call + BUY ATM Put | Profit from BIG move either way | Lose if market stays flat | Best before events | Exit fast after move',
  },
};

export const STRATEGY_LIST = Object.values(STRATEGY_EDUCATION);
