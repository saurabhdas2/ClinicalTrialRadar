import React, { useState } from 'react';
import { fetchClinicalTrials } from '../services/apiService';
import { evaluateEligibility } from '../services/agentEngine';
import TrialDetailsModal from '../components/TrialDetailsModal';
import { UserCheck, AlertTriangle, AlertCircle, HelpCircle, CheckCircle2, XCircle, ChevronDown, ChevronUp, Eye } from 'lucide-react';

const EligibilityMatcher = () => {
  const [profile, setProfile] = useState({
    age: '',
    gender: 'ALL',
    condition: '',
    symptoms: ''
  });
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState(null);
  const [expandedMatch, setExpandedMatch] = useState(null);
  const [selectedTrial, setSelectedTrial] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleMatch = async (e) => {
    e.preventDefault();
    if (!profile.age || !profile.condition) return;
    
    setLoading(true);
    setMatches(null);
    setExpandedMatch(null);
    
    try {
      // 1. Fetch trials related to the primary condition
      const trials = await fetchClinicalTrials({ keyword: profile.condition });
      
      // 2. Perform eligibility evaluations
      const patientProfile = {
        age: parseInt(profile.age),
        gender: profile.gender,
        conditions: [profile.condition],
        symptoms: profile.symptoms
      };

      const evaluations = trials.map(trial => evaluateEligibility(trial, patientProfile));
      
      // Sort evaluations: ELIGIBLE first, then PARTIAL, then INELIGIBLE
      const sorted = evaluations.sort((a, b) => {
        const order = { ELIGIBLE: 1, PARTIAL: 2, INELIGIBLE: 3 };
        return order[a.status] - order[b.status];
      });

      setMatches(sorted);
    } catch (error) {
      console.error("Matching error:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (nctId) => {
    setExpandedMatch(prev => (prev === nctId ? null : nctId));
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ELIGIBLE':
        return <CheckCircle2 size={24} color="var(--success)" />;
      case 'PARTIAL':
        return <AlertTriangle size={24} color="var(--warning)" />;
      case 'INELIGIBLE':
        return <XCircle size={24} color="var(--danger)" />;
      default:
        return <HelpCircle size={24} color="var(--text-light)" />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ELIGIBLE':
        return <span className="badge recruiting" style={{ fontSize: '11px' }}>Highly Eligible</span>;
      case 'PARTIAL':
        return <span className="badge active_not_recruiting" style={{ fontSize: '11px' }}>Partial Match</span>;
      case 'INELIGIBLE':
        return <span className="badge terminated" style={{ fontSize: '11px' }}>Ineligible</span>;
      default:
        return null;
    }
  };

  const openTrialDetails = (trial) => {
    setSelectedTrial(trial);
    setIsModalOpen(true);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px', height: '100%' }}>
      {/* Patient Profile Form (Left Column) */}
      <div>
        <div className="card" style={{ height: 'fit-content' }}>
          <div className="section-header" style={{ marginBottom: '16px' }}>
            <div className="section-title">
              <UserCheck size={20} color="var(--primary)" />
              <span>Enrollment Matcher</span>
            </div>
          </div>
          
          <form onSubmit={handleMatch}>
            <div className="form-group">
              <label className="form-label" htmlFor="age">Patient Age (Years)</label>
              <input
                type="number"
                id="age"
                name="age"
                className="form-input"
                required
                min="0"
                max="120"
                placeholder="e.g. 45"
                value={profile.age}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="gender">Patient Gender</label>
              <select
                id="gender"
                name="gender"
                className="form-select"
                value={profile.gender}
                onChange={handleInputChange}
              >
                <option value="ALL">All Genders</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="condition">Condition Target</label>
              <input
                type="text"
                id="condition"
                name="condition"
                className="form-input"
                required
                placeholder="e.g. Lung Cancer, Heart Failure"
                value={profile.condition}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="symptoms">Symptoms / Comorbidities</label>
              <textarea
                id="symptoms"
                name="symptoms"
                className="form-textarea"
                rows="4"
                placeholder="Enter symptoms or drugs to match exclusions (comma separated) e.g., asthma, chemotherapy, brain metastases"
                value={profile.symptoms}
                onChange={handleInputChange}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '12px' }}>
              Run Eligibility Matcher
            </button>
          </form>
        </div>
      </div>

      {/* Matching Results (Right Column) */}
      <div style={{ height: 'calc(100vh - 140px)', overflowY: 'auto', paddingRight: '8px' }}>
        {loading ? (
          <div className="card" style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: '18px', fontWeight: '500' }}>Evaluating Clinical Criteria...</div>
            <p style={{ fontSize: '14px', marginTop: '4px' }}>Parsing trial eligibility descriptions & comparing parameters...</p>
          </div>
        ) : matches === null ? (
          <div className="card" style={{ padding: '80px 24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <UserCheck size={64} style={{ margin: '0 auto 16px', color: 'var(--text-light)' }} />
            <h2 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>Patient Intake Complete</h2>
            <p style={{ fontSize: '14px', maxWidth: '460px', margin: '0 auto' }}>
              Fill in the patient clinical profile questionnaire on the left, then click <strong>Run Eligibility Matcher</strong>. We will extract active clinical trials and score eligibility criteria.
            </p>
          </div>
        ) : matches.length === 0 ? (
          <div className="card" style={{ padding: '60px 24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <AlertCircle size={48} style={{ margin: '0 auto 16px', color: 'var(--danger)' }} />
            <div style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)' }}>No Candidate Trials Located</div>
            <p style={{ fontSize: '14px', maxWidth: '400px', margin: '4px auto 0' }}>
              We could not find active trials for "{profile.condition}" in the repositories to evaluate. Try searching for a broader condition.
            </p>
          </div>
        ) : (
          <div>
            <div className="section-header" style={{ marginBottom: '16px' }}>
              <div className="section-subtitle">Analyzed {matches.length} candidate studies for Patient Profile</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {matches.map((match) => {
                const isExpanded = expandedMatch === match.nctId;
                
                return (
                  <div key={match.nctId} className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', borderLeft: match.status === 'ELIGIBLE' ? '4px solid var(--success)' : match.status === 'PARTIAL' ? '4px solid var(--warning)' : '4px solid var(--danger)' }}>
                    
                    {/* Header Row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => toggleExpand(match.nctId)}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        {getStatusIcon(match.status)}
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--primary)' }}>{match.nctId}</span>
                            {getStatusBadge(match.status)}
                          </div>
                          <h3 style={{ fontSize: '15px', color: 'var(--text-primary)', marginTop: '2px' }}>{match.title}</h3>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>Sponsor: <strong>{match.sponsor}</strong></div>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button className="btn btn-secondary" onClick={(e) => { e.stopPropagation(); openTrialDetails(match.rawTrial); }} style={{ padding: '6px 12px', fontSize: '12px', gap: '4px' }}>
                          <Eye size={12} /> View Trial
                        </button>
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </div>
                    </div>

                    {/* Explanations (Collapsible) */}
                    {isExpanded && (
                      <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                        <h4 style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px', color: 'var(--text-secondary)' }}>
                          Criteria Alignment Breakdown
                        </h4>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {match.reasons.map((reason, idx) => {
                            const isNegative = reason.toLowerCase().includes('below') || reason.toLowerCase().includes('above') || reason.toLowerCase().includes('restricted') || reason.toLowerCase().includes('conflict') || reason.toLowerCase().includes('exclusion');
                            return (
                              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px' }}>
                                {isNegative ? (
                                  <XCircle size={16} color="var(--danger)" style={{ marginTop: '3px', flexShrink: 0 }} />
                                ) : (
                                  <CheckCircle2 size={16} color="var(--success)" style={{ marginTop: '3px', flexShrink: 0 }} />
                                )}
                                <span style={{ color: isNegative ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{reason}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Trial Detail Modal */}
      <TrialDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        trial={selectedTrial}
      />
    </div>
  );
};

export default EligibilityMatcher;
