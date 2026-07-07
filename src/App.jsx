import React, { useState } from 'react';
import Dashboard from './views/Dashboard';
import TrialSearch from './views/TrialSearch';
import EligibilityMatcher from './views/EligibilityMatcher';
import DrugSearch from './views/DrugSearch';
import CompanyInsights from './views/CompanyInsights';
import AgentPanel from './views/AgentPanel';
import { 
  Activity, Search, UserCheck, Pill, Building, Bot, 
  Settings, HeartPulse 
} from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'search':
        return <TrialSearch />;
      case 'matcher':
        return <EligibilityMatcher />;
      case 'drugs':
        return <DrugSearch />;
      case 'company':
        return <CompanyInsights />;
      case 'agent':
        return <AgentPanel />;
      default:
        return <Dashboard />;
    }
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Global Trial Landscape Dashboard';
      case 'search': return 'Multi-Attribute Trial Registry Search';
      case 'matcher': return 'Clinical Trial Enrollment Matcher';
      case 'drugs': return 'OpenFDA Approved Drug Insights';
      case 'company': return 'Pharmaceutical Sponsor Insights';
      case 'agent': return 'Clinical Trial Intelligence Agent';
      default: return 'Clinical Trial Radar';
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <HeartPulse size={24} color="#0ea5e9" />
            <span>Trial Radar</span>
            <span className="logo-badge">V2</span>
          </div>
        </div>

        <nav className="sidebar-menu">
          <div style={{ fontSize: '10px', fontWeight: '700', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '1px', padding: '4px 16px 8px', marginBottom: '4px' }}>
            Navigation
          </div>

          <div 
            className={`menu-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <Activity />
            <span>Dashboard</span>
          </div>

          <div 
            className={`menu-item ${activeTab === 'search' ? 'active' : ''}`}
            onClick={() => setActiveTab('search')}
          >
            <Search />
            <span>Clinical Search</span>
          </div>

          <div 
            className={`menu-item ${activeTab === 'matcher' ? 'active' : ''}`}
            onClick={() => setActiveTab('matcher')}
          >
            <UserCheck />
            <span>Eligibility Matcher</span>
          </div>

          <div 
            className={`menu-item ${activeTab === 'drugs' ? 'active' : ''}`}
            onClick={() => setActiveTab('drugs')}
          >
            <Pill />
            <span>OpenFDA Drug Search</span>
          </div>

          <div 
            className={`menu-item ${activeTab === 'company' ? 'active' : ''}`}
            onClick={() => setActiveTab('company')}
          >
            <Building />
            <span>Company Insights</span>
          </div>

          <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.08)', margin: '12px 0 4px' }} />
          <div style={{ fontSize: '10px', fontWeight: '700', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '1px', padding: '4px 16px 8px' }}>
            AI Intelligence
          </div>

          <div 
            className={`menu-item ${activeTab === 'agent' ? 'active' : ''}`}
            onClick={() => setActiveTab('agent')}
            style={{ 
              border: '1px dashed rgba(14, 165, 233, 0.4)',
              backgroundColor: activeTab === 'agent' ? 'var(--primary)' : 'rgba(14, 165, 233, 0.05)'
            }}
          >
            <Bot color={activeTab === 'agent' ? '#ffffff' : '#0ea5e9'} />
            <span style={{ color: activeTab === 'agent' ? '#ffffff' : '#0ea5e9', fontWeight: 'bold' }}>Trial Radar AI</span>
          </div>
        </nav>

        <div className="sidebar-footer">
          <div style={{ fontWeight: '600', marginBottom: '6px' }}>Clinical Trial Radar <span style={{ fontSize: '10px', backgroundColor: 'rgba(255,255,255,0.1)', padding: '2px 5px', borderRadius: '3px', marginLeft: '4px' }}>v2.0</span></div>
          <div style={{ fontSize: '10px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <a href="https://clinicaltrials.gov" target="_blank" rel="noreferrer">📋 ClinicalTrials.gov V2 API</a>
            <a href="https://open.fda.gov" target="_blank" rel="noreferrer">💊 OpenFDA Drug Label API</a>
          </div>
        </div>
      </aside>

      {/* Main Content Body */}
      <main className="main-content">
        <header className="top-bar">
          <div className="top-bar-title">
            <h1>{getPageTitle()}</h1>
          </div>
          <div className="top-bar-meta">
            <span style={{ fontSize: '12px', color: 'var(--text-light)' }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            <div style={{ width: '1px', height: '20px', backgroundColor: 'var(--border)' }} />
            <div className="live-badge">
              <span className="live-dot" />
              <span>Live APIs Connected</span>
            </div>
          </div>
        </header>


        <div className="content-body">
          {renderActiveView()}
        </div>
      </main>
    </div>
  );
}

export default App;
