import { useEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import { BlendFunction, Effect } from "postprocessing";
import * as THREE from "three";

const FRAGMENT_SHADER = /* glsl */ `
uniform vec3 rgbGain;
uniform vec3 rgbLift;
uniform vec3 rgbGamma;

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec3 color = max(inputColor.rgb + rgbLift, vec3(0.0));
  color = pow(color, max(rgbGamma, vec3(0.01)));
  color *= rgbGain;
  outputColor = vec4(clamp(color, 0.0, 1.0), inputColor.a);
}
`;

class RgbColorGradeEffect extends Effect {
  constructor() {
    super("RgbColorGradeEffect", FRAGMENT_SHADER, {
      blendFunction: BlendFunction.NORMAL,
      uniforms: new Map([
        ["rgbGain", new THREE.Uniform(new THREE.Vector3(1, 1, 1))],
        ["rgbLift", new THREE.Uniform(new THREE.Vector3(0, 0, 0))],
        ["rgbGamma", new THREE.Uniform(new THREE.Vector3(1, 1, 1))],
      ]),
    });
  }
}

function vectorFromValue(value, fallback) {
  const source = Array.isArray(value) ? value : fallback;
  return new THREE.Vector3(...source.map((item) => Number(item) || 0));
}

export default function RgbColorGrade({ gain, lift, gamma }) {
  const invalidate = useThree((state) => state.invalidate);
  const effect = useMemo(() => new RgbColorGradeEffect(), []);

  useEffect(() => {
    effect.uniforms.get("rgbGain").value.copy(vectorFromValue(gain, [1, 1, 1]));
    effect.uniforms.get("rgbLift").value.copy(vectorFromValue(lift, [0, 0, 0]));
    effect.uniforms.get("rgbGamma").value.copy(vectorFromValue(gamma, [1, 1, 1]));
    effect.setChanged();
    invalidate();
  }, [effect, gain, gamma, invalidate, lift]);

  return <primitive object={effect} dispose={null} />;
}

