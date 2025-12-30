import { createUUID } from '../b3.functions';
import Tick from './Tick';
import BaseNode from './BaseNode';
import Blackboard from './Blackboard';

/**
 * The BehaviorTree class represents the Behavior Tree structure.
 **/
export default class BehaviorTree {
  public id: string;
  public title: string;
  public description: string;
  public properties: any;
  public root: BaseNode | null;
  public debug: any;

  constructor() {
    this.id = createUUID();
    this.title = 'The behavior tree';
    this.description = 'Default description';
    this.properties = {};
    this.root = null;
    this.debug = null;
  }

  /**
   * Propagates the tick signal through the tree, starting from the root.
   **/
  public tick(target: any, blackboard: Blackboard): number {
    if (!blackboard) {
      throw new Error('The blackboard parameter is obligatory and must be an instance of Blackboard');
    }

    if (!this.root) {
      throw new Error('The tree does not have a root node');
    }

    /* CREATE A TICK OBJECT */
    const tick = new Tick();
    tick.debug = this.debug;
    tick.target = target;
    tick.blackboard = blackboard;
    tick.tree = this;

    /* TICK NODE */
    const state = this.root._execute(tick);

    /* CLOSE NODES FROM LAST TICK, IF NEEDED */
    const lastOpenNodes: BaseNode[] = blackboard.get('openNodes', this.id) || [];
    const currOpenNodes = tick._openNodes.slice(0);

    // does not close if it is still open in this tick
    let start = 0;
    for (let i = 0; i < Math.min(lastOpenNodes.length, currOpenNodes.length); i++) {
      start = i + 1;
      if (lastOpenNodes[i] !== currOpenNodes[i]) {
        break;
      }
    }

    // close the nodes
    for (let i = lastOpenNodes.length - 1; i >= start; i--) {
      (lastOpenNodes[i] as any)._close(tick);
    }

    /* POPULATE BLACKBOARD */
    blackboard.set('openNodes', currOpenNodes, this.id);
    blackboard.set('nodeCount', tick._nodeCount, this.id);

    return state;
  }
}

