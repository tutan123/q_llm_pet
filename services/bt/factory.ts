import * as Composites from './composites';
import * as Actions from './actions';
import * as Decorators from './decorators';
import * as Conditions from './conditions';
import BaseNode from './core/BaseNode';

/**
 * NodeFactory manages the mapping between node names and their classes.
 */
export class NodeFactory {
  private static registry: Record<string, any> = {};

  static {
    // 自动注册所有核心节点
    this.registerNodes(Composites);
    this.registerNodes(Actions);
    this.registerNodes(Decorators);
    this.registerNodes(Conditions);
  }

  private static registerNodes(nodeModule: any) {
    for (const name in nodeModule) {
      const nodeClass = nodeModule[name];
      if (typeof nodeClass === 'function') {
        // 使用类名或类的 name 属性作为 key
        this.registry[name] = nodeClass;
        // 兼容 default export 的情况
        if (nodeClass.name && nodeClass.name !== 'default') {
          this.registry[nodeClass.name] = nodeClass;
        }
      }
    }
  }

  /**
   * Create a node instance from a definition object.
   */
  static createNode(definition: any): BaseNode {
    const { name, properties = {}, children = [], child = null } = definition;
    const NodeClass = this.registry[name];

    if (!NodeClass) {
      throw new Error(`NodeFactory: Unknown node type "${name}". Make sure it is registered.`);
    }

    // 构造选项
    const options: any = { ...properties, ...definition };
    
    // 处理子节点（递归创建）
    if (children && children.length > 0) {
      options.children = children.map((c: any) => this.createNode(c));
    } else if (child) {
      options.child = this.createNode(child);
    }

    return new NodeClass(options);
  }

  /**
   * Manually register a custom node.
   */
  static register(name: string, nodeClass: any) {
    this.registry[name] = nodeClass;
  }
}
