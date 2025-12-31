import { describe, it, expect } from 'vitest';
import { 
  BehaviorTree, 
  Sequence, 
  Priority, 
  Wait,
  SUCCESS
} from '../index';
import { TreeSerializer } from '../factory';

describe('Behavior Tree Serialization', () => {
  it('Should serialize and deserialize a simple tree', () => {
    const tree = new BehaviorTree();
    tree.title = 'Test Tree';
    
    const root = new Priority({
      children: [
        new Sequence({
          children: [
            new Wait({ milliseconds: 500 }),
          ]
        }),
        new Wait({ milliseconds: 1000 })
      ]
    });
    tree.root = root;

    const serializer = new TreeSerializer();
    const json = serializer.serialize(tree);

    expect(json.title).toBe('Test Tree');
    expect(json.root).toBe(root.id);
    expect(Object.keys(json.nodes).length).toBe(4); // Priority, Sequence, Wait x2

    const newTree = serializer.deserialize(json);
    expect(newTree.title).toBe('Test Tree');
    expect(newTree.root).toBeDefined();
    expect(newTree.root instanceof Priority).toBe(true);
    
    const children = (newTree.root as Priority).children;
    expect(children.length).toBe(2);
    expect(children[0] instanceof Sequence).toBe(true);
    expect(children[1] instanceof Wait).toBe(true);
    expect((children[1] as Wait).milliseconds).toBe(1000);
  });
});

