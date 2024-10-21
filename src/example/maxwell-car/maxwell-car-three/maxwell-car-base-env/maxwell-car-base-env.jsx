/*
 * @Author: FMC
 * @Date: 2024-06-23 09:58:48
 * @LastEditors: FMC
 * @LastEditTime: 2024-09-27 22:13:22
 * @FilePath: \fmc-personal-blog\src\example\maxwell-car\maxwell-car-three\maxwell-car-base-env\maxwell-car-base-env.jsx
 * @Description:基础环境
 */
import { Environment, Lightformer, OrbitControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import TWEEN from "@tweenjs/tween.js";
import { useEffect, useRef } from "react";
import * as THREE from "three";
function MaxWellCarBaeEnv() {
  const sceneType = "动态道路";
  const controls = useRef(null);
  const geo = new THREE.BoxGeometry();
  geo.translate(0, 2, 0);
  const r = useRef(null);
  const state = useThree();
  useFrame((state) => {
    const { camera } = state;
    TWEEN.update();
    // console.log('stsjhakj',clock.getDelta())
    // console.log("camera", camera);
    // // const { target, matrix } = camera;
    // console.log("target", controls.current.target);
    // console.log("matrix", matrix);
  });
  useEffect(() => {
    const { camera } = state;
    if (controls.current) {
      if (sceneType === "静态展厅") {
        camera.position.set(1.43, 2.12, 8.59);
        controls.current.target = new THREE.Vector3(1.37, 0.52, -0.1);
      }
    }
  }, []);
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
      {/* <group ref={r}>
        <mesh geometry={geo}>
          <meshBasicMaterial color={"red"}></meshBasicMaterial>
        </mesh>
      </group> */}
      <OrbitControls ref={controls} makeDefault={true} />
      {/* <OrbitControls enablePan={false} enableZoom={false} minPolarAngle={Math.PI / 2.2} maxPolarAngle={Math.PI / 2.2} /> */}
      {/* <Environment files="/envMap/venice_sunset_1k.hdr"></Environment> */}
      {sceneType === "动态道路" && (
        <Environment files="/envMap/abstract-lighting-ray-room-style-01_2K_f478fdd1-243a-4cc8-b454-0f522f1afb6b.exr" background={false} intensity={0.1}></Environment>
      )}
      {sceneType === "静态展厅" && (
        <Environment resolution={512}>
          {/* Ceiling */}
          <Lightformer
            intensity={2}
            rotation-x={Math.PI / 2}
            position={[0, 4, -9]}
            scale={[10, 1, 1]}
          />
          <Lightformer
            intensity={2}
            rotation-x={Math.PI / 2}
            position={[0, 4, -6]}
            scale={[10, 1, 1]}
          />
          <Lightformer
            intensity={2}
            rotation-x={Math.PI / 2}
            position={[0, 4, -3]}
            scale={[10, 1, 1]}
          />
          <Lightformer
            intensity={2}
            rotation-x={Math.PI / 2}
            position={[0, 4, 0]}
            scale={[10, 4.5, 4.5]}
          />
          <Lightformer
            intensity={2}
            rotation-x={Math.PI / 2}
            position={[0, 4, 3]}
            scale={[10, 1, 1]}
          />
          <Lightformer
            intensity={2}
            rotation-x={Math.PI / 2}
            position={[0, 4, 6]}
            scale={[10, 1, 1]}
          />
          <Lightformer
            intensity={2}
            rotation-x={Math.PI / 2}
            position={[0, 4, 9]}
            scale={[10, 1, 1]}
          />
          {/* Sides */}
          <Lightformer
            intensity={2}
            color="#4a884f"
            rotation-y={Math.PI / 2}
            position={[-50, 2, 0]}
            scale={[100, 2, 1]}
          />
          <Lightformer
            intensity={2}
            color="#4a884f"
            rotation-y={-Math.PI / 2}
            position={[50, 2, 0]}
            scale={[100, 2, 1]}
          />
          {/* Key */}
          <Lightformer
            form="ring"
            color="#4a884f"
            intensity={10}
            scale={2}
            position={[10, 5, 10]}
            onUpdate={(self) => self.lookAt(0, 0, 0)}
          />
        </Environment>
      )}
    </>
  );
}

export default MaxWellCarBaeEnv;
