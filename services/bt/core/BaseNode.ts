import { createUUID } from '../b3.functions';
import { RUNNING } from '../constants';
import Tick from './Tick';

export interface NodeOptions {
  category?: string;
  name?: string;
  title?: string;
  description?: string;
  properties?: any;
}

/**
 * The BaseNode class is used as super class to all nodes in BehaviorJS.
 **/
export default class BaseNode {
  public id: string;
  public category: string;
  public name: string;
  public title: string;
  public description: string;
  public properties: any;
  public parameters: any;

  constructor({ category, name, title, description, properties }: NodeOptions = {}) {
    this.id = createUUID();
    this.category = category || '';
    this.name = name || '';
    this.title = title || this.name;
    this.description = description || '';
    this.properties = properties || {};
    this.parameters = {};
  }

  /**
   * This is the main method to propagate the tick signal to this node.
   **/
  public _execute(tick: Tick): number {
    // ENTER
    this._enter(tick);

    // OPEN
    if (!tick.blackboard.get('isOpen', tick.tree.id, this.id)) {
      this._open(tick);
    }

    // TICK
    const status = this._tick(tick);

    // CLOSE
    if (status !== RUNNING) {
      this._close(tick);
    }

    // EXIT
    this._exit(tick);

    return status;
  }

  protected _enter(tick: Tick): void {
    tick._enterNode(this);
    this.enter(tick);
  }

  protected _open(tick: Tick): void {
    tick._openNode(this);
    tick.blackboard.set('isOpen', true, tick.tree.id, this.id);
    this.open(tick);
  }

  protected _tick(tick: Tick): number {
    tick._tickNode(this);
    return this.tick(tick);
  }

  protected _close(tick: Tick): void {
    tick._closeNode(this);
    tick.blackboard.set('isOpen', false, tick.tree.id, this.id);
    this.close(tick);
  }

  protected _exit(tick: Tick): void {
    tick._exitNode(this);
    this.exit(tick);
  }

  public enter(tick: Tick): void {}
  public open(tick: Tick): void {}
  public tick(tick: Tick): number {
    return RUNNING;
  }
  public close(tick: Tick): void {}
  public exit(tick: Tick): void {}
}

