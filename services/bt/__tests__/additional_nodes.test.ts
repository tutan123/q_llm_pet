import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Timeout from '../decorators/Timeout';
import Repeat from '../decorators/Repeat';
import Inverter from '../decorators/Inverter';
import Wait from '../actions/Wait';
import FollowPointerNode from '../actions/FollowPointerNode';
import ExecuteActionSequence from '../actions/ExecuteActionSequence';
import { SUCCESS, FAILURE, RUNNING } from '../constants';
import Tick from '../core/Tick';
import Blackboard from '../core/Blackboard';
import Action from '../core/Action';
import BehaviorTree from '../core/BehaviorTree';

class MockAction extends Action {
  status: any;
  tickCount: number = 0;
  constructor(status: any) {
    super({ name: 'MockAction' });
    this.status = status;
  }
  tick() {
    const currentStatus = Array.isArray(this.status) 
        ? this.status[this.tickCount] 
        : this.status;
    this.tickCount++;
    return currentStatus;
  }
}

import AlwaysSuccess from '../actions/AlwaysSuccess';
import AlwaysFailure from '../actions/AlwaysFailure';
import FailureIsSuccess from '../decorators/FailureIsSuccess';
import SuccessIsFailure from '../decorators/SuccessIsFailure';
import RunningIsFailure from '../decorators/RunningIsFailure';
import RunningIsSuccess from '../decorators/RunningIsSuccess';

describe('Additional BT Nodes', () => {
  const createTick = () => {
    const tick = new Tick();
    tick.blackboard = new Blackboard();
    tick.tree = new BehaviorTree();
    return tick;
  };

  describe('AlwaysSuccess / AlwaysFailure', () => {
    it('AlwaysSuccess should always return SUCCESS', () => {
      const node = new AlwaysSuccess();
      expect(node.tick(createTick())).toBe(SUCCESS);
    });

    it('AlwaysFailure should always return FAILURE', () => {
      const node = new AlwaysFailure();
      expect(node.tick(createTick())).toBe(FAILURE);
    });
  });

  describe('Status Mapping Decorators', () => {
    it('FailureIsSuccess should convert FAILURE to SUCCESS', () => {
      const child = new MockAction(FAILURE);
      const decorator = new FailureIsSuccess({ child });
      expect(decorator.tick(createTick())).toBe(SUCCESS);
    });

    it('SuccessIsFailure should convert SUCCESS to FAILURE', () => {
      const child = new MockAction(SUCCESS);
      const decorator = new SuccessIsFailure({ child });
      expect(decorator.tick(createTick())).toBe(FAILURE);
    });

    it('RunningIsFailure should convert RUNNING to FAILURE', () => {
      const child = new MockAction(RUNNING);
      const decorator = new RunningIsFailure({ child });
      expect(decorator.tick(createTick())).toBe(FAILURE);
    });

    it('RunningIsSuccess should convert RUNNING to SUCCESS', () => {
      const child = new MockAction(RUNNING);
      const decorator = new RunningIsSuccess({ child });
      expect(decorator.tick(createTick())).toBe(SUCCESS);
    });
  });

  describe('Timeout Decorator', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return FAILURE if timeout is exceeded', () => {
      const child = new MockAction(RUNNING);
      const timeout = new Timeout({ child, timeout: 1000 });
      const tick = createTick();
      
      timeout.open(tick);
      expect(timeout.tick(tick)).toBe(RUNNING);
      
      vi.advanceTimersByTime(1001);
      expect(timeout.tick(tick)).toBe(FAILURE);
    });

    it('should return child status if timeout is not exceeded', () => {
      const child = new MockAction(SUCCESS);
      const timeout = new Timeout({ child, timeout: 1000 });
      const tick = createTick();
      
      timeout.open(tick);
      expect(timeout.tick(tick)).toBe(SUCCESS);
    });
  });

  describe('Repeat Decorator', () => {
    it('should repeat the child specified number of times', () => {
      const child = new MockAction(SUCCESS);
      const repeat = new Repeat({ child, count: 3 });
      const tick = createTick();
      
      repeat.open(tick);
      
      // First tick
      expect(repeat.tick(tick)).toBe(RUNNING);
      expect(child.tickCount).toBe(1);
      
      // Second tick
      expect(repeat.tick(tick)).toBe(RUNNING);
      expect(child.tickCount).toBe(2);
      
      // Third tick
      expect(repeat.tick(tick)).toBe(SUCCESS);
      expect(child.tickCount).toBe(3);
      
      // Fourth tick - already finished
      expect(repeat.tick(tick)).toBe(SUCCESS);
      expect(child.tickCount).toBe(3);
    });

    it('should return SUCCESS immediately if count is 0', () => {
      const child = new MockAction(SUCCESS);
      const repeat = new Repeat({ child, count: 0 });
      const tick = createTick();
      
      repeat.open(tick);
      expect(repeat.tick(tick)).toBe(SUCCESS);
      expect(child.tickCount).toBe(0);
    });
  });

  describe('Wait Action', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return RUNNING until time elapsed', () => {
      const wait = new Wait({ milliseconds: 1000 });
      const tick = createTick();
      
      wait.open(tick);
      expect(wait.tick(tick)).toBe(RUNNING);
      
      vi.advanceTimersByTime(500);
      expect(wait.tick(tick)).toBe(RUNNING);
      
      vi.advanceTimersByTime(500);
      expect(wait.tick(tick)).toBe(SUCCESS);
    });
  });

  describe('Inverter Decorator', () => {
    it('should invert SUCCESS to FAILURE', () => {
      const child = new MockAction(SUCCESS);
      const inverter = new Inverter({ child });
      const tick = createTick();
      
      expect(inverter.tick(tick)).toBe(FAILURE);
    });

    it('should invert FAILURE to SUCCESS', () => {
      const child = new MockAction(FAILURE);
      const inverter = new Inverter({ child });
      const tick = createTick();
      
      expect(inverter.tick(tick)).toBe(SUCCESS);
    });

    it('should return RUNNING if child is RUNNING', () => {
      const child = new MockAction(RUNNING);
      const inverter = new Inverter({ child });
      const tick = createTick();
      
      expect(inverter.tick(tick)).toBe(RUNNING);
    });
  });

  describe('FollowPointerNode', () => {
    it('should update position when dragging', () => {
      const node = new FollowPointerNode();
      const tick = createTick();
      tick.blackboard.set('isDragging', true);
      tick.blackboard.set('pointerPosition', { x: 5, y: 5, z: 0 });
      
      expect(node.tick(tick)).toBe(RUNNING);
      expect(tick.blackboard.get('bt_output_position')).toEqual([5, 5, 0]);
    });

    it('should return SUCCESS when not dragging', () => {
      const node = new FollowPointerNode();
      const tick = createTick();
      tick.blackboard.set('isDragging', false);
      
      expect(node.tick(tick)).toBe(SUCCESS);
    });
  });

  describe('ExecuteActionSequence', () => {
    it('should execute actions in sequence', () => {
      const node = new ExecuteActionSequence();
      const tick = createTick();
      tick.blackboard.set('pendingActions', ['WAVE', 'JUMP'], tick.tree.id);
      
      vi.useFakeTimers();
      
      // First tick: start WAVE
      expect(node.tick(tick)).toBe(RUNNING);
      expect(tick.blackboard.get('bt_output_action')).toBe('WAVE');
      
      // Advance time beyond WAVE duration (assume 3s)
      vi.advanceTimersByTime(3100);
      
      // Another tick to pick up the NEXT action
      expect(node.tick(tick)).toBe(RUNNING);
      
      // Second tick: start JUMP
      expect(node.tick(tick)).toBe(RUNNING);
      expect(tick.blackboard.get('bt_output_action')).toBe('JUMP');
      
      // Advance time beyond JUMP duration
      vi.advanceTimersByTime(3100);
      
      // Another tick to pick up the next index
      expect(node.tick(tick)).toBe(RUNNING);
      
      // Third tick: all finished
      expect(node.tick(tick)).toBe(SUCCESS);
      expect(tick.blackboard.get('pendingActions', tick.tree.id)).toEqual([]);
      
      vi.useRealTimers();
    });

    it('should return FAILURE if no actions', () => {
      const node = new ExecuteActionSequence();
      const tick = createTick();
      expect(node.tick(tick)).toBe(FAILURE);
    });
  });
});

