/*
 * @Author: FMC
 * @Date: 2024-07-15 21:16:27
 * @LastEditors: FMC
 * @LastEditTime: 2024-08-28 15:42:40
 * @FilePath: \fmc-personal-blog\src\example\sbpk-map\sbpk-map-three\sbpk-map-three.jsx
 * @Description:
 *
 */
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import "../sbpk-map-three/sbpk-map-three.less";
import SbpkBaseEnv from "./sbpk-base-env/sbpk-base-env";
import SbpkEarth from "./sbpk-earth/sbpk-earth";
import { SCENE_TYPE } from "./enum/scene-type.enum.js";
import { Suspense, useEffect, useState } from "react";
import SbpkChina from "./sbpk-china/sbpk-china";
import { Loader } from "@react-three/drei";
import SbpkEfftects from "../sbpk-efftects/efftects";
import * as THREE from "three";
import SbpkModelDfmz from "./sbpk-model/sbpk-model-dfmz";

function SbpkMapThree() {
  const created = ({ camera, gl }) => {
    // camera.position.set(1.09,3.79,1.54);
    // camera.lookAt(0.84, 0.31, -0.65);
    // camera.updateProjectionMatrix();
  };
  const [scene, setScene] = useState(SCENE_TYPE.CHINA);
  return (
    <div className="sbpk-map-three">
      <Canvas
        flat
        dpr={[1, 2]}
        // gl={{
        //   // 采用线性颜色空间，避免后处理的色差问题（颜色偏浅）
        //   outputEncoding: THREE.LinearSRGBColorSpace
        // }}
        onCreated={created}
      >
        <Suspense fallback={null}>
          <color args={["#031D34"]} attach={"background"} />
          {/* <color args={["#cccccc"]} attach={"background"} /> */}
          <SbpkBaseEnv />
          {/* <SbpkEfftects/> */}
          {scene == SCENE_TYPE.EARTH && (
            <SbpkEarth
              handelChangeScene={(type) => {
                setScene(type);
              }}
            />
          )}
          {scene == SCENE_TYPE.CHINA && <SbpkChina />}
          {/* <SbpkModelDfmz/> */}
        </Suspense>
        {/* <axesHelper /> */}
      </Canvas>
      <Loader />
    </div>
  );
}
export default SbpkMapThree;
