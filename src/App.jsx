import React, { useState } from 'react';
import Navbar from './components/Navbar';
import StockAnalyzer from './components/StockAnalyzer';
import OptionsAnalyzer from './components/OptionsAnalyzer';

export default function App() {
  const [activeTab, setActiveTab] = useState('stock');

  return (
    <div style={{ minHeight: '100vh', background: '#040a06' }}>
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      {activeTab === 'stock'   && <StockAnalyzer />}
      {activeTab === 'options' && <OptionsAnalyzer />}
    </div>
  );
}
