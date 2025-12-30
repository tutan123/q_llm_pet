import BaseNode, { NodeOptions } from './BaseNode';
import { CONDITION } from '../constants';

/**
 * Condition is the base class for all condition nodes.
 **/
export default class Condition extends BaseNode {
  constructor({ name = 'Condition', title, properties }: NodeOptions = {}) {
    super({
      category: CONDITION,
      name,
      title,
      properties,
    });
  }
}

