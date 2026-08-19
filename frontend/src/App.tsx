import React, { useState, useEffect } from 'react';
import { GraphViewer } from './components/GraphViewer';
import { 
  Building2, 
  TrendingDown, 
  TrendingUp, 
  ShieldAlert, 
  ExternalLink, 
  Layers, 
  Search,
  Activity,
  ArrowUpRight,
  Database,
  Radio
} from 'lucide-react';

interface Company {
  id: string;
  name: string;
  status: string;
  sector: string;
  priceBand?: string;
  issueSize?: string;
  valuation?: string;
  listingGain?: string;
  avgSentiment?: number;
  articleCount?: number;
}

interface AnalysisData {
  companyId: string;
  companyName: string;
  directNews: any[];
  contagionRisks: any[];
  graph: {
    nodes: any[];
    edges: any[];
  };
}

export default function App() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'contagion' | 'direct'>('contagion');
  const [selectedNode, setSelectedNode] = useState<any | null>(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  useEffect(() => {
    fetch(`${API_URL}/api/companies`)
      .then(res => res.json())
      .then((data: Company[]) => {
        setCompanies(data);
        if (data.length > 0) setSelectedId(data[0].id);
      })
      .catch(err => console.error("Error fetching companies:", err));
  }, [API_URL]);

  useEffect(() => {
    if (!selectedId) return;
    setLoading(true);
    fetch(`${API_URL}/api/analysis/${selectedId}`)
      .then(res => res.json())
      .then((data: AnalysisData) => {
        setAnalysis(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error running graph analysis:", err);
        setLoading(false);
      });
  }, [selectedId, API_URL]);

  const filteredCompanies = companies.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.sector.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentCompany = companies.find(c => c.id === selectedId);

  return (
    <div className="h-screen w-screen bg-[#07090e] text-slate-200 flex flex-col font-sans">
      {/* Top Terminal Bar */}
      <header className="h-14 border-b border-[#1e293b] bg-[#0c101c]/80 backdrop-blur-xl px-5 flex items-center justify-between z-50 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-tight text-white">IPO GRAPH INTELLIGENCE</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-[#121826] px-3 py-1.5 rounded-lg border border-[#1e293b]">
            <Database className="w-3.5 h-3.5 text-blue-400" />
            <span>CognoDB Bolt 5.x</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-1" />
          </div>
        </div>
      </header>

      {/* Main Grid Viewport */}
      <div className="flex-1 grid grid-cols-12 gap-0 overflow-hidden">
        
        {/* Left Entity Directory */}
        <aside className="col-span-12 md:col-span-3 border-r border-[#1e293b] bg-[#090d16] p-3.5 flex flex-col gap-3 h-[calc(100vh-3.5rem)]">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search companies & sectors..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#121826] pl-9 pr-3 py-2 rounded-xl border border-[#1e293b] text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="text-[10px] font-mono tracking-wider text-slate-400 uppercase px-1">
            Tracking {filteredCompanies.length} Entities
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {filteredCompanies.map(c => {
              const isSelected = c.id === selectedId;
              const sentiment = c.avgSentiment ?? 0;
              return (
                <div
                  key={c.id}
                  onClick={() => { setSelectedId(c.id); setSelectedNode(null); }}
                  className={`group p-3 rounded-xl border cursor-pointer transition-all duration-150 ${
                    isSelected 
                      ? 'bg-blue-600/10 border-blue-500/80 shadow-[0_0_15px_rgba(59,130,246,0.15)]' 
                      : 'bg-[#0f1422] border-[#1a2333] hover:border-slate-700 hover:bg-[#131a2c]'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <span className={`font-semibold text-xs transition-colors ${isSelected ? 'text-blue-400' : 'text-slate-200 group-hover:text-white'}`}>
                      {c.name}
                    </span>
                    <span className="text-[9px] font-mono font-medium uppercase px-1.5 py-0.5 rounded bg-[#161d2f] border border-[#232d42] text-slate-300">
                      {c.status}
                    </span>
                  </div>

                  <div className="flex justify-between items-center mt-2.5 text-[11px] text-slate-400 font-mono">
                    <span className="truncate max-w-[130px]">{c.sector}</span>
                    <div className="flex items-center gap-1">
                      {sentiment >= 0 ? (
                        <TrendingUp className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <TrendingDown className="w-3 h-3 text-rose-400" />
                      )}
                      <span className={sentiment >= 0 ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                        {sentiment > 0 ? `+${sentiment.toFixed(2)}` : sentiment.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* Center Subnetwork Canvas */}
        <main className="col-span-12 md:col-span-6 p-3.5 flex flex-col gap-3 h-[calc(100vh-3.5rem)] bg-[#07090e]">
          {currentCompany && (
            <div className="bg-[#0f1422] border border-[#1e293b] p-3.5 rounded-2xl flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    {currentCompany.name}
                    <span className="text-xs font-normal text-slate-400">· {currentCompany.sector}</span>
                  </h2>
                  <div className="flex gap-4 mt-0.5 text-[11px] font-mono text-slate-300">
                    {currentCompany.issueSize && <div><span className="text-slate-500">Issue:</span> {currentCompany.issueSize}</div>}
                    {currentCompany.priceBand && <div><span className="text-slate-500">Band:</span> {currentCompany.priceBand}</div>}
                    {currentCompany.valuation && <div><span className="text-slate-500">Valuation:</span> {currentCompany.valuation}</div>}
                    {currentCompany.listingGain && <div><span className="text-slate-500">Debut:</span> <span className="text-emerald-400 font-bold">{currentCompany.listingGain}</span></div>}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 border-l border-[#1e293b] pl-4">
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Topology Density</span>
                  <span className="text-sm font-mono font-bold text-blue-400">
                    {analysis?.graph.nodes.length ?? 0} Nodes / {analysis?.graph.edges.length ?? 0} Edges
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="flex-1 relative">
            {loading ? (
              <div className="absolute inset-0 bg-[#07090e]/80 backdrop-blur-md rounded-2xl border border-[#1e293b] flex items-center justify-center gap-3 text-xs font-mono text-slate-400">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                Traversing Graph Subnetwork...
              </div>
            ) : analysis ? (
              <GraphViewer 
                nodes={analysis.graph.nodes} 
                edges={analysis.graph.edges} 
                onNodeClick={(node) => setSelectedNode(node)} 
                selectedNodeId={selectedNode?.id}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                Select an entity to initialize topology view
              </div>
            )}
          </div>
        </main>

        {/* Right Intelligence Drawer */}
        <aside className="col-span-12 md:col-span-3 border-l border-[#1e293b] bg-[#090d16] p-3.5 flex flex-col gap-3 h-[calc(100vh-3.5rem)] overflow-hidden">
          
          {/* Active Node Card when clicked */}
          {selectedNode && (
            <div className="bg-gradient-to-b from-blue-950/40 to-[#0e1424] border border-blue-500/40 p-3.5 rounded-2xl relative animate-in fade-in duration-200">
              <button 
                onClick={() => setSelectedNode(null)} 
                className="absolute top-2.5 right-2.5 text-xs text-slate-400 hover:text-white"
              >
                ✕
              </button>
              <div className="text-[9px] uppercase font-mono tracking-wider text-blue-400 font-bold mb-1">
                Selected {selectedNode.label}
              </div>
              <div className="font-semibold text-white text-xs">{selectedNode.name}</div>
              {selectedNode.status && (
                <div className="text-[11px] text-slate-400 mt-1 font-mono">Status: {selectedNode.status}</div>
              )}
            </div>
          )}

          {/* Segmented Navigation Tab */}
          <div className="flex bg-[#0f1422] p-1 rounded-xl border border-[#1e293b]">
            <button
              onClick={() => setActiveTab('contagion')}
              className={`flex-1 py-1.5 text-[11px] font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'contagion' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              Contagion ({analysis?.contagionRisks.length ?? 0})
            </button>
            <button
              onClick={() => setActiveTab('direct')}
              className={`flex-1 py-1.5 text-[11px] font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'direct' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              Direct ({analysis?.directNews.length ?? 0})
            </button>
          </div>

          {/* Feed of Financial Stories & Risk Events */}
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
            {activeTab === 'contagion' && (
              <>
                {analysis?.contagionRisks.length === 0 ? (
                  <div className="text-center py-12 text-xs text-slate-500 font-mono">
                    No multi-hop risk contagion paths found.
                  </div>
                ) : (
                  analysis?.contagionRisks.map((item, idx) => (
                    <div 
                      key={idx} 
                      className="p-3 rounded-xl border border-[#1a2333] bg-[#0f1422] hover:border-slate-700 transition-all flex flex-col gap-2 group"
                    >
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-amber-400/90 font-medium font-mono truncate max-w-[170px]">
                          Via: {item.intermediaryName}
                        </span>
                        <span className={`font-mono px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          item.sentimentScore < 0 
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}>
                          {item.sentimentScore > 0 ? `+${item.sentimentScore}` : item.sentimentScore}
                        </span>
                      </div>

                      <div className="text-xs font-medium text-slate-200 group-hover:text-white leading-snug">
                        {item.title}
                      </div>

                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                        {item.summary}
                      </p>

                      <div className="flex items-center justify-between pt-2 border-t border-[#1a2333] text-[10px] text-slate-500 font-mono">
                        <span>{item.publisher}</span>
                        <a 
                          href={item.url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-blue-400 hover:text-blue-300 flex items-center gap-0.5"
                        >
                          Source <ArrowUpRight className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  ))
                )}
              </>
            )}

            {activeTab === 'direct' && (
              <>
                {analysis?.directNews.length === 0 ? (
                  <div className="text-center py-12 text-xs text-slate-500 font-mono">
                    No direct articles registered for this entity.
                  </div>
                ) : (
                  analysis?.directNews.map((item, idx) => (
                    <div 
                      key={idx} 
                      className="p-3 rounded-xl border border-[#1a2333] bg-[#0f1422] hover:border-slate-700 transition-all flex flex-col gap-2 group"
                    >
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-400 font-mono">{item.publisher}</span>
                        <span className={`font-mono px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          item.sentimentScore < 0 
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}>
                          {item.sentimentScore > 0 ? `+${item.sentimentScore}` : item.sentimentScore}
                        </span>
                      </div>

                      <div className="text-xs font-medium text-slate-200 group-hover:text-white leading-snug">
                        {item.title}
                      </div>

                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                        {item.summary}
                      </p>

                      <div className="flex justify-end pt-1">
                        <a 
                          href={item.url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-blue-400 hover:text-blue-300 text-[10px] font-mono flex items-center gap-0.5"
                        >
                          Read Article <ArrowUpRight className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  ))
                )}
              </>
            )}
          </div>
        </aside>

      </div>
    </div>
  );
}