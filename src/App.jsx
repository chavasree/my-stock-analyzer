import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import StockAnalyzer from './components/StockAnalyzer';
import OptionsAnalyzer from './components/OptionsAnalyzer';
import OptionsHistory from './components/OptionsHistory';
import StrategyEducation from './components/StrategyEducation';

export default function App() {
  const [activeTab, setActiveTab] = useState(() => {
    return sessionStorage.getItem('sri_active_tab') || 'stock';
  });

  function handleTabChange(tab) {
    setActiveTab(tab);
    sessionStorage.setItem('sri_active_tab', tab);
  }

  // Listen for "Full Guide →" navigation from strategy accordion
  useEffect(() => {
    function handleGotoEdu() {
      const tab = sessionStorage.getItem('sri_active_tab');
      if (tab === 'education') setActiveTab('education');
    }
    window.addEventListener('sri_goto_edu', handleGotoEdu);
    return () => window.removeEventListener('sri_goto_edu', handleGotoEdu);
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#040a06' }}>
      <Navbar activeTab={activeTab} setActiveTab={handleTabChange} />

      {/* All tabs always mounted — display:none preserves state */}
      <div style={{ display: activeTab === 'stock'          ? 'block' : 'none' }}><StockAnalyzer /></div>
      <div style={{ display: activeTab === 'options'        ? 'block' : 'none' }}><OptionsAnalyzer /></div>
      <div style={{ display: activeTab === 'optionshistory' ? 'block' : 'none' }}><OptionsHistory /></div>
      <div style={{ display: activeTab === 'education'      ? 'block' : 'none' }}><StrategyEducation /></div>
    </div>
  );
}
