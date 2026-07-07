import React, { useState } from 'react';
import { fetchOpenFDADrug } from '../services/apiService';
import { Search, Info, AlertTriangle, ShieldAlert, Sparkles, Plus, RefreshCw, Layers } from 'lucide-react';

const DrugSearch = () => {
  const [activeTab, setActiveTab] = useState('search'); // 'search' or 'compare'
  
  // Tab 1: Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [drugsList, setDrugsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDrug, setSelectedDrug] = useState(null);

  // Tab 2: Compare state
  const [compareInputs, setCompareInputs] = useState({ drug1: '', drug2: '' });
  const [compareData, setCompareData] = useState({ drug1: null, drug2: null });
  const [loadingCompare, setLoadingCompare] = useState(false);

  // Search Logic
  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setSelectedDrug(null);
    try {
      const results = await fetchOpenFDADrug(searchQuery);
      setDrugsList(results);
      if (results.length > 0) {
        setSelectedDrug(results[0]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Compare Logic
  const handleCompareSubmit = async (e) => {
    e.preventDefault();
    if (!compareInputs.drug1.trim() || !compareInputs.drug2.trim()) return;

    setLoadingCompare(true);
    setCompareData({ drug1: null, drug2: null });
    try {
      const res1 = await fetchOpenFDADrug(compareInputs.drug1);
      const res2 = await fetchOpenFDADrug(compareInputs.drug2);
      
      setCompareData({
        drug1: res1[0] || { brandName: compareInputs.drug1, notFound: true },
        drug2: res2[0] || { brandName: compareInputs.drug2, notFound: true }
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingCompare(false);
    }
  };

  return (
    <div>
      {/* View Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border)', marginBottom: '24px', paddingBottom: '4px' }}>
        <button 
          onClick={() => setActiveTab('search')}
          style={{ 
            padding: '8px 16px', 
            background: 'none', 
            border: 'none', 
            borderBottom: activeTab === 'search' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === 'search' ? 'var(--primary)' : 'var(--text-secondary)',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          Approved Drug Search
        </button>
        <button 
          onClick={() => setActiveTab('compare')}
          style={{ 
            padding: '8px 16px', 
            background: 'none', 
            border: 'none', 
            borderBottom: activeTab === 'compare' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === 'compare' ? 'var(--primary)' : 'var(--text-secondary)',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          Side-by-Side Comparator
        </button>
      </div>

      {activeTab === 'search' ? (
        /* Tab 1: Drug Search View */
        <div>
          {/* Search Card */}
          <div className="card" style={{ marginBottom: '24px' }}>
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
              <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                <label className="form-label" htmlFor="searchQuery">Search FDA Approved Drugs</label>
                <input
                  type="text"
                  id="searchQuery"
                  className="form-input"
                  placeholder="Enter brand name, generic name, or active ingredients (e.g., Advil, Aspirin, Ibuprofen)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ height: '42px', padding: '0 24px' }}>
                <Search size={18} /> Search Label
              </button>
            </form>
          </div>

          {loading ? (
            <div className="card" style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <RefreshCw className="animate-spin" size={24} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
              <div>Retrieving OpenFDA drug records...</div>
            </div>
          ) : drugsList.length === 0 ? (
            <div className="card" style={{ padding: '80px 24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <Sparkles size={48} style={{ margin: '0 auto 16px', color: 'var(--text-light)' }} />
              <h2 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>FDA Approved Drug Registry</h2>
              <p style={{ fontSize: '14px', maxWidth: '460px', margin: '0 auto' }}>
                Query the public OpenFDA database to inspect active pharmaceutical ingredients, brand names, clinical warnings, dosages, and documented side effects.
              </p>
            </div>
          ) : (
            /* Results & Detail Grid split */
            <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '24px' }}>
              {/* Left results list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', paddingLeft: '4px' }}>Matches ({drugsList.length})</span>
                {drugsList.map((drug, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setSelectedDrug(drug)}
                    style={{ 
                      padding: '12px 16px',
                      background: selectedDrug?.brandName === drug.brandName ? 'var(--primary-light)' : 'white',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'var(--transition)',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                  >
                    <div style={{ fontWeight: '700', fontSize: '14px', color: selectedDrug?.brandName === drug.brandName ? 'var(--primary)' : 'var(--text-primary)' }}>{drug.brandName}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{drug.genericName}</div>
                  </button>
                ))}
              </div>

              {/* Right Details Panel */}
              {selectedDrug && (
                <div className="card" style={{ padding: '28px' }}>
                  <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '20px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--primary)', textTransform: 'uppercase' }}>Manufacturer: {selectedDrug.manufacturer}</span>
                    <h2 style={{ fontSize: '24px', color: 'var(--text-primary)' }}>{selectedDrug.brandName}</h2>
                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Generic Component: <strong>{selectedDrug.genericName}</strong></div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                      <h4 style={{ fontSize: '14px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                        <Info size={16} color="var(--primary)" /> Active Ingredients & Strengths
                      </h4>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', backgroundColor: '#f8fafc', padding: '10px', borderRadius: '4px', borderLeft: '3px solid var(--primary)' }}>
                        {selectedDrug.activeIngredient}
                      </p>
                    </div>

                    <div>
                      <h4 style={{ fontSize: '14px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                        <Layers size={16} color="var(--primary)" /> Indications & Usage
                      </h4>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>{selectedDrug.indications}</p>
                    </div>

                    <div>
                      <h4 style={{ fontSize: '14px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                        <AlertTriangle size={16} color="var(--warning)" /> Warnings & Contraindications
                      </h4>
                      <p style={{ fontSize: '13px', color: '#854d0e', backgroundColor: 'var(--warning-light)', padding: '12px', borderRadius: '6px', lineHeight: '1.6' }}>
                        {selectedDrug.warnings}
                      </p>
                    </div>

                    <div>
                      <h4 style={{ fontSize: '14px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                        <ShieldAlert size={16} color="var(--danger)" /> Adverse Reactions (Side Effects)
                      </h4>
                      <p style={{ fontSize: '13px', color: '#991b1b', backgroundColor: 'var(--danger-light)', padding: '12px', borderRadius: '6px', lineHeight: '1.6' }}>
                        {selectedDrug.sideEffects}
                      </p>
                    </div>

                    <div>
                      <h4 style={{ fontSize: '14px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                        Dosage & Administration Guidelines
                      </h4>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6', border: '1px solid var(--border)', padding: '12px', borderRadius: '6px' }}>
                        {selectedDrug.dosage}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Tab 2: Drug Comparison View */
        <div>
          {/* Comparison inputs card */}
          <div className="card" style={{ marginBottom: '24px' }}>
            <form onSubmit={handleCompareSubmit} style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
              <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                <label className="form-label" htmlFor="drug1">Drug 1 Name</label>
                <input
                  type="text"
                  id="drug1"
                  className="form-input"
                  placeholder="e.g. Advil"
                  value={compareInputs.drug1}
                  onChange={(e) => setCompareInputs(prev => ({ ...prev, drug1: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                <label className="form-label" htmlFor="drug2">Drug 2 Name</label>
                <input
                  type="text"
                  id="drug2"
                  className="form-input"
                  placeholder="e.g. Tylenol"
                  value={compareInputs.drug2}
                  onChange={(e) => setCompareInputs(prev => ({ ...prev, drug2: e.target.value }))}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ height: '42px', padding: '0 24px' }}>
                Compare Profiles
              </button>
            </form>
          </div>

          {loadingCompare ? (
            <div className="card" style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <RefreshCw className="animate-spin" size={24} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
              <div>Retrieving drug comparison details...</div>
            </div>
          ) : compareData.drug1 || compareData.drug2 ? (
            /* Comparison Table output */
            <div className="card" style={{ padding: '24px', overflowX: 'auto' }}>
              <table className="custom-table" style={{ width: '100%', tableLayout: 'fixed' }}>
                <thead>
                  <tr>
                    <th style={{ width: '180px', backgroundColor: '#f8fafc' }}>Attribute</th>
                    <th style={{ backgroundColor: '#e0f2fe', color: 'var(--primary)', fontWeight: 'bold', fontSize: '16px' }}>
                      {compareData.drug1?.brandName}
                    </th>
                    <th style={{ backgroundColor: '#f0f9ff', color: 'var(--accent)', fontWeight: 'bold', fontSize: '16px' }}>
                      {compareData.drug2?.brandName}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>Generic Name</td>
                    <td>{compareData.drug1?.notFound ? 'Not found in FDA database' : compareData.drug1?.genericName}</td>
                    <td>{compareData.drug2?.notFound ? 'Not found in FDA database' : compareData.drug2?.genericName}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>Active Ingredients</td>
                    <td>{compareData.drug1?.notFound ? 'N/A' : compareData.drug1?.activeIngredient}</td>
                    <td>{compareData.drug2?.notFound ? 'N/A' : compareData.drug2?.activeIngredient}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>Indications & Usage</td>
                    <td style={{ fontSize: '12px', lineHeight: '1.5' }}>{compareData.drug1?.notFound ? 'N/A' : compareData.drug1?.indications}</td>
                    <td style={{ fontSize: '12px', lineHeight: '1.5' }}>{compareData.drug2?.notFound ? 'N/A' : compareData.drug2?.indications}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 'bold', color: '#854d0e' }}>Warnings</td>
                    <td style={{ fontSize: '12px', lineHeight: '1.5', color: '#854d0e', backgroundColor: '#fefcf0', padding: '12px' }}>
                      {compareData.drug1?.notFound ? 'N/A' : compareData.drug1?.warnings}
                    </td>
                    <td style={{ fontSize: '12px', lineHeight: '1.5', color: '#854d0e', backgroundColor: '#fefcf0', padding: '12px' }}>
                      {compareData.drug2?.notFound ? 'N/A' : compareData.drug2?.warnings}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 'bold', color: '#991b1b' }}>Adverse Reactions</td>
                    <td style={{ fontSize: '12px', lineHeight: '1.5', color: '#991b1b', backgroundColor: '#fff5f5', padding: '12px' }}>
                      {compareData.drug1?.notFound ? 'N/A' : compareData.drug1?.sideEffects}
                    </td>
                    <td style={{ fontSize: '12px', lineHeight: '1.5', color: '#991b1b', backgroundColor: '#fff5f5', padding: '12px' }}>
                      {compareData.drug2?.notFound ? 'N/A' : compareData.drug2?.sideEffects}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>Manufacturer</td>
                    <td>{compareData.drug1?.notFound ? 'N/A' : compareData.drug1?.manufacturer}</td>
                    <td>{compareData.drug2?.notFound ? 'N/A' : compareData.drug2?.manufacturer}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <div className="card" style={{ padding: '60px 24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <Layers size={48} style={{ margin: '0 auto 16px', color: 'var(--text-light)' }} />
              <div style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)' }}>Compare Multiple Drugs Side-by-Side</div>
              <p style={{ fontSize: '14px', maxWidth: '420px', margin: '4px auto 0' }}>
                Enter the name of two drugs (e.g., Tylenol and Advil) in the fields above to contrast indications, warning bulletins, and documented adverse events side-by-side.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DrugSearch;
