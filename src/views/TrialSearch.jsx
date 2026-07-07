import React, { useState, useEffect } from 'react';
import { fetchClinicalTrials } from '../services/apiService';
import TrialDetailsModal from '../components/TrialDetailsModal';
import { Search, RotateCcw, Calendar, Building, Eye, HelpCircle } from 'lucide-react';

const TrialSearch = () => {
  const [filters, setFilters] = useState({
    keyword: '',
    condition: '',
    sponsor: '',
    phase: 'ALL',
    status: 'ALL',
    sort: 'StartDate:desc' // Default: Latest Start Date
  });
  const [trials, setTrials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTrial, setSelectedTrial] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Pagination states
  const [nextPageToken, setNextPageToken] = useState(null);
  const [tokenHistory, setTokenHistory] = useState([null]);
  const [pageIndex, setPageIndex] = useState(0);

  const loadTrials = async (currentFilters, targetPageIndex = 0, customTokenHistory = tokenHistory) => {
    setLoading(true);
    try {
      const activeToken = customTokenHistory[targetPageIndex] || null;
      
      const payload = await fetchClinicalTrials({
        ...currentFilters,
        pageToken: activeToken,
        includePageToken: true
      });

      setTrials(payload.studies || []);
      setNextPageToken(payload.nextPageToken || null);
      setPageIndex(targetPageIndex);

      // If we got a nextPageToken and it's not already in history for the next index, add it
      if (payload.nextPageToken && !customTokenHistory[targetPageIndex + 1]) {
        const updatedHistory = [...customTokenHistory];
        updatedHistory[targetPageIndex + 1] = payload.nextPageToken;
        setTokenHistory(updatedHistory);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Perform search on mount
  useEffect(() => {
    loadTrials(filters, 0, [null]);
  }, []);

  const handleInputChange = (nameOrEvent, val) => {
    if (nameOrEvent?.target) {
      const { name, value } = nameOrEvent.target;
      setFilters(prev => ({ ...prev, [name]: value }));
    } else {
      setFilters(prev => ({ ...prev, [nameOrEvent]: val }));
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setTokenHistory([null]);
    loadTrials(filters, 0, [null]);
  };

  const handleReset = () => {
    const resetFilters = {
      keyword: '',
      condition: '',
      sponsor: '',
      phase: 'ALL',
      status: 'ALL',
      sort: 'StartDate:desc'
    };
    setFilters(resetFilters);
    setTokenHistory([null]);
    loadTrials(resetFilters, 0, [null]);
  };

  const handleNextPage = () => {
    if (nextPageToken) {
      loadTrials(filters, pageIndex + 1);
    }
  };

  const handlePrevPage = () => {
    if (pageIndex > 0) {
      loadTrials(filters, pageIndex - 1);
    }
  };

  const openTrialDetails = (trial) => {
    setSelectedTrial(trial);
    setIsModalOpen(true);
  };

  const formatPhase = (phases) => {
    if (!phases || phases.length === 0) return 'N/A';
    return phases.map(p => p.replace('PHASE', 'P')).join(', ');
  };

  return (
    <div>
      {/* Search Filters Card */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <form onSubmit={handleSearchSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="keyword">Keyword Search</label>
              <input
                type="text"
                id="keyword"
                name="keyword"
                className="form-input"
                placeholder="e.g. lung, diabetes, immunotherapy"
                value={filters.keyword}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="condition">Specific Condition</label>
              <input
                type="text"
                id="condition"
                name="condition"
                className="form-input"
                placeholder="e.g. Breast Cancer, Heart Failure"
                value={filters.condition}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="sponsor">Sponsor / Pharmaceutical Company</label>
              <input
                type="text"
                id="sponsor"
                name="sponsor"
                className="form-input"
                placeholder="e.g. Pfizer, Merck, Roche"
                value={filters.sponsor}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', alignItems: 'flex-end' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="phase">Study Phase</label>
              <select
                id="phase"
                name="phase"
                className="form-select"
                value={filters.phase}
                onChange={handleInputChange}
              >
                <option value="ALL">All Phases</option>
                <option value="PHASE1">Phase 1</option>
                <option value="PHASE2">Phase 2</option>
                <option value="PHASE3">Phase 3</option>
                <option value="PHASE4">Phase 4</option>
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label" htmlFor="status">Trial Status</label>
              <select
                id="status"
                name="status"
                className="form-select"
                value={filters.status}
                onChange={handleInputChange}
              >
                <option value="ALL">All Statuses</option>
                <option value="RECRUITING">Recruiting</option>
                <option value="ACTIVE_NOT_RECRUITING">Active, Not Recruiting</option>
                <option value="COMPLETED">Completed</option>
                <option value="TERMINATED">Terminated</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="sort">Order By</label>
              <select
                id="sort"
                name="sort"
                className="form-select"
                value={filters.sort}
                onChange={handleInputChange}
              >
                <option value="StartDate:desc">Latest Start Date</option>
                <option value="LastUpdatePostDate:desc">Recently Updated</option>
                <option value="@relevance">Search Relevance</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', height: '42px', marginBottom: '16px' }}>
              <button type="button" className="btn btn-secondary" onClick={handleReset} style={{ width: '45%' }}>
                <RotateCcw size={16} /> Reset
              </button>
              <button type="submit" className="btn btn-primary" style={{ width: '50%' }}>
                <Search size={16} /> Search
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="card" style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <div style={{ fontSize: '18px', fontWeight: '500' }}>Querying global clinical repositories...</div>
          <p style={{ fontSize: '14px', marginTop: '4px' }}>Connecting to ClinicalTrials.gov V2</p>
        </div>
      ) : trials.length === 0 ? (
        <div className="card" style={{ padding: '60px 24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <HelpCircle size={48} style={{ margin: '0 auto 16px', color: 'var(--text-light)' }} />
          <div style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)' }}>No Clinical Trials Found</div>
          <p style={{ fontSize: '14px', maxWidth: '400px', margin: '4px auto 0' }}>
            We couldn't locate studies matching these parameters. Try refining your filters or resetting the search keywords.
          </p>
        </div>
      ) : (
        /* Results Grid */
        <div>
          <div className="section-header" style={{ marginBottom: '14px' }}>
            <div className="section-subtitle">Found {trials.length} matches in global repository</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
            {trials.map((trial) => (
              <div key={trial.nctId} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '260px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--primary)' }}>{trial.nctId}</span>
                    <span className="phase-badge">Phase {formatPhase(trial.phases)}</span>
                  </div>
                  
                  <h3 style={{ fontSize: '16px', lineHeight: '1.4', marginBottom: '8px', color: 'var(--text-primary)' }}>{trial.title}</h3>
                  <div className="trial-card-desc">{trial.summary}</div>
                  
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', margin: '10px 0' }}>
                    {trial.conditions.slice(0, 3).map((cond, idx) => (
                      <span key={idx} style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#f1f5f9', color: 'var(--text-secondary)', fontWeight: '500' }}>
                        {cond}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="trial-card-meta">
                    <span className="trial-card-sponsor" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Building size={14} color="var(--text-light)" /> {trial.sponsor}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={14} color="var(--text-light)" /> {trial.completionDate || 'N/A'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px' }}>
                    <span className={`badge ${trial.status?.toLowerCase() || 'unknown'}`}>
                      {trial.status?.replace(/_/g, ' ')}
                    </span>
                    <button className="btn btn-secondary btn-icon-only" onClick={() => openTrialDetails(trial)} style={{ padding: '6px 12px', fontSize: '12px', gap: '6px' }}>
                      <Eye size={14} /> View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '32px' }}>
            <button 
              className="btn btn-secondary" 
              onClick={handlePrevPage} 
              disabled={pageIndex === 0 || loading}
              style={{ padding: '8px 16px', minWidth: '120px' }}
            >
              Previous Page
            </button>
            <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)' }}>
              Page {pageIndex + 1}
            </span>
            <button 
              className="btn btn-secondary" 
              onClick={handleNextPage} 
              disabled={!nextPageToken || loading}
              style={{ padding: '8px 16px', minWidth: '120px' }}
            >
              Next Page
            </button>
          </div>
        </div>
      )}

      {/* Detailed Modal */}
      <TrialDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        trial={selectedTrial}
      />
    </div>
  );
};

export default TrialSearch;
