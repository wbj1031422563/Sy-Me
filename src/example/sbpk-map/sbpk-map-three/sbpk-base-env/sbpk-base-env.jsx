/*
 * @Author: FMC
 * @Date: 2024-06-23 09:58:48
 * @LastEditors: FMC
 * @LastEditTime: 2024-08-25 11:01:15
 * @FilePath: \fmc-personal-blog\src\example\sbpk-map\sbpk-map-three\sbpk-base-env\sbpk-base-env.jsx
 * @Description:基础环境
 */
import { OrbitControls } from "@react-three/drei";
import { Perf } from "r3f-perf";
import { useFrame } from "@react-three/fiber";
import TWEEN from "@tweenjs/tween.js";
import * as THREE from "three";
import { useEffect, useRef } from "react";
function SbpkBaseEnv() {
  const controls = useRef(null);
  useFrame((state) => {
    const { camera } = state;
    TWEEN.update();
    // console.log("camera", camera);
    // const { target, matrix } = camera;
    // console.log("target", controls.current.target);
    // console.log("matrix", matrix);
  });
  useEffect(() => {
    controls.current.target.set(0.84, 0.31, -0.65);
    controls.current.update();
  }, []);
  return (
    <>
      <Perf position="top-left"/>
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
            <OrbitControls
        ref={controls}
        makeDefault={true}
      />
    </>
  );
}

export default SbpkBaseEnv;
