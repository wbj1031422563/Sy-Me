import { Html, Instance } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import * as THREE from "three";
import "./sbpk-mark.less";
/*
 * @Author: FMC
 * @Date: 2024-08-13 22:56:41
 * @LastEditors: FMC
 * @LastEditTime: 2024-09-08 10:40:02
 * @FilePath: \fmc-personal-blog\src\example\sbpk-map\sbpk-map-three\sbpk-mark\sbpk-mark.jsx
 * @Description:
 */
function SbpkMark({ text, type = "1", children, ...props }) {
  const ref = useRef();
  const [isInRange, setInRange] = useState();
  const isVisible = isInRange;
  const vec = new THREE.Vector3();
  useFrame((state) => {
    if (ref.current) {
      const cameraPos = state.camera.position;
      const refPos = ref.current.getWorldPosition(vec);
      const range = cameraPos.distanceTo(refPos) <= 5;
      if (range !== isInRange) setInRange(range);
      ref.current.lookAt(new THREE.Vector3(cameraPos.x, refPos.y, cameraPos.z));
    }
  });
  // useEffect(() => {
  //   if (ref.current) {
  //     console.log("ref.current", ref.current);
  //   }
  // }, []);
  return (
    // <Float speed={1} floatIntensity={0.5}>
    <group {...props}>
      <Instance ref={ref}>
        {/* <mesh scale={[0.1,0.1,0.1]}> 
          <boxGeometry></boxGeometry>
          <meshBasicMaterial></meshBasicMaterial>
        </mesh> */}
        <Html
          transform
          style={{
            transition: "all 0.2s",
            opacity: isVisible ? 1 : 0,
            transform: `scale(${isVisible ? 1 : 0.25})`,
          }}
        >
          <div className="sbpk-mark-2">{text}</div>
        </Html>
      </Instance>
    </group>
    // </Float>
  );
}
export default SbpkMark;
