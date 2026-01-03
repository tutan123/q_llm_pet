import { createUUID } from '../b3.functions';
import Tick from './Tick';
import BaseNode from './BaseNode';
import Blackboard from './Blackboard';
import Composite from './Composite';
import Decorator from './Decorator';

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
    blackboard.set('nodeStatuses', Object.fromEntries(tick._nodeStatuses), this.id);
    blackboard.set('nodeDurations', Object.fromEntries(tick._nodeDurations), this.id);

    return state;
  }

  /**
   * Serializes the behavior tree to a JSON object.
   */
  public toJSON(): any {
    const nodes: any = {};
    const queue: BaseNode[] = [];

    if (this.root) {
      queue.push(this.root);
    }

    while (queue.length > 0) {
      const node = queue.shift()!;
      if (nodes[node.id]) continue;

      nodes[node.id] = node.toJSON();

      if (node instanceof Composite) {
        queue.push(...node.children);
      } else if (node instanceof Decorator) {
        if (node.child) {
          queue.push(node.child);
        }
      }
    }

    return {
      id: this.id,
      title: this.title,
      description: this.description,
      root: this.root ? this.root.id : null,
      nodes,
      properties: this.properties,
    };
  }
}

