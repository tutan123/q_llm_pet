import BaseNode, { NodeOptions } from './BaseNode';
import { ACTION } from '../constants';

/**
 * Action is the base class for all action nodes.
 **/
export default class Action extends BaseNode {
  constructor({ name = 'Action', title, properties }: NodeOptions = {}) {
    super({
      category: ACTION,
      name,
      title,
      properties,
    });
  }
}

