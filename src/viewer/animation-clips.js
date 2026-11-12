function getClipId(clip, index) {
  return `clip-${index}-${clip.name || "animation"}`;
}

export function describeAnimationClips(animations = []) {
  return animations.map((clip, index) => ({
    id: getClipId(clip, index),
    label: clip.name || `动画片段 ${index + 1}`,
    duration: Number.isFinite(clip.duration) ? clip.duration : null,
  }));
}
