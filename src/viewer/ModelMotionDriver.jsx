import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { advanceMotionTracks, bindMotionTracks, resetMotionTracks } from "./model-motion.js";

export default function ModelMotionDriver({ root, definitions, preview }) {
  const tracksRef = useRef([]);
  const resetVersion = preview?.resetVersion;

  useEffect(() => {
    const tracks = bindMotionTracks(root, definitions);
    tracksRef.current = tracks;
    return () => {
      resetMotionTracks(tracks);
      tracksRef.current = [];
    };
  }, [root, definitions]);

  useEffect(() => {
    resetMotionTracks(tracksRef.current);
  }, [resetVersion]);

  useFrame((_, delta) => {
    if (preview?.playing) {
      advanceMotionTracks(tracksRef.current, delta, preview.rates, preview.directions);
    }
  });

  return null;
}
