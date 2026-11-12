# Scene Runtime

这里是通用场景运行时的第一层基础设施。

## 场景扩展

扩展组件在业务模块中注册：

```jsx
import { sceneRegistry } from "@/core/scene";

function RadarExtension({ config, runtime }) {
  // config.params 是场景 JSON 中的可配置参数
  // runtime.dispatch(...) 可以触发统一场景命令
  return null;
}

sceneRegistry.registerNode("radar", RadarExtension);
```

场景中通过 `extensions` 启用：

```json
{
  "extensions": [
    {
      "id": "radar-01",
      "type": "radar",
      "kind": "node",
      "params": {
        "radius": 3,
        "speed": 1.5,
        "color": "#00eaff"
      }
    }
  ]
}
```

`kind` 为 `effect` 时，扩展会进入同一个 Canvas 的后处理/效果层。

## 运行时控制

`SceneViewer` 支持通过 `onRuntimeReady` 暴露运行时：

```jsx
<SceneViewer
  scene={scene}
  onRuntimeReady={(runtime) => {
    runtime.dispatch({
      type: "shot/set",
      payload: { id: "front" },
    });
  }}
/>
```

目前内置命令包括：

- `model/inspected`
- `model/toggle-visibility`
- `shot/set`
- `hotspot/set-active`
- `autoplay/set`
- `variant/set`
- `parameter/set`

## 收获机状态与动画

当场景包含 `machine.enabled: true` 时，SceneViewer 会自动显示机器状态面板，并启用基础动画适配器。

支持的命令：

- `machine/command`：`stop`、`drive`、`harvest`、`unload`
- `machine/state`
- `machine/select-part`
- `machine/telemetry`
- `machine/animation`

动画适配器通过模型节点名工作，不要求模型组件重写：

```text
ANIM_WHEEL_*
ANIM_HEADER_*
ANIM_CONVEYOR_*
ANIM_UNLOAD
```

