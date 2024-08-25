import { Float, Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import "./sbpk-mark.less";
/*
 * @Author: FMC
 * @Date: 2024-08-13 22:56:41
 * @LastEditors: FMC
 * @LastEditTime: 2024-08-25 11:44:21
 * @FilePath: \fmc-personal-blog\src\example\sbpk-map\sbpk-map-three\sbpk-mark\sbpk-mark.jsx
 * @Description:
 */
function SbpkMark({ text, type = "1", children, ...props }) {
  const ref = useRef();
  const ref2 = useRef();
  const [isOccluded, setIsOccluded] = useState();
  const [isInRange, setInRange] = useState();
  const isVisible = isInRange && !isOccluded;
  const vec = new THREE.Vector3();
  useFrame((state) => {
    if (ref.current) {
      const cameraPos = state.camera.position;
      const refPos = ref.current.getWorldPosition(vec);
      const range = cameraPos.distanceTo(refPos) <= 8;
      if (range !== isInRange) setInRange(range);

      
      ref.current.lookAt(new THREE.Vector3(cameraPos.x,0,cameraPos.z));
    }
  });
  useEffect(() => {
    if (ref.current) {
      console.log("ref.current", ref.current);
    }
  }, []);
  return (
    // <Float speed={1} floatIntensity={0.5}>
      <group ref={ref}>
        <Html
          ref={ref2}
          transform
          occlude
          onOcclude={setIsOccluded}
          style={{
            transition: "all 0.2s",
            opacity: isVisible ? 1 : 0,
            transform: `scale(${isVisible ? 1 : 0.25})`,
          }}
          {...props}
        >
          {/* {children} */}
          {type == "1" && (
            <div className="sbpk-mark">
              <span></span>
              <span></span>
              <span></span>
              <span></span>
              <div className="content">
                <p>{text}</p>
              </div>
            </div>
          )}
          {type == "2" && (
            <div className="sbpk-mark-2">
              {text}
            </div>
          )}
        </Html>
      </group>
    // </Float>
  );
}
export default SbpkMark;
