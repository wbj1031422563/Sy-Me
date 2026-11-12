import { Sparkles } from "@react-three/drei";

/**
 * 轻量级粒子层：只使用点精灵，不创建逐粒子 React 节点。
 * 通过 scene.particles 配置即可在 JSON 中保存和复用。
 */
export default function SceneParticles({ config }) {
  if (!config?.enabled || (config.count ?? 0) <= 0) return null;
  return (
    <Sparkles
      count={config.count ?? 90}
      position={config.position || [0, 1.5, 0]}
      scale={config.scale || [18, 5, 12]}
      size={config.size ?? 1.1}
      speed={config.speed ?? 0.18}
      opacity={config.opacity ?? 0.28}
      color={config.color || "#d8ba7a"}
      noise={config.noise ?? 1}
    />
  );
}

