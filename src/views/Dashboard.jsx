import React, { useState, useEffect } from 'react';
import { fetchClinicalTrials, fetchCompletedTrialsThisYear, fetchGlobalStats } from '../services/apiService';
import { DEFAULT_GLOBAL_STATS } from '../services/mockData';
import TrialDetailsModal from '../components/TrialDetailsModal';
import { Activity, ShieldAlert, Award, FileSpreadsheet, Eye, RefreshCw } from 'lucide-react';
import { 
	PieChart, Pie, Cell, ResponsiveContainer, 
	BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid 
} from 'recharts';

const Dashboard = () => {
  const [recentTrials, setRecentTrials] = useState([]);
  const [globalStats, setGlobalStats] = useState(DEFAULT_GLOBAL_STATS);
  const [completedTrialsCount, setCompletedTrialsCount] = useState(DEFAULT_GLOBAL_STATS.completedThisYear);
  const [loading, setLoading] = useState(true);
  const [selectedTrial, setSelectedTrial] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        // Fetch actual size-based statistics dynamically
        const liveStats = await fetchGlobalStats();
        setGlobalStats(liveStats);
        setCompletedTrialsCount(liveStats.completedThisYear);

        // Fetch recent trials (empty filters gets default/mock)
        const trials = await fetchClinicalTrials({});
        setRecentTrials(trials.slice(0, 5));
        
        // Fetch completed trials this year (2026)
        const completed = await fetchCompletedTrialsThisYear();
        if (completed && completed.length > 0) {
          // Adjust completed counts based on mock/live values
          setCompletedTrialsCount(liveStats.completedThisYear + completed.length);
        }
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

  // Recharts colors
  const COLORS = ['#0071bc', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div>
      {/* Hero Banner */}
      <div className="dashboard-hero">
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
            🌍 Global Clinical Research Intelligence · Updated {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
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
            <span className="stat-value">{completedTrialsCount.toLocaleString()}</span>
            <span className="stat-label">Completed 2026</span>
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
            <div className="section-title">Global Trial Status Distribution</div>
          </div>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={globalStats.statusDistribution}
                  cx="50%"
                  cy="45%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={false}
                >
                  {globalStats.statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} Trials`, 'Count']} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Therapeutic Areas */}
        <div className="card" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
          <div className="section-header">
            <div className="section-title">Trials by Therapeutic Area</div>
          </div>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={globalStats.therapeuticAreas}
                layout="vertical"
                margin={{ top: 10, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} />
                <Tooltip formatter={(value) => [`${value} Trials`, 'Count']} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {globalStats.therapeuticAreas.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity / Studies Feed */}
      <div className="card">
        <div className="section-header">
          <div className="section-title">
            <Activity size={20} color="var(--primary)" />
            <span>Recent Trial Additions (ClinicalTrials.gov V2)</span>
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
