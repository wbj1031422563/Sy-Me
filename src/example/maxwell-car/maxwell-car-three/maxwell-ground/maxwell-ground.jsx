import { Helper } from "@react-three/drei";
import { useEffect, useRef } from "react";
import * as THREE from "three";
/*
 * @Author: FMC
 * @Date: 2024-08-29 21:05:01
 * @LastEditors: FMC
 * @LastEditTime: 2024-08-29 21:19:45
 * @FilePath: \fmc-personal-blog\src\example\maxwell-car\maxwell-car-three\maxwell-ground\maxwell-ground.jsx
 * @Description:
 */
function MaxWellGround() {
  const ref = useRef(null);
  useEffect(()=>{
    const grid=ref.current;
    grid.material.opacity = 0.2;
    grid.material.depthWrite = false;
    grid.material.transparent = true;
  },[])
  return (
    <gridHelper ref={ref} args={[20, 40, 0xffffff, 0xffffff]}></gridHelper>
    // <Helper  ref={ref} type={THREE.GridHelper} args={[20, 40, 0xffffff, 0xffffff]}></Helper>
  );
}
export default MaxWellGround;
