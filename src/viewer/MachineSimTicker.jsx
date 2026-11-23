import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";

/**
 * 作业演示遥测推进：在 Canvas 内按帧派发 machine/tick。
 */
export default function MachineSimTicker({ enabled, runtime }) {
  const runtimeRef = useRef(runtime);
  const enabledRef = useRef(enabled);

  useEffect(() => {
    runtimeRef.current = runtime;
  }, [runtime]);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  useFrame((_, delta) => {
    if (!enabledRef.current || !runtimeRef.current) return;
    const state = runtimeRef.current.getState?.()?.machine?.state;
    if (!state || state === "idle" || state === "maintenance") return;
    runtimeRef.current.dispatch({
      type: "machine/tick",
      payload: { delta },
    });
  });

  return null;
}
