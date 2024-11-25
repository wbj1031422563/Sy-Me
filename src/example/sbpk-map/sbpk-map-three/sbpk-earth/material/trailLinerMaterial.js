import { useTexture } from "@react-three/drei";
import CustomShaderMaterial from "three-custom-shader-material/vanilla";
import * as THREE from "three";
import linnerFS from "../shader/liner/liner.fs.glsl";


export default class TrailLinerMaterial extends CustomShaderMaterial {
    constructor(trailRatio, trailLength) {
      super({
        /**
         * 虚线材质
         */
        baseMaterial: THREE.LineDashedMaterial,
        uniforms: {
          actionRatio: { value: trailRatio },
          lineLength: { value: trailLength },
          lineColor: { value: new THREE.Color(0x0b49ad) },
        },
        linewidth: 1,
        scale: 1,
        dashSize: 3,
        gapSize: 1,
        // fragmentShader: linnerFS,
        transparent: true,
        onBeforeCompile: (shader) => {
          // shader.uniforms.actionRatio = trailRatio;
          // shader.uniforms.lineLength = trailLength;
          shader.fragmentShader = linnerFS;
          // console.log("shader", shader.fragmentShader);
        },
      });
      // console.log("material执行");
    }
  }