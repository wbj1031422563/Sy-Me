/*
 * @Author: FMC
 * @Date: 2024-07-15 21:16:27
 * @LastEditors: FMC
 * @LastEditTime: 2024-08-04 19:06:37
 * @FilePath: \fmc-personal-blog\src\example\sbpk-map\sbpk-map-three\sbpk-map-three.jsx
 * @Description:
 *
 */
import { Canvas, useThree } from "@react-three/fiber";
import "../sbpk-map-three/sbpk-map-three.less";
import SbpkBaseEnv from "./sbpk-base-env/sbpk-base-env";
import SbpkEarth from "./sbpk-earth/sbpk-earth";
import { SCENE_TYPE } from "./enum/scene-type.enum.js";
import { Suspense, useState } from "react";
import SbpkChina from "./sbpk-china/sbpk-china";
import { Loader } from "@react-three/drei";
import SbpkEfftects from "../sbpk-efftects/efftects";
function SbpkMapThree() {
  // const created = ({ camera, gl }) => {
  //   camera.position.set(4, 0, 15.5);
  //   camera.lookAt(4, 0, 0);
  //   camera.updateProjectionMatrix();
  // };
  const [scene, setScene] = useState(SCENE_TYPE.CHINA);
  console.log("scene", scene);
  return (
    <div className="sbpk-map-three">
      <Canvas
        flat
        dpr={[1, 2]}
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
        </Suspense>
        <axesHelper />
      </Canvas>
      <Loader />
    </div>
  );
}
export default SbpkMapThree;
