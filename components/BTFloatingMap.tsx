import React, { useState, useEffect, useRef } from 'react';
import { BehaviorTree, Blackboard, SUCCESS, FAILURE, RUNNING } from '../services/bt';

interface BTFloatingMapProps {
  isOpen: boolean;
  onClose: () => void;
  tree: BehaviorTree;
  blackboard: Blackboard;
}

const STATUS_COLORS: Record<number, string> = {
  [SUCCESS]: 'border-green-500 bg-green-500/20 text-green-200 shadow-[0_0_8px_rgba(34,197,94,0.3)]',
  [FAILURE]: 'border-red-500 bg-red-500/20 text-red-200 shadow-[0_0_8px_rgba(239,68,68,0.3)]',
  [RUNNING]: 'border-blue-500 bg-blue-500/30 text-blue-100 shadow-[0_0_12px_rgba(59,130,246,0.5)] animate-pulse',
};

const CATEGORY_COLORS: Record<string, string> = {
  'composite': 'bg-indigo-600',
  'decorator': 'bg-teal-600',
  'action': 'bg-blue-600',
  'condition': 'bg-amber-600',
};

const NodeBox = ({ node, statuses, parentType }: { node: any, statuses: any, parentType?: string }) => {
  const status = statuses[node.id];
  const isWaiting = status === undefined;
  
  const statusClass = !isWaiting ? STATUS_COLORS[status] : 'border-slate-700/50 bg-slate-800/30 text-slate-500 opacity-40';
  const categoryClass = CATEGORY_COLORS[node.category] || 'bg-slate-600';

  const children = node.children || (node.child ? [node.child] : []);
  const isSequential = parentType === 'Sequence' || parentType === 'MemSequence' || parentType === 'ReactiveSequence';

  return (
    <div className="flex flex-col items-center">
      {/* Node Card */}
      <div className={`relative flex flex-col min-w-[110px] max-w-[150px] rounded-lg border transition-all duration-300 z-10 shadow-lg ${statusClass} ${status === RUNNING ? 'scale-105' : ''}`}>
        <div className={`text-[7px] px-2 py-0.5 rounded-t-md uppercase font-black text-white/80 tracking-widest ${categoryClass} ${isWaiting ? 'grayscale' : ''}`}>
          {node.category}
        </div>
        <div className="p-2 text-center bg-slate-900/20 rounded-b-md">
          <div className="text-[10px] font-bold leading-tight text-white/90 truncate">
            {node.title || node.name}
          </div>
          {node.title && node.title !== node.name && (
            <div className="text-[7px] text-slate-500 mt-0.5 opacity-60 font-mono italic">
              {node.name}
            </div>
          )}
        </div>
        {status !== undefined && (
          <div className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full border border-slate-900 bg-slate-800">
             <div className={`w-full h-full rounded-full ${status === SUCCESS ? 'bg-green-500' : status === FAILURE ? 'bg-red-500' : 'bg-blue-500'}`}></div>
          </div>
        )}
      </div>

      {/* Connection Lines */}
      {children.length > 0 && (
        <div className="flex flex-col items-center w-full">
          <div className="w-px h-6 bg-slate-700/40"></div>
          <div className="flex justify-center relative w-full">
            {children.map((child: any, idx: number) => (
              <div key={child.id} className="flex flex-col items-center relative px-3">
                {children.length > 1 && (
                  <>
                    {/* Horizontal Bar Arm Left */}
                    {idx > 0 && <div className="absolute top-0 left-0 w-1/2 h-px bg-slate-700/40"></div>}
                    {/* Horizontal Bar Arm Right */}
                    {idx < children.length - 1 && <div className="absolute top-0 right-0 w-1/2 h-px bg-slate-700/40"></div>}
                    {/* Step Marker */}
                    {isSequential && (
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 bg-slate-900 text-[6px] text-amber-500 w-2.5 h-2.5 rounded-full flex items-center justify-center border border-slate-700 shadow-sm">
                        {idx + 1}
                      </div>
                    )}
                  </>
                )}
                <div className="w-px h-4 bg-slate-700/40"></div>
                <NodeBox node={child} statuses={statuses} parentType={node.name} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const BTFloatingMap: React.FC<BTFloatingMapProps> = ({ isOpen, onClose, tree, blackboard }) => {
  const [winPos, setWinPos] = useState({ x: 20, y: 80 });
  const [winSize, setWinSize] = useState({ width: 450, height: 550 });
  const [canvasPos, setCanvasPos] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(0.7);
  
  const [activeAction, setActiveAction] = useState<'dragging' | 'panning' | 'resizing' | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  
  const nodeStatuses = blackboard.get('nodeStatuses', tree.id) || {};

  const handleWinMouseDown = (e: React.MouseEvent) => {
    setActiveAction('dragging');
    dragOffset.current = { x: e.clientX - winPos.x, y: e.clientY - winPos.y };
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveAction('panning');
    dragOffset.current = { x: e.clientX - canvasPos.x, y: e.clientY - canvasPos.y };
  };

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveAction('resizing');
    dragOffset.current = { x: e.clientX - winSize.width, y: e.clientY - winSize.height };
  };

  const handleGlobalMouseMove = (e: MouseEvent) => {
    if (activeAction === 'dragging') {
      setWinPos({ x: e.clientX - dragOffset.current.x, y: e.clientY - dragOffset.current.y });
    } else if (activeAction === 'panning') {
      setCanvasPos({ x: e.clientX - dragOffset.current.x, y: e.clientY - dragOffset.current.y });
    } else if (activeAction === 'resizing') {
      setWinSize({ 
        width: Math.max(300, e.clientX - dragOffset.current.x), 
        height: Math.max(200, e.clientY - dragOffset.current.y) 
      });
    }
  };

  const handleGlobalMouseUp = () => setActiveAction(null);

  const handleWheel = (e: React.WheelEvent) => {
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(z => Math.min(Math.max(z * delta, 0.1), 3));
  };

  useEffect(() => {
    if (activeAction) {
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [activeAction]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed z-[60] flex flex-col pointer-events-none transition-shadow"
      style={{ 
        left: winPos.x, 
        top: winPos.y, 
        width: winSize.width, 
        height: winSize.height,
        boxShadow: activeAction === 'dragging' ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)' : '0 10px 15px -3px rgba(0, 0, 0, 0.3)'
      }}
    >
      {/* Header / Drag Handle */}
      <div 
        onMouseDown={handleWinMouseDown}
        className="flex items-center justify-between bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-t-2xl px-4 py-2.5 cursor-grab active:cursor-grabbing pointer-events-auto shadow-2xl"
      >
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-amber-500 rounded-lg flex items-center justify-center shadow-lg shadow-amber-500/20">
            <span className="text-[10px]">🧠</span>
          </div>
          <span className="text-[11px] font-black text-white tracking-tight uppercase opacity-90">Logic Monitor HUD</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-black/30 rounded-full px-2 py-0.5 border border-white/5">
            <button onClick={(e) => { e.stopPropagation(); setZoom(z => Math.max(0.1, z * 0.8)); }} className="text-xs text-slate-400 hover:text-white transition-colors">－</button>
            <span className="text-[9px] font-mono text-amber-500/80 min-w-[30px] text-center">{(zoom*100).toFixed(0)}%</span>
            <button onClick={(e) => { e.stopPropagation(); setZoom(z => Math.min(3, z * 1.2)); }} className="text-xs text-slate-400 hover:text-white transition-colors">＋</button>
          </div>
          <button 
            onClick={onClose} 
            className="w-5 h-5 flex items-center justify-center rounded-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all pointer-events-auto"
          >
            <span className="text-xs">✕</span>
          </button>
        </div>
      </div>

      {/* Map Content Area */}
      <div 
        onMouseDown={handleCanvasMouseDown}
        onWheel={handleWheel}
        className="flex-1 bg-slate-900/30 backdrop-blur-md border-x border-b border-slate-700/40 rounded-b-2xl overflow-hidden pointer-events-auto relative cursor-all-scroll shadow-inner"
      >
        {/* Zoomable & Pannable Inner Canvas */}
        <div 
          className="w-full h-full transition-transform duration-75 ease-out flex items-center justify-center"
          style={{ 
            transform: `translate(${canvasPos.x}px, ${canvasPos.y}px) scale(${zoom})`,
            transformOrigin: 'center'
          }}
        >
          {tree.root ? <NodeBox node={tree.root} statuses={nodeStatuses} /> : <div className="text-slate-600 italic text-xs animate-pulse">Initializing Neural Tree...</div>}
        </div>

        {/* Resize Handle */}
        <div 
          onMouseDown={handleResizeMouseDown}
          className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize flex items-end justify-end p-1 group"
        >
          <div className="w-1.5 h-1.5 bg-slate-600 rounded-full group-hover:bg-amber-500 transition-colors"></div>
        </div>

        {/* HUD Overlay Text */}
        <div className="absolute top-3 left-4 pointer-events-none">
          <div className="text-[8px] text-white/20 font-mono uppercase tracking-[0.2em]">Pannable Canvas Active</div>
        </div>
      </div>
    </div>
  );
};
