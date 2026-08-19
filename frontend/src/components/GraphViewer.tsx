import React, { useRef, useEffect, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';

interface Node {
  id: string;
  name: string;
  label: string;
  sentiment?: number;
  status?: string;
  x?: number;
  y?: number;
}

interface Edge {
  source: any;
  target: any;
  type: string;
}

interface GraphViewerProps {
  nodes: Node[];
  edges: Edge[];
  onNodeClick: (node: Node) => void;
  selectedNodeId?: string;
}

const COLOR_MAP: Record<string, { bg: string; border: string; glow: string; text: string }> = {
  Company: { bg: '#1e3a8a', border: '#3b82f6', glow: 'rgba(59, 130, 246, 0.4)', text: '#93c5fd' },
  Institution: { bg: '#581c87', border: '#a855f7', glow: 'rgba(168, 85, 247, 0.4)', text: '#d8b4fe' },
  Person: { bg: '#831843', border: '#ec4899', glow: 'rgba(236, 72, 153, 0.4)', text: '#fbcfe8' },
  MacroFactor: { bg: '#7f1d1d', border: '#ef4444', glow: 'rgba(239, 68, 68, 0.4)', text: '#fca5a5' },
  Article: { bg: '#064e3b', border: '#10b981', glow: 'rgba(16, 185, 129, 0.4)', text: '#6ee7b7' },
};

export const GraphViewer: React.FC<GraphViewerProps> = ({ nodes, edges, onNodeClick, selectedNodeId }) => {
  const fgRef = useRef<any>(null);

  useEffect(() => {
    if (fgRef.current) {
      fgRef.current.d3Force('charge').strength(-300);
      fgRef.current.d3Force('link').distance(90);
    }
  }, [nodes, edges]);

  const drawCustomNode = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const isSelected = node.id === selectedNodeId;
    const isArticle = node.label === 'Article';
    
    let colors = COLOR_MAP[node.label] || COLOR_MAP.Company;
    if (isArticle && node.sentiment !== undefined) {
      if (node.sentiment < -0.2) {
        colors = { bg: '#450a0a', border: '#dc2626', glow: 'rgba(220, 38, 38, 0.5)', text: '#fca5a5' };
      } else if (node.sentiment > 0.2) {
        colors = { bg: '#022c22', border: '#059669', glow: 'rgba(5, 150, 105, 0.5)', text: '#6ee7b7' };
      } else {
        colors = { bg: '#1e293b', border: '#64748b', glow: 'rgba(100, 116, 139, 0.3)', text: '#cbd5e1' };
      }
    }

    const radius = node.label === 'Company' ? 14 : isArticle ? 8 : 10;

    ctx.beginPath();
    ctx.arc(node.x, node.y, radius + (isSelected ? 6 : 3), 0, 2 * Math.PI, false);
    ctx.fillStyle = colors.glow;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
    ctx.fillStyle = colors.bg;
    ctx.fill();
    ctx.lineWidth = isSelected ? 2.5 : 1.5;
    ctx.strokeStyle = isSelected ? '#ffffff' : colors.border;
    ctx.stroke();

    if (globalScale > 0.7 || node.label === 'Company' || isSelected) {
      const label = node.name || node.title || node.id;
      const fontSize = Math.max(10 / globalScale, 3);
      ctx.font = `${node.label === 'Company' ? 'bold ' : ''}${fontSize}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const textWidth = ctx.measureText(label).width;
      ctx.fillStyle = 'rgba(7, 9, 14, 0.85)';
      ctx.fillRect(node.x - textWidth / 2 - 4, node.y + radius + 3, textWidth + 8, fontSize + 4);

      ctx.fillStyle = isSelected ? '#ffffff' : colors.text;
      ctx.fillText(label, node.x, node.y + radius + fontSize / 2 + 5);
    }
  }, [selectedNodeId]);

  return (
    <div className="w-full h-full relative rounded-2xl overflow-hidden border border-[#1e293b] bg-[#07090e] shadow-2xl">
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px] opacity-30 pointer-events-none" />

      <ForceGraph2D
        ref={fgRef}
        graphData={{ nodes: nodes.map(n => ({ ...n })), links: edges.map(e => ({ ...e })) }}
        nodeCanvasObject={drawCustomNode}
        nodePointerAreaPaint={(node: any, color, ctx) => {
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(node.x, node.y, 16, 0, 2 * Math.PI, false);
          ctx.fill();
        }}
        linkColor={() => '#1e293b'}
        linkWidth={1.5}
        linkDirectionalArrowLength={4.5}
        linkDirectionalArrowRelPos={0.98}
        linkDirectionalArrowColor={() => '#475569'}
        linkDirectionalParticles={1}
        linkDirectionalParticleSpeed={0.004}
        linkDirectionalParticleWidth={2}
        linkDirectionalParticleColor={() => '#60a5fa'}
        onNodeClick={onNodeClick}
      />

      <div className="absolute bottom-4 left-4 bg-[#0e131f]/90 backdrop-blur-xl px-4 py-2.5 rounded-xl border border-[#1e293b] flex items-center gap-4 text-[11px] font-medium text-gray-300 shadow-xl">
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]" /> Target</div>
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-[0_0_8px_#a855f7]" /> Underwriter / PE</div>
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-pink-500 shadow-[0_0_8px_#ec4899]" /> Executive</div>
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_#ef4444]" /> Macro Drag</div>
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" /> Media Coverage</div>
      </div>
    </div>
  );
};