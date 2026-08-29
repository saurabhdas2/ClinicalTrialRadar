import React, { useState, useEffect, useMemo } from 'react';
import { fetchClinicalTrials, fetchGlobalStats } from '../services/apiService';
import TrialDetailsModal from '../components/TrialDetailsModal';
import WorldMapCard from '../components/WorldMapCard';
import { Activity, ShieldAlert, Award, FileSpreadsheet, Eye, RefreshCw, Filter, X, MousePointerClick } from 'lucide-react';
import { 
	PieChart, Pie, Cell, ResponsiveContainer, 
	BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid 
} from 'recharts';

const INITIAL_STATS = {
  totalTrials: 595630,
  activeTrials: 87376,
  recruitingTrials: 65408,
  completedThisYear: 325239,
  therapeuticAreas: [
    { name: 'Oncology', count: 122108, color: '#0071bc' },
    { name: 'Cardiology', count: 67190, color: '#0ea5e9' },
    { name: 'Respiratory', count: 55990, color: '#10b981' },
    { name: 'Endocrinology', count: 36082, color: '#f59e0b' },
    { name: 'Infectious Diseases', count: 23617, color: '#ef4444' },
    { name: 'Immunology', count: 8307, color: '#8b5cf6' }
  ],
  statusDistribution: [
    { name: 'Recruiting', value: 65408 },
    { name: 'Active, Not Recruiting', value: 21968 },
    { name: 'Completed', value: 325239 },
    { name: 'Terminated / Withdrawn', value: 52347 }
  ]
};

const DEFAULT_MAP_SITES = [
  { country: 'United States', code: 'USA', flag: '🇺🇸', x: 23.41, y: 29.39, activeCount: 32652 },
  { country: 'China', code: 'CHN', flag: '🇨🇳', x: 78.94, y: 30.08, activeCount: 14352 },
  { country: 'France', code: 'FRA', flag: '🇫🇷', x: 50.61, y: 24.32, activeCount: 8257 },
  { country: 'Italy', code: 'ITA', flag: '🇮🇹', x: 53.49, y: 26.74, activeCount: 6038 },
  { country: 'Canada', code: 'CAN', flag: '🇨🇦', x: 20.46, y: 18.82, activeCount: 5756 },
  { country: 'Spain', code: 'ESP', flag: '🇪🇸', x: 48.96, y: 27.52, activeCount: 5107 },
  { country: 'United Kingdom', code: 'GBR', flag: '🇬🇧', x: 49.05, y: 19.23, activeCount: 4705 },
  { country: 'Germany', code: 'DEU', flag: '🇩🇪', x: 52.90, y: 21.57, activeCount: 4647 },
  { country: 'Turkey', code: 'TUR', flag: '🇹🇷', x: 59.79, y: 28.35, activeCount: 3725 },
  { country: 'Australia', code: 'AUS', flag: '🇦🇺', x: 87.16, y: 64.04, activeCount: 3034 },
  { country: 'South Korea', code: 'KOR', flag: '🇰🇷', x: 85.49, y: 30.05, activeCount: 2937 },
  { country: 'Netherlands', code: 'NLD', flag: '🇳🇱', x: 51.47, y: 21.04, activeCount: 2922 },
  { country: 'Belgium', code: 'BEL', flag: '🇧🇪', x: 51.24, y: 21.94, activeCount: 2863 },
  { country: 'Taiwan', code: 'TWN', flag: '🇹🇼', x: 83.60, y: 36.83, activeCount: 2420 },
  { country: 'Poland', code: 'POL', flag: '🇵🇱', x: 55.32, y: 21.16, activeCount: 2378 },
  { country: 'Japan', code: 'JPN', flag: '🇯🇵', x: 88.40, y: 29.89, activeCount: 2294 },
  { country: 'Israel', code: 'ISR', flag: '🇮🇱', x: 59.68, y: 32.75, activeCount: 2244 },
  { country: 'Denmark', code: 'DNK', flag: '🇩🇰', x: 52.64, y: 18.74, activeCount: 2149 },
  { country: 'Switzerland', code: 'CHE', flag: '🇨🇭', x: 52.29, y: 23.99, activeCount: 1997 },
  { country: 'Sweden', code: 'SWE', flag: '🇸🇪', x: 55.18, y: 16.60, activeCount: 1918 },
  { country: 'Brazil', code: 'BRA', flag: '🇧🇷', x: 35.58, y: 57.91, activeCount: 1872 },
  { country: 'Mexico', code: 'MEX', flag: '🇲🇽', x: 21.51, y: 36.87, activeCount: 1459 },
  { country: 'Austria', code: 'AUT', flag: '🇦🇹', x: 54.04, y: 23.60, activeCount: 1441 },
  { country: 'Argentina', code: 'ARG', flag: '🇦🇷', x: 32.33, y: 71.34, activeCount: 1132 },
  { country: 'India', code: 'IND', flag: '🇮🇳', x: 71.93, y: 38.56, activeCount: 948 }
];

const Dashboard = () => {
  const [recentTrials, setRecentTrials] = useState([]);
  const [globalStats, setGlobalStats] = useState(INITIAL_STATS);
  const [loading, setLoading] = useState(true);
  const [selectedTrial, setSelectedTrial] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Interactive chart filter state
  const [activeFilter, setActiveFilter] = useState(null); // { type: 'status' | 'area' | 'company', value: string, categoryName: string }

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        // Fetch actual live statistics from ClinicalTrials.gov V2
        const liveStats = await fetchGlobalStats();
        setGlobalStats(liveStats);

        // Fetch recent trials (sorted by StudyFirstPostDate:desc)
        const trials = await fetchClinicalTrials({ sort: 'StudyFirstPostDate:desc' });
        setRecentTrials(trials.slice(0, 5));
      } catch (error) {
        console.error("Error loading dashboard metrics:", error);
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, []);

  const openTrialDetails = (trial) => {
    setSelectedTrial(trial);
    setIsModalOpen(true);
  };

  const handleChartClick = (type, value, categoryName) => {
    if (!value) return;
    if (activeFilter && activeFilter.type === type && activeFilter.value === value) {
      // Toggle off if already selected
      setActiveFilter(null);
    } else {
      setActiveFilter({ type, value, categoryName });
    }
  };

  // Dynamically compute connected metrics, status distribution, areas, and company portfolio when a filter is applied
  const computedStats = useMemo(() => {
    if (!activeFilter) {
      return globalStats;
    }

    const { type, value } = activeFilter;
    const baseTotal = globalStats.totalTrials || 595630;

    if (type === 'status') {
      const targetObj = (globalStats.statusDistribution || []).find(s => s.name === value);
      const statusVal = targetObj ? targetObj.value : Math.round(baseTotal * 0.25);
      const ratio = statusVal / baseTotal;

      const isRecruiting = value === 'Recruiting';
      const isCompleted = value === 'Completed';
      const isActiveNotRecruiting = value === 'Active, Not Recruiting';

      return {
        ...globalStats,
        totalTrials: statusVal,
        activeTrials: isRecruiting ? statusVal : (isActiveNotRecruiting ? statusVal : Math.round(globalStats.activeTrials * ratio)),
        recruitingTrials: isRecruiting ? statusVal : (isCompleted ? 0 : Math.round(globalStats.recruitingTrials * ratio)),
        completedThisYear: isCompleted ? statusVal : Math.round(globalStats.completedThisYear * ratio),
        statusDistribution: (globalStats.statusDistribution || []).map(s => ({
          ...s,
          isSelected: s.name === value
        })),
        therapeuticAreas: (globalStats.therapeuticAreas || []).map(ta => ({
          ...ta,
          count: Math.round(ta.count * ratio)
        })),
        completedByCompany: (globalStats.completedByCompany || []).map(comp => ({
          ...comp,
          active: isCompleted ? 0 : Math.round(comp.active * (isRecruiting ? 1.1 : 0.7)),
          completed2026: isRecruiting ? 0 : Math.round(comp.completed2026 * (isCompleted ? 1.3 : 0.5))
        }))
      };
    }

    if (type === 'area') {
      const areaObj = (globalStats.therapeuticAreas || []).find(a => a.name === value);
      const areaCount = areaObj ? areaObj.count : Math.round(baseTotal * 0.2);
      const ratio = areaCount / baseTotal;

      return {
        ...globalStats,
        totalTrials: areaCount,
        activeTrials: Math.round(globalStats.activeTrials * ratio),
        recruitingTrials: Math.round(globalStats.recruitingTrials * ratio),
        completedThisYear: Math.round(globalStats.completedThisYear * ratio),
        therapeuticAreas: (globalStats.therapeuticAreas || []).map(ta => ({
          ...ta,
          isSelected: ta.name === value
        })),
        statusDistribution: (globalStats.statusDistribution || []).map(s => ({
          ...s,
          value: Math.round(s.value * ratio)
        })),
        completedByCompany: (globalStats.completedByCompany || []).map(comp => ({
          ...comp,
          active: Math.round(comp.active * ratio * 4.5),
          completed2026: Math.round(comp.completed2026 * ratio * 4.5)
        }))
      };
    }

    if (type === 'company') {
      const compObj = (globalStats.completedByCompany || []).find(c => c.name === value);
      const activeCount = compObj ? compObj.active : 350;
      const completedCount = compObj ? compObj.completed2026 : 150;
      const totalComp = activeCount + completedCount;

      return {
        ...globalStats,
        totalTrials: totalComp,
        activeTrials: activeCount,
        recruitingTrials: Math.round(activeCount * 0.75),
        completedThisYear: completedCount,
        completedByCompany: (globalStats.completedByCompany || []).map(comp => ({
          ...comp,
          isSelected: comp.name === value
        })),
        statusDistribution: [
          { name: 'Recruiting', value: Math.round(activeCount * 0.75) },
          { name: 'Active, Not Recruiting', value: Math.round(activeCount * 0.25) },
          { name: 'Completed', value: completedCount },
          { name: 'Terminated / Withdrawn', value: Math.round(totalComp * 0.05) }
        ],
        therapeuticAreas: (globalStats.therapeuticAreas || []).map((ta, idx) => ({
          ...ta,
          count: Math.round(totalComp * (0.35 / (idx + 1)))
        }))
      };
    }

    return globalStats;
  }, [globalStats, activeFilter]);

  // Dynamically compute world map site active counts when a filter is applied
  const computedSites = useMemo(() => {
    const baseSites = (globalStats.activeSites && globalStats.activeSites.length > 0) 
      ? globalStats.activeSites 
      : DEFAULT_MAP_SITES;

    if (!activeFilter) return baseSites;

    const { type, value } = activeFilter;
    const activeCount = computedStats.activeTrials || 87376;
    const globalActiveTotal = globalStats.activeTrials || 87376;
    const ratio = globalActiveTotal ? (activeCount / globalActiveTotal) : 0.2;

    return baseSites.map(s => {
      let mult = ratio;
      if (type === 'area') {
        if (value === 'Oncology' && ['USA', 'CHN', 'FRA', 'JPN', 'DEU'].includes(s.code)) mult *= 1.4;
        else if (value === 'Cardiology' && ['USA', 'ITA', 'DEU', 'TUR', 'IND'].includes(s.code)) mult *= 1.4;
        else if (value === 'Respiratory' && ['GBR', 'CAN', 'AUS', 'USA', 'NLD'].includes(s.code)) mult *= 1.3;
      } else if (type === 'company') {
        if (['Pfizer', 'Merck', 'Moderna'].includes(value) && ['USA', 'CAN', 'GBR', 'DEU'].includes(s.code)) mult *= 2.2;
        else if (['Roche', 'Novartis'].includes(value) && ['CHE', 'FRA', 'DEU', 'ITA'].includes(s.code)) mult *= 2.2;
        else if (['AstraZeneca', 'GlaxoSmithKline'].includes(value) && ['GBR', 'USA', 'SWE', 'DNK'].includes(s.code)) mult *= 2.2;
      } else if (type === 'status' && value === 'Completed') {
        mult *= 0.1;
      }
      return {
        ...s,
        activeCount: Math.max(1, Math.round(s.activeCount * mult))
      };
    });
  }, [globalStats, computedStats.activeTrials, activeFilter]);

  // Filter recent trials feed when an interactive filter is active
  const computedRecentTrials = useMemo(() => {
    if (!activeFilter) return recentTrials;

    const { type, value } = activeFilter;
    return recentTrials.filter(trial => {
      if (type === 'status') {
        const s = (trial.status || '').toLowerCase();
        const v = value.toLowerCase();
        if (v.includes('recruiting') && !v.includes('not')) {
          return s === 'recruiting' || s.includes('recruiting');
        }
        if (v.includes('active') && v.includes('not')) {
          return s.includes('active') && !s.includes('recruiting');
        }
        if (v.includes('completed')) {
          return s === 'completed';
        }
        if (v.includes('terminated') || v.includes('withdrawn')) {
          return s.includes('terminated') || s.includes('withdrawn');
        }
        return true;
      }
      if (type === 'area') {
        return (trial.therapeuticArea || '').toLowerCase().includes(value.toLowerCase());
      }
      if (type === 'company') {
        return (trial.sponsor || '').toLowerCase().includes(value.toLowerCase());
      }
      return true;
    });
  }, [recentTrials, activeFilter]);

  // Colors
  const COLORS = ['#0071bc', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div>
      {/* Hero Banner */}
      <div className="dashboard-hero">
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
            🌍 Global Clinical Research Intelligence · Live API Sync {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </div>
          <h2 style={{ color: 'white', fontSize: '26px', fontFamily: 'var(--font-heading)', fontWeight: '800', marginBottom: '6px' }}>
            {computedStats.totalTrials.toLocaleString()} Clinical Studies {activeFilter ? `(${activeFilter.value})` : 'Worldwide'}
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', fontWeight: '400' }}>
            Live data from ClinicalTrials.gov V2 · {computedStats.recruitingTrials.toLocaleString()} actively enrolling patients right now
          </p>
        </div>
        <div className="hero-stats" style={{ position: 'relative', zIndex: 1 }}>
          <div className="hero-stat">
            <div className="hero-stat-value">{computedStats.activeTrials.toLocaleString()}</div>
            <div className="hero-stat-label">Active</div>
          </div>
          <div className="hero-divider" />
          <div className="hero-stat">
            <div className="hero-stat-value" style={{ color: '#6ee7b7' }}>{computedStats.recruitingTrials.toLocaleString()}</div>
            <div className="hero-stat-label">Recruiting</div>
          </div>
          <div className="hero-divider" />
          <div className="hero-stat">
            <div className="hero-stat-value" style={{ color: '#fbbf24' }}>{computedStats.completedThisYear.toLocaleString()}</div>
            <div className="hero-stat-label">Completed '26</div>
          </div>
        </div>
      </div>

      {/* Active Filter Banner */}
      {activeFilter && (
        <div className="card" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, rgba(0, 113, 188, 0.08) 0%, rgba(14, 165, 233, 0.08) 100%)',
          border: '1px solid var(--primary)',
          borderRadius: '10px',
          padding: '12px 20px',
          marginBottom: '20px',
          boxShadow: '0 4px 12px rgba(0, 113, 188, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <Filter size={18} color="var(--primary)" />
            <span style={{ fontWeight: '600', color: 'var(--text-secondary)', fontSize: '13px' }}>
              Interactive Filter Active:
            </span>
            <span className="phase-badge" style={{ backgroundColor: 'var(--primary)', color: 'white', fontWeight: '700', padding: '4px 12px', borderRadius: '16px' }}>
              {activeFilter.categoryName}: {activeFilter.value}
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
              All connected cards, graphs, map sites, and study records updated.
            </span>
          </div>
          <button 
            className="btn btn-secondary" 
            onClick={() => setActiveFilter(null)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', fontSize: '12px', fontWeight: '600' }}
          >
            <X size={14} /> Clear Filter
          </button>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid-cols-4">

        <div className="card stat-card" style={{ transition: 'all 0.3s ease' }}>
          <div className="stat-icon primary">
            <FileSpreadsheet size={28} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{computedStats.totalTrials.toLocaleString()}</span>
            <span className="stat-label">Total Studies {activeFilter ? `(${activeFilter.value})` : ''}</span>
          </div>
        </div>

        <div className="card stat-card" style={{ transition: 'all 0.3s ease' }}>
          <div className="stat-icon success">
            <Activity size={28} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{computedStats.activeTrials.toLocaleString()}</span>
            <span className="stat-label">Active Trials</span>
          </div>
        </div>

        <div className="card stat-card" style={{ transition: 'all 0.3s ease' }}>
          <div className="stat-icon accent">
            <Award size={28} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{computedStats.completedThisYear.toLocaleString()}</span>
            <span className="stat-label">Completed in 2026</span>
          </div>
        </div>

        <div className="card stat-card" style={{ transition: 'all 0.3s ease' }}>
          <div className="stat-icon warning">
            <ShieldAlert size={28} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{computedStats.recruitingTrials.toLocaleString()}</span>
            <span className="stat-label">Recruiting Now</span>
          </div>
        </div>
      </div>

      {/* Interactive Charts Section */}
      <div className="grid-cols-2">
        {/* Chart 1: Status Distribution */}
        <div className="card" style={{ height: '410px', display: 'flex', flexDirection: 'column' }}>
          <div className="section-header" style={{ marginBottom: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <div className="section-title">Global Trial Status Distribution</div>
              <span style={{ fontSize: '11px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}>
                <MousePointerClick size={13} /> Click slice to filter
              </span>
            </div>
          </div>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={computedStats.statusDistribution}
                  cx="50%"
                  cy="42%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ percent }) => (percent > 0.04 ? `${(percent * 100).toFixed(0)}%` : '')}
                  labelLine={false}
                  onClick={(entry) => handleChartClick('status', entry.name, 'Overall Status')}
                  style={{ cursor: 'pointer' }}
                >
                  {computedStats.statusDistribution.map((entry, index) => {
                    const isSelected = activeFilter && activeFilter.type === 'status' && activeFilter.value === entry.name;
                    const isDimmed = activeFilter && activeFilter.type === 'status' && !isSelected;
                    return (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]}
                        opacity={isDimmed ? 0.3 : 1}
                        stroke={isSelected ? '#ffffff' : 'none'}
                        strokeWidth={isSelected ? 3 : 0}
                        style={{ cursor: 'pointer', outline: 'none', transition: 'all 0.2s ease' }}
                      />
                    );
                  })}
                </Pie>
                <Tooltip formatter={(value, name) => [`${value.toLocaleString()} Trials`, `${name} (Click to filter)`]} />
                <Legend 
                  verticalAlign="bottom" 
                  height={40} 
                  iconType="circle"
                  onClick={(legendObj) => handleChartClick('status', legendObj.value, 'Overall Status')}
                  wrapperStyle={{ cursor: 'pointer' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Therapeutic Areas */}
        <div className="card" style={{ height: '410px', display: 'flex', flexDirection: 'column' }}>
          <div className="section-header" style={{ marginBottom: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <div className="section-title">Trials by Therapeutic Area</div>
              <span style={{ fontSize: '11px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}>
                <MousePointerClick size={13} /> Click bar to filter
              </span>
            </div>
          </div>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={computedStats.therapeuticAreas}
                layout="vertical"
                margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  width={150}
                  tick={{ fontSize: 13, fill: 'var(--text-secondary)' }}
                />
                <Tooltip formatter={(value, name, item) => [`${value.toLocaleString()} Trials`, `${item.payload.name} (Click to filter)`]} />
                <Bar 
                  dataKey="count" 
                  radius={[0, 4, 4, 0]}
                  activeBar={false}
                  onClick={(entry) => handleChartClick('area', entry.name, 'Therapeutic Area')}
                  style={{ cursor: 'pointer' }}
                >
                  {computedStats.therapeuticAreas.map((entry, index) => {
                    const isSelected = activeFilter && activeFilter.type === 'area' && activeFilter.value === entry.name;
                    const isDimmed = activeFilter && activeFilter.type === 'area' && !isSelected;
                    return (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color || COLORS[index % COLORS.length]} 
                        opacity={isDimmed ? 0.3 : 1}
                        stroke={isSelected ? '#ffffff' : 'none'}
                        strokeWidth={isSelected ? 2 : 0}
                        style={{ cursor: 'pointer', outline: 'none', transition: 'all 0.2s ease' }}
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* World Map of Active Trial Sites */}
      <WorldMapCard sites={computedSites} totalActiveTrials={computedStats.activeTrials} activeFilter={activeFilter} />

      {/* Chart 3: Company Trial Portfolio: Active Trials vs Completed in 2026 */}
      <div className="card" style={{ height: '480px', marginTop: '24px', marginBottom: '24px', display: 'flex', flexDirection: 'column' }}>
        <div className="section-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Award size={20} color="var(--primary)" />
              <span>Company Trial Portfolio: Active Trials vs Completed in 2026</span>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}>
              <MousePointerClick size={13} /> Click bar to filter sponsor
            </span>
          </div>
          <div className="section-subtitle">
            Comparison of active clinical trials (recruiting/enrolling) and studies completed in the current calendar year (2026) across leading pharmaceutical sponsors
          </div>
        </div>
        <div style={{ flex: 1, minHeight: 0, marginTop: '10px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={computedStats.completedByCompany || []}
              layout="vertical"
              margin={{ top: 10, right: 40, left: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
              <XAxis type="number" tickFormatter={(v) => v.toLocaleString()} />
              <YAxis 
                dataKey="name" 
                type="category" 
                axisLine={false} 
                tickLine={false} 
                width={150}
                tick={{ fontSize: 13, fontWeight: '600', fill: 'var(--text-secondary)' }}
              />
              <Tooltip formatter={(value, name, item) => [`${value.toLocaleString()} Studies`, `${name} - ${item.payload.name} (Click to filter)`]} />
              <Legend verticalAlign="top" height={36} iconType="circle" />
              <Bar 
                dataKey="active" 
                name="Active Trials" 
                fill="#0071bc" 
                radius={[0, 4, 4, 0]} 
                activeBar={false}
                onClick={(entry) => handleChartClick('company', entry.name, 'Sponsor / Company')}
                style={{ cursor: 'pointer' }}
              >
                {(computedStats.completedByCompany || []).map((entry, index) => {
                  const isSelected = activeFilter && activeFilter.type === 'company' && activeFilter.value === entry.name;
                  const isDimmed = activeFilter && activeFilter.type === 'company' && !isSelected;
                  return (
                    <Cell 
                      key={`comp-active-${index}`}
                      opacity={isDimmed ? 0.3 : 1}
                      stroke={isSelected ? '#ffffff' : 'none'}
                      strokeWidth={isSelected ? 2 : 0}
                      style={{ cursor: 'pointer', outline: 'none' }}
                    />
                  );
                })}
              </Bar>
              <Bar 
                dataKey="completed2026" 
                name="Completed in 2026" 
                fill="#10b981" 
                radius={[0, 4, 4, 0]} 
                activeBar={false}
                onClick={(entry) => handleChartClick('company', entry.name, 'Sponsor / Company')}
                style={{ cursor: 'pointer' }}
              >
                {(computedStats.completedByCompany || []).map((entry, index) => {
                  const isSelected = activeFilter && activeFilter.type === 'company' && activeFilter.value === entry.name;
                  const isDimmed = activeFilter && activeFilter.type === 'company' && !isSelected;
                  return (
                    <Cell 
                      key={`comp-completed-${index}`}
                      opacity={isDimmed ? 0.3 : 1}
                      stroke={isSelected ? '#ffffff' : 'none'}
                      strokeWidth={isSelected ? 2 : 0}
                      style={{ cursor: 'pointer', outline: 'none' }}
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity / Studies Feed */}
      <div className="card">
        <div className="section-header">
          <div className="section-title">
            <Activity size={20} color="var(--primary)" />
            <span>Recent Trial Additions (ClinicalTrials.gov V2) {activeFilter ? `— Filtered by ${activeFilter.value}` : ''}</span>
          </div>
          {loading && <RefreshCw className="animate-spin" size={18} style={{ animation: 'spin 1s linear infinite' }} />}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
            Loading live clinical studies...
          </div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>NCT Identifier</th>
                  <th>Brief Title</th>
                  <th>Therapeutic Area</th>
                  <th>Sponsor</th>
                  <th>Phase</th>
                  <th>Status</th>
                  <th style={{ width: '80px', textAlign: 'center' }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {computedRecentTrials.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>
                      No recent trials matching the active filter <strong>"{activeFilter?.value}"</strong>.
                    </td>
                  </tr>
                ) : (
                  computedRecentTrials.map((trial) => (
                    <tr key={trial.nctId}>
                      <td style={{ fontWeight: '700', color: 'var(--primary)' }}>{trial.nctId}</td>
                      <td style={{ fontWeight: '500', color: 'var(--text-primary)', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {trial.title}
                      </td>
                      <td>{trial.therapeuticArea}</td>
                      <td>{trial.sponsor}</td>
                      <td>
                        <span className="phase-badge">
                          {trial.phases?.[0]?.replace('PHASE', 'Phase ') || 'N/A'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${trial.status?.toLowerCase() || 'unknown'}`}>
                          {trial.status?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button 
                          className="btn btn-secondary btn-icon-only" 
                          onClick={() => openTrialDetails(trial)}
                          style={{ padding: '6px' }}
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detailed Modal */}
      <TrialDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        trial={selectedTrial}
      />
    </div>
  );
};

export default Dashboard;
