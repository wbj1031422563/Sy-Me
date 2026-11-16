# Scene Runtime

这里是通用场景运行时的第一层基础设施。

## 场景 Schema

当前场景文档协议为 `sy-me.scene` v2。标准文档同时包含：

```json
{
  "version": 2,
  "schemaVersion": 2,
  "schema": { "id": "sy-me.scene", "version": 2 }
}
```

`normalizeScene` 会先调用 `migrateSceneDocument`，把 v1 场景中的单模型、模型对象表，
以及旧的 `parent` / `groupId` 关系迁移为 v2 的 `models[]`、`parentId` 和 `assemblyId`。
高于当前版本的场景会主动拒绝，避免新字段被旧工作台静默丢弃。

新增场景字段时，先在 `scene-schema.js` 增加迁移，再在 `scene-normalize.js` 增加运行时默认值；
导出统一使用 `serializeScene`，保证保存到文件和方案库的文档已经升级到当前版本。

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

`SceneViewer` 会复用同一个运行时实例。外部场景描述发生变化时，通过
`runtime.syncScene(nextScene)` 同步模型显隐、镜头和材质变体，保留已体检的模型信息、
热点和运行时交互状态，避免普通场景编辑触发整个运行时重建。

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

