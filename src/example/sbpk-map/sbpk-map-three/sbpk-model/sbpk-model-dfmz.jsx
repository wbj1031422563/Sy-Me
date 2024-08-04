/*
 * @Author: FMC
 * @Date: 2024-08-04 18:47:04
 * @LastEditors: FMC
 * @LastEditTime: 2024-08-04 19:14:11
 * @FilePath: \fmc-personal-blog\src\example\sbpk-map\sbpk-map-three\sbpk-model\sbpk-model-dfmz.jsx
 * @Description:
 */

import { useLoader } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { Suspense, useEffect } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
function Model(props) {
  //   const model = useLoader(GLTFLoader, "/model/东方明珠.glb")
  const { nodes } = useGLTF("/model/东方明珠.glb");
  // console.log('加载东方之门');
  return (
    <>
      <group {...props} scale={[0.02, 0.02, 0.02]}>
        <mesh geometry={nodes.Sphere011_Material002_0.geometry}>
          <meshBasicMaterial />
        </mesh>
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
function SbpkModelDfmz(props) {
  return (
    <Suspense>
      <Model {...props}/>
    </Suspense>
  );
}
export default SbpkModelDfmz;
