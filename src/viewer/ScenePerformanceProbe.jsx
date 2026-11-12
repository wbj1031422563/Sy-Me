import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";

export default function ScenePerformanceProbe({ onUpdate }) {
  const { gl } = useThree();
  const sampleRef = useRef({ elapsed: 0, frames: 0 });

  useEffect(() => {
    const previousAutoReset = gl.info.autoReset;
    gl.info.autoReset = false;
    return () => {
      gl.info.autoReset = previousAutoReset;
    };
  }, [gl]);

  useFrame((state) => {
    const sample = sampleRef.current;
    sample.frames += 1;
    const elapsed = state.clock.getElapsedTime();
    if (sample.elapsed === 0) sample.elapsed = elapsed;
    if (elapsed - sample.elapsed < 0.5) return;

    const duration = elapsed - sample.elapsed;
    onUpdate?.({
      fps: Math.round(sample.frames / duration),
      calls: Math.round(gl.info.render.calls / sample.frames),
      triangles: Math.round(gl.info.render.triangles / sample.frames),
      geometries: gl.info.memory.geometries,
      textures: gl.info.memory.textures,
    });
    gl.info.reset();
    sample.elapsed = elapsed;
    sample.frames = 0;
  });

  return null;
}
