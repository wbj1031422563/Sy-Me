import { useCallback, useRef, useState } from "react";

const HISTORY_LIMIT = 30;

function resolveInitialScene(initialScene) {
  return typeof initialScene === "function" ? initialScene() : initialScene;
}

export default function useSceneHistory(initialScene) {
  const [scene, setScene] = useState(() => resolveInitialScene(initialScene));
  const sceneRef = useRef(scene);
  const historyRef = useRef({ past: [], future: [] });
  const [, setHistoryVersion] = useState(0);

  const commitScene = useCallback((update) => {
    const previous = sceneRef.current;
    const next = typeof update === "function" ? update(previous) : update;
    if (!next || next === previous) return false;

    historyRef.current = {
      past: [...historyRef.current.past, previous].slice(-HISTORY_LIMIT),
      future: [],
    };
    sceneRef.current = next;
    setScene(next);
    setHistoryVersion((value) => value + 1);
    return true;
  }, []);

  const replaceScene = useCallback((next) => {
    if (!next || next === sceneRef.current) return false;

    sceneRef.current = next;
    historyRef.current = { past: [], future: [] };
    setScene(next);
    setHistoryVersion((value) => value + 1);
    return true;
  }, []);

  const undo = useCallback(() => {
    const { past, future } = historyRef.current;
    const previous = past[past.length - 1];
    if (!previous) return false;

    historyRef.current = {
      past: past.slice(0, -1),
      future: [sceneRef.current, ...future].slice(0, HISTORY_LIMIT),
    };
    sceneRef.current = previous;
    setScene(previous);
    setHistoryVersion((value) => value + 1);
    return true;
  }, []);

  const redo = useCallback(() => {
    const { past, future } = historyRef.current;
    const next = future[0];
    if (!next) return false;

    historyRef.current = {
      past: [...past, sceneRef.current].slice(-HISTORY_LIMIT),
      future: future.slice(1),
    };
    sceneRef.current = next;
    setScene(next);
    setHistoryVersion((value) => value + 1);
    return true;
  }, []);

  return {
    scene,
    sceneRef,
    commitScene,
    replaceScene,
    undo,
    redo,
    canUndo: historyRef.current.past.length > 0,
    canRedo: historyRef.current.future.length > 0,
  };
}
