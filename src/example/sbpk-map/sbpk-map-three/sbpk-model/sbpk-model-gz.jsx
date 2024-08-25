/*
 * @Author: FMC
 * @Date: 2024-08-04 18:47:04
 * @LastEditors: FMC
 * @LastEditTime: 2024-08-25 11:11:30
 * @FilePath: \fmc-personal-blog\src\example\sbpk-map\sbpk-map-three\sbpk-model\sbpk-model-gz.jsx
 * @Description:
 */
import SbpkModelAnimations from "../sbpk-model-animations/sbpk-model-animations";

import { useLoader } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { Suspense, useEffect } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import SbpkMark from "../sbpk-mark/sbpk-mark";
function Model(props) {
  //   const model = useLoader(GLTFLoader, "/model/东方明珠.glb")
  const { nodes } = useGLTF("/model/广州.glb");
  // console.log("加载东方之门");

  return (
    <>
      <group {...props}>
        <group scale={[0.008, 0.008, 0.008]}>
          <mesh geometry={nodes.Object_2.geometry}>
            <meshBasicMaterial
              color={"#2589c2"}
              transparent={true}
              opacity={1.0}
            ></meshBasicMaterial>
          </mesh>
          <mesh geometry={nodes.Object_3.geometry}>
            <meshBasicMaterial
              color={"#094f7d"}
              transparent={true}
              opacity={0.8}
            ></meshBasicMaterial>
          </mesh>
          <mesh geometry={nodes.Object_4.geometry}>
            <meshBasicMaterial
              color={"#2589c2"}
              transparent={true}
              opacity={0.5}
            ></meshBasicMaterial>
          </mesh>
        </group>
        <SbpkMark scale={[0.1,0.1,0.1]} type={"2"} position-y={0.5} text={"广州"}>
        </SbpkMark>
        <SbpkModelAnimations scale={[0.1, 0.1, 0.1]} position-y={0.03} />
      </group>
    </>
  );
}
// function Loading(){
//   return(<>
//     <mesh position={[1,1,0]} >
//       <boxGeometry args={[0.8,1.35,0.8,4,4,4]}/>
//       <meshBasicMaterial color={'red'} wireframe={true} />
//     </mesh>
//   </>)
// }
function SbpkModelGz(props) {
  return (
    <Suspense>
      <Model {...props} />
    </Suspense>
  );
}
export default SbpkModelGz;
