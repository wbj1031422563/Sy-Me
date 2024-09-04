import { Helper } from "@react-three/drei";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { MeshReflectorMaterial } from "@react-three/drei";
/*
 * @Author: FMC
 * @Date: 2024-08-29 21:05:01
 * @LastEditors: FMC
 * @LastEditTime: 2024-09-04 21:02:24
 * @FilePath: \fmc-personal-blog\src\example\maxwell-car\maxwell-car-three\maxwell-ground\maxwell-ground.jsx
 * @Description:
 */
function MaxWellGround() {
  const ref = useRef(null);
  // useEffect(()=>{
  //   const grid=ref.current;
  //   grid.material.opacity = 0.2;
  //   grid.material.depthWrite = false;
  //   grid.material.transparent = true;
  // },[])
  return (
    // <gridHelper ref={ref} args={[20, 40, 0xffffff, 0xffffff]}></gridHelper>
    // <Helper  ref={ref} type={THREE.GridHelper} args={[20, 40, 0xffffff, 0xffffff]}></Helper>
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[50, 50]} />
      <MeshReflectorMaterial
        blur={[600, 200]}
        resolution={1024}
        mixBlur={1}
        mixStrength={80}
        roughness={1}
        depthScale={1.2}
        minDepthThreshold={0.4}
        maxDepthThreshold={1.4}
        color="#111111"
        metalness={0.5}
      />
    </mesh>
  );
}
export default MaxWellGround;
