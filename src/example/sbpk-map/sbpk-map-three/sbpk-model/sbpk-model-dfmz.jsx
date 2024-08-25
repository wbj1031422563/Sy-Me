/*
 * @Author: FMC
 * @Date: 2024-08-12 19:58:41
 * @LastEditors: FMC
 * @LastEditTime: 2024-08-25 11:27:15
 * @FilePath: \fmc-personal-blog\src\example\sbpk-map\sbpk-map-three\sbpk-model\sbpk-model-dfmz.jsx
 * @Description:
 */
/*
 * @Author: FMC
 * @Date: 2024-08-04 18:47:04
 * @LastEditors: FMC
 * @LastEditTime: 2024-08-12 23:02:25
 * @FilePath: \fmc-personal-blog\src\example\sbpk-map\sbpk-map-three\sbpk-model\sbpk-model-dfmz.jsx
 * @Description:
 */

import { Suspense } from "react";
import { useGLTF } from "@react-three/drei";
import SbpkModelAnimations from "../sbpk-model-animations/sbpk-model-animations";
import SbpkMark from "../sbpk-mark/sbpk-mark";
// LightCircleMaterial

function Model(props) {
  const { nodes } = useGLTF("/model/东方明珠3.glb");
  return (
    <>
      <group {...props}>
        <group scale={[0.015, 0.015, 0.015]}>
          <mesh geometry={nodes.球体.geometry} material={nodes.球体.material}>
            <meshBasicMaterial
              color={"#2589c2"}
              transparent={true}
              opacity={0.8}
              // wireframe={true}
            ></meshBasicMaterial>
          </mesh>
          <mesh geometry={nodes.柱体.geometry} material={nodes.柱体.material}>
            <meshBasicMaterial
              color={"#094f7d"}
              transparent={true}
              opacity={0.9}
              // wireframe={true}
            ></meshBasicMaterial>
          </mesh>
        </group>
        <SbpkMark
          scale={[0.1, 0.1, 0.1]}
          position-y={0.7}
          type={"2"}
          text={"上海"}
        ></SbpkMark>
        <SbpkModelAnimations scale={[0.1, 0.1, 0.1]} position-y={0.01} />
      </group>
    </>
  );
}
function SbpkModelDfmz(props) {
  return (
    <Suspense>
      <Model {...props} />
    </Suspense>
  );
}
export default SbpkModelDfmz;
