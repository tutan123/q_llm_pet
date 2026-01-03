import Blackboard from './core/Blackboard';

/**
 * Profiler provides helpers to analyze Behavior Tree execution performance.
 */
export class BTProfiler {
  /**
   * Get execution duration of a specific node in milliseconds.
   */
  static getNodeDuration(blackboard: Blackboard, treeId: string, nodeId: string): number {
    const durations = blackboard.get('nodeDurations', treeId) || {};
    return durations[nodeId] || 0;
  }

  /**
   * Get all node durations for a tree tick.
   */
  static getAllDurations(blackboard: Blackboard, treeId: string): Record<string, number> {
    return blackboard.get('nodeDurations', treeId) || {};
  }

  /**
   * Summarize performance metrics for a tree tick.
   */
  static getTickSummary(blackboard: Blackboard, treeId: string): any {
    const durations = this.getAllDurations(blackboard, treeId);
    const nodeIds = Object.keys(durations);
    
    if (nodeIds.length === 0) return null;

    let totalTime = 0;
    let maxTime = 0;
    let slowestNodeId = '';

    for (const id of nodeIds) {
      const d = durations[id];
      totalTime += d;
      if (d > maxTime) {
        maxTime = d;
        slowestNodeId = id;
      }
    }

    return {
      nodeCount: nodeIds.length,
      totalExecutionTime: totalTime,
      averageTimePerNode: totalTime / nodeIds.length,
      slowestNode: {
        id: slowestNodeId,
        duration: maxTime
      }
    };
  }
}


