import React, { useState, useCallback, useEffect } from "react";
import axios from "axios";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend, Tooltip
} from 'recharts';
import { 
  History, Terminal, Trash2, Box, FileText, BarChart3, RefreshCw, Zap
} from 'lucide-react';
import "./App.css";

const API_URL = "http://localhost:8000/api/v1";

function App() {
  const [code, setCode] = useState(""); 
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [activeHistoryId, setActiveHistoryId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchHistory = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_URL}/history`);
      setHistory(data);
    } catch (error) { console.error("History fetch failed", error); }
  }, []);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const analyzeCode = useCallback(async () => {
    if (!code.trim()) return;
    setLoading(true); setResult(null); setActiveHistoryId(null);
    try {
      const { data } = await axios.post(`${API_URL}/analyze`, { code }, { timeout: 45000 });
      setResult(data);
      await fetchHistory();
    } catch (error) {
      setResult({ error: error.response?.data?.detail || "The analysis engine failed." });
    } finally { setLoading(false); }
  }, [code, fetchHistory]);

  const loadHistoryItem = async (item) => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_URL}/history/${item.id}`);
      setResult({ formatted_output: data.formatted_output, raw_data: data });
      setCode(data.code || "");
      setActiveHistoryId(data.id);
    } catch (error) { console.error("History load failed", error); } finally { setLoading(false); }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await axios.delete(`${API_URL}/history/${deleteConfirm}`);
      if (activeHistoryId === deleteConfirm) { setResult(null); setActiveHistoryId(null); }
      await fetchHistory();
    } catch (error) { console.error("Delete failed", error); } finally { setDeleteConfirm(null); }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      const toast = document.createElement('div');
      toast.textContent = 'Copied to clipboard'; 
      toast.style.cssText = 'position:fixed;bottom:30px;right:30px;background:#00f2ff;color:#000;padding:12px 24px;border-radius:12px;z-index:9999;font-weight:700;';
      document.body.appendChild(toast); 
      setTimeout(() => toast.remove(), 2000);
    });
  };

  const data = result?.raw_data;

  return (
    <div className="app-layout">
      {deleteConfirm && (
        <div className="modal-overlay">
          <div className="modal">
            <h3 style={{marginBottom: '10px'}}>Delete Report?</h3>
            <p style={{color: 'var(--text-muted)', marginBottom: '24px', fontSize: '0.9rem'}}>This analysis will be permanently removed from your history.</p>
            <div style={{display: 'flex', justifyContent: 'center'}}>
              <button className="modal-btn" style={{background: 'var(--accent-rose)', color: 'white'}} onClick={handleDelete}>YES, DELETE</button>
              <button className="modal-btn" style={{background: 'var(--glass)', color: 'white', border: '1px solid var(--border-subtle)'}} onClick={() => setDeleteConfirm(null)}>CANCEL</button>
            </div>
          </div>
        </div>
      )}

      <aside className="sidebar">
        <div className="sidebar-header">
           <img src="/pyzer_logo.png" alt="" className="pyzer-logo-small" />
           <span className="brand-name">Pyzer</span>
        </div>
        <div style={{padding: '16px 20px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: 0.4}}>
           <span style={{fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.1em'}}>HISTORY</span>
           <RefreshCw size={12} className="pointer" onClick={fetchHistory} />
        </div>
        <div className="history-list">
          {history.map((item) => (
            <div key={item.id} className={`history-item ${activeHistoryId === item.id ? 'active' : ''}`} onClick={() => loadHistoryItem(item)}>
              <div style={{flex: 1, minWidth: 0}}>
                 <div style={{fontSize: '0.65rem', color: 'var(--text-muted)'}}>{new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} • {new Date(item.timestamp).toLocaleDateString()}</div>
                 <div className="history-summary">{item.functionality}</div>
              </div>
              <Trash2 size={12} className="delete-btn" onClick={(e) => { e.stopPropagation(); setDeleteConfirm(item.id); }} />
            </div>
          ))}
        </div>
      </aside>

      <main className="main-content">
        <header style={{marginBottom: '32px'}}>
          <h1 className="header-title">Code Analysis Console</h1>
        </header>
        
        <section className="editor-section">
          <textarea placeholder="Paste Python code to analyze runtime risks and logic..." value={code} onChange={e => setCode(e.target.value)} disabled={loading} />
          <div className="action-bar">
            <button className="run-btn" onClick={analyzeCode} disabled={loading || !code.trim()}>
              {loading ? "Analyzing..." : <><Terminal size={18} /> RUN ANALYSIS</>}
            </button>
          </div>
        </section>

        {result && !result.error && (
          <div className="results-grid">
            {/* QUALITY REVIEW - Multi-line Graph */}
            <div className="card" style={{gridColumn: 'span 8'}}>
               <div className="card-title">Quality Review</div>
               <div style={{width: '100%', height: '340px'}}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                      <XAxis dataKey="name" hide />
                      <YAxis domain={[0, 100]} stroke="#444" fontSize={12} />
                      <Tooltip 
                        contentStyle={{background: '#141417', border: '1px solid #333', borderRadius: '12px'}}
                        itemStyle={{fontSize: '13px'}}
                      />
                      <Legend verticalAlign="top" height={36} iconType="circle" />
                      
                      <Area type="monotone" name="Overall Rating" dataKey="score" stroke="#00f2ff" strokeWidth={3} fill="#00f2ff" fillOpacity={0.05} />
                      <Area type="monotone" name="Readability" dataKey="readability" stroke="#f59e0b" strokeWidth={2} fill="#f59e0b" fillOpacity={0.02} />
                      <Area type="monotone" name="Code Style" dataKey="style" stroke="#f43f5e" strokeWidth={2} fill="#f43f5e" fillOpacity={0.02} />
                      <Area type="monotone" name="Efficiency" dataKey="efficiency" stroke="#10b981" strokeWidth={2} fill="#10b981" fillOpacity={0.02} />
                    </AreaChart>
                  </ResponsiveContainer>
               </div>
            </div>

            <div className="card" style={{gridColumn: 'span 4'}}>
               <div className="card-title">Scorecard</div>
               {[
                 {label: 'Readability', val: data.quality.readability, color: 'var(--accent-cyan)'},
                 {label: 'Code Style', val: data.quality.codeStyle, color: 'var(--accent-amber)'},
                 {label: 'Efficiency', val: data.quality.efficiency, color: 'var(--accent-emerald)'}
               ].map((m, i) => (
                 <div key={i} className="metric-row">
                   <div className="metric-info"><span>{m.label}</span><span>{m.val}%</span></div>
                   <div className="bar-bg"><div className="bar-fill" style={{width: `${m.val}%`, background: m.color}} /></div>
                 </div>
               ))}
               <div style={{marginTop: '24px', padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', textAlign: 'center'}}>
                  <div style={{fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase'}}>Overall Rating</div>
                  <div style={{fontSize: '4rem', fontWeight: 800, color: 'white'}}>{data.quality.score}</div>
               </div>
            </div>

            <div className="card" style={{gridColumn: 'span 12'}}>
               <div className="card-title">Operational Insights</div>
               <div style={{display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '32px'}}>
                  <div>
                    <div style={{fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '6px'}}>FUNCTIONALITY</div>
                    <p style={{fontSize: '0.9rem', fontWeight: 500}}>{data.functionality}</p>
                  </div>
                  <div>
                    <div style={{fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '6px'}}>TIME COMPLEXITY</div>
                    <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}><Terminal size={16} className="text-cyan"/><span style={{fontSize: '1.2rem', fontWeight: 800}} className="text-cyan">{data.complexity.time}</span></div>
                  </div>
                  <div>
                    <div style={{fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '6px'}}>SPACE COMPLEXITY</div>
                    <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}><Box size={16} className="text-emerald"/><span style={{fontSize: '1.2rem', fontWeight: 800}} className="text-emerald">{data.complexity.space}</span></div>
                  </div>
               </div>
            </div>

            <div className="card" style={{gridColumn: 'span 12'}}>
               <div className="card-title text-rose">Detected Issues</div>
               {data.issues.length > 0 ? data.issues.map((err, i) => (
                 <div key={i} style={{padding: '12px', background: 'rgba(244, 63, 94, 0.04)', borderRadius: '8px', marginBottom: '8px', borderLeft: '3px solid var(--accent-rose)', fontSize: '0.9rem'}}>
                    <b>LINE {err.line}</b>: {err.message}
                 </div>
               )) : <div style={{textAlign: 'center', color: 'var(--accent-emerald)', fontSize: '0.9rem'}}>Code is safe. No runtime or logical errors found.</div>}
            </div>

            <div className="card" style={{gridColumn: 'span 12'}}>
               <div className="card-title text-emerald">Suggested Improvements</div>
               <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                  {data.suggestions && data.suggestions.length > 0 ? data.suggestions.map((s, i) => (
                    <div key={i} style={{display: 'flex', gap: '12px', fontSize: '0.9rem', color: 'var(--text-main)', alignItems: 'flex-start'}}>
                       <Zap size={16} className="text-emerald" style={{flexShrink: 0, marginTop: '3px'}} />
                       <span>{s}</span>
                    </div>
                  )) : <div style={{fontSize: '0.9rem', color: 'var(--text-muted)'}}>No specific refactorings suggested for this snippet.</div>}
               </div>
            </div>

            <div className="card" style={{gridColumn: 'span 12', textAlign: 'center', borderStyle: 'dashed', opacity: 0.8}}>
               <button className="run-btn" style={{margin: '0 auto', background: 'transparent', color: 'white', border: '1px solid var(--border-subtle)'}} onClick={() => copyToClipboard(result.formatted_output)}>
                  <FileText size={16} /> Copy the report
               </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;