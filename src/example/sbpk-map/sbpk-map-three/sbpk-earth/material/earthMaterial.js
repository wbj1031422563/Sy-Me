import { useTexture } from "@react-three/drei";
import CustomShaderMaterial from "three-custom-shader-material/vanilla";
import * as THREE from "three";
import vs from "../shader/vs.glsl";
import fs from "../shader/fs.glsl";

const params = {
    colors: {
      base: "red",
      gradInner: "#8ae66e",
      gradOuter: "#03c03c",
      lineColor: 0xff0000,
    },
  };
  const uniforms = {
    // impacts: { value: impacts },
    // 陆地色块大小
    maxSize: { value: 0.04 },
    // 海洋色块大小
    minSize: { value: 0.025 },
    // 冲击波高度
    waveHeight: { value: 0.1 },
    // 冲击波范围
    scaling: { value: 1 },
    // 冲击波径向渐变内侧颜色
    gradInner: { value: new THREE.Color(params.colors.gradInner) },
    // 冲击波径向渐变外侧颜色
    gradOuter: { value: new THREE.Color(params.colors.gradOuter) },
  };
  const texture = new THREE.TextureLoader().load("/img/earth.jpg");
  
  export default class EarthMaterial extends CustomShaderMaterial {
    constructor(impacts) {
      super({
        baseMaterial: THREE.MeshBasicMaterial,
        color: "blue",
        uniforms: {
          ...uniforms,
          tex: { value: texture },
          baseColor: { value: new THREE.Color(0x0ad7e6) },
          impactPositionList: {
            value: impacts.map((item) => item.impactPosition),
          },
          impactMaxRadiusList: {
            value: impacts.map((item) => item.impactMaxRadius),
          },
          impactRatioList: { value: impacts.map((item) => item.impactRatio) },
          mapTexture: { value: texture },
          numCoords:{value:5384},
          test3: { value: [0.5] },
        },
        vertexShader: vs,
        fragmentShader: fs,
      });
    }
  }
  // extend({ EarthMaterial });