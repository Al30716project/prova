import React, { useState, useEffect } from 'react';
import { Layout, Shield, Target, History, Settings, ChevronRight, Activity, AlertTriangle, Save, RefreshCw, BarChart3, TrendingUp, Filter, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Match {
  id: number;
  utc_kickoff: string;
  status: string;
  competition_name: string;
  home_team: string;
  home_crest: string;
  away_team: string;
  away_crest: string;
  prob_home: number;
  prob_draw: number;
  prob_away: number;
  reliability_score: number;
  theoretical_signal?: string;
  operational_signal?: string;
  prob_over_25?: number;
  prob_btts?: number;
}

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [matches, setMatches] = useState<Match[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [validation, setValidation] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeTab === 'dashboard') {
      setLoading(true);
      fetch('/api/dashboard').then(res => res.json()).then(data => { setMatches(data); setLoading(false); });
    } else if (activeTab === 'history') {
      setLoading(true);
      fetch('/api/history').then(res => res.json()).then(data => { setHistory(data); setLoading(false); });
    } else if (activeTab === 'validation') {
      setLoading(true);
      fetch('/api/validation').then(res => res.json()).then(data => { setValidation(data); setLoading(false); });
    } else if (activeTab === 'settings') {
      setLoading(true);
      fetch('/api/settings').then(res => res.json()).then(data => { setSettings(data); setLoading(false); });
    }
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] font-sans selection:bg-[#141414] selection:text-[#E4E3E0]">
      {/* Sidebar */}
      <nav className="fixed left-0 top-0 h-full w-64 border-r border-[#141414] flex flex-col p-6 space-y-8 bg-[#E4E3E0] z-50">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-[#141414] rounded-sm flex items-center justify-center">
            <Activity className="text-[#E4E3E0] w-6 h-6" />
          </div>
          <h1 className="font-bold text-2xl tracking-tighter uppercase leading-none">Football<br/>Analytics</h1>
        </div>

        <div className="flex flex-col space-y-2">
          <NavItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<Layout size={18} />} label="Dashboard" />
          <NavItem active={activeTab === 'validation'} onClick={() => setActiveTab('validation')} icon={<Shield size={18} />} label="Validation" />
          <NavItem active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon={<History size={18} />} label="History" />
          <NavItem active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<Settings size={18} />} label="Settings" />
        </div>

        <div className="mt-auto pt-6 border-t border-[#141414]/20">
          <div className="flex items-center space-x-2 text-xs uppercase tracking-widest opacity-50 font-mono">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span>System Online</span>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="ml-64 p-16 max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div key="dashboard" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-16">
              <header className="flex justify-between items-end">
                <div className="space-y-4">
                  <p className="font-mono text-xs uppercase tracking-[0.3em] opacity-50">Technical Overview</p>
                  <h2 className="text-8xl font-bold tracking-tighter italic font-serif leading-[0.9]">Upcoming Matches</h2>
                </div>
                <div className="flex space-x-4">
                  <button 
                    onClick={async () => {
                      setLoading(true);
                      await fetch('/api/refresh', { method: 'POST' });
                      const res = await fetch('/api/dashboard');
                      const data = await res.json();
                      setMatches(data);
                      setLoading(false);
                    }}
                    className="px-6 py-2 border border-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors uppercase text-xs font-bold tracking-widest flex items-center space-x-2"
                  >
                    <RefreshCw size={14} />
                    <span>Refresh Data</span>
                  </button>
                </div>
              </header>

              {loading ? <LoadingState /> : (
                <div className="grid grid-cols-1 gap-px bg-[#141414] border border-[#141414]">
                  <div className="grid grid-cols-[40px_1.5fr_1fr_1fr_1fr_1fr_40px] p-4 bg-[#E4E3E0] text-xs uppercase font-mono tracking-widest opacity-50">
                    <div>#</div>
                    <div>Match</div>
                    <div>Competition</div>
                    <div>Probabilities (1/X/2)</div>
                    <div>Signals</div>
                    <div>Reliability</div>
                    <div></div>
                  </div>
                  {matches.map((match, idx) => (
                    <MatchRow key={match.id} match={match} index={idx + 1} onClick={() => setSelectedMatchId(match.id)} />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'validation' && (
            <motion.div key="validation" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-16">
              <header className="space-y-4">
                <p className="font-mono text-xs uppercase tracking-[0.3em] opacity-50">Model Performance</p>
                <h2 className="text-8xl font-bold tracking-tighter italic font-serif leading-[0.9]">Validation Metrics</h2>
              </header>

              {loading || !validation ? <LoadingState /> : (
                <div className="grid grid-cols-3 gap-12">
                  <div className="col-span-2 space-y-12">
                    <div className="p-10 border border-[#141414] bg-white h-[450px]">
                      <h4 className="text-xs uppercase font-mono tracking-widest opacity-50 mb-10">Calibration Curve (Reliability)</h4>
                      <ResponsiveContainer width="100%" height="80%">
                        <LineChart data={validation.calibration_data}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                          <XAxis dataKey="bin" label={{ value: 'Predicted Prob', position: 'insideBottom', offset: -5 }} />
                          <YAxis label={{ value: 'Observed Freq', angle: -90, position: 'insideLeft' }} />
                          <Tooltip />
                          <Line type="monotone" dataKey="observed" stroke="#141414" strokeWidth={2} dot={{ fill: '#141414' }} />
                          <Line type="monotone" dataKey="bin" stroke="#ccc" strokeDasharray="5 5" dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="grid grid-cols-2 gap-12">
                      <div className="p-10 border border-[#141414] bg-white">
                        <h4 className="text-xs uppercase font-mono tracking-widest opacity-50 mb-8">Accuracy by Competition</h4>
                        <ResponsiveContainer width="100%" height={250}>
                          <BarChart data={validation.performance_by_competition}>
                            <XAxis dataKey="name" hide />
                            <YAxis hide domain={[0, 1]} />
                            <Tooltip />
                            <Bar dataKey="accuracy" fill="#141414" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="p-10 border border-[#141414] bg-white">
                        <h4 className="text-xs uppercase font-mono tracking-widest opacity-50 mb-8">ROI by Competition</h4>
                        <ResponsiveContainer width="100%" height={250}>
                          <BarChart data={validation.performance_by_competition}>
                            <XAxis dataKey="name" hide />
                            <YAxis hide />
                            <Tooltip />
                            <Bar dataKey="roi" fill="#141414" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-12">
                    <StatCard label="Global Accuracy" value={`${(validation.accuracy * 100).toFixed(1)}%`} sub="Target: >60%" />
                    <StatCard label="Brier Score" value={validation.brier_score.toFixed(3)} sub="Lower is better" />
                    <StatCard label="Log Loss" value={validation.log_loss.toFixed(3)} sub="Information gain" />
                    <StatCard label="Simulated ROI" value={`${(validation.roi * 100).toFixed(1)}%`} sub="Flat stake strategy" highlight />
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div key="history" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-16">
              <header className="flex justify-between items-end">
                <div className="space-y-4">
                  <p className="font-mono text-xs uppercase tracking-[0.3em] opacity-50">Audit Trail</p>
                  <h2 className="text-8xl font-bold tracking-tighter italic font-serif leading-[0.9]">Prediction History</h2>
                </div>
                <button className="px-8 py-3 border border-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors uppercase text-xs font-bold tracking-widest flex items-center space-x-3">
                  <Filter size={16} />
                  <span>Filters</span>
                </button>
              </header>

              {loading ? <LoadingState /> : (
                <div className="grid grid-cols-1 gap-px bg-[#141414] border border-[#141414]">
                  <div className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr] p-6 bg-[#E4E3E0] text-xs uppercase font-mono tracking-widest opacity-50">
                    <div>Match Date</div>
                    <div>Teams</div>
                    <div>Result</div>
                    <div>Prediction (1/X/2)</div>
                    <div>Outcome</div>
                  </div>
                  {history.map((h, i) => (
                    <div key={i} className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr] p-8 bg-[#E4E3E0] border-b border-[#141414]/5 items-center">
                      <div className="font-mono text-sm opacity-50 tracking-wider">{new Date(h.utc_kickoff).toLocaleDateString()}</div>
                      <div className="font-bold text-xl tracking-tight leading-tight">{h.home_team} vs {h.away_team}</div>
                      <div className="font-mono text-2xl font-bold">{h.home_score} - {h.away_score}</div>
                      <div className="font-mono text-sm tracking-wide">
                        {(h.prob_home * 100).toFixed(0)}% / {(h.prob_draw * 100).toFixed(0)}% / {(h.prob_away * 100).toFixed(0)}%
                      </div>
                      <div>
                        {((h.home_score > h.away_score && h.prob_home > h.prob_away && h.prob_home > h.prob_draw) ||
                          (h.home_score < h.away_score && h.prob_away > h.prob_home && h.prob_away > h.prob_draw) ||
                          (h.home_score === h.away_score && h.prob_draw > h.prob_home && h.prob_draw > h.prob_away)) ? (
                          <span className="px-3 py-1.5 bg-green-500/10 text-green-700 text-xs font-bold uppercase tracking-widest rounded-sm">Correct</span>
                        ) : (
                          <span className="px-3 py-1.5 bg-red-500/10 text-red-700 text-xs font-bold uppercase tracking-widest rounded-sm">Incorrect</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div key="settings" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-16">
              <header className="space-y-4">
                <p className="font-mono text-xs uppercase tracking-[0.3em] opacity-50">Configuration</p>
                <h2 className="text-8xl font-bold tracking-tighter italic font-serif leading-[0.9]">System Settings</h2>
              </header>

              {loading || !settings ? <LoadingState /> : (
                <div className="max-w-3xl space-y-16">
                  <section className="space-y-10">
                    <h4 className="text-xs uppercase font-mono tracking-widest opacity-50 border-b border-[#141414]/10 pb-4">API Credentials</h4>
                    <div className="space-y-8">
                      <SettingsInput label="Football-Data.org Key" value={settings.football_data_key} placeholder="Enter API Key..." />
                      <SettingsInput label="The Odds API Key" value={settings.odds_api_key} placeholder="Enter API Key..." />
                    </div>
                  </section>

                  <section className="space-y-10">
                    <h4 className="text-xs uppercase font-mono tracking-widest opacity-50 border-b border-[#141414]/10 pb-4">Model Parameters</h4>
                    <div className="grid grid-cols-2 gap-12">
                      <SettingsInput label="Value Threshold" value={`${(settings.value_threshold * 100)}%`} type="number" />
                      <SettingsInput label="Cache TTL (seconds)" value={settings.cache_ttl} type="number" />
                    </div>
                  </section>

                  <button className="w-full py-6 bg-[#141414] text-[#E4E3E0] uppercase text-xs font-bold tracking-[0.3em] hover:bg-[#141414]/90 transition-all flex items-center justify-center space-x-4">
                    <Save size={20} />
                    <span>Save Configuration</span>
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Match Detail Modal */}
      <AnimatePresence>
        {selectedMatchId && (
          <MatchDetailModal matchId={selectedMatchId} onClose={() => setSelectedMatchId(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="h-64 flex flex-col items-center justify-center space-y-4">
      <RefreshCw className="animate-spin opacity-20" size={32} />
      <p className="font-mono text-xs uppercase tracking-widest opacity-50">Synchronizing Local Engine...</p>
    </div>
  );
}

function StatCard({ label, value, sub, highlight = false }: { label: string, value: string, sub: string, highlight?: boolean }) {
  return (
    <div className={cn("p-10 border border-[#141414] bg-white", highlight && "bg-[#141414] text-[#E4E3E0]")}>
      <p className={cn("text-xs uppercase font-mono tracking-widest mb-6 opacity-50", highlight && "opacity-30")}>{label}</p>
      <div className="text-6xl font-bold tracking-tighter mb-4 italic font-serif leading-none">{value}</div>
      <p className="text-xs opacity-50 font-mono tracking-wider">{sub}</p>
    </div>
  );
}

function SettingsInput({ label, value, placeholder, type = "text" }: { label: string, value: any, placeholder?: string, type?: string }) {
  return (
    <div className="space-y-4">
      <label className="text-xs uppercase font-mono tracking-widest opacity-50">{label}</label>
      <input 
        type={type} 
        defaultValue={value} 
        placeholder={placeholder}
        className="w-full bg-white border border-[#141414]/10 p-6 font-mono text-lg focus:outline-none focus:border-[#141414] transition-colors" 
      />
    </div>
  );
}

function NavItem({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center space-x-4 px-4 py-3 transition-all duration-200 uppercase text-sm font-bold tracking-widest",
        active ? "bg-[#141414] text-[#E4E3E0]" : "hover:bg-[#141414]/5"
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function factorial(n: number): number {
  if (n === 0 || n === 1) return 1;
  let res = 1;
  for (let i = 2; i <= n; i++) res *= i;
  return res;
}

function poisson(lambda: number, k: number): number {
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);
}

function MatchRow({ match, index, onClick }: { match: Match, index: number, onClick: () => void, key?: number }) {
  return (
    <div onClick={onClick} className="grid grid-cols-[40px_1.5fr_1fr_1fr_1fr_1fr_40px] p-8 bg-[#E4E3E0] hover:bg-[#141414] hover:text-[#E4E3E0] transition-all cursor-pointer group items-center">
      <div className="font-mono text-sm opacity-50 group-hover:opacity-100">{index.toString().padStart(2, '0')}</div>
      <div className="flex items-center space-x-8">
        <div className="flex -space-x-3">
          <img src={match.home_crest} className="w-12 h-12 rounded-full border border-[#141414] bg-white p-1.5" referrerPolicy="no-referrer" />
          <img src={match.away_crest} className="w-12 h-12 rounded-full border border-[#141414] bg-white p-1.5" referrerPolicy="no-referrer" />
        </div>
        <div>
          <div className="font-bold text-2xl tracking-tight leading-tight mb-2">{match.home_team} vs {match.away_team}</div>
          <div className="font-mono text-xs opacity-50 group-hover:opacity-100 tracking-wider">{new Date(match.utc_kickoff).toLocaleString()}</div>
        </div>
      </div>
      <div className="font-serif italic text-base opacity-70 group-hover:opacity-100">{match.competition_name}</div>
      <div className="font-mono text-sm flex space-x-4">
        <div className="flex flex-col">
          <span className="text-[10px] opacity-50 uppercase">Home</span>
          <span>{(match.prob_home * 100).toFixed(1)}%</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] opacity-50 uppercase">Draw</span>
          <span>{(match.prob_draw * 100).toFixed(1)}%</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] opacity-50 uppercase">Away</span>
          <span>{(match.prob_away * 100).toFixed(1)}%</span>
        </div>
      </div>
      <div className="flex flex-col space-y-1">
        {match.theoretical_signal && (
          <span className="text-[10px] font-bold uppercase tracking-tighter bg-blue-500/10 text-blue-700 px-1.5 py-0.5 rounded-sm w-fit group-hover:bg-blue-500 group-hover:text-white">T: {match.theoretical_signal}</span>
        )}
        {match.operational_signal && (
          <span className="text-[10px] font-bold uppercase tracking-tighter bg-emerald-500/10 text-emerald-700 px-1.5 py-0.5 rounded-sm w-fit group-hover:bg-emerald-500 group-hover:text-white">O: {match.operational_signal}</span>
        )}
        {!match.theoretical_signal && !match.operational_signal && <span className="text-[10px] opacity-30 uppercase">No Signal</span>}
      </div>
      <div className="flex items-center space-x-3">
        <div className="flex-1 h-1 bg-[#141414]/10 group-hover:bg-[#E4E3E0]/20 rounded-full overflow-hidden">
          <div className="h-full bg-[#141414] group-hover:bg-[#E4E3E0]" style={{ width: `${match.reliability_score}%` }} />
        </div>
        <span className="font-mono text-sm">{match.reliability_score}%</span>
      </div>
      <div className="flex justify-end">
        <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  );
}

function MatchDetailModal({ matchId, onClose }: { matchId: number, onClose: () => void }) {
  const [match, setMatch] = useState<any>(null);
  const [adjType, setAdjType] = useState('news');
  const [adjReason, setAdjReason] = useState('');
  const [adjMag, setAdjMag] = useState(0);

  useEffect(() => {
    fetch(`/api/matches/${matchId}`).then(res => res.json()).then(setMatch);
  }, [matchId]);

  const handleAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/adjustments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ match_id: matchId, type: adjType, magnitude: adjMag, reason: adjReason })
    });
    setAdjReason('');
    setAdjMag(0);
    // In a real app, we'd trigger a re-prediction here
  };

  if (!match) return null;

  const explanations = JSON.parse(match.explanations_json || '[]');

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-12">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-[#141414]/80 backdrop-blur-sm" />
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative bg-[#E4E3E0] w-full max-w-7xl max-h-[90vh] overflow-y-auto border border-[#141414] shadow-2xl p-20">
        <div className="flex justify-between items-start mb-16">
          <div className="space-y-4">
            <p className="font-mono text-xs uppercase tracking-widest opacity-50">{match.competition_name} • {match.stage}</p>
            <h3 className="text-7xl font-bold tracking-tighter italic font-serif leading-[0.9]">{match.home_team} <span className="not-italic text-4xl opacity-30 mx-6">vs</span> {match.away_team}</h3>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-[#141414]/5 rounded-full transition-colors"><X size={24} /></button>
        </div>

        <div className="grid grid-cols-3 gap-16">
          <div className="col-span-2 space-y-16">
            <section>
              <h4 className="text-xs uppercase font-mono tracking-widest opacity-50 mb-10 border-b border-[#141414]/10 pb-6">Model Explainability</h4>
              <div className="space-y-10">
                {explanations.map((exp: string, i: number) => (
                  <div key={i} className="flex items-start space-x-8 group">
                    <div className="w-2 h-2 bg-[#141414] rounded-full mt-4 group-hover:scale-150 transition-transform" />
                    <p className="text-2xl leading-[1.6] font-medium">{exp}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="grid grid-cols-3 gap-10">
              <div className="p-10 border border-[#141414]/10 bg-[#141414]/5">
                <h5 className="text-xs uppercase font-mono tracking-widest opacity-50 mb-10 text-center">Expected Goals (λ)</h5>
                <div className="grid grid-cols-[1fr_1px_1fr] items-center">
                  <div className="text-left">
                    <span className="block text-2xl font-bold mb-3">{match.expected_goals_home?.toFixed(2) || '0.00'}</span>
                    <span className="text-xs uppercase font-mono opacity-50 tracking-widest">Home</span>
                  </div>
                  <div className="h-20 bg-[#141414]/10" />
                  <div className="text-right">
                    <span className="block text-2xl font-bold mb-3">{match.expected_goals_away?.toFixed(2) || '0.00'}</span>
                    <span className="text-xs uppercase font-mono opacity-50 tracking-widest">Away</span>
                  </div>
                </div>
              </div>
              <div className="p-10 border border-[#141414]/10 bg-[#141414]/5">
                <h5 className="text-xs uppercase font-mono tracking-widest opacity-50 mb-10">Secondary Markets</h5>
                <div className="space-y-10">
                  <div className="flex justify-between items-center">
                    <span className="text-xs uppercase font-mono opacity-50 tracking-widest">Over 2.5</span>
                    <span className="font-bold text-2xl">{(match.prob_over_25 * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs uppercase font-mono opacity-50 tracking-widest">BTTS (Yes)</span>
                    <span className="font-bold text-2xl">{(match.prob_btts * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </div>
              <div className="p-10 border border-[#141414]/10 bg-[#141414]/5">
                <h5 className="text-xs uppercase font-mono tracking-widest opacity-50 mb-10">Manual Adjustment</h5>
                <form onSubmit={handleAdjustment} className="space-y-6">
                  <select value={adjType} onChange={e => setAdjType(e.target.value)} className="w-full bg-white border border-[#141414]/10 text-xs p-4 font-mono uppercase tracking-widest">
                    <option value="news">News/Injuries</option>
                    <option value="tactical">Tactical Shift</option>
                  </select>
                  <input value={adjReason} onChange={e => setAdjReason(e.target.value)} placeholder="Reason..." className="w-full bg-white border border-[#141414]/10 text-xs p-4 font-mono" />
                  <div className="flex space-x-4">
                    <input type="number" step="0.05" value={adjMag} onChange={e => setAdjMag(parseFloat(e.target.value))} className="w-24 bg-white border border-[#141414]/10 text-xs p-4 font-mono" />
                    <button className="flex-1 bg-[#141414] text-[#E4E3E0] text-xs font-bold tracking-widest py-4 hover:bg-[#141414]/90 transition-colors">Apply</button>
                  </div>
                </form>
              </div>
            </section>

            <section className="mt-8">
              <h4 className="text-xs uppercase font-mono tracking-widest opacity-50 mb-6 border-b border-[#141414]/10 pb-2">Poisson Score Matrix</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs font-mono border-collapse">
                  <thead>
                    <tr>
                      <th className="p-3 border border-[#141414]/10 bg-[#141414]/5">H \ A</th>
                      {[0,1,2,3,4,5].map(g => <th key={g} className="p-3 border border-[#141414]/10 bg-[#141414]/5">{g}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {[0,1,2,3,4,5].map(h => (
                      <tr key={h}>
                        <th className="p-3 border border-[#141414]/10 bg-[#141414]/5">{h}</th>
                        {[0,1,2,3,4,5].map(a => {
                          const prob = (poisson(match.expected_goals_home, h) * poisson(match.expected_goals_away, a) * 100);
                          return (
                            <td key={a} className={cn("p-3 border border-[#141414]/10 text-center transition-colors", prob > 5 && "bg-[#141414] text-[#E4E3E0] font-bold")}>
                              {prob.toFixed(1)}%
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          <aside className="space-y-12">
            <div className="p-10 bg-[#141414] text-[#E4E3E0]">
              <h4 className="text-xs uppercase font-mono tracking-widest opacity-50 mb-10">Fair Odds vs Probabilities</h4>
              <div className="space-y-8">
                <ProbBar label="Home" prob={match.prob_home} fairOdds={match.fair_home} />
                <ProbBar label="Draw" prob={match.prob_draw} fairOdds={match.fair_draw} />
                <ProbBar label="Away" prob={match.prob_away} fairOdds={match.fair_away} />
              </div>
            </div>

            {match.operational_signal && (
              <div className="p-10 bg-emerald-500 text-[#141414]">
                <div className="flex items-center space-x-4 mb-6">
                  <TrendingUp size={20} />
                  <h5 className="text-xs uppercase font-mono font-bold tracking-widest">Operational Signal</h5>
                </div>
                <p className="text-4xl font-bold italic font-serif leading-tight">{match.operational_signal}</p>
              </div>
            )}

            <div className="p-10 border border-amber-500/20 bg-amber-500/5 text-amber-900">
              <div className="flex items-center space-x-4 mb-8">
                <AlertTriangle size={20} />
                <h5 className="text-xs uppercase font-mono font-bold tracking-widest">Technical Warning</h5>
              </div>
              <p className="text-lg leading-loose opacity-80">Model confidence is reduced due to missing historical data for this specific referee-team combination.</p>
            </div>
          </aside>
        </div>
      </motion.div>
    </div>
  );
}

function ProbBar({ label, prob, fairOdds }: { label: string, prob: number, fairOdds?: number }) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center text-xs uppercase font-mono tracking-widest">
        <span>{label}</span>
        <div className="flex space-x-6">
          {fairOdds && <span className="opacity-50">Fair: {fairOdds.toFixed(2)}</span>}
          <span className="font-bold">{(prob * 100).toFixed(1)}%</span>
        </div>
      </div>
      <div className="w-full h-2 bg-[#E4E3E0]/10 rounded-full overflow-hidden">
        <div className="h-full bg-[#E4E3E0]" style={{ width: `${prob * 100}%` }} />
      </div>
    </div>
  );
}
