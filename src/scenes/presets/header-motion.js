// text_model001.glb 的节点局部坐标。拨禾轮轴心取六根弹齿管中心的均值。
export const WORKSPACE_HEADER_MOTION = [
  {
    id: "reel",
    label: "拨禾轮转速",
    directionLabel: "拨禾轮旋转方向",
    node: "中轴管旋转z",
    kind: "rotation",
    axis: [0, 1, 0],
    pivot: [-319.6232, 0.8832, 56.3099],
    direction: 1,
    rate: 24,
    maxRate: 60,
    step: 1,
  },
  {
    id: "knife",
    label: "动刀频率",
    node: "01动刀",
    kind: "reciprocation",
    axis: [0, 1, 0],
    // 节点单位下的峰峰行程；该 GLB 根节点缩放为 0.01，展示行程约 76 mm。
    stroke: 7.6,
    rate: 2,
    maxRate: 10,
    step: 0.25,
  },
];

export const WORKSPACE_KNIFE_SHOT = {
  id: "header-knife",
  label: "动刀近景",
  position: [-1.7, 0.65, 0.75],
  target: [-0.08, 0.11, 0],
  durationMs: 1200,
};
