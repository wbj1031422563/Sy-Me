import { Quaternion, Vector3 } from "three";

const CYCLE = Math.PI * 2;

export function bindMotionTracks(root, definitions = []) {
  return definitions.flatMap((definition) => {
    const node = root.getObjectByName(definition.node);
    if (!node || !definition.axis || !["rotation", "reciprocation"].includes(definition.kind)) return [];
    const axis = new Vector3(...definition.axis);
    if (!Number.isFinite(axis.lengthSq()) || axis.lengthSq() === 0) return [];
    axis.normalize();
    const position = node.position.clone();
    const orientation = node.quaternion.clone();
    const pivot = new Vector3(...(definition.pivot || [0, 0, 0])).multiply(node.scale);
    return [{
      definition, node, axis, position, orientation, pivot,
      center: pivot.clone().applyQuaternion(orientation).add(position),
      slide: axis.clone().multiply(node.scale).applyQuaternion(orientation),
      rotation: new Quaternion(),
      phase: 0,
    }];
  });
}

export function advanceMotionTracks(tracks, delta, rates = {}, directions = {}) {
  const dt = Math.max(0, Math.min(delta, 0.1));
  for (const track of tracks) {
    const { definition, node, axis, position, orientation, pivot, center, slide, rotation } = track;
    const rate = rates[definition.id] ?? definition.rate;
    if (!Number.isFinite(rate) || rate <= 0) continue;
    const rotating = definition.kind === "rotation";
    const cycles = rotating ? rate / 60 : rate;
    const direction = rotating && (directions[definition.id] ?? definition.direction) === -1 ? -1 : 1;
    // 转向只改变后续角速度，保持切换瞬间的姿态。
    track.phase = (track.phase + dt * cycles * CYCLE * direction) % CYCLE;
    if (rotating) {
      rotation.setFromAxisAngle(axis, track.phase);
      node.quaternion.copy(orientation).multiply(rotation);
      // 绕几何轴心旋转，即便导出节点的原点不在轴上。
      node.position.copy(pivot).applyQuaternion(node.quaternion).negate().add(center);
    } else {
      const offset = Math.sin(track.phase) * (definition.stroke ?? 0) / 2;
      node.position.copy(position).addScaledVector(slide, offset);
    }
  }
}

export function resetMotionTracks(tracks) {
  for (const track of tracks) {
    track.node.position.copy(track.position);
    track.node.quaternion.copy(track.orientation);
    track.phase = 0;
  }
}
