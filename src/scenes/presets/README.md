# 收获机视觉预设

入口是 `harvester-preset.js` 中的 `createHarvesterScene`。

项目已预留页面：`/viewer/harvester`。模型文件不存在时会显示接入提示，
不会破坏其他页面。

## 使用方式

```jsx
import SceneViewer from "@/viewer/SceneViewer.jsx";
import {
  createHarvesterScene,
  createHarvesterThemeScene,
} from "@/scenes/presets/harvester-preset.js";

const baseScene = createHarvesterScene({
  modelUrl: "/model/我的收获机.glb",
  modelLabel: "雷沃智能收获机",
  modelScale: 1,
  modelPosition: [0, 0, 0],
});
const scene = createHarvesterThemeScene(baseScene, "field");

export default function Page() {
  return <SceneViewer scene={scene} />;
}
```

## Blender / GLB 资产建议

- 车身漆面材质命名为 `VAR_paint`，这样颜色变体只影响车漆，不会覆盖轮胎、玻璃和金属件。
- 玻璃、轮胎、割台、驾驶室等材质使用独立材质，避免全部合并成一个材质。
- 模型原点建议放在整机底部中心，Y 轴朝上。
- 应用 Draco 压缩，贴图优先使用 1K/2K，法线贴图保持切线空间。
- 如果模型整体偏大或偏小，优先调整 `modelScale` 和镜头 shots，不要直接修改模型文件。

## 动画节点命名

如果希望直接接入预设的基础动画，可以在 GLB 中增加以下节点：

```text
ANIM_WHEEL_front_left
ANIM_WHEEL_front_right
ANIM_WHEEL_rear_left
ANIM_WHEEL_rear_right
ANIM_HEADER_main
ANIM_CONVEYOR_main
ANIM_UNLOAD
```

运行时点击“行驶”“收割”“卸粮”后，会分别驱动车轮、割台/输送机构和卸粮筒。
没有这些节点时，面板和运行时状态仍然可用，只是不执行对应的模型动画。

工作区割台也支持不改 GLB 的绑定方式：参考 `header-motion.js`，给模型配置
`motionTracks`，通过 `node` 精确匹配加载后的节点名。`axis` 和 `pivot` 使用
该节点的局部坐标；`direction` 用 `1` 或 `-1` 指定沿轴正向或反向。
旋转的 `rate` 单位为转/分，往复的 `rate` 单位为完整周期/秒，
`stroke` 是节点局部单位下的峰峰行程。展示时由 `SceneViewer` 的
`motionPreview`（模型 ID、播放状态、可选速度与转向、复位序号）驱动。

## 运行时命令

```js
runtime.dispatch({
  type: "machine/command",
  payload: { command: "harvest" },
});

runtime.dispatch({
  type: "machine/telemetry",
  payload: {
    values: { speed: 4.5, grainFill: 62 },
  },
});
```

## 视觉参数

预设默认包含：

- Venice Sunset HDR 环境光
- 暖色主光、冷色补光、暖色轮廓光
- 金属地面与网格
- Contact Shadows
- ACES Filmic 色调映射
- Bloom、Vignette、轻微 Noise
- 主视觉、正前、侧视、俯视四组镜头
- 默认使用「原始材质」，保留模型自带的颜色、贴图和材质；也可切换为收获金、田野绿、石墨灰或象牙白

可选主题：

```text
studio      高级展厅
field       白天田间
night       夜间灯光
technical   技术演示
```

模型原点、底部高度或尺寸不同的时候，通常只需要调这三个参数：

```js
createHarvesterScene({
  modelScale: 0.8,
  modelPosition: [0, 0.35, 0],
  modelRotation: [0, Math.PI, 0],
});
```

