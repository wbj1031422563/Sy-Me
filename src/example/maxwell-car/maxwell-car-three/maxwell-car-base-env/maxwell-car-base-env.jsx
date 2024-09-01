/*
 * @Author: FMC
 * @Date: 2024-06-23 09:58:48
 * @LastEditors: FMC
 * @LastEditTime: 2024-08-29 21:24:01
 * @FilePath: \fmc-personal-blog\src\example\maxwell-car\maxwell-car-three\maxwell-car-base-env\sbpk-base-env.jsx
 * @Description:基础环境
 */
import { Environment, OrbitControls } from "@react-three/drei";
import { Perf } from "r3f-perf";
import { useFrame, useThree } from "@react-three/fiber";
import TWEEN from "@tweenjs/tween.js";
import * as THREE from "three";
import { useRef } from "react";
function MaxWellCarBaeEnv() {
  const controls = useRef(null);
  return (
    <>
      {/* <Perf position="top-left"/> */}
      {/* <OrbitControls
        ref={controls}
        makeDefault={true}
        maxZoom={5.0}
        enablePan={false}
        maxDistance={10}
        minDistance={1.0}
        minAzimuthAngle={-Math.PI * 0.5}
        maxAzimuthAngle={Math.PI * 0.5}
        minPolarAngle={-Math.PI * 0.5}
        maxPolarAngle={Math.PI * 0.5}
      /> */}
      <OrbitControls ref={controls} makeDefault={true} />
      <Environment  files="/envMap/venice_sunset_1k.hdr">

      </Environment>
    </>
  );
}

export default MaxWellCarBaeEnv;
