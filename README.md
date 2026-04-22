# 📈 Sri's Stock & Options Analyzer

Personal web app for analyzing Indian stocks (BSE/NSE) and options strategies.

---

## 🚀 QUICK SETUP (First Time)

### Prerequisites Check
Run these commands to verify tools are installed:
```bash
node --version      # Need v18+
npm --version       # Need v9+
git --version       # Any version
```

If not installed:
- Node.js → https://nodejs.org (Download LTS)
- Git     → https://git-scm.com/downloads

---

### Step 1: Install Dependencies
```bash
# From inside the my-stock-analyzer folder:
npm install
```
This auto-installs: react, vite, tailwindcss, recharts, lucide-react

---

### Step 2: Set Up API Key
```bash
# Copy the example env file
cp .env.example .env
```
Then open `.env` and replace `sk-ant-YOUR_KEY_HERE` with your real key from:
https://console.anthropic.com/settings/keys

---

### Step 3: Run Locally
```bash
npm run dev
```
Open browser → http://localhost:5173

---

### Step 4: Build for Production
```bash
npm run build
```
Creates a `dist/` folder ready to deploy.

---

## 🌐 DEPLOY TO VERCEL (Free)

1. Create GitHub repo and push this project:
```bash
git init
git add .
git commit -m "Sri's Stock Analyzer v1"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/my-stock-analyzer.git
git push -u origin main
```

2. Go to https://vercel.com → New Project → Import GitHub repo

3. Add environment variable in Vercel:
   - Name: `VITE_ANTHROPIC_API_KEY`
   - Value: your API key

4. Click Deploy → Get your URL!

---

## 📦 PROJECT STRUCTURE

```
my-stock-analyzer/
├── src/
│   ├── components/
│   │   ├── StockAnalyzer.jsx    ← Full 7-step stock analysis
│   │   ├── OptionsAnalyzer.jsx  ← 6 options strategies
│   │   └── Navbar.jsx           ← Top navigation
│   ├── App.jsx                  ← Main app with tab routing
│   ├── main.jsx                 ← Entry point
│   └── index.css                ← Global styles
├── .env.example                 ← Template (copy to .env)
├── .gitignore                   ← Keeps .env safe
├── vite.config.js
├── tailwind.config.js
├── vercel.json
└── package.json
```

---

## ✨ FEATURES

### 📈 Stock Analyzer
- Live price fetch via web search
- 7-step technical analysis
- All major indicators (EMA, SMA, RSI, MACD, Stochastic, Volume, Fibonacci)
- Trade setup with Buy Zone, Targets, Stop-Loss
- Confirmation checklist (7 signals)
- Final Verdict with rating

### 🎯 Options Analyzer
- Call Options
- Put Options
- Vertical Spreads (Bull/Bear)
- Straddle (Long/Short)
- Butterfly (Call/Put/Iron)
- Iron Condor
- Full Greeks analysis (Delta, Gamma, Theta, Vega)
- Scenario P&L table
- Risk management guidance

---

## ⚠️ SECURITY RULES
- NEVER push `.env` to GitHub
- NEVER share your API key
- API key on Vercel is stored securely in environment variables

---

⚠️ DISCLAIMER: For educational and personal analysis purposes only. Not financial advice. Always consult a SEBI-registered advisor before investing.
