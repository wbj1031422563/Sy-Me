import { useMemo } from "react";
import { Line } from "@react-three/drei";

/**
 * 装配接触边界可视化：显示实测 AABB（已含抬升）与贴地参考线。
 */
export default function AssemblyBoundsOverlay({
  enabled = false,
  result = null,
  color = "#78e1ae",
  contactColor = "#f2c26b",
}) {
  const edges = useMemo(() => {
    if (!enabled || !result?.bounds || !result.ready) return null;
    const liftY = Number(result.liftY) || 0;
    const [minX, minY, minZ] = result.bounds.min;
    const [maxX, maxY, maxZ] = result.bounds.max;
    const y0 = minY + liftY;
    const y1 = maxY + liftY;
    const x0 = minX;
    const x1 = maxX;
    const z0 = minZ;
    const z1 = maxZ;

    const boxPoints = [
      [x0, y0, z0], [x1, y0, z0],
      [x1, y0, z0], [x1, y0, z1],
      [x1, y0, z1], [x0, y0, z1],
      [x0, y0, z1], [x0, y0, z0],
      [x0, y1, z0], [x1, y1, z0],
      [x1, y1, z0], [x1, y1, z1],
      [x1, y1, z1], [x0, y1, z1],
      [x0, y1, z1], [x0, y1, z0],
      [x0, y0, z0], [x0, y1, z0],
      [x1, y0, z0], [x1, y1, z0],
      [x1, y0, z1], [x1, y1, z1],
      [x0, y0, z1], [x0, y1, z1],
    ];

    const contactY = Number(result.groundY) || 0;
    const pad = 0.35;
    const contactPoints = [
      [x0 - pad, contactY + 0.01, z0 - pad],
      [x1 + pad, contactY + 0.01, z0 - pad],
      [x1 + pad, contactY + 0.01, z1 + pad],
      [x0 - pad, contactY + 0.01, z1 + pad],
      [x0 - pad, contactY + 0.01, z0 - pad],
    ];

    return { boxPoints, contactPoints };
  }, [enabled, result]);

  if (!edges) return null;

  return (
    <group name="assembly-bounds-overlay">
      <Line
        points={edges.boxPoints}
        segments
        color={color}
        lineWidth={1.2}
        transparent
        opacity={0.85}
        depthTest={false}
      />
      <Line
        points={edges.contactPoints}
        color={contactColor}
        lineWidth={1.6}
        transparent
        opacity={0.9}
        depthTest={false}
      />
      <mesh position={[0, (Number(result.groundY) || 0) + 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.18, 24]} />
        <meshBasicMaterial color={contactColor} transparent opacity={0.85} depthTest={false} />
      </mesh>
    </group>
  );
}
