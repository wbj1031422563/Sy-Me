/*
 * @Author: FMC
 * @Date: 2024-07-15 21:16:27
 * @LastEditors: FMC
 * @LastEditTime: 2024-08-12 22:01:39
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
  // const created = ({ camera, gl }) => {
  //   camera.position.set(4, 0, 15.5);
  //   camera.lookAt(4, 0, 0);
  //   camera.updateProjectionMatrix();
  // };
  const [scene, setScene] = useState(SCENE_TYPE.CHINA);
  // useFrame(()=>{
  //   TWEEN.update();
  // })
  console.log("scene", scene);
  return (
    <div className="sbpk-map-three">
      <Canvas
        flat
        dpr={[1, 2]}
        gl={{ 
          // 采用线性颜色空间，避免后处理的色差问题（颜色偏浅）
          outputEncoding: THREE.LinearSRGBColorSpace 
        }}
        // onCreated={created}
        camera={{
          fov: 45,
          near: 0.1,
          far: 200,
          position: [0, 5, 15.5],
        }}
      >
        <Suspense fallback={null}>
          <color args={["#031D34"]} attach={"background"} />
          {/* <color args={["#cccccc"]} attach={"background"} /> */}
          <SbpkBaseEnv />
          <SbpkEfftects/>
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
        <axesHelper />
      </Canvas>
      <Loader />
    </div>
  );
}
export default SbpkMapThree;
