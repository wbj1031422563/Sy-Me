import { useMemo } from "react";
import * as THREE from "three";

/**
 * 展厅幕墙 / Logo 墙。
 * params: width, height, depth, y, distance, color, logoText,
 *         logoColor, accentColor, center
 */
export default function BackdropExtension({ config }) {
  const params = config?.params || {};
  const width = params.width ?? 18;
  const height = params.height ?? 6.5;
  const depth = params.depth ?? 0.18;
  const y = params.y ?? height / 2;
  const distance = params.distance ?? -14;
  const color = params.color || "#12151a";
  const logoText = params.logoText || "SY·ME";
  const logoColor = params.logoColor || "#f2c26b";
  const accentColor = params.accentColor || logoColor;
  const centerX = params.center?.[0] ?? 2.2;

  const wallMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color,
        metalness: 0.2,
        roughness: 0.72,
      }),
    [color]
  );

  const accentMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: accentColor,
        emissive: accentColor,
        emissiveIntensity: 0.8,
        metalness: 0.35,
        roughness: 0.3,
        toneMapped: false,
      }),
    [accentColor]
  );

  return (
    <group name={config?.id || "showroom-backdrop"} position={[centerX, 0, distance]}>
      <mesh position={[0, y, 0]} material={wallMaterial} receiveShadow>
        <boxGeometry args={[width, height, depth]} />
      </mesh>
      <mesh position={[0, 0.08, depth / 2 + 0.02]} material={accentMaterial}>
        <boxGeometry args={[width * 0.92, 0.06, 0.03]} />
      </mesh>
      <mesh position={[0, height - 0.35, depth / 2 + 0.02]} material={accentMaterial}>
        <boxGeometry args={[width * 0.55, 0.05, 0.03]} />
      </mesh>
      {/* 简易立体字块代替字体贴图，避免额外资源 */}
      <group position={[-width * 0.18, height * 0.55, depth / 2 + 0.06]}>
        {String(logoText).split("").map((char, index) => (
          <mesh
            key={`${char}-${index}`}
            position={[index * 0.72, 0, 0]}
            material={accentMaterial}
          >
            <boxGeometry args={[0.48, 0.72, 0.08]} />
          </mesh>
        ))}
      </group>
      <mesh position={[0, height * 0.32, depth / 2 + 0.05]} material={accentMaterial}>
        <boxGeometry args={[width * 0.28, 0.04, 0.02]} />
      </mesh>
    </group>
  );
}
