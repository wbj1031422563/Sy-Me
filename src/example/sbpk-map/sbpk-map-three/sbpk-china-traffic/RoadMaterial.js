/*
 * @Author: FMC
 * @Date: 2024-08-21 20:17:22
 * @LastEditors: FMC
 * @LastEditTime: 2024-08-21 21:29:05
 * @FilePath: \fmc-personal-blog\src\example\sbpk-map\sbpk-map-three\sbpk-china-traffic\RoadMaterial.js
 * @Description: 
 */
import { useTexture } from "@react-three/drei";
import CustomShaderMaterial from "three-custom-shader-material/vanilla";
import * as THREE from "three";
import vs from "./shader/sbpk-china-traffic.vs.glsl";
import fs from "./shader/sbpk-china-traffic.fs.glsl";
  
  export default class RoadMaterial extends CustomShaderMaterial {
    constructor() {
      super({
        baseMaterial: THREE.MeshBasicMaterial,
        color: "blue",
        uniforms: {
        //   ...uniforms,
        //   tex: { value: texture },
        //   baseColor: { value: new THREE.Color(0x0ad7e6) },
        //   impactPositionList: {
        //     value: impacts.map((item) => item.impactPosition),
        //   },
        //   impactMaxRadiusList: {
        //     value: impacts.map((item) => item.impactMaxRadius),
        //   },
        //   impactRatioList: { value: impacts.map((item) => item.impactRatio) },
        //   mapTexture: { value: texture },
        //   numCoords:{value:5384},
        //   test3: { value: [0.5] },
          uTime:{value:0},
          // uSize:{value:2},
        },
        depthWrite: false, // 禁用深度写入
        vertexShader: vs,
        fragmentShader: fs,
        transparent: true
      });
    }
  }
  // extend({ EarthMaterial });