import React, { useState, useRef } from 'react';
import { runAgentQuery } from '../services/agentEngine';
import TrialDetailsModal from '../components/TrialDetailsModal';
import { 
  Bot, User, Send, Compass, Eye, CheckCircle2, XCircle, 
  Building, RefreshCw
} from 'lucide-react';

const AgentPanel = () => {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'agent',
      text: 'Hello! I am the **Trial Radar Intelligence Agent**. I can run queries across ClinicalTrials.gov and OpenFDA, analyze enrollment eligibility, compare drugs, and synthesize pharmaceutical portfolios. Try asking me a question or select a shortcut on the right!',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [agentRunning, setAgentRunning] = useState(false);
  const [currentSteps, setCurrentSteps] = useState([]);
  const [selectedTrial, setSelectedTrial] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const messagesEndRef = useRef(null);

  const SUGGESTED_QUERIES = [
    { text: "Find active breast cancer trials by Novartis", label: "Search Trials" },
    { text: "Am I eligible for Alzheimer's trials if I am 68 years old?", label: "Verify Eligibility" },
    { text: "Compare side effects of Advil and Tylenol", label: "Compare Drugs" },
    { text: "Show pipeline metrics for Merck", label: "Company Timelines" }
  ];

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentSteps, agentRunning]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleQuerySubmit = async (queryText) => {
    if (!queryText.trim() || agentRunning) return;

    const userMessageId = `user-${Date.now()}`;
    const agentMessageId = `agent-${Date.now()}`;
    
    // 1. Append User Message
    const userMsg = {
      id: userMessageId,
      sender: 'user',
      text: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages(prev => [...prev, userMsg]);
    setQuery('');
    setAgentRunning(true);
    setCurrentSteps([]);

    try {
      // 2. Call Agent Reasoning Engine
      const response = await runAgentQuery(queryText);
      
      // Simulate real-time step resolution for beautiful visual timing
      for (let i = 0; i < response.steps.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 800));
        setCurrentSteps(prev => [...prev, response.steps[i]]);
      }
      
      await new Promise(resolve => setTimeout(resolve, 600));

      // 3. Append Agent Message with payload data
      const agentMsg = {
        id: agentMessageId,
        sender: 'agent',
        text: getAgentResponseSummary(response),
        payload: response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, agentMsg]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          sender: 'agent',
          text: 'Apologies, I encountered an error executing that request. Please try again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setAgentRunning(false);
      setCurrentSteps([]);
    }
  };

  const getAgentResponseSummary = (response) => {
    switch (response.intent) {
      case 'trial_search':
        return `I queried ClinicalTrials.gov V2. Here are the studies I identified matching your parameters:`;
      case 'drug_search':
        return `I found the following FDA approved drug labels:`;
      case 'drug_compare':
        return `Here is a side-by-side comparison of active ingredients, warnings, and adverse events:`;
      case 'company_insights':
        return `I extracted the pipeline metrics for **${response.company}** from our trial registry:`;
      case 'eligibility_check':
        return `I compiled the patient profile details and scored eligibility criteria against active protocols. Here are the matching scores:`;
      default:
        return `I've processed your query. Here are the details:`;
    }
  };

  const openTrialDetails = (trial) => {
    setSelectedTrial(trial);
    setIsModalOpen(true);
  };

  // Render dynamic widgets in the chat stream based on payloads
  const renderMessagePayload = (payload) => {
    if (!payload || !payload.data) return null;

    // Widget 1: Trial Search Results
    if (payload.intent === 'trial_search') {
      const trials = payload.data || [];
      return (
        <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
          {trials.slice(0, 3).map((trial) => (
            <div key={trial.nctId} style={{ backgroundColor: 'white', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--primary)' }}>{trial.nctId}</span>
                <span className="phase-badge">{trial.phases?.[0]?.replace('PHASE', 'Phase ') || 'N/A'}</span>
              </div>
              <h4 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>{trial.title}</h4>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Sponsor: <strong>{trial.sponsor}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                <span className={`badge ${trial.status?.toLowerCase() || 'unknown'}`} style={{ fontSize: '9px', padding: '2px 6px' }}>
                  {trial.status?.replace(/_/g, ' ')}
                </span>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => openTrialDetails(trial)}
                  style={{ padding: '4px 8px', fontSize: '11px', gap: '4px' }}
                >
                  <Eye size={12} /> View Details
                </button>
              </div>
            </div>
          ))}
          {trials.length > 3 && (
            <span style={{ fontSize: '11px', color: 'var(--text-light)', fontStyle: 'italic', paddingLeft: '4px' }}>
              Showing 3 of {trials.length} matching studies.
            </span>
          )}
        </div>
      );
    }

    // Widget 2: Drug Comparison Table
    if (payload.intent === 'drug_compare') {
      const { drug1, drug2 } = payload.data;
      return (
        <div style={{ marginTop: '14px', width: '100%', overflowX: 'auto', backgroundColor: 'white', borderRadius: '8px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
          <table className="custom-table" style={{ fontSize: '12px', width: '100%' }}>
            <thead>
              <tr>
                <th style={{ width: '120px' }}>Field</th>
                <th style={{ color: 'var(--primary)' }}>{drug1.brandName}</th>
                <th style={{ color: 'var(--accent)' }}>{drug2.brandName}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontWeight: 'bold' }}>Generic Name</td>
                <td>{drug1.genericName}</td>
                <td>{drug2.genericName}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold' }}>Ingredients</td>
                <td>{drug1.activeIngredient}</td>
                <td>{drug2.activeIngredient}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold', color: '#854d0e' }}>Warnings</td>
                <td style={{ fontSize: '11px', color: '#854d0e', backgroundColor: '#fefcf0', verticalAlign: 'top' }}>{drug1.warnings?.slice(0, 150)}...</td>
                <td style={{ fontSize: '11px', color: '#854d0e', backgroundColor: '#fefcf0', verticalAlign: 'top' }}>{drug2.warnings?.slice(0, 150)}...</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold', color: '#991b1b' }}>Adverse Events</td>
                <td style={{ fontSize: '11px', color: '#991b1b', backgroundColor: '#fff5f5', verticalAlign: 'top' }}>{drug1.sideEffects?.slice(0, 150)}...</td>
                <td style={{ fontSize: '11px', color: '#991b1b', backgroundColor: '#fff5f5', verticalAlign: 'top' }}>{drug2.sideEffects?.slice(0, 150)}...</td>
              </tr>
            </tbody>
          </table>
        </div>
      );
    }

    // Widget 3: Drug Search label results
    if (payload.intent === 'drug_search') {
      const drug = payload.data?.[0];
      if (!drug) return <p style={{ fontSize: '12px', color: 'var(--danger)' }}>No label information located.</p>;
      return (
        <div style={{ marginTop: '14px', backgroundColor: 'white', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '12px' }}>
            <h4 style={{ fontSize: '16px', color: 'var(--primary)' }}>{drug.brandName}</h4>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Generic Component: <strong>{drug.genericName}</strong></div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
            <div>
              <strong>Indications:</strong>
              <p style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>{drug.indications?.slice(0, 180)}...</p>
            </div>
            <div>
              <strong style={{ color: '#854d0e' }}>Warnings:</strong>
              <p style={{ color: '#854d0e', marginTop: '2px', backgroundColor: '#fefcf0', padding: '6px', borderRadius: '4px' }}>{drug.warnings?.slice(0, 180)}...</p>
            </div>
          </div>
        </div>
      );
    }

    // Widget 4: Eligibility Scoring Matrix
    if (payload.intent === 'eligibility_check') {
      const evals = payload.data || [];
      const profile = payload.profile;
      return (
        <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
          {/* Patient Profile Sub-card */}
          <div style={{ backgroundColor: '#f8fafc', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
            <span>Condition: <strong>{profile.conditions.join(', ')}</strong></span>
            <span>Age: <strong>{profile.age}</strong></span>
            <span>Gender: <strong>{profile.gender}</strong></span>
          </div>
          
          {evals.map((e) => {
            const isEligible = e.status === 'ELIGIBLE';
            const isPartial = e.status === 'PARTIAL';
            return (
              <div key={e.nctId} style={{ backgroundColor: 'white', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px', borderLeft: isEligible ? '4px solid var(--success)' : isPartial ? '4px solid var(--warning)' : '4px solid var(--danger)', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--primary)' }}>{e.nctId}</span>
                  {isEligible ? (
                    <span className="badge recruiting" style={{ fontSize: '9px' }}>Highly Eligible</span>
                  ) : isPartial ? (
                    <span className="badge active_not_recruiting" style={{ fontSize: '9px' }}>Partial Match</span>
                  ) : (
                    <span className="badge terminated" style={{ fontSize: '9px' }}>Ineligible</span>
                  )}
                </div>
                <h4 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '6px' }}>{e.title}</h4>
                
                {/* Scoring bullets */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px', padding: '8px', backgroundColor: '#fafbfb', borderRadius: '4px' }}>
                  {e.reasons.slice(0, 2).map((r, idx) => {
                    const isError = r.toLowerCase().includes('below') || r.toLowerCase().includes('above') || r.toLowerCase().includes('restricted') || r.toLowerCase().includes('conflict');
                    return (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
                        {isError ? <XCircle size={12} color="var(--danger)" /> : <CheckCircle2 size={12} color="var(--success)" />}
                        <span style={{ color: isError ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{r}</span>
                      </div>
                    );
                  })}
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => openTrialDetails(e.rawTrial)}
                    style={{ padding: '4px 8px', fontSize: '11px', gap: '4px' }}
                  >
                    <Eye size={12} /> View Protocol
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    // Widget 5: Company Insights timelines
    if (payload.intent === 'company_insights') {
      const metrics = payload.data;
      return (
        <div style={{ marginTop: '14px', backgroundColor: 'white', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <Building size={20} color="var(--primary)" />
            <h4 style={{ fontSize: '15px', color: 'var(--text-primary)' }}>{metrics.name} Pipeline</h4>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px', marginBottom: '12px' }}>
            <div style={{ border: '1px solid var(--border)', borderRadius: '6px', padding: '8px' }}>
              <div style={{ color: 'var(--text-light)', fontSize: '10px', textTransform: 'uppercase' }}>Active Studies</div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{metrics.years[metrics.years.length - 1].active}</div>
            </div>
            <div style={{ border: '1px solid var(--border)', borderRadius: '6px', padding: '8px' }}>
              <div style={{ color: 'var(--text-light)', fontSize: '10px', textTransform: 'uppercase' }}>Completed (Total)</div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--success)' }}>{metrics.years.reduce((acc, y) => acc + y.completed, 0)}</div>
            </div>
          </div>
          
          <div style={{ fontSize: '12px' }}>
            <strong>Top Approved Products:</strong>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
              {metrics.approvedDrugs.slice(0, 3).map((d, idx) => (
                <span key={idx} className="phase-badge" style={{ backgroundColor: 'var(--accent-light)', color: 'var(--primary)', border: 'none' }}>
                  {d}
                </span>
              ))}
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="agent-layout">
      {/* Chat Thread Container (Left column) */}
      <div className="agent-chat-container">
        <div className="agent-chat-messages">
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`agent-message ${msg.sender}`}
            >
              {/* Message Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '4px' }}>
                {msg.sender === 'agent' ? (
                  <Bot size={16} color="var(--primary)" />
                ) : (
                  <User size={16} color="var(--text-secondary)" />
                )}
                <span style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {msg.sender === 'agent' ? 'Trial Radar AI' : 'User Query'}
                </span>
                <span style={{ fontSize: '10px', color: 'var(--text-light)', marginLeft: 'auto' }}>
                  {msg.timestamp}
                </span>
              </div>
              
              {/* Message body text */}
              <div style={{ lineHeight: '1.5', whiteSpace: 'pre-line' }}>
                {msg.text}
              </div>

              {/* Render dynamic payloads */}
              {msg.payload && renderMessagePayload(msg.payload)}
            </div>
          ))}
          
          {/* Real-time Thinking Step Resolvers */}
          {agentRunning && (
            <div className="agent-message agent" style={{ alignSelf: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <Bot size={16} color="var(--primary)" />
                <span style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}>Trial Radar AI</span>
                <span style={{ fontSize: '10px', color: 'var(--text-light)', marginLeft: 'auto' }}>Thinking...</span>
              </div>
              
              <div className="thinking-steps">
                {currentSteps.map((step, idx) => (
                  <div key={idx} className="thinking-step">
                    <span style={{ color: 'var(--accent)', fontWeight: 'bold' }}>•</span>
                    <span>{step.text}</span>
                  </div>
                ))}
                {currentSteps.length === 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontStyle: 'italic' }}>
                    <RefreshCw className="animate-spin" size={12} style={{ animation: 'spin 1s linear infinite' }} />
                    Initiating agent parsing directives...
                  </div>
                )}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="agent-chat-input-area">
          <input
            type="text"
            className="agent-chat-input"
            placeholder="Type a clinical query (e.g. Find Phase 3 Merck trials or am I eligible for Alzheimer trials)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleQuerySubmit(query)}
            disabled={agentRunning}
          />
          <button 
            className="btn btn-primary btn-icon-only" 
            onClick={() => handleQuerySubmit(query)}
            disabled={agentRunning || !query.trim()}
            style={{ width: '46px', height: '46px', borderRadius: '50%' }}
          >
            <Send size={18} />
          </button>
        </div>
      </div>

      {/* Suggested Shortcuts Sidebar (Right column) */}
      <div className="agent-sidebar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '8px' }}>
          <Compass size={18} color="var(--primary)" />
          <h4 style={{ fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Agent Shortcuts</h4>
        </div>
        
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4', marginBottom: '8px' }}>
          Click any clinical scenario shortcut below to trigger the AI Agent reasoning and fetching pipeline.
        </p>

        {SUGGESTED_QUERIES.map((q, idx) => (
          <button
            key={idx}
            className="suggested-query"
            onClick={() => handleQuerySubmit(q.text)}
            disabled={agentRunning}
          >
            <div style={{ fontSize: '10px', color: 'var(--text-light)', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '2px' }}>{q.label}</div>
            <div style={{ color: 'var(--text-primary)', lineHeight: '1.3' }}>"{q.text}"</div>
          </button>
        ))}
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

export default AgentPanel;
