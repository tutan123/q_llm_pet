import BehaviorTree from './BehaviorTree';
import Blackboard from './Blackboard';
import BaseNode from './BaseNode';

/**
 * A new Tick object is instantiated every tick by BehaviorTree.
 **/
export default class Tick {
  public tree: BehaviorTree | null = null;
  public debug: any = null;
  public target: any = null;
  public blackboard: Blackboard | null = null;
  public _openNodes: BaseNode[] = [];
  public _nodeCount: number = 0;
  public _nodeStatuses: Map<string, number> = new Map();
  public _nodeDurations: Map<string, number> = new Map();

  constructor() {}

  public _enterNode(node: BaseNode): void {
    this._nodeCount++;
    this._openNodes.push(node);
  }

  public _openNode(node: BaseNode): void {}

  public _tickNode(node: BaseNode): void {}

  public _closeNode(node: BaseNode): void {
    this._openNodes.pop();
  }

  public _exitNode(node: BaseNode): void {}

  public _recordStatus(node: BaseNode, status: number): void {
    this._nodeStatuses.set(node.id, status);
  }
}

