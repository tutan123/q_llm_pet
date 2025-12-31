import React, { useMemo } from 'react';
import { BehaviorTree, Blackboard, SUCCESS, FAILURE, RUNNING } from '../services/bt';

interface BTVisualizerProps {
  tree: BehaviorTree;
  blackboard: Blackboard;
}

const STATUS_COLORS: Record<number, string> = {
  [SUCCESS]: 'text-green-400',
  [FAILURE]: 'text-red-400',
  [RUNNING]: 'text-blue-400 animate-pulse',
};

const STATUS_NAMES: Record<number, string> = {
  [SUCCESS]: 'SUCCESS',
  [FAILURE]: 'FAILURE',
  [RUNNING]: 'RUNNING',
  [4]: 'ERROR',
};

const NodeItem = ({ node, statuses, level = 0 }: { node: any, statuses: any, level?: number }) => {
  const status = statuses[node.id];
  const colorClass = status !== undefined ? STATUS_COLORS[status] || 'text-slate-500' : 'text-slate-500';
  const statusName = status !== undefined ? STATUS_NAMES[status] || '' : '';

  return (
    <div className="flex flex-col">
      <div 
        className={`flex items-center gap-2 py-1 px-2 rounded hover:bg-slate-800/50 transition-colors ${status === RUNNING ? 'bg-blue-900/20' : ''}`}
        style={{ marginLeft: `${level * 16}px` }}
      >
        <span className="text-xs font-mono opacity-50">[{node.category[0].toUpperCase()}]</span>
        <span className={`text-sm font-medium ${status !== undefined ? 'text-white' : 'text-slate-400'}`}>
          {node.title || node.name}
          {node.title && node.title !== node.name && (
            <span className="ml-2 text-[10px] opacity-30 font-normal">({node.name})</span>
          )}
        </span>
        {statusName && (
          <span className={`text-[10px] font-bold ml-auto ${colorClass}`}>
            {statusName}
          </span>
        )}
      </div>
      
      {node.children && node.children.map((child: any) => (
        <NodeItem key={child.id} node={child} statuses={statuses} level={level + 1} />
      ))}
      {node.child && (
        <NodeItem node={node.child} statuses={statuses} level={level + 1} />
      )}
    </div>
  );
};

export const BTVisualizer: React.FC<BTVisualizerProps> = ({ tree, blackboard }) => {
  const nodeStatuses = blackboard.get('nodeStatuses', tree.id) || {};

  return (
    <div className="bg-slate-900/50 backdrop-blur rounded-lg border border-slate-700 p-4 overflow-hidden flex flex-col h-full">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-700">
        <h3 className="text-amber-400 font-bold text-sm uppercase tracking-wider">Behavior Tree Live</h3>
        <div className="flex gap-2">
           <div className="flex items-center gap-1">
             <div className="w-2 h-2 bg-green-500 rounded-full"></div>
             <span className="text-[10px] opacity-60">S</span>
           </div>
           <div className="flex items-center gap-1">
             <div className="w-2 h-2 bg-red-500 rounded-full"></div>
             <span className="text-[10px] opacity-60">F</span>
           </div>
           <div className="flex items-center gap-1">
             <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
             <span className="text-[10px] opacity-60">R</span>
           </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {tree.root ? (
          <NodeItem node={tree.root} statuses={nodeStatuses} />
        ) : (
          <div className="text-slate-500 text-xs text-center py-10 italic">No root node assigned</div>
        )}
      </div>
    </div>
  );
};

