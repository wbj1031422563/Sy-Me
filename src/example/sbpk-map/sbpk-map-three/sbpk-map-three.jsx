/*
 * @Author: FMC
 * @Date: 2024-07-15 21:16:27
 * @LastEditors: FMC
 * @LastEditTime: 2024-08-19 22:06:38
 * @FilePath: \fmc-personal-blog\src\example\sbpk-map\sbpk-map-three\sbpk-map-three.jsx
 * @Description:
 *
 */
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import "../sbpk-map-three/sbpk-map-three.less";
import SbpkBaseEnv from "./sbpk-base-env/sbpk-base-env";
import SbpkEarth from "./sbpk-earth/sbpk-earth";
import { SCENE_TYPE } from "./enum/scene-type.enum.js";
import { Suspense, useState } from "react";
import SbpkChina from "./sbpk-china/sbpk-china";
import { Loader } from "@react-three/drei";
import SbpkEfftects from "../sbpk-efftects/efftects";
import * as THREE from "three";
import SbpkModelDfmz from "./sbpk-model/sbpk-model-dfmz";

function SbpkMapThree() {
  const created = ({ camera, gl }) => {
    // const matArray = [
    //   0.995743117655141, -1.3877787807814457e-17, -0.09217181587893337, 0,
    //   -0.07799210219999107, 0.5329289656077314, -0.8425579799697465, 0,
    //   0.04912103049454623, 0.8461599834642817, 0.5306603497029718, 0,
    //   1.0825201668723623, 4.334812559077067, 1.8610050459002698, 1,
    // ];
    // const mat = new THREE.Matrix4();
    // mat.set(...matArray);
    // mat.transpose();
    // camera.applyMatrix4(mat);
    camera.position.set(1.09,3.79,1.54);
    camera.lookAt(0.84, 0.31, -0.65);
    camera.updateProjectionMatrix();
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
