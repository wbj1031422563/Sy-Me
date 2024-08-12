/*
 * @Author: FMC
 * @Date: 2024-08-04 18:47:04
 * @LastEditors: FMC
 * @LastEditTime: 2024-08-12 23:24:39
 * @FilePath: \fmc-personal-blog\src\example\sbpk-map\sbpk-map-three\sbpk-model\sbpk-model-gz.jsx
 * @Description:
 */
import SbpkModelAnimations from "../sbpk-model-animations/sbpk-model-animations";

import { useLoader } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { Suspense, useEffect } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
function Model(props) {
  //   const model = useLoader(GLTFLoader, "/model/东方明珠.glb")
  const { nodes } = useGLTF("/model/广州.glb");
  // console.log("加载东方之门");

  return (
    <>
      <group {...props}>
        <group scale={[0.01, 0.01, 0.01]}>
          <mesh   geometry={nodes.Object_2.geometry}>
            <meshBasicMaterial
              color={[0.188, 0.992, 0.992].map((item) => item * 1.3)}
              toneMapped={false}
            ></meshBasicMaterial>
          </mesh>
          <mesh  geometry={nodes.Object_3.geometry}>
            <meshBasicMaterial
              color={[0.188, 0.992, 0.992].map((item) => item * 1.3)}
              toneMapped={false}
            ></meshBasicMaterial>
          </mesh>
          <mesh  geometry={nodes.Object_4.geometry}>
            <meshBasicMaterial
              color={[0.188, 0.992, 0.992].map((item) => item * 1.3)}
              toneMapped={false}
            ></meshBasicMaterial>
          </mesh>
        </group>
        <SbpkModelAnimations  scale={[0.2, 0.2, 0.2]} position-y={0.03}/>
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
