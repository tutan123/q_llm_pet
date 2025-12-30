/**
 * The Blackboard is the memory structure required by `BehaviorTree` and its
 * nodes.
 **/
export default class Blackboard {
  private _baseMemory: any;
  private _treeMemory: any;

  constructor() {
    this._baseMemory = {};
    this._treeMemory = {};
  }

  private _getTreeMemory(treeScope: string): any {
    if (!this._treeMemory[treeScope]) {
      this._treeMemory[treeScope] = {
        'nodeMemory': {},
        'openNodes': [],
        'traversalDepth': 0,
        'traversalCycle': 0,
      };
    }
    return this._treeMemory[treeScope];
  }

  private _getNodeMemory(treeMemory: any, nodeScope: string): any {
    const memory = treeMemory.nodeMemory;
    if (!memory[nodeScope]) {
      memory[nodeScope] = {};
    }
    return memory[nodeScope];
  }

  private _getMemory(treeScope?: string, nodeScope?: string): any {
    let memory = this._baseMemory;

    if (treeScope) {
      memory = this._getTreeMemory(treeScope);

      if (nodeScope) {
        memory = this._getNodeMemory(memory, nodeScope);
      }
    }

    return memory;
  }

  public set(key: string, value: any, treeScope?: string, nodeScope?: string): void {
    const memory = this._getMemory(treeScope, nodeScope);
    memory[key] = value;
  }

  public get(key: string, treeScope?: string, nodeScope?: string): any {
    const memory = this._getMemory(treeScope, nodeScope);
    return memory[key];
  }
}

