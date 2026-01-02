import { describe, it, expect } from 'vitest';
import BehaviorTree from '../core/BehaviorTree';
import { Sequence, Priority } from '../composites';
import { Wait, AlwaysSuccess } from '../actions';
import { Inverter } from '../decorators';
import { serialize, deserialize } from '../serialization';

describe('BT Serialization', () => {
  it('应该能正确序列化和反序列化一个复杂的行为树', () => {
    // 1. 手动创建一个树
    const originalTree = new BehaviorTree();
    originalTree.title = 'Test Tree';
    originalTree.root = new Priority({
      title: 'Root Selector',
      children: [
        new Sequence({
          title: 'Seq 1',
          children: [
            new Inverter({
              child: new AlwaysSuccess({ title: 'Success Node' })
            }),
            new Wait({ milliseconds: 2000 })
          ]
        }),
        new AlwaysSuccess({ title: 'Fallback' })
      ]
    });

    // 2. 序列化
    const json = serialize(originalTree);
    
    // 检查 JSON 结构
    expect(json.title).toBe('Test Tree');
    expect(json.root.name).toBe('Priority');
    expect(json.root.children.length).toBe(2);
    expect(json.root.children[0].name).toBe('Sequence');
    expect(json.root.children[0].children[0].name).toBe('Inverter');
    expect(json.root.children[0].children[0].child.name).toBe('AlwaysSuccess');

    // 3. 反序列化
    const restoredTree = deserialize(json);

    // 4. 验证还原后的对象
    expect(restoredTree.title).toBe('Test Tree');
    expect(restoredTree.root).toBeInstanceOf(Priority);
    expect((restoredTree.root as any).children.length).toBe(2);
    expect((restoredTree.root as any).children[0]).toBeInstanceOf(Sequence);
    expect((restoredTree.root as any).children[0].children[0]).toBeInstanceOf(Inverter);
    expect((restoredTree.root as any).children[0].children[0].child).toBeInstanceOf(AlwaysSuccess);
    expect((restoredTree.root as any).children[0].children[1].properties.milliseconds).toBe(2000);
  });

  it('应该能从纯 JSON 字符串创建树', () => {
    const rawJson = {
      title: "Json Brain",
      root: {
        name: "Sequence",
        children: [
          { name: "AlwaysSuccess", title: "Action 1" },
          { name: "Wait", properties: { milliseconds: 500 } }
        ]
      }
    };

    const tree = deserialize(rawJson);
    expect(tree.title).toBe("Json Brain");
    expect(tree.root.name).toBe("Sequence");
    expect((tree.root as any).children[1].properties.milliseconds).toBe(500);
  });
});
