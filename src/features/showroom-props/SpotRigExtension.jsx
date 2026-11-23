import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";

function SpotFixture({
  position,
  target,
  color,
  intensity,
  angle,
  penumbra,
  distance,
  showFixtures,
  fixtureMaterial,
}) {
  const lightRef = useRef(null);
  const targetRef = useRef(null);

  useLayoutEffect(() => {
    if (lightRef.current && targetRef.current) {
      lightRef.current.target = targetRef.current;
    }
  }, []);

  return (
    <group position={position}>
      <spotLight
        ref={lightRef}
        color={color}
        intensity={intensity}
        angle={angle}
        penumbra={penumbra}
        distance={distance}
        decay={2}
        castShadow={false}
      />
      <object3D ref={targetRef} position={[
        target[0] - position[0],
        target[1] - position[1],
        target[2] - position[2],
      ]} />
      {showFixtures && (
        <mesh material={fixtureMaterial} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.12, 0.22, 0.35, 12]} />
        </mesh>
      )}
    </group>
  );
}

/**
 * 顶光灯位扩展：环绕聚光，可选灯具几何体。
 * params: count, radius, height, intensity, color, angle, penumbra,
 *         center, showFixtures, targetY
 */
export default function SpotRigExtension({ config }) {
  const params = config?.params || {};
  const count = Math.max(0, Math.min(16, Math.round(params.count ?? 4)));
  const radius = params.radius ?? 9;
  const height = params.height ?? 7.5;
  const intensity = params.intensity ?? 18;
  const color = params.color || "#fff4df";
  const angle = params.angle ?? 0.42;
  const penumbra = params.penumbra ?? 0.55;
  const centerX = params.center?.[0] ?? 2.2;
  const centerZ = params.center?.[2] ?? -0.3;
  const targetY = params.targetY ?? 1.6;
  const showFixtures = params.showFixtures !== false;
  const target = useMemo(() => [centerX, targetY, centerZ], [centerX, centerZ, targetY]);

  const fixtures = useMemo(() => {
    if (count <= 0) return [];
    return Array.from({ length: count }, (_, index) => {
      const anglePos = (index / count) * Math.PI * 2 + Math.PI / count;
      return {
        id: `${config?.id || "spot-rig"}-${index}`,
        position: [
          centerX + Math.cos(anglePos) * radius,
          height,
          centerZ + Math.sin(anglePos) * radius,
        ],
      };
    });
  }, [centerX, centerZ, config?.id, count, height, radius]);

  const fixtureMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#2a3038",
        metalness: 0.7,
        roughness: 0.35,
        emissive: color,
        emissiveIntensity: 0.35,
      }),
    [color]
  );

  if (!fixtures.length) return null;

  return (
    <group name={config?.id || "spot-rig"}>
      {fixtures.map((fixture) => (
        <SpotFixture
          key={fixture.id}
          position={fixture.position}
          target={target}
          color={color}
          intensity={intensity}
          angle={angle}
          penumbra={penumbra}
          distance={radius * 3.2}
          showFixtures={showFixtures}
          fixtureMaterial={fixtureMaterial}
        />
      ))}
    </group>
  );
}
