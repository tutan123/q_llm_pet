import * as Nodes from './index';
import BehaviorTree from './core/BehaviorTree';
import BaseNode from './core/BaseNode';

/**
 * NodeFactory is responsible for creating node instances from JSON data.
 */
export class NodeFactory {
  private nodes: Map<string, any> = new Map();

  constructor() {
    // Register all known nodes
    Object.keys(Nodes).forEach(key => {
      const nodeClass = (Nodes as any)[key];
      if (nodeClass && nodeClass.prototype instanceof Nodes.BaseNode) {
        // Use the node's name property if available, otherwise the class name
        const name = nodeClass.prototype.name || key;
        this.nodes.set(name, nodeClass);
      }
    });
    
    // Explicitly register common names if they differ
    this.nodes.set('Sequence', Nodes.Sequence);
    this.nodes.set('Priority', Nodes.Priority);
    this.nodes.set('MemSequence', Nodes.MemSequence);
    this.nodes.set('ReactiveSequence', Nodes.ReactiveSequence);
    this.nodes.set('Parallel', Nodes.Parallel);
    this.nodes.set('Retry', Nodes.Retry);
    this.nodes.set('Inverter', Nodes.Inverter);
    this.nodes.set('Timeout', Nodes.Timeout);
    this.nodes.set('Wait', Nodes.Wait);
  }

  public createNode(name: string, options: any): BaseNode {
    const NodeClass = this.nodes.get(name);
    if (!NodeClass) {
      throw new Error(`Unknown node type: ${name}`);
    }
    return new NodeClass(options);
  }
}

/**
 * TreeSerializer handles serialization and deserialization of Behavior Trees.
 */
export class TreeSerializer {
  private factory: NodeFactory;

  constructor(factory: NodeFactory = new NodeFactory()) {
    this.factory = factory;
  }

  /**
   * Serializes a tree to a JSON object.
   */
  public serialize(tree: BehaviorTree): any {
    const nodes: any = {};
    const queue: BaseNode[] = [];

    if (tree.root) {
      queue.push(tree.root);
    }

    while (queue.length > 0) {
      const node = queue.shift()!;
      if (nodes[node.id]) continue;

      nodes[node.id] = node.toJSON();

      if (node instanceof Nodes.Composite) {
        queue.push(...node.children);
      } else if (node instanceof Nodes.Decorator) {
        if (node.child) {
          queue.push(node.child);
        }
      }
    }

    return {
      id: tree.id,
      title: tree.title,
      description: tree.description,
      root: tree.root ? tree.root.id : null,
      nodes,
      properties: tree.properties,
    };
  }

  /**
   * Deserializes a tree from a JSON object.
   */
  public deserialize(data: any): BehaviorTree {
    const tree = new BehaviorTree();
    tree.id = data.id || tree.id;
    tree.title = data.title || tree.title;
    tree.description = data.description || tree.description;
    tree.properties = data.properties || tree.properties;

    const nodeDataMap = data.nodes || {};
    const instantiatedNodes: Map<string, BaseNode> = new Map();

    // First pass: create all node instances (without linking children)
    Object.keys(nodeDataMap).forEach(id => {
      const nodeData = nodeDataMap[id];
      const node = this.factory.createNode(nodeData.name, {
        title: nodeData.title,
        description: nodeData.description,
        properties: nodeData.properties,
      });
      node.id = id;
      instantiatedNodes.set(id, node);
    });

    // Second pass: link children
    Object.keys(nodeDataMap).forEach(id => {
      const nodeData = nodeDataMap[id];
      const node = instantiatedNodes.get(id);

      if (node instanceof Nodes.Composite) {
        node.children = (nodeData.children || []).map((childId: string) => {
          const child = instantiatedNodes.get(childId);
          if (!child) throw new Error(`Node ${id} references non-existent child ${childId}`);
          return child;
        });
      } else if (node instanceof Nodes.Decorator) {
        if (nodeData.child) {
          const child = instantiatedNodes.get(nodeData.child);
          if (!child) throw new Error(`Node ${id} references non-existent child ${nodeData.child}`);
          node.child = child;
        }
      }
    });

    if (data.root) {
      tree.root = instantiatedNodes.get(data.root) || null;
    }

    return tree;
  }
}

