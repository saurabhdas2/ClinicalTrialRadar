import React, { useState, useEffect, useRef } from 'react';
import { fetchCompanyMetrics } from '../services/apiService';
import { MOCK_COMPANY_METRICS } from '../services/mockData';
import { Search, Building, Award, ShieldAlert, BarChart3, ChevronDown, Check } from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, Legend
} from 'recharts';

const CompanyInsights = () => {
  const [searchTerm, setSearchTerm] = useState('Pfizer');
  const [showDropdown, setShowDropdown] = useState(false);
  const [companyData, setCompanyData] = useState(null);
  const dropdownRef = useRef(null);

  // List of popular companies for type-ahead suggestions
  const COMPANIES = Object.keys(MOCK_COMPANY_METRICS);

  useEffect(() => {
    // Load default company Pfizer
    loadCompanyData('Pfizer');
  }, []);

  // Handle clicking outside the dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadCompanyData = (name) => {
    const metrics = fetchCompanyMetrics(name);
    setCompanyData(metrics);
    setSearchTerm(metrics.name);
    setShowDropdown(false);
  };

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
    setShowDropdown(true);
  };

  const handleSelectSuggestion = (name) => {
    loadCompanyData(name);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      loadCompanyData(searchTerm.trim());
    }
  };

  const COLORS = ['#0071bc', '#0ea5e9', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6'];

  // Filter suggestions
  const filteredSuggestions = COMPANIES.filter(c => 
    c.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      {/* Search Bar / Suggestion dropdown */}
      <div className="card" style={{ marginBottom: '24px', zIndex: 30 }} ref={dropdownRef}>
        <form onSubmit={handleFormSubmit} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', position: 'relative' }}>
          <div className="form-group" style={{ flex: 1, marginBottom: 0, position: 'relative' }}>
            <label className="form-label" htmlFor="companySearch">Search Sponsor / Pharmaceutical Company Portfolio</label>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <input
                type="text"
                id="companySearch"
                className="form-input"
                style={{ width: '100%', paddingRight: '36px' }}
                placeholder="Type company name (e.g. Pfizer, Roche, Novartis...)"
                value={searchTerm}
                onChange={handleInputChange}
                onFocus={() => setShowDropdown(true)}
                autoComplete="off"
              />
              <ChevronDown 
                size={18} 
                style={{ position: 'absolute', right: '12px', color: 'var(--text-secondary)', cursor: 'pointer' }} 
                onClick={() => setShowDropdown(!showDropdown)}
              />
            </div>

            {/* Type-ahead Dropdown List */}
            {showDropdown && (
              <ul className="typeahead-dropdown">
                {filteredSuggestions.length > 0 ? (
                  filteredSuggestions.map((name) => (
                    <li 
                      key={name} 
                      className="typeahead-item" 
                      onClick={() => handleSelectSuggestion(name)}
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    >
                      <span>{name}</span>
                      {searchTerm.toLowerCase() === name.toLowerCase() && <Check size={14} color="var(--primary)" />}
                    </li>
                  ))
                ) : (
                  <li 
                    className="typeahead-item" 
                    onClick={() => handleSelectSuggestion(searchTerm)}
                    style={{ fontStyle: 'italic', color: 'var(--text-secondary)' }}
                  >
                    Generate insights for "{searchTerm}"
                  </li>
                )}
              </ul>
            )}
          </div>
          <button type="submit" className="btn btn-primary" style={{ height: '42px', padding: '0 24px' }}>
            <Search size={18} /> Load Insights
          </button>
        </form>
      </div>

      {companyData ? (
        /* Company Dashboard Grid */
        <div>
          {/* Header Row */}
          <div className="card" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(to right, #002b49, #005087)', color: 'white', border: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '12px', borderRadius: '8px' }}>
                <Building size={32} color="#0ea5e9" />
              </div>
              <div>
                <h2 style={{ color: 'white', fontSize: '26px' }}>{companyData.name} Intelligence</h2>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>Comprehensive clinical trial pipelines & approved product registry</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', fontWeight: 'bold' }}>Active Trials</span>
                <div style={{ fontSize: '20px', fontWeight: '800' }}>
                  {companyData.years[companyData.years.length - 1]?.active || 12}
                </div>
              </div>
              <div style={{ height: '30px', width: '1px', backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'center' }} />
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', fontWeight: 'bold' }}>FDA Approved Drugs</span>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#0ea5e9' }}>
                  {companyData.approvedDrugs.length}
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Row 1: Trial Pipeline timeline (Line/Area Chart) */}
          <div className="card" style={{ height: '380px', marginBottom: '24px', display: 'flex', flexDirection: 'column' }}>
            <div className="section-header">
              <div className="section-title">Clinical Trials Timeline (2018 - 2026)</div>
              <div className="section-subtitle">Active vs Completed Studies over the years</div>
            </div>
            
            <div style={{ flex: 1, minHeight: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={companyData.years}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0071bc" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#0071bc" stopOpacity={0.05}/>
                    </linearGradient>
                    <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.05}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="year" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Legend verticalAlign="top" height={36} />
                  <Area type="monotone" name="Active Portfolio" dataKey="active" stroke="#0071bc" fillOpacity={1} fill="url(#colorActive)" />
                  <Area type="monotone" name="Completed Portfolio" dataKey="completed" stroke="#10b981" fillOpacity={1} fill="url(#colorCompleted)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Row 2: Status Breakdown and Phase Breakdown */}
          <div className="grid-cols-2" style={{ marginBottom: '24px' }}>
            
            {/* Status Pie Chart */}
            <div className="card" style={{ height: '350px', display: 'flex', flexDirection: 'column' }}>
              <div className="section-header">
                <div className="section-title">Portfolio Status Distribution</div>
              </div>
              <div style={{ flex: 1, minHeight: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={companyData.status}
                      cx="50%"
                      cy="45%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {companyData.status.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} Trials`, 'Count']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Phases Bar Chart */}
            <div className="card" style={{ height: '350px', display: 'flex', flexDirection: 'column' }}>
              <div className="section-header">
                <div className="section-title">Study Phase Distribution</div>
              </div>
              
              <div style={{ flex: 1, minHeight: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={companyData.phases}
                    margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="phase" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip formatter={(value) => [`${value} Trials`, 'Count']} />
                    <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]}>
                      {companyData.phases.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[(index + 1) % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* Row 3: Therapeutic Focus & FDA Drug Approvals */}
          <div className="grid-cols-2">
            {/* Therapeutic Focus areas */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="section-header">
                <div className="section-title">
                  <BarChart3 size={18} color="var(--primary)" />
                  <span>Therapeutic Focus Concentrations</span>
                </div>
              </div>

              <div className="table-container" style={{ border: 'none' }}>
                <table className="custom-table" style={{ fontSize: '13px' }}>
                  <thead>
                    <tr>
                      <th>Therapeutic Area</th>
                      <th style={{ textAlign: 'right' }}>Trial Count</th>
                      <th style={{ width: '120px' }}>Concentration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {companyData.therapeuticAreas.map((area, idx) => {
                      const total = companyData.therapeuticAreas.reduce((acc, curr) => acc + curr.count, 0);
                      const pct = ((area.count / total) * 100).toFixed(0);
                      
                      return (
                        <tr key={idx}>
                          <td style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{area.name}</td>
                          <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{area.count}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ height: '8px', flex: 1, backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${pct}%`, backgroundColor: COLORS[idx % COLORS.length] }} />
                              </div>
                              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 'bold', width: '30px' }}>{pct}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Approved Drugs */}
            <div className="card">
              <div className="section-header">
                <div className="section-title">
                  <Award size={18} color="var(--accent)" />
                  <span>OpenFDA Documented Approvals</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px' }}>
                {companyData.approvedDrugs.map((drug, idx) => (
                  <div 
                    key={idx} 
                    style={{ 
                      padding: '12px 18px', 
                      backgroundColor: 'var(--accent-light)', 
                      border: '1px solid var(--border)', 
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                  >
                    <span style={{ height: '8px', width: '8px', backgroundColor: 'var(--accent)', borderRadius: '50%' }} />
                    {drug}
                  </div>
                ))}
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-light)', marginTop: '20px', lineHeight: '1.4' }}>
                *Approval lists are aggregated from OpenFDA drug label registry entries associated with matching manufacturer attributes.
              </p>
            </div>
          </div>

        </div>
      ) : (
        <div className="card" style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Select or search for a pharmaceutical company above to load pipeline statistics.
        </div>
      )}
    </div>
  );
};

export default CompanyInsights;
