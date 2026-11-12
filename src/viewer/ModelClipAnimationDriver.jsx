import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { describeAnimationClips } from "./animation-clips.js";

function getClipId(clip, index) {
  return `clip-${index}-${clip.name || "animation"}`;
}

export default function ModelClipAnimationDriver({ root, animations = [], preview }) {
  const mixerRef = useRef(null);
  const actionsRef = useRef(new Map());
  const clipEntries = useMemo(() => describeAnimationClips(animations), [animations]);
  const selectedId = preview?.clipId || clipEntries[0]?.id;

  useEffect(() => {
    if (!animations.length) return undefined;

    const mixer = new THREE.AnimationMixer(root);
    const actions = new Map();
    animations.forEach((clip, index) => {
      const action = mixer.clipAction(clip);
      action.loop = THREE.LoopRepeat;
      action.clampWhenFinished = false;
      actions.set(getClipId(clip, index), action);
    });
    mixerRef.current = mixer;
    actionsRef.current = actions;

    return () => {
      mixer.stopAllAction();
      mixer.uncacheRoot(root);
      mixerRef.current = null;
      actionsRef.current = new Map();
    };
  }, [animations, root]);

  useEffect(() => {
    const selectedAction = actionsRef.current.get(selectedId);
    actionsRef.current.forEach((action) => {
      if (action !== selectedAction) action.stop();
    });
    if (!selectedAction) return;

    selectedAction.reset();
    selectedAction.play();
    selectedAction.paused = !preview?.clipPlaying;
  }, [animations, preview?.clipId, preview?.clipPlaying, preview?.resetVersion, selectedId]);

  useEffect(() => {
    const selectedAction = actionsRef.current.get(selectedId);
    if (selectedAction) selectedAction.paused = !preview?.clipPlaying;
    if (mixerRef.current) mixerRef.current.timeScale = preview?.clipRate ?? 1;
  }, [animations, preview?.clipPlaying, preview?.clipRate, selectedId]);

  useFrame((_, delta) => {
    if (preview?.clipPlaying) mixerRef.current?.update(delta);
  });

  return null;
}
