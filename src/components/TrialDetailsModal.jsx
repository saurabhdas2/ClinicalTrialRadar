import React from 'react';
import { X, Calendar, MapPin, Building, Activity, UserCheck } from 'lucide-react';

const TrialDetailsModal = ({ isOpen, onClose, trial }) => {
  if (!isOpen || !trial) return null;

  // Format eligibility criteria string for nice rendering
  const renderCriteria = (text) => {
    if (!text) return <p className="text-secondary">No criteria listed.</p>;
    
    // Split criteria text by lines
    const lines = text.split('\n');
    return (
      <div className="criteria-content" style={{ maxHeight: '300px', overflowY: 'auto', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', backgroundColor: '#f8fafc' }}>
        {lines.map((line, idx) => {
          const isHeader = line.toLowerCase().includes('inclusion criteria') || line.toLowerCase().includes('exclusion criteria');
          return (
            <div 
              key={idx} 
              style={{ 
                fontWeight: isHeader ? '700' : '400',
                color: isHeader ? '#0f2c59' : '#475569',
                marginTop: isHeader ? '16px' : '4px',
                marginBottom: isHeader ? '8px' : '0px',
                paddingLeft: !isHeader && line.trim().startsWith('-') ? '12px' : '0px'
              }}
            >
              {line}
            </div>
          );
        })}
      </div>
    );
  };

  const getStatusClass = (status) => {
    return `badge ${status?.toLowerCase() || 'unknown'}`;
  };

  const formatPhase = (phases) => {
    if (!phases || phases.length === 0) return 'Phase Not Specified';
    return phases.map(p => p.replace('PHASE', 'Phase ')).join(', ');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '850px' }}>
        
        <div className="modal-header">
          <div className="modal-title" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: varColor('--primary') }}>
              {trial.nctId} | {formatPhase(trial.phases)}
            </span>
            <h2>{trial.title}</h2>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close modal">
            <X size={24} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Quick Info Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', backgroundColor: '#f1f5f9', padding: '16px', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Activity size={20} color="var(--primary)" />
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '600' }}>Status</div>
                <span className={getStatusClass(trial.status)}>
                  {trial.status?.replace(/_/g, ' ')}
                </span>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Building size={20} color="var(--primary)" />
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '600' }}>Sponsor</div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{trial.sponsor}</div>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Calendar size={20} color="var(--primary)" />
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '600' }}>Completion Date</div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{trial.completionDate || 'N/A'}</div>
              </div>
            </div>
          </div>

          {/* Official Title & Description */}
          {trial.officialTitle && (
            <div>
              <h3 style={{ fontSize: '15px', marginBottom: '6px', color: 'var(--text-primary)' }}>Official Scientific Title</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>{trial.officialTitle}</p>
            </div>
          )}

          <div>
            <h3 style={{ fontSize: '15px', marginBottom: '8px', color: 'var(--text-primary)' }}>Study Summary</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>{trial.summary}</p>
          </div>

          {/* Eligibility Metrics Summary */}
          <div>
            <h3 style={{ fontSize: '15px', marginBottom: '8px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <UserCheck size={18} /> Candidate Eligibility Criteria
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
              <div style={{ border: '1px solid var(--border)', borderRadius: '6px', padding: '10px', textAlign: 'center' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-light)', textTransform: 'uppercase', fontWeight: 'bold' }}>Minimum Age</span>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{trial.minimumAge}</div>
              </div>
              <div style={{ border: '1px solid var(--border)', borderRadius: '6px', padding: '10px', textAlign: 'center' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-light)', textTransform: 'uppercase', fontWeight: 'bold' }}>Maximum Age</span>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{trial.maximumAge}</div>
              </div>
              <div style={{ border: '1px solid var(--border)', borderRadius: '6px', padding: '10px', textAlign: 'center' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-light)', textTransform: 'uppercase', fontWeight: 'bold' }}>Gender Restr.</span>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{trial.sex}</div>
              </div>
            </div>

            {renderCriteria(trial.criteriaText)}
          </div>

          {/* Locations */}
          {trial.locations && trial.locations.length > 0 && (
            <div>
              <h3 style={{ fontSize: '15px', marginBottom: '8px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={18} /> Trial Locations ({trial.locations.length})
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', maxHeight: '120px', overflowY: 'auto', paddingRight: '8px' }}>
                {trial.locations.map((loc, idx) => (
                  <div key={idx} style={{ fontSize: '13px', border: '1px solid #f1f5f9', borderRadius: '4px', padding: '8px', backgroundColor: '#fafbfb' }}>
                    <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{loc.facility}</div>
                    <div style={{ color: 'var(--text-secondary)' }}>
                      {[loc.city, loc.state, loc.country].filter(Boolean).join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Close details</button>
        </div>

      </div>
    </div>
  );
};

// Helper to support dynamic CSS variables safely inside inline styles
const varColor = (cssVarName) => {
  if (typeof window !== 'undefined') {
    return getComputedStyle(document.documentElement).getPropertyValue(cssVarName).trim();
  }
  return '#0071bc';
};

export default TrialDetailsModal;
