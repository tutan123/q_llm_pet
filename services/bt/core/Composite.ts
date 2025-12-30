import BaseNode, { NodeOptions } from './BaseNode';
import { COMPOSITE } from '../constants';
import Tick from './Tick';

export interface CompositeOptions extends NodeOptions {
  children?: BaseNode[];
}

/**
 * Composite is the base class for all composite nodes.
 **/
export default class Composite extends BaseNode {
  public children: BaseNode[];

  constructor({ children = [], name = 'Composite', title, properties }: CompositeOptions = {}) {
    super({
      category: COMPOSITE,
      name,
      title,
      properties,
    });
    this.children = children.slice(0);
  }

  public _closeRecursive(tick: Tick): void {
    for (const child of this.children) {
      child._closeRecursive(tick);
    }
    super._closeRecursive(tick);
  }
}

