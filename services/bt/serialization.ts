import BehaviorTree from './core/BehaviorTree';
import BaseNode from './core/BaseNode';
import { NodeFactory } from './factory';

/**
 * Serialize a behavior tree or a node to a plain object.
 */
export function serialize(treeOrNode: BehaviorTree | BaseNode): any {
  if (treeOrNode instanceof BehaviorTree) {
    return {
      title: treeOrNode.title,
      description: treeOrNode.description,
      root: treeOrNode.root ? serialize(treeOrNode.root) : null
    };
  }

  const node = treeOrNode as any;
  const definition: any = {
    id: node.id,
    name: node.name,
    title: node.title,
    category: node.category,
    properties: node.properties || {}
  };

  // 递归处理子节点
  if (node.children && node.children.length > 0) {
    definition.children = node.children.map((child: BaseNode) => serialize(child));
  } else if (node.child) {
    definition.child = serialize(node.child);
  }

  return definition;
}

/**
 * Deserialize a plain object into a BehaviorTree instance.
 */
export function deserialize(data: any): BehaviorTree {
  const tree = new BehaviorTree();
  tree.title = data.title || 'Untitled Tree';
  tree.description = data.description || '';

  if (data.root) {
    tree.root = NodeFactory.createNode(data.root);
  }

  return tree;
}

