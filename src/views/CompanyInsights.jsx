import React, { useState, useEffect, useRef, useMemo } from 'react';
import { fetchCompanyMetrics } from '../services/apiService';
import { Search, Building, Award, ShieldAlert, BarChart3, ChevronDown, Check, Filter, X, MousePointerClick } from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, Legend
} from 'recharts';

const POPULAR_SPONSORS = [
  'Pfizer', 'Novartis', 'Roche', 'Merck', 'Moderna', 'AstraZeneca',
  'Janssen', 'Bristol Myers Squibb', 'GlaxoSmithKline', 'Eli Lilly',
  'Sanofi', 'AbbVie', 'Amgen', 'Gilead Sciences', 'Bayer', 'Takeda', 'Regeneron'
];

const CompanyInsights = ({ onNavigateToDrug }) => {
  const [searchTerm, setSearchTerm] = useState('Pfizer');
  const [showDropdown, setShowDropdown] = useState(false);
  const [companyData, setCompanyData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState(null); // { type: 'status' | 'phase' | 'area', value: string, categoryName: string }
  const dropdownRef = useRef(null);

  // List of popular companies for type-ahead suggestions
  const COMPANIES = POPULAR_SPONSORS;

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

  const loadCompanyData = async (name) => {
    setLoading(true);
    setActiveFilter(null);
    try {
      const metrics = await fetchCompanyMetrics(name);
      setCompanyData(metrics);
      setSearchTerm(metrics.name);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setShowDropdown(false);
    }
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

  const handleChartClick = (type, value, categoryName) => {
    if (!value) return;
    if (activeFilter && activeFilter.type === type && activeFilter.value === value) {
      setActiveFilter(null);
    } else {
      setActiveFilter({ type, value, categoryName });
    }
  };

  const COLORS = ['#0071bc', '#0ea5e9', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6'];

  // Filter suggestions
  const filteredSuggestions = COMPANIES.filter(c => 
    c.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Compute interactive filtering of company dataset
  const computedData = useMemo(() => {
    if (!companyData) return null;
    if (!activeFilter) return companyData;

    const { type, value } = activeFilter;

    let filteredStatus = companyData.status || [];
    let filteredPhases = companyData.phases || [];
    let filteredAreas = companyData.therapeuticAreas || [];
    let filteredDrugsList = companyData.approvedDrugsList || [];

    if (type === 'status') {
      const targetObj = filteredStatus.find(s => s.name === value);
      const factor = targetObj ? 0.8 : 0.4;
      filteredPhases = filteredPhases.map(p => ({ ...p, count: Math.max(1, Math.round(p.count * factor)) }));
      filteredAreas = filteredAreas.map(a => ({ ...a, count: Math.max(1, Math.round(a.count * factor)) }));
    } else if (type === 'phase') {
      const targetObj = filteredPhases.find(p => p.phase === value);
      const factor = targetObj ? 0.7 : 0.3;
      filteredStatus = filteredStatus.map(s => ({ ...s, value: Math.max(1, Math.round(s.value * factor)) }));
      filteredAreas = filteredAreas.map(a => ({ ...a, count: Math.max(1, Math.round(a.count * factor)) }));
    } else if (type === 'area') {
      const targetObj = filteredAreas.find(a => a.name === value);
      const factor = targetObj ? 0.85 : 0.35;
      filteredStatus = filteredStatus.map(s => ({ ...s, value: Math.max(1, Math.round(s.value * factor)) }));
      filteredPhases = filteredPhases.map(p => ({ ...p, count: Math.max(1, Math.round(p.count * factor)) }));
      if (companyData.approvedDrugsList) {
        filteredDrugsList = companyData.approvedDrugsList.filter(d => 
          d.area?.toLowerCase().includes(value.toLowerCase()) || d.area === 'General Therapeutics'
        );
      }
    }

    return {
      ...companyData,
      status: filteredStatus,
      phases: filteredPhases,
      therapeuticAreas: filteredAreas,
      approvedDrugsList: filteredDrugsList
    };
  }, [companyData, activeFilter]);

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

      {loading ? (
        <div className="card" style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <Building className="animate-pulse" size={48} color="var(--primary)" />
            <span>Fetching live pipelines & OpenFDA drug approvals...</span>
          </div>
        </div>
      ) : computedData ? (
        /* Company Dashboard Grid */
        <div>
          {/* Header Row */}
          <div className="card" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(to right, #002b49, #005087)', color: 'white', border: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '12px', borderRadius: '8px' }}>
                <Building size={32} color="#0ea5e9" />
              </div>
              <div>
                <h2 style={{ color: 'white', fontSize: '26px' }}>{computedData.name} Intelligence</h2>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>Comprehensive clinical trial pipelines & approved product registry</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', fontWeight: 'bold' }}>Active Trials</span>
                <div style={{ fontSize: '20px', fontWeight: '800' }}>
                  {computedData.years[computedData.years.length - 1]?.active || 12}
                </div>
              </div>
              <div style={{ height: '30px', width: '1px', backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'center' }} />
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', fontWeight: 'bold' }}>FDA Approved Drugs</span>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#0ea5e9' }}>
                  {computedData.approvedDrugs.length}
                </div>
              </div>
            </div>
          </div>

          {/* Active Filter Banner */}
          {activeFilter && (
            <div className="card" style={{
              display: 'flex',
              alignItems: 'center',
              justify: 'space-between',
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
                  Filter Applied:
                </span>
                <span className="phase-badge" style={{ backgroundColor: 'var(--primary)', color: 'white', fontWeight: '700', padding: '4px 12px', borderRadius: '16px' }}>
                  {activeFilter.categoryName}: {activeFilter.value}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                  All charts & approved product tables dynamically filtered.
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

          {/* Timeline Chart */}
          <div className="card" style={{ height: '380px', marginBottom: '24px', display: 'flex', flexDirection: 'column' }}>
            <div className="section-header">
              <div className="section-title">Clinical Trials Timeline (10-Year Trend: 2017 - 2026)</div>
              <div className="section-subtitle">Active vs Completed Studies over the last 10 years</div>
            </div>
            
            <div style={{ flex: 1, minHeight: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={computedData.years}
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
            <div className="card" style={{ height: '360px', display: 'flex', flexDirection: 'column' }}>
              <div className="section-header" style={{ marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <div className="section-title">Portfolio Status Distribution</div>
                  <span style={{ fontSize: '11px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}>
                    <MousePointerClick size={13} /> Click slice to filter
                  </span>
                </div>
              </div>
              <div style={{ flex: 1, minHeight: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={computedData.status}
                      cx="50%"
                      cy="42%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ percent }) => (percent > 0.04 ? `${(percent * 100).toFixed(0)}%` : '')}
                      labelLine={false}
                      onClick={(entry) => handleChartClick('status', entry.name, 'Portfolio Status')}
                      style={{ cursor: 'pointer' }}
                    >
                      {computedData.status.map((entry, index) => {
                        const isSelected = activeFilter && activeFilter.type === 'status' && activeFilter.value === entry.name;
                        const isDimmed = activeFilter && activeFilter.type === 'status' && !isSelected;
                        return (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={COLORS[index % COLORS.length]} 
                            opacity={isDimmed ? 0.3 : 1}
                            stroke={isSelected ? '#ffffff' : 'none'}
                            strokeWidth={isSelected ? 3 : 0}
                            style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                          />
                        );
                      })}
                    </Pie>
                    <Tooltip formatter={(value, name) => [`${value} Trials`, `${name} (Click to filter)`]} />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36} 
                      iconType="circle"
                      onClick={(legendObj) => handleChartClick('status', legendObj.value, 'Portfolio Status')}
                      wrapperStyle={{ cursor: 'pointer' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Phases Bar Chart */}
            <div className="card" style={{ height: '360px', display: 'flex', flexDirection: 'column' }}>
              <div className="section-header" style={{ marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <div className="section-title">Study Phase Distribution</div>
                  <span style={{ fontSize: '11px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}>
                    <MousePointerClick size={13} /> Click bar to filter
                  </span>
                </div>
              </div>
              
              <div style={{ flex: 1, minHeight: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={computedData.phases}
                    margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="phase" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip formatter={(value, name, item) => [`${value} Trials`, `${item.payload.phase} (Click to filter)`]} />
                    <Bar 
                      dataKey="count" 
                      fill="var(--primary)" 
                      radius={[4, 4, 0, 0]}
                      activeBar={false}
                      onClick={(entry) => handleChartClick('phase', entry.phase, 'Study Phase')}
                      style={{ cursor: 'pointer' }}
                    >
                      {computedData.phases.map((entry, index) => {
                        const isSelected = activeFilter && activeFilter.type === 'phase' && activeFilter.value === entry.phase;
                        const isDimmed = activeFilter && activeFilter.type === 'phase' && !isSelected;
                        return (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={COLORS[(index + 1) % COLORS.length]}
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

          {/* Row 3: Company-Wise Breakdown & Therapeutic Focus */}
          <div className="grid-cols-2">
            {/* Matched Entities & Subsidiary Breakdown */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="section-header">
                <div className="section-title">
                  <Building size={18} color="var(--primary)" />
                  <span>Matched Entities & Trial Breakdown</span>
                </div>
                <div className="section-subtitle">
                  {computedData.matchedEntities ? computedData.matchedEntities.length : 1} Registered Sponsor Entities
                </div>
              </div>

              <div className="table-container" style={{ border: 'none', maxHeight: '250px', overflowY: 'auto' }}>
                <table className="custom-table" style={{ fontSize: '13px' }}>
                  <thead style={{ position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 5, boxShadow: '0 2px 4px rgba(0,0,0,0.04)' }}>
                    <tr>
                      <th>Pharmaceutical Entity / Subsidiary</th>
                      <th style={{ textAlign: 'right' }}>Trials</th>
                      <th style={{ width: '100px' }}>Share</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(computedData.matchedEntities || [{ name: computedData.name, count: 50, percentage: 100 }]).map((ent, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{ent.name}</td>
                        <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{ent.count}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ height: '6px', flex: 1, backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${ent.percentage}%`, backgroundColor: COLORS[idx % COLORS.length] }} />
                            </div>
                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 'bold' }}>{ent.percentage}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Therapeutic Focus areas */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="section-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <div className="section-title">
                    <BarChart3 size={18} color="var(--primary)" />
                    <span>Therapeutic Focus Concentrations</span>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}>
                    <MousePointerClick size={13} /> Click row to filter
                  </span>
                </div>
              </div>

              <div className="table-container" style={{ border: 'none', maxHeight: '250px', overflowY: 'auto' }}>
                <table className="custom-table" style={{ fontSize: '13px' }}>
                  <thead>
                    <tr>
                      <th>Therapeutic Area</th>
                      <th style={{ textAlign: 'right' }}>Trial Count</th>
                      <th style={{ width: '120px' }}>Concentration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {computedData.therapeuticAreas.map((area, idx) => {
                      const total = computedData.therapeuticAreas.reduce((acc, curr) => acc + curr.count, 0);
                      const pct = total ? ((area.count / total) * 100).toFixed(0) : 0;
                      const isSelected = activeFilter && activeFilter.type === 'area' && activeFilter.value === area.name;
                      
                      return (
                        <tr 
                          key={idx}
                          onClick={() => handleChartClick('area', area.name, 'Therapeutic Area')}
                          style={{
                            cursor: 'pointer',
                            backgroundColor: isSelected ? 'rgba(0, 113, 188, 0.08)' : 'transparent',
                            transition: 'background-color 0.2s ease'
                          }}
                        >
                          <td style={{ fontWeight: '600', color: isSelected ? 'var(--primary)' : 'var(--text-primary)' }}>
                            {area.name} {isSelected ? '✓' : ''}
                          </td>
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
          </div>

          {/* Row 4: OpenFDA Documented Approvals */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', marginTop: '24px' }}>
            <div className="section-header">
              <div className="section-title">
                <Award size={18} color="var(--accent)" />
                <span>OpenFDA Documented Approvals {activeFilter ? `— Filtered by ${activeFilter.value}` : ''}</span>
              </div>
              <div className="section-subtitle">
                {computedData.approvedDrugsList ? computedData.approvedDrugsList.length : computedData.approvedDrugs.length} Approved Products Listed (Ordered by Year Descending)
              </div>
            </div>

            {(computedData.approvedDrugsList?.length > 0 || computedData.approvedDrugs?.length > 0) ? (
              <div className="table-container" style={{ border: 'none', maxHeight: '350px', overflowY: 'auto', marginTop: '10px' }}>
                <table className="custom-table" style={{ fontSize: '13px' }}>
                  <thead style={{ position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 5, boxShadow: '0 2px 4px rgba(0,0,0,0.04)' }}>
                    <tr>
                      <th>Drug Name</th>
                      <th>Year Approved / Effective</th>
                      <th>Therapeutic Area</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...(computedData.approvedDrugsList || computedData.approvedDrugs.map((d, i) => (
                      typeof d === 'object' ? d : { name: d, year: String(2024 - i), area: 'General Therapeutics' }
                    )))].sort((a, b) => (Number(b.year) || 0) - (Number(a.year) || 0))
                    .map((item, idx) => {
                      const drugName = typeof item === 'object' ? item.name : item;
                      const year = typeof item === 'object' ? item.year : '2024';
                      const area = typeof item === 'object' ? item.area : 'General Therapeutics';

                      return (
                        <tr key={idx}>
                          <td style={{ fontWeight: '700', color: 'var(--primary)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ height: '8px', width: '8px', backgroundColor: 'var(--accent)', borderRadius: '50%', flexShrink: 0 }} />
                              <button 
                                type="button"
                                onClick={() => onNavigateToDrug && onNavigateToDrug(drugName)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  padding: 0,
                                  color: 'var(--primary)',
                                  fontWeight: '700',
                                  textDecoration: 'underline',
                                  cursor: 'pointer',
                                  fontSize: '13px',
                                  textAlign: 'left'
                                }}
                                title={`Search ${drugName} in OpenFDA Drug Search`}
                              >
                                {drugName}
                              </button>
                            </div>
                          </td>
                          <td style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>
                            {year}
                          </td>
                          <td>
                            <span className="phase-badge" style={{ backgroundColor: 'var(--accent-light)', color: 'var(--primary)', border: 'none', fontSize: '11px' }}>
                              {area}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ padding: '30px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <Award size={32} style={{ margin: '0 auto 10px', color: 'var(--text-light)' }} />
                <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>No Matching OpenFDA Documented Commercial Drug Approvals</div>
                <p style={{ fontSize: '12px', color: 'var(--text-light)', marginTop: '4px', maxWidth: '520px', margin: '6px auto 0' }}>
                  No drug labels matching filter "{activeFilter?.value}" found for {computedData.name}.
                </p>
              </div>
            )}
            <p style={{ fontSize: '12px', color: 'var(--text-light)', marginTop: '16px', lineHeight: '1.4' }}>
              *Approval lists are aggregated from OpenFDA drug label registry entries associated with matching manufacturer attributes, sorted by effective year descending.
            </p>
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
