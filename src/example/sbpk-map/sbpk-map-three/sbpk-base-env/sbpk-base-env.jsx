/*
 * @Author: FMC
 * @Date: 2024-06-23 09:58:48
 * @LastEditors: FMC
 * @LastEditTime: 2024-08-28 15:43:11
 * @FilePath: \fmc-personal-blog\src\example\sbpk-map\sbpk-map-three\sbpk-base-env\sbpk-base-env.jsx
 * @Description:基础环境
 */
import { OrbitControls } from "@react-three/drei";
import { Perf } from "r3f-perf";
import { useFrame, useThree } from "@react-three/fiber";
import TWEEN from "@tweenjs/tween.js";
import * as THREE from "three";
import { useContext, useEffect, useRef } from "react";
import {AreaContext} from '../../context/sbpk-area-context.js'
const clock = new THREE.Clock();
function SbpkBaseEnv() {
  const area=useContext(AreaContext);
  const controls = useRef(null);
  const state = useThree();
  useFrame((state) => {
    const { camera } = state;
    TWEEN.update();
    // console.log('stsjhakj',clock.getDelta())
    // console.log("camera", camera);
    // const { target, matrix } = camera;
    // console.log("target", controls.current.target);
    // console.log("matrix", matrix);
  });

  useEffect(() => {
    controls.current.target.set(0.84, 0.31, -0.65);
    controls.current.update();
  }, []);
  useEffect(() => {
    const { camera } = state;
    switch (area) {
      case "全国地区":
        camera.position.set(1.09, 3.79, 1.54);
        controls.current.target = new THREE.Vector3(0.84, 0.31, -0.85);
        camera.updateProjectionMatrix();
        break;
      case "华北地区":
        camera.position.set(1.24, 1.61, -3.79);
        controls.current.target = new THREE.Vector3(0.62, 0.51, -2.69);
        camera.updateProjectionMatrix();
        break;
      case "华东地区":
        camera.position.set(3.44, 0.99, 0.38);

        controls.current.target = new THREE.Vector3(1.65, 0.16, -1.2);
        camera.updateProjectionMatrix();
        break;
      case "华南地区":
        camera.position.set(0.38, 1.09, 2.56);
        controls.current.target = new THREE.Vector3(0.83, -0.53, 0.84);
        camera.updateProjectionMatrix();
        break;
      default:
        break;
    }
  }, [area]);
  return (
    <>
      {/* <Perf position="top-left"/> */}
      <OrbitControls
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
      />
      {/* <OrbitControls ref={controls} makeDefault={true} /> */}
    </>
  );
}

export default SbpkBaseEnv;
