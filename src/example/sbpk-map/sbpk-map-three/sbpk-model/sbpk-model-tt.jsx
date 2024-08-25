/*
 * @Author: FMC
 * @Date: 2024-08-04 18:47:04
 * @LastEditors: FMC
 * @LastEditTime: 2024-08-25 16:16:20
 * @FilePath: \fmc-personal-blog\src\example\sbpk-map\sbpk-map-three\sbpk-model\sbpk-model-tt.jsx
 * @Description:
 */

import { useLoader } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { Suspense, useEffect } from "react";
import { useGLTF } from "@react-three/drei";
import SbpkModelAnimations from "../sbpk-model-animations/sbpk-model-animations";
import * as THREE from "three";
import SbpkMark from "../sbpk-mark/sbpk-mark";
function Model(props) {
  //   const model = useLoader(GLTFLoader, "/model/东方明珠.glb")
  const { nodes } = useGLTF("/model/天坛分割.glb");
  //
  return (
    <>
      <group {...props}>
        {/* <mesh
          scale={[0.01, 0.01, 0.01].map((item) => item * 0.8)}
          geometry={nodes.Object_2.geometry}
        >
          <meshBasicMaterial
            color={[0.188, 0.992, 0.992].map((item) => item * 1.1)}
          />
        </mesh> */}
        <group scale={[0.007, 0.007, 0.007].map((item) => item * 0.8)}>
          <mesh geometry={nodes.Object_2.geometry}>
            <meshBasicMaterial
              color={"#2589c2"}
              transparent={true}
              opacity={0.8}
            ></meshBasicMaterial>
          </mesh>
          <mesh geometry={nodes.屋顶.geometry}>
            <meshBasicMaterial
              color={"#094f7d"}
              transparent={true}
              opacity={1.0}
            ></meshBasicMaterial>
          </mesh>
        </group>
        {/* <SbpkMark scale={[0.1,0.1,0.1]} type={"2"} position-y={0.4} text={"北京"}>
        </SbpkMark> */}
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
function SbpkModelTt(props) {
  return (
    <Suspense>
      <Model {...props} />
    </Suspense>
  );
}
export default SbpkModelTt;
