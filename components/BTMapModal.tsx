import React, { useState, useEffect, useRef } from 'react';
import { BehaviorTree, Blackboard, SUCCESS, FAILURE, RUNNING } from '../services/bt';

interface BTMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  tree: BehaviorTree;
  blackboard: Blackboard;
}

const STATUS_COLORS: Record<number, string> = {
  [SUCCESS]: 'border-green-500 bg-green-500/20 text-green-200 shadow-[0_0_10px_rgba(34,197,94,0.2)]',
  [FAILURE]: 'border-red-500 bg-red-500/20 text-red-200 shadow-[0_0_10px_rgba(239,68,68,0.2)]',
  [RUNNING]: 'border-blue-500 bg-blue-500/30 text-blue-100 shadow-[0_0_20px_rgba(59,130,246,0.5)] animate-pulse',
};

const CATEGORY_COLORS: Record<string, string> = {
  'composite': 'bg-indigo-600',
  'decorator': 'bg-teal-600',
  'action': 'bg-blue-600',
  'condition': 'bg-amber-600',
};

const NodeBox = ({ node, statuses, parentType }: { node: any, statuses: any, parentType?: string }) => {
  const status = statuses[node.id];
  const isWaiting = status === undefined; // 尚未被运行过的节点
  
  const statusClass = !isWaiting ? STATUS_COLORS[status] : 'border-slate-700 bg-slate-800/40 text-slate-500 opacity-40';
  const categoryClass = CATEGORY_COLORS[node.category] || 'bg-slate-600';

  const children = node.children || (node.child ? [node.child] : []);
  const isSequential = parentType === 'Sequence' || parentType === 'MemSequence' || parentType === 'ReactiveSequence';

  return (
    <div className={`flex flex-col items-center transition-opacity duration-500`}>
      {/* Node Box */}
      <div className={`relative flex flex-col min-w-[160px] max-w-[220px] rounded-xl border-2 transition-all duration-300 z-10 ${statusClass} shadow-lg ${status === RUNNING ? 'scale-110' : 'hover:scale-105'}`}>
        {/* Category Header */}
        <div className={`text-[10px] px-3 py-1 rounded-t-lg uppercase font-black text-white tracking-widest ${categoryClass} ${isWaiting ? 'grayscale' : ''}`}>
          {node.category}
        </div>
        
        {/* Body */}
        <div className="p-4 text-center bg-slate-900/40 rounded-b-lg">
          <div className="text-sm font-bold leading-tight text-white/90">
            {node.title || node.name}
          </div>
          {node.title && node.title !== node.name && (
            <div className="text-[10px] opacity-40 mt-1.5 italic font-mono truncate">
              {node.name}
            </div>
          )}
        </div>

        {/* Status Indicator Dot */}
        {status !== undefined && (
          <div className="absolute -top-2 -right-2 w-4 h-4 rounded-full border-2 border-slate-900 bg-slate-800 overflow-hidden">
             <div className={`w-full h-full ${status === SUCCESS ? 'bg-green-500' : status === FAILURE ? 'bg-red-500' : 'bg-blue-500'}`}></div>
          </div>
        )}
      </div>

      {/* Connection and Children */}
      {children.length > 0 && (
        <div className="flex flex-col items-center w-full">
          {/* Vertical line down from parent */}
          <div className="w-px h-10 bg-slate-700/50"></div>
          
          <div className="flex justify-center relative w-full">
            {children.map((child: any, idx: number) => (
              <div key={child.id} className="flex flex-col items-center relative px-6">
                {/* Horizontal Bar Pieces (Arms) */}
                {children.length > 1 && (
                  <>
                    {/* Left Arm */}
                    {idx > 0 && (
                      <div className={`absolute top-0 left-0 w-1/2 h-px ${isSequential ? 'bg-gradient-to-r from-slate-700/20 to-slate-500' : 'bg-slate-700/50'}`}></div>
                    )}
                    {/* Right Arm */}
                    {idx < children.length - 1 && (
                      <div className={`absolute top-0 right-0 w-1/2 h-px ${isSequential ? 'bg-gradient-to-r from-slate-500 to-slate-700/20' : 'bg-slate-700/50'}`}></div>
                    )}
                    
                    {/* Step Number for Sequential Parents */}
                    {isSequential && (
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                        <div className="bg-slate-900 border border-slate-700 text-[9px] font-bold text-amber-500 w-4 h-4 rounded-full flex items-center justify-center shadow-lg">
                          {idx + 1}
                        </div>
                      </div>
                    )}

                    {/* Joint Dot (only if not showing step number) */}
                    {!isSequential && (
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-slate-600 rounded-full border border-slate-800 z-0"></div>
                    )}
                  </>
                )}
                
                {/* Vertical stub */}
                <div className="w-px h-6 bg-slate-700/50"></div>
                
                <NodeBox node={child} statuses={statuses} parentType={node.name} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const BTMapModal: React.FC<BTMapModalProps> = ({ isOpen, onClose, tree, blackboard }) => {
  const [zoom, setZoom] = useState(0.8);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });
  
  const nodeStatuses = blackboard.get('nodeStatuses', tree.id) || {};

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - lastMousePos.current.x;
    const dy = e.clientY - lastMousePos.current.y;
    setPosition(prev => ({ x: prev.x + dx, y: prev.y + dy }));
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.min(Math.max(prev * delta, 0.1), 3));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/95 backdrop-blur-xl transition-all duration-500">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-8 flex items-center justify-between z-20 pointer-events-none">
        <div className="pointer-events-auto">
          <h2 className="text-3xl font-black text-white flex items-center gap-4 tracking-tighter">
            <span className="p-2.5 bg-gradient-to-br from-amber-400 to-orange-600 rounded-xl shadow-lg shadow-amber-500/20">🧠</span>
            BEHAVIOR TREE MAP
          </h2>
          <div className="flex items-center gap-3 mt-2 ml-1">
            <div className="h-px w-8 bg-slate-700"></div>
            <p className="text-slate-500 text-[10px] font-mono uppercase tracking-[0.3em]">Neural Logic Visualization</p>
          </div>
        </div>
        
        <div className="flex gap-4 pointer-events-auto items-center">
          <div className="flex bg-slate-900/80 border border-slate-800 rounded-2xl p-1.5 shadow-2xl backdrop-blur">
            <button onClick={() => setZoom(prev => prev * 1.2)} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all font-bold">＋</button>
            <div className="px-4 flex items-center text-xs font-mono text-amber-500/80 w-20 justify-center">{(zoom * 100).toFixed(0)}%</div>
            <button onClick={() => setZoom(prev => prev * 0.8)} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all font-bold">－</button>
          </div>
          <button 
            onClick={onClose}
            className="w-12 h-12 flex items-center justify-center bg-slate-900 hover:bg-red-500 text-slate-400 hover:text-white border border-slate-800 hover:border-red-400 rounded-2xl transition-all group"
          >
            <span className="text-2xl group-hover:rotate-90 transition-transform duration-300">✕</span>
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-10 right-10 z-20 bg-slate-900/60 border border-slate-800/50 p-5 rounded-3xl backdrop-blur-md flex flex-col gap-4 shadow-2xl">
        <div className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Architecture Components</div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
            <div key={cat} className="flex items-center gap-3">
              <div className={`w-2.5 h-2.5 rounded-full ${color} shadow-sm`}></div>
              <span className="text-[11px] font-bold text-slate-400 capitalize tracking-tight">{cat}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Canvas Area */}
      <div 
        className="w-full h-full overflow-hidden cursor-grab active:cursor-grabbing select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <div 
          className="w-full h-full transition-transform duration-100 ease-out flex items-center justify-center"
          style={{ 
            transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
            transformOrigin: 'center'
          }}
        >
          {tree.root ? (
            <div className="p-[500px]"> 
              <NodeBox node={tree.root} statuses={nodeStatuses} />
            </div>
          ) : (
            <div className="text-slate-500 italic font-mono tracking-widest animate-pulse text-sm">NO ARCHITECTURE INITIALIZED</div>
          )}
        </div>
      </div>

      {/* Grid Background */}
      <div className="absolute inset-0 z-[-1] opacity-[0.03] pointer-events-none" 
           style={{ 
             backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', 
             backgroundSize: '100px 100px' 
           }}>
      </div>
    </div>
  );
};
