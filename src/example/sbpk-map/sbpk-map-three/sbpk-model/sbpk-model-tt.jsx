/*
 * @Author: FMC
 * @Date: 2024-08-04 18:47:04
 * @LastEditors: FMC
 * @LastEditTime: 2024-08-12 23:25:34
 * @FilePath: \fmc-personal-blog\src\example\sbpk-map\sbpk-map-three\sbpk-model\sbpk-model-tt.jsx
 * @Description:
 */

import { useLoader } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { Suspense, useEffect } from "react";
import { useGLTF } from "@react-three/drei";
import SbpkModelAnimations from "../sbpk-model-animations/sbpk-model-animations";
import * as THREE from "three";
function Model(props) {
  //   const model = useLoader(GLTFLoader, "/model/东方明珠.glb")
  const { nodes } = useGLTF("/model/天坛1.glb");
//
  return (
    <>
      <group {...props} >
        <mesh
           scale={[0.01, 0.01, 0.01].map(item=>item*0.8)}
          geometry={nodes.Object_2.geometry}
        >
           <meshBasicMaterial color={[0.188, 0.992, 0.992].map((item) => item * 1.333)}/>
        </mesh>
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
function SbpkModelTt(props) {
  return (
    <Suspense>
      <Model {...props} />
    </Suspense>
  );
}
export default SbpkModelTt;
