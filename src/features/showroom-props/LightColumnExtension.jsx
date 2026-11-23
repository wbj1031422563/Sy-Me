import { useMemo } from "react";
import * as THREE from "three";

/**
 * 环绕灯柱扩展。
 * params: count, radius, height, columnRadius, color, emissiveIntensity,
 *         y, center[x,y,z], glow
 */
export default function LightColumnExtension({ config }) {
  const params = config?.params || {};
  const count = Math.max(0, Math.min(24, Math.round(params.count ?? 8)));
  const radius = params.radius ?? 12;
  const height = params.height ?? 5.5;
  const columnRadius = params.columnRadius ?? 0.12;
  const color = params.color || "#ffd36a";
  const emissiveIntensity = params.emissiveIntensity ?? 2.4;
  const y = params.y ?? 0;
  const centerX = params.center?.[0] ?? 0;
  const centerZ = params.center?.[2] ?? 0;
  const glow = params.glow !== false;

  const columns = useMemo(() => {
    if (count <= 0) return [];
    return Array.from({ length: count }, (_, index) => {
      const angle = (index / count) * Math.PI * 2;
      return {
        id: `${config?.id || "light-column"}-${index}`,
        position: [
          centerX + Math.cos(angle) * radius,
          y + height / 2,
          centerZ + Math.sin(angle) * radius,
        ],
      };
    });
  }, [centerX, centerZ, config?.id, count, height, radius, y]);

  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity,
        metalness: 0.35,
        roughness: 0.28,
        toneMapped: false,
      }),
    [color, emissiveIntensity]
  );

  const glowMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.18,
        depthWrite: false,
      }),
    [color]
  );

  if (!columns.length) return null;

  return (
    <group name={config?.id || "light-columns"}>
      {columns.map((column) => (
        <group key={column.id} position={column.position}>
          <mesh material={material} castShadow={false}>
            <cylinderGeometry args={[columnRadius, columnRadius * 1.15, height, 16]} />
          </mesh>
          {glow && (
            <mesh material={glowMaterial}>
              <cylinderGeometry args={[columnRadius * 2.4, columnRadius * 2.8, height * 0.92, 16]} />
            </mesh>
          )}
          <pointLight
            color={color}
            intensity={emissiveIntensity * 0.55}
            distance={radius * 0.85}
            decay={2}
            position={[0, height * 0.28, 0]}
          />
        </group>
      ))}
    </group>
  );
}
