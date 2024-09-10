import * as THREE from "three";
import CustomShaderMaterial from "three-custom-shader-material/vanilla";
import fs from "./shader/loadingMaterial.fs.glsl";
import vs from "./shader/loadingMaterial.vs.glsl";
export default class LoadingMaterial extends CustomShaderMaterial {
  constructor() {
    super({
      baseMaterial: THREE.MeshBasicMaterial,
      transparent: true,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uColor: { value: new THREE.Color("#4a884f") },
      },
      // depthWrite: false,
      vertexShader: vs,
      fragmentShader: fs,
    });
  }
}

