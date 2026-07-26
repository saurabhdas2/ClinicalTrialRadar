import React, { useState, useEffect, useRef } from 'react';
import { fetchClinicalTrials, fetchGlobalStats } from '../services/apiService';
import TrialDetailsModal from '../components/TrialDetailsModal';
import WorldMapCard from '../components/WorldMapCard';
import { Activity, ShieldAlert, Award, FileSpreadsheet, Eye, RefreshCw, Filter, X } from 'lucide-react';
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
    { name: 'Recruiting', value: 65408, statusKey: 'RECRUITING' },
    { name: 'Active, Not Recruiting', value: 21968, statusKey: 'ACTIVE_NOT_RECRUITING' },
    { name: 'Completed', value: 325239, statusKey: 'COMPLETED' },
    { name: 'Terminated / Withdrawn', value: 52347, statusKey: 'TERMINATED' }
  ]
};

const Dashboard = () => {
  const [recentTrials, setRecentTrials] = useState([]);
  const [globalStats, setGlobalStats] = useState(INITIAL_STATS);
  const [completedTrialsCount, setCompletedTrialsCount] = useState(INITIAL_STATS.completedThisYear);
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [selectedTrial, setSelectedTrial] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState(null);

  const tableRef = useRef(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        // Fetch actual live statistics from ClinicalTrials.gov V2
        const liveStats = await fetchGlobalStats();
        setGlobalStats(liveStats);
        setCompletedTrialsCount(liveStats.completedThisYear);

        // Fetch recent trials (sorted by StudyFirstPostDate:desc)
        const trials = await fetchClinicalTrials({ sort: 'StudyFirstPostDate:desc' });
        setRecentTrials(trials.slice(0, 8));
      } catch (error) {
        console.error("Error loading dashboard metrics:", error);
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, []);

  const handleChartClick = async (type, name, filterQuery) => {
    setActiveFilter({ type, name, query: filterQuery });
    setTableLoading(true);
    try {
      const filtered = await fetchClinicalTrials({
        ...filterQuery,
        sort: 'StudyFirstPostDate:desc'
      });
      setRecentTrials(filtered.slice(0, 10));
      
      if (tableRef.current) {
        tableRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } catch (err) {
      console.error('Error fetching filtered chart studies:', err);
    } finally {
      setTableLoading(false);
    }
  };

  const handleClearFilter = async () => {
    setActiveFilter(null);
    setTableLoading(true);
    try {
      const trials = await fetchClinicalTrials({ sort: 'StudyFirstPostDate:desc' });
      setRecentTrials(trials.slice(0, 8));
    } catch (err) {
      console.error(err);
    } finally {
      setTableLoading(false);
    }
  };

  const openTrialDetails = (trial) => {
    setSelectedTrial(trial);
    setIsModalOpen(true);
  };

  // Recharts colors
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
            {globalStats.totalTrials.toLocaleString()} Clinical Studies Worldwide
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', fontWeight: '400' }}>
            Live data from ClinicalTrials.gov V2 · {globalStats.recruitingTrials.toLocaleString()} actively enrolling patients right now
          </p>
        </div>
        <div className="hero-stats" style={{ position: 'relative', zIndex: 1 }}>
          <div className="hero-stat">
            <div className="hero-stat-value">{globalStats.activeTrials.toLocaleString()}</div>
            <div className="hero-stat-label">Active</div>
          </div>
          <div className="hero-divider" />
          <div className="hero-stat">
            <div className="hero-stat-value" style={{ color: '#6ee7b7' }}>{globalStats.recruitingTrials.toLocaleString()}</div>
            <div className="hero-stat-label">Recruiting</div>
          </div>
          <div className="hero-divider" />
          <div className="hero-stat">
            <div className="hero-stat-value" style={{ color: '#fbbf24' }}>{globalStats.completedThisYear.toLocaleString()}</div>
            <div className="hero-stat-label">Completed '26</div>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid-cols-4">

        <div className="card stat-card">
          <div className="stat-icon primary">
            <FileSpreadsheet size={28} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{globalStats.totalTrials.toLocaleString()}</span>
            <span className="stat-label">Total Studies</span>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon success">
            <Activity size={28} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{globalStats.activeTrials.toLocaleString()}</span>
            <span className="stat-label">Active Trials</span>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon accent">
            <Award size={28} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{globalStats.completedThisYear.toLocaleString()}</span>
            <span className="stat-label">Completed in 2026</span>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon warning">
            <ShieldAlert size={28} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{globalStats.recruitingTrials.toLocaleString()}</span>
            <span className="stat-label">Recruiting Now</span>
          </div>
        </div>
      </div>

      {/* Interactive Charts Section */}
      <div className="grid-cols-2">
        {/* Chart 1: Status Distribution */}
        <div className="card" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
          <div className="section-header">
            <div>
              <div className="section-title">Global Trial Status Distribution</div>
              <div className="section-subtitle" style={{ fontSize: '11px', marginTop: '2px', color: 'var(--primary)' }}>
                💡 Click any slice to filter live studies feed below
              </div>
            </div>
          </div>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={globalStats.statusDistribution}
                  cx="50%"
                  cy="42%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ percent }) => (percent > 0.04 ? `${(percent * 100).toFixed(0)}%` : '')}
                  labelLine={false}
                  onClick={(entry) => {
                    const statusMap = {
                      'Recruiting': 'RECRUITING',
                      'Active, Not Recruiting': 'ACTIVE_NOT_RECRUITING',
                      'Completed': 'COMPLETED',
                      'Terminated / Withdrawn': 'TERMINATED'
                    };
                    const sKey = entry.statusKey || statusMap[entry.name] || 'RECRUITING';
                    handleChartClick('Status', entry.name, { status: sKey });
                  }}
                >
                  {globalStats.statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} cursor="pointer" />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [`${value.toLocaleString()} Trials (Click to Filter)`, name]} />
                <Legend verticalAlign="bottom" height={40} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Therapeutic Areas */}
        <div className="card" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
          <div className="section-header">
            <div>
              <div className="section-title">Trials by Therapeutic Area</div>
              <div className="section-subtitle" style={{ fontSize: '11px', marginTop: '2px', color: 'var(--primary)' }}>
                💡 Click any bar to filter live studies feed by area
              </div>
            </div>
          </div>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={globalStats.therapeuticAreas}
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
                <Tooltip formatter={(value) => [`${value} Trials (Click to Filter)`, 'Count']} />
                <Bar 
                  dataKey="count" 
                  radius={[0, 4, 4, 0]}
                  onClick={(entry) => entry && handleChartClick('Therapeutic Area', entry.name, { keyword: entry.name })}
                >
                  {globalStats.therapeuticAreas.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} cursor="pointer" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* World Map of Active Trial Sites */}
      <WorldMapCard 
        sites={globalStats.activeSites} 
        totalActiveTrials={globalStats.activeTrials}
        onSiteClick={(site) => handleChartClick('Country', site.country, { keyword: site.country })} 
      />

      {/* Chart 3: Company Trial Portfolio: Active Trials vs Completed in 2026 */}
      <div className="card" style={{ height: '480px', marginTop: '24px', marginBottom: '24px', display: 'flex', flexDirection: 'column' }}>
        <div className="section-header">
          <div>
            <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Award size={20} color="var(--primary)" />
              <span>Company Trial Portfolio: Active Trials vs Completed in 2026</span>
            </div>
            <div className="section-subtitle">
              Comparison of active clinical trials and studies completed in 2026 across leading pharmaceutical sponsors (Click any company bar to filter feed)
            </div>
          </div>
        </div>
        <div style={{ flex: 1, minHeight: 0, marginTop: '10px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={globalStats.completedByCompany || []}
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
              <Tooltip formatter={(value, name) => [`${value.toLocaleString()} Studies (Click to Filter)`, name]} />
              <Legend verticalAlign="top" height={36} iconType="circle" />
              <Bar 
                dataKey="active" 
                name="Active Trials" 
                fill="#0071bc" 
                radius={[0, 4, 4, 0]} 
                cursor="pointer"
                onClick={(entry) => entry && handleChartClick('Sponsor', entry.name, { sponsor: entry.name, status: 'RECRUITING' })}
              />
              <Bar 
                dataKey="completed2026" 
                name="Completed in 2026" 
                fill="#10b981" 
                radius={[0, 4, 4, 0]} 
                cursor="pointer"
                onClick={(entry) => entry && handleChartClick('Sponsor', entry.name, { sponsor: entry.name, status: 'COMPLETED' })}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity / Studies Feed */}
      <div className="card" ref={tableRef}>
        <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={20} color="var(--primary)" />
              <span>{activeFilter ? `Filtered Studies Feed: ${activeFilter.type} "${activeFilter.name}"` : 'Recent Trial Additions (ClinicalTrials.gov V2)'}</span>
            </div>
            <div className="section-subtitle" style={{ fontSize: '12px', marginTop: '2px' }}>
              {activeFilter ? `Showing live clinical studies filtered by ${activeFilter.type.toLowerCase()} "${activeFilter.name}"` : 'Live synchronized clinical trial registry feed'}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {activeFilter && (
              <button 
                onClick={handleClearFilter}
                className="btn btn-secondary"
                style={{ fontSize: '12px', padding: '6px 12px', gap: '6px', backgroundColor: '#fee2e2', color: '#dc2626', borderColor: '#fca5a5' }}
              >
                <X size={14} /> Clear Filter ({activeFilter.name})
              </button>
            )}
            {(loading || tableLoading) && <RefreshCw className="animate-spin" size={18} style={{ animation: 'spin 1s linear infinite' }} />}
          </div>
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
                {recentTrials.map((trial) => (
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
                ))}
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
