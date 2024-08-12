/*
 * @Author: FMC
 * @Date: 2024-08-12 19:58:41
 * @LastEditors: FMC
 * @LastEditTime: 2024-08-12 23:19:51
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

import { Suspense} from "react";
import { useGLTF} from "@react-three/drei";
import SbpkModelAnimations from "../sbpk-model-animations/sbpk-model-animations";
// LightCircleMaterial

function Model(props) {
  const { nodes } = useGLTF("/model/东方明珠.glb");
  return (
    <>
      <group {...props}>
        <mesh
          scale={[0.02, 0.02, 0.02]}
          geometry={nodes.Sphere011_Material002_0.geometry}
        >
          <meshBasicMaterial
            color={[0.188, 0.992, 0.992].map((item) => item * 1.333)}
            toneMapped={false}
          ></meshBasicMaterial>
        </mesh>
        <SbpkModelAnimations scale={[0.2, 0.2, 0.2]} position-y={0.01}/>
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
