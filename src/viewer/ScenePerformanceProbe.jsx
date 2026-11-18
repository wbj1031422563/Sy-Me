import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";

export default function ScenePerformanceProbe({ onUpdate }) {
  const { gl } = useThree();
  const sampleRef = useRef({
    elapsed: 0,
    frames: 0,
    lastCalls: 0,
    lastTriangles: 0,
    callsPeak: 0,
    trianglesPeak: 0,
    geometriesPeak: 0,
    texturesPeak: 0,
  });

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
    const renderCalls = gl.info.render.calls;
    const renderTriangles = gl.info.render.triangles;
    const frameCalls = Math.max(0, renderCalls - sample.lastCalls);
    const frameTriangles = Math.max(0, renderTriangles - sample.lastTriangles);
    sample.callsPeak = Math.max(sample.callsPeak, frameCalls);
    sample.trianglesPeak = Math.max(sample.trianglesPeak, frameTriangles);
    sample.geometriesPeak = Math.max(sample.geometriesPeak, gl.info.memory.geometries);
    sample.texturesPeak = Math.max(sample.texturesPeak, gl.info.memory.textures);
    sample.lastCalls = renderCalls;
    sample.lastTriangles = renderTriangles;
    const elapsed = state.clock.getElapsedTime();
    if (sample.elapsed === 0) sample.elapsed = elapsed;
    if (elapsed - sample.elapsed < 1) return;

    const duration = elapsed - sample.elapsed;
    onUpdate?.({
      fps: Math.round(sample.frames / duration),
      calls: Math.round(gl.info.render.calls / sample.frames),
      triangles: Math.round(gl.info.render.triangles / sample.frames),
      geometries: gl.info.memory.geometries,
      textures: gl.info.memory.textures,
      callsPeak: sample.callsPeak,
      trianglesPeak: sample.trianglesPeak,
      geometriesPeak: sample.geometriesPeak,
      texturesPeak: sample.texturesPeak,
      sampleFrames: sample.frames,
      sampleDurationMs: Math.round(duration * 1000),
    });
    gl.info.reset();
    sample.elapsed = elapsed;
    sample.frames = 0;
    sample.lastCalls = 0;
    sample.lastTriangles = 0;
    sample.callsPeak = 0;
    sample.trianglesPeak = 0;
    sample.geometriesPeak = 0;
    sample.texturesPeak = 0;
  });

  return null;
}
