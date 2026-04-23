import React from 'react';

const NAV_ITEMS = [
  { id: 'stock',          icon: '📈', label: 'Stock Analyzer'   },
  { id: 'options',        icon: '📅', label: 'Weekly Planner'   },
  { id: 'optionshistory', icon: '📊', label: 'Options History'  },
  { id: 'education',      icon: '📚', label: 'Strategy Guide'   },
];

export default function Navbar({ activeTab, setActiveTab }) {
  const now = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  return (
    <div style={{
      background: '#050d07', borderBottom: '1px solid #0d2016',
      padding: '0 24px', display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', height: 52,
      position: 'sticky', top: 0, zIndex: 100
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00ff88', boxShadow: '0 0 8px #00ff88', animation: 'pulse 2s infinite' }} />
        <span style={{ color: '#00ff88', fontWeight: 700, letterSpacing: '0.12em', fontSize: '0.88em' }}>SRI'S MARKET ANALYZER</span>
        <span style={{ fontSize: '0.62em', color: '#2a5a35', border: '1px solid #1a3d24', padding: '1px 7px', borderRadius: 2 }}>BSE · NSE · OPTIONS</span>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4 }}>
        {NAV_ITEMS.map(item => (
          <button key={item.id} onClick={() => setActiveTab(item.id)}
            style={{
              padding: '6px 16px', background: activeTab === item.id ? '#0d2016' : 'transparent',
              border: 'none',
              borderBottom: activeTab === item.id ? '2px solid #00ff88' : '2px solid transparent',
              color: activeTab === item.id ? '#00ff88' : '#4a7a55',
              cursor: 'pointer', fontSize: '0.78em', fontFamily: 'inherit',
              letterSpacing: '0.05em', transition: 'all 0.2s'
            }}>
            {item.icon} {item.label}
          </button>
        ))}
      </div>

      {/* Clock */}
      <div style={{ fontSize: '0.68em', color: '#2a5a35' }}>{now} IST</div>
    </div>
  );
}
