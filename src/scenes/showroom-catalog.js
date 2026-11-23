/**
 * 展厅条目注册表 —— 多主体通用展厅的目录层。
 * 收获机走 SceneViewer；精品 Demo 可 deep-link 到既有独立路由。
 */
import {
  createHarvesterAssemblyScene,
} from "./presets/harvester-preset.js";

export const SHOWROOM_CATALOG = [
  {
    id: "harvester",
    title: "收获机展厅",
    subtitle: "产品主视觉 · 分件整机装配 · 镜头巡演",
    category: "农机",
    tags: ["showcase", "harvester", "featured", "assembly"],
    featured: true,
    viewer: "scene",
    route: "/viewer/harvester",
    cover: "/img/banner2.jpg",
    // 页面层会探测 junction 并默认整机装配（含割台）；此处工厂供目录/预览使用
    createScene: () => createHarvesterAssemblyScene({
      mode: "full",
      machineEnabled: false,
    }),
  },
  {
    id: "maxwell-car",
    title: "汽车展厅",
    subtitle: "精品 Demo · 氛围与后期",
    category: "汽车",
    tags: ["demo", "car"],
    featured: false,
    viewer: "legacy",
    route: "/maxwell-car",
    cover: "/img/banner1.jpg",
    createScene: null,
  },
  {
    id: "sbpk-map",
    title: "赛博地图",
    subtitle: "精品 Demo · 城市可视化",
    category: "城市",
    tags: ["demo", "map"],
    featured: false,
    viewer: "legacy",
    route: "/sbpk-map",
    cover: "/img/banner1.jpg",
    createScene: null,
  },
];

export function listShowroomEntries() {
  return SHOWROOM_CATALOG.slice();
}

export function getShowroomEntry(sceneId) {
  return SHOWROOM_CATALOG.find((entry) => entry.id === sceneId) || null;
}

export function getFeaturedShowroomEntry() {
  return SHOWROOM_CATALOG.find((entry) => entry.featured) || SHOWROOM_CATALOG[0] || null;
}
