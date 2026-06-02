import React, { useState, useCallback, useEffect } from "react";
import axios from "axios";
import Editor from "@monaco-editor/react";
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip
} from 'recharts';
import { 
  Terminal, Trash2, Box, FileText, RefreshCw, Zap,
  AlertTriangle, CheckCircle2, Code, 
  ChevronRight, ShieldAlert, Sparkles
} from 'lucide-react';

import "./App.css";

let baseUrl = process.env.REACT_APP_API_URL || "http://localhost:8000";
if (!baseUrl.endsWith("/api/v1")) {
  baseUrl = `${baseUrl.replace(/\/$/, "")}/api/v1`;
}
const API_URL = baseUrl;

const LANGUAGES = [
  { id: 'python', name: 'Python' },
  { id: 'javascript', name: 'JavaScript' },
  { id: 'typescript', name: 'TypeScript' },
  { id: 'cpp', name: 'C/C++' },
  { id: 'java', name: 'Java' }
];

const DEFAULT_CODES = {
  python: "",
  javascript: "",
  typescript: "",
  cpp: "",
  java: ""
};

function App() {
  const [code, setCode] = useState(DEFAULT_CODES.python); 
  const [language, setLanguage] = useState("python");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(1);
  const [history, setHistory] = useState([]);
  const [activeHistoryId, setActiveHistoryId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchHistory = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_URL}/history`);
      setHistory(data);
    } catch (error) { console.error("History fetch failed", error); }
  }, []);

  useEffect(() => { 
    fetchHistory(); 
  }, [fetchHistory]);

  // Simulate progress pipeline during loading
  useEffect(() => {
    let interval;
    if (loading) {
      setLoadingStep(1);
      interval = setInterval(() => {
        setLoadingStep(prev => (prev < 5 ? prev + 1 : 5));
      }, 700);
    } else {
      setLoadingStep(1);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleLanguageChange = (e) => {
    const selected = e.target.value;
    setLanguage(selected);
    setCode(DEFAULT_CODES[selected] || "");
  };

  const analyzeCode = useCallback(async () => {
    if (!code.trim()) return;
    setLoading(true); 
    setResult(null); 
    setActiveHistoryId(null);
    try {
      const { data } = await axios.post(`${API_URL}/analyze`, { code, language }, { timeout: 45000 });
      setResult(data);
      await fetchHistory();
    } catch (error) {
      setResult({ 
        error: error.response?.data?.detail || "The analysis engine failed to complete the review." 
      });
    } finally { 
      setLoading(false); 
    }
  }, [code, language, fetchHistory]);

  const loadHistoryItem = async (item) => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_URL}/history/${item.id}`);
      setResult({ formatted_output: data.formatted_output, raw_data: data });
      setCode(data.code || "");
      setLanguage(data.language || "python");
      setActiveHistoryId(data.id);
    } catch (error) { 
      console.error("History load failed", error); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await axios.delete(`${API_URL}/history/${deleteConfirm}`);
      if (activeHistoryId === deleteConfirm) { setResult(null); setActiveHistoryId(null); }
      await fetchHistory();
    } catch (error) { console.error("Delete failed", error); } finally { setDeleteConfirm(null); }
  };

  const clearAllHistory = async () => {
    if (!window.confirm("Are you sure you want to clear all history records?")) return;
    try {
      await axios.delete(`${API_URL}/history`);
      setResult(null);
      setActiveHistoryId(null);
      await fetchHistory();
    } catch (error) {
      console.error("Failed to clear history", error);
    }
  };

  const downloadPdf = () => {
    window.print();
  };

  const rd = result?.raw_data;

  // Prepare radar chart data for Style
  const radarData = rd?.style?.sub_metrics ? [
    { subject: 'Naming', val: rd.style.sub_metrics.naming_conventions },
    { subject: 'Formatting', val: rd.style.sub_metrics.formatting },
    { subject: 'Structure', val: rd.style.sub_metrics.structure },
    { subject: 'Docs', val: rd.style.sub_metrics.documentation },
    { subject: 'Consistency', val: rd.style.sub_metrics.consistency }
  ] : [];

  // Prepare bar chart data for Metrics
  const barData = rd?.quality ? [
    { name: 'Readability', score: rd.quality.readability },
    { name: 'Code Style', score: rd.quality.codeStyle },
    { name: 'Efficiency', score: rd.quality.efficiency }
  ] : [];

  // Progress steps for Loading Screen
  const pipelineSteps = [
    { id: 1, label: "Step 1: Running syntax verification..." },
    { id: 2, label: "Step 2: Inspecting runtime faults & logic errors..." },
    { id: 3, label: "Step 3: Calculating readability scores..." },
    { id: 4, label: "Step 4: Formulating Big-O complexities..." },
    { id: 5, label: "Step 5: Synthesizing optimized code refactors..." }
  ];

  return (
    <div className="app-layout">
      {deleteConfirm && (
        <div className="modal-overlay">
          <div className="modal">
            <h3 style={{marginBottom: '10px', fontSize: '1.2rem', color: 'white'}}>Delete Analysis Report?</h3>
            <p style={{color: 'var(--text-muted)', marginBottom: '24px', fontSize: '0.9rem'}}>This record will be permanently removed from history.</p>
            <div style={{display: 'flex', justifyContent: 'center', gap: '12px'}}>
              <button className="modal-btn" style={{background: 'var(--accent-rose)', color: 'white'}} onClick={handleDelete}>Delete</button>
              <button className="modal-btn" style={{background: 'rgba(255,255,255,0.06)', color: 'white', border: '1px solid var(--border-subtle)'}} onClick={() => setDeleteConfirm(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* SIDEBAR */}
      <aside className="sidebar no-print">
        <div className="sidebar-header">
           <div className="cozer-logo">
             <Sparkles size={22} className="logo-sparkle" />
           </div>
           <span className="brand-name">CoZer</span>
        </div>
        <div style={{padding: '20px 20px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
           <span className="section-label">RECENT REVIEWS</span>
           <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
             <RefreshCw size={13} className="pointer text-muted-hover" onClick={fetchHistory} title="Refresh History" />
             {history.length > 0 && (
               <Trash2 size={13} className="pointer text-rose-hover" onClick={clearAllHistory} title="Clear All History" />
             )}
           </div>
        </div>
        <div className="history-list">
          {history.length === 0 ? (
            <div className="no-history">No history found</div>
          ) : (
            history.map((item) => (
              <div key={item.id} className={`history-item ${activeHistoryId === item.id ? 'active' : ''}`} onClick={() => loadHistoryItem(item)}>
                <div style={{flex: 1, minWidth: 0}}>
                   <div style={{fontSize: '0.68rem', color: 'var(--text-muted)'}}>
                     {item.language?.toUpperCase()} • {new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                   </div>
                   <div className="history-summary">{item.functionality || "Code Review Summary"}</div>
                </div>
                <Trash2 size={12} className="delete-btn" onClick={(e) => { e.stopPropagation(); setDeleteConfirm(item.id); }} />
              </div>
            ))
          )}
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <main className="main-content">
        <header className="main-header no-print">
          <div>
            <h1 className="header-title">Developer Review Console</h1>
            <p className="header-subtitle">Evaluate syntax, runtime errors, complexities, and code style in real time.</p>
          </div>
          <div className="language-selector-wrap">
            <span style={{fontSize: '0.85rem', color: 'var(--text-muted)'}}>Language:</span>
            <select className="language-select" value={language} onChange={handleLanguageChange} disabled={loading}>
              {LANGUAGES.map(lang => (
                <option key={lang.id} value={lang.id}>{lang.name}</option>
              ))}
            </select>
          </div>
        </header>
        
        {/* EDITOR SECTION */}
        <section className="editor-section no-print">
          <div className="editor-header">
            <div className="editor-title-group">
              <Code size={16} className="text-purple" />
              <span>Source File ({LANGUAGES.find(l => l.id === language)?.name})</span>
            </div>
            <div className="pulse-indicator">
              <span className="pulse-dot"></span>
              <span style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Ready</span>
            </div>
          </div>
          <div className="editor-container" style={{ position: 'relative' }}>
            {!code && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                pointerEvents: 'none',
                color: 'rgba(255, 255, 255, 0.2)',
                padding: '16px 0 0 65px', /* Monaco's default padding and line-number gutter width */
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '14px',
                zIndex: 10
              }}>
                Write your code here...
              </div>
            )}
            <Editor
              height="340px"
              theme="vs-dark"
              language={language}
              value={code}
              onChange={(val) => setCode(val || "")}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                fontFamily: "'JetBrains Mono', monospace",
                lineHeight: 20,
                automaticLayout: true,
                padding: { top: 16, bottom: 16 }
              }}
            />
          </div>
          <div className="action-bar">
            <button className="run-btn" onClick={analyzeCode} disabled={loading || !code.trim()}>
              {loading ? (
                <>
                  <RefreshCw className="spinner" size={16} />
                  <span>ANALYZING CODE...</span>
                </>
              ) : (
                <>
                  <Terminal size={16} /> 
                  <span>ANALYZE CODE</span>
                </>
              )}
            </button>
          </div>
        </section>

        {/* LOADING PROGRESS WINDOW */}
        {loading && (
          <div className="loading-card no-print">
            <div className="scanning-container">
              <div className="scan-line"></div>
              <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', zIndex: 2}}>
                <RefreshCw className="spinner text-purple" size={32} />
                <h3 className="loading-headline">Auditing Codebase</h3>
                <p className="loading-desc">CoZer AI compiles static trees and runs diagnostic logic engines...</p>
              </div>
            </div>
            
            <div className="pipeline-steps">
              {pipelineSteps.map(step => {
                const isDone = loadingStep > step.id;
                const isCurrent = loadingStep === step.id;
                return (
                  <div key={step.id} className={`pipeline-step ${isDone ? 'done' : isCurrent ? 'current' : 'pending'}`}>
                    <div className="step-bullet">
                      {isDone ? <CheckCircle2 size={14} /> : isCurrent ? <RefreshCw size={14} className="spinner" /> : <ChevronRight size={14} />}
                    </div>
                    <span className="step-label">{step.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ERROR / FALLBACK DISPLAY */}
        {result && result.error && (
          <div className="error-fallback-panel">
            <ShieldAlert size={36} className="text-rose" />
            <div>
              <h3>Analysis Failed</h3>
              <p>{result.error}</p>
            </div>
          </div>
        )}

        {/* COMPREHENSIVE AUDIT REPORT */}
        {result && !result.error && (
          <div className="analysis-report">
            
            {/* STEP 1: SYNTAX ERROR PANEL */}
            {rd && !rd.syntax_valid && rd.syntax_error && (
              <div className="syntax-error-card">
                <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px'}}>
                  <AlertTriangle className="text-rose animate-pulse" size={24} />
                  <h2 className="syntax-error-title">Syntax Validation Error</h2>
                </div>
                <div className="syntax-error-details">
                  <div className="syntax-error-line">❌ Error at line {rd.syntax_error.line}</div>
                  <p className="syntax-error-msg">{rd.syntax_error.message}</p>
                </div>
                <p className="syntax-error-halt-notice">⚠️ Syntax validation failed. Diagnostic pipelines and visual charts have been halted to prevent execution faults.</p>
              </div>
            )}

            {/* DASHBOARD DISPLAY (Only visible if syntax is valid) */}
            {rd && rd.syntax_valid && (
              <div className="results-grid">
                
                {/* ACTIONS UTILITIES BAR */}
                <div className="dashboard-actions-bar no-print">
                  <div className="actions-left">
                    <span className="report-badge">Verified Audit Report</span>
                  </div>
                  <div className="actions-right">

                    <button className="action-utility-btn highlight-btn" onClick={downloadPdf} title="Download PDF print report">
                      <FileText size={14} />
                      <span>Print PDF</span>
                    </button>
                  </div>
                </div>



                {/* STEP 6: Complexity Summary Cards */}
                <div className="card complexity-summary-card">
                  <span className="card-label">STEP 6: COMPLEXITY METRICS</span>
                  <div className="complexity-grid-body">
                    <div className="complexity-cell">
                      <span className="cell-label">Time Complexity</span>
                      <div className="cell-value-wrap">
                        <Terminal size={16} className="text-purple" />
                        <span className="cell-value">{rd.complexity.time}</span>
                      </div>
                    </div>
                    <div className="complexity-cell">
                      <span className="cell-label">Space Complexity</span>
                      <div className="cell-value-wrap">
                        <Box size={16} className="text-cyan" />
                        <span className="cell-value">{rd.complexity.space}</span>
                      </div>
                    </div>
                    <div className="complexity-cell">
                      <span className="cell-label">Confidence Rating</span>
                      <div className="cell-value-wrap">
                        <Zap size={16} className="text-amber" />
                        <span className="cell-value">{rd.complexity.confidence}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="complexity-explanation">
                    <strong>Complexity footprint:</strong> {rd.complexity.explanation}
                  </div>
                </div>

                {/* OVERALL SCORE Circular Gauge */}
                <div className="card chart-card">
                  <div className="card-header-flex">
                    <span className="card-label">OVERALL SCORE</span>
                    <span className={`grade-tag grade-${rd.quality.grade?.toLowerCase().replace(" ", "-")}`}>
                      {rd.quality.grade}
                    </span>
                  </div>
                  <div className="circular-gauge-container">
                    <svg viewBox="0 0 100 100" className="circular-gauge">
                      <defs>
                        <linearGradient id="purpleBlueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#6366f1" />
                          <stop offset="100%" stopColor="#a855f7" />
                        </linearGradient>
                      </defs>
                      <circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.03)" strokeWidth="7" fill="none" />
                      <circle cx="50" cy="50" r="40" stroke="url(#purpleBlueGrad)" strokeWidth="7" fill="none"
                              strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * rd.quality.score) / 100}
                              strokeLinecap="round" className="gauge-fill-circle" />
                      <text x="50" y="52" textAnchor="middle" dominantBaseline="middle" className="gauge-text" fill="white">
                        {rd.quality.score}
                      </text>
                      <text x="50" y="70" textAnchor="middle" className="gauge-sub-text" fill="var(--text-muted)">
                        SCORE
                      </text>
                    </svg>
                  </div>
                </div>

                {/* STEP 4: Code Style Radar Chart */}
                <div className="card chart-card">
                  <div className="card-header-flex">
                    <span className="card-label">STEP 4: STYLE RADAR</span>
                    <span className="confidence-label">Confidence: {rd.style.confidence}%</span>
                  </div>
                  <div className="radar-chart-container">
                    <ResponsiveContainer width="100%" height={160}>
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                        <PolarGrid stroke="rgba(255,255,255,0.08)" />
                        <PolarAngleAxis dataKey="subject" stroke="#a1a1aa" fontSize={10} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="none" tick={false} />
                        <Radar name="Style Score" dataKey="val" stroke="#818cf8" fill="#6366f1" fillOpacity={0.4} />
                      </RadarChart>
                    </ResponsiveContainer>
                    <div className="score-summary-bar">
                      Style Score: <strong>{rd.style.score}/100</strong>
                    </div>
                  </div>
                </div>

                {/* Metrics Overview Bar Chart */}
                <div className="card chart-card">
                  <div className="card-header-flex">
                    <span className="card-label">METRICS OVERVIEW</span>
                  </div>
                  <div className="bar-chart-container">
                    <ResponsiveContainer width="100%" height={160}>
                      <BarChart data={barData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="name" stroke="#888" fontSize={9} tickLine={false} />
                        <YAxis domain={[0, 100]} stroke="#888" fontSize={9} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{background: '#141417', border: '1px solid #333', borderRadius: '8px'}} />
                        <Bar dataKey="score" fill="url(#purpleBlueGrad)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                    <div className="score-summary-bar">
                      Average Score: <strong>{Math.round((rd.quality.readability + rd.quality.codeStyle + rd.quality.efficiency) / 3)}/100</strong>
                    </div>
                  </div>
                </div>

                {/* STEP 2: Error Detection Table */}
                <div className="card full-width-card">
                  <span className="card-label">STEP 2: DETECTED LOGICAL & RUNTIME FAULTS</span>
                  {rd.issues && rd.issues.length > 0 ? (
                    <div className="table-responsive">
                      <table className="faults-table">
                        <thead>
                          <tr>
                            <th>Line Number</th>
                            <th>Severity</th>
                            <th>Error Description</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rd.issues.map((err, i) => (
                            <tr key={i}>
                              <td className="line-num-cell">Line {err.line}</td>
                              <td>
                                <span className={`severity-badge severity-${err.severity?.toLowerCase() || 'medium'}`}>
                                  {err.severity?.toUpperCase() || 'MEDIUM'}
                                </span>
                              </td>
                              <td className="desc-cell">{err.message}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="no-faults-alert">
                      <CheckCircle2 size={24} className="text-emerald" />
                      <div>
                        <h4>Diagnostic Clean Bill</h4>
                        <p>No runtime, logical errors, divisions by zero, or unused/undefined variables detected in this audit.</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* STEP 7: Optimization Suggestions */}
                {rd.optimization && (
                  <div className="card full-width-card">
                    <span className="card-label">STEP 7: OPTIMIZATION SUGGESTIONS</span>
                    
                    <div className="optimization-headers">
                      <div className="opt-metric-pill">
                        <span>Current Complexity:</span>
                        <strong className="text-rose">{rd.optimization.current_complexity || rd.complexity.time}</strong>
                      </div>
                      <div className="opt-metric-pill">
                        <span>Suggested Complexity:</span>
                        <strong className="text-emerald">{rd.optimization.suggested_complexity}</strong>
                      </div>
                      <div className="opt-metric-pill highlight-pill">
                        <span>Estimated Improvement:</span>
                        <strong className="text-purple">{rd.optimization.improvement_percent}%</strong>
                      </div>
                    </div>

                    <div className="optimized-code-container" style={{padding: '16px'}}>
                      <div className="optimized-code-header" style={{borderBottom: 'none', paddingBottom: '0', marginBottom: '12px'}}>
                        <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                          <Sparkles size={14} className="text-purple animate-pulse" />
                          <span>Performance Tips</span>
                        </div>
                      </div>
                      <ul style={{paddingLeft: '24px', margin: 0, color: 'var(--text-main)', fontSize: '0.9rem', lineHeight: '1.6'}}>
                        {rd.optimization.performance_tips?.map((tip, idx) => (
                          <li key={idx} style={{marginBottom: '8px'}}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;