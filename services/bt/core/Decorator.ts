import BaseNode, { NodeOptions } from './BaseNode';
import { DECORATOR } from '../constants';

export interface DecoratorOptions extends NodeOptions {
  child?: BaseNode | null;
}

/**
 * Decorator is the base class for all decorator nodes.
 **/
export default class Decorator extends BaseNode {
  public child: BaseNode | null;

  constructor({ child = null, name = 'Decorator', title, properties }: DecoratorOptions = {}) {
    super({
      category: DECORATOR,
      name,
      title,
      properties,
    });
    this.child = child;
  }
}

